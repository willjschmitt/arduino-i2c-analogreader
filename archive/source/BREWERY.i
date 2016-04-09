/* BREWERY.i */
%module BREWERY
%{
#include "BREWERY.h"
%}
extern void setup();
extern void loop();
extern void stopControls();

extern double get_Tm1_BREWING_1_wtime();
extern double get_Tm1_BREWING_1_B_TempFil();
extern double get_Tm1_BREWING_1_B_TempSet();
extern bool   get_Tm1_BREWING_1_B_TempSet_lock();
extern double get_Tm1_BREWING_1_B_ElemModInd();
extern double get_Tm1_BREWING_1_M_TempFil();
extern double get_Tm1_BREWING_1_M_TempSet();
extern bool   get_Tm1_BREWING_1_M_TempSet_lock();
extern int    get_Tm1_BREWING_1_requestpermission();
extern int    get_Tm1_BREWING_1_C_State();
extern double get_Tm1_BREWING_1_timeleft();
extern bool   get_Tm1_BREWING_1_timeleft_lock();

extern void set_Tm1_BREWING_1_B_TempSet(const double& _in1);
extern void set_Tm1_BREWING_1_B_TempSet_lock(const bool& _in1);
extern void set_Tm1_BREWING_1_M_TempSet(const double& _in1);
extern void set_Tm1_BREWING_1_M_TempSet_lock(const bool& _in1);
extern void set_Tm1_BREWING_1_grantpermission(const int& _in1);
extern void set_Tm1_BREWING_1_C_State(const int& _in1);
extern void set_Tm1_BREWING_1_timeleft(const double& newtime);
extern void set_Tm1_BREWING_1_timeleft_lock(const bool& lock);