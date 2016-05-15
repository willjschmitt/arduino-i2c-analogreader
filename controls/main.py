'''
Created on Apr 5, 2016

@author: William
'''

from controls.brewery.brewing import brewery

from tornado import ioloop
from tornado import gen
import logging

@gen.coroutine
def main():
    pass

if __name__ == "__main__":
    logging.basicConfig(level=logging.DEBUG)
    brewery = brewery()
    #ioloop.IOLoop.current().run_sync(brewery)