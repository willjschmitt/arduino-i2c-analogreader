'''
Created on Apr 8, 2016

@author: William
'''
import logging
import tornado.escape
import tornado.ioloop
import tornado.web
import os.path
import uuid

from tornado.concurrent import Future
from tornado import gen
from tornado.options import define, options, parse_command_line

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "joule.settings")

import uimodules

import joule.urls

define("port", default=8888, help="run on the given port", type=int)
define("debug", default=False, help="run in debug mode")

settings = {
    "ui_modules":uimodules,
    "cookie_secret":"k+IsuNhvAjanlxg4Q5cV3fPgAw284Ev7fF7QzvYi1Yw=",
    "template_path":os.path.join(os.path.dirname(__file__), "templates"),
    "static_path":os.path.join(os.path.dirname(__file__), "static"),
    "xsrf_cookies":True,
    "debug":options.debug,
}

def main():
    parse_command_line()
    app = tornado.web.Application(
        joule.urls.urlpatterns,
        **settings
    )
    app.listen(options.port)
    tornado.ioloop.IOLoop.current().start()


if __name__ == "__main__":
    main()