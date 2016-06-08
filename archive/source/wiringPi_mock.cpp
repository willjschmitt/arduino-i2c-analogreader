#include "wiringPi_mock.h"

#include <unistd.h>

int wiringPiSetup (void){
  return 1;
}
void pinMode (int pin, int mode){
  return;
}
void digitalWrite (int pin, int value){
  return;
}
void delay (unsigned int howLong){
  usleep( howLong * 1000 );
  return;
}
