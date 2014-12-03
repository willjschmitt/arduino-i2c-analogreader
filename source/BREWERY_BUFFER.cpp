#include "BREWERY_BUFFER.h"

BREWERY_BUFFER::BREWERY_BUFFER(const int& event_type_, const int& event_act_, const double& event_time_){
	this->event_type = new int(event_type_);
	this->event_act  = new int(event_act_);
	this->event_time = new double(event_time_);

	this->next_action = NULL;
	this->last_action = NULL;
}

double BREWERY_BUFFER::get_next_time(){
	return *this->event_time;
}
int BREWERY_BUFFER::get_next_type(){
	return *this->event_type;
}
int BREWERY_BUFFER::get_next_act(){
	return *this->event_act;
}

BREWERY_BUFFER* BREWERY_BUFFER::insert_event(const int& event_type_, const int& event_act_, const double& event_time_){
	BREWERY_BUFFER* temp_buff;

#ifdef warn2
	ardprint("Inserting new event. ",0);
	ardprint(event_type_,0);
	ardprint(" ",0);
	ardprint(event_act_,0);
	ardprint(" ",0);
	ardprint(event_time_,0);
	ardprint("...",0);
#endif

	if (*this->event_time > event_time_){
#ifdef warn2
		ardprint(*this->event_time,0);
		ardprint(" ",0);
		ardprint(event_time_,0);
		ardprint(" Found it. Inserting before here.",0);
#endif
		temp_buff = new BREWERY_BUFFER(event_type_,event_act_,event_time_);

		temp_buff->last_action = this->last_action;
		temp_buff->next_action = this;

		if(this->last_action!=NULL) this->last_action->next_action = temp_buff;
		this->last_action = temp_buff;

		return this->last_action;
	}
	else if (this->next_action==NULL){
#ifdef warn2
		ardprint("End of chain. Inserting.",0);
#endif
		this->next_action = new BREWERY_BUFFER(event_type_,event_act_,event_time_);
		this->next_action->last_action = this;

		if (this->last_action==NULL) return this;
		else return this->last_action;
	}
	else{
#ifdef warn2
		ardprint("Not yet...",0);
#endif
		(*next_action).insert_event(event_type_,event_act_,event_time_);
		if (this->last_action==NULL) return this;
		else return this->last_action;
	}
}

BREWERY_BUFFER* BREWERY_BUFFER::remove_event(){
#ifdef warn2
	ardprint("Removing Buffer Item.",0);
	ardprint(*this->event_type,0);
	ardprint(" ",0);
	ardprint(*this->event_act,0);
	ardprint(" ",0);
	ardprint(*this->event_time,0);
	ardprint("...",0);
#endif

	if (this->next_action != NULL)
		(*this->next_action).last_action = NULL;
	else
#ifdef warn2
		ardprint("Be aware. At end of buffer.",0)
#endif
		;

	delete this->event_type;
	delete this->event_act;
	delete this->event_time;

#ifdef warn2
	ardprint("Done.",1);
#endif

	BREWERY_BUFFER* retact = this->next_action;
	delete this;
	return retact;
}
