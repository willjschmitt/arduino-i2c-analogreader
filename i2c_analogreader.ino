#include <Wire.h>

#define SLAVE_ADDRESS 0x0A
#define analogbytes   2

int requested_analogpin = 0;
char bytewritten = 0;

unsigned int counts = 0;

void setup(){
  Wire.begin(SLAVE_ADDRESS);
  
  Wire.onReceive(receiveData);
  Wire.onRequest(sendData);
  
  Serial.begin(115200);
  Serial.println(F("Initialized."));
}

void loop(){
  //delay(1);
}

void receiveData(int byteCount){
  while(Wire.available()){
    requested_analogpin = Wire.read();
  }
  bytewritten=0;
  Serial.print  (F("Requesting pin: "));
  Serial.println(requested_analogpin);
}
void sendData(){
  char data_totransmit[2];
  
  counts = analogRead(requested_analogpin);
  
  Serial.print (F("Printing: "));
  Serial.print (counts);
  Serial.print (F(" "));
  for (int i=0; i<analogbytes; i++){
    Serial.print(int(data_totransmit[i]));
    Serial.print(F(" "));
  }
  for (int i=0; i<analogbytes; i++){
    data_totransmit[i] = (counts >> (i*8)) & 0x00FF;
  }
  Serial.println(F(""));
  

  if ((bytewritten >= 0) && (bytewritten <2)){
    Wire.write(data_totransmit[bytewritten]);
    bytewritten++;
  }
  //Wire.write(data_totransmit[1]);
  Serial.println(F("Done printing."));
}
