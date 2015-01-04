#include double_PRESERVE.h"

//constructors
double_PRESERVE::double_PRESERVE(const double& value_){
	value = value_;
	locked = true;
}

//accessors
double double_PRESERVE::get_value(){
  return value;
}

//modifiers
bool double_PRESERVE::set_value(const double& value_){
  if(locked==true){
    value = value_;
    return true;
  }
  else
    return false;
}
bool double_PRESERVE:ovr_value(const double& value_){
  if(locked==false){
    value = value_;
    return true;
  }
  else
    return false;
}

//locking functions
bool double_PRESERVE::lock(){
  locked=true;
  return locked;
}
bool double_PRESERVE::unlock(){
  locked=false;
  return locked;
}
