import tornado.escape
import tornado.ioloop
import tornado.web
import tornado.websocket
from tornado.websocket import WebSocketClosedError

from tornado.concurrent import Future
from tornado import gen

from django.core.wsgi import get_wsgi_application
from django.core.exceptions import ObjectDoesNotExist
application = get_wsgi_application()

from django.db.models.signals import post_save
from django.dispatch import receiver
from models import Brewery
from models import Asset,AssetSensor
from models import Recipe,RecipeInstance
from models import TimeSeriesDataPoint

from django.db.models import ForeignKey

import logging

# Create your views here.
class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html",brewery=Brewery.objects.get(pk=1))



class TimeSeriesSocketHandler(tornado.websocket.WebSocketHandler):
    waiters = set()
    cache = []
    cache_size = 200
    
    subscriptions = {}

    def get_compression_options(self):
        # Non-None enables compression with default options.
        return {}

    '''
    Core websocket functions
    '''
    def open(self):
        logging.info("New websocket connection incomming {}".format(self))
        TimeSeriesSocketHandler.waiters.add(self)
        logging.info("returning {}".format(self))

    def on_close(self):
        TimeSeriesSocketHandler.waiters.remove(self)
        for subscriptionName, subscription in TimeSeriesSocketHandler.subscriptions.iteritems():
            try: subscription.remove(self)
            except KeyError: pass
            
    def on_message(self, message):
        parsedMessage = tornado.escape.json_decode(message)
        logging.debug('parsed message is {}'.format(parsedMessage))
        #we are subscribing to a 
        if 'subscribe' in parsedMessage:
            self.subscribe(parsedMessage)
        else:
            self.newData(parsedMessage)
        
    '''
    Message helper functions
    '''      
    def subscribe(self,parsedMessage):
        logging.debug('Subscribing')
        if 'sensor' not in parsedMessage:
            parsedMessage['sensor'] = AssetSensor.objects.get(sensor=parsedMessage['sensor'],asset=1)#TODO: programatically get asset
            
        key = (parsedMessage['recipe_instance'],parsedMessage['sensor'])
        if key not in TimeSeriesSocketHandler.subscriptions: TimeSeriesSocketHandler.subscriptions[key] = set()
        if self not in TimeSeriesSocketHandler.subscriptions[key]: #protect against double subscriptions
            TimeSeriesSocketHandler.subscriptions[key].add(self)
    
    def newData(self,parsedMessage):
        logging.debug('New data')
        fields = ('recipe_instance','sensor','time','value',)
        newDataPoint = {}
        for fieldName in fields:
            field = TimeSeriesDataPoint._meta.get_field(fieldName)
            if field.is_relation:
                newDataPoint[fieldName] = field.related_model.objects.get(pk=parsedMessage[fieldName])
            else:
                newDataPoint[fieldName] = parsedMessage[fieldName]
        TimeSeriesDataPoint(**newDataPoint).save()
        
    '''
    Cache handling helper functions
    '''        
    @classmethod
    def update_cache(cls, chat):
        cls.cache.append(chat)
        if len(cls.cache) > cls.cache_size:
            cls.cache = cls.cache[-cls.cache_size:]
     
    @classmethod
    def send_updates(cls, newDataPoint):
        logging.info("sending message to %d waiters", len(cls.waiters))
        key = (newDataPoint['recipe_instance'],newDataPoint['sensor'])
        if key in cls.subscriptions:
            for waiter in cls.subscriptions[key]:
                try:
                    waiter.write_message(newDataPoint)
                except:
                    logging.error("Error sending message", exc_info=True)
        
@receiver(post_save, sender=TimeSeriesDataPoint)
def timeSeriesWatcher(sender, instance, **kwargs):
    fields = ('id','recipe_instance','sensor','time','value',)
    newDataPoint = {}
    for fieldName in fields:
        field = instance._meta.get_field(fieldName)
        if isinstance(field, ForeignKey):
            newDataPoint[fieldName] = getattr(instance,fieldName).pk
        else:
            newDataPoint[fieldName] = getattr(instance,fieldName)
    TimeSeriesSocketHandler.update_cache(newDataPoint)
    TimeSeriesSocketHandler.send_updates(newDataPoint)

class TimeSeriesNewHandler(tornado.web.RequestHandler):
    def post(self):
        fields = ('recipe_instance','sensor','time','value',)
        newDataPoint = {}
        for fieldName in fields:
            field = TimeSeriesDataPoint._meta.get_field(fieldName)
            if field.is_relation:
                newDataPoint[fieldName] = field.related_model.objects.get(pk=self.get_argument(fieldName))
            else:
                newDataPoint[fieldName] = self.get_body_argument(fieldName)
                if newDataPoint[fieldName] == 'true': newDataPoint[fieldName] = True
                if newDataPoint[fieldName] == 'false': newDataPoint[fieldName] = False
        logging.debug(newDataPoint)
        TimeSeriesDataPoint(**newDataPoint).save()

class TimeSeriesIdentifyHandler(tornado.web.RequestHandler):
    def post(self):
        try:#see if we can ge an existing AssetSensor
            sensor = AssetSensor.objects.get(name=self.get_argument('name'),asset=Asset.objects.get(id=1))#TODO: programatically get asset
        except ObjectDoesNotExist as e: #otherwise create one for recording data
            logging.debug('Creating new asset sensor {} for asset {}'.format(self.get_argument('name'),1))
            sensor = AssetSensor(name=self.get_argument('name'),asset=Asset.objects.get(id=1))#TODO: programatically get asset
            sensor.save()
        self.write({'sensor':sensor.pk})
        self.finish()