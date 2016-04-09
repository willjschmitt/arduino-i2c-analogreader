#ifndef wiringPiI2C_mock_h
#define wiringPiI2C_mock_h

int wiringPiI2CSetup (int devId);
int wiringPiI2CRead (int fd);
int wiringPiI2CWrite (int fd, int data);

#endif //wiringPiI2C_mock_h
