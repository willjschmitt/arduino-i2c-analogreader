'''
Created on Apr 14, 2016

@author: William
'''

from tornado.concurrent import Future
from tornado.httpclient import AsyncHTTPClient
from tornado.websocket import websocket_connect
from tornado import gen
import json

class overridableVariable(object):
    '''
    classdocs
    '''
    websocket = websocket_connect("ws://localhost:8888/live/timeseries/socket/",on_message_callback=overridableVariable.on_message)
    subscribers = {}

    def __init__(self, idSensor,idSensorOverride,recipeInstance):
        '''
        Constructor
        '''
        self.value = None
        self.overridden = False
        
        #add new subscription to class vars
        if ((idSensor,recipeInstance)) not in self.subscribers:
            self.subscribers[(idSensor,recipeInstance)] = (self,'value')
            self.websocket.write_message(json.dumps({'recipe_instance':recipeInstance,'sensor':idSensor,'subscribe':True}))
        
        if ((idSensorOverride,recipeInstance)) not in self.subscribers:
            self.subscribers[(idSensor,recipeInstance)] = (self,'override')
            self.websocket.write_message(json.dumps({'recipe_instance':recipeInstance,'sensor':idSensorOverride,'subscribe':True}))

    @classmethod
    def on_message(cls,response):
        data = json.loads(response)
        subscriber = cls.subscribers((data['sensor'],data['recipeInstance']))
        if subscriber[1] == 'value':
            subscriber[0].value = data['value']
        elif subscriber[1] == 'override':
            subscriber[0].overridden = data['value']