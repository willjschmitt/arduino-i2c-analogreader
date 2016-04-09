'''
Created on Apr 3, 2016

@author: William
'''

import time

class regulator(object):
    '''
    classdocs
    '''


    def __init__(self,KP=1.,KI=1.,maxQ=0.,minQ=0.):
        '''
        Constructor
        '''
        self.KP = KP
        self.KI = KI
        self.maxQ = maxQ
        self.minQ = minQ
        
        self.QI = 0.
        
        self.time_z1 = 0.
        
    def calculate(self,xFbk,xRef):
        now = time.time()
        
        self.QP  = (xRef-xFbk) * self.KP
        self.QI += (xRef-xFbk) * self.KI * (now-self.time_z1)
        self.Q = self.QP + self.QI
        
        #limit with anti-windup applied to integrator
        if self.Q > self.maxQ:
            self.Q = self.maxQ
            self.QI = self.maxQ - self.QP
        elif self.Q < self.minQ:
            self.Q = self.minQ
            self.QI = self.minQ - self.QP
        
        self.time_z1 = now
        return self.Q
        