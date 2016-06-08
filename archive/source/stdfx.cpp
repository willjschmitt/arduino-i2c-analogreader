#include "stdfx.h"

void ardprint(const char* printstring, const int newline){
  std::cout << printstring;
  if (newline == 1) std::cout << std::endl;

}
void ardprint(const double printstring, const int newline){
  std::cout << printstring;
  if (newline == 1) std::cout << std::endl << std::flush;
}

int ardread(){
	char c;
	std::cin >> c;
	return int(c);
}

double currenttime(){
	time_t timer;
	
	time(&timer);
	return (double)(timer)*1000.0;	
}
