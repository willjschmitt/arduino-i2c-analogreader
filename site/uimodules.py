'''
Created on Apr 9, 2016

@author: William
'''
import tornado

class navigationSidebar(tornado.web.UIModule):
    def render(self):
        return self.render_string(
            "navigation-sidebar.html")