'''
Created on Apr 5, 2016

@author: William
'''

from brewery.brewing import brewery

import logging

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)    
    brewery = brewery()