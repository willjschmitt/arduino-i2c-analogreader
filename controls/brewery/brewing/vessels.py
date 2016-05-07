'''
Created on Apr 5, 2016

@author: William
'''
from datetime import time

from gpiocrust import OutputPin

from controls.measurement import rtdSensor

from controls.dsp import regulator

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
            
    @property
    def temperature(self):
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
        
    def turnOff(self): self.elementStatus = self.pin.value = False
    def turnOn(self):  self.elementStatus = self.pin.value = True
    
    def setLiquidLevel(self,volume):
        self.volume = volume
        self.recalculateGains()
    
    def recalculateGains(self):
        self.regulator.KP = 50.*(self.volume/self.rating)
        self.regulator.KI =  1.*(self.volume/self.rating)
        
    def regulate(self):
        self.dutyCycle = self.regulator.calculate(self.temperature,self.temperatureSetPoint)
        
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