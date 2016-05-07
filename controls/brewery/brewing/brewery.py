'''
Created on Apr 3, 2016

@author: William
'''

#from datetime import time

import sched,time
import datetime

from vessels import heatedVessel,heatExchangedVessel
from simplePump import simplePump

from controls.dsp import stateMachine

import requests

import logging

from controls.settings import host

import functools
from controls.utils import overridableVariable
def rsetattr(obj, attr, val):
    pre, _, post = attr.rpartition('.')
    return setattr(rgetattr(obj, pre) if pre else obj, post, val)

def rgetattr(obj, attr):
    return functools.reduce(getattr, [obj]+attr.split('.'))

class brewery(object):
    '''
    classdocs
    '''

    def __init__(self):
        '''
        Constructor
        '''
        logging.info('Initializing Brewery object')
        self.scheduler = sched.scheduler(time.time,time.sleep)
        
        self.dataPostService = "http:" + host + "/live/timeseries/new/"
        self.dataIdentifyService = "http:" + host + "/live/timeseries/identify/"
        self.recipeInstance = 1
        self.sensorMap = {}
        
        #state machine initialization
        self.state = stateMachine(self)
        self.state.addState(statePrestart)
        self.state.addState(statePremash)
        self.state.addState(stateStrike)
        self.state.addState(statePostStrike)
        self.state.addState(stateMash)
        self.state.addState(stateMashout)
        self.state.addState(stateMashout2)
        self.state.addState(stateSpargePrep)
        self.state.addState(stateSparge)
        self.state.addState(statePreBoil)
        self.state.addState(stateMashToBoil)
        self.state.addState(stateBoilPreheat)
        self.state.addState(stateBoil)
        self.state.addState(stateCool)
        self.state.addState(statePumpout)
        self.state.changeState('statePrestart')
    
        #initialize everything
        self.boilKettle = heatedVessel(rating=5000.,volume=5.,rtdParams=[0,0.385,100.0,5.0,0.94,-16.0,10.],pin=0)
        self.mashTun = heatExchangedVessel(volume=5.,rtdParams=[1,0.385,100.0,5.0,0.94,-9.0,10.])
        self.mainPump = simplePump(pin=2)
    
        self.mashTemperatureProfile = [
            [0.0, 152.0], #start at 152
            [45.0,155.0], #at 45min step up to 155
        ]
        
        self.strikeTemperature = 162.
        self.mashoutTemperature = 170.
        self.mashoutTime = 10.*60. # in seconds
        self.boilTemperature = 217.
        self.coolTemperature = 70.
        
        self.systemEnergy = 0.
        self.energyUnitCost = 0.15 #$/kWh
    
        #permission variables
        self.requestPermission = False
        self.grantPermission   = False
        
        #schedule task 1 execution
        self.tm1Rate = 1. #seconds
        self.tm1_tz1 = time.time() 
        self.task00()
        
        #self.watchedVar = overridableVariable(9,10)
        
        self.scheduler.run()
        
    def task00(self):
        logging.debug('Evaluating task 00')
        self.wtime = time.time()
    
        # Evaluate state of controls (mash, pump, boil, etc)
        self.state.evaluate()
    
        # Check Temperatures
        self.boilKettle.measureTemperature()
        self.mashTun.measureTemperature()
    
        # Controls Calculations for Mash Tun Element
        self.mashTun.regulate()
        self.boilKettle.temperatureSetPoint = self.mashTun.sourceTemperature
    
        # Controls Calculations for Boil Kettle Element
        self.boilKettle.regulate()

        self.systemEnergy += (self.boilKettle.dutyCycle*self.boilKettle.rating)*((self.wtime-self.tm1_tz1)/(60.*60.))
        self.systemEnergyCost= self.systemEnergy/1000. * self.energyUnitCost
        
        self.postData()
        
        #schedule next task 1 event
        self.tm1_tz1 = self.wtime
        self.scheduler.enter(self.tm1Rate, 1, self.task00, ())
        
    def postData(self):
        #post temperature updates to server        
        sampleTime = str(datetime.datetime.now())
        
        sensors = [
            {'value':self.boilKettle.temperature,'name':'boilKettle__temperature'},
            {'value':self.boilKettle.temperatureSetPoint,'name':'boilKettle__temperatureSetPoint'},
            {'value':self.mashTun.temperature,'name':'mashTun__temperature'},
            {'value':self.mashTun.temperatureSetPoint,'name':'mashTun__temperatureSetPoint'},
            {'value':self.boilKettle.dutyCycle,'name':'boilKettle__dutyCycle'},
            {'value':self.boilKettle.dutyCycle * self.boilKettle.rating,'name':'boilKettle__power'},
            {'value':self.systemEnergy,'name':'systemEnergy'},
            {'value':self.systemEnergyCost,'name':'systemEnergyCost'},
            {'value':self.state.id,'name':'state'},
        ]
        
        for sensor in sensors:
            #get the sensor ID if we dont have it already
            if sensor['name'] not in self.sensorMap:
                r = requests.post(self.dataIdentifyService,
                    data={'recipe_instance':self.recipeInstance,'name':sensor['name']}
                )
                self.sensorMap['name'] = r.json()['sensor']
            requests.post(self.dataPostService,
                data={
                    'time':sampleTime,'recipe_instance':self.recipeInstance,
                    'value':sensor['value'],'sensor':self.sensorMap['name']
                }
            )
    
    
