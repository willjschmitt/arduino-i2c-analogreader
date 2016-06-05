'''
Created on Apr 5, 2016

@author: William
'''

from brewery import brewing

# from tornado import ioloop
from tornado import gen
import logging
logging.basicConfig(level=logging.DEBUG)

@gen.coroutine
def main():
    brewery = brewing.brewery()
    #ioloop.IOLoop.current().run_sync(brewery)
    
if __name__ == "__main__":
    main()