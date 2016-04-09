#include "wiringPiI2C_mock.h"

int wiringPiI2CSetup (int devId){
  return 1;
}
int wiringPiI2CRead (int fd){
  return 1;
}
int wiringPiI2CWrite (int fd, int data){
  return 1;
}