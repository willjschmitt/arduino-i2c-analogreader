import tornado.escape
import tornado.ioloop
import tornado.web

from tornado.concurrent import Future
from tornado import gen

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

from django.db.models.signals import post_save
from django.dispatch import receiver
from models import Brewery
from models import Asset,AssetSensor
from models import Recipe,RecipeInstance
from models import TimeSeriesDataPoint

from django.db.models import ForeignKey

import logging
import random
import time
import uuid

# Create your views here.
class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html",brewery=Brewery.objects.get(pk=1))

class TimeSeriesBuffer(object):
    def __init__(self):
        self.waiters = set()
        self.cache = []
        self.cache_size = 200

    def wait_for_data(self, cursor=None):
        # Construct a Future to return to our caller.  This allows
        # wait_for_messages to be yielded from a coroutine even though
        # it is not a coroutine itself.  We will set the result of the
        # Future when results are available.
        result_future = Future()
        if cursor:
            new_count = 0
            for msg in reversed(self.cache):
                if msg["id"] == int(cursor):
                    break
                new_count += 1
            if new_count:
                result_future.set_result(self.cache[-new_count:])
                return result_future
        self.waiters.add(result_future)
        return result_future

    def cancel_wait(self, future):
        self.waiters.remove(future)
        # Set an empty result to unblock any coroutines waiting.
        future.set_result([])

    def new_dataPoints(self, messages):
        logging.info("Sending new message to %r listeners", len(self.waiters))
        for future in self.waiters:
            future.set_result(messages)
        self.waiters = set()
        self.cache.extend(messages)
        if len(self.cache) > self.cache_size:
            self.cache = self.cache[-self.cache_size:]

# Making this a non-singleton is left as an exercise for the reader.
global_timeseries_buffer = {}
def get_timeseries_buffer(*args):    
    # iterate through arguments as a nest of buffer dicts
    timeseries_buffer = global_timeseries_buffer
    for arg in args[:-1]:
        #create the buffer if it doesnt exist
        if arg not in timeseries_buffer:
            timeseries_buffer[arg] = {}
        timeseries_buffer = timeseries_buffer[arg]
    # the last element should now be an actual buffer
    if args[-1] not in timeseries_buffer:
        logging.info('Creating new buffer for {0}'.format(args))
        timeseries_buffer[args[-1]] = TimeSeriesBuffer()
    timeseries_buffer = timeseries_buffer[args[-1]]
    
    return timeseries_buffer

class TimeSeriesNewHandler(tornado.web.RequestHandler):
    def post(self):
        fields = ('recipe_instance','sensor','time','value',)
        newDataPoint = {}
        for fieldName in fields:
            field = TimeSeriesDataPoint._meta.get_field(fieldName)
            if field.is_relation:
                print fieldName, self.get_argument(fieldName)
                newDataPoint[fieldName] = field.related_model.objects.get(pk=self.get_argument(fieldName))
            else:
                newDataPoint[fieldName] = self.get_body_argument(fieldName)
        TimeSeriesDataPoint(**newDataPoint).save()

@receiver(post_save, sender=TimeSeriesDataPoint)
def my_handler(sender, instance, **kwargs):
    fields = ('id','recipe_instance','sensor','time','value',)
    newDataPoint = {}
    for fieldName in fields:
        field = instance._meta.get_field(fieldName)
        if isinstance(field, ForeignKey):
            newDataPoint[fieldName] = getattr(instance,fieldName).pk
        else:
            newDataPoint[fieldName] = getattr(instance,fieldName)
    buffer_instance = get_timeseries_buffer(instance.recipe_instance.pk,instance.sensor.pk)
    logging.info("Posting to {0} : {1},{2}".format(buffer_instance,instance.recipe_instance.pk,instance.sensor.pk))
    buffer_instance.new_dataPoints([newDataPoint])

class TimeSeriesSubscribeHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        cursor = self.get_argument("cursor", None)
        
        #information about what we are subscribing to
        self.recipe_instance = long(self.get_body_argument("recipe_instance", None))
        self.sensor = long(self.get_body_argument("sensor", None))        
        self.buffer_instance = get_timeseries_buffer(self.recipe_instance,self.sensor)
        logging.info("Subscribing to {0} : {1},{2}".format(self.buffer_instance,self.recipe_instance,self.sensor))
        
        # Save the future returned by wait_for_messages so we can cancel
        # it in wait_for_messages
        self.future = self.buffer_instance.wait_for_data(cursor=cursor)
        dataPoints = yield self.future
        if self.request.connection.stream.closed():
            return
        self.write(dict(dataPoints=dataPoints))

    def on_connection_close(self):
        self.buffer_instance.cancel_wait(self.future)