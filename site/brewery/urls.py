'''
Created on Apr 9, 2016

@author: William
'''

from views import MainHandler
from views import TimeSeriesNewHandler,TimeSeriesSocketHandler,TimeSeriesIdentifyHandler

urlpatterns = [
    (r"/", MainHandler),
    (r"/live/timeseries/new/", TimeSeriesNewHandler),
    (r"/live/timeseries/identify/", TimeSeriesIdentifyHandler),
    #(r"/live/timeseries/subscribe/", TimeSeriesSubscribeHandler),
    (r"/live/timeseries/socket/", TimeSeriesSocketHandler),
]