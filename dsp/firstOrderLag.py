'''
Created on Apr 3, 2016

@author: William
'''

import time

class firstOrderLag(object):
    '''
    classdocs
    '''
    def __init__(self, tFilt, **kwargs):
        '''
        Constructor
        '''
        if 'init' in kwargs:
            self.q_z1 = kwargs['init']
            self.q = kwargs['init']
        else:
            self.q_z1 = 0.
            self.q = 0.
            
        self.t_z1 = time.time()
        self.tFilt = tFilt
        
    def filter(self,x):
        now = time.time()
        tDelt = now - self.t_z1        
        self.t_z1 = now
        
        self.q += (x - self.q) * (tDelt / self.tFilt)