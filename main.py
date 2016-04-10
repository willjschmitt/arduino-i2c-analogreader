'''
Created on Apr 5, 2016

@author: William
'''
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "joule.settings")

from controls.brewery.brewing import brewery

import logging

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)    
    brewery = brewery()