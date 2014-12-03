/***********************************************************
* File: globals.h
* Author: Will Schmitt
* Created: 31 March 2014
* Modified: 04 July 2014
* Abstract: contains all global variables for brewery
*			control system.
* Variable Prefix Key:
*   B_ - boil
*   M_ - mash
************************************************************/
#ifndef globals_h
#define globals_h


//time vars
#define DelTm1 1.0  //defined in seconds

#define DelTm2 10.0 //defined in seconds

#define C_EVENT_CODE 1
#define B_EVENT_CODE 2
#define P1EVENT_CODE 3
#define M_EVENT_CODE 4
#define F_EVENT_CODE 5
#define FCEVENT_CODE 6

#define TURNON  HIGH
#define TURNOFF LOW

#define B_pin 0
#define P1pin 2
#define F_pin 3

#endif //globals_h