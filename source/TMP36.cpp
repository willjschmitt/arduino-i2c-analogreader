#include "TMP36.h"

TMP36::TMP36(const int& fd_, const char& ain_pin_, const double& aRef_){
	fd      = fd_;
	ain_pin = ain_pin_;
	aRef    = aRef_;
}

double TMP36::read_temp(){
	unsigned int counts;
	double Vmeas;
	double temp;

	counts = arduino_analogRead(fd,ain_pin);
	Vmeas  = aRef*(double(counts)/double(1024));
	temp = 100.0*Vmeas - 50.0;
	temp = temp*(9.0/5.0) + 32.0;

	return temp;
}
