class double_PRESERVE {
//keep internal variables protected
private:
	double value; //double this variable is storing
	bool locked;  //determines which function can set the (ovr-->manual, set-->controls/auto)

public:
	//constructors
  double_PRESERVE(const double& value_);
  
  //accessors
  double get_value();
  
  //modifiers
  bool set_value(const double& value_);
  bool ovr_value(const double& value_);
  
  
  bool lock();
  bool unlock();
};