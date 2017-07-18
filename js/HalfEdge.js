function GetEdgeNormal2D(vector)
{
	return new THREE.Vector3(-vector.y,vector.x,0).normalize();
}
function sortAngle(targetHE, halfedgeArray)
{
        var min_element=-1;
        var min_angle=10;
        var target=new THREE.Vector3(targetHE.sym.vert.pos.x-targetHE.vert.pos.x,
                                    targetHE.sym.vert.pos.y-targetHE.vert.pos.y,
                                    targetHE.sym.vert.pos.z-targetHE.vert.pos.z).normalize();
        for(var e in halfedgeArray)
        {
            if(targetHE.sym==halfedgeArray[e]) continue;
            var vector=new THREE.Vector3(halfedgeArray[e].vert.pos.x-halfedgeArray[e].sym.vert.pos.x,
                                        halfedgeArray[e].vert.pos.y-halfedgeArray[e].sym.vert.pos.y,
                                        halfedgeArray[e].vert.pos.z-halfedgeArray[e].sym.vert.pos.z).normalize();
            var angle=Math.acos(target.dot(vector))
            // var crossproduct=
            if((new THREE.Vector3().crossVectors(target,vector)).z>0)
                angle=2.0*Math.PI-angle;    
            if(angle<min_angle)
            {
                min_angle=angle;
                min_element=e;
            }
        }
        return min_element;
}
function Vertex( id )
{
	if(id==undefined)
		this.id=undefined;
	else
		this.id=id;
	this.edge=undefined;
	this.pos=undefined;
	this.node=undefined;
	this.external_node=undefined;
}
function Face(id)
{
	if(id==undefined)
		this.id=undefined;
	else
		this.id=id;
	this.startedge=undefined;
	this.dual_pos=undefined;
	this.center_pos=undefined;
	this.external_dual_edge=[];
}
function HalfEdge(id)
{
	if(id==undefined)
		this.id=undefined;
	else
		this.id=id;
	this.next=undefined;
	this.vert=undefined;
	this.face=undefined;
	this.sym=undefined;
}
function ExternalEdge(id)
{
	if(id==undefined)
		this.id=undefined;
	else
		this.id=id;
	this.pair=undefined;
}
function Node()
{
	this.Sort_Face_ID=[];
	this.face_pair=[];
	this.vert=undefined;
}
Node.prototype.findFacePair=function(f_pair){
	var inverse_pair=new THREE.Vector2(f_pair.y,f_pair.x)
	var result=0
}
function External_Node()
{
	this.vert=undefined;
}
function Mesh()
{
	this.mesh_face=[];
	this.mesh_half_edge=[];
	this.mesh_vertex=[];
	this.half_finished=false;
	this.dual_geo_center=new THREE.Vector3();
	// The first element in bound is the min(x,y,z), and the second element is the max(x,y,z);
	this.bound=[new THREE.Vector3(),new THREE.Vector3()];
	this.dual_bound=[new THREE.Vector3(),new THREE.Vector3()];
	
	this.external_edge=[];	
	this.node=[];
	this.external_node=[];

	this.internal_dual_edge_length_map=[];
	this.internal_dual_edge_direction_map=[];

	this.external_face_ID=undefined;

}
function Node_Face_Pair()
{
	this.f_p=undefined;
	this.dual_edge_ID=undefined;
}
function Direction_Map_Obj()
{
	this.f_p=undefined;
	this.id=undefined;
	this.direction_vector=undefined;
	this.thick_value=undefined;
}
function Length_Map_Obj()
{
	this.f_p=undefined;
	this.id=undefined;
	this.length=undefined
}
Mesh.prototype.clear = function() {
	this.mesh_face=[];
	this.mesh_half_edge=[];
	this.mesh_vertex=[];
	this.half_finished=false;
	this.dual_geo_center=new THREE.Vector3();

	// The first element in bound is the min(x,y,z), and the second element is the max(x,y,z);
	this.bound=[new THREE.Vector3(),new THREE.Vector3()]
	this.dual_bound=[new THREE.Vector3(),new THREE.Vector3()];

	this.external_edge=[];	
	this.node=[];
	this.external_node=[];

	this.internal_dual_edge_length_map=[];
	this.internal_dual_edge_direction_map=[];

	this.external_face_ID=undefined;

};

