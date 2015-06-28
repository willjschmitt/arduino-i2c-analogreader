#include "var_PRESERVE.h"

//constructors
template <class T> var_PRESERVE<T>::var_PRESERVE(){
	value = (T)0;
	locked = false;
}

template <class T> var_PRESERVE<T>::var_PRESERVE(const T& value_){
	value = value_;
	locked = false;
}

//accessors
template <class T> T var_PRESERVE<T>::get_value(){
  return value;
}
template <class T> bool var_PRESERVE<T>::get_locked(){
  return locked;
}

//modifiers
template <class T> bool var_PRESERVE<T>::set_value(const T& value_){
  if(!locked){
    value = value_;
    return true;
  }
  else
    return false;
}

template <class T> bool var_PRESERVE<T>::ovr_value(const T& value_){
  value = value_;
  locked = true;

  return true;
}

//arithmetic operators
template <class T> var_PRESERVE<T>&  var_PRESERVE<T>::operator= (const T& value_){
	if (!locked){
		this->value = value_;
		return *this;
	}
	else
		return *this;
}

template <class T> T  var_PRESERVE<T>::operator+ (const T& value_){
	return this->value + value_;
}

template <class T> T  var_PRESERVE<T>::operator- (const T& value_){
	return this->value - value_;
}

//logical operators
template <class T> bool var_PRESERVE<T>::operator< (const T& value_){
	if (this->value < value_) return true;
	else                      return false;
}
template <class T> bool var_PRESERVE<T>::operator< (const var_PRESERVE<T>& value_){
	if (this->value < value_.value) return true;
	else                             return false;
}

template <class T> bool var_PRESERVE<T>::operator<= (const T& value_){
	if (this->value <= value_) return true;
	else                      return false;
}
template <class T> bool var_PRESERVE<T>::operator<= (const var_PRESERVE<T>& value_){
	if (this->value <= value_.value) return true;
	else                             return false;
}

template <class T> bool var_PRESERVE<T>::operator> (const T& value_){
	if (this->value > value_) return true;
	else                      return false;
}
template <class T> bool var_PRESERVE<T>::operator> (const var_PRESERVE<T>& value_){
	if (this->value > value_.value) return true;
	else                             return false;
}

template <class T> bool var_PRESERVE<T>::operator>= (const T& value_){
	if (this->value >= value_) return true;
	else                      return false;
}
template <class T> bool var_PRESERVE<T>::operator>= (const var_PRESERVE<T>& value_){
	if (this->value >= value_.value) return true;
	else                             return false;
}

//locking functions
template <class T> bool var_PRESERVE<T>::lock(){
  locked=true;
  return locked;
}
template <class T> bool var_PRESERVE<T>::unlock(){
  locked=false;
  return locked;
}

template class var_PRESERVE<int>;
template class var_PRESERVE<double>;
