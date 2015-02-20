#ifndef ARD_Aread_h
#define ARD_Aread_h

#ifndef noRPi
#include <wiringPiI2C.h>
#else
#include "wiringPiI2C_mock.h"
#endif

#include "stdfx.h"

#define arduino_I2Caddress  0x0A
#define arduino_analogbytes 2

int arduino_analogRead(const int& arduinofd, const int& analogPin);

#endif //ARD_Aread_h