Mesh.prototype.find_2D_Nodes=function(){
	'use strict'
	if(this.half_finished==false) return;
	var v_flag=[];
    for(var i in this.mesh_vertex)
    {
        if(this.mesh_vertex[i].edge==undefined)
            v_flag[i]=false;
        else
            v_flag[i]=true;
    }
    //find out external node 
    var he=this.mesh_face[this.external_face_ID].startedge;
    do{
        v_flag[he.vert.id]=false;
        var ex_node=new External_Node()
        ex_node.vert=he.vert;
        this.external_node.push(ex_node);
       	he.vert.external_node=ex_node;
        he=he.next;

    }while(he!=this.mesh_face[this.external_face_ID].startedge)

    //find out internal node
    for(var i in v_flag)
    {
        if(v_flag[i]==true)
        {
            var node=new Node();
            node.vert=this.mesh_vertex[i];
            this.mesh_vertex[i].node=node;
            this.node.push(node);
        }
    }


    //Build the connection between direction map and 
   	var map_index=0;
    for(var i in this.node)
    {
    	var start=this.node[i].vert.edge
    	var he=start;
    	// var sort_direction=[]
    	// var thick=[];
    	var sign=1;
    	var startface=undefined, endface=undefined;
    	// do
    	// {
    	// 	this.node[i].Sort_Face_ID.push(he.face.id)  		
    	// 	var l=(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos));
    	// 	var dir=GetEdgeNormal2D(l);
    	// 	sort_direction.push(dir);
    	// 	thick.push(l.length())
    	// 	he=he.next.sym;
    	// }while(he!=start)


    	// var sort_face_num=this.node[i].Sort_Face_ID.length;
    	// var sign=1;
    	// var startface=undefined, endface=undefined;
    	// var next_face_index=undefined;

    	// for(var j=0;j<sort_face_num;j++)
    	// {
    	// 	if(j==sort_face_num-1) next_face_index=0;
    	// 	else next_face_index=j+1;
    	// 	var node_face_pair_obj=new Node_Face_Pair;
    	// 	node_face_pair_obj.f_p=new THREE.Vector2(this.node[i].Sort_Face_ID[j],this.node[i].Sort_Face_ID[next_face_index])

    	// 	var index=this.internal_dual_edge_direction_map.findIndex(function(x) { 
    	// 	var reverse_f_pair=new THREE.Vector2(node_face_pair_obj.f_p.y,node_face_pair_obj.f_p.x);
    	// 	return (x.f_p.x == node_face_pair_obj.f_p.x && x.f_p.y == node_face_pair_obj.f_p.y)
    	// 			|| (x.f_p.x==reverse_f_pair.x && x.f_p.y==reverse_f_pair.y); });

    	// 	if(index==-1)
    	// 	{
	    // 		if(node_face_pair_obj.f_p.y>node_face_pair_obj.f_p.x)
	    // 		{
	    // 			sign=1;
	    // 			startface=node_face_pair_obj.f_p.x;
	    // 			endface=node_face_pair_obj.f_p.y;
	    // 		}	
	    // 		else
	    // 		{
	    // 			sign=-1;
	    // 			startface=node_face_pair_obj.f_p.y;
	    // 			endface=node_face_pair_obj.f_p.x;

	    // 		}
	    // 		var direction_map_obj=new Direction_Map_Obj();
	    // 		var pair=new THREE.Vector2(startface,endface)
	    // 		var d=new THREE.Vector3(sign*sort_direction[next_face_index].x,sign*sort_direction[next_face_index].y,0);
	    // 		direction_map_obj.f_p=pair;
	    // 		direction_map_obj.direction_vector=d;
	    // 		direction_map_obj.id=map_index;

	    // 		this.internal_dual_edge_direction_map.push(direction_map_obj);
	    // 		node_face_pair_obj.dual_edge_ID=map_index;
	    // 		map_index++;
	    // 	}
    	// 	else{
    	// 		node_face_pair_obj.dual_edge_ID=index;
    	// 	}
    	// 	this.node[i].face_pair.push(node_face_pair_obj);
    	// }

    	do
    	{
    		this.node[i].Sort_Face_ID.push(he.sym.face.id); 
    		var node_face_pair_obj=new Node_Face_Pair;
    	 	node_face_pair_obj.f_p=new THREE.Vector2(he.sym.face.id,he.face.id) 		
    		var l=(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos));
    		var dir=GetEdgeNormal2D(l);
    		var thick=l.length();

    		var index=this.internal_dual_edge_direction_map.findIndex(function(x) { 
    		var reverse_f_pair=new THREE.Vector2(node_face_pair_obj.f_p.y,node_face_pair_obj.f_p.x);
    		return (x.f_p.x == node_face_pair_obj.f_p.x && x.f_p.y == node_face_pair_obj.f_p.y)
    				|| (x.f_p.x==reverse_f_pair.x && x.f_p.y==reverse_f_pair.y); });
    		if(index==-1)
    		{
	    		if(node_face_pair_obj.f_p.y>node_face_pair_obj.f_p.x)
	    		{
	    			sign=1;
	    			startface=node_face_pair_obj.f_p.x;
	    			endface=node_face_pair_obj.f_p.y;
	    		}	
	    		else
	    		{
	    			sign=-1;
	    			startface=node_face_pair_obj.f_p.y;
	    			endface=node_face_pair_obj.f_p.x;

	    		}
	    		var direction_map_obj=new Direction_Map_Obj();
	    		var pair=new THREE.Vector2(startface,endface)
	    		var d=new THREE.Vector3(sign*dir.x,sign*dir.y,0);
	    		direction_map_obj.f_p=pair;
	    		direction_map_obj.direction_vector=d;
	    		direction_map_obj.id=map_index;
	    		direction_map_obj.thick_value=thick;

	    		this.internal_dual_edge_direction_map.push(direction_map_obj);
	    		node_face_pair_obj.dual_edge_ID=map_index;
	    		map_index++;
	    	}
    		else
    			node_face_pair_obj.dual_edge_ID=index;
    		this.node[i].face_pair.push(node_face_pair_obj);
    		he=he.next.sym;
    	}while(he!=start)
    	
    	
    }

}

