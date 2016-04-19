'''
Created on Apr 14, 2016

@author: William
'''

from tornado.concurrent import Future
from tornado.httpclient import AsyncHTTPClient
from tornado import gen
import json

class overridableVariable(object):
    '''
    classdocs
    '''


    def __init__(self, idSensor,idSensorOverride):
        '''
        Constructor
        '''
        self.value = None
        self.idSensor = idSensor
        self.idSensorOverride = idSensorOverride
        self.overridden = False
        
        #TODO: pass these in programmatically
        self.dataSubscribeService = "http://localhost:8888/live/timeseries/subscribe/"
        self.recipeInstance = 1
        
        self.watchRemoteVarOverride()
    
    def subscribeWatch(self,id):
        print "hello"
        http_client = AsyncHTTPClient()
        my_future = Future()
        fetch_future = http_client.fetch(self.dataSubscribeService,method="POST",body=json.dumps({'recipe_instance':self.recipeInstance,'sensor':id}))
        fetch_future.add_done_callback(
            lambda f: my_future.set_result(f.result()))
        print "goodbye"
        return my_future
    
    @gen.coroutine
    def watchRemoteVar(self):
        print "hi"
        self.value = yield self.subscribeWatch(self.idSensor)
        print "bye"
        print self.value
        
    @gen.coroutine
    def watchRemoteVarOverride(self):
        print "hii"
        self.overridden = yield self.subscribeWatch(self.idSensorOverride)
        if self.overridden: self.watchRemoteVar()
        print "byeee"
        print self.overridden