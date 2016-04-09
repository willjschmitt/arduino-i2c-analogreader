import tornado.web

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

from models import Brewery

# Create your views here.
class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("index.html",brewery=Brewery.objects.get(pk=1))