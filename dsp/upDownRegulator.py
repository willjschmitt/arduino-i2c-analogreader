'''
Created on Apr 4, 2016

@author: William
'''

from datetime import time

class upDownRegulator(object):
    '''
    classdocs
    '''


    def __init__(self, KPup,KIup,KPdown,KIdown,max,min):
        '''
        Constructor
        '''
        self.KPup = KPup
        self.KIup = KIup
        self.KPdown = KPdown
        self.KIdown = KIdown
        self.max = max
        self.min = min
        
        self.time_z1 = 0.
        
    def calculate(self,xFbk,xRef):
        now = time.time()
        deltaT = now-self.time_z1
        
        error = xRef - xFbk
        if error > 0.:
            self.KP = self.KPup
            self.KI = self.KIup
        else:
            self.KP = self.KPdown
            self.KI = self.KIdown
        
        self.QP  = error * self.KP
        self.QI += error * self.KI * deltaT
        self.Q = self.QP + self.QI
        
        #limit with anti-windup applied to integrator
        if self.Q > self.max:
            self.Q = self.max
            self.QI = self.max - self.QP
        elif self.Q < self.min:
            self.Q = self.min
            self.QI = self.min - self.QP
        
        self.time_z1 = now
        return self.Q