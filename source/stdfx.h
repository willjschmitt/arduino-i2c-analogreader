#ifndef stdfx_h
#define stdfx_h

#include <iostream>
#include <wiringPi.h>
#include <time.h>

//define warning levels
//#define warn0 //typically always included in console programs
//#define warn1 //typically included for basic information
//#define warn2 //included as diagnostic/debugging. Very verbose

extern void ardprint(const char* printstring, const int newline);
extern void ardprint(const double printstring, const int newline);

extern int ardread();

extern double currenttime();

#endif //stdfx_h