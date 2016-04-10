'''
Created on Apr 9, 2016

@author: William
'''

from views import MainHandler
from views import TimeSeriesNewHandler,TimeSeriesSubscribeHandler

urlpatterns = [
    (r"/", MainHandler),
    (r"/live/timeseries/new/", TimeSeriesNewHandler),
    (r"/live/timeseries/subscribe/", TimeSeriesSubscribeHandler),
]