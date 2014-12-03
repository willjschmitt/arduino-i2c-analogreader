#include "Tm1_BREWING.h"

/***********************************************************************
* Function: Tm1_BREWING
* Abstract:
***********************************************************************/
Tm1_BREWING::Tm1_BREWING(BREWERY_BUFFER** brewbuff_, const int& arduinofd_){
	//
	arduinofd = arduinofd_;
	
	//state machine initialization
	C_State = 0;
	C_State_t0 = 0.0;

	//initialize everything to off
	B_ElemStatus = 0;
	P1Status = 0;

	//temp settings
	M_MASHTEMP = 152.0; //in degreesF
	M_STRIKETEMP = 165.0; //in degreesF
	C_COOLTEMP = 75.0; //in degreesF

	//time settings
	MASH_TIME    = 2700.0;//in seconds
	MASHOUT_TIME = 900.0;//in seconds
	BOIL_TIME    = 2400.0;//in seconds

	//sensor vars
	B_Temp = 0.0;
	B_TempFil = 0.0;
	M_Temp = 0.0;
	M_TempFil = 0.0;
	B_RTD = new RTD_PT100(arduinofd,0,0.385,100.0,5.0,0.94,-16.0);
	M_RTD = new RTD_PT100(arduinofd,1,0.385,100.0,5.0,0.94,-9.0);

	//define number of steps for mash infusion
	M_NumSteps = 1;
	M_TEMPPROFILE = new double[2];

	//step1
	M_TEMPPROFILE[0 *2+0] = 0.0;
	M_TEMPPROFILE[0 *2+1] = 152.0;

	//permission variables
	requestpermission = 0;
	grantpermission   = 0;
	
	//you're sexy

	#ifdef warn2
	ardprint("Loading buffer...",0);
	#endif
	brewbuff = brewbuff_;
	#ifdef warn2
	ardprint("Done.",1);
	#endif
}

