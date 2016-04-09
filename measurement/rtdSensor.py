'''
Created on Apr 3, 2016

@author: William
'''

from dsp import firstOrderLag

class rtdSensor(object):
    '''
    classdocs
    '''
    def __init__(self, aPin, alpha, zeroR, aRef, k, c, tFilt=10.0):
        '''
        Constructor
        '''
        self.temperatureFilter = firstOrderLag(tFilt)
        
        self.ain_pin = aPin
        self.alpha   = alpha
        self.zeroR   = zeroR
        self.aRef    = aRef

        self.k = k
        self.c = c
        
    @property
    def temperature(self):
        return self.temperatureFilter.q
        
    def measure(self):    
        counts = 1000#arduino_analogRead(fd, ain_pin);
        if (counts < 0): return
        Vdiff  = self.aRef*(counts/1024.)
        Vrtd   = Vdiff*(15./270.) + 5.0*(10./(100.+10.))
        Rrtd   = (1000.*(1./5.)*Vrtd)/(1.-(1./5.)*Vrtd);
        temp   = (Rrtd - 100.0)/self.alpha;
        temp   = temp*(9.0/5.0) + 32.0;
        temp   = temp*self.k + self.c;
    
        self.temperatureFilter.filter(temp)    
        return