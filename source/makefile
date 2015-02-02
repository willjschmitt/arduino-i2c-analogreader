#
# 'make depend' uses makedepend to automatically generate dependencies 
#               (dependencies are added to end of Makefile)
# 'make'        build executable file 'mycc'
# 'make clean'  removes all .o and executable files
#

# define the compiler variables
CC = g++
CFLAGS = -Wall -g -fPIC
INCLUDES = -I/usr/include/python2.7

#define the linker variables
LC = g++
LFLAGS = -shared
LLIBS = -lwiringPi

# define the C source files
CSRCS = \
	BREWERY_wrap.c

CPPSRCS = \
	ARD_Aread.cpp \
	BREWERY.cpp \
	BREWERY_BUFFER.cpp \
	RTD_PT100.cpp \
	stdfx.cpp \
	Tm1_BREWING.cpp \
	Tm2_FERMENTATION.cpp \
	TMP36.cpp

CTESTENVSRCS = 

CPPTESTENVSRCS = \
	wiringPi_mock.cpp \
	wiringPiI2C_mock.cpp
	
	
ifneq (,$(findstring noRPi,$(MAKEFLAGS)))
	CSRCS = $(join $(CSRCS),$(CTESTENVSRCS))
	CPPSRCS = $(join $(CPPSRCS),$(CPPTESTENVSRCS))
	CFLAGS = $(join $(CFLAGS),-DnoRPi)
endif

# define the C object files 
#
# This uses Suffix Replacement within a macro:
#   $(name:string1=string2)
#         For each word in 'name' replace 'string1' with 'string2'
# Below we are replacing the suffix .c of all words in the macro SRCS
# with the .o suffix
#
COBJS   = $(CSRCS:.c=.o)
CPPOBJS = $(CPPSRCS:.cpp=.o)


# define the executable file 
BINARY = _BREWERY.so

#
# The following part of the makefile is generic; it can be used to 
# build any executable just by changing the definitions above and by
# deleting dependencies appended to the file from 'make depend'
#

.PHONY: clean intall

all:    $(BINARY)
	@echo !--Make - Brewery build successful
	

$(BINARY): $(CPPOBJS) $(COBJS)
	@echo !--Link - Linking into shared library
	$(LC) $(LFLAGS) -o $(BINARY) $(COBJS) $(CPPOBJS) $(LIBS)

# this is a suffix replacement rule for building .o's from .c's
# it uses automatic variables $<: the name of the prerequisite of
# the rule(a .c file) and $@: the name of the target of the rule (a .o file) 
# (see the gnu make manual section about automatic variables)
.c.o: $<
	$(CC) $(CFLAGS) $(INCLUDES) -c $<  -o $@

.cpp.o: $<
	$(CC) $(CFLAGS) $(INCLUDES) -c $<  -o $@
	
BREWERY_wrap.c: BREWERY.i
	@echo !--SWIG - Creating Python interface
	swig -python BREWERY.i

clean:
	$(RM) *.o *.so *~ BREWERY_wrap.c

install:
	@echo !--Install - Moving module into parent directory
	mv _BREWERY.so ../
	mv BREWERY.py ../
