'''
Name: controls_gui.numpad

Created Jun 28, 2015

@author: schmitwi

Description:

Rev History:
Rev Author Date Description
___ ______ ____ __________

0.0 WJS    Jun 28, 2015
'''

from __future__ import unicode_literals
import sys, os, random
from PyQt4 import QtGui, QtCore
from PyKDE4.kdeui import *

'''
def numpad(self):
    dialog = QDialog()
    dialog.ui = Ui_MyDialog()
    dialog.ui.setupUi(dialog)
    dialog.setAttribute(QtCore.Qt.WA_DeleteOnClose)
    dialog.exec_()
'''

class numpad_dialog(object):
    def setupUi(self, Dialog):
        Dialog.setObjectName("Numpad")
        Dialog.resize(300, 250)
        self.value = ""
        
        font = QtGui.QFont()
        font.setPointSize(16)
        
        self.main_widget = QtGui.QWidget(self)
        
        self.dialoglayout = QtGui.QVBoxLayout(self.main_widget)
        
        #Current Value
        self.valuelayout = QtGui.QHBoxLayout()
        self.label = QtGui.QLabel(Dialog)
        self.label.setText("Value:")
        self.label.setFont(font)
        self.label.setObjectName("label")
        
        self.ed_value = QtGui.QLineEdit(Dialog)
        self.ed_value.setFont(font)
        self.ed_value.setObjectName("ed_value")
        
        self.valuelayout.addWidget(self.label)
        self.valuelayout.addWidget(self.ed_value)
        
        #Numpad
        self.numpadlayout = QtGui.QVBoxLayout()
        self.row789 = QtGui.QHBoxLayout()
        self.row456 = QtGui.QHBoxLayout()
        self.row123 = QtGui.QHBoxLayout()
        self.row0   = QtGui.QHBoxLayout()
        self.button7 = QtGui.QPushButton("7",self)
        self.button8 = QtGui.QPushButton("8",self)
        self.button9 = QtGui.QPushButton("9",self)
        self.button4 = QtGui.QPushButton("4",self)
        self.button5 = QtGui.QPushButton("5",self)
        self.button6 = QtGui.QPushButton("6",self)
        self.button1 = QtGui.QPushButton("1",self)
        self.button2 = QtGui.QPushButton("2",self)
        self.button3 = QtGui.QPushButton("3",self)
        self.button0 = QtGui.QPushButton("0",self)
        self.buttondot = QtGui.QPushButton(".",self)
        self.buttonback = QtGui.QPushButton("Bksp",self)
        self.button7.clicked.connect(self.add7)
        self.button8.clicked.connect(self.add8)
        self.button9.clicked.connect(self.add9)
        self.button4.clicked.connect(self.add4)
        self.button5.clicked.connect(self.add5)
        self.button6.clicked.connect(self.add6)
        self.button1.clicked.connect(self.add1)
        self.button2.clicked.connect(self.add2)
        self.button3.clicked.connect(self.add3)
        self.button0.clicked.connect(self.add0)
        self.buttondot.clicked.connect(self.adddot)
        self.buttonback.clicked.connect(self.backspace)
        self.row789.addWidget(self.button7)
        self.row789.addWidget(self.button8)
        self.row789.addWidget(self.button9)
        self.row456.addWidget(self.button4)
        self.row456.addWidget(self.button5)
        self.row456.addWidget(self.button6)
        self.row123.addWidget(self.button1)
        self.row123.addWidget(self.button2)
        self.row123.addWidget(self.button3)
        self.row0.addWidget(self.button0)
        self.row0.addWidget(self.buttondot)
        self.row0.addWidget(self.buttonback)
        self.numpadlayout.addLayout(self.row789)
        self.numpadlayout.addLayout(self.row456)
        self.numpadlayout.addLayout(self.row123)
        self.numpadlayout.addLayout(self.row0)
        
        #Completion buttons
        self.buttonBoxlayout = QtGui.QHBoxLayout()
        self.buttonBox = QtGui.QDialogButtonBox(Dialog)
        self.buttonBox.setOrientation(QtCore.Qt.Horizontal)
        self.buttonBox.setStandardButtons(QtGui.QDialogButtonBox.Cancel|QtGui.QDialogButtonBox.Ok)
        self.buttonBox.setObjectName("buttonBox")
        self.buttonBoxlayout.addWidget(self.buttonBox)
        
        self.dialoglayout.addLayout(self.valuelayout)
        self.dialoglayout.addLayout(self.numpadlayout)
        self.dialoglayout.addLayout(self.buttonBoxlayout)
        
        
        '''
        self.sl_value = QtGui.QSlider(Dialog)
        self.sl_value.setGeometry(QtCore.QRect(220, 120, 161, 31))
        self.sl_value.setOrientation(QtCore.Qt.Horizontal)
        self.sl_value.setObjectName("sl_value")
        '''
        
        
        font = QtGui.QFont()
        font.setPointSize(16)
        
        
        Dialog.setWindowTitle(QtGui.QApplication.translate("Numpad", "Enter Value", None, QtGui.QApplication.UnicodeUTF8))
        #self.label.setText(QtGui.QApplication.translate("Numpad", "Set example value:", None, QtGui.QApplication.UnicodeUTF8))
        
        
        QtCore.QObject.connect(self.buttonBox, QtCore.SIGNAL("accepted()"), Dialog.accept)
        QtCore.QObject.connect(self.buttonBox, QtCore.SIGNAL("rejected()"), Dialog.reject)
        QtCore.QMetaObject.connectSlotsByName(Dialog)
        
    def add_didget(self,didget):
        self.value = self.value + str(didget)
        self.updateValue()
    
    def adddot(self): self.add_didget('.')
    def add0(self): self.add_didget(0)
    def add1(self): self.add_didget(1)
    def add2(self): self.add_didget(2)
    def add3(self): self.add_didget(3)
    def add4(self): self.add_didget(4)
    def add5(self): self.add_didget(5)
    def add6(self): self.add_didget(6)
    def add7(self): self.add_didget(7)
    def add8(self): self.add_didget(8)
    def add9(self): self.add_didget(9)
    
    def backspace(self):
        self.value = self.value[0:-1]
        self.updateValue()
        
    def updateValue(self):
        self.ed_value.setText(self.value)
        

class numpad(QtGui.QDialog,numpad_dialog):
    def __init__(self,parent=None):
        QtGui.QDialog.__init__(self,parent)
        self.setupUi(self)
        
    def getValues(self):
        self.value = self.ed_value.text()
        return float(self.value)
    
