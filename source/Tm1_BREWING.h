#ifndef Tm1_BREWING_h
#define Tm1_BREWING_h

#include "var_PRESERVE.h"
#include "RTD_PT100.h"
#include "BREWERY_BUFFER.h"
#include "stdfx.h"
#include "globals.h"

//function prototypes
void Tm1();
void Tm1_state();
void Tm1_mash();
void Tm1_boil();

//Tm1_BREWING class
class Tm1_BREWING{
public:
	int arduinofd;

	int C_State;
	double C_State_t0;
	double wtime;

	double  B_TempErr;
	double  B_TempErr_I;
	var_PRESERVE <double> B_TempSet;
	double  B_ElemStatus;
	double  B_ElemModInd;
	double  M_TempErr;
	double  M_TempErr_I;
	var_PRESERVE <double>  M_TempSet;
	int     P1Status;
	double  M_MASHTEMP; //in degreesF
	double  M_STRIKETEMP; //in degreesF
	double  C_COOLTEMP; //in degreesF

	var_PRESERVE <double> timer_time;
	double  MASH_TIME;		//in seconds
	double  BOIL_TIME;		//in seconds
	double  MASHOUT_TIME;	//in seconds

	int     M_NumSteps;
	double* M_TEMPPROFILE;


	//sensor vars
	double  B_Temp;
	double  B_TempFil;
	double  M_Temp;
	double  M_TempFil;

	//RTD vars
	RTD_PT100* B_RTD;
	RTD_PT100* M_RTD;

	//Action Request variables
	int	requestpermission;
	int	grantpermission;

	//reference to brewery buffer
	BREWERY_BUFFER** brewbuff;

	//functions
	Tm1_BREWING(BREWERY_BUFFER** brewbuff_, const int& arduinofd_);
	void Tm1(double wtime_);
	void Tm1_state();
	void Tm1_mash();
	void Tm1_boil();
	void MashTemp_Update();

	//get functions
	double get_wtime();
	double get_B_TempFil();
	double get_B_TempSet();
	bool   get_B_TempSet_lock();
	double get_B_ElemModInd();
	double get_M_TempFil();
	double get_M_TempSet();
	bool   get_M_TempSet_lock();
	int    get_requestpermission();
	int    get_C_State();
	double get_timeleft();
	bool   get_timeleft_lock();

	//set functions
	void set_B_TempSet(const double& _in1);
	void set_B_TempSet_lock(const bool& _in1);
	void set_M_TempSet(const double& _in1);
	void set_M_TempSet_lock(const bool& _in1);
	void set_grantpermission(const int& _in1);
	void set_C_State(const int& _in1);
	void set_timeleft(const double& newtime);
	void set_timeleft_lock(const bool& lock);
};


//state machine
#define C_STATE_PRESTART     0
#define C_STATE_PREMASH      1
#define C_STATE_STRIKE       2
#define C_STATE_POSTSTRIKE   3
#define C_STATE_MASH         4
#define C_STATE_MASHOUT      5
#define C_STATE_MASHOUT2     6
#define C_STATE_SPARGEPREP   7
#define C_STATE_SPARGE       8
#define C_STATE_PREBOIL      9
#define C_STATE_MASHTOBOIL   10
#define C_STATE_BOILPREHEAT  11
#define C_STATE_BOIL         12
#define C_STATE_COOL         13
#define C_STATE_PUMPOUT      14

//control vars
#define B_TempErr_I_max 1000.0
#define B_BOILTEMP 196.5
#define B_ElemKp 0.05
#define B_ElemKi 0.0010
#define M_TempSet_max 30.0 //max of 30.0 deg more than M_TempSet to be applied to the boil
#define M_TempErr_I_max 6000.0//30.0/0.005 (no more than 30deg contribute from Integral portion)
#define M_ElemKp 1.0
#define M_ElemKi 0.01


//sensor vars
#define B_WTempFil 10.0
#define M_WTempFil 10.0


#endif //Tm1_BREWING_h
