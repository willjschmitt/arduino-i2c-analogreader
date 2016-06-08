#ifndef BREWERY_BUFFER_h
#define BREWERY_BUFFER_h

#include <vector>
#include <iterator>
#include "stdfx.h"

class BREWERY_BUFFER{
public:
	int*    event_type;
	int*    event_act;
	double* event_time;

	BREWERY_BUFFER* next_action;
	BREWERY_BUFFER* last_action;

	BREWERY_BUFFER(const int& event_type_, const int& event_act, const double& event_time);
	double get_next_time();
	int get_next_type();
	int get_next_act();

	BREWERY_BUFFER* insert_event(const int& event_type_, const int& event_act, const double& event_time);
	BREWERY_BUFFER* remove_event();
	
	void print_buffer() { return; } //removed function but need to exist for legacy support
};

#endif //BREWERY_BUFFER_h
