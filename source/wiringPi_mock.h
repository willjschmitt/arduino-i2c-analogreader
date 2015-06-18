#ifndef wiringPi_mock_h
#define wiringPi_mock_h

int wiringPiSetup (void);
void pinMode (int pin, int mode);
void digitalWrite (int pin, int value);

void delay (unsigned int howLong);

#define OUTPUT 1
#define INPUT  0

#define HIGH 1
#define LOW  0

#endif //wiringPi_mock_h
