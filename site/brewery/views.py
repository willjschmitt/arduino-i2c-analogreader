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
global_timeseries_buffer = TimeSeriesBuffer()

class TimeSeriesNewHandler(tornado.web.RequestHandler):
    def post(self):
        newDataPoint = {
            #'id': str(uuid.uuid4()),
            'recipe_instance': RecipeInstance.objects.get(pk=1),
            'sensor': AssetSensor.objects.get(pk=1),
            'time': self.get_body_argument("time", default=None, strip=False),
            'value':self.get_body_argument("value", default=None, strip=False),
        }
        print newDataPoint
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
    global_timeseries_buffer.new_dataPoints([newDataPoint])

class TimeSeriesSubscribeHandler(tornado.web.RequestHandler):
    @gen.coroutine
    def post(self):
        cursor = self.get_argument("cursor", None)
        # Save the future returned by wait_for_messages so we can cancel
        # it in wait_for_messages
        self.future = global_timeseries_buffer.wait_for_data(cursor=cursor)
        dataPoints = yield self.future
        if self.request.connection.stream.closed():
            return
        self.write(dict(dataPoints=dataPoints))

    def on_connection_close(self):
        global_timeseries_buffer.cancel_wait(self.future)