Mesh.prototype.Produce_dual_structure=function()
{
	'use strict'
	 // var x=numeric.solveLP([1,2,3],                      /* minimize [1,2,3]*x                */
  //                   [[-1,0,0],[0,-1,0],[0,0,-1]], /* matrix A of inequality constraint */
  //                   [0,0,0],                      /* RHS b of inequality constraint    */
  //                   [[1,1,1]],                    /* matrix Aeq of equality constraint */
  //                   [3]                           /* vector beq of equality constraint */
  //                   );

	 //console.log(x.solution)
	 //Using numeric.solveLP(m_C,m_A,m_b,m_Aeq,m_beq).
	 if(this.half_finished==false) return;
	 var node_num_2=this.node.length*2;
	 var internal_edge_num= this.internal_dual_edge_direction_map.length;
	 if(node_num_2==0 ||internal_edge_num==0) return;
	 var m_Aeq=[];
	 for(var i=0;i<node_num_2;i+=2)
	 {
	 	m_Aeq[i]=new Array(internal_edge_num);
	 	m_Aeq[i+1]=new Array(internal_edge_num);
	 	m_Aeq[i].fill(0);
	 	m_Aeq[i+1].fill(0);
	 	for(var j=0;j<this.node[i/2].face_pair.length;j++)
	 	{
	 		var sign=0;
	 		var id=this.node[i/2].face_pair[j].dual_edge_ID;
	 		if(this.node[i/2].face_pair[j].f_p.x==this.internal_dual_edge_direction_map[id].f_p.x &&
	 			this.node[i/2].face_pair[j].f_p.y==this.internal_dual_edge_direction_map[id].f_p.y)
	 			sign=1;
	 		else sign=-1;
	 		m_Aeq[i][id]=sign*this.internal_dual_edge_direction_map[id].direction_vector.x;
	 		m_Aeq[i+1][id]=sign*this.internal_dual_edge_direction_map[id].direction_vector.y;
	 	}
	 }
	 var m_A=[];
	 for(var i=0;i<internal_edge_num;i++)
	 {
	 	m_A[i]=new Array(internal_edge_num);
	 	m_A[i].fill(0);
	 	m_A[i][i]=-1;
	 }
	 var m_b=[];
	 for(var i=0;i<internal_edge_num;i++)
	 	m_b[i]=-1;

	 var m_beq=[];
	 for(var i=0;i<node_num_2;i++)
	 	m_beq[i]=0;

	 var m_C=[];	 
	 for(var i=0;i<internal_edge_num;i++)
	 	m_C[i]=1;
	 var x=numeric.solveLP(m_C,m_A,m_b,m_Aeq,m_beq);   
	 for(var i=0;i<internal_edge_num;i++)
	 {
	 	var length_map_obj=new Length_Map_Obj();
	 	length_map_obj.id=i;
	 	length_map_obj.f_p=this.internal_dual_edge_direction_map[i].f_p;
	 	length_map_obj.length=x.solution[i];
	 	this.internal_dual_edge_length_map.push(length_map_obj);
	 }

	 this.mesh_face[0].dual_pos=new THREE.Vector3(0,0,0);
	 this.computeDualPos(0);
	 this.dual_geo_center.divideScalar(this.mesh_face.length-1);
	 this.computeExDualEdge();


	//rescale the dual structure;	 
	 var l1=(new THREE.Vector3().subVectors(this.bound[1],this.bound[0]));
	 var l2=(new THREE.Vector3().subVectors(this.dual_bound[1],this.dual_bound[0]));

	 var scale=l1.length()/l2.length()*0.75;

	 for(var i in this.mesh_face)
	 {	
	 	if(i==this.external_face_ID) continue;
	 	this.mesh_face[i].dual_pos.sub(this.dual_geo_center)
	 	this.mesh_face[i].dual_pos.multiplyScalar(scale);
	 	this.mesh_face[i].dual_pos.add(this.mesh_face[this.external_face_ID].center_pos);
	 	for(var j in this.mesh_face[i].external_dual_edge)
	 		this.mesh_face[i].external_dual_edge[j].multiplyScalar(l1.length()*0.08);
	 }


	 
	 for(var i in this.dual_bound)
	 {
	  	this.dual_bound[i].sub(this.dual_geo_center);
	  	this.dual_bound[i].multiplyScalar(scale);
	  	this.dual_bound[i].add(this.mesh_face[this.external_face_ID].center_pos);
	 }
	 this.dual_geo_center=this.mesh_face[this.external_face_ID].center_pos;
	 for(var i in this.internal_dual_edge_length_map)
	 	this.internal_dual_edge_length_map[i].length*=scale;
	





}

