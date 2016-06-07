'''
Created on Apr 5, 2016

@author: William
'''

import logging
logger = logging.getLogger(__name__)

from gpiocrust import OutputPin
from utils import gpio_mock_api_active

from measurement import rtdSensor

from dsp import regulator, integrator

class simpleVessel(object):
    '''
    classdocs
    '''
    def __init__(self, volume,**kwargs):
        '''
        Constructor
        '''
        self.volume = volume
    
    def setLiquidLevel(self,volume):
        self.volume = volume

class temperatureMonitoredVessel(simpleVessel):
    '''
    classdocs
    '''
    def __init__(self, volume, rtdParams):
        '''
        Constructor
        '''
        super(temperatureMonitoredVessel,self).__init__(volume)
        
        self.temperatureSensor = rtdSensor(*rtdParams)
        
        #for simulation environment make an integrator to represent the absorbtion of energy     
        if gpio_mock_api_active:
            self.liquid_temperature_simulator = integrator(init=68.)
            
    @property
    def temperature(self):
        if gpio_mock_api_active:
            return self.liquid_temperature_simulator.q
        else:
            return self.temperatureSensor.temperature
        
    def measureTemperature(self):
        return self.temperatureSensor.measure()
    
    
class heatedVessel(temperatureMonitoredVessel):
    '''
    classdocs
    '''

    def __init__(self, rating, volume, rtdParams, pin, **kwargs):
        '''
        Constructor
        '''
        self.rating = rating # in Watts (of heating element)
        self.elementStatus = False # element defaults to off
        
        self.temperatureSetPoint = 0.
                
        self.regulator = kwargs.get('regulatorClass',regulator)(maxQ=1.,minQ=0.)
        
        self.dutyCycle = 0.
        self.dutyPeriod = 1. #seconds
        
        self.pin = OutputPin(pin, value=0)
        
        super(heatedVessel,self).__init__(volume,rtdParams)
        
        self.recalculateGains()
        
    def setTemperature(self,value): 
        logger.debug("Setting temperature {}".format(value))
        self.temperatureSetPoint = value
        
    def turnOff(self):
        self.elementStatus = self.pin.value = False
        self.regulator.disable()
    def turnOn(self):  
        self.elementStatus = self.pin.value = True
        self.regulator.enable()
    
    def setLiquidLevel(self,volume):
        self.volume = volume
        self.recalculateGains()
    
    def recalculateGains(self):
        self.regulator.KP = 50.*(self.volume/self.rating)
        self.regulator.KI =  1.*(self.volume/self.rating)
        
    def regulate(self):
        logger.debug("Temp: {}, SP: {}".format(self.temperature,self.temperatureSetPoint))
        self.dutyCycle = self.regulator.calculate(self.temperature,self.temperatureSetPoint)
    
    
    def measureTemperature(self):
        #lets here add heat to the vessel in simulation mode
        if gpio_mock_api_active: return self.liquid_temperature_simulator.integrate(self.temperature_ramp)
        
        return super(heatedVessel,self).measureTemperature()
        
    @property
    def power(self): return self.dutyCycle * self.rating
    
    @property #returns degF/sec rate of change of liquid
    def temperature_ramp(self):
        return self.power/(self.volume*4.184*1000.)*(9./5.)*(1./3.79)

        
class heatExchangedVessel(temperatureMonitoredVessel):
    '''
    classdocs
    '''

    def __init__(self, volume, rtdParams,heatExchangerConductivity=1., **kwargs):
        '''
        Constructor
        '''
        self.volume = volume
        
        self.temperatureSetPoint = 0.
        
        self.heatExchangerConductivity = heatExchangerConductivity
        self.regulator = kwargs.get('regulatorClass',regulator)(maxQ=15.,minQ=-15.)
        
        super(heatExchangedVessel,self).__init__(volume, rtdParams)
        self.recalculateGains()
        
    def turnOff(self):
        self.regulator.disable()
    def turnOn(self):
        self.regulator.enable()
    
    def setTemperature(self,temp):
        self.temperatureSetPoint = temp
        
    def setLiquidLevel(self,volume):
        self.volume = volume
        self.recalculateGains()
        
    def regulate(self):
        self.sourceTemperature = self.temperature + self.regulator.calculate(self.temperature,self.temperatureSetPoint)
        
    def recalculateGains(self):
        self.regulator.KP = 2.E-1*(self.volume/self.heatExchangerConductivity)
        self.regulator.KI = 2.E-3*(self.volume/self.heatExchangerConductivity)