/***********************************************************************
* Function: void Tm1
* Abstract: This is the task1 control function. This updates all of the
*	sensors and counters. Evaluates controls loops. Add switching times
*	for pumps and elements
***********************************************************************/
void Tm1_BREWING::Tm1(double wtime_){
	wtime = wtime_;

	#ifdef warn2
  	ardprint("Checking Controls",1);
	#endif

/* Update Controls events in buffer */
	//get control time
	double ctrl_time; //holds current control time
	ctrl_time = (**brewbuff).get_next_time();
	#ifdef warn2
	ardprint("  CTRLTIME=",0);
	ardprint(ctrl_time,1);
	#endif
	//remove current event
	#ifdef warn2
	ardprint("  Removing current controls event...",0);
	#endif
	(*brewbuff) = (**brewbuff).remove_event();
	#ifdef warn2
	ardprint("Done.",1);
	#endif
	//insert new event
	#ifdef warn2
	ardprint("  Inserting new controls event...",0);
	#endif
	if ((*brewbuff) == NULL){//buffer is empty. need to create new buffer
		(*brewbuff) = new BREWERY_BUFFER(C_EVENT_CODE,0,ctrl_time+DelTm1);
		#ifdef warn2
		ardprint("Recreated Buffer.",0);
		#endif
	}
	else //buffer not empty. add normal event
		(**brewbuff).insert_event(C_EVENT_CODE,0,ctrl_time + DelTm1);
		#ifdef warn2
	ardprint("Done.",1);
	#endif
	#ifdef warn2
	(**brewbuff).print_buffer();
	#endif

/* Evaluate state of controls (mash, pump, boil, etc) */
	Tm1_state(); //determines state machine and overrides status of pumps and elements

/* Check Temperatures */
	#ifdef warn2
	ardprint("  Checking temperatures...",0);
	#endif
	B_Temp = (*B_RTD).read_temp();
	M_Temp = (*M_RTD).read_temp();
	#ifdef warn2
	ardprint("Done.",1);
	#endif

/* Controls Calculations for Mash Tun Element */
	if(C_State==C_STATE_MASH) Tm1_mash();

/* Controls Calculations for Boil Kettle Element */
	Tm1_boil();

/* Update Element Switching Events in Buffer*/
	#ifdef warn2
	ardprint("  Inserting Element Switching Events...",0);
	#endif
	if ((*brewbuff) == NULL){
		(*brewbuff) = new BREWERY_BUFFER(B_EVENT_CODE,TURNON*B_ElemStatus,ctrl_time);
		#ifdef warn2
		ardprint("Recreated Buffer.",0);
		#endif
	}
	else
		(*brewbuff) = (**brewbuff).insert_event(B_EVENT_CODE,TURNON*B_ElemStatus,ctrl_time);
	if ((*brewbuff) == NULL){
		(*brewbuff) = new BREWERY_BUFFER(B_EVENT_CODE,TURNOFF*B_ElemStatus,ctrl_time+(B_ElemModInd*DelTm1));
		#ifdef warn2
		ardprint("Recreated Buffer.",0);
		#endif
	}
	else
		(*brewbuff) = (**brewbuff).insert_event(B_EVENT_CODE,TURNOFF*B_ElemStatus,ctrl_time+(B_ElemModInd*DelTm1));
	#ifdef warn2
	ardprint("Done.",1);
	#endif

	#ifdef warn2
        (**brewbuff).print_buffer();
	#endif

/* Update Pump Switching Events in Buffer */
	#ifdef warn2
	ardprint("  Inserting Pump 1 Switching Event...",0);
	#endif
	if ((*brewbuff) == NULL){
		(*brewbuff) = new BREWERY_BUFFER(P1EVENT_CODE,P1Status,ctrl_time);
		#ifdef warn2
		ardprint("Recreated Buffer.",0);
		#endif
	}
	else
		(*brewbuff) = (**brewbuff).insert_event(P1EVENT_CODE,P1Status,ctrl_time);
	#ifdef warn2
	ardprint("Done.",1);
	#endif

	#ifdef warn2
	(**brewbuff).print_buffer();
	#endif

/* Print diagnotic information to terminal */

	#ifdef warn1
	ardprint("  B_Temp: ",0);
	ardprint(B_TempFil,0);
	ardprint("degF",0);

	ardprint("  M_Temp: ",0);
	ardprint(M_TempFil,0);
	ardprint("degF",0);

	ardprint("  B_TempSet: ",0);
	ardprint(B_TempSet,0);
	ardprint("degF",0);

	ardprint("  M_TempSet: ",0);
	ardprint(M_TempSet,0);
	ardprint("degF",1);
	#endif

	#ifdef warn2
	ardprint("End Controls Loop",1);
	#endif

	#ifdef simulator
	if (wtime<1000000){
		M_TempFil = 155.0;
		B_TempFil = 155.0;
	}
	else{
		M_TempFil = 0.0;
		B_TempFil = 0.0;
	}
	#endif
}
/***********************************************************************
* Function: void Tm1_state()
* Abstract: evaluates time and HMI commands to change or keep states
***********************************************************************/
void Tm1_BREWING::Tm1_state(){
	char serialread;
	int i;

	#ifdef warn2
  	ardprint("  Checking States...",0);
	#endif
	/*C_STATE_PRESTART - state where everything is off. waiting for user to
	  okay start of process after water is filled in the boil kettle/HLT*/
	if      (C_State==C_STATE_PRESTART){
		P1Status = 0;
		B_ElemStatus = 0;

		//keep integrators reset until needed
		B_TempErr_I = 0.0;
		M_TempErr_I = 0.0;

		#ifdef warn0
		ardprint("Waiting to start Pre Mash.",1);
		ardprint("Check that the boil kettle/HLT full?",1);
		ardprint("Hit any key to start.",1);
		#endif
		//serialread=ardread();
		serialread = grantpermission;
		if (serialread=='w') C_State++;
		//else if (serialread!=-1){
		else if (serialread==1){
			grantpermission = 0;
			#ifdef warn0
  			ardprint("Starting Pre Mash.",1);
			ardprint("Turning on Boil Element.",1);
			#endif

			//while(ardread()!=-1);

			C_State++;
			C_State_t0 = wtime;
		}
		else {
			requestpermission = 1;
		}
	}
	/*C_STATE_PREMASH - state where the boil element brings water up to
	  strike temperature*/
	else if (C_State==C_STATE_PREMASH){
		P1Status = 0;
		B_ElemStatus = 1;

		B_TempSet = M_STRIKETEMP;

		//serialread=ardread();
		serialread = grantpermission;
		if (B_TempFil > M_STRIKETEMP){
			#ifdef warn0
			ardprint("Strike water ready. Waiting to move water for strike.",1);
			ardprint("Hit any key to start.",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 1;

			//if (serialread!=-1){
			if (serialread==1){
				grantpermission = 0;
				#ifdef warn0
  				ardprint("Starting Transfer.",1);
				ardprint("Turning on Pump 1.",1);
				#endif

				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
			else{
				requestpermission = 1;
			}
		}
		else if (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
	}
	/*C_STATE_STRIKE - state where pump turns on to pump stike water into mash tun*/
	else if (C_State==C_STATE_STRIKE){
		P1Status = 1;
		B_ElemStatus = 1;

		B_TempSet = M_MASHTEMP;

		B_TempErr_I = 0.0;
		M_TempErr_I = 0.0;

		#ifdef warn0
		ardprint("If transfer done, hit any key to stop.",1);
		#endif
		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		//else if (serialread!=-1){
		else if (serialread==1){
			grantpermission = 0;
			#ifdef warn0
  			ardprint("Transfer Over. Rearrange hoses for mash.",1);
			ardprint("Turning pump 1 off.",1);
			ardprint("Turning element 1 on.",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 0;

			//while(ardread()!=-1);
			C_State++;
			C_State_t0 = wtime;
		}
		else{
			requestpermission=1;
		}
	}
	/*C_STATE_PREMASH - state where the boil element brings water up to
	  strike temperature*/
	else if (C_State==C_STATE_POSTSTRIKE){
		P1Status = 0;
		B_ElemStatus = 1;

		B_TempSet = M_MASHTEMP;

		//serialread=ardread();
		serialread = grantpermission;
		#ifdef warn0
		ardprint("Mash ready. Waiting for water to reheat and hose to be rearranged.",1);
		#endif

		P1Status = 0;
		B_ElemStatus = 1;

		if (B_TempFil > M_MASHTEMP){
			#ifdef warn0
			ardprint("Water ready. Waiting for hoses to be rearranged.",1);
			ardprint("Hit any key to start.",1);
			#endif
			//if (serialread!=-1){
			if (serialread==1){
				grantpermission = 0;
				#ifdef warn0
				ardprint("Starting Transfer.",1);
				ardprint("Turning on Pump 1.",1);
				#endif

				#ifdef warn0
				ardprint("Loading Buffer with Mash Profile.",1);
				#endif
				for ( i=0; i<M_NumSteps; i++)
					(*brewbuff) = (**brewbuff).insert_event(M_EVENT_CODE,(int)(M_TEMPPROFILE[i*2+1]),wtime+M_TEMPPROFILE[i*2]*1000.0*60.0);
				delete[] M_TEMPPROFILE;

				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
			else{
				requestpermission = 1;
			}
		}
		else if (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;

	}
	/*C_STATE_MASH - state where pump turns on and boil element adjusts HLT temp
	  to maintain mash temperature*/
	else if (C_State==C_STATE_MASH){
		P1Status = 1;
		B_ElemStatus = 1;

		M_TempSet = M_MASHTEMP;

		#ifdef warn0
		ardprint("Time left in Mash: ",0);
		ardprint((C_State_t0 + MASH_TIME*1000.0 - wtime)/(1000.0*60.0),1);
		#endif

		//serialread=ardread();
		serialread = grantpermission;
		if (wtime > C_State_t0 + MASH_TIME*1000.0){
			#ifdef warn0
  			ardprint("Mash done. Starting mashout.",1);
  			ardprint("Hit any key to continue.",1);
			#endif

			P1Status = 1;
			B_ElemStatus = 1;

			//if (serialread!=-1) // no command from user needed actually
			{
				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
		}
		else if (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
	}
/*C_STATE_MASHOUT - steps up boil temperature to 175degF and continues
	to circulate wort to stop enzymatic processes and to prep sparge water*/
	else if (C_State==C_STATE_MASHOUT){
		P1Status = 1;
		B_ElemStatus = 1;

		M_TempSet = 170.0;
		B_TempSet = 175.0;

		//serialread=ardread();
		serialread = grantpermission;
		if (B_TempFil > 170.0){
			#ifdef warn0
  			ardprint("Mashout in sufficient temperature zone.",1);
  			ardprint("Starting timer for mashout.",1);
			#endif

			P1Status = 1;
			B_ElemStatus = 1;

			//if (serialread!=-1) //don't need command, same setup
			{
				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
		}
		else if (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
	}
	/*C_STATE_MASHOUT2 - steps up boil temperature to 175degF and continues
	to circulate wort to stop enzymatic processes and to prep sparge water
	this continuation just forces an amount of time of mashout at a higher
	temp of wort*/
	else if (C_State==C_STATE_MASHOUT2){
		P1Status = 1;
		B_ElemStatus = 1;

		M_TempSet = 170.0;

		#ifdef warn0
		ardprint("Time left in Mashout: ",0);
		ardprint((C_State_t0 + MASHOUT_TIME*1000.0 - wtime)/(1000.0*60.0),1);
		#endif

		//serialread=ardread();
		serialread = grantpermission;
		if (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		else if (wtime > C_State_t0 + MASHOUT_TIME*1000.0){
			#ifdef warn0
  			ardprint("Mashout2 done. Stopping Pump.",1);
  			ardprint("Hit any key to continue.",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 0;

			//if (serialread!=-1){
			if (serialread==1){
				grantpermission = 0;
				#ifdef warn0
  				ardprint("Configure for sparging.",1);
				#endif

				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
		}
	}
	/*C_STATE_SPARGEPREP - prep hoses for sparge process */
	else if (C_State==C_STATE_SPARGEPREP){
		P1Status = 0;
		B_ElemStatus = 0;

		B_TempErr_I = 0.0;
		M_TempErr_I = 0.0;

		#ifdef warn0
		ardprint("When hoses have been rearranged for sparging, hit any key to continue.",1);
		#endif
		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		//else if (serialread!=-1){
		else if (serialread==1){
			grantpermission = 0;
			#ifdef warn0
  			ardprint("Starting sparge.",1);
			ardprint("Turning pump 1 on.",1);
			ardprint("Turning element 1 off.",1);
			#endif

			P1Status = 1;
			B_ElemStatus = 0;

			//while(ardread()!=-1);
			C_State++;
			C_State_t0 = wtime;
		}
		else{
			requestpermission = 1;
		}
	}
	/*C_STATE_SPARGE - slowly puts clean water onto grain bed as it is drained*/
	else if (C_State==C_STATE_SPARGE){
		P1Status = 1;
		B_ElemStatus = 0;

		B_TempErr_I = 0.0;
		M_TempErr_I = 0.0;

		#ifdef warn0
		ardprint("When sparge is over, hit any key to continue.",1);
		#endif
		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		//else if (serialread!=-1){
		else if (serialread==1){
			grantpermission = 0;
			#ifdef warn0
			ardprint("Configure for boil transfer.",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 0;

			//while(ardread()!=-1);
			C_State++;
			C_State_t0 = wtime;
		}
		else{
			requestpermission = 1;
		}
	}
	/*C_STATE_PREBOIL - turns of pump to allow switching of hoses for
	  transfer to boil as well as boil kettle draining*/
	else if (C_State==C_STATE_PREBOIL){
		P1Status = 0;
		B_ElemStatus = 0;

		B_TempErr_I = 0.0;
		M_TempErr_I = 0.0;

		#ifdef warn0
		ardprint("When hoses have been rearranged and boil kettle drained, hit any key to continue.",1);
		#endif
		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		//else if (serialread!=-1){
		else if (serialread==1){
			grantpermission = 0;
			#ifdef warn0
  			ardprint("Starting transfer.",1);
			ardprint("Turning pump 1 on.",1);
			ardprint("Turning element 1 off.",1);
			#endif

			P1Status = 1;
			B_ElemStatus = 0;

			//while(ardread()!=-1);
			C_State++;
			C_State_t0 = wtime;
		}
		else{
			requestpermission = 1;
		}
	}
	/*C_STATE_MASHTOBOIL - turns off boil element and pumps wort from
	  mash tun to the boil kettle*/
	else if (C_State==C_STATE_MASHTOBOIL){
		P1Status = 1;
		B_ElemStatus = 0;

		B_TempErr_I = 0.0;
		M_TempErr_I = 0.0;

		#ifdef warn0
		ardprint("When transfer is over, hit any key to continue.",1);
		#endif
		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		//else if (serialread!=-1){
		else if (serialread==1){
			grantpermission = 0;
			#ifdef warn0
  			ardprint("Transfer Over. Starting Boil.",1);
			ardprint("Turning pump 1 off.",1);
			ardprint("Turning element 1 on.",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 0;

			//while(ardread()!=-1);
			C_State++;
			C_State_t0 = wtime;
		}
		else{
			requestpermission = 1;
		}
	}
	/*C_STATE_BOILPREHEAT - heat wort up to temperature before starting to
	  countdown timer in boil. */
	else if (C_State==C_STATE_BOILPREHEAT){
		P1Status = 0;
		B_ElemStatus = 1;

		B_TempSet = B_BOILTEMP;

		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		else if (B_TempFil > B_TempSet - 10.0){
			#ifdef warn0
  			ardprint("Boil preheated. Starting Timer",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 1;

			//if (serialread!=-1)
			{
				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
		}
	}
	/*C_STATE_BOIL - state of boiling to bring temperature to boil temp
	  and maintain temperature for duration of boil*/
	else if (C_State==C_STATE_BOIL){
		P1Status = 0;
		B_ElemStatus = 1;

		B_TempSet = B_BOILTEMP;

		#ifdef warn0
		ardprint("Time left in Boil: ",0);
		ardprint((C_State_t0 + BOIL_TIME*1000.0 - wtime)/(1000.0*60.0),1);
		#endif

		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		else if (wtime > C_State_t0 + BOIL_TIME*1000.0){
			#ifdef warn0
  			ardprint("Boil Over.",1);
			ardprint("Turning boil element off.",1);
			ardprint("Hit any key to continue.",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 0;

			//if (serialread!=-1){
			if (serialread==1){
				grantpermission = 0;
				#ifdef warn0
  				ardprint("Starting cool down.",1);
				ardprint("Keeping Pump 1 off",1);
				#endif

				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
			else{
				requestpermission=1;
			}
		}
	}
	/*C_STATE_COOL - state of cooling boil down to pitching temperature*/
	else if (C_State==C_STATE_COOL){
		P1Status = 0;
		B_ElemStatus = 0;

		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		else if (B_TempFil < C_COOLTEMP){
			#ifdef warn0
  			ardprint("Wort cooled.",1);
			ardprint("Hit any key to continue.",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 0;

			//if (serialread!=-1){
			if (serialread==1){
				grantpermission = 0;
				#ifdef warn0
  				ardprint("Starting transfer to fermenter.",1);
				ardprint("Starting Pump 1",1);
				#endif

				//while(ardread()!=-1);
				C_State++;
				C_State_t0 = wtime;
			}
			else{
				requestpermission = 1;
			}
		}
	}
	/*C_STATE_PUMPOUT - state of pumping wort out into fermenter*/
	else if (C_State==C_STATE_PUMPOUT){
		P1Status = 1;
		B_ElemStatus = 0;

		#ifdef warn0
		ardprint("When transfer is done, hit any key to continue.",1);
		#endif
		//serialread=ardread();
		serialread = grantpermission;
		if      (serialread=='w') C_State++;
		else if (serialread=='s') C_State--;
		//else if (ardread()!=-1){
		else if (serialread==1){
			grantpermission = 0;
			#ifdef warn0
  			ardprint("Brew process over.",1);
			ardprint("Turning off pump 1",1);
			#endif

			P1Status = 0;
			B_ElemStatus = 0;

			//while(ardread()!=-1);
			C_State++;
			C_State_t0 = wtime;
		}
		else{
			requestpermission = 1;
		}
	}
	#ifdef warn2
	ardprint("Done.",1);
	#endif
}
/***********************************************************************
* Function: void Tm1_mash()
* Abstract: filters mash temperature measurement and pushes temp through
*	PI loop to evaluate temperature to set boil kettle/HLT to.
***********************************************************************/
void Tm1_BREWING::Tm1_mash(){
	#ifdef warn2
  	ardprint("  Evaluating mash tun controls...",0);
	#endif

	if (M_Temp >= 0.0)//ignore error values below 0.0
		M_TempFil += (M_Temp-M_TempFil)*(DelTm1/(M_WTempFil)); 	//first-order lag filter on Mash Temperature
	M_TempErr    = (M_TempSet - M_TempFil); 				// calculate error from Mash set point and mash filter temperature

	//Calculate Integral of error; if temperature has overshot, pull integral portion back FAST (there is no cooldown ability, so this is important)
	if (M_TempErr > 0.0) M_TempErr_I += (M_TempErr)*(DelTm1);
	else                 M_TempErr_I += 10.0*(M_TempErr)*(DelTm1);
	if      (M_TempErr_I > +1.0*M_TempErr_I_max) M_TempErr_I = +1.0*M_TempErr_I_max;
	else if (M_TempErr_I < -1.0*M_TempErr_I_max) M_TempErr_I = -1.0*M_TempErr_I_max;

	//Feedforward Mash temperature setpoint to boil then add Proportional and integral portions. Limit the boil setpoint to +/- the limiter around the Mash set point
	B_TempSet = M_TempSet + M_ElemKp*M_TempErr + M_ElemKi*M_TempErr_I;
	if      (B_TempSet > (M_TempSet + M_TempSet_max)) B_TempSet = M_TempSet + M_TempSet_max;
	else if (B_TempSet < (M_TempSet - M_TempSet_max)) B_TempSet = M_TempSet - M_TempSet_max;

	#ifdef warn2
	ardprint("Done.",1);
	#endif
}
/***********************************************************************
* Function: void Tm1_boil()
* Abstract: filters boil temperature measurement and pushes temp through
*	PI loop to evaluate duty cycle of boil kettle element
***********************************************************************/
void Tm1_BREWING::Tm1_boil(){
	#ifdef warn2
  	ardprint("  Evaluating boil kettle controls...",0);
	#endif

	if (B_Temp >= 0.0) //ignore error values below 0.0
		B_TempFil += (B_Temp-B_TempFil)*(DelTm1/(B_WTempFil));	//first-order lag filter on Boil Temperature
	B_TempErr    = (B_TempSet - B_TempFil);					//calculate error from boil set point and boil filtered temperature

	//if Boil temp is less than 15deg of the boil set point, disable the PI loop, and set the element duty cycle to 100%s
	if (B_TempErr > 15.0)
		B_ElemModInd = 1.0; //100% duty cycle for large error
	else{
		//Calculate Integral of error; if temperature has overshot, pull integral portion back FAST (there is no cooldown ability, so this is important)
		if (B_TempErr > 0.0) B_TempErr_I += (B_TempErr)*(DelTm1);
		else                 B_TempErr_I += 10.0*(B_TempErr)*(DelTm1);
		if      (B_TempErr_I > +1.0*B_TempErr_I_max) B_TempErr_I = +1.0*B_TempErr_I_max;
		else if (B_TempErr_I < -1.0*B_TempErr_I_max) B_TempErr_I = -1.0*B_TempErr_I_max;

		//calculate duty cycle/mod index/mod depth of Boil kettle element using proportional and integral gains
		B_ElemModInd = B_ElemKp*B_TempErr + B_ElemKi*B_TempErr_I;
	}

	//limit the boil kettle modulation index to between 0% and 100%
	if      (B_ElemModInd > 1.0) B_ElemModInd = 1.0;
	else if (B_ElemModInd < 0.0) B_ElemModInd = 0.0;

	#ifdef warn2
	ardprint("Done.",1);
	#endif
}
/***********************************************************************
* Function: void Tm1_BREWING::MashTemp_Update()
* Abstract: Changes the mash temperature setpoint when an infusion step
*			change interrupt occurs
***********************************************************************/
void Tm1_BREWING::MashTemp_Update(){
	double newmashtemp;
	newmashtemp = (double)((**brewbuff).get_next_act());

	#ifdef warn0
  	ardprint("Changing Mash Temperature to: ",0);
  	ardprint(newmashtemp,1);
  	#endif

	M_MASHTEMP = newmashtemp;

  	#ifdef warn2
	ardprint("  Removing current mash temp change event...",0);
	#endif
	(*brewbuff) = (**brewbuff).remove_event();
	#ifdef warn2
  	ardprint("Done.",1);
	#endif
}
double Tm1_BREWING::get_timeleft(){
	if      (C_State == C_STATE_MASH)    return (this->C_State_t0 + this->MASH_TIME*1000.0    - this->wtime)/(1000.0*60.0);
	else if (C_State == C_STATE_BOIL)    return (this->C_State_t0 + this->BOIL_TIME*1000.0    - this->wtime)/(1000.0*60.0);
	else if (C_State == C_STATE_MASHOUT) return (this->C_State_t0 + this->MASHOUT_TIME*1000.0 - this->wtime)/(1000.0*60.0);
	else return 0.0;
	
	
}