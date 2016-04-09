#ifndef Tm2_FERMENTATION_h
#define Tm2_FERMENTATION_h


#include "TMP36.h"
#include "BREWERY_BUFFER.h"
#include "stdfx.h"
#include "globals.h"


//Tm1_BREWING class
class Tm2_FERMENTATION{
public:
	int arduinofd;
	
	double wtime;

	double  F_TempErr;
	double  F_TempErr_I;
	double  F_TempSet;
	double  F_CompStatus;

	int     F_NumSteps;
	double* F_TEMPPROFILE;


	//sensor vars
	double  F_Temp;
	double  F_TempFil;

	//RTD vars
	TMP36* F_TMP36;

	//reference to brewery buffer
	BREWERY_BUFFER** brewbuff;

	//functions
	Tm2_FERMENTATION(BREWERY_BUFFER** brewbuff_, const int& arduinofd_);
	void Tm2_FERMENTATION_EXE(double wtime_);
	int  request(char request);
	void command(char request, int command);
};

//control vars
#define F_TempErr_I_max 1000.0
#define F_ElemKp 0.5
#define F_ElemKi 0.005

//sensor vars
#define F_WTempFil 60.0

#endif //Tm2_FERMENTATION_h