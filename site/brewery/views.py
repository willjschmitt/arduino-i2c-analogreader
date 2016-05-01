import tornado.escape
import tornado.ioloop
import tornado.web
import tornado.websocket

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

    def open(self):
        TimeSeriesSocketHandler.waiters.add(self)

    def on_close(self):
        TimeSeriesSocketHandler.waiters.remove(self)

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

    def on_message(self, message):
        logging.info("got message %r", message)
        parsed = tornado.escape.json_decode(message)
        if 'subscribe' in parsed:
            if 'sensor' not in parsed:
                parsed['sensor'] = AssetSensor.objects.get(sensor=parsed['sensor'],asset=1)#TODO: programatically get asset
                
            key = (parsed['recipe_instance'],parsed['sensor'])
            if key not in TimeSeriesSocketHandler.subscriptions: TimeSeriesSocketHandler.subscriptions[key] = []
            if self not in TimeSeriesSocketHandler.subscriptions[key]: #protect against double subscriptions
                TimeSeriesSocketHandler.subscriptions[key].append(self)
        else:
            fields = ('recipe_instance','sensor','time','value',)
            newDataPoint = {}
            for fieldName in fields:
                field = TimeSeriesDataPoint._meta.get_field(fieldName)
                if field.is_relation:
                    newDataPoint[fieldName] = field.related_model.objects.get(pk=parsed[fieldName])
                else:
                    newDataPoint[fieldName] = parsed[fieldName]
            TimeSeriesDataPoint(**newDataPoint).save()
        
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