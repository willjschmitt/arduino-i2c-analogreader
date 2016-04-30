'''
Created on Apr 14, 2016

@author: William
'''

from tornado.concurrent import Future
from tornado.httpclient import AsyncHTTPClient
from tornado.websocket import websocket_connect
from tornado import gen
import json
import requests

from controls.settings import host

class overridableVariable(object):
    '''
    classdocs
    '''

    def __init__(self, sensorName,recipeInstance):
        '''
        Constructor
        '''
        self.value = None
        self.overridden = False
        
        print(host)
        self.dataIdentifyService = "http:" + host + "/live/timeseries/identify/"
        
        #add new subscription to class vars
        self.subscribe(sensorName, recipeInstance, 'value')
        self.subscribe(sensorName+"Override", recipeInstance, 'override')
            
    def subscribe(self,name,recipeInstance,type='value'):
        if ((name,recipeInstance)) not in self.subscribers:
            r = requests.post(self.dataIdentifyService,data={'recipe_instance':recipeInstance,'name':name})
            idSensor = r.json()['sensor']
            self.sensorMap['name'] = r.json()['sensor']
            self.subscribers[(idSensor,recipeInstance)] = (self,type)
            self.websocket.write_message(json.dumps({'recipe_instance':recipeInstance,'sensor':idSensor,'subscribe':True}))
        
    @classmethod
    def on_message(cls,response):
        data = json.loads(response)
        subscriber = cls.subscribers((data['sensor'],data['recipeInstance']))
        if subscriber[1] == 'value':
            subscriber[0].value = data['value']
        elif subscriber[1] == 'override':
            subscriber[0].overridden = data['value']
            
    websocket = websocket_connect("ws:" + host + "/live/timeseries/socket/",on_message_callback=on_message)
    subscribers = {}