Mesh.prototype.computeDualPos=function(startFace_id)
{
	if(this.internal_dual_edge_length_map.length==0) return;
	var startPos=this.mesh_face[startFace_id].dual_pos;
	if(startPos==undefined) return;
	var start_he=this.mesh_face[startFace_id].startedge;
	var he=start_he;
	do
	{
		if(he.sym.face.id!=this.external_face_ID)
		{
			if(he.sym.face.dual_pos==undefined)
			{
				var neighbour_ID=he.sym.face.id;
				var f_pair=new THREE.Vector2(startFace_id,neighbour_ID)
				var dual_p=undefined;
				var sign=1;
				if(startFace_id<neighbour_ID)
	    			sign=1;
	    		else
	    			sign=-1;
				var index=this.internal_dual_edge_direction_map.findIndex(function(x) { 
		    		return (x.f_p.x== f_pair.x && x.f_p.y == f_pair.y)
		    				|| (x.f_p.x==f_pair.y && x.f_p.y==f_pair.x); 
	    		});

	    		if(index==-1)
	    		{
	    			var he_l=new THREE.Vector3().subVectors(he.sym.pos,he.pos);
	    			var dis_scale=(new THREE.Vector3().subVectors(he.sym.face.center_pos,he.face.center_pos)).length();
	    			var dir=GetEdgeNormal2D(he_l).multiplyScalar(dis_scale);
	    			dual_p=new THREE.Vector3().addVectors(startPos,dir);
	    		}
	    		else
	    			dual_p=new THREE.Vector3(startPos.x+sign*this.internal_dual_edge_length_map[index].length*this.internal_dual_edge_direction_map[index].direction_vector.x,
	    		startPos.y+sign*this.internal_dual_edge_length_map[index].length*this.internal_dual_edge_direction_map[index].direction_vector.y,
	    		startPos.z+sign*this.internal_dual_edge_length_map[index].length*this.internal_dual_edge_direction_map[index].direction_vector.z);	    		
	    		
	    		this.mesh_face[neighbour_ID].dual_pos=dual_p;
	    		if(dual_p.x<this.dual_bound[0].x)
                	this.dual_bound[0].x=dual_p.x
            	else if(dual_p.x>this.dual_bound[1].x)
                	this.dual_bound[1].x=dual_p.x;

		        if(dual_p.y<this.dual_bound[0].y)
		            this.dual_bound[0].y=dual_p.y;
		        else if(dual_p.y>this.dual_bound[1].y)
		            this.dual_bound[1].y=dual_p.y;

		        if(dual_p.z<this.dual_bound[0].z)
		            this.dual_bound[0].z=dual_p.z
		        else if(dual_p.z>this.dual_bound[1].z)
		            this.dual_bound[1].z=dual_p.z;


	    		this.dual_geo_center.add(this.mesh_face[neighbour_ID].dual_pos);
	    		this.computeDualPos(neighbour_ID);
			}
		}
		he=he.next;
	}while(he!=start_he);
}
Mesh.prototype.computeExDualEdge=function()
{
	if(this.external_face_ID==undefined) return;
	var start=this.mesh_face[this.external_face_ID].startedge;
	var he=start;
	do{
		var l=GetEdgeNormal2D(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos));
		he.sym.face.external_dual_edge.push(l);
		he=he.next;
	}while(he!=start);
}

