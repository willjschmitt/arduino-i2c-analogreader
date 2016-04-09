#ifndef RTD_PT100_h
#define RTD_PT100_h

#include "ARD_Aread.h"

class RTD_PT100{
private:
	char   ain_pin;
	int    fd;
	double alpha;
	double zeroR;
	double aRef;
	double k;
	double c;

public:
	RTD_PT100(const int& fd, const char& ain_pin_, const double& alpha_, const double& zeroR_, const double& aRef_, const double& k_, const double c_);
	double read_temp();
};

#endif //RTD_PT100_h