#include "ARD_Aread.h"
int arduino_analogRead(const int& arduinofd, const int& analogPin){
	int result_buffer[2];
	unsigned int result;
	
	wiringPiI2CWrite(arduinofd,analogPin);
	//wiringPiI2CWrite(arduinofd,2);
	delay(10);
	
	//ardprint("Getting Analog Measure:",1);
	result = 0x0000;
	for ( int i=0; i<arduino_analogbytes; i++){
		result_buffer[i] = wiringPiI2CRead(arduinofd);
		if (result_buffer[i] < 0) return -1.0; //read error has occurred
		delay(10);
		result+= (char(result_buffer[i]) & 0x00FF) << (i*8);
		//ardprint(result_buffer[i],1);
	}
	//ardprint(result,1);
	
	return int(result);
}
