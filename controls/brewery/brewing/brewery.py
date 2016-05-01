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
        self.state.addState(self.statePrestart)
        self.state.addState(self.statePremash)
        self.state.addState(self.stateStrike)
        self.state.addState(self.statePostStrike)
        self.state.addState(self.stateMash)
        self.state.addState(self.stateMashout)
        self.state.addState(self.stateMashout2)
        self.state.addState(self.stateSpargePrep)
        self.state.addState(self.stateSparge)
        self.state.addState(self.statePreBoil)
        self.state.addState(self.stateMashToBoil)
        self.state.addState(self.stateBoilPreheat)
        self.state.addState(self.stateBoil)
        self.state.addState(self.stateCool)
        self.state.addState(self.statePumpout)
    
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
            {'value':self.mashTun.temperatureSetPoint,'name':'mashTun_temperatureSetPoint'},
            {'value':self.boilKettle.dutyCycle,'name':'boilKettle__dutyCycle'},
            {'value':self.boilKettle.dutyCycle * self.boilKettle.rating,'name':'boilKettle__power'},
            {'value':self.systemEnergy,'name':'systemEnergy'},
            {'value':self.systemEnergyCost,'name':'systemEnergyCost'},
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
        
        
    def statePrestart(self):
        '''
        __STATE_PRESTART - state where everything is off. waiting for user to
        okay start of process after water is filled in the boil kettle/HLT
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOff()
    
        if self.grantPermission:
            self.state.changeState('statePremash')
        else:
            self.requestPermission = True
            
    def statePremash(self): 
        '''
        __STATE_PREMASH - state where the boil element brings water up to
        strike temperature
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOn()

        self.boilKettle.setTemperature(self.strikeTemperature)

        if self.boilKettle.temperature > self.strikeTemperature:
            self.requestPermission = True
            if self.grantPermission:
                self.grantPermission = False
                self.state.changeState('stateStrike')
            else:
                self.requestPermission = True
    
    def stateStrike(self):
        self.mainPump.turnOn()
        self.boilKettle.turnOn()

        self.boilKettle.setTemperature(self.mashtemp)
        
        if self.grantPermission:
            self.grantPermission = False
            self.state.changeState('statePostStrike')
        else:
            self.requestPermission = True
    
    def statePostStrike(self):
        '''
        C_STATE_PREMASH - state where the boil element brings water up to
        strike temperature
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOn()

        self.boilKettle.setTemperature(self.mashtemp)

        if self.boilKettle.temperature > self.mashtemp:
            if self.grantPermission:
                self.grantPermission = False
                self.state.changeState('stateMash')
            else:    
                self.requestPermission = True
    
    def stateMash(self):
        '''
        C_STATE_MASH - state where pump turns on and boil element adjusts HLT temp
        to maintain mash temperature
        '''
        self.mainPump.turnOn()
        self.boilKettle.turnOn()

        self.setTemperature(self.mashTemp)
        self.timeT0 = time.time()

        if self.wtime > self.timeT0 + self.mashTime:
            self.state.changeState('stateMashout')
    
    def stateMashout(self):
        '''
        C_STATE_MASHOUT - steps up boil temperature to 175degF and continues
        to circulate wort to stop enzymatic processes and to prep sparge water
        '''
        self.mainPump.turnOn()
        self.boilKettle.turnOn()

        self.setTemperature(self.mashoutTemperature)
        self.boilKettle.setTemperature(self.mashoutTemperature+5.) #give a little extra push on boil set temp 
        
        if self.boilKettle.temperature > self.mashoutTemperature:
            self.state.changeState('stateMashout2')
    
    def stateMashout2(self):
        '''
        C_STATE_MASHOUT2 - steps up boil temperature to 175degF and continues
        to circulate wort to stop enzymatic processes and to prep sparge water
        this continuation just forces an amount of time of mashout at a higher
        temp of wort
        '''
        self.mainPump.turnOn()
        self.boilKettle.turnOn()

        self.setTemperature(self.mashoutTemperature)
        self.timeT0 = time.time()
        if self.wtime > self.timeT0 + self.mashoutTime:
            if self.grantPermission:
                self.grantPermission = False
                self.state.changeState('stateSpargePrep')
    
    def stateSpargePrep(self):
        '''
        C_STATE_SPARGEPREP - prep hoses for sparge process
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOff()

        if self.grantPermission:
            self.grantPermission = False
            self.state.changeState('stateSparge')
        else:
            self.requestPermission = True
    
    def stateSparge(self):
        '''
        C_STATE_SPARGE - slowly puts clean water onto grain bed as it is 
        drained
        '''
        self.mainPump.turnOn()
        self.boilKettle.turnOff()

        if self.grantPermission:
            self.grantPermission = False
            self.state.changeState('statePreBoil')
        else:
            self.requestPermission = True
    
    def statePreBoil(self):
        '''
        C_STATE_PREBOIL - turns of pump to allow switching of hoses for
        transfer to boil as well as boil kettle draining
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOff()
        if self.grantPermission:
            self.grantPermission = False
            self.state.changeState('stateMashToBoil')
        else:
            self.requestPermission = True
    
    def stateMashToBoil(self):
        '''
        C_STATE_MASHTOBOIL - turns off boil element and pumps wort from
        mash tun to the boil kettle
        '''
        self.mainPump.turnOn()
        self.boilKettle.turnOff()
        
        if self.grantPermission:
            self.grantPermission = False
            self.state.changeState('stateBoilPreheat')
        else:
            self.requestPermission = True
    
    def stateBoilPreheat(self):
        '''
        C_STATE_BOILPREHEAT - heat wort up to temperature before starting to
        countdown timer in boil.
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOn()

        self.boilKettle.setTemperature(self.boilTemperature)
        
        if self.boilKettle.temperature >  self.boilKettle.temperatureSetPoint - 10.0:
            self.state.changeState('stateBoil')
    
    def stateBoil(self):
        '''
            C_STATE_BOIL - state of boiling to bring temperature to boil temp
            and maintain temperature for duration of boil
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOn()

        self.boilKettle.setTemperature(self.boilTemperature)
        self.timeT0 = time.time()

        if self.wtime > self.timeT0 + self.BOILTIME:
            if self.grantPermission:
                self.grantPermission = False
                self.state.changeState('stateCool')
            else:
                self.requestPermission = True
    
    def stateCool(self):
        '''
        C_STATE_COOL - state of cooling boil down to pitching temperature
        '''
        self.mainPump.turnOff()
        self.boilKettle.turnOff()

       
        if self.boilKettle.temperature < self.coolTemperature:
            if self.grantPermission:
                self.grantPermission = False
                self.state.changeState('statePumpout')
            else:
                self.requestPermission = True
    
    def statePumpout(self):
        '''
        C_STATE_PUMPOUT - state of pumping wort out into fermenter
        '''
        self.mainPump.turnOn()
        self.boilKettle.turnOff()

        if self.grantPermission:
            self.grantPermission = False
            self.state.changeState()
        else:
            self.requestPermission = True