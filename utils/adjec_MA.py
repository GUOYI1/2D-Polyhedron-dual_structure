# Adjacency-commands
# Date: 14-06-02
# Written by Masoud Akbarzadeh


import rhinoscriptsyntax as rs 
import math
import Rhino
import pointvector_MA as ma
#import numpy 
#import sys
#print sys.path
#import scipy
import copy
import operator
from operator import mul
"""
import sys

sys.path.append(r'c:\Program Files (x86)\IronPython 2.7') 
sys.path.append(r'c:\Program Files (x86)\IronPython 2.7\DLLs')
sys.path.append(r'c:\Program Files (x86)\IronPython 2.7\Lib')
sys.path.append(r'c:\Program Files (x86)\IronPython 2.7\Lib\site-packages')

import clr
clr.AddReference("mtrand")
import numpy as np
from numpy import matrix
"""

def NodeCoord(brn):
    # This command receives curves as lines 
    # and extract its start and end points 
    # and returns a dictionary including all the 
    # coordinates of the nodes in of the input branches 
    nodes={}
    j=0
    k=0
    for i in range(len(brn)):
        pt1=rs.CurveStartPoint(brn[i])
        pt1=[round(x,3) for x in pt1] 
        if pt1 not in nodes.values():
            nodes[j]=pt1
            j=j+1
        pt2=rs.CurveEndPoint(brn[i])
        pt2=[round(x,3) for x in pt2]
        if not pt2 in nodes.values():
            nodes[j]=pt2
            pt2=rs.CurveEndPoint(brn[i])
            j=j+1
            
    return nodes

def AdjecNodes(nodes, brn):
    # This function finds the adjacent nodes for a node
    # The branches are entered as a list of lines
    #branch={}
    k=0
    edge_dir = []
    edge_name = {}
    for i in range(len(brn)):
        pt1=rs.CurveStartPoint(brn[i])
        pt1=[round(x,3) for x in pt1]
        pt2=rs.CurveEndPoint(brn[i])
        pt2=[round(x,3) for x in pt2]
        for keys,values in nodes.items():
            if pt1==values:
                pt_1=keys
        for keys,values in nodes.items():
            if pt2==values:
                pt_2=keys
        edge_dir.append([pt_1,pt_2])
        edge_dir.append([pt_2,pt_1])
        edge_name[(pt_2,pt_1)] = brn[i]
        edge_name[(pt_1,pt_2)] = brn[i]
        k=k+1
    
    adjec_list={}
    for keys,values in nodes.items():
        adjec_list[keys]=[]
        for group in edge_dir:
            if keys in group:
                n=group.index(keys)
                if n==0:
                    if group[1] not in adjec_list[keys]:
                        adjec_list[keys].append(group[1])
                if n==1:
                    if group[0] not in adjec_list[keys]:
                        adjec_list[keys].append(group[0])
    return [adjec_list,edge_dir, edge_name] 

def BreathFirstSearch(list_of_pairs):
    # list_of_items : includes the list of edge pairs
    # such as [[[2,3], [3,4]], ...
    def RecursiveSearch(edg,target_list, the_list):
        for group in the_list:
            #print group 
            if edg in group:
                #print "edge", edge
                for i in group:
                    if i not in target_list:
                        target_list.append(i)
                        #print "i", i
                        RecursiveSearch(i,target_list, the_list)
        #print "target_list", target_list
        return target_list
    
    
    list_of_items =[]
    for group in list_of_pairs:
        for item in group:
            if item not in list_of_items:
                list_of_items.append(item)
    
    all_lists =[]
    for edge in list_of_items:
        new_list = []
        list_new = RecursiveSearch(edge,new_list,list_of_pairs)
        if new_list:
            if new_list not in all_lists:
                all_lists.append(new_list)
                
    edge_list = []
    
    for group in all_lists:
        group.sort()
        if group not in edge_list:
            edge_list.append(group)
            
    return edge_list

def HalfEdgeData(ln, it, pr):
    # ln : the lines of the graph as input
    # it: if 1: It will draw the closed loops of polygons
    brn={}
    for i in range(len(ln)):
	    brn[i]=ln[i]
    
    # the following lines of code gives me the coordinates of the points
    nodes={}
    nodes = NodeCoord(brn)
    if pr ==1:
        print "nodes", nodes
    
    
    # Here I can get the adjacency list for each point
    new_list = AdjecNodes(nodes,brn)
    adjec_list = new_list[0]
    if pr ==1:
        print "adjec_list", adjec_list
    
    # I can also get the all edges in both directions 
    edge_list = new_list[1]
    if pr ==1:
        print "edge_list", edge_list

    def PtScaler(k,pt):
        vec = ma.VecCreate(nodes[pt], nodes[k])
        vec = ma.VecUnitize(vec)
        new_pt = ma.PtAdd(nodes[k], vec)
        return new_pt

    def point_on_plane_sort(pts):
        list1=[]
        if len(pts)>2:
        	cent=points_barr(pts)
        	cent_move = [cent[0], cent[1], cent[2]+1]
        	normal = ma.VecCreate(cent_move, cent)
        	vecttest=ma.VecCreate(nodes[pts[0]],cent)
        	vecttest=ma.VecRotate(vecttest,2,normal)
        	angle={}
        	for j in pts:
        		#if j !=pts[0]:
        			vect_t=ma.VecCreate(nodes[j],cent)
        			vectn2=ma.VecCrossProduct(vecttest,vect_t)
        			#print "vec2", vectn2
        			vectn2=ma.VecUnitize(vectn2)
        			res=ma.VecDotProduct(vectn2,normal)
        			#print res
        			if res<0:
        				angle[j] = 2*180 - ma.VecAngle(vecttest,vect_t)
        			else:
        				angle[j]=ma.VecAngle(vecttest,vect_t)
        	#print angle
        	just_angle=[]
        	for s in angle.values():
        		just_angle.append(s)
        	#print just_angle
        	just_angle.sort()
        	#min_ang=min(just_angle)
        	for l in range(len(just_angle)):
        		for keys,values in angle.items():
        			if just_angle[l]==angle[keys]:
        			    if keys not in list1:
        				    list1.append(keys)
        	return list1
        else:
            return pts

    def point_on_plane_sort_cent(k,pts):
        nodes_moved ={}
        for pt in pts:
            nodes_moved[pt]=PtScaler(k, pt)
        #print nodes_moved
        list1=[]
        all_pts = []
        all_pts.append(nodes[k])
        for pt in nodes_moved.keys():
            all_pts.append(nodes_moved[pt])
        #print "all_pts", all_pts
        only_pts=[]
        for pt in nodes_moved.keys():
            only_pts.append(nodes_moved[pt])
        
        if len(pts)>2:
        	cent1=points_barr_val(only_pts)
        	cent = points_barr_val(all_pts)
        	motion = rs.VectorCreate(cent1, cent)
        	motion = ma.VecUnitize(motion)
        	motion = ma.VecScale(motion, 0.04)
        	new_cent = ma.PtAdd(cent, motion)
        	cent_move = [new_cent[0], new_cent[1], new_cent[2]+1]
        	normal = ma.VecCreate(cent_move, cent)
        	vecttest=ma.VecCreate(nodes[pts[0]],cent)
        	vecttest=ma.VecRotate(vecttest,2,normal)
        	angle={}
        	for j in pts:
        		#if j !=pts[0]:
        			vect_t=ma.VecCreate(nodes[j],cent)
        			vectn2=ma.VecCrossProduct(vecttest,vect_t)
        			#print "vec2", vectn2
        			vectn2=ma.VecUnitize(vectn2)
        			res=ma.VecDotProduct(vectn2,normal)
        			#print res
        			if res<0:
        				angle[j] = 2*180 - ma.VecAngle(vecttest,vect_t)
        			else:
        				angle[j]=ma.VecAngle(vecttest,vect_t)
        	#print angle
        	just_angle=[]
        	for s in angle.values():
        		just_angle.append(s)
        	#print just_angle
        	just_angle.sort()
        	#min_ang=min(just_angle)
        	for l in range(len(just_angle)):
        		for keys,values in angle.items():
        			if just_angle[l]==angle[keys]:
        			    if keys not in list1:
        				    list1.append(keys)
        	return list1
        else:
            return pts

    def points_barr(pt_list):
    	x=[]
    	y=[]
    	z=[]
    	for j in pt_list:
    		x.append(nodes[j][0])
    		y.append(nodes[j][1])
    		z.append(nodes[j][2])
    	sumx=sum(x)/len(x)
    	sumy=sum(y)/len(y)
    	sumz=sum(z)/ len(z)
    	centroid=[sumx,sumy,sumz]
    	return centroid
    
    def points_barr_val(pt_list):
    	x=[]
    	y=[]
    	z=[]
    	for j in pt_list:
    		x.append(j[0])
    		y.append(j[1])
    		z.append(j[2])
    	sumx=sum(x)/len(x)
    	sumy=sum(y)/len(y)
    	sumz=sum(z)/ len(z)
    	centroid=[sumx,sumy,sumz]
    	return centroid
    
    
    # Now I would like to have sorted adjec list
    sorted_points_around_a_node ={}
    for keys, values in adjec_list.items():
        
        rs.AddTextDot(str(keys), nodes[keys])
        sorted_points_around_a_node[keys] = point_on_plane_sort_cent(keys,values)
        # Here I need to make a closed loop so I add the first element of each list 
        # to the end of the lists
        sorted_points_around_a_node[keys].append(sorted_points_around_a_node[keys][0])
    if pr ==1:
        print "sorted_points_around_a_node", sorted_points_around_a_node
    
    # Now I need to find the edges with their direction
    group_of_edge = []
    for k, v in sorted_points_around_a_node.items():
        #list = []
        for i in range(len(v)-1):
            list_1 =[v[i],k]
            list_2 =[k, v[i+1]]
            group = [list_1, list_2]
            group_of_edge.append(group)
    
    if pr ==1:
        print "group_of_edge", group_of_edge
    
    # each two edges is connected to a face therefore
    # lets assign each group a face but first we can find all the 
    # edges that share the same face
    
    face_not_sort = BreathFirstSearch(group_of_edge)
    
    # here I want to sort the points around a face
    face_sorted = {}
    for i in range(len(face_not_sort)):
        new_list = []
        for pair in face_not_sort[i]:
            for p in pair:
                if p not in new_list:
                    new_list.append(p)
        #print new_list
        new_sorted = point_on_plane_sort(new_list)
        face_sorted[i] = new_sorted
    if pr ==1:
        print "face_sorted", face_sorted
    if it ==1:
        lines = []
        for k, v in face_sorted.items():
            new_points =[]
            for p in v:
                new_points.append(nodes[p])
            new_points.append(new_points[0])
            rs.AddLayer("Closed Polygons", [0,140, 140])
            rs.CurrentLayer("Closed Polygons")
            rs.AddPolyline(new_points)
    return face_sorted

def LaplacianSmoothing(ln, fixed_pt, tol, it, pr):
    #
    # tol: is the tolearnce for the relaxation process
    # it: if 1: the iteration process is drawn 
    #     if 0: Only the relaxed part is drawn
    #     if 2: the iteration process is drawn but the lines will be deleted
    brn={}
    for i in range(len(ln)):
        brn[i]=ln[i]
    
    nodes = NodeCoord(brn)
    if pr ==1:
        print "nodees", nodes
    
    adjec_nodes = AdjecNodes(nodes, brn)[0]
    if pr ==1:
        print "adjec_nodes", adjec_nodes
    
    edge_list = AdjecNodes(nodes, brn)[1]
    if pr ==1:
        print "edge_list", edge_list
    
    edge_list_new = []
    for pair in edge_list:
        pair.sort()
        if pair not in edge_list_new:
            edge_list_new.append(pair)
    if pr == 1:
        print "edge_list_new", edge_list_new
    # Here I put the nodes with a reduced tolerance
    # in a list
    if fixed_pt:
        fixed_nodes = []
        for p in fixed_pt:
            pt1 = rs.PointCoordinates(p)
            pt = [round(x,3) for x in pt1]
            fixed_nodes.append(pt)
    
    # Here I check for the condition of nodes 
    # and make sure that they are fixed or not
    nodes_fixed =[]
    for k, v in nodes.items():
        if v in fixed_nodes:
            #print k
            rs.AddTextDot(str(k), v)
            nodes_fixed.append(k)
    print "nodes_fixed", nodes_fixed
    
    
    # Here The process of smoothening starts
    def Process():
        
        def points_barr(pt_list):
        	x=[]
        	y=[]
        	z=[]
        	for j in pt_list:
        		x.append(nodes[j][0])
        		y.append(nodes[j][1])
        		z.append(nodes[j][2])
        	sumx=sum(x)/len(x)
        	sumy=sum(y)/len(y)
        	sumz=sum(z)/ len(z)
        	centroid=[sumx,sumy,sumz]
        	return centroid
    	
        nodes_new={}
        for k,v in nodes.items():
            #print "adjec_nodes[k]",  adjec_nodes[k]
            if k not in nodes_fixed:
                #print adjec_nodes[k]
                cent = points_barr(adjec_nodes[k])
                nodes_new[k] = cent
            else:
                nodes_new[k] = nodes[k]
        all_dist = []
        for k,v in nodes.items():
            dist =rs.Distance(nodes[k], nodes_new[k])
            all_dist.append(dist)
        max_dist = max(all_dist)
        if max_dist> tol:
            for k, v in nodes.items():
                nodes[k] = nodes_new[k]
            if it == 2:
                rs.AddLayer("Iterations", [255,255,255])
                rs.CurrentLayer("Iterations")
                lines =[]
                for pair in edge_list:
                    lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
                rs.DeleteObjects(lines)
            if it == 1:
                rs.AddLayer("Iterations", [255,255,255])
                rs.CurrentLayer("Iterations")
                lines =[]
                for pair in edge_list:
                    lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
            Process()
        else:
            rs.AddLayer("Relaxed", [0,0,255])
            rs.CurrentLayer("Relaxed")
            lines =[]
            for pair in edge_list:
                lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
            return nodes
    new_nodes =Process()
    return new_nodes

def ValueUnitizer(orig_val, orig_list, unit_list):
    # orig_list = [min, max]
    # unit_list = [unit_min, unit_max]
    value = unit_list[0] + (orig_val - orig_list[0])*(unit_list[1] - unit_list[0])/(orig_list[1] - orig_list[0])
    return value

