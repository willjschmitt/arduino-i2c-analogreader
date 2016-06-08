#ifndef TMP36_h
#define TMP36_h

#include "ARD_Aread.h"

class TMP36{
private:
	int    fd;
	char   ain_pin;
	double aRef;

public:
	TMP36(const int& fd_, const char& ain_pin_, const double& aRef_);
	double read_temp();
};

#endif //TMP36_h
