'''
Created on Apr 14, 2016

@author: William
'''

from tornado.websocket import websocket_connect
from tornado.ioloop import IOLoop
from tornado import gen

import json
import requests
import logging
import datetime
import functools
import pytz

from settings import host

def rsetattr(obj, attr, val):
    pre, _, post = attr.rpartition('__')
    return setattr(rgetattr(obj, pre) if pre else obj, post, val)

def rgetattr(obj, attr):
    return functools.reduce(getattr, [obj]+attr.split('__'))

# class EchoWebSocket(tornado.websocket.WebSocketHandler):
#     def open(self):
#         print("WebSocket opened")
# 
#     def on_message(self, message):
#         self.write_message(u"You said: " + message)
# 
#     def on_close(self):
#         print("WebSocket closed")

def cbk(*args,**kwargs):
    print('hello',args,kwargs)
    
def on_message(response,*args,**kwargs):
    data = response# json.loads(response)
    logging.debug('websocket sent: {}'.format(data))
#     subscriber = subscribableVariable.subscribers((data['sensor'],data['recipeInstance']))
#     subscriber[0].value = data['value']

@gen.coroutine #allows the websocket to be yielded
class subscribableVariable(object):
    '''
    classdocs
    '''
    dataIdentifyService = "http:" + host + "/live/timeseries/identify/"

    def __init__(self, instance, varName, sensorName,recipeInstance):
        '''
        Constructor
        '''
        self.instance = instance
        self.varName = varName
        
        #add new subscription to class vars
        self.subscribe(sensorName, recipeInstance, 'value')
        
    @property
    def value(self): return getattr(self.instance,self.varName)
    @value.setter
    def value(self,value): setattr(self.instance,self.varName,value)
        
    def subscribe(self,name,recipeInstance,type='value'):
        if ((name,recipeInstance)) not in self.subscribers:
            logging.debug('Subscribing to {}'.format(name))
            r = requests.post(self.dataIdentifyService,data={'recipe_instance':recipeInstance,'name':name})
            idSensor = r.json()['sensor']
            
            self.idSensor = idSensor
            self.recipeInstance = recipeInstance
            self.subscribers[(idSensor,recipeInstance)] = (self,type)
            
            logging.debug('Id is {}'.format(idSensor))
            io_loop = IOLoop.current()
            io_loop.add_future(self.websocket, self.write_subscription)
            
            logging.debug('Subscribed')
            
    def write_subscription(self,*args,**kwargs):
        print self.websocket
        self.websocket.write_message(json.dumps({'recipe_instance':self.recipeInstance,'sensor':self.idSensor,'subscribe':True}))
#     
#     @classmethod
#     def on_message(cls,response):
#         data = json.loads(response)
#         logging.debug('websocket sent: {}'.format(data))
#         subscriber = cls.subscribers((data['sensor'],data['recipeInstance']))
#         subscriber[0].value = data['value']
    websocket = websocket_connect("ws:" + host + "/live/timeseries/socket/",callback=cbk,on_message_callback=on_message)
    
    subscribers = {}

# @gen.coroutine #allows the websocket to be yielded
# class overridableVariable(object):
#     '''
#     classdocs
#     '''
#     dataIdentifyService = "http:" + host + "/live/timeseries/identify/"
#     def __init__(self, sensorName,recipeInstance):
#         '''
#         Constructor
#         '''
#         self.value = None
#         self.overridden = False
#         
#         #add new subscription to class vars
#         self.subscribe(sensorName, recipeInstance, 'value')
#         self.subscribe(sensorName+"Override", recipeInstance, 'override')
#     
#     def subscribe(self,name,recipeInstance,type='value'):
#         if ((name,recipeInstance)) not in self.subscribers:
#             r = requests.post(self.dataIdentifyService,data={'recipe_instance':recipeInstance,'name':name})
#             idSensor = r.json()['sensor']
#             self.subscribers[(idSensor,recipeInstance)] = (self,type)
#             self.websocket.write_message(json.dumps({'recipe_instance':recipeInstance,'sensor':idSensor,'subscribe':True}))
#         
#     @classmethod
#     def on_message(cls,response):
#         data = json.loads(response)
#         logging.debug('websocket sent: {}'.format(data))
#         subscriber = cls.subscribers((data['sensor'],data['recipeInstance']))
#         if subscriber[1] == 'value':
#             subscriber[0].value = data['value']
#         elif subscriber[1] == 'override':
#             subscriber[0].overridden = data['value']
#     websocket = websocket_connect("ws:" + host + "/live/timeseries/socket/",on_message_callback=on_message)
#     
#     subscribers = {}
#     
class dataStreamer(object):
    timeOutWait = 10
    
    dataPostService = "http:" + host + "/live/timeseries/new/"
    dataIdentifyService = "http:" + host + "/live/timeseries/identify/"
    
    def __init__(self,streamingClass,recipeInstance):
        self.streamingClass = streamingClass
        self.recipeInstance = recipeInstance
        
        self.sensorMap = {}
        self.timeOutCounter = 0
        
    def register(self,attr,name=None):
        if name is None: name=attr #default to attribute as the name
        if name in self.sensorMap: raise AttributeError('{} already exists in streaming service.'.format(name)) #this makes sure we arent overwriting anything
        self.sensorMap[name] = {'attr':attr} #map the attribute to the server var name
    
    def postData(self):
        if self.timeOutCounter > 0:
            self.timeOutCounter -= 1
        else:
            #post temperature updates to server        
            sampleTime = datetime.datetime.now(tz=pytz.utc).isoformat()
            
            for sensorName,sensor in self.sensorMap.iteritems():
                #get the sensor ID if we dont have it already
                if 'id' not in sensor:
                    try:
                        r = requests.post(self.dataIdentifyService,data={'recipe_instance':self.recipeInstance,'name':sensorName})
                        r.raise_for_status()
                    except requests.exceptions.ConnectionError:
                        logging.info("Server not there. Will retry later.")
                        self.timeOutCounter = self.timeOutWait
                        break
                    except requests.exceptions.HTTPError:
                        logging.info("Server returned error status. Will retry later.")
                        self.timeOutCounter = self.timeOutWait
                        break
                    
                    sensor['id'] = r.json()['sensor']
                    
                #send the data
                try:
                    r = requests.post(self.dataPostService,
                        data={'time':sampleTime,'recipe_instance':self.recipeInstance,
                            'value':rgetattr(self.streamingClass,sensor['attr']),'sensor':sensor['id']
                        }
                    )
                    r.raise_for_status()
                except requests.exceptions.ConnectionError:
                    logging.info("Server not there. Will retry later.")
                    self.timeOutCounter = self.timeOutWait
                    break
                except requests.exceptions.HTTPError:
                    logging.info("Server returned error status. Will retry later.")
                    self.timeOutCounter = self.timeOutWait
                    break
                    
        
    