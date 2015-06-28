template <class T>
class var_PRESERVE {
//keep internal variables protected
private:
	T value; //double this variable is storing
	bool locked;  //determines which function can set the (ovr-->manual, set-->controls/auto)

public:
	//constructors
	var_PRESERVE();
	var_PRESERVE(const T& value_);
  
	//accessors
	T    get_value();
	bool get_locked();
  
	//modifiers
	bool set_value(const T& value_);
	bool ovr_value(const T& value_);

	//arithmetic operators
	var_PRESERVE<T>&  operator=  (const T& value_);
	T                 operator+  (const T& value_);
	T                 operator-  (const T& value_);

	//logical operators
	bool              operator>  (const T& value_);
	bool              operator>  (const var_PRESERVE<T>& value_);

	bool              operator>= (const T& value_);
	bool              operator>= (const var_PRESERVE<T>& value_);

	bool              operator<  (const T& value_);
	bool              operator<  (const var_PRESERVE<T>& value_);

	bool              operator<= (const T& value_);
	bool              operator<= (const var_PRESERVE<T>& value_);


	bool lock();
	bool unlock();
};
