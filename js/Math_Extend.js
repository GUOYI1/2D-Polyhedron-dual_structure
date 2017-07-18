//This file includes some useful mathematical solutions that can be used in WebGL.Three.js and numeric.js need to be included
function Line_intersection(A1,B1,C1,A2,B2,C2)
{
	//A1X+B1Y+C1=A2X+B2Y+C2
	var x=numeric.solve([[A1,B1],[A2,B2]],[-C1,-C2]);
	return x;
}