def AreaEqualizer(ln, fixed_pt,  face_size, tol, it, pr):
    # ln : list of connected lines : note: The adjacency of nodes should be more than 1
    #fixed_points: the coordinates of the points that are fixed
    # tol: is the tolearnce for the relaxation process
    # it: if 1: the iteration process is drawn 
    #     if 0: Only the relaxed part is drawn
    #     if 2: the iteration process is drawn but the lines will be deleted
    # pr: if 1: prints the results
    #     if 0: no print
    # Stop : This is number of steps that it will stop before crashing
    stop = 200
    
    def Scale_object(pt, cent, sc_area):
        # linear scale factor is the square root of the
        # the area scale factor
        sc_lin = math.sqrt(sc_area)
        vec = ma.VecCreate(nodes[pt],centroids[cent])
        vec = ma.VecScale(vec,sc_lin)
        new_pt = ma.PtAdd(centroids[cent], vec)
        return new_pt
    
    def Scale_all(pt, cent, sc_area):
        # linear scale factor is the square root of the
        # the area scale factor
        sc_lin = math.sqrt(sc_area)
        vec = ma.VecCreate(nodes[pt],cent)
        vec = ma.VecScale(vec,sc_lin)
        new_pt = ma.PtAdd(cent, vec)
        return new_pt

    def points_barr(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
        	x.append(nodes[j][0])
        	y.append(nodes[j][1])
        	z.append(nodes[j][2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/ len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
        
    brn={}
    for i in range(len(ln)):
        brn[i]=ln[i]
    
    nodes = NodeCoord(brn)
    if pr ==1:
        print "nodees", nodes
    
    adjec_nodes = AdjecNodes(nodes, brn)[0]
    if pr ==1:
        print "adjec_nodes", adjec_nodes
    
    edge_list = AdjecNodes(nodes, brn)[1]
    if pr ==1:
        print "edge_list", edge_list
    
    edge_list_new = []
    for pair in edge_list:
        pair.sort()
        if pair not in edge_list_new:
            edge_list_new.append(pair)
    if pr ==1:
        print "edge_list_new", edge_list_new
    
    # Here I put the nodes with a reduced tolerance
    # in a list
    if fixed_pt:
        fixed_nodes = []
        for p in fixed_pt:
            pt1 = rs.PointCoordinates(p)
            pt = [round(x,3) for x in pt1]
            fixed_nodes.append(pt)
    
    # Here I check for the condition of nodes 
    # and make sure that they are fixed or not
        nodes_fixed =[]
        for k, v in nodes.items():
            if v in fixed_nodes:
                #print k
                nodes_fixed.append(k)
        if pr ==1:
            print "nodes_fixed", nodes_fixed
    

    """
    for k, v in nodes.items():
        if k not in nodes_fixed:
            rs.AddTextDot(str(k), v)
    """
    faces = HalfEdgeData(ln, 0, 0)
    if pr ==1:
        print "faces", faces
    
    lens = []
    
    for k,v in faces.items():
        lens.append(len(v))
    max_len = max(lens)

    exterior_face ={}
    interior_faces ={}
    for k, v in faces.items():
        if len(v) != max_len:
            interior_faces[k] = v
        else: 
            exterior_face[0] =v
    if pr ==1:
        print "interior_faces", interior_faces
        print "exterior_face", exterior_face
        
    def AreaCalc(cent):
        pair_list =[]
        for i in  range(len(cent_adjec[cent])-1):
            list_new = [cent_adjec[cent][i], cent_adjec[cent][i+1]]
            if list_new not in pair_list:
                pair_list.append(list_new)
        center = points_barr(cent_adjec[cent])
        #print "pair_list", pair_list
        areas = []
        for gr in pair_list:
            area = math.fabs((center[0]*(nodes[gr[1]][1]-nodes[gr[0]][1]) + nodes[gr[1]][0] * (nodes[gr[0]][1] - center[1]) + nodes[gr[0]][0] * ( center[1] - nodes[gr[1]][1]))/2)
            areas.append(area)
        total_area = sum(areas)
        return total_area
        
    def TotalAreaCalc(pt_list):
        center = points_barr(pt_list)
        pair_list =[]
        for i in  range(len(pt_list)-1):
            list_new = [pt_list[i], pt_list[i+1]]
            if list_new not in pair_list:
                pair_list.append(list_new)
        #print "pair_list", pair_list
        areas = []
        for gr in pair_list:
            area = math.fabs((center[0]*(nodes[gr[1]][1]-nodes[gr[0]][1]) + nodes[gr[1]][0] * (nodes[gr[0]][1] - center[1]) + nodes[gr[0]][0] * ( center[1] - nodes[gr[1]][1]))/2)
            areas.append(area)
        total_area = sum(areas)
        return total_area
        
        
    centroids = {}
    i =0 
    cent_adjec ={}
    for k, v in interior_faces.items():
        centroids["c"+str(i)] = points_barr(v)
        cent_adjec["c"+str(i)] = v
        i = i+1 
    if pr ==1:
        print "centroids", centroids
        print "cent_adjec", cent_adjec

    adjec_nodes_cent={}
    for pt in nodes.keys():
        adjec_nodes_cent[pt]=[]
        for k,v in cent_adjec.items():
            if pt in v:
                adjec_nodes_cent[pt].append(k)
    if pr ==1:
        print "adjec_nodes_cent", adjec_nodes_cent

    # Here I need to make a new adjacency basically the distibutaion area
    # In this 
    new_adjec={}
    for k, v in adjec_nodes_cent.items():
        new_adjec[k]={}
        for c in v:
            new_adjec[k][c] =[]
            for pt in adjec_nodes[k]:
                if pt in cent_adjec[c]:
                    if pt not in new_adjec[k][c]:
                        new_adjec[k][c].append(pt)
    if pr ==1:
        print "new_adjec", new_adjec
    
    
    # here at this point
    # if the size of the cells are defined 
    # we can scale the force diagram to be size 
    # defined by the user
    
    # first I need to find the cnetroid of the whole
    # exterior face also I need to know the existing area
    for k,v in exterior_face.items():
        center_of_ext =points_barr(v)
    
    original_area = TotalAreaCalc(exterior_face[0])
    # The number of internal cells are
    face_num = len(cent_adjec.keys())
    
    # Therefore the size of each cell is
    original_size = original_area/face_num
    #print original_size
    
    # if there is input for the face size
    new_total_area = face_size * face_num
    
    # now I need to scale all the points
    # with respect to the new total_area
    sc_factor = new_total_area/original_area
    
    
    # This line of the code scales all the polygons
    for k in nodes.keys():
        new_pt = Scale_all(k, center_of_ext, sc_factor)
        nodes[k] = new_pt
    
    rs.AddLayer("Scaled Polygon", [0,100,0])
    rs.CurrentLayer("Scaled Polygon")
    new_lines =[]
    for pair in edge_list_new:
        new_lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
    
    rs.HideObjects(ln)
    
    if fixed_pt:
        for k, v in nodes.items():
            if k in nodes_fixed:
                rs.AddTextDot(str(k), v)
    else:
        nodes_fixed=[]
    # here I calculate the original total area 
    # of the cells
    
    Area_for_face ={}
    all_areas =[]
    for k in cent_adjec.keys():
        a = AreaCalc(k)
        Area_for_face[k] = a
        all_areas.append(a)
    if pr ==1:
        print "Area_for_face", Area_for_face
        print "all_areas ", all_areas 
    
    sum_area = sum(all_areas)
    if pr ==1:
        print "sum_area", sum_area
    
    
    
    
    def points_barr_val(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
        	x.append(j[0])
        	y.append(j[1])
        	z.append(j[2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
    step = 0
    def AreaSmooth(cent_dic,total_area, tol, it, step):
        # in this section I will generate multiple values for each
        # node resulted from scaling each polygon
        # therefore for each node I will prepare an empty []
        # to store all the upcoming values and sum them up to find the
        # barrycentric value
        
        nodes_multi_val ={}
        for k in nodes.keys():
            nodes_multi_val[k] = []
        
        face_num = len(cent_adjec.keys())
        target_area = total_area/face_num
        #print target_area
        Area_for_face ={}
        Area_for_face_sc ={}
        for k in cent_adjec.keys():
            a = AreaCalc(k)
            Area_for_face[k] = a
            Area_for_face_sc[k] = target_area/a
            #all_areas.append(a)
        
        # This part scales the polygon we can visualize it
        for k,v in adjec_nodes_cent.items():
            for cent in v:
                if k not in nodes_fixed:
                    new_pt =Scale_object(k, cent, Area_for_face_sc[cent])
                    nodes_multi_val[k].append(new_pt)
                else:
                    #print "k", k 
                    nodes_multi_val[k] .append( nodes[k])
        
        #print "nodes_multi_val", nodes_multi_val
        for k,v in nodes_multi_val.items():
            sum_list = points_barr_val(v)
            nodes[k] = sum_list
        
        lines =[]
    
        #rs.DeleteObjects(lines)
        # now we need to recalculate the centroids
        
        #++++++++++++++++++++++++++++++++++++++++++++++
        """
        new_cents ={}
        diff_all =[]
        for k, v in cent_adjec.items():
            new_cents[k] = points_barr(v)
            dist = rs.Distance(new_cents[k], centroids[k])
            diff_all.append(dist)
        """
        #++++++++++++++++++++++++++++++++++++++++++++++
        
        #+++++++++++++++++++++++++++++++++++++
        # now we need recalcuate the new areas 
        # and reduce it from the previous areas to 
        # see the amoun of change needed
        New_Area_for_face ={}
        diff_all =[]
        dot_txt=[]
        for k in cent_adjec.keys():
            a = AreaCalc(k)
            New_Area_for_face[k] = a
            #dot_txt.append( rs.AddTextDot(str(a), centroids[k]))
            dif_area = math.fabs(New_Area_for_face[k]-Area_for_face[k])
            #print dif_area
            diff_all.append(dif_area)
            #if dot_txt:
                #rs.DeleteObjects(dot_txt)
        #+++++++++++++++++++++++++++++++++++++
        
        
        max_diff= max(diff_all)
        #print max_diff
        if step < stop:
            if max_diff > tol:
                
                #for k, v in centroids.items():
                    #centroids[k] = new_cents[k]
                if it == 2:
                    rs.AddLayer("Iterations", [255,255,255])
                    rs.CurrentLayer("Iterations")
                    lines =[]
                    for pair in edge_list_new:
                        lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
                    rs.DeleteObjects(lines)
                if it == 1:
                    rs.AddLayer("Iterations", [255,255,255])
                    rs.CurrentLayer("Iterations")
                    lines =[]
                    for pair in edge_list_new:
                        lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
                step = step + 1 
                AreaSmooth(cent_dic,total_area, tol, it, step)
            
            else:
                # here we can recalcuate the centroids
                for k, v in cent_adjec.items():
                    centroids[k] = points_barr(v)
                rs.AddLayer("Relaxed", [0,0,255])
                rs.CurrentLayer("Relaxed")
                
                for k,v in Area_for_face.items():
                    rs.AddTextDot(str(round(v,2)), centroids[k])
                lines =[]
                for pair in edge_list_new:
                    lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
                print " Step Number", step
                return nodes
                
            
        else:
            # here we can recalcuate the centroids
            for k, v in cent_adjec.items():
                centroids[k] = points_barr(v)
            rs.AddLayer("Relaxed", [0,0,255])
            rs.CurrentLayer("Relaxed")
            
            for k,v in Area_for_face.items():
                rs.AddTextDot(str(round(v,2)), centroids[k])
            lines =[]
            for pair in edge_list_new:
                lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
            print " Step Number", step
            return nodes
    #print " Step Number", step
    nodes = AreaSmooth(cent_adjec,sum_area,tol, it, step)
    #print " Step Number", step 
    return nodes

def TotalAreaEqualizer(ln, fixed_pt, tol, it, pr):
    # ln : list of connected lines : note: The adjacency of nodes should be more than 1
    #fixed_points: the coordinates of the points that are fixed
    # tol: is the tolearnce for the relaxation process
    # it: if 1: the iteration process is drawn 
    #     if 0: Only the relaxed part is drawn
    #     if 2: the iteration process is drawn but the lines will be deleted
    # pr: if 1: prints the results
    #     if 0: no print
    # stop: this stops the process stop here is assumed = 200
    
    stop = 200
    
    def Scale_object(pt, cent, sc_area):
        # linear scale factor is the square root of the
        # the area scale factor
        sc_lin = math.sqrt(sc_area)
        vec = ma.VecCreate(nodes[pt],centroids[cent])
        vec = ma.VecScale(vec,sc_lin)
        new_pt = ma.PtAdd(centroids[cent], vec)
        return new_pt
    
    def Scale_all(pt, cent, sc_area):
        # linear scale factor is the square root of the
        # the area scale factor
        sc_lin = math.sqrt(sc_area)
        vec = ma.VecCreate(nodes[pt],cent)
        vec = ma.VecScale(vec,sc_lin)
        new_pt = ma.PtAdd(cent, vec)
        return new_pt

    def points_barr(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
        	x.append(nodes[j][0])
        	y.append(nodes[j][1])
        	z.append(nodes[j][2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/ len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
        
    brn={}
    for i in range(len(ln)):
        brn[i]=ln[i]
    
    nodes = NodeCoord(brn)
    if pr ==1:
        print "nodees", nodes
    
    adjec_nodes = AdjecNodes(nodes, brn)[0]
    if pr ==1:
        print "adjec_nodes", adjec_nodes
    
    edge_list = AdjecNodes(nodes, brn)[1]
    if pr ==1:
        print "edge_list", edge_list
    
    edge_list_new = []
    for pair in edge_list:
        pair.sort()
        if pair not in edge_list_new:
            edge_list_new.append(pair)
    if pr ==1:
        print "edge_list_new", edge_list_new
    
    # Here I put the nodes with a reduced tolerance
    # in a list
    if fixed_pt:
        fixed_nodes = []
        for p in fixed_pt:
            pt1 = rs.PointCoordinates(p)
            pt = [round(x,3) for x in pt1]
            fixed_nodes.append(pt)
    
    # Here I check for the condition of nodes 
    # and make sure that they are fixed or not
        nodes_fixed =[]
        for k, v in nodes.items():
            if v in fixed_nodes:
                #print k
                nodes_fixed.append(k)
        if pr ==1:
            print "nodes_fixed", nodes_fixed
    

    """
    for k, v in nodes.items():
        if k not in nodes_fixed:
            rs.AddTextDot(str(k), v)
    """
    faces = HalfEdgeData(ln, 0, 0)
    if pr ==1:
        print "faces", faces
    
    lens = []
    
    for k,v in faces.items():
        lens.append(len(v))
    max_len = max(lens)

    exterior_face ={}
    interior_faces ={}
    for k, v in faces.items():
        if len(v) != max_len:
            interior_faces[k] = v
        else: 
            exterior_face[0] =v
    if pr ==1:
        print "interior_faces", interior_faces
        print "exterior_face", exterior_face

    def AreaCalc(cent):

        pair_list =[]
        for i in  range(len(cent_adjec[cent])-1):
            list_new = [cent_adjec[cent][i], cent_adjec[cent][i+1]]
            if list_new not in pair_list:
                pair_list.append(list_new)
        center = points_barr(cent_adjec[cent])
        
        #print "pair_list", pair_list
        areas = []
        for gr in pair_list:
            area = math.fabs((center[0]*(nodes[gr[1]][1]-nodes[gr[0]][1]) + nodes[gr[1]][0] * (nodes[gr[0]][1] - center[1]) + nodes[gr[0]][0] * ( center[1] - nodes[gr[1]][1]))/2)
            areas.append(area)
        total_area = sum(areas)
        return total_area
    #for pt in cent_adjec[cent]:

            
        

    def TotalAreaCalc(pt_list):
        center = points_barr(pt_list)
        pair_list =[]
        
        for i in  range(len(pt_list)-1):
            list_new = [pt_list[i], pt_list[i+1]]
            if list_new not in pair_list:
                pair_list.append(list_new)
        #print "pair_list", pair_list
        areas = []
        for gr in pair_list:
            area = math.fabs((center[0]*(nodes[gr[1]][1]-nodes[gr[0]][1]) + nodes[gr[1]][0] * (nodes[gr[0]][1] - center[1]) + nodes[gr[0]][0] * ( center[1] - nodes[gr[1]][1]))/2)
            areas.append(area)
        total_area = sum(areas)
        return total_area

        
        

    centroids = {}
    i =0 
    cent_adjec ={}
    for k, v in interior_faces.items():
        centroids["c"+str(i)] = points_barr(v)
        cent_adjec["c"+str(i)] = v
        i = i+1 
    if pr ==1:
        print "centroids", centroids
        print "cent_adjec", cent_adjec

    adjec_nodes_cent={}
    for pt in nodes.keys():
        adjec_nodes_cent[pt]=[]
        for k,v in cent_adjec.items():
            if pt in v:
                adjec_nodes_cent[pt].append(k)
    if pr ==1:
        print "adjec_nodes_cent", adjec_nodes_cent

    # Here I need to make a new adjacency basically the distibutaion area
    # In this 
    new_adjec={}
    for k, v in adjec_nodes_cent.items():
        new_adjec[k]={}
        for c in v:
            new_adjec[k][c] =[]
            for pt in adjec_nodes[k]:
                if pt in cent_adjec[c]:
                    if pt not in new_adjec[k][c]:
                        new_adjec[k][c].append(pt)
    if pr ==1:
        print "new_adjec", new_adjec
    
    """
    # here at this point
    # if the size of the cells are defined 
    # we can scale the force diagram to be size 
    # defined by the user
    
    # first I need to find the cnetroid of the whole
    # exterior face also I need to know the existing area
    for k,v in exterior_face.items():
        center_of_ext =points_barr(v)
    
    original_area = TotalAreaCalc(exterior_face[0])
    # The number of internal cells are
    face_num = len(cent_adjec.keys())
    
    # Therefore the size of each cell is
    original_size = original_area/face_num
    #print original_size
    
    # if there is input for the face size
    new_total_area = face_size * face_num
    
    # now I need to scale all the points
    # with respect to the new total_area
    sc_factor = new_total_area/original_area
    
    
    # This line of the code scales all the polygons
    for k in nodes.keys():
        new_pt = Scale_all(k, center_of_ext, sc_factor)
        nodes[k] = new_pt
    
    rs.AddLayer("Scaled Polygon", [0,100,0])
    rs.CurrentLayer("Scaled Polygon")
    new_lines =[]
    for pair in edge_list_new:
        new_lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
    
    rs.HideObjects(ln)
    """
    if fixed_pt:
        for k, v in nodes.items():
            if k in nodes_fixed:
                rs.AddTextDot(str(k), v)
    else:
        nodes_fixed=[]
    # here I calculate the original total area 
    # of the cells
    
    Area_for_face ={}
    all_areas =[]
    for k in cent_adjec.keys():
        a = AreaCalc(k)
        Area_for_face[k] = a
        all_areas.append(a)
    if pr ==1:
        print "Area_for_face", Area_for_face
        print "all_areas ", all_areas 
    
    sum_area = sum(all_areas)
    if pr ==1:
        print "sum_area", sum_area
    
    
    
    
    def points_barr_val(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
        	x.append(j[0])
        	y.append(j[1])
        	z.append(j[2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
    step = 0
    
    def AreaSmooth(cent_dic,total_area, tol, it, step):
        # in this section I will generate multiple values for each
        # node resulted from scaling each polygon
        # therefore for each node I will prepare an empty []
        # to store all the upcoming values and sum them up to find the
        # barrycentric value
        nodes_multi_val ={}
        for k in nodes.keys():
            nodes_multi_val[k] = []
        
        face_num = len(cent_adjec.keys())
        target_area = total_area/face_num
        #print target_area
        Area_for_face ={}
        Area_for_face_sc ={}
        for k in cent_adjec.keys():
            a = AreaCalc(k)
            Area_for_face[k] = a
            Area_for_face_sc[k] = target_area/a
            #all_areas.append(a)
        
        # This part scales the polygon we can visualize it
        for k,v in adjec_nodes_cent.items():
            for cent in v:
                if k not in nodes_fixed:
                    new_pt =Scale_object(k, cent, Area_for_face_sc[cent])
                    nodes_multi_val[k].append(new_pt)
                else:
                    #print "k", k 
                    nodes_multi_val[k] .append( nodes[k])
        
        #print "nodes_multi_val", nodes_multi_val
        for k,v in nodes_multi_val.items():
            sum_list = points_barr_val(v)
            nodes[k] = sum_list
        
        lines =[]
    
        #rs.DeleteObjects(lines)
        # now we need to recalculate the centroids
        
        #++++++++++++++++++++++++++++++++++++++++++++++
        """
        new_cents ={}
        diff_all =[]
        for k, v in cent_adjec.items():
            new_cents[k] = points_barr(v)
            dist = rs.Distance(new_cents[k], centroids[k])
            diff_all.append(dist)
        """
        #++++++++++++++++++++++++++++++++++++++++++++++
        
        #+++++++++++++++++++++++++++++++++++++
        # now we need recalcuate the new areas 
        # and reduce it from the previous areas to 
        # see the amoun of change needed
        New_Area_for_face ={}
        diff_all =[]
        dot_txt=[]
        for k in cent_adjec.keys():
            a = AreaCalc(k)
            New_Area_for_face[k] = a
            #dot_txt.append( rs.AddTextDot(str(a), centroids[k]))
            dif_area = math.fabs(New_Area_for_face[k]-Area_for_face[k])
            #print dif_area
            diff_all.append(dif_area)
            #if dot_txt:
                #rs.DeleteObjects(dot_txt)
        #+++++++++++++++++++++++++++++++++++++
        
        
        max_diff= max(diff_all)
        #print max_diff
        if step < stop:
            if max_diff > tol:
                #for k, v in centroids.items():
                    #centroids[k] = new_cents[k]
                if it == 2:
                    rs.AddLayer("Iterations", [255,255,255])
                    rs.CurrentLayer("Iterations")
                    lines =[]
                    for pair in edge_list_new:
                        lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
                    rs.DeleteObjects(lines)
                if it == 1:
                    rs.AddLayer("Iterations", [255,255,255])
                    rs.CurrentLayer("Iterations")
                    lines =[]
                    for pair in edge_list_new:
                        lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
                step = step + 1
                AreaSmooth(cent_dic,total_area, tol, it, step)
                
            else:
                # here we can recalcuate the centroids
                for k, v in cent_adjec.items():
                    centroids[k] = points_barr(v)
                rs.AddLayer("Relaxed", [0,0,255])
                rs.CurrentLayer("Relaxed")
                
                for k,v in Area_for_face.items():
                    rs.AddTextDot(str(round(v,2)), centroids[k])
                lines =[]
                for pair in edge_list_new:
                    lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
                print " Step Number", step
                return nodes
        else:
            # here we can recalcuate the centroids
            for k, v in cent_adjec.items():
                centroids[k] = points_barr(v)
            rs.AddLayer("Relaxed", [0,0,255])
            rs.CurrentLayer("Relaxed")
            
            for k,v in Area_for_face.items():
                rs.AddTextDot(str(round(v,2)), centroids[k])
            lines =[]
            for pair in edge_list_new:
                lines.append(rs.AddLine(nodes[pair[0]], nodes[pair[1]]))
            print " Step Number", step
            return nodes
    nodes = AreaSmooth(cent_adjec,sum_area,tol, it, step)
    return nodes

def BranchNodeMatrix(ln):
    import numpy as np
    nodes = NodeCoord(ln)
    adjec_list= AdjecNodes(nodes, ln)[1]
    
    # sort the connectivity lists of 
    # edges and then cull duplicates
    for lis in adjec_list:
        lis.sort()
        
    new_adjec =[] 
    for lis in adjec_list:
        if lis not in new_adjec:
            new_adjec.append(lis)
    
    # empty lists for the Matrix
    
    mat_lists ={}
    for pt in nodes.keys():
        mat_lists[pt] =[]
    print "mat_lists", mat_lists
    
    for pt in nodes.keys():
        for pair in new_adjec:
            if pt in pair:
                if pt == pair[0]:
                    mat_lists[pt].append(-1)
                if pt == pair[1]:
                    mat_lists[pt].append(+1)
            else:
                mat_lists[pt].append(0)
    print mat_lists
    
    mat_re_list = mat_lists.values()
    a = np.matrix(mat_re_list)

    b_n_mat = np.transpose(a)
    #print b_n_mat
    return b_n_mat

def BranchNodeMatrixPtList(ln, pt_list):
    # This Function Creates the branch-node Matrix 
    # According to the input point lists
    import numpy as np
    nodes = NodeCoord(ln)
    adjec_list= AdjecNodes(nodes, ln)[1]
    
    # sort the connectivity lists of 
    # edges and then cull duplicates
    for lis in adjec_list:
        lis.sort()
        
    new_adjec =[] 
    for lis in adjec_list:
        if lis not in new_adjec:
            new_adjec.append(lis)
    
    # empty lists for the Matrix
    
    mat_lists ={}
    for pt in pt_list:
        mat_lists[pt] =[]
    print "mat_lists", mat_lists
    
    for pt in pt_list:
        for pair in new_adjec:
            if pt in pair:
                if pt == pair[0]:
                    mat_lists[pt].append(-1)
                if pt == pair[1]:
                    mat_lists[pt].append(+1)
            else:
                mat_lists[pt].append(0)
    print mat_lists
    
    mat_re_list = mat_lists.values()
    a = np.matrix(mat_re_list)

    b_n_mat = np.transpose(a)
    #print b_n_mat
    return b_n_mat

def PlainForceDensity(ln, nodes,fixed_pt):
    # ln: input branches
    # nodes: includes the information about the names and the coordinates of points
    # fixed_pt: only includes the information of the fixed points
    import numpy as np
    
    if fixed_pt:
        fixed_nodes = []
        for p in fixed_pt:
            pt1 = rs.PointCoordinates(p)
            pt = [round(x,3) for x in pt1]
            fixed_nodes.append(pt)
            
    # Here I check for the condition of nodes 
    # and make sure that they are fixed or not
    nodes_fixed =[]
    for k, v in nodes.items():
        if v in fixed_nodes:
            #print k
            rs.AddTextDot(str(k), v)
            nodes_fixed.append(k)
    print "nodes_fixed", nodes_fixed
    
    N_nodes=[]
    F_nodes=[]
    
    for pt in nodes.keys():
        if pt not in nodes_fixed:
            N_nodes.append(pt)
        else:
            F_nodes.append(pt)
    
    print "N_nodes", N_nodes
    print "F_nodes", F_nodes
    
    # Now I can add nodes for the force desnsity matrix
    Cn = BranchNodeMatrixPtList(ln, N_nodes)
    
    #print "++++++++++++++++"
    print "C_n", Cn
    
    Cn_T = np.transpose(Cn)
    #print "Cn_T", Cn_T
    
    Cf = BranchNodeMatrixPtList(ln, F_nodes)
    #print "++++++++++++++++"
    print "C_f", Cf
    
    
    adjec_list= AdjecNodes(nodes, ln)[1]
    
    for group in adjec_list:
        group.sort()
    
    new_adjec =[] 
    for lis in adjec_list:
        if lis not in new_adjec:
            new_adjec.append(lis)
    
    print len(new_adjec)
    
    # now I need to make a Q matrix
    # meaning that 
    Q  = np.zeros((len(new_adjec), len(new_adjec)), int)
    np.fill_diagonal(Q, 1)
    
    #print Q
    
    # Now here I would like to Cn_T x Q x C
    Dn = Cn_T * Q * Cn
    #print "Force", Dn
    
    Df = Cn_T * Q * Cf
    
    x_list = []
    y_list = []
    z_list = []
    
    # These are the Matrices of the coordinates of the fixed nodes
    for i in range(len(F_nodes)):
        x_list.append(nodes[F_nodes[i]][0])
        y_list.append(nodes[F_nodes[i]][1])
        z_list.append(nodes[F_nodes[i]][2])
    
    x_mat = np.matrix(x_list)
    x_mat = np.transpose(x_mat)
    
    y_mat = np.matrix(y_list)
    y_mat = np.transpose(y_mat)
    
    z_mat = np.matrix(z_list)
    z_mat = np.transpose(z_mat)
    
    D_inv = np.linalg.inv(Dn)
    
    Xn = D_inv * ( -Df * x_mat)
    print Xn 
    
    Yn = D_inv * ( -Df * y_mat)
    print Yn
    
    Zn = D_inv * ( -Df * z_mat)
    print Zn
    
    for pt in nodes.keys():
        rs.AddTextDot(str(pt), nodes[pt])
    
    Xn_T =  np.transpose(Xn)
    Yn_T =  np.transpose(Yn)
    Zn_T =  np.transpose(Zn)
    #print "Xn", Xn
    #print "Xn_T", Xn_T
    
    # I would like to have the 
    
    xn_list = []
    yn_list = []
    zn_list = []
    
    for i in range(len(N_nodes)):
        xn_list.append(nodes[N_nodes[i]][0])
        yn_list.append(nodes[N_nodes[i]][1])
        zn_list.append(nodes[N_nodes[i]][2])
    
    print "xn_list", xn_list
    print "yn_list", yn_list
    print "zn_list", zn_list
    
    pt_new = {}
    for i in range(len(N_nodes)):
        print "N_nodes", N_nodes[i]
        #print Xn[i].item(0),Yn[i].item(0),Zn[i].item(0)
        nodes [N_nodes[i]]= [Xn[i].item(0),Yn[i].item(0),Zn[i].item(0)]
    
    for pt in nodes.keys():
        rs.AddTextDot(str(pt), nodes[pt])
    
    rs.AddLayer("FDM", [0,190,200])
    rs.CurrentLayer("FDM")
    print new_adjec
    for group in new_adjec:
        rs.AddLine(nodes[group[0]], nodes[group[1]])
    return nodes

def UnitPolyhedron(nodes, key,adj_pts,t, Draw):
    #' nodes: dictionary of point names and their coordinates
    #' the following function will generate a polyhedron '
    #' from an input branch '
    #' key : central node name '
    #' adj_pts: the adjacent nodes to the central node ' 
    #' t: if == 1: then the unit polyhedron will be constructed
    #' Draw: if True, the polyhedron will be drawn
    poly_nodes={}
    all_plane_for_branch_no={}
    
    rs.AddLayer("Polyhedron", [0,150,0])

    plane_for_branch={}
    plane_for_branch_no={}
    plane_for_branch_no_spec={}
    plane_for_branch_no_spec_coef={}
    plane_for_branch_no_spec_aug={}
    plane_for_branch_norm={}
    
    Poly_nodes={}
    d=0
    edge_dir_list =[]
    for pt in adj_pts:
        tup = (key, pt)
        if tup not in edge_dir_list:
            edge_dir_list.append(tup)
    edge_face_points={}
    for tup in edge_dir_list:
        edge_face_points[tup]=[]
        
    for pt in adj_pts:
        for tup in edge_dir_list:
            if pt in tup:
                if key in tup:
                    list_new=list(tup)
                    vec_norm=ma.VecCreate(nodes[pt], nodes[key])
                    if t == 1: 
                        vec_norm=ma.VecUnitize(vec_norm)
                        #vec_norm=ma.VecScale(vec_norm, 1/2)
                        #vec_norm=ma.VecUnitize(vec_norm)
                    new_node=ma.PtAdd(vec_norm,nodes[key])
                    #print new_node
                    plane=rs.PlaneFromNormal(new_node,vec_norm)
                    plane_for_branch[tuple(list_new)]=plane
                    plane_for_branch_no[tuple(list_new)]=str(key)+str(d)+'f'
                    plane_for_branch_no_spec[str(key)+str(d)+'f']=[vec_norm[0],vec_norm[1], vec_norm[2],ma.VecDotProduct(vec_norm,new_node)]
                    plane_for_branch_no_spec_coef[str(key)+str(d)+'f']=[vec_norm[0],vec_norm[1], vec_norm[2]]
                    plane_for_branch_no_spec_aug[str(key)+str(d)+'f']=ma.VecDotProduct(vec_norm,new_node)
                    plane_for_branch_norm[str(key)+str(d)+'f']=vec_norm
                    d=d+1
                
    #print "plane_for_branch", plane_for_branch
    #print "plane_for_branch_no", plane_for_branch_no
    #print "plane_for_branch_no_spec", plane_for_branch_no_spec
    
    all_plane_list=plane_for_branch_no.values()
    
    #print "all_plane_list", all_plane_list
    #for keys,values in plane_for_branch_no.items():
    
    plane_three=[]
    h=0
    for pl in all_plane_list:
    	for j in all_plane_list:
    		if pl!=j:
    			for g in all_plane_list:
    				if pl!=g and j!=g:
    					test=[pl,j,g]
    					test.sort()
    					if test not in plane_three:
    						plane_three.append(test)
    
    #print len(plane_three),"plane_three", plane_three
    # here I am taking every three plane and finding the intersection of 
    # them 
    
    pop_points=[]
    all_possible_points=[]
    adjec_planes=[]
    plane_three_adjec={}
    for planes in plane_three:
    	a=matrix([plane_for_branch_no_spec[planes[0]],plane_for_branch_no_spec[planes[1]],plane_for_branch_no_spec[planes[2]]])
    	a_coef=matrix([plane_for_branch_no_spec_coef[planes[0]],plane_for_branch_no_spec_coef[planes[1]],plane_for_branch_no_spec_coef[planes[2]]])
    	#print a
    	r = np.linalg.matrix_rank(a)
    	r_aug = np.linalg.matrix_rank(a_coef)
    	if r==r_aug:
    		#print r
    		a = np.array([plane_for_branch_no_spec_coef[planes[0]],plane_for_branch_no_spec_coef[planes[1]],plane_for_branch_no_spec_coef[planes[2]]])
    		b = np.array([plane_for_branch_no_spec_aug[planes[0]],plane_for_branch_no_spec_aug[planes[1]],plane_for_branch_no_spec_aug[planes[2]]])
    		pt = np.linalg.solve(a, b)
    		#print pt
    		#print pt
    		pt=list(pt)
    		pt=[round(x,6) for x in pt]
    		#print pt
    		all_possible_points.append(pt)
    		pop_points.append(pt)
    		if planes not in adjec_planes:
    			adjec_planes.append(planes)
    			plane_three_adjec[tuple(planes)]=list(pt)
    
    for pt in all_possible_points:
    	#print "___________" 
    	#print "pt", pt
    	#if pt in pop_points:
    		#print "yes" 
    	all_d=[]
    	for plane in all_plane_list:
    		d1=plane_for_branch_no_spec[plane][0]*pt[0]+plane_for_branch_no_spec[plane][1]*pt[1]+plane_for_branch_no_spec[plane][2]*pt[2]-plane_for_branch_no_spec[plane][3]
    		all_d.append(d1)
    	if round(max(all_d),4)>0:
    		#print "this should be dropped"
    		if pt in pop_points:
    			#print " yes it exists"
    			pop_points.remove(pt)
    
    # now I need to put the found points backn on their surfaces
    # to find the closed polyhedron on each surface
    
    plane_points_list={}
    point_face_vector={}
    point_face_number={}
    for plane in all_plane_list:
    	plane_points_list[plane]={}
    	point_face_vector[plane]={}
    	point_face_number[plane]={}
    
    tol =rs.UnitAbsoluteTolerance()
    tol=0.00001
    toler=int(math.fabs(math.log(tol,10)))+2
    #print toler
    
    all_dup=[]
    
    for pt in pop_points:
    	pt=[round(x,toler) for x in pt]
    
    dup_pop=copy.deepcopy(pop_points)
    
    all_pt_no_dup=[]
    
    for pt in pop_points:
    	if pt not in all_pt_no_dup:
    		all_pt_no_dup.append(pt) 
    
    point_dictionary={}
    i=0
    for pt in all_pt_no_dup:
    	point_dictionary[str(key)+str(i)+'p']= pt
    	poly_nodes[str(key)+str(i)+'p']= pt
    	#rs.AddTextDot(str(i),pt)
    	i=i+1
    
    for k,values in point_dictionary.items(): 
    	for plane in all_plane_list:
    		d1=plane_for_branch_no_spec[plane][0]*point_dictionary[k][0]+plane_for_branch_no_spec[plane][1]*point_dictionary[k][1]+plane_for_branch_no_spec[plane][2]*point_dictionary[k][2]-plane_for_branch_no_spec[plane][3]
    		if 1.e-4 > d1 > -1.e-4:
    			#print "d1", d1
    			#print "d is zero"
    			plane_points_list[plane][k]=[]
    			plane_points_list[plane][k]=point_dictionary[k]
    
    #print "point_dictionary", point_dictionary
    #print " plane_points_list", plane_points_list
    
    def PointOnPlaneSort(pt_dic):
        pts=[]
        for k, v in pt_dic.items():
            #print k
            pts.append(v)
        #for pt in pts_names:
        	#pts.append(nodes[pt])
        if len(pts)>2:
            cent=PointsBarycenter(pts)
            #print "cent", cent
            vec1=ma.VecCreate(pts[0],cent)
            #print "vec1", vec1
            vec2=ma.VecCreate(pts[1],cent)
            #print "vec2", vec2
            normal=ma.VecCrossProduct(vec1,vec2)
            leng=ma.VecLength(normal)
            if leng>1.e-2:
                normal=ma.VecUnitize(normal)
            else:
                vec2=ma.VecCreate(pts[2],cent)
                normal=ma.VecCrossProduct(vec1,vec2)
            vecttest=ma.VecCreate(pts[0],cent)
            vecttest=ma.VecRotate(vecttest,2,normal)
            angle={}
            for k, v in pt_dic.items():
                vect_t=ma.VecCreate(v,cent)
                vectn2=ma.VecCrossProduct(vecttest,vect_t)
                #print "vec2", vectn2
                vectn2=ma.VecUnitize(vectn2)
                res=ma.VecDotProduct(vectn2,normal)
                #print res
                if res<0:
                	angle[k] = 2*180 -ma.VecAngle(vecttest,vect_t)
                else:
                	angle[k]=ma.VecAngle(vecttest,vect_t)
            #print angle
            just_angle=[]
            for s in angle.values():
            	just_angle.append(s)
            #print just_angle
            just_angle.sort()
            #min_ang=min(just_angle)
            list1=[]
            for l in range(len(just_angle)):
                for keys,values in angle.items():
                    #print keys
                    if just_angle[l] == angle[keys]:
                        if keys not in list1:
                            #print keys
                            list1.append(keys)
            return list1

    def PointsBarycenter(pt_list):
    	x=[]
    	y=[]
    	z=[]
    	for j in pt_list:
    		x.append(j[0])
    		y.append(j[1])
    		z.append(j[2])
    	sumx=sum(x)/len(x)
    	sumy=sum(y)/len(y)
    	sumz=sum(z)/ len(z)
    	centroid=[sumx,sumy,sumz]
    	return centroid
    
    #print " plane_points_list ", plane_points_list
    #face_centers={}

    face_pts_sorted ={}
    for k, v in plane_points_list.items():
        pt_list = []
        face_pts_sorted[k] = PointOnPlaneSort(v)
        #print face_pts_sorted[k]
        
        list_1 = []
        if Draw == True:
            for p in face_pts_sorted[k]:
                list_1.append(poly_nodes[p])
            list_1.append(list_1[0])
            rs.CurrentLayer("Polyhedron")
            rs.EnableRedraw(False)
            rs.AddPolyline(list_1)
            rs.EnableRedraw(True)
            
    return [face_pts_sorted, poly_nodes, plane_for_branch_no]

def convex_hull(pt_o, pt__list, nodes, draw):
    # pt_o: the central node
    # pt__list: adjec list of a point
    # nodes: The input dictionary of points and their coordinates
    # draw: if == 1: it draws the convex hull
    
    
    new_groups = []
    
    def DistUnitize(pt0, pt1):
        vec_1 = ma.VecCreate(pt1, pt0)
        vec_1 = ma.VecUnitize(vec_1)
        vec_1 = ma.VecScale(vec_1, 5)
        new_pt = ma.PtAdd(pt0, vec_1)
        new_pt=[round(x,3) for x in new_pt]
        return new_pt

    def points_barr(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
            x.append(j[0])
            y.append(j[1])
            z.append(j[2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/ len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
    
    
    
    # now I need to find all the three combination of points in each 
    # group
    
    # lets make a convex hull for each adjec list for central nodes
    
    #all_groups_of_adjec= adjec_list.values()
    #print "all_groups_of_adjec", all_groups_of_adjec
    
    
    # for convex hull it is important that the unified distance of 
    # the points with respect to the center is included in 
    # the calculation I need to make a function that unifies 
    # the distances therfore I define a new dictionary for the nodes
    # based on the unified distance to find the convex hull
    
    
    # here I am unitizing the whole distances for a 
    # spherical convex hull
    nodes_unit ={}
    for pt in pt__list:
        nodes_unit[pt] =DistUnitize(nodes[pt_o],nodes[pt])
        # I would like to also keep the value of the center
        # to the nodes_unit
        #nodes_unit[k] = nodes[k]
    #print "nodes_unit",nodes_unit 
    
    list_pts = []
    for p in pt__list:
        list_pts.append(nodes_unit[p])
    cent=points_barr(list_pts)
    
    groups_of_three=[]
    # now first I am finding the barry center of all the input point
    # I know that this might be the center of my convex hull
    if pt__list > 1:
        for pt in pt__list:
            list_pts.append(nodes_unit[pt])
            
            for pt in pt__list:
                for pt2 in pt__list:
                    if pt!=pt2:
                        for pt3 in pt__list: 
                            if pt!=pt3 and pt2!=pt3:
                                test=[pt,pt2,pt3]
                                test.sort()
                                if test not in groups_of_three:
                                    # first I need to check that the four points I am choosing
                                    # lay not on the same plane, meaning that the volume of 
                                    # Tetrahedron is not equal to zero the three points beside the 
                                    # the center are not coplanar
                                    m=np.matrix([[cent[0],cent[1], cent[2], 1],
                                    [nodes_unit[test[0]][0],nodes_unit[test[0]][1], nodes_unit[test[0]][2], 1],
                                    [nodes_unit[test[1]][0],nodes_unit[test[1]][1], nodes_unit[test[1]][2], 1], 
                                    [nodes_unit[test[2]][0],nodes_unit[test[2]][1], nodes_unit[test[2]][2], 1]])
                                    d=np.linalg.det(m)
                                    d=round(d,7)
                                    if d!=0:
                                        #print "__________"
                                        #print "test", test
                                        vec1=ma.VecCreate(nodes_unit[test[1]],nodes_unit[test[0]])
                                        vec2=ma.VecCreate(nodes_unit[test[1]],nodes_unit[test[2]])
                                        vec_norm=ma.VecCrossProduct(vec1,vec2)
                                        vec_norm=ma.VecUnitize(vec_norm)
                                        # then I make a plane from those three points excluding the center 
                                        # then I check to see the vector normal direction of the planes from three points
                                        plane=[vec_norm[0],vec_norm[1], vec_norm[2],ma.VecDotProduct(vec_norm,nodes_unit[test[1]])]
                                        d=vec_norm[0]*cent[0]+vec_norm[1]*cent[1]+vec_norm[2]*cent[2]-plane[3]
                                        #print "d", d
                                        if d > 0:
                                            vec_norm=ma.VecReverse(vec_norm)
                                            plane=[vec_norm[0],vec_norm[1], vec_norm[2],ma.VecDotProduct(vec_norm,nodes_unit[test[1]])]
                                            #print "d is fixed"
                                        d_t=[]
                                        d_total={}
                                        for r in pt__list:
                                            if r not in test:
                                                #print "r", r
                                                d2=vec_norm[0]*nodes_unit[r][0]+vec_norm[1]*nodes_unit[r][1]+vec_norm[2]*nodes_unit[r][2]-plane[3]
                                                d2=round(d2,3)
                                                #print "d2", d2
                                                d_t.append(d2)
                                                d_total[r]=[]
                                                d_total[r]=d2
                                        if max(d_t) < 0:
                                            #print "d_t", max(d_t)
                                            if test not in groups_of_three:
                                            	groups_of_three.append(test)
                                        if max(d_t)==0:
                                            for e,w in d_total.items():
                                                if d_total[e]==0:
                                                    #print "e for zero d2", e
                                                    #print "max is zero"
                                                    if e not in test:
                                                        test.append(e)
                                                        test.sort()
                                                        if test not in groups_of_three:
                                                            #print "new test", test
                                                            groups_of_three.append(test)
                                    
    len_4=[]
    for v in groups_of_three:
        if len(v)>3:
            if v not in len_4:
                len_4.append(v)
    #new_groups=[]
    for v in len_4:
        test=point_on_plane_sort(v)
        if test not in new_groups:
            new_groups.append(test)
    
    for v in groups_of_three:
        if len(v)<4:
            if v not in new_groups:
                new_groups.append(v)
    #print "groups_of_three", groups_of_three
    #print "len_4", len_4
    #print "new_groups", new_groups
    if draw == 1:
        
        for v in new_groups:
            poly=[]
            for pt in v:
                poly.append(nodes_unit[pt])
            poly.append(nodes_unit[v[0]])
            rs.AddLayer("Convex Hull", [100, 50, 255])
            rs.CurrentLayer("Convex Hull")
            rs.AddPolyline(poly)
        #print "new_groups", new_groups
    
    # lets find all the nodes
    all_nodes = nodes.keys()
    convex_adjec = {}
    for pt in all_nodes:
        #convex_adjec[pt] = []
        test_list =[]
        for group in new_groups:
            if pt in group:
                for p in group:
                    if p != pt:
                        if p not in test_list:
                            test_list.append(p)
        if len(test_list) > 0:
            convex_adjec[pt] = test_list
    #print "convex_adjec inside", convex_adjec
    return [convex_adjec, new_groups]

def PolyhedronFromSrfs_old(srfs, p, draw):
    """
    srfs: input surfaces
    p: if True then it will print the infromation
    draw:  if True the layer named 'Polyhedron' is
            constructed and the polyhedrons will be 
            drawn in a seperate groups stored in the
            interior and exterior cells
    """
    
    
    lns = []
    srf_dic = {}
    srf_pts_coord ={}
    rs.EnableRedraw(False)
    for i in range(len(srfs)):
        srf_dic [str(i)+'f'] = srfs[i]
        ln = rs.DuplicateEdgeCurves(srfs[i])
        
        nodes_per_face =NodeCoord(ln)
        srf_pts_coord [str(i)+'f'] = nodes_per_face.values()
        for l in ln:
            lns.append(l)
    rs.EnableRedraw(True)
    # here is the nodes' names and their coordinates
    nodes = NodeCoord(lns)
    #rs.AddPoints(nodes.values())
    if p == True:
        print "nodes", nodes
    
    srf_pts ={}
    for k,v in srf_pts_coord.items():
        srf_pts[k] =[]
        for pt in v:
            #print pt
            for ke,ve in nodes.items():
                if pt == ve:
                    #print ve
                    if ke not in srf_pts:
                        srf_pts[k].append(ke)
    if p == True:
        print "srf_pts", srf_pts
    
    
    def points_barr(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
            x.append(j[0])
            y.append(j[1])
            z.append(j[2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/ len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
    
    def point_on_plane_sort(pts_names):
    	list1=[]
    	pts=[]
    	for pt in pts_names:
    		pts.append(nodes[pt])
    	if len(pts)>2:
    		cent=points_barr(pts)
    		#print "cent", cent
    		vec1=ma.VecCreate(pts[0],cent)
    		#print "vec1", vec1
    		vec2=ma.VecCreate(pts[1],cent)
    		#print "vec2", vec2
    		normal=ma.VecCrossProduct(vec1,vec2)
    		leng=ma.VecLength(normal)
    		if leng>1.e-2:
    			normal=ma.VecUnitize(normal)
    		else:
    			vec2=ma.VecCreate(pts[2],cent)
    			normal=ma.VecCrossProduct(vec1,vec2)
    		vecttest=ma.VecCreate(pts[0],cent)
    		vecttest=ma.VecRotate(vecttest,2,normal)
    		angle={}
    		for j in range(len(pts)):
    			#if j !=pts[0]:
    				vect_t=ma.VecCreate(pts[j],cent)
    				vectn2=ma.VecCrossProduct(vecttest,vect_t)
    				#print "vec2", vectn2
    				vectn2=ma.VecUnitize(vectn2)
    				res=ma.VecDotProduct(vectn2,normal)
    				#print res
    				if res<0:
    					angle[j] = 2*180 -ma.VecAngle(vecttest,vect_t)
    				else:
    					angle[j]=ma.VecAngle(vecttest,vect_t)
    		#print angle
    		just_angle=[]
    		for s in angle.values():
    			just_angle.append(s)
    		#print just_angle
    		just_angle.sort()
    		#min_ang=min(just_angle)
    		for l in range(len(just_angle)):
    			for keys,values in angle.items():
    				if just_angle[l]==angle[keys]:
    					if keys not in list1:
    						list1.append(keys)
    		#print "sorted points", list1
    		list1_cord=[]
    		for pt in list1:
    			list1_cord.append(pts[pt])
    		
    		pts_names_sorted=[]
    		for pt in list1_cord:
    			for k, v in nodes.items():
    				if pt==v:
    					if k in pts_names:
    						if k not in pts_names_sorted:
    							pts_names_sorted.append(k)
    		#print "pts_names_sorted", pts_names_sorted
    		return [list1_cord,pts_names_sorted]
    
    def draw_it(t):
        #print " I am drawing it"
        polylines = []
        srfs = []
        rs.EnableRedraw(False)
        for k, v in srf_pts.items():
            new_v = point_on_plane_sort(v)
            pts = []
            for p in new_v[1]:
                #if nodes[p] not in pts:
                    pts.append(nodes[p])
            pts.append(pts[0])
            pline = rs.AddPolyline(pts)
            polylines.append(pline)
        rs.EnableRedraw(True)
        if t == 1:
            rs.DeleteObjects(polylines)
        if t == 0:
            rs.EnableRedraw(False)
            for pl in polylines:
                rs.AddPlanarSrf(pl)
            rs.EnableRedraw(True)
    
    
    # it is also valid to sort the points
    for k,v in srf_pts.items():
        new_list = point_on_plane_sort(v)[1]
        srf_pts[k] = new_list
    if p == True:
        print " srf_pts sorted",  srf_pts 
    
    # now I can delete the connecting edges of surfaces
    rs.DeleteObjects(lns)
    
    # here I need to construct surfaces with reversed 
    # order to make a pair faces per edge
    srf_pts_rev ={}
    for k,v in srf_pts.items():
        new_v = copy.deepcopy(v)
        new_list =[]
        for pt in reversed(new_v):
            new_list.append(pt)
        srf_pts_rev ['-'+k] = new_list
    if p == True:
        print "srf_pts_rev", srf_pts_rev
    
    
    # Now I can sort the faces according to their edge names
    srf_edge ={}
    for k, v in srf_pts.items():
        new_list =[]
        for i in range(len(v)-1):
            list_test = [v[i], v[i+1]]
            new_list.append(list_test)
        new_list.append([v[-1], v[0]])
        srf_edge [k] = new_list
    if p == True:
        print "srf_edge", srf_edge
    
    # Now I can sort the faces according to their edge names
    # for reversed faces
    srf_edge_rev ={}
    for k, v in srf_pts_rev.items():
        new_list =[]
        for i in range(len(v)-1):
            list_test = [v[i], v[i+1]]
            new_list.append(list_test)
        new_list.append([v[-1], v[0]])
        srf_edge_rev [k] = new_list
    if p == True:
        print "srf_edge_rev", srf_edge_rev
    
    
    # now I need to put all the edges in a list
    all_edges = []
    
    for k, v in srf_edge.items():
        for edge in v:
            new_list = list(edge)
            new_list.sort()
            if tuple(new_list) not in all_edges:
                all_edges.append(tuple(new_list))
    
    if p == True:
        print "all_edges", all_edges
    
    # I do not need to include the other direction of 
    # edges now I can find all the faces that are connected
    # to each edge for both lists of faces
    
    edge_face = {}
    for group in all_edges:
        edge_face[group] = []
        test = list(group)
        for k, v in srf_edge.items():
            if test in v:
                if k not in edge_face[group]:
                    edge_face[group].append(k)
        # I can also search in the negatie faces lists
        for k, v in srf_edge_rev.items():
            if test in v:
                if k not in edge_face[group]:
                    edge_face[group].append(k)
        
    if p == True:
        print "edge_face", edge_face
    """
    all_face_dic ={}
    for k, v in srf_edge.items():
        all_face_dic[k] = v
    for k, v in srf_edge_rev.items():
        all_face_dic[k] = v
    
    print "all_face_dic", all_face_dic
    
    
    
    #______________________________________________
    
    # This part is the topological sorting I do
    # now I need to make a dictionary that has all the faces
    
    
    # now I would like to make a data structure for
    # the edge before and after the current edge
    # lets do for edge before
    face_edge_before = {}
    face_edge_after = {}
    for k, v in edge_face.items():
        face_edge_after[k] = {}
        face_edge_before[k] = {}
        for face in v:
              if list(k) in all_face_dic[face]:
                  a_list = all_face_dic[face]
                  #print all_face_dic[face][0]
                  #print a_list.index(list(k))
                  #print "len", len(a_list)
                  #print "a_list", a_list
                  r = a_list.index(list(k))
                  if r == 0:
                     #print a_list[r+1]
                      face_edge_after[k][face] = a_list[r+1]
                      face_edge_before[k][face] = a_list[-1]
                      #if r != (len(a_list)-1):
                  elif r == len(a_list)-1:
                      face_edge_after[k][face] = a_list[0]
                      face_edge_before[k][face] = a_list[r-1]
                  else:
                      face_edge_after[k][face] = a_list[r+1]
                      face_edge_before[k][face] = a_list[r-1]
    print "face_edge_after", face_edge_after
    print "face_edge_before", face_edge_before
    
    # I would also need to find all the faces 
    # That are attached to a single node
    
    all_pts = nodes.keys()
    print "all_pts", all_pts
    
    nodes_face ={}
    for pt in all_pts:
        nodes_face[pt] = []
        for k, v in srf_pts.items():
            if pt in v:
                if k not in nodes_face[pt]:
                    nodes_face[pt].append(k)
        # I can also add the faces in
        # the reversed order
        for k, v in srf_pts_rev.items():
            if pt in v:
                if k not in nodes_face[pt]:
                    nodes_face[pt].append(k)
    
    print "nodes_face", nodes_face
    
    # I need to make combinations of all the faces
    # that share the same edge
    edge_face_comb = {}
    for k, v in edge_face.items():
        new_list = []
        if len (v) == 2:
            new_list = [v]
            edge_face_comb[k] = new_list
        else:
            new_list = []
            for i in range(len(v)):
                test = v [i]
                for j in range(len(v)):
                    if v[j] != test:
                        group = [test, v[j]]
                        group.sort()
                        if group not in new_list:
                            new_list.append(group)
            edge_face_comb[k] = new_list
        
    print "edge_face_comb", edge_face_comb
    
    # now that I have all the face combinations around each 
    # edge I can search for the third face that is shared by the corner
    face_pair_new = []
    edge_face_comb_sort ={}
    for k, v in edge_face_comb.items():
        edge_face_comb_sort[k]  = []
        print "edge", k
        print "__________"
        for faces in v:
            group = []
            #print faces
            list_1 = face_edge_after[k][faces[0]]
            #print "list_1", list_1
            list_2 = face_edge_after[k][faces[1]]
            list_rev =[]
            for t in reversed(list_2):
                list_rev.append(t)
            #print "list_2", list_rev
            for face in nodes_face[k[1]]:
                #print "node", k[1]
                #print "face in node", nodes_face[k[1]]
                #print "I will check for ", face
                #print all_face_dic[face]
                if list_1 in all_face_dic[face]:
                    #print "the list_1"
                    #print all_face_dic[face], face
                    if list_rev in all_face_dic[face]:
                        #print"the list_2"
                        #print "face", face
                        group = face
            print group
            if group:
                if faces not in edge_face_comb_sort[k]:
                    edge_face_comb_sort[k].append(faces)
                if faces not in face_pair_new:
                    face_pair_new.append(faces)
    print "face_pair_new", face_pair_new
    
    # this was for after now I need to search for the nodes
    # before
    
    for k, v in edge_face_comb.items():
        print "edge", k
        for faces in v:
            group = []
            #print faces
            list_1 = face_edge_before[k][faces[0]]
            #print "list_1", list_1
            list_2 = face_edge_before[k][faces[1]]
            list_rev =[]
            for t in reversed(list_2):
                list_rev.append(t)
            #print "list_2", list_rev
            for face in nodes_face[k[0]]:
                if list_1 in all_face_dic[face]:
                    #print all_face_dic[face], face
                    if list_rev in all_face_dic[face]:
                        #print "face", face
                        group = face
            #print group
            if group:
                if faces not in edge_face_comb_sort[k]:
                    edge_face_comb_sort[k].append(faces)
                if faces not in face_pair_new:
                    face_pair_new.append(faces)
    print "edge_face_comb_sort", edge_face_comb_sort
    print "face_pair_new", face_pair_new
    
    all_pairs =[]
    for k, v in edge_face_comb_sort.items():
        for group in v:
            group.sort()
            if group not in all_pairs:
                all_pairs.append(group)
    print "all_pairs", all_pairs
    
    # now I need to run my trick by making oppsite sign for
    # for the
    all_pairs_new =[] 
    for group in all_pairs:
        if group[1][0] == '-':
            print group[1][0]
            
    breath = BreathFirstSearch(face_pair_new)
    print breath
    
    # now I can search in the face edge after to see which
    # face is connected to the pairs that I am looking 
    for k, v  in edge_face.items():
        all_faces = nodes_face[k[1]]
        #print k[1]
        #print all_faces
        #print k 
    
    #_______________________________________________
    
    
    
    # lets find all the faces that belong to the same
    # edge
    all_edge_face = {}
    for edge in all_edges:
        all_edge_face[edge] =[]
        rev_edge = []
        for pt in reversed(edge):
            rev_edge.append(pt)
        #print rev_edge
        new_edge = list(edge)
        #print new_edge
        for k, v in all_face_dic.items():
            if new_edge in v:
                if k not in all_edge_face[edge]:
                    all_edge_face[edge] .append(k)
            if rev_edge in v:
                if k not in all_edge_face[edge]:
                    all_edge_face[edge] .append(k)
        
    print "all_edge_face", all_edge_face
    """
    
    for k,v in edge_face.items():
        if len(v) == 1:
            rs.MessageBox("There is a single Face in the selections")
    
    # now that I have the faces around each face 
    # I need to sort them in order to sort them around each edge
    # before that I need to store their centroids in a dictionary
    
    srf_cents = {}
    for k, v in srf_pts.items():
        new_list = []
        for pt in v:
            new_list.append(nodes[pt])
        cent = points_barr(new_list)
        #rs.AddTextDot(str(k), srf_cents[k])
        vec1 = ma.VecCreate(nodes[v[1]], nodes[v[0]])
        vec2 = ma.VecCreate(nodes[v[2]], nodes[v[1]])
        norm = ma.VecCrossProduct(vec1, vec2)
        norm = ma.VecUnitize(norm)
        norm = ma.VecScale(norm, 0.1)
        srf_cents[k] =ma.PtAdd(cent, norm)
        #rs.AddPoint(srf_cents[k])
        #rs.AddTextDot(str(k), srf_cents[k])
    # I need to also do it for the negative faces
    
    for k, v in srf_pts_rev.items():
        new_list = []
        
        for pt in v:
            new_list.append(nodes[pt])
        #srf_cents[k] = points_barr(new_list)
        cent = points_barr(new_list)
        #rs.AddTextDot(str(k), srf_cents[k])
        vec1 = ma.VecCreate(nodes[v[1]], nodes[v[0]])
        vec2 = ma.VecCreate(nodes[v[2]], nodes[v[1]])
        norm = ma.VecCrossProduct(vec1, vec2)
        norm = ma.VecUnitize(norm)
        norm = ma.VecScale(norm, 0.1)
        srf_cents[k] =ma.PtAdd(cent, norm)
        #rs.AddPoint(srf_cents[k])
        #rs.AddTextDot(str(k), srf_cents[k])
    if p == True:
        print "srf_cents", srf_cents
    
    def face_sort(edge, face_names):
        list1=[]
        list2 =[]
        normal=ma.VecCreate(nodes[edge[1]],nodes[edge[0]])
        mid = points_barr([nodes[edge[0]], nodes[edge[1]]])
        #print mid
        plane = rs.PlaneFromNormal(mid, normal)
        #print "plane", plane
        
        pts=[]
        face_cents_new = {}
        for pt in face_names:
            p = rs.PlaneClosestPoint(plane, srf_cents[pt])
            pts.append(p)
            face_cents_new[pt] = p
        #print "pts", pts
        vecttest = ma.VecCreate(pts[0],mid)
        vecttest = ma.VecRotate(vecttest,2,normal)
        vecttest = ma.VecUnitize(vecttest)
        angle={}
        for j in range(len(pts)):
            #if j !=pts[0]:
                vect_t=ma.VecCreate(pts[j],mid)
                vect_t = ma.VecUnitize(vect_t)
                vectn2=ma.VecCrossProduct(vecttest,vect_t)
                #print "vec2", vectn2
                vectn2=ma.VecUnitize(vectn2)
                res=ma.VecDotProduct(vectn2,normal)
                #print res
                if res<0:
                    angle[j] = 2*180 - ma.VecAngle(vecttest,vect_t)
                else:
                    angle[j]=ma.VecAngle(vecttest,vect_t)
        #print angle
        just_angle=[]
        for s in angle.values():
        	just_angle.append(s)
        
        just_angle.sort()
        #print just_angle
        #min_ang=min(just_angle)
        for l in range(len(just_angle)):
        	for keys,values in angle.items():
        		if just_angle[l]==angle[keys]:
        			if keys not in list1:
        				list1.append(keys)
        #print "sorted points", list1
        list1_cord=[]
        for pt in list1:
        	list1_cord.append(pts[pt])
        #print "list1_cord", list1_cord
        
        pts_names_sorted=[]
        for pt in list1_cord:
        	for k, v in face_cents_new.items():
        		if pt == v:
        			if k in face_names:
        				if k not in pts_names_sorted:
        					pts_names_sorted.append(k)
        #print "pts_names_sorted", pts_names_sorted
        #print "pts_names_sorted", pts_names_sorted
        return pts_names_sorted
    
    
    # now that I have the centers it is possible to sort them
    # I need to have a function to sort them 
    edge_face_sorted = {}
    for k, v in edge_face.items():
        edge_face_sorted[k] = face_sort(k, v)
    if p == True:
        print "edge_face_sorted", edge_face_sorted
    
    # now that I have sorted faces I can add to the list of each face
    # and then add the face with opposite name
    
    face_pairs = []
    for k, v in edge_face_sorted.items():
        v.append(v[0])
        for i in range(len(v)-1):
            name = v[i+1]
            if name[0] == '-':
                #print "name", name
                new_name =''
                for k in range(1,len(name)):
                    new_name += name[k]
            if name[0] != '-':
                new_name ='-'
                for z in range(len(name)):
                    new_name += name[z]
            #print "v", v[i]
            #print new_name
            
            group = [v[i], new_name]
            if group not in face_pairs:
                face_pairs.append(group)
    if p == True:
        print "face_pairs", face_pairs
    
    # now I can use the command breathfirstsearch
    
    poly_lists = BreathFirstSearch(face_pairs)
    if p == True:
        print "poly_lists", poly_lists
    
    def PolyhedronVolume(poly_faces):
        # lets just make sure that the face is not negative
        new_poly_faces = []
        for face in poly_faces:
            if face[0] == '-':
                str1 = ''
                for i in range(1,len(face)):
                    str1 += face[i]
                if str1 not in new_poly_faces:
                    new_poly_faces.append(str1)
            else:
                if face not in new_poly_faces:
                    new_poly_faces.append(face)
        # first lets find the centroid of the
        # polyhedron
        all_pts =[]
        for face in new_poly_faces:
            if face in srf_pts:
                for pt in srf_pts[face]:
                    if pt not in all_pts:
                        all_pts.append(pt)
            else:
                for pt in srf_pts_rev[face]:
                    if pt not in all_pts:
                        all_pts.append(pt)
        all_pts_cord = []
        for pt in all_pts:
            all_pts_cord.append(nodes[pt])
        
        cent = points_barr(all_pts_cord)
        vol = []
        for face in new_poly_faces:
            centroid = srf_cents[face]
            dist = rs.Distance(centroid, cent)
            a = rs.SurfaceArea(srf_dic[face])
            vol1 = dist * a[0]
            vol.append(vol1)
        
        volume = sum(vol)
        return volume
    
    
    # Now I can find the exterior polyhdron and
    # all other interior polyhedorns
    # There is a possiblity that there are only
    # two polyhedrons interior and exterior, in other word, 
    # there is only one force polyhedorn
    
    ex_poly = []
    int_poly = []
    # if there is only one interior and one exterior
    # polyhedron exists
    if len(poly_lists) == 2:
        ex_poly = poly_lists[0]
        int_poly = [poly_lists[1]]
    
    # In order to find the exterior polyhedron
    # I need to calculate the volume of the polyhedrons
    # and find the one with te biggest number
    
    # if the number of polyhedrons
    # are bigger than 2 then:
    else :
        
        poly_dic_vol = {}
        poly_dic = {}
        for i in range(len(poly_lists)):
            poly_dic_vol[str(i)+ 'pol'] = PolyhedronVolume(poly_lists[i])
            poly_dic [str(i)+ 'pol'] = poly_lists[i]
        
        if p == True:
            print "poly_dic_vol", poly_dic_vol
            print "poly_dic", poly_dic
        
        # lets put together all the areas
        all_vol = poly_dic_vol.values()
        max_vol = max(all_vol)
        
        
        for k, v in poly_dic_vol.items():
            if max_vol == v:
                ex_poly = poly_dic[k]
            else:
                int_poly.append(poly_dic[k])
    # I need to return the face names to the regular
    # face names withou '-' for further use
    new_int_poly = []
    for group in int_poly:
        new = []
        for name in group:
            if name[0] == '-':
                new_list =''
                for i in range(1, len(name)):
                    new_list += name[i]
                if new_list not in new:
                    new.append(new_list)
            else:
                new.append(name)
        new_int_poly.append(new)
    #print "new_int_poly", new_int_poly
    
    int_poly = new_int_poly
    
    # I should do the same for exterior polyhedron
    new_ex_poly = []
    new = []
    for name in ex_poly:
        if name[0] == '-':
            new_list =''
            for i in range(1, len(name)):
                new_list += name[i]
            if new_list not in new:
                new.append(new_list)
        else:
            new.append(name)
    new_ex_poly = new
    #print "new_ex_poly", new_ex_poly
    ex_poly = new_ex_poly
    
    if p == True:
        print "exterior polyhedron", ex_poly
        print "interior polyherdon", int_poly
    def draw_it(face, t, i):
        rs.EnableRedraw(False)
        if face[0] == '-':
            new_str = ''
            for i in range(1,len(face)):
                new_str += face[i]
            face = new_str
        polylines = []
        pts = []
        for p in srf_pts[face]:
            if nodes[p] not in pts:
                pts.append(nodes[p])
        pts.append(pts[0])
        pline = rs.AddPolyline(pts)
        polylines.append(pline)
        srf = rs.AddPlanarSrf(polylines)
        R = 255 - i* 2
        if R < 0:
            #R = 0 + i * 5 
            R = 0
        G = 0 + i*2
        if G > 255:
            #G = 255 - 5 * i
            G = 255
        B = 125 + i * 2
        if B > 255:
            #B = 255 - i * 5
            B = 255
        rs.ObjectColor(srf, [R , G , B ])
        if t == 1:
            rs.DeleteObjects(polylines)
        rs.EnableRedraw(True)
        return srf
        
    if draw == True:
        rs.AddLayer('Polyhedrons', [200, 100, 125])
        rs.AddLayer('int PH', [200, 100, 125])
        rs.AddLayer('ext PH', [250, 150, 100])
        rs.ParentLayer('int PH', 'Polyhedrons')
        rs.ParentLayer('ext PH', 'Polyhedrons')
        
        for i in range(len(int_poly)):
            srfs = []
            #rs.AddLayer('poly_'+str(i), [255 - i* 5, 0 + i*5, 125 + i * 5])
            rs.CurrentLayer('int PH')
            rs.AddGroup('poly_' + str(i))
            for face in int_poly[i]:
                srf = draw_it(face, 1, i)
                rs.AddObjectToGroup(srf, 'poly_' + str(i))
            
        rs.AddGroup('Exterior Polyhedron')
        for face in ex_poly:
            rs.CurrentLayer('ext PH')
            srf = draw_it(face, 1, 14)
            rs.AddObjectToGroup(srf, 'Exterior Polyhedron')
    new_ex_poly=[]
    new_ex_poly.append(ex_poly)
    return [int_poly, new_ex_poly, srf_pts, nodes]

def PolyhedronFromSrfs(srfs, p, draw):
    """
    srfs: input surfaces
    p: if True then it will print the infromation
    draw:  if True the layer named 'Polyhedron' is
            constructed and the polyhedrons will be 
            drawn in a seperate groups stored in the
            interior and exterior cells
    """
    
    
    lns = []
    srf_dic = {}
    srf_pts_coord ={}
    rs.EnableRedraw(False)
    for i in range(len(srfs)):
        srf_dic [str(i)+'f'] = srfs[i]
        ln = rs.DuplicateEdgeCurves(srfs[i])
        
        nodes_per_face =NodeCoord(ln)
        srf_pts_coord [str(i)+'f'] = nodes_per_face.values()
        for l in ln:
            lns.append(l)
    rs.EnableRedraw(True)
    # here is the nodes' names and their coordinates
    nodes = NodeCoord(lns)
    #rs.AddPoints(nodes.values())
    if p == True:
        print "nodes", nodes
    
    new_nodes = {}
    for k, v in nodes.items():
        new_nodes[str(k)] = v
    
    nodes = {}
    for k, v in new_nodes.items():
        nodes[k] = v
    
    srf_pts ={}
    for k,v in srf_pts_coord.items():
        srf_pts[k] =[]
        for pt in v:
            #print pt
            for ke,ve in nodes.items():
                if pt == ve:
                    #print ve
                    if ke not in srf_pts:
                        srf_pts[k].append(ke)
    if p == True:
        print "srf_pts", srf_pts
    
    def points_barr(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
            x.append(j[0])
            y.append(j[1])
            z.append(j[2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/ len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
    
    def point_on_plane_sort(pts_names):
    	list1=[]
    	pts=[]
    	for pt in pts_names:
    		pts.append(nodes[pt])
    	if len(pts)>2:
    		cent=points_barr(pts)
    		#print "cent", cent
    		vec1=ma.VecCreate(pts[0],cent)
    		#print "vec1", vec1
    		vec2=ma.VecCreate(pts[1],cent)
    		#print "vec2", vec2
    		normal=ma.VecCrossProduct(vec1,vec2)
    		leng=ma.VecLength(normal)
    		if leng>1.e-2:
    			normal=ma.VecUnitize(normal)
    		else:
    			vec2=ma.VecCreate(pts[2],cent)
    			normal=ma.VecCrossProduct(vec1,vec2)
    		vecttest=ma.VecCreate(pts[0],cent)
    		vecttest=ma.VecRotate(vecttest,2,normal)
    		angle={}
    		for j in range(len(pts)):
    			#if j !=pts[0]:
    				vect_t=ma.VecCreate(pts[j],cent)
    				vectn2=ma.VecCrossProduct(vecttest,vect_t)
    				#print "vec2", vectn2
    				vectn2=ma.VecUnitize(vectn2)
    				res=ma.VecDotProduct(vectn2,normal)
    				#print res
    				if res<0:
    					angle[j] = 2*180 -ma.VecAngle(vecttest,vect_t)
    				else:
    					angle[j]=ma.VecAngle(vecttest,vect_t)
    		#print angle
    		just_angle=[]
    		for s in angle.values():
    			just_angle.append(s)
    		#print just_angle
    		just_angle.sort()
    		#min_ang=min(just_angle)
    		for l in range(len(just_angle)):
    			for keys,values in angle.items():
    				if just_angle[l]==angle[keys]:
    					if keys not in list1:
    						list1.append(keys)
    		#print "sorted points", list1
    		list1_cord=[]
    		for pt in list1:
    			list1_cord.append(pts[pt])
    		
    		pts_names_sorted=[]
    		for pt in list1_cord:
    			for k, v in nodes.items():
    				if pt==v:
    					if k in pts_names:
    						if k not in pts_names_sorted:
    							pts_names_sorted.append(k)
    		#print "pts_names_sorted", pts_names_sorted
    		return [list1_cord,pts_names_sorted]
    
    def draw_it(t):
        #print " I am drawing it"
        polylines = []
        srfs = []
        rs.EnableRedraw(False)
        for k, v in srf_pts.items():
            new_v = point_on_plane_sort(v)
            pts = []
            for p in new_v[1]:
                #if nodes[p] not in pts:
                    pts.append(nodes[p])
            pts.append(pts[0])
            pline = rs.AddPolyline(pts)
            polylines.append(pline)
        rs.EnableRedraw(True)
        if t == 1:
            rs.DeleteObjects(polylines)
        if t == 0:
            rs.EnableRedraw(False)
            for pl in polylines:
                rs.AddPlanarSrf(pl)
            rs.EnableRedraw(True)
    
    # it is also valid to sort the points
    for k,v in srf_pts.items():
        new_list = point_on_plane_sort(v)[1]
        srf_pts[k] = new_list
    if p == True:
        print " srf_pts sorted",  srf_pts 
    
    # now I can delete the connecting edges of surfaces
    rs.DeleteObjects(lns)
    
    # here I need to construct surfaces with reversed 
    # order to make a pair faces per edge
    srf_pts_rev ={}
    for k,v in srf_pts.items():
        new_v = copy.deepcopy(v)
        new_list =[]
        for pt in reversed(new_v):
            new_list.append(pt)
        srf_pts_rev ['-'+k] = new_list
    if p == True:
        print "srf_pts_rev", srf_pts_rev
    
    
    # Now I can sort the faces according to their edge names
    srf_edge ={}
    for k, v in srf_pts.items():
        new_list =[]
        for i in range(len(v)-1):
            list_test = [v[i], v[i+1]]
            new_list.append(list_test)
        new_list.append([v[-1], v[0]])
        srf_edge [k] = new_list
    if p == True:
        print "srf_edge", srf_edge
    
    # Now I can sort the faces according to their edge names
    # for reversed faces
    srf_edge_rev ={}
    for k, v in srf_pts_rev.items():
        new_list =[]
        for i in range(len(v)-1):
            list_test = [v[i], v[i+1]]
            new_list.append(list_test)
        new_list.append([v[-1], v[0]])
        srf_edge_rev [k] = new_list
    if p == True:
        print "srf_edge_rev", srf_edge_rev
    
    
    # now I need to put all the edges in a list
    all_edges = []
    
    for k, v in srf_edge.items():
        for edge in v:
            new_list = list(edge)
            new_list.sort()
            if tuple(new_list) not in all_edges:
                all_edges.append(tuple(new_list))
    
    if p == True:
        print "all_edges", all_edges
    
    # I do not need to include the other direction of 
    # edges now I can find all the faces that are connected
    # to each edge for both lists of faces
    
    edge_face = {}
    for group in all_edges:
        edge_face[group] = []
        test = list(group)
        for k, v in srf_edge.items():
            if test in v:
                if k not in edge_face[group]:
                    edge_face[group].append(k)
        # I can also search in the negatie faces lists
        for k, v in srf_edge_rev.items():
            if test in v:
                if k not in edge_face[group]:
                    edge_face[group].append(k)
        
    if p == True:
        print "edge_face", edge_face
    """
    all_face_dic ={}
    for k, v in srf_edge.items():
        all_face_dic[k] = v
    for k, v in srf_edge_rev.items():
        all_face_dic[k] = v
    
    print "all_face_dic", all_face_dic
    
    
    #______________________________________________
    
    # This part is the topological sorting I do
    # now I need to make a dictionary that has all the faces
    
    
    # now I would like to make a data structure for
    # the edge before and after the current edge
    # lets do for edge before
    face_edge_before = {}
    face_edge_after = {}
    for k, v in edge_face.items():
        face_edge_after[k] = {}
        face_edge_before[k] = {}
        for face in v:
              if list(k) in all_face_dic[face]:
                  a_list = all_face_dic[face]
                  #print all_face_dic[face][0]
                  #print a_list.index(list(k))
                  #print "len", len(a_list)
                  #print "a_list", a_list
                  r = a_list.index(list(k))
                  if r == 0:
                     #print a_list[r+1]
                      face_edge_after[k][face] = a_list[r+1]
                      face_edge_before[k][face] = a_list[-1]
                      #if r != (len(a_list)-1):
                  elif r == len(a_list)-1:
                      face_edge_after[k][face] = a_list[0]
                      face_edge_before[k][face] = a_list[r-1]
                  else:
                      face_edge_after[k][face] = a_list[r+1]
                      face_edge_before[k][face] = a_list[r-1]
    print "face_edge_after", face_edge_after
    print "face_edge_before", face_edge_before
    
    # I would also need to find all the faces 
    # That are attached to a single node
    
    all_pts = nodes.keys()
    print "all_pts", all_pts
    
    nodes_face ={}
    for pt in all_pts:
        nodes_face[pt] = []
        for k, v in srf_pts.items():
            if pt in v:
                if k not in nodes_face[pt]:
                    nodes_face[pt].append(k)
        # I can also add the faces in
        # the reversed order
        for k, v in srf_pts_rev.items():
            if pt in v:
                if k not in nodes_face[pt]:
                    nodes_face[pt].append(k)
    
    print "nodes_face", nodes_face
    
    # I need to make combinations of all the faces
    # that share the same edge
    edge_face_comb = {}
    for k, v in edge_face.items():
        new_list = []
        if len (v) == 2:
            new_list = [v]
            edge_face_comb[k] = new_list
        else:
            new_list = []
            for i in range(len(v)):
                test = v [i]
                for j in range(len(v)):
                    if v[j] != test:
                        group = [test, v[j]]
                        group.sort()
                        if group not in new_list:
                            new_list.append(group)
            edge_face_comb[k] = new_list
        
    print "edge_face_comb", edge_face_comb
    
    # now that I have all the face combinations around each 
    # edge I can search for the third face that is shared by the corner
    face_pair_new = []
    edge_face_comb_sort ={}
    for k, v in edge_face_comb.items():
        edge_face_comb_sort[k]  = []
        print "edge", k
        print "__________"
        for faces in v:
            group = []
            #print faces
            list_1 = face_edge_after[k][faces[0]]
            #print "list_1", list_1
            list_2 = face_edge_after[k][faces[1]]
            list_rev =[]
            for t in reversed(list_2):
                list_rev.append(t)
            #print "list_2", list_rev
            for face in nodes_face[k[1]]:
                #print "node", k[1]
                #print "face in node", nodes_face[k[1]]
                #print "I will check for ", face
                #print all_face_dic[face]
                if list_1 in all_face_dic[face]:
                    #print "the list_1"
                    #print all_face_dic[face], face
                    if list_rev in all_face_dic[face]:
                        #print"the list_2"
                        #print "face", face
                        group = face
            print group
            if group:
                if faces not in edge_face_comb_sort[k]:
                    edge_face_comb_sort[k].append(faces)
                if faces not in face_pair_new:
                    face_pair_new.append(faces)
    print "face_pair_new", face_pair_new
    
    # this was for after now I need to search for the nodes
    # before
    
    for k, v in edge_face_comb.items():
        print "edge", k
        for faces in v:
            group = []
            #print faces
            list_1 = face_edge_before[k][faces[0]]
            #print "list_1", list_1
            list_2 = face_edge_before[k][faces[1]]
            list_rev =[]
            for t in reversed(list_2):
                list_rev.append(t)
            #print "list_2", list_rev
            for face in nodes_face[k[0]]:
                if list_1 in all_face_dic[face]:
                    #print all_face_dic[face], face
                    if list_rev in all_face_dic[face]:
                        #print "face", face
                        group = face
            #print group
            if group:
                if faces not in edge_face_comb_sort[k]:
                    edge_face_comb_sort[k].append(faces)
                if faces not in face_pair_new:
                    face_pair_new.append(faces)
    print "edge_face_comb_sort", edge_face_comb_sort
    print "face_pair_new", face_pair_new
    
    all_pairs =[]
    for k, v in edge_face_comb_sort.items():
        for group in v:
            group.sort()
            if group not in all_pairs:
                all_pairs.append(group)
    print "all_pairs", all_pairs
    
    # now I need to run my trick by making oppsite sign for
    # for the
    all_pairs_new =[] 
    for group in all_pairs:
        if group[1][0] == '-':
            print group[1][0]
            
    breath = BreathFirstSearch(face_pair_new)
    print breath
    
    # now I can search in the face edge after to see which
    # face is connected to the pairs that I am looking 
    for k, v  in edge_face.items():
        all_faces = nodes_face[k[1]]
        #print k[1]
        #print all_faces
        #print k 
    
    #_______________________________________________
    
    
    
    # lets find all the faces that belong to the same
    # edge
    all_edge_face = {}
    for edge in all_edges:
        all_edge_face[edge] =[]
        rev_edge = []
        for pt in reversed(edge):
            rev_edge.append(pt)
        #print rev_edge
        new_edge = list(edge)
        #print new_edge
        for k, v in all_face_dic.items():
            if new_edge in v:
                if k not in all_edge_face[edge]:
                    all_edge_face[edge] .append(k)
            if rev_edge in v:
                if k not in all_edge_face[edge]:
                    all_edge_face[edge] .append(k)
        
    print "all_edge_face", all_edge_face
    """
    
    for k,v in edge_face.items():
        if len(v) == 1:
            rs.MessageBox("There is a single Face in the selections")
    
    # now that I have the faces around each face 
    # I need to sort them in order to sort them around each edge
    # before that I need to store their centroids in a dictionary
    
    srf_cents = {}
    for k, v in srf_pts.items():
        new_list = []
        for pt in v:
            new_list.append(nodes[pt])
        cent = points_barr(new_list)
        #rs.AddTextDot(str(k), srf_cents[k])
        vec1 = ma.VecCreate(nodes[v[1]], nodes[v[0]])
        vec2 = ma.VecCreate(nodes[v[2]], nodes[v[1]])
        norm = ma.VecCrossProduct(vec1, vec2)
        norm = ma.VecUnitize(norm)
        norm = ma.VecScale(norm, 0.1)
        srf_cents[k] =ma.PtAdd(cent, norm)
        #rs.AddPoint(srf_cents[k])
        #rs.AddTextDot(str(k), srf_cents[k])
    # I need to also do it for the negative faces
    
    for k, v in srf_pts_rev.items():
        new_list = []
        
        for pt in v:
            new_list.append(nodes[pt])
        #srf_cents[k] = points_barr(new_list)
        cent = points_barr(new_list)
        #rs.AddTextDot(str(k), srf_cents[k])
        vec1 = ma.VecCreate(nodes[v[1]], nodes[v[0]])
        vec2 = ma.VecCreate(nodes[v[2]], nodes[v[1]])
        norm = ma.VecCrossProduct(vec1, vec2)
        norm = ma.VecUnitize(norm)
        norm = ma.VecScale(norm, 0.1)
        srf_cents[k] =ma.PtAdd(cent, norm)
        #rs.AddPoint(srf_cents[k])
        #rs.AddTextDot(str(k), srf_cents[k])
    if p == True:
        print "srf_cents", srf_cents
    
    def face_sort(edge, face_names):
        list1=[]
        list2 =[]
        normal=ma.VecCreate(nodes[edge[1]],nodes[edge[0]])
        mid = points_barr([nodes[edge[0]], nodes[edge[1]]])
        #print mid
        plane = rs.PlaneFromNormal(mid, normal)
        #print "plane", plane
        
        pts=[]
        face_cents_new = {}
        for pt in face_names:
            p = rs.PlaneClosestPoint(plane, srf_cents[pt])
            pts.append(p)
            face_cents_new[pt] = p
        #print "pts", pts
        vecttest = ma.VecCreate(pts[0],mid)
        vecttest = ma.VecRotate(vecttest,2,normal)
        vecttest = ma.VecUnitize(vecttest)
        angle={}
        for j in range(len(pts)):
            #if j !=pts[0]:
                vect_t=ma.VecCreate(pts[j],mid)
                vect_t = ma.VecUnitize(vect_t)
                vectn2=ma.VecCrossProduct(vecttest,vect_t)
                #print "vec2", vectn2
                vectn2=ma.VecUnitize(vectn2)
                res=ma.VecDotProduct(vectn2,normal)
                #print res
                if res<0:
                    angle[j] = 2*180 - ma.VecAngle(vecttest,vect_t)
                else:
                    angle[j]=ma.VecAngle(vecttest,vect_t)
        #print angle
        just_angle=[]
        for s in angle.values():
        	just_angle.append(s)
        
        just_angle.sort()
        #print just_angle
        #min_ang=min(just_angle)
        for l in range(len(just_angle)):
        	for keys,values in angle.items():
        		if just_angle[l]==angle[keys]:
        			if keys not in list1:
        				list1.append(keys)
        #print "sorted points", list1
        list1_cord=[]
        for pt in list1:
        	list1_cord.append(pts[pt])
        #print "list1_cord", list1_cord
        
        pts_names_sorted=[]
        for pt in list1_cord:
        	for k, v in face_cents_new.items():
        		if pt == v:
        			if k in face_names:
        				if k not in pts_names_sorted:
        					pts_names_sorted.append(k)
        #print "pts_names_sorted", pts_names_sorted
        #print "pts_names_sorted", pts_names_sorted
        return pts_names_sorted
    
    
    # now that I have the centers it is possible to sort them
    # I need to have a function to sort them 
    edge_face_sorted = {}
    for k, v in edge_face.items():
        edge_face_sorted[k] = face_sort(k, v)
    if p == True:
        print "edge_face_sorted", edge_face_sorted
    
    # now that I have sorted faces I can add to the list of each face
    # and then add the face with opposite name
    
    face_pairs = []
    for k, v in edge_face_sorted.items():
        v.append(v[0])
        for i in range(len(v)-1):
            name = v[i+1]
            if name[0] == '-':
                #print "name", name
                new_name =''
                for k in range(1,len(name)):
                    new_name += name[k]
            if name[0] != '-':
                new_name ='-'
                for z in range(len(name)):
                    new_name += name[z]
            #print "v", v[i]
            #print new_name
            
            group = [v[i], new_name]
            if group not in face_pairs:
                face_pairs.append(group)
    if p == True:
        print "face_pairs", face_pairs
    
    # now I can use the command breathfirstsearch
    
    poly_lists =BreathFirstSearch(face_pairs)
    if p == True:
        print "poly_lists", poly_lists
    
    def PolyhedronVolume(poly_faces):
        # lets just make sure that the face is not negative
        new_poly_faces = []
        for face in poly_faces:
            if face[0] == '-':
                str1 = ''
                for i in range(1,len(face)):
                    str1 += face[i]
                if str1 not in new_poly_faces:
                    new_poly_faces.append(str1)
            else:
                if face not in new_poly_faces:
                    new_poly_faces.append(face)
        # first lets find the centroid of the
        # polyhedron
        all_pts =[]
        for face in new_poly_faces:
            if face in srf_pts:
                for pt in srf_pts[face]:
                    if pt not in all_pts:
                        all_pts.append(pt)
            else:
                for pt in srf_pts_rev[face]:
                    if pt not in all_pts:
                        all_pts.append(pt)
        all_pts_cord = []
        for pt in all_pts:
            all_pts_cord.append(nodes[pt])
        
        cent = points_barr(all_pts_cord)
        vol = []
        for face in new_poly_faces:
            centroid = srf_cents[face]
            dist = rs.Distance(centroid, cent)
            a = rs.SurfaceArea(srf_dic[face])
            vol1 = dist * a[0]
            vol.append(vol1)
        
        volume = sum(vol)
        return volume
    
    
    # Now I can find the exterior polyhdron and
    # all other interior polyhedorns
    # There is a possiblity that there are only
    # two polyhedrons interior and exterior, in other word, 
    # there is only one force polyhedorn
    
    ex_poly = []
    int_poly = []
    # if there is only one interior and one exterior
    # polyhedron exists
    if len(poly_lists) == 2:
        ex_poly = poly_lists[0]
        int_poly = [poly_lists[1]]
    
    # In order to find the exterior polyhedron
    # I need to calculate the volume of the polyhedrons
    # and find the one with te biggest number
    
    # if the number of polyhedrons
    # are bigger than 2 then:
    else :
        
        poly_dic_vol = {}
        poly_dic = {}
        for i in range(len(poly_lists)):
            poly_dic_vol[str(i)+ 'pol'] = PolyhedronVolume(poly_lists[i])
            poly_dic [str(i)+ 'pol'] = poly_lists[i]
        
        if p == True:
            print "poly_dic_vol", poly_dic_vol
            print "poly_dic", poly_dic
        
        # lets put together all the areas
        all_vol = poly_dic_vol.values()
        max_vol = max(all_vol)
        
        
        for k, v in poly_dic_vol.items():
            if max_vol == v:
                ex_poly = poly_dic[k]
            else:
                int_poly.append(poly_dic[k])
    # I need to return the face names to the regular
    # face names withou '-' for further use
    new_int_poly = []
    for group in int_poly:
        new = []
        for name in group:
            if name[0] == '-':
                new_list =''
                for i in range(1, len(name)):
                    new_list += name[i]
                if new_list not in new:
                    new.append(new_list)
            else:
                new.append(name)
        new_int_poly.append(new)
    #print "new_int_poly", new_int_poly
    
    int_poly = new_int_poly
    
    # I should do the same for exterior polyhedron
    new_ex_poly = []
    new = []
    for name in ex_poly:
        if name[0] == '-':
            new_list =''
            for i in range(1, len(name)):
                new_list += name[i]
            if new_list not in new:
                new.append(new_list)
        else:
            new.append(name)
    new_ex_poly = new
    #print "new_ex_poly", new_ex_poly
    ex_poly = new_ex_poly
    
    if p == True:
        print "exterior polyhedron", ex_poly
        print "interior polyherdon", int_poly
    def draw_it(face, t, i):
        rs.EnableRedraw(False)
        if face[0] == '-':
            new_str = ''
            for i in range(1,len(face)):
                new_str += face[i]
            face = new_str
        polylines = []
        pts = []
        for p in srf_pts[face]:
            if nodes[p] not in pts:
                pts.append(nodes[p])
        pts.append(pts[0])
        pline = rs.AddPolyline(pts)
        polylines.append(pline)
        srf = rs.AddPlanarSrf(polylines)
        if not srf:
            print "Non-planar Surfaces exist"
        if srf:
            R = 255 - i* 2
            if R < 0:
                #R = 0 + i * 5 
                R = 0
            G = 0 + i*2
            if G > 255:
                #G = 255 - 5 * i
                G = 255
            B = 125 + i * 2
            if B > 255:
                #B = 255 - i * 5
                B = 255
            rs.ObjectColor(srf, [R , G , B ])
            if t == 1:
                rs.DeleteObjects(polylines)
            rs.EnableRedraw(True)
            return srf
        
    if draw == True:
        rs.AddLayer('Polyhedrons', [200, 100, 125])
        rs.AddLayer('int PH', [200, 100, 125])
        rs.AddLayer('ext PH', [250, 150, 100])
        rs.ParentLayer('int PH', 'Polyhedrons')
        rs.ParentLayer('ext PH', 'Polyhedrons')
        
        for i in range(len(int_poly)):
            srfs = []
            #rs.AddLayer('poly_'+str(i), [255 - i* 5, 0 + i*5, 125 + i * 5])
            rs.CurrentLayer('int PH')
            rs.AddGroup('poly_' + str(i))
            for face in int_poly[i]:
                srf = draw_it(face, 1, i)
                rs.AddObjectToGroup(srf, 'poly_' + str(i))
                srfs.append(srf)
            new_srf = rs.JoinSurfaces(srfs, True)
        rs.AddGroup('Exterior Polyhedron')
        srfs =[]
        for face in ex_poly:
            
            rs.CurrentLayer('ext PH')
            srf = draw_it(face, 1, 14)
            rs.AddObjectToGroup(srf, 'Exterior Polyhedron')
            srfs.append(srf)
        new_srf = rs.JoinSurfaces(srfs, True)
    new_ex_poly=[]
    new_ex_poly.append(ex_poly)
    return [int_poly, new_ex_poly, srf_pts, nodes]

def PolyhedronFromSrfsNew(srfs, p, draw):
    """
    srfs: input surfaces
    p: if True then it will print the infromation
    draw:  if True the layer named 'Polyhedron' is
            constructed and the polyhedrons will be 
            drawn in a seperate groups stored in the
            interior and exterior cells
    """
    
    lns = []
    srf_dic = {}
    srf_pts_coord ={}
    rs.EnableRedraw(False)
    for i in range(len(srfs)):
        srf_dic [str(i)+'f'] = srfs[i]
        ln = rs.DuplicateEdgeCurves(srfs[i])
        
        nodes_per_face =NodeCoord(ln)
        srf_pts_coord [str(i)+'f'] = nodes_per_face.values()
        for l in ln:
            lns.append(l)
    rs.EnableRedraw(True)
    # here is the nodes' names and their coordinates
    nodes = NodeCoord(lns)
    #rs.AddPoints(nodes.values())
    if p == True:
        print "nodes", nodes
    
    new_nodes = {}
    for k, v in nodes.items():
        new_nodes[str(k)] = v
    
    nodes = {}
    for k, v in new_nodes.items():
        nodes[k] = v
    
    
    srf_pts ={}
    for k,v in srf_pts_coord.items():
        srf_pts[k] =[]
        for pt in v:
            #print pt
            for ke,ve in nodes.items():
                if pt == ve:
                    #print ve
                    if ke not in srf_pts:
                        srf_pts[k].append(ke)
    if p == True:
        print "srf_pts", srf_pts
    
    def points_barr(pt_list):
        x=[]
        y=[]
        z=[]
        for j in pt_list:
            x.append(j[0])
            y.append(j[1])
            z.append(j[2])
        sumx=sum(x)/len(x)
        sumy=sum(y)/len(y)
        sumz=sum(z)/ len(z)
        centroid=[sumx,sumy,sumz]
        return centroid
    
    def point_on_plane_sort(pts_names):
    	list1=[]
    	pts=[]
    	for pt in pts_names:
    		pts.append(nodes[pt])
    	if len(pts)>2:
    		cent=points_barr(pts)
    		#print "cent", cent
    		vec1=ma.VecCreate(pts[0],cent)
    		#print "vec1", vec1
    		vec2=ma.VecCreate(pts[1],cent)
    		#print "vec2", vec2
    		normal=ma.VecCrossProduct(vec1,vec2)
    		leng=ma.VecLength(normal)
    		if leng>1.e-2:
    			normal=ma.VecUnitize(normal)
    		else:
    			vec2=ma.VecCreate(pts[2],cent)
    			normal=ma.VecCrossProduct(vec1,vec2)
    		vecttest=ma.VecCreate(pts[0],cent)
    		vecttest=ma.VecRotate(vecttest,2,normal)
    		angle={}
    		for j in range(len(pts)):
    			#if j !=pts[0]:
    				vect_t=ma.VecCreate(pts[j],cent)
    				vectn2=ma.VecCrossProduct(vecttest,vect_t)
    				#print "vec2", vectn2
    				vectn2=ma.VecUnitize(vectn2)
    				res=ma.VecDotProduct(vectn2,normal)
    				#print res
    				if res<0:
    					angle[j] = 2*180 -ma.VecAngle(vecttest,vect_t)
    				else:
    					angle[j]=ma.VecAngle(vecttest,vect_t)
    		#print angle
    		just_angle=[]
    		for s in angle.values():
    			just_angle.append(s)
    		#print just_angle
    		just_angle.sort()
    		#min_ang=min(just_angle)
    		for l in range(len(just_angle)):
    			for keys,values in angle.items():
    				if just_angle[l]==angle[keys]:
    					if keys not in list1:
    						list1.append(keys)
    		#print "sorted points", list1
    		list1_cord=[]
    		for pt in list1:
    			list1_cord.append(pts[pt])
    		
    		pts_names_sorted=[]
    		for pt in list1_cord:
    			for k, v in nodes.items():
    				if pt==v:
    					if k in pts_names:
    						if k not in pts_names_sorted:
    							pts_names_sorted.append(k)
    		#print "pts_names_sorted", pts_names_sorted
    		return [list1_cord,pts_names_sorted]
    
    def draw_it(t):
        #print " I am drawing it"
        polylines = []
        srfs = []
        rs.EnableRedraw(False)
        for k, v in srf_pts.items():
            new_v = point_on_plane_sort(v)
            pts = []
            for p in new_v[1]:
                #if nodes[p] not in pts:
                    pts.append(nodes[p])
            pts.append(pts[0])
            pline = rs.AddPolyline(pts)
            polylines.append(pline)
        rs.EnableRedraw(True)
        if t == 1:
            rs.DeleteObjects(polylines)
        if t == 0:
            rs.EnableRedraw(False)
            for pl in polylines:
                rs.AddPlanarSrf(pl)
            rs.EnableRedraw(True)
    
    # it is also valid to sort the points
    for k,v in srf_pts.items():
        new_list = point_on_plane_sort(v)[1]
        srf_pts[k] = new_list
    if p == True:
        print " srf_pts sorted",  srf_pts 
    
    # now I can delete the connecting edges of surfaces
    rs.DeleteObjects(lns)
    
    # here I need to construct surfaces with reversed 
    # order to make a pair faces per edge
    srf_pts_rev ={}
    for k,v in srf_pts.items():
        new_v = copy.deepcopy(v)
        new_list =[]
        for pt in reversed(new_v):
            new_list.append(pt)
        srf_pts_rev ['-'+k] = new_list
    if p == True:
        print "srf_pts_rev", srf_pts_rev
    
    
    # Now I can sort the faces according to their edge names
    srf_edge ={}
    for k, v in srf_pts.items():
        new_list =[]
        for i in range(len(v)-1):
            list_test = [v[i], v[i+1]]
            new_list.append(list_test)
        new_list.append([v[-1], v[0]])
        srf_edge [k] = new_list
    
    if p == True:
        print "srf_edge", srf_edge
    
    # lets gather all the edges
    edges = []
    for k, v in srf_edge.items():
        for gr in v:
            n_gr = copy.deepcopy(gr)
            #n_gr.sort()
            if n_gr not in edges:
                edges.append(n_gr)
    if p == True:
        print "edges", edges
    
    # lets get rid of duplicate edges 
    
    new_edges = []
    for edge in edges:
        edge1 = copy.deepcopy(edge)
        edge1.sort()
        if edge1 not in new_edges:
            new_edges.append(edge1)
    if p == True:
        print "new_edges", new_edges
    
    #edges = new_edges
    # lets nme the edges pf the force
    force_edge_name = {}
    for i in range(len(new_edges)):
        #force_edge_name[str(i) + 'e_'] = edges[i]
        force_edge_name[str(i) + 'e_'] = new_edges[i]
    if p == True:
        print "force_edge_name", force_edge_name
        
    # I can rewrite the edges in the form of edge names
    # lets name the 
    force_face_edge = {}
    for k, v in srf_edge.items():
        group = []
        for edge in v:
            for ke, ve in force_edge_name.items():
                if edge[0] in ve:
                    if edge[1] in ve:
                #if edge == ve:
                        if ke not in group:
                            group.append(ke)
        force_face_edge[k] = group
        
    if p == True:
        print "force_face_edge", force_face_edge
        #face_edge[k] = 
        
    # Now I can sort the faces according to their edge names
    # for reversed faces
    srf_edge_rev ={}
    for k, v in srf_pts_rev.items():
        new_list =[]
        for i in range(len(v)-1):
            list_test = [v[i], v[i+1]]
            new_list.append(list_test)
        new_list.append([v[-1], v[0]])
        srf_edge_rev [k] = new_list
    if p == True:
        print "srf_edge_rev", srf_edge_rev
    
    
    # now I need to put all the edges in a list
    all_edges = []
    
    for k, v in srf_edge.items():
        for edge in v:
            new_list = list(edge)
            new_list.sort()
            if tuple(new_list) not in all_edges:
                all_edges.append(tuple(new_list))
    
    if p == True:
        print "all_edges", all_edges
    
    # I do not need to include the other direction of 
    # edges now I can find all the faces that are connected
    # to each edge for both lists of faces
    
    edge_face = {}
    for group in all_edges:
        edge_face[group] = []
        test = list(group)
        for k, v in srf_edge.items():
            if test in v:
                if k not in edge_face[group]:
                    edge_face[group].append(k)
        # I can also search in the negatie faces lists
        for k, v in srf_edge_rev.items():
            if test in v:
                if k not in edge_face[group]:
                    edge_face[group].append(k)
        
    if p == True:
        print "edge_face", edge_face
    
    
    for k,v in edge_face.items():
        if len(v) == 1:
            rs.MessageBox("There is a single Face in the selections")
    
    # now that I have the faces around each face 
    # I need to sort them in order to sort them around each edge
    # before that I need to store their centroids in a dictionary
    
    srf_cents = {}
    for k, v in srf_pts.items():
        new_list = []
        for pt in v:
            new_list.append(nodes[pt])
        cent = points_barr(new_list)
        #rs.AddTextDot(str(k), srf_cents[k])
        vec1 = ma.VecCreate(nodes[v[1]], nodes[v[0]])
        vec2 = ma.VecCreate(nodes[v[2]], nodes[v[1]])
        norm = ma.VecCrossProduct(vec1, vec2)
        norm = ma.VecUnitize(norm)
        norm = ma.VecScale(norm, 0.1)
        srf_cents[k] =ma.PtAdd(cent, norm)
        #rs.AddPoint(srf_cents[k])
        #rs.AddTextDot(str(k), srf_cents[k])
    # I need to also do it for the negative faces
    
    for k, v in srf_pts_rev.items():
        new_list = []
        
        for pt in v:
            new_list.append(nodes[pt])
        #srf_cents[k] = points_barr(new_list)
        cent = points_barr(new_list)
        #rs.AddTextDot(str(k), srf_cents[k])
        vec1 = ma.VecCreate(nodes[v[1]], nodes[v[0]])
        vec2 = ma.VecCreate(nodes[v[2]], nodes[v[1]])
        norm = ma.VecCrossProduct(vec1, vec2)
        norm = ma.VecUnitize(norm)
        norm = ma.VecScale(norm, 0.1)
        srf_cents[k] =ma.PtAdd(cent, norm)
        #rs.AddPoint(srf_cents[k])
        #rs.AddTextDot(str(k), srf_cents[k])
    if p == True:
        print "srf_cents", srf_cents
    
    def face_sort(edge, face_names):
        list1=[]
        list2 =[]
        normal=ma.VecCreate(nodes[edge[1]],nodes[edge[0]])
        mid = points_barr([nodes[edge[0]], nodes[edge[1]]])
        #print mid
        plane = rs.PlaneFromNormal(mid, normal)
        #print "plane", plane
        
        pts=[]
        face_cents_new = {}
        for pt in face_names:
            p = rs.PlaneClosestPoint(plane, srf_cents[pt])
            pts.append(p)
            face_cents_new[pt] = p
        #print "pts", pts
        vecttest = ma.VecCreate(pts[0],mid)
        vecttest = ma.VecRotate(vecttest,2,normal)
        vecttest = ma.VecUnitize(vecttest)
        angle={}
        for j in range(len(pts)):
            #if j !=pts[0]:
                vect_t=ma.VecCreate(pts[j],mid)
                vect_t = ma.VecUnitize(vect_t)
                vectn2=ma.VecCrossProduct(vecttest,vect_t)
                #print "vec2", vectn2
                vectn2=ma.VecUnitize(vectn2)
                res=ma.VecDotProduct(vectn2,normal)
                #print res
                if res<0:
                    angle[j] = 2*180 - ma.VecAngle(vecttest,vect_t)
                else:
                    angle[j]=ma.VecAngle(vecttest,vect_t)
        #print angle
        just_angle=[]
        for s in angle.values():
        	just_angle.append(s)
        
        just_angle.sort()
        #print just_angle
        #min_ang=min(just_angle)
        for l in range(len(just_angle)):
        	for keys,values in angle.items():
        		if just_angle[l]==angle[keys]:
        			if keys not in list1:
        				list1.append(keys)
        #print "sorted points", list1
        list1_cord=[]
        for pt in list1:
        	list1_cord.append(pts[pt])
        #print "list1_cord", list1_cord
        
        pts_names_sorted=[]
        for pt in list1_cord:
        	for k, v in face_cents_new.items():
        		if pt == v:
        			if k in face_names:
        				if k not in pts_names_sorted:
        					pts_names_sorted.append(k)
        #print "pts_names_sorted", pts_names_sorted
        #print "pts_names_sorted", pts_names_sorted
        return pts_names_sorted
    
    
    # now that I have the centers it is possible to sort them
    # I need to have a function to sort them 
    edge_face_sorted = {}
    for k, v in edge_face.items():
        edge_face_sorted[k] = face_sort(k, v)
    if p == True:
        print "edge_face_sorted", edge_face_sorted
    
    # now that I have sorted faces I can add to the list of each face
    # and then add the face with opposite name
    
    face_pairs = []
    for k, v in edge_face_sorted.items():
        v.append(v[0])
        for i in range(len(v)-1):
            name = v[i+1]
            if name[0] == '-':
                #print "name", name
                new_name =''
                for k in range(1,len(name)):
                    new_name += name[k]
            if name[0] != '-':
                new_name ='-'
                for z in range(len(name)):
                    new_name += name[z]
            #print "v", v[i]
            #print new_name
            
            group = [v[i], new_name]
            if group not in face_pairs:
                face_pairs.append(group)
    if p == True:
        print "face_pairs", face_pairs
    
    # I need to export face_pairs therefore, I would like to 
    # make all the faces positive
    face_pairs_pos = []
    for group in face_pairs:
        gr = []
        for face in group:
            if '-' in face:
                new_l = ''
                for i in range(1, len(face)):
                    new_l += face[i]
                #print new_l
                gr.append(new_l)
            else:
                gr.append(face)
        face_pairs_pos.append(gr)
    if p == True:
        print "face_pairs_pos", face_pairs_pos
    
    # now I can use the command breathfirstsearch
    
    poly_lists =BreathFirstSearch(face_pairs)
    if p == True:
        print "poly_lists", poly_lists
    
    def PolyhedronVolume(poly_faces):
        # lets just make sure that the face is not negative
        new_poly_faces = []
        for face in poly_faces:
            if face[0] == '-':
                str1 = ''
                for i in range(1,len(face)):
                    str1 += face[i]
                if str1 not in new_poly_faces:
                    new_poly_faces.append(str1)
            else:
                if face not in new_poly_faces:
                    new_poly_faces.append(face)
        # first lets find the centroid of the
        # polyhedron
        all_pts =[]
        for face in new_poly_faces:
            if face in srf_pts:
                for pt in srf_pts[face]:
                    if pt not in all_pts:
                        all_pts.append(pt)
            else:
                for pt in srf_pts_rev[face]:
                    if pt not in all_pts:
                        all_pts.append(pt)
        all_pts_cord = []
        for pt in all_pts:
            all_pts_cord.append(nodes[pt])
        
        cent = points_barr(all_pts_cord)
        vol = []
        for face in new_poly_faces:
            centroid = srf_cents[face]
            dist = rs.Distance(centroid, cent)
            a = rs.SurfaceArea(srf_dic[face])
            vol1 = dist * a[0]
            vol.append(vol1)
        
        volume = sum(vol)
        return volume
    
    
    # Now I can find the exterior polyhdron and
    # all other interior polyhedorns
    # There is a possiblity that there are only
    # two polyhedrons interior and exterior, in other word, 
    # there is only one force polyhedorn
    
    ex_poly = []
    int_poly = []
    # if there is only one interior and one exterior
    # polyhedron exists
    if len(poly_lists) == 2:
        ex_poly = poly_lists[0]
        int_poly = [poly_lists[1]]
    
    # In order to find the exterior polyhedron
    # I need to calculate the volume of the polyhedrons
    # and find the one with te biggest number
    
    # if the number of polyhedrons
    # are bigger than 2 then:
    else :
        
        poly_dic_vol = {}
        poly_dic = {}
        for i in range(len(poly_lists)):
            poly_dic_vol[str(i)+ 'pol'] = PolyhedronVolume(poly_lists[i])
            poly_dic [str(i)+ 'pol'] = poly_lists[i]
        
        if p == True:
            print "poly_dic_vol", poly_dic_vol
            print "poly_dic", poly_dic
        
        # lets put together all the areas
        all_vol = poly_dic_vol.values()
        max_vol = max(all_vol)
        
        
        for k, v in poly_dic_vol.items():
            if max_vol == v:
                ex_poly = poly_dic[k]
            else:
                int_poly.append(poly_dic[k])
    # I need to return the face names to the regular
    # face names withou '-' for further use
    new_int_poly = []
    for group in int_poly:
        new = []
        for name in group:
            if name[0] == '-':
                new_list =''
                for i in range(1, len(name)):
                    new_list += name[i]
                if new_list not in new:
                    new.append(new_list)
            else:
                new.append(name)
        new_int_poly.append(new)
    #print "new_int_poly", new_int_poly
    
    int_poly = new_int_poly
    
    # I should do the same for exterior polyhedron
    new_ex_poly = []
    new = []
    for name in ex_poly:
        if name[0] == '-':
            new_list =''
            for i in range(1, len(name)):
                new_list += name[i]
            if new_list not in new:
                new.append(new_list)
        else:
            new.append(name)
    new_ex_poly = new
    #print "new_ex_poly", new_ex_poly
    ex_poly = new_ex_poly
    
    if p == True:
        print "exterior polyhedron", ex_poly
        print "interior polyherdon", int_poly
    def draw_it(face, t, i):
        rs.EnableRedraw(False)
        if face[0] == '-':
            new_str = ''
            for i in range(1,len(face)):
                new_str += face[i]
            face = new_str
        polylines = []
        pts = []
        for p in srf_pts[face]:
            if nodes[p] not in pts:
                pts.append(nodes[p])
        pts.append(pts[0])
        pline = rs.AddPolyline(pts)
        polylines.append(pline)
        srf = rs.AddPlanarSrf(polylines)
        if not srf:
            print "Non-planar Surfaces exist"
        if srf:
            R = 255 - i* 2
            if R < 0:
                #R = 0 + i * 5 
                R = 0
            G = 0 + i*2
            if G > 255:
                #G = 255 - 5 * i
                G = 255
            B = 125 + i * 2
            if B > 255:
                #B = 255 - i * 5
                B = 255
            rs.ObjectColor(srf, [R , G , B ])
            if t == 1:
                rs.DeleteObjects(polylines)
            rs.EnableRedraw(True)
            return srf
        
    if draw == True:
        rs.AddLayer('Polyhedrons', [200, 100, 125])
        rs.AddLayer('int PH', [200, 100, 125])
        rs.AddLayer('ext PH', [250, 150, 100])
        rs.ParentLayer('int PH', 'Polyhedrons')
        rs.ParentLayer('ext PH', 'Polyhedrons')
        
        for i in range(len(int_poly)):
            srfs = []
            #rs.AddLayer('poly_'+str(i), [255 - i* 5, 0 + i*5, 125 + i * 5])
            rs.CurrentLayer('int PH')
            rs.AddGroup('poly_' + str(i))
            for face in int_poly[i]:
                srf = draw_it(face, 1, i)
                rs.AddObjectToGroup(srf, 'poly_' + str(i))
                srfs.append(srf)
            new_srf = rs.JoinSurfaces(srfs, True)
        rs.AddGroup('Exterior Polyhedron')
        srfs =[]
        for face in ex_poly:
            
            rs.CurrentLayer('ext PH')
            srf = draw_it(face, 1, 14)
            rs.AddObjectToGroup(srf, 'Exterior Polyhedron')
            srfs.append(srf)
        new_srf = rs.JoinSurfaces(srfs, True)
    new_ex_poly=[]
    new_ex_poly.append(ex_poly)
    
    # lets make the faces inside the edge face sorted positive
    
    for k, v in edge_face_sorted.items():
        new = []
        for name in v:
            if name[0] == '-':
                new_list =''
                for i in range(1, len(name)):
                    new_list += name[i]
                if new_list not in new:
                    new.append(new_list)
            else:
                new.append(name)
        edge_face_sorted[k] = new
    if p == True:
        print "edge_face_sorted", edge_face_sorted
    return [int_poly, new_ex_poly, srf_pts, nodes, edge_face_sorted, face_pairs_pos, force_face_edge, force_edge_name]

def PolyhedronDual(Interior_poly,exterior_poly, face_pts, nodes, pr, draw):
    
    """
    It extracts the dual graph of an input polyhedron
    
    Interior_poly:      The group list of faces for the interior polyhedrons
    exterior_poly:      The list of faces for the exterior polyhedron
    Face_pts:           List of faces and based on their point names
    Nodes:              Names of points of each face and its coordinates
    pr:                 If True the data will be printed
    draw:               If True the dual polyhedron will be drawn
    """
    
    poly_faces = {}
    # the first step is to find the adjacent 
    for i in range(len(Interior_poly)):
        poly_faces[str(i)+'p'] = Interior_poly[i]
    
    if pr == True: 
        print "poly_faces", poly_faces
    
    
    # lets have all the faces stored 
    all_faces = face_pts.keys()
    
    # now I can have the normals for all the faces
    face_norm = {}
    for face in all_faces:
        pt_list = [] 
        for pt in face_pts[face]:
            pt_list.append(nodes[str(pt)])
        plane = rs.PlaneFitFromPoints(pt_list)
        face_norm [face] = plane[3]
    
    # now I can find the adjacency of the polyhedrons
    # for this I need to know which face is share with which polyhedorns
    
    face_shared = {}
    for face in all_faces:
        new_list =[]
        #face_shared[face] = []
        for k, v in poly_faces.items():
            for f in v:
                #print "f", f , "face", face 
                if face == f:
                    if  k not in new_list:
                        new_list.append(k)
        if new_list:
            if len(new_list) == 2:
                face_shared[face] = new_list
    
    if pr == True:
        
        print "face_shared", face_shared
    
    # I also need to find the centroid of the polyhedrons
    # then I can connect them
    
    def points_barr(pt_list):
    	x=[]
    	y=[]
    	z=[]
    	for j in pt_list:
    		x.append(j[0])
    		y.append(j[1])
    		z.append(j[2])
    	sumx=sum(x)/len(x)
    	sumy=sum(y)/len(y)
    	sumz=sum(z)/ len(z)
    	centroid=[sumx,sumy,sumz]
    	return centroid
    
    poly_cents ={}
    for k,v in poly_faces.items():
        new_list = [] 
        for f in v:
            for pt in face_pts[f]:
                #print pt
                if pt not in new_list:
                    new_list.append(pt)
        #print new_list
        cord =[]
        for p in new_list:
            cord.append(nodes[str(p)])
        #print cord
        poly_cents[k] = points_barr(cord)
        #rs.AddTextDot(str(k),poly_cents[k]) 
            #new_list.append(pt)
    
    # I also need to store the centroids of the faces
    face_cents = {}
    for face in exterior_poly[0]:
        pt_list =[]
        for pt in face_pts[face]:
            pt_list.append(nodes[str(pt)])
        face_cents [face] = points_barr(pt_list)
    if pr == True:
        print "face_cents", face_cents
    
    
    # now I need to find the adjacent faces 
    # from the exterior polyhedron
    # for this reason I will put all the possible edges of the exterior
    face_edge = {}
    all_ext_edges =[]
    for face in exterior_poly[0]:
        face_edge[face] = []
        new_v = copy.deepcopy(face_pts[face])
        new_v.append(new_v[0])
        for i in range(len(new_v)-1):
            group = [new_v[i], new_v[i+1]]
            group.sort()
            if group not in all_ext_edges:
                all_ext_edges.append(group)
            face_edge[face].append(group)
    if pr == True:
        print "face_edge", face_edge
        print "all_ext_edge", all_ext_edges
    
    # now I need to find faces that share the same edge
    edge_ext_shared = {}
    for edge in all_ext_edges:
        group =[]
        for k, v in face_edge.items():
            for e in v:
                if edge[0] in e:
                    if edge[1] in e:
                        if k not in group:
                            group.append(k)
        edge_ext_shared[tuple(edge)] = group
    if pr == True:
        print "edge_ext_shared", edge_ext_shared
    
    
    # at this stage I need to connect the exterior faces
    # to the interior centroids
    ext_int_edge = {}
    for face in exterior_poly[0]:
        for k, v in poly_faces.items():
            if face in v:
                ext_int_edge[face] = k
    if pr == True:
        print "ext_int_edge", ext_int_edge
    
    # now I have three types of edges
    # 1: the edges that connect the exterior of the polyhedron (they do not need specific direction)
    # 2: the edge that connect the centroids of the polyhedrons (they are pararllel to the normal of the shared faces)
    # 3: the edges that connect the exterior edges of the polyhedron (they are parallel to the normal of the exterior faces)
    
    # I can make a list of edges and their coordinates for the first group
    # I can also store all the coordinates in all_cord
    
    form_edges = {}
    form_edges_norm = {}
    all_cord =[]
    # I need to know which face belongs to which edge
    form_edge_face = {}
    #the dual of the faces of exterior polyhedron
    all_ext_dual = []
    for k, v in edge_ext_shared.items():
        form_edges [k] = [face_cents[v[0]],face_cents[v[1]]]
        form_edges_norm [k] = 'Null'
        form_edge_face[k] = 'Null'
        
        # I am adding the coordinates 
        if face_cents[v[0]] not in all_cord:
            all_cord.append(face_cents[v[0]])
        if face_cents[v[1]] not in all_cord:
            all_cord.append(face_cents[v[1]])
        group = [face_cents[v[0]],face_cents[v[1]]]
        all_ext_dual.append(group)
        
    all_ext_edge =[]
    
    for k, v in ext_int_edge.items():
        form_edges [k] = [face_cents[k],poly_cents[v]]
        form_edges_norm [k] = face_norm[k]
        form_edge_face[k] = k
        # I am adding the coordinates
        if face_cents[k] not in all_cord:
            all_cord.append(face_cents[k])
        if poly_cents[v] not in all_cord:
            all_cord.append(poly_cents[v])
        group = [face_cents[k],poly_cents[v]]
        all_ext_edge.append(group)
        
        
    for k, v in face_shared.items():
        form_edges [k] = [poly_cents[v[0]],poly_cents[v[1]]]
        form_edges_norm [k] = face_norm[k]
        form_edge_face[k] = k
        # I am adding the coordinates
        if poly_cents[v[0]] not in all_cord:
            all_cord.append(poly_cents[v[0]])
        if poly_cents[v[1]] not in all_cord:
            all_cord.append(poly_cents[v[1]])
    if pr == True:
        print "form_edges", form_edges
        print "form_edges_norm", form_edges_norm 
        print "all_crod", all_cord
        print "form_edge_face", form_edge_face
    # now I can make a dictionary to store all
    # the coordinates form_nodes
    i = 0
    form_nodes = {} 
    for pt in all_cord:
        form_nodes[i] = pt 
        i = i + 1 
    
    # now I need to name all the edges and their coordinates
    i = 0
    edge_name_cord = {}
    edge_name_norm = {}
    edge_name_face = {}
    for k, v in form_edges.items():
        #edge_name_cord [str(i) + 'e'] = []
        group = []
        for pt in v:
            for ke, ve in form_nodes.items():
                if pt == ve:
                    if ke not in group:
                        group.append(ke)
        edge_name_cord [str(i) + 'e'] = group
        edge_name_norm [str(i) + 'e'] = form_edges_norm[k]
        edge_name_face [str(i) + 'e'] = [form_edge_face[k]]
        i = i + 1
    if pr == True:
        print "edge_name_cord", edge_name_cord
        print "edge_name_norm", edge_name_norm
        print "edge_name_face", edge_name_face
    
    # I need to know which edges are the exterior edges
    ex_edge = []
    for k, v in edge_name_cord .items():
        for group in all_ext_edge:
            if form_nodes[v[0]] in group:
                if form_nodes[v[1]] in group:
                    if k not in ex_edge:
                        ex_edge.append(k)
    
    if pr == True:
        print "ex_edge", ex_edge
    
    # I also need to know which ones are the
    # are the dual of the faces of exterior polyhedron
    ex_edge_dual = [] 
    for k, v in edge_name_cord .items():
        for group in all_ext_dual:
            if form_nodes[v[0]] in group:
                if form_nodes[v[1]] in group:
                    if k not in ex_edge_dual:
                        ex_edge_dual.append(k)
    if pr == True:
        print "ex_edge_dual", ex_edge_dual
    
    # now I can draw the edges
    for k,v in edge_name_cord.items():
        if draw == True:
            if edge_name_norm[k] != 'Null':
                if k not in ex_edge:
                    rs.EnableRedraw(False)
                    rs.AddLayer('Int Form', [0,0,200])
                    rs.CurrentLayer('Int Form')
                    rs.AddLine(form_nodes[v[0]], form_nodes[v[1]])
                    rs.EnableRedraw(True)
                else:
                    rs.EnableRedraw(False)
                    rs.AddLayer('Ext Form', [0,150,0])
                    rs.CurrentLayer('Ext Form')
                    rs.AddLine(form_nodes[v[0]], form_nodes[v[1]])
                    rs.EnableRedraw(True)
    
    # I would like to organize the edge pts
    
    def SortStr(group):
        pt_list =[]
        for p in group:
            pt_list.append(int(p))
        pt_list.sort()
        new_group = []
        for p in pt_list:
            new_group.append(str(p))
        
        return new_group
    
    for k, v in edge_name_cord.items():
        
        new_group = SortStr(v)
        edge_name_cord[k] = new_group 
        
    if pr == True:
        print "edge_name_cord", edge_name_cord
    # It returns the edges and the normal assigned to each edge
    return [edge_name_cord, edge_name_norm, form_nodes, ex_edge, ex_edge_dual, edge_name_face]

def PolyhedronDualNew(Interior_poly,exterior_poly, face_pts, nodes, edge_faces, pr, draw):
    
    
    
    """
    It extracts the dual graph of an input polyhedron
    
    Interior_poly:      The group list of faces for the interior polyhedrons
    exterior_poly:      The list of faces for the exterior polyhedron
    Face_pts:           List of faces and based on their point names
    Nodes:              Names of points of each face and its coordinates
    pr:                 If True the data will be printed
    draw:               If True the dual polyhedron will be drawn
    """
    
    
    
    poly_faces = {}
    # the first step is to find the adjacent 
    for i in range(len(Interior_poly)):
        poly_faces[str(i)+'p'] = Interior_poly[i]
    
    if pr == False: 
        print "poly_faces", poly_faces
        print "edge_faces", edge_faces
    # lets have all the faces stored 
    all_faces = face_pts.keys()
    
    # now I can have the normals for all the faces
    face_norm = {}
    for face in all_faces:
        pt_list = [] 
        for pt in face_pts[face]:
            pt_list.append(nodes[str(pt)])
        plane = rs.PlaneFitFromPoints(pt_list)
        face_norm [face] = plane[3]
    
    # now I can find the adjacency of the polyhedrons
    # for this I need to know which face is share with which polyhedorns
    
    face_shared = {}
    for face in all_faces:
        new_list =[]
        #face_shared[face] = []
        for k, v in poly_faces.items():
            for f in v:
                #print "f", f , "face", face 
                if face == f:
                    if  k not in new_list:
                        new_list.append(k)
        if new_list:
            if len(new_list) == 2:
                face_shared[face] = new_list
    
    if pr == True:
        print "face_shared", face_shared
    
    # here I can find the faces of the form polyhedron
    # the adjacency of the cells for each edge of the force
    # polyhedron will give me the face
    # for each polyhedron I need to find two faces
    # that share the same edge
    
    if pr == True:
        print "edge_faces", edge_faces
    
    # at this stage I would group the faces around each edge and check 
    # wether the face belongs to the exterior polyhedro or not
    edge_faces_group ={}
    for k , v in edge_faces.items():
        group = []
        for i in range(len(v)-1):
            gr = [v[i], v[i+1]]
            if gr not in group:
                group.append(gr)
        gr = [v[0], v[-1]]
        group.append(gr)
        edge_faces_group[k] = group
    
    if pr == True:
        print "edge_faces_group", edge_faces_group
    
    edge_faces_pts = {}
    # now I can store the points realted to the groups
    for k, v in edge_faces_group.items():
        # lets store all the points in a group
        pt_groups = []
        for group in v:
            # I can use poly_faces to check which two face belongs to which group
            for ke, ve in poly_faces.items():
                if group[0] in ve:
                    if group[1] in ve:
                        #print "polyhedron", ke
                        #print group
                        if ke not in pt_groups:
                            pt_groups.append(ke)
            # now I can check that the face is also in the exterior polyhedrons
            if group[0] in exterior_poly[0]:
                if group[1] in exterior_poly[0]:
                    # you need to store the external faces
                    pt_groups.append(group[0])
                    pt_groups.append(group[1])
                    
                #if face in Interior_poly[0]:
                    #print "Interior_poly", face
        edge_faces_pts[k] = pt_groups
    if pt == True:
        print "edge_faces_pts", edge_faces_pts
    # I also need to find the centroid of the polyhedrons
    # then I can connect them
    
    def points_barr(pt_list):
    	x=[]
    	y=[]
    	z=[]
    	for j in pt_list:
    		x.append(j[0])
    		y.append(j[1])
    		z.append(j[2])
    	sumx=sum(x)/len(x)
    	sumy=sum(y)/len(y)
    	sumz=sum(z)/ len(z)
    	centroid=[sumx,sumy,sumz]
    	return centroid
    
    # here I add the centroids of the internal polyhedrons
    # I can also use this poly_cents for subdivision schemes
    # poly_faces infact
    poly_cents ={}
    
    for k,v in poly_faces.items():
        new_list = [] 
        for f in v:
            for pt in face_pts[f]:
                #print pt
                if pt not in new_list:
                    new_list.append(pt)
        #print new_list
        cord =[]
        for p in new_list:
            cord.append(nodes[str(p)])
        #print cord
        poly_cents[k] = points_barr(cord)
        
        
        #rs.AddTextDot(str(k),poly_cents[k]) 
            #new_list.append(pt)
    if pr == False:
        print "poly_cents", poly_cents
    
    # I also need to store the centroids of the faces
    face_cents = {}
    for face in exterior_poly[0]:
        pt_list =[]
        for pt in face_pts[face]:
            pt_list.append(nodes[str(pt)])
        face_cents [face] = points_barr(pt_list)
    if pr == True:
        print "face_cents", face_cents
    
    # now that I have the coordinate of the polynodes
    # and the cetroid of the faces I can assign them to face 
    # names of the faces
    # form_faces = {}
    
    def point_on_plane_sort(pts_names):
        list1=[]
        pts=[]
        for pt in pts_names:
            if pt in poly_cents.keys():
                pts.append(poly_cents[pt])
            if pt in face_cents.keys():
                pts.append(face_cents[pt])
        if len(pts)>2:
            cent=points_barr(pts)
            #print "cent", cent
            vec1=ma.VecCreate(pts[0],cent)
            #print "vec1", vec1
            vec2=ma.VecCreate(pts[1],cent)
            #print "vec2", vec2
            normal=ma.VecCrossProduct(vec1,vec2)
            leng=ma.VecLength(normal)
            if leng>1.e-2:
            	normal=ma.VecUnitize(normal)
            else:
            	vec2=ma.VecCreate(pts[2],cent)
            	normal=ma.VecCrossProduct(vec1,vec2)
            vecttest=ma.VecCreate(pts[0],cent)
            vecttest=ma.VecRotate(vecttest,2,normal)
            angle={}
            for j in range(len(pts)):
            	#if j !=pts[0]:
            		vect_t=ma.VecCreate(pts[j],cent)
            		vectn2=ma.VecCrossProduct(vecttest,vect_t)
            		#print "vec2", vectn2
            		vectn2=ma.VecUnitize(vectn2)
            		res=ma.VecDotProduct(vectn2,normal)
            		#print res
            		if res<0:
            			angle[j] = 2*180 -ma.VecAngle(vecttest,vect_t)
            		else:
            			angle[j]=ma.VecAngle(vecttest,vect_t)
            #print angle
            just_angle=[]
            for s in angle.values():
            	just_angle.append(s)
            #print just_angle
            just_angle.sort()
            #min_ang=min(just_angle)
            for l in range(len(just_angle)):
            	for keys,values in angle.items():
            		if just_angle[l]==angle[keys]:
            			if keys not in list1:
            				list1.append(keys)
            #print "sorted points", list1
            list1_cord=[]
            for pt in list1:
            	list1_cord.append(pts[pt])
            
            pts_names_sorted=[]
            
            for pt in list1_cord:
                for k, v in poly_cents.items():
                    if pt==v:
                        if k in pts_names:
                            if k not in pts_names_sorted:
                                pts_names_sorted.append(k)
                for ke, ve in face_cents.items():
                    if pt==ve:
                        if ke in pts_names:
                            if ke not in pts_names_sorted:
                                pts_names_sorted.append(ke)
            #print "pts_names_sorted", pts_names_sorted
            
            return pts_names_sorted
    
    # lets draw the faces but I might also need to sort them 
    # to prevent from self-intersection
    edge_faces_pts_sorted = {}
    for k, v in edge_faces_pts.items():
        #polyline.append(polyline[0])
        #rs.AddPolyline(polyline)
        sorted_list = point_on_plane_sort(v)
        #print "sorted_list", sorted_list
        edge_faces_pts_sorted[k] = sorted_list
    
    if pr == True:
        print "edge_faces_pts_sorted", edge_faces_pts_sorted
    
    # now that I have the sorted list I can have form faces
    form_faces_pts = {}
    
    # lets draw the faces first
    """
    for k, v in edge_faces_pts_sorted.items():
        polyline = []
        for i in v:
            if i in poly_cents.keys():
                if poly_cents[i] not in polyline:
                    polyline.append(poly_cents[i])
            if i in face_cents.keys():
                if face_cents[i] not in polyline:
                    polyline.append(face_cents[i])  
        polyline.append(polyline[0])
        rs.AddPolyline(polyline)
    """
    # now I need to find the adjacent faces 
    # from the exterior polyhedron
    # for this reason I will put all the possible edges of the exterior
    face_edge = {}
    all_ext_edges =[]
    for face in exterior_poly[0]:
        face_edge[face] = []
        new_v = copy.deepcopy(face_pts[face])
        new_v.append(new_v[0])
        for i in range(len(new_v)-1):
            group = [new_v[i], new_v[i+1]]
            group.sort()
            if group not in all_ext_edges:
                all_ext_edges.append(group)
            face_edge[face].append(group)
    if pr == True:
        print "face_edge", face_edge
        print "all_ext_edge", all_ext_edges
    
    # now I need to find faces that share the same edge
    edge_ext_shared = {}
    for edge in all_ext_edges:
        group =[]
        for k, v in face_edge.items():
            for e in v:
                if edge[0] in e:
                    if edge[1] in e:
                        if k not in group:
                            group.append(k)
        edge_ext_shared[tuple(edge)] = group
    if pr == True:
        print "edge_ext_shared", edge_ext_shared
    
    # at this stage I need to connect the exterior faces
    # to the interior centroids
    ext_int_edge = {}
    for face in exterior_poly[0]:
        for k, v in poly_faces.items():
            if face in v:
                ext_int_edge[face] = k
    if pr == True:
        print "ext_int_edge", ext_int_edge
    
    # now I have three types of edges
    # 1: the edges that connect the exterior of the polyhedron (they do not need specific direction)
    # 2: the edge that connect the centroids of the polyhedrons (they are pararllel to the normal of the shared faces)
    # 3: the edges that connect the exterior edges of the polyhedron (they are parallel to the normal of the exterior faces)
    
    # I can make a list of edges and their coordinates for the first group
    # I can also store all the coordinates in all_cord
    
    form_edges = {}
    form_edges_norm = {}
    all_cord =[]
    # I need to know which face belongs to which edge
    form_edge_face = {}
    #the dual of the faces of exterior polyhedron
    all_ext_dual = []
    for k, v in edge_ext_shared.items():
        form_edges [k] = [face_cents[v[0]],face_cents[v[1]]]
        form_edges_norm [k] = 'Null'
        form_edge_face[k] = 'Null'
        
        # I am adding the coordinates 
        if face_cents[v[0]] not in all_cord:
            all_cord.append(face_cents[v[0]])
        if face_cents[v[1]] not in all_cord:
            all_cord.append(face_cents[v[1]])
        group = [face_cents[v[0]],face_cents[v[1]]]
        all_ext_dual.append(group)
    
    all_ext_edge =[]
    
    for k, v in ext_int_edge.items():
        form_edges [k] = [face_cents[k],poly_cents[v]]
        form_edges_norm [k] = face_norm[k]
        form_edge_face[k] = k
        # I am adding the coordinates
        if face_cents[k] not in all_cord:
            all_cord.append(face_cents[k])
        if poly_cents[v] not in all_cord:
            all_cord.append(poly_cents[v])
        group = [face_cents[k],poly_cents[v]]
        all_ext_edge.append(group)
    
    for k, v in face_shared.items():
        form_edges [k] = [poly_cents[v[0]],poly_cents[v[1]]]
        form_edges_norm [k] = face_norm[k]
        form_edge_face[k] = k
        # I am adding the coordinates
        if poly_cents[v[0]] not in all_cord:
            all_cord.append(poly_cents[v[0]])
        if poly_cents[v[1]] not in all_cord:
            all_cord.append(poly_cents[v[1]])
    if pr == True:
        print "---------------------------------------------------------------"
        print "form_edges", form_edges
        print "form_edges_norm", form_edges_norm 
        print "all_crod", all_cord
        print "form_edge_face", form_edge_face
    # now I can make a dictionary to store all
    # the coordinates form_nodes
    i = 0
    form_nodes = {} 
    for pt in all_cord:
        form_nodes[i] = pt 
        i = i + 1
        
    if pr == True:
        print "form_nodes", form_nodes
    
    # Here I can compare the poly_cents and find out which node they represent
    # the follwoing dictionary stores the faces of the internal polyhedrons of the
    # force diagram 
    form_nodes_internal = {}
    for k, v in poly_cents.items():
        for ke, ve in form_nodes.items():
            if v == ve:
                form_nodes_internal[ke] = poly_faces[k]
    
    print "form_nodes_internal", form_nodes_internal
    
    # now I can name the edge faces based on the form_nodes
    # here you can also define the normals
    form_faces = {}
    for k, v in edge_faces_pts_sorted.items():
        group =[]
        for i in v:
            if i in poly_cents.keys():
                for ke, ve in form_nodes.items():
                    if poly_cents[i] == ve:
                        if ke not in group:
                            group.append(ke)
                            
            if i in face_cents.keys():
                for key, val in form_nodes.items():
                    if face_cents[i] == val:
                        if key not in group:
                            group.append(key)
        #print "The faces based on the new form's node", group
        form_faces[k] = group
    if pr == True:
        print "form_faces", form_faces
    
    # now I can find the normals for the faces of the form
    # since the normals are the directions of the edges of the force
    
    form_faces_norm = {}
    for k, v in form_faces.items():
        group = list(k)
        vec = ma.VecCreate(nodes[group[0]], nodes[group[1]])
        form_faces_norm[k] = ma.VecUnitize(vec)
    if pr == True:
        print "form_faces_norm", form_faces_norm
    
    # now I would like to rename the faces of the form
    form_faces_new = {}
    form_faces_norm_new = {}
    for i in range(len(form_faces.keys())):
        form_faces_new[str(i) + 'ff'] = form_faces.values()[i]
        form_faces_norm_new[str(i) + 'ff'] = form_faces_norm.values()[i]
    if pr == True:
        print "form_faces_new", form_faces_new
        print "form_faces_norm_new", form_faces_norm_new
    
    # now I rename them back to the original names 
    
    def point_on_plane_sort_face(pts_names):
        list1=[]
        pts=[]
        for pt in pts_names:
            #print type(pt)
            #print type(nodes.keys()[0])
            pts.append(form_nodes[pt])
        if len(pts)>2:
            cent=points_barr(pts)
            #print "cent", cent
            vec1=ma.VecCreate(pts[0],cent)
            #print "vec1", vec1
            vec2=ma.VecCreate(pts[1],cent)
            #print "vec2", vec2
            normal=ma.VecCrossProduct(vec1,vec2)
            leng=ma.VecLength(normal)
            if leng>1.e-2:
            	normal=ma.VecUnitize(normal)
            else:
            	vec2=ma.VecCreate(pts[2],cent)
            	normal=ma.VecCrossProduct(vec1,vec2)
            vecttest=ma.VecCreate(pts[0],cent)
            vecttest=ma.VecRotate(vecttest,2,normal)
            angle={}
            for j in range(len(pts)):
            	#if j !=pts[0]:
            		vect_t=ma.VecCreate(pts[j],cent)
            		vectn2=ma.VecCrossProduct(vecttest,vect_t)
            		#print "vec2", vectn2
            		vectn2=ma.VecUnitize(vectn2)
            		res=ma.VecDotProduct(vectn2,normal)
            		#print res
            		if res<0:
            			angle[j] = 2*180 -ma.VecAngle(vecttest,vect_t)
            		else:
            			angle[j]=ma.VecAngle(vecttest,vect_t)
            #print angle
            just_angle=[]
            for s in angle.values():
            	just_angle.append(s)
            #print just_angle
            just_angle.sort()
            #min_ang=min(just_angle)
            for l in range(len(just_angle)):
            	for keys,values in angle.items():
            		if just_angle[l]==angle[keys]:
            			if keys not in list1:
            				list1.append(keys)
            #print "sorted points", list1
            list1_cord=[]
            for pt in list1:
            	list1_cord.append(pts[pt])
            
            
            pts_names_sorted=[]
            #print "list1_cord", list1_cord
            for pt in list1_cord:
                for k, v in form_nodes.items():
                    if pt == v:
                        if k in pts_names:
                            if k not in pts_names_sorted:
                                pts_names_sorted.append(k)
            #print "new_pts", pts_names_sorted
            return pts_names_sorted
    
    # Now I need to sort the points of the faces of the form diagram
    for k, v in form_faces_new.items():
        #for pt in v:
            #print form_nodes[pt]
        new_pts = point_on_plane_sort_face(v)
        #print new_pts
        form_faces_new[k] = new_pts
        
    
    
    # now I need to name all the edges and their coordinates
    
    i = 0
    edge_name_cord = {}
    edge_name_norm = {}
    edge_name_face = {}
    for k, v in form_edges.items():
        #edge_name_cord [str(i) + 'e'] = []
        group = []
        for pt in v:
            for ke, ve in form_nodes.items():
                if pt == ve:
                    if ke not in group:
                        group.append(ke)
        edge_name_cord [str(i) + 'e'] = group
        edge_name_norm [str(i) + 'e'] = form_edges_norm[k]
        edge_name_face [str(i) + 'e'] = [form_edge_face[k]]
        i = i + 1
    if pr == True:
        print "edge_name_cord", edge_name_cord
        print "edge_name_norm", edge_name_norm
        print "edge_name_face", edge_name_face
        
    # I need to know which edges are the exterior edges
    ex_edge = []
    for k, v in edge_name_cord .items():
        for group in all_ext_edge:
            if form_nodes[v[0]] in group:
                if form_nodes[v[1]] in group:
                    if k not in ex_edge:
                        ex_edge.append(k)
    
    if pr == True:
        print "ex_edge", ex_edge
    
    # I also need to know which ones are the
    # are the dual of the faces of exterior polyhedron
    ex_edge_dual = [] 
    for k, v in edge_name_cord .items():
        for group in all_ext_dual:
            if form_nodes[v[0]] in group:
                if form_nodes[v[1]] in group:
                    if k not in ex_edge_dual:
                        ex_edge_dual.append(k)
    if pr == True:
        print "ex_edge_dual", ex_edge_dual
    
    # now I can draw the edges
    for k,v in edge_name_cord.items():
        if draw == True:
            if edge_name_norm[k] != 'Null':
                if k not in ex_edge:
                    rs.EnableRedraw(False)
                    rs.AddLayer('Int Form', [0,0,200])
                    rs.CurrentLayer('Int Form')
                    rs.AddLine(form_nodes[v[0]], form_nodes[v[1]])
                    rs.EnableRedraw(True)
                else:
                    rs.EnableRedraw(False)
                    rs.AddLayer('Ext Form', [0,150,0])
                    rs.CurrentLayer('Ext Form')
                    rs.AddLine(form_nodes[v[0]], form_nodes[v[1]])
                    rs.EnableRedraw(True)
    
    # I would like to organize the edge pts
    
    def SortStr(group):
        pt_list =[]
        for p in group:
            pt_list.append(int(p))
        pt_list.sort()
        new_group = []
        for p in pt_list:
            new_group.append(str(p))
        
        return new_group
    
    for k, v in edge_name_cord.items():
        
        new_group = SortStr(v)
        edge_name_cord[k] = new_group 
        
    if pr == True:
        print "edge_name_cord", edge_name_cord
    # It returns the edges and the normal assigned to each edge
    return [edge_name_cord, edge_name_norm, form_nodes, ex_edge, ex_edge_dual, edge_name_face, form_faces_new, form_faces_norm_new, form_nodes_internal]

def RemoveDuplicateSrf(srfs):
    """
    The following function removes duplicate surfaces
    and bad surfaces from an input list of surfaces
    
    input: 
        srfs   guides or object ids of the duplicate surfaces
        
    Output:
        list    representing the surfaces withou duplicates
    """
    brn = []
    srf_crv = {}
    srf_pt = {}
    srf_obj = {}
    rs.EnableRedraw(False)
    for i in range(len(srfs)):
        
        line = rs.DuplicateEdgeCurves(srfs[i])
        srf_crv[i] = line
        srf_pt[i] =[]
        srf_obj[i] = srfs[i]
        for l in line:
            pts = rs.CurveStartPoint(l)
            pte = rs.CurveEndPoint(l)
            pts = [round(x,3) for x in pts]
            pte = [round(x,3) for x in pte]
            if pte not in srf_pt[i]:
                srf_pt[i].append(pte)
            if pts not in srf_pt[i]:
                srf_pt[i].append(pts)
        
        for l in line:
            brn.append(l)
    rs.EnableRedraw(False)
    
    nodes_brn = NodeCoord(brn)
    rs.DeleteObjects(brn)
    
    srf_pt_name = {}
    for k, v in srf_pt.items():
        #print len(v)
        if len(v) > 2:
            srf_pt_name[k] = []
            for pt in v:
                for ke, ve in nodes_brn.items():
                    dist = rs.Distance(pt, ve)
                    #print dist
                    if dist < 0.01:
                    #if pt == ve:
                        if ke not in srf_pt_name[k]:
                            srf_pt_name[k].append(ke)
            srf_pt_name[k].sort()
        if len(v) < 3:
            rs.DeleteObject(srf_obj[k])
            #print "Duplicate Deleted" 
    
    all_pts = srf_pt_name.values()
    
    no_dup_all_pts =[]
    for srf in all_pts:
        if srf not in no_dup_all_pts:
            no_dup_all_pts.append(srf)
    
    #print "no_dup_all_pts ", no_dup_all_pts 
    
    
    
    #print "srf_pt_name", srf_pt_name
    
    dup_pairs = []
    for k ,v in srf_pt_name.items():
        test = k
        for ke, ve in srf_pt_name.items():
            if k != ke:
                set1 = set(v)
                set2 = set(ve)
                set3 = set1 - set2
                #print set3
                if set3 == set([]):
                    #print k, ke
                    group = [k, ke]
                    group.sort()
                    if group not in dup_pairs:
                        dup_pairs.append(group)
    
    #print dup_pairs
    for group in dup_pairs:
        rs.DeleteObject(srf_obj[group[0]])
        #print "Duplicate Deleted" 
    
    #print "srf_pt_name", srf_pt_name
    #print "srf_obj", srf_obj
    srf_pt_nd = []
    for k, v in srf_pt_name.items():
        if srf_obj[k]:
            if v not in srf_pt_nd:
                srf_pt_nd.append(v)
    #print "srf_pt_nd", srf_pt_nd
    
    for k, v in srf_obj.items():
        if v:
            rs.DeleteObject(v)
    
    
    def points_barr(pt_list):
    	x=[]
    	y=[]
    	z=[]
    	for j in pt_list:
    		x.append(j[0])
    		y.append(j[1])
    		z.append(j[2])
    	sumx=sum(x)/len(x)
    	sumy=sum(y)/len(y)
    	sumz=sum(z)/ len(z)
    	centroid=[sumx,sumy,sumz]
    	return centroid
    
    def point_on_plane_sort(pts_names):
    	list1=[]
    	pts=[]
    	for pt in pts_names:
    		pts.append(nodes_brn[pt])
    	if len(pts)>2:
    		cent=points_barr(pts)
    		#print "cent", cent
    		vec1=ma.VecCreate(pts[0],cent)
    		#print "vec1", vec1
    		vec2=ma.VecCreate(pts[1],cent)
    		#print "vec2", vec2
    		normal=ma.VecCrossProduct(vec1,vec2)
    		leng=ma.VecLength(normal)
    		if leng>1.e-2:
    			normal=ma.VecUnitize(normal)
    		else:
    			vec2=ma.VecCreate(pts[2],cent)
    			normal=ma.VecCrossProduct(vec1,vec2)
    		vecttest=ma.VecCreate(pts[0],cent)
    		vecttest=ma.VecRotate(vecttest,2,normal)
    		angle={}
    		for j in range(len(pts)):
    			#if j !=pts[0]:
    				vect_t=ma.VecCreate(pts[j],cent)
    				vectn2=ma.VecCrossProduct(vecttest,vect_t)
    				#print "vec2", vectn2
    				vectn2=ma.VecUnitize(vectn2)
    				res=ma.VecDotProduct(vectn2,normal)
    				#print res
    				if res<0:
    					angle[j] = 2*180 -ma.VecAngle(vecttest,vect_t)
    				else:
    					angle[j]=ma.VecAngle(vecttest,vect_t)
    		#print angle
    		just_angle=[]
    		for s in angle.values():
    			just_angle.append(s)
    		#print just_angle
    		just_angle.sort()
    		#min_ang=min(just_angle)
    		for l in range(len(just_angle)):
    			for keys,values in angle.items():
    				if just_angle[l]==angle[keys]:
    					if keys not in list1:
    						list1.append(keys)
    		#print "sorted points", list1
    		list1_cord=[]
    		for pt in list1:
    			list1_cord.append(pts[pt])
    		
    		pts_names_sorted=[]
    		for pt in list1_cord:
    			for k, v in nodes_brn.items():
    				if pt==v:
    					if k in pts_names:
    						if k not in pts_names_sorted:
    							pts_names_sorted.append(k)
    		#print "pts_names_sorted", pts_names_sorted
    		return [list1_cord,pts_names_sorted]
    
    srfs = []
    rs.EnableRedraw(False)
    for group in srf_pt_nd:
        pts = []
        for pt in group:
            pts.append(pt)
        pt_list = point_on_plane_sort(pts)[0]
        pt_list.append(pt_list[0])
        pl = rs.AddPolyline(pt_list)
        srf = rs.AddPlanarSrf(pl)
        srfs.append(srf)
        rs.DeleteObject(pl)
    rs.EnableRedraw(True)
    
    return srfs

def ExportDictTotxt(filepath, filename, dic_name):
    filepath += filename
    file_obj = open(filepath, 'w')
    list1 = []
    for k, v in dic_name.items():
        l =str(k) + '\t'
        for i in range(len(v)-1):
            l += str(v[i]) + '\t'
        l += str(v[-1]) + '\n'
        list1.append(l)
    file_obj.writelines(list1)
    print filename + " > Exported Successfully"
    file_obj.close()

def ExportListTotxt(filepath, filename, list_name):
    filepath += filename
    file_obj = open(filepath, 'w')
    list1 = []
    for lis in list_name:
        l =''
        for i in range(len(lis)-1):
            l += str(lis[i]) + '\t'
        l += str(lis[-1]) + '\n'
        list1.append(l)
    file_obj.writelines(list1)
    print filename + " > Exported Successfully"
    file_obj.close()

def ImportDictFromtxt(filepath,filename, bool):
    # the follwoing function gets the 
    # path of file and the name of the dictionary
    # and then creates the dictionary accordingly
    #print filepath
    # bool is True for coordinate files
    # bool is False for non - coordinate files
    filepath += filename
    file_obj = open(filepath, 'r')
    list1 = file_obj.readlines()
    #print list1
    Dic_name = {}
    if bool == True: 
        for l in list1:
            key = l.split('\t')[0]
            Dic_name[key] =[]
            v = l.split('\t')
            if 'N' in v:
                Dic_name[key] = 'Null'
            else:
                Dic_name[key].append(float(l.split('\t')[1]))
                Dic_name[key].append(float(l.split('\t')[2]))
                Dic_name[key].append(float(l.split('\t')[3]))
            """
            if v[1].isnumeric() == False:
                Dic_name[key].append((v[1]))
            if v[1].isnumeric() == True:
                Dic_name[key].append(float(v[1]))
            if v[2].isnumeric() == False:
                Dic_name[key].append((v[2]))
            if v[2].isnumeric() == True:
                Dic_name[key].append(float(v[2]))
            if v[3].isnumeric() == False:
                Dic_name[key].append((v[3]))
            if v[3].isnumeric() == True:
                Dic_name[key].append(float(v[3]))
            """
                
    if bool == False:
        #print list1
        for l in list1:
            key = l.split('\t')[0]
            Dic_name[key] =[]
            v = l.split('\t')
            if len(v) == 2:
                Dic_name[key] = v[1]
            else:
                if 'N' in v:
                    Dic_name[key] = 'Null'
                else:
                    for i in range(1, len(v)):
                        new_str =int(v[i])
                        Dic_name[key].append(new_str)
    file_obj.close()
    return Dic_name

def ImportListFromtxt(filepath, filename):
    # the follwoing function gets the 
    # path of file and the name of the dictionary
    # and then creates the dictionary accordingly
    #print filepath
    # bool is True for coordinate files
    # bool is False for non - coordinate files
    filepath += filename
    file_obj = open(filepath, 'r')
    list1 = file_obj.readlines()
    #print list1
    List_name = []
    for l in list1:
        new_list = []
        v = l.split('\t')
        for i in range(len(v)):
            if v[i].isnumeric() == False:
                if '\n' in v[i]:
                    new_v =''
                    for j in range(len(v[i])-1):
                        new_v += v[i][j]
                    new_str = new_v
                else:
                    new_str = (v[i])
            if v[i].isnumeric() == True:
                if '\n' in v[i]:
                    new_v =''
                    for j in range(len(v[i])-1):
                        new_v += v[i][j]
                    new_str = int(new_v)
                else:
                    new_str = int(v[i])
            new_list.append(new_str)
        List_name.append(new_list)
    file_obj.close()
    return List_name