def statePrestart(breweryInstance):
    '''
    __STATE_PRESTART - state where everything is off. waiting for user to
    okay start of process after water is filled in the boil kettle/HLT
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOff()

    if breweryInstance.grantPermission:
        breweryInstance.state.changeState('statePremash')
    else:
        breweryInstance.requestPermission = True
        
def statePremash(breweryInstance): 
    '''
    __STATE_PREMASH - state where the boil element brings water up to
    strike temperature
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.boilKettle.setTemperature(breweryInstance.strikeTemperature)

    if breweryInstance.boilKettle.temperature > breweryInstance.strikeTemperature:
        breweryInstance.requestPermission = True
        if breweryInstance.grantPermission:
            breweryInstance.grantPermission = False
            breweryInstance.state.changeState('stateStrike')
        else:
            breweryInstance.requestPermission = True

def stateStrike(breweryInstance):
    breweryInstance.mainPump.turnOn()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.boilKettle.setTemperature(breweryInstance.mashtemp)
    
    if breweryInstance.grantPermission:
        breweryInstance.grantPermission = False
        breweryInstance.state.changeState('statePostStrike')
    else:
        breweryInstance.requestPermission = True

def statePostStrike(breweryInstance):
    '''
    C_STATE_PREMASH - state where the boil element brings water up to
    strike temperature
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.boilKettle.setTemperature(breweryInstance.mashtemp)

    if breweryInstance.boilKettle.temperature > breweryInstance.mashtemp:
        if breweryInstance.grantPermission:
            breweryInstance.grantPermission = False
            breweryInstance.state.changeState('stateMash')
        else:    
            breweryInstance.requestPermission = True

def stateMash(breweryInstance):
    '''
    C_STATE_MASH - state where pump turns on and boil element adjusts HLT temp
    to maintain mash temperature
    '''
    breweryInstance.mainPump.turnOn()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.setTemperature(breweryInstance.mashTemp)
    breweryInstance.timeT0 = time.time()

    if breweryInstance.wtime > breweryInstance.timeT0 + breweryInstance.mashTime:
        breweryInstance.state.changeState('stateMashout')

def stateMashout(breweryInstance):
    '''
    C_STATE_MASHOUT - steps up boil temperature to 175degF and continues
    to circulate wort to stop enzymatic processes and to prep sparge water
    '''
    breweryInstance.mainPump.turnOn()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.setTemperature(breweryInstance.mashoutTemperature)
    breweryInstance.boilKettle.setTemperature(breweryInstance.mashoutTemperature+5.) #give a little extra push on boil set temp 
    
    if breweryInstance.boilKettle.temperature > breweryInstance.mashoutTemperature:
        breweryInstance.state.changeState('stateMashout2')

def stateMashout2(breweryInstance):
    '''
    C_STATE_MASHOUT2 - steps up boil temperature to 175degF and continues
    to circulate wort to stop enzymatic processes and to prep sparge water
    this continuation just forces an amount of time of mashout at a higher
    temp of wort
    '''
    breweryInstance.mainPump.turnOn()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.setTemperature(breweryInstance.mashoutTemperature)
    breweryInstance.timeT0 = time.time()
    if breweryInstance.wtime > breweryInstance.timeT0 + breweryInstance.mashoutTime:
        if breweryInstance.grantPermission:
            breweryInstance.grantPermission = False
            breweryInstance.state.changeState('stateSpargePrep')

def stateSpargePrep(breweryInstance):
    '''
    C_STATE_SPARGEPREP - prep hoses for sparge process
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOff()

    if breweryInstance.grantPermission:
        breweryInstance.grantPermission = False
        breweryInstance.state.changeState('stateSparge')
    else:
        breweryInstance.requestPermission = True

def stateSparge(breweryInstance):
    '''
    C_STATE_SPARGE - slowly puts clean water onto grain bed as it is 
    drained
    '''
    breweryInstance.mainPump.turnOn()
    breweryInstance.boilKettle.turnOff()

    if breweryInstance.grantPermission:
        breweryInstance.grantPermission = False
        breweryInstance.state.changeState('statePreBoil')
    else:
        breweryInstance.requestPermission = True

def statePreBoil(breweryInstance):
    '''
    C_STATE_PREBOIL - turns of pump to allow switching of hoses for
    transfer to boil as well as boil kettle draining
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOff()
    if breweryInstance.grantPermission:
        breweryInstance.grantPermission = False
        breweryInstance.state.changeState('stateMashToBoil')
    else:
        breweryInstance.requestPermission = True

def stateMashToBoil(breweryInstance):
    '''
    C_STATE_MASHTOBOIL - turns off boil element and pumps wort from
    mash tun to the boil kettle
    '''
    breweryInstance.mainPump.turnOn()
    breweryInstance.boilKettle.turnOff()
    
    if breweryInstance.grantPermission:
        breweryInstance.grantPermission = False
        breweryInstance.state.changeState('stateBoilPreheat')
    else:
        breweryInstance.requestPermission = True

def stateBoilPreheat(breweryInstance):
    '''
    C_STATE_BOILPREHEAT - heat wort up to temperature before starting to
    countdown timer in boil.
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.boilKettle.setTemperature(breweryInstance.boilTemperature)
    
    if breweryInstance.boilKettle.temperature >  breweryInstance.boilKettle.temperatureSetPoint - 10.0:
        breweryInstance.state.changeState('stateBoil')

def stateBoil(breweryInstance):
    '''
        C_STATE_BOIL - state of boiling to bring temperature to boil temp
        and maintain temperature for duration of boil
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOn()

    breweryInstance.boilKettle.setTemperature(breweryInstance.boilTemperature)
    breweryInstance.timeT0 = time.time()

    if breweryInstance.wtime > breweryInstance.timeT0 + breweryInstance.BOILTIME:
        if breweryInstance.grantPermission:
            breweryInstance.grantPermission = False
            breweryInstance.state.changeState('stateCool')
        else:
            breweryInstance.requestPermission = True

def stateCool(breweryInstance):
    '''
    C_STATE_COOL - state of cooling boil down to pitching temperature
    '''
    breweryInstance.mainPump.turnOff()
    breweryInstance.boilKettle.turnOff()

   
    if breweryInstance.boilKettle.temperature < breweryInstance.coolTemperature:
        if breweryInstance.grantPermission:
            breweryInstance.grantPermission = False
            breweryInstance.state.changeState('statePumpout')
        else:
            breweryInstance.requestPermission = True

def statePumpout(breweryInstance):
    '''
    C_STATE_PUMPOUT - state of pumping wort out into fermenter
    '''
    breweryInstance.mainPump.turnOn()
    breweryInstance.boilKettle.turnOff()

    if breweryInstance.grantPermission:
        breweryInstance.grantPermission = False
        breweryInstance.state.changeState()
    else:
        breweryInstance.requestPermission = True