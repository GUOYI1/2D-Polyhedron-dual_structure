# Vector Utility
# Date: 13-01-09
# Written by Masoud Akbarzadeh
# Block Research Group ETH -/ ITA

import rhinoscriptsyntax as rs 
import math
import Rhino
#import numpy 
#import sys
#print sys.path
#import scipy



def VecUnitize(vec):
	# The Tolerance is 1.e-7
	if isinstance(vec,list)==False:
		vec=list(vec)
	length=math.sqrt(vec[0]*vec[0]+vec[1]*vec[1]+vec[2]*vec[2])
	if length>1.e-7:
		vec_unit=[vec[0]*1/length, vec[1]*1/length,vec[2]*1/length] 
		return vec_unit

def VecLength(vec):
	if isinstance(vec,list)==False:
		vec=list(vec)
	length=math.sqrt(vec[0]*vec[0]+vec[1]*vec[1]+vec[2]*vec[2])
	length=round(length,4)
	return length

def IsVecParallelTo(vec1,vec2):
	# Returns 1 if two Vectors are parallel
	# Returns -1 if two vectors are Anti-parallel
	# Returns 0 if else
	# Tolerance is 1 degree
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
		if isinstance(vec2,list)==False:
			vec2=list(vec2)
	vec1=VecUnitize(vec1)
	vec2=VecUnitize(vec2)
	if not vec1:
		print "vector not exist!"
	if not vec2:
		print "vector not exist"
	dot=VecDotProduct(vec1,vec2)
	dot=round(dot, 4)
	angle=math.acos(dot)
	angle=math.degrees(angle)
	if 179<angle<=180:
		a=-1 
		return a
	elif 0<=angle<1:
		a=1
		return a
	else: 
		a=0
		return a

def VecDotProduct(vec1,vec2):
	# Returns the Dot Product of Two Vectors
	# dot=vec1[0]*vec2[0]+vec1[1]*vec2[1]+vec1[2]*vec2[2]
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
	if isinstance(vec2,list)==False:
		vec2=list(vec2)
	dot=vec1[0]*vec2[0]+vec1[1]*vec2[1]+vec1[2]*vec2[2]
	dot=round(dot,4)
	return dot

def IsVecPerpendicularTo(vec1,vec2):
	# Returns True If The Vectors are perpendicular
	# Returns False else. 
	# The tolerance is 1 degree 89<angle<91. 
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
		if isinstance(vec2,list)==False:
			vec2=list(vec2)
	vec1=VecUnitize(vec1)
	vec2=VecUnitize(vec2)
	dot=VecDotProduct(vec1,vec2)
	dot=round(dot,4)
	angle=math.acos(dot)
	angle=math.degrees(angle)
	if 89<angle<91:
		a=True 
		return a
	else: 
		a=False
		return a

def PtAdd(vec1,vec2):
	# Adds a Vector to a point, or a point to another point
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
		if isinstance(vec2,list)==False:
			vec2=list(vec2)
	if (len(vec1) and len(vec2))==3:
		vec_sum=[vec1[0]+vec2[0],vec1[1]+vec2[1],vec1[2]+vec2[2]]
		return vec_sum

def VecAdd(vec1,vec2):
	# Adds a Vector to another Vector
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
		if isinstance(vec2,list)==False:
			vec2=list(vec2)
	if (len(vec1) and len(vec2))==3:
		vec_sum=[vec1[0]+vec2[0],vec1[1]+vec2[1],vec1[2]+vec2[2]]
		return vec_sum

def VecSubtract(vec1,vec2):
	# Subtarcts Vector2 from Vector1
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
		if isinstance(vec2,list)==False:
			vec2=list(vec2)
	if (len(vec1) and len(vec2))==3:
		vec_sum=[vec1[0]-vec2[0],vec1[1]-vec2[1],vec1[2]-vec2[2]]
		return vec_sum

def VecCreate(to_point,from_point):
	#Creates a vector from two 3d points
	if isinstance(to_point,list)==False:
		to_point=list(to_point)
		if isinstance(from_point,list)==True:
			from_point=list(from_point)
	if (len(to_point) and len(from_point))==3:
		vec_sum=[to_point[0]-from_point[0],to_point[1]-from_point[1],to_point[2]-from_point[2]]
		return vec_sum

def VecCrossProduct(vec1,vec2):
	# returns a Cross Product of Two vector
	# the right hand Order is based on vec1 -> vec2
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
		if isinstance(vec2,list)==False:
			vec2=list(vec2)
	if (len(vec1) and len(vec2))==3:
		cross=[vec1[1]*vec2[2]-vec1[2]*vec2[1],vec1[2]*vec2[0]-vec1[0]*vec2[2],vec1[0]*vec2[1]-vec1[1]*vec2[0]]
		return cross

def VecReverse(vec):
	# Reverses the Direction of a Vector
	if isinstance(vec,list)==False:
		vec=list(vec)
	vec_rev=[-1*vec[0],-1*vec[1],-1*vec[2]]
	return vec_rev

def VecRotate(vec,angle, axis):
	# Rotates a Vector around an axis
	# the Angle is in Degrees
	if isinstance(vec,list)==False:
		vec=list(vec)
	if isinstance(axis,list)==False:
		axis=list(axis)
	axis=VecUnitize(axis)
	a=math.cos(angle*math.pi/180)+axis[0]*axis[0]*(1-math.cos(angle*math.pi/180))
	b=axis[0]*axis[1]*(1-math.cos(angle*math.pi/180))-axis[2]*math.sin(angle*math.pi/180)
	c=axis[0]*axis[2]*(1-math.cos(angle*math.pi/180))+axis[1]*math.sin(angle*math.pi/180)
	d=axis[1]*axis[0]*(1-math.cos(angle*math.pi/180))+axis[2]*math.sin(angle*math.pi/180)
	e=math.cos(angle*math.pi/180)+axis[1]*axis[1]*(1-math.cos(angle*math.pi/180))
	f=axis[1]*axis[2]*(1-math.cos(angle*math.pi/180))-axis[0]*math.sin(angle*math.pi/180)
	g=axis[2]*axis[0]*(1-math.cos(angle*math.pi/180))-axis[1]*math.sin(angle*math.pi/180)
	h=axis[2]*axis[1]*(1-math.cos(angle*math.pi/180))+axis[0]*math.sin(angle*math.pi/180)
	i=math.cos(angle*math.pi/180)+axis[2]*axis[2]*(1-math.cos(angle*math.pi/180))
	r=[[a,b,c],[d,e,f],[g,h,i]]
	rot=[a*vec[0]+b*vec[1]+c*vec[2],d*vec[0]+e*vec[1]+f*vec[2],g*vec[0]+h*vec[1]+i*vec[2]]
	return rot

def VecAngle(vec1,vec2):
	# Returns the angle between two vectors
	if isinstance(vec1,list)==False:
		vec1=list(vec1)
		if isinstance(vec2,list)==False:
			vec2=list(vec2)
	vec1=VecUnitize(vec1)
	vec2=VecUnitize(vec2)
	dot=VecDotProduct(vec1,vec2)
	#dot=clamp(-1,1,dot)
	if dot>1:
		dot=1
	if dot<-1:
		dot=-1
	dot=round(dot,4)
	angle=math.acos(dot)
	angle=math.degrees(angle)
	angle=round(angle,4)
	return angle

def VecScale(vec,scale):
	# Scales a Vector With Scale factor
	if isinstance(vec,list)==False:
		vec=list(vec)
	vec=[vec[0]*scale,vec[1]*scale, vec[2]*scale]
	return vec

