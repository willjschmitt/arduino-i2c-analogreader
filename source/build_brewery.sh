#/bin/bash

echo "Creating interface code for Python..."
swig -python BREWERY.i
echo "Compiling C/C++ Code..."
g++ -c *.cpp *.c -I/usr/include/python2.7
echo "Linking objects into Python Library..."
g++ -shared *.o -o _BREWERY.so -lwiringPi
echo "Moving library to parent directoy..."
mv _BREWERY.so ../
mv BREWERY.py ../
echo "Done."

