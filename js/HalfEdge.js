function HalfEdge_sortAngle(targetHE, halfedgeArray){
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
function Vertex( id ){
	if(id==undefined)
		this.id=undefined;
	else
		this.id=parseInt(id);
    this.Force_Face_ID=undefined;// Available only when the geometry represents the Form diagram
	this.edge=undefined;
	this.pos=undefined;
	this.node=undefined;
	this.external_node=undefined;
}
function Face(id){
	if(id==undefined)
		this.id=undefined;
	else
		this.id=parseInt(id);
    this.Form_Vert_ID=undefined;// Available only when the geometry represents the Force diagram
	this.startedge=undefined;
	this.dual_pos=undefined;
	this.center_pos=undefined;
	this.external_dual_edge=[];
}
function HalfEdge(id){
	if(id==undefined)
		this.id=undefined;
	else
		this.id=parseInt(id);
	this.next=undefined;
	this.vert=undefined;
	this.face=undefined;
	this.sym=undefined;
    this.Perpendicular_hl_ID=undefined; // Available after the dual structure is computed.
	this.external=false;
	this.connected=false;
    this.fliped=false;
}
function Node(){
	this.Sort_Face_ID=[];
	this.face_pair=[];
	this.vert=undefined;
}
// Node.prototype.findFacePair=function(f_pair){
// 	var inverse_pair=new THREE.Vector2(f_pair.y,f_pair.x)
// 	var result=0
// }
function External_Node(){
	this.vert=undefined;
}
function Mesh(type){
	this.mesh_face=[];
	this.mesh_half_edge=[];
	this.mesh_vertex=[];
    this.external_face_ID=undefined;
	this.half_finished=false;
	this.dual_finished=false;
	this.dual_fixed_center=new THREE.Vector3();
    this.fixed_center=new THREE.Vector3();

	// The first element in bound is the min(x,y,z), and the second element is the max(x,y,z);
	this.bound=[new THREE.Vector3(),new THREE.Vector3()];
	this.dual_bound=[new THREE.Vector3(),new THREE.Vector3()];
	
	// this.external_edge=[];	
	this.node=[];
	this.external_node=[];
	this.internal_dual_edge_map=[];
    this.external_dual_edge_map=[];


	this.type=(type=="Form"? "Form":"Force");

}
function Node_Face_Pair(){
	this.f_p=undefined;
	this.dual_edge_ID=undefined;
}
function External_Dual_Edge_Obj(id){
    this.id=undefined;
    if(id!=undefined)
        this.id=id;
    this.face=undefined;
    this.vector=undefined;
    this.hl_ID=undefined;
}
function Internal_Dual_Edge_Obj(id){
	this.id=undefined;
    if(id!=undefined)
        this.id=id;
    this.f_p=undefined;
	this.direction_vector=undefined;
    this.length=undefined;
    this.hl_ID=undefined;
}
Mesh.prototype.clear = function() {
	this.mesh_face=[];
	this.mesh_half_edge=[];
	this.mesh_vertex=[];
    this.external_face_ID=undefined;
	this.half_finished=false;
	this.dual_finished=false;
	this.dual_fixed_center=new THREE.Vector3();
    this.fixed_center=new THREE.Vector3();

	// The first element in bound is the min(x,y,z), and the second element is the max(x,y,z);
	this.bound=[new THREE.Vector3(),new THREE.Vector3()]
	this.dual_bound=[new THREE.Vector3(),new THREE.Vector3()];

	this.node=[];
	this.external_node=[];
	this.internal_dual_edge_map=[];
    this.external_dual_edge_map=[];
};
Mesh.prototype.buildHalfEdgeStructure=function(vertices,edges){
	this.clear();
	var edgepair=[];
    var vertex_edge_count=[];//Used to record the number of edges start from each point
    var vertex_edge_map=[];//Used to record the edges start from each point
    var h_id=0,e_id=0;
    //read vertices
    var z=vertices[0][2];
    for(var v in vertices){
        if(vertices[v][2]!=z){
            alert("Z coords must be same for all vertices");
            return;
        }
        this.mesh_vertex[v]=new Vertex(v);
        this.mesh_vertex[v].pos=new THREE.Vector3(
            vertices[v][0],
            vertices[v][1],
            vertices[v][2]); 
        if(v==0){
            this.bound[0].x=vertices[v][0];
            this.bound[0].y=vertices[v][1];
            this.bound[0].z=vertices[v][2];
            this.bound[1].x=vertices[v][0];
            this.bound[1].y=vertices[v][1];
            this.bound[1].z=vertices[v][2];
        }
        else{
            if(vertices[v][0]<this.bound[0].x)
                this.bound[0].x=vertices[v][0]
            else if(vertices[v][0]>this.bound[1].x)
                this.bound[1].x=vertices[v][0];

            if(vertices[v][1]<this.bound[0].y)
                this.bound[0].y=vertices[v][1];
            else if(vertices[v][1]>this.bound[1].y)
                this.bound[1].y=vertices[v][1];

            if(vertices[v][2]<this.bound[0].z)
                this.bound[0].z=vertices[v][2]
            else if(vertices[v][2]>this.bound[1].z)
                this.bound[1].z=vertices[v][2];
        }
        this.fixed_center.add(this.mesh_vertex[v].pos);
        vertex_edge_count[v]=0;
        vertex_edge_map[v]=new Array();
    }
    this.fixed_center.divideScalar(this.mesh_vertex.length);

    //read edges
    for(var e in edges){
        if(edges[e][0]!=undefined && edges[e][1]!=undefined){
            edgepair[e]=new THREE.Vector2(
                edges[e][0],
                edges[e][1]);
            vertex_edge_count[edges[e][0]]+=1;
            vertex_edge_count[edges[e][1]]+=1;
        }

    }
    //building half edges for external edges internal edges
    for(var e in edgepair){    
        var he=new HalfEdge(h_id);
        var he_sym=new HalfEdge(h_id+1);
        if(vertex_edge_count[edgepair[e].x]==1 || vertex_edge_count[edgepair[e].y]==1){
        	if(this.type=="Force") {
        		continue;
        	}
        	else{
        		he.external=true;
        		he_sym.external=true;
        	}
        } 
        
        he.vert=this.mesh_vertex[edgepair[e].y];
        he_sym.vert=this.mesh_vertex[edgepair[e].x];
        vertex_edge_map[edgepair[e].y].push(he_sym);
        vertex_edge_map[edgepair[e].x].push(he);
        he.sym=he_sym;
        he_sym.sym=he;  
        this.mesh_half_edge[h_id]=he;
        this.mesh_half_edge[h_id+1]=he_sym;
        h_id+=2;
    }

    //find Next
    var ex_start=undefined;
    for(var i in this.mesh_half_edge){
        var halfedgeGroup=vertex_edge_map[this.mesh_half_edge[i].vert.id];
        var next_idx=HalfEdge_sortAngle(this.mesh_half_edge[i],halfedgeGroup);
        if(next_idx!=-1)
        	this.mesh_half_edge[i].next=halfedgeGroup[next_idx];
        else if(ex_start==undefined  && this.type=="Form"){
        	ex_start=this.mesh_half_edge[i];
        }
    }
    if(ex_start!=undefined){
    	var start=ex_start;
    	var pre=undefined;
    	var lead=undefined;
    	do{
    		var he_ex=start.sym;
    		while(he_ex.next)
    			he_ex=he_ex.next;
    		var he=new HalfEdge(this.mesh_half_edge.length);
    		var he_sym=new HalfEdge(this.mesh_half_edge.length+1);
    		he.vert=start.vert;
    		he_sym.vert=he_ex.vert;
    		he.external=true;
    		he_sym.external=true;
    		he.connected=true;
    		he_sym.connected=true;
    		he.sym=he_sym;
    		he_sym.sym=he;
    		he_ex.next=he;
    		he.next=start.sym;
    		start=he_ex;
    		if(pre!=undefined) pre.next=he_sym;
    		if(lead==undefined) lead=he_sym;
    		pre=he_sym;
    		this.mesh_half_edge.push(he);
    		this.mesh_half_edge.push(he_sym);
    	}while(start!=ex_start);
    	this.mesh_half_edge[this.mesh_half_edge.length-1].next=lead;
    }

    //build face
    var f_id=0;
    for(var i in this.mesh_half_edge) {
        
        if(this.mesh_half_edge[i].face==undefined) {
            var he=this.mesh_half_edge[i];
            var edge_count=0;
            var sum=new THREE.Vector3(0,0,0);
            var f=new Face(f_id);
            f.startedge=he;
            this.mesh_face[f_id]=f;
            do {
                he.face=f;
                sum.add(he.vert.pos);
                if(he.vert.edge==undefined)
                	he.vert.edge=he;
                edge_count+=1;
                he=he.next;
            }while(he!=this.mesh_half_edge[i])
            f.center_pos=new THREE.Vector3(sum.x/edge_count,sum.y/edge_count,sum.z/edge_count);

            if(this.external_face_ID==undefined){
            	var v1=(new THREE.Vector3().subVectors(he.vert.pos,f.center_pos)).normalize(); 
            	var v2=(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos)).normalize(); 
            	if(v1.cross(v2).z<0)
                	this.external_face_ID=f_id; 
            }
            f_id+=1;
        }
    }
    if(this.external_face_ID==undefined)
    {
        alert("No External Face.");
        return;
    }    
    this.half_finished=true;	
}

Mesh.prototype.find_2D_Nodes=function(){
	'use strict'
	if(this.half_finished==false) return;
	var v_flag=[];
    for(var i in this.mesh_vertex){
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
    for(var i in v_flag){
        if(v_flag[i]==true)
        {
            var node=new Node();
            node.vert=this.mesh_vertex[i];
            this.mesh_vertex[i].node=node;
            this.node.push(node);
        }
    }

    //Build the connection between direction map and node face pair
   	var map_index=0;
    for(var i in this.node){
    	var start=this.node[i].vert.edge;
    	var he=start;
    	var sign=1;
    	do
    	{
    		this.node[i].Sort_Face_ID.push(he.sym.face.id); 
    		var node_face_pair_obj=new Node_Face_Pair();
    	 	node_face_pair_obj.f_p=new THREE.Vector2(he.sym.face.id,he.face.id) 		
    		var index=this.internal_dual_edge_map.findIndex(function(x) { 
    		return (x.f_p.x == node_face_pair_obj.f_p.x && x.f_p.y == node_face_pair_obj.f_p.y)
    				|| (x.f_p.x==node_face_pair_obj.f_p.y && x.f_p.y==node_face_pair_obj.f_p.x); });
    		if(index==-1){
                var in_edge_obj=new Internal_Dual_Edge_Obj();
	    		if(node_face_pair_obj.f_p.y>node_face_pair_obj.f_p.x){
                    sign=1;
                    in_edge_obj.f_p=new THREE.Vector2(node_face_pair_obj.f_p.x,node_face_pair_obj.f_p.y);
                }
	    		else{
	    			sign=-1;
                    in_edge_obj.f_p=new THREE.Vector2(node_face_pair_obj.f_p.y,node_face_pair_obj.f_p.x);
	    		}
                var l=(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos));
                var dir=GetEdgeNormal2D(l).multiplyScalar(sign);
	    		in_edge_obj.direction_vector=dir;
	    		in_edge_obj.id=map_index;
                if((this.type=="Force" && sign==1) || (this.type=="Form" && sign==-1)) in_edge_obj.hl_ID=he.id;
                else in_edge_obj.hl_ID=he.sym.id;              
	    		this.internal_dual_edge_map.push(in_edge_obj);
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

Mesh.prototype.Produce_dual_structure=function(){
	'use strict'
	 
	 //Using numeric.solveLP(m_C,					/* minimize m_C*x                */
	 						//m_A,					/* matrix m_A of inequality constraint */
	 						//m_b,					/* RHS m_b of inequality constraint    */
	 						//m_Aeq,				/* matrix m_Aeq of equality constraint */
	 						//m_beq).				/* vector m_beq of equality constraint */

	 //An easy example
	 // var x=numeric.solveLP([1,2,3],             /* minimize [1,2,3]*x                */
//                   [[-1,0,0],[0,-1,0],[0,0,-1]], /* matrix A of inequality constraint */
//                   [0,0,0],                      /* RHS b of inequality constraint    */
//                   [[1,1,1]],                    /* matrix Aeq of equality constraint */
//                   [3]                           /* vector beq of equality constraint */
//                   );
	//console.log(x.solution)
	 if(this.half_finished==false) return;
	 var node_num_2=this.node.length*2;
	 var internal_edge_num= this.internal_dual_edge_map.length;
	 if(node_num_2==0 ||internal_edge_num==0) return;
	 var m_Aeq=[];
	 

	 for(var i=0;i<node_num_2;i+=2){
	 	m_Aeq[i]=new Array(internal_edge_num);
	 	m_Aeq[i+1]=new Array(internal_edge_num);
	 	m_Aeq[i].fill(0);
	 	m_Aeq[i+1].fill(0);
	 	for(var j=0;j<this.node[i/2].face_pair.length;j++)	{
	 		var sign=-1;
	 		var id=this.node[i/2].face_pair[j].dual_edge_ID;
	 		if(this.node[i/2].face_pair[j].f_p.x==this.internal_dual_edge_map[id].f_p.x &&
	 			this.node[i/2].face_pair[j].f_p.y==this.internal_dual_edge_map[id].f_p.y)
	 			sign=1;
	 		m_Aeq[i][id]=sign*this.internal_dual_edge_map[id].direction_vector.x;
	 		m_Aeq[i+1][id]=sign*this.internal_dual_edge_map[id].direction_vector.y;
	 	}
	 }
	 m_Aeq=Maxium_Linear_Independent_Group(numeric.transpose(m_Aeq)).result;
	 m_Aeq=numeric.transpose(m_Aeq);
	 console.log(m_Aeq);

	 if(m_Aeq.length>=m_Aeq[0].length){
	 	alert("No Positive solution")
	 	return;
	 }

	 var m_A=[];
	 for(var i=0;i<m_Aeq[0].length;i++) {
	 	m_A[i]=new Array(m_Aeq[0].length);
	 	m_A[i].fill(0);
	 	m_A[i][i]=-1;
	 }
	 var m_b=[];
	 for(var i=0;i<m_Aeq[0].length;i++)
	 	m_b[i]=-1;
	 var m_beq=[];
	 for(var i=0;i<m_Aeq.length;i++)
	 	m_beq[i]=0;

	 var m_C=[];	 
	 for(var i=0;i<m_Aeq[0].length;i++)
	 	m_C[i]=1;

	var x=numeric.solveLP(m_C,m_A,m_b,m_Aeq,m_beq); 
	console.log(x);
	if(x.message=="Infeasible")	{
		alert("No Positive solution")
		return;
	}

	 for(var i=0;i<internal_edge_num;i++) {
        this.internal_dual_edge_map[i].length=x.solution[i];
	 }
	 var startId=0;
	 if(this.external_face_ID==0) startId=1;
	 this.mesh_face[startId].dual_pos=new THREE.Vector3(0,0,0);
	 this.computeDualPos(startId);
	 this.computeExDualEdge();
     this.dual_fixed_center.divideScalar(this.mesh_face.length-1+this.external_dual_edge_map.length);


	//rescale the dual structure. 
	 var l1=(new THREE.Vector3().subVectors(this.bound[1],this.bound[0]));
	 var l2=(new THREE.Vector3().subVectors(this.dual_bound[1],this.dual_bound[0]));
	 var scale=l1.length()/l2.length()*0.75;

	 for(var i in this.mesh_face) {	
	 	if(i==this.external_face_ID) continue;
	 	this.mesh_face[i].dual_pos.sub(this.dual_fixed_center)
	 	this.mesh_face[i].dual_pos.multiplyScalar(scale);
	 	this.mesh_face[i].dual_pos.add(this.fixed_center);
	 	for(var j in this.mesh_face[i].external_dual_edge){
            this.mesh_face[i].external_dual_edge[j].vector.multiplyScalar(l1.length()*0.08);
        }
	 }

	 for(var i in this.dual_bound) {
	  	this.dual_bound[i].sub(this.dual_fixed_center);
	  	this.dual_bound[i].multiplyScalar(scale);
	  	this.dual_bound[i].add(this.fixed_center);
	 }
	 this.dual_fixed_center=new THREE.Vector3().copy(this.fixed_center);
	 for(var i in this.internal_dual_edge_map){
	 	this.internal_dual_edge_map[i].length*=scale;
	 }
	 this.dual_finished=true;
	
}

Mesh.prototype.computeDualPos=function(startFace_id){
	if(this.internal_dual_edge_map.length==0) return;
	var startPos=this.mesh_face[startFace_id].dual_pos;
	if(startPos==undefined) return;
	var start_he=this.mesh_face[startFace_id].startedge;
	var he=start_he;
	do{
		if(he.sym.face.id!=this.external_face_ID){
			if(he.sym.face.dual_pos==undefined)	{
				var neighbour_ID=he.sym.face.id;
				var f_pair=new THREE.Vector2(startFace_id,neighbour_ID);
				var f_pair_obj=new THREE.Vector2();
				var dual_p=undefined;
                var in_edge_obj=undefined;
                var sign=1;
				if(startFace_id<neighbour_ID)
	    			f_pair_obj=new THREE.Vector2().copy(f_pair);
	    		else{
	    			sign=-1;
	    			f_pair_obj=new THREE.Vector2(f_pair.y,f_pair.x);
	    		}
				var index=this.internal_dual_edge_map.findIndex(function(x) { 
		    		return (x.f_p.x== f_pair.x && x.f_p.y == f_pair.y)
		    				|| (x.f_p.x==f_pair.y && x.f_p.y==f_pair.x); 
	    		});

	    		if(index==-1){
	    			var he_l=new THREE.Vector3().subVectors(he.sym.vert.pos,he.vert.pos);
	    			var dir=GetEdgeNormal2D(he_l).multiplyScalar(sign);	    			
                    in_edge_obj=new Internal_Dual_Edge_Obj();
			        in_edge_obj.f_p=f_pair_obj;
			        in_edge_obj.direction_vector=dir;
			        in_edge_obj.id=this.internal_dual_edge_map.length;
                    in_edge_obj.length=1;
                    if((this.type=="Force" && sign==1) || (this.type=="Form" && sign==-1)) in_edge_obj.hl_ID=he.sym.id;
                    else in_edge_obj.hl_ID=he.id;
			        this.internal_dual_edge_map.push(in_edge_obj);
			        dual_p=new THREE.Vector3().addVectors(startPos,dir);
	    		}
	    		else{
                    in_edge_obj=this.internal_dual_edge_map[index];
	    			dual_p=new THREE.Vector3().addVectors(
                        startPos,new THREE.Vector3().addScaledVector(in_edge_obj.direction_vector,sign*in_edge_obj.length));
	    		}


	    		
	    		this.mesh_face[neighbour_ID].dual_pos=dual_p;
	    		if(dual_p.x<this.dual_bound[0].x)
                	this.dual_bound[0].x=dual_p.x;
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

	    		this.dual_fixed_center.add(this.mesh_face[neighbour_ID].dual_pos);
	    		this.computeDualPos(neighbour_ID);
			}
		}
		he=he.next;
	}while(he!=start_he);
}
Mesh.prototype.computeExDualEdge=function(){
	if(this.external_face_ID==undefined || this.type=="Form") return;
	var start=this.mesh_face[this.external_face_ID].startedge;
	var he=start;
	do{
        var ex_edge=new External_Dual_Edge_Obj(this.external_dual_edge_map.length);
        var l=GetEdgeNormal2D(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos));
        var ex_pos=new THREE.Vector3().addVectors(he.sym.face.dual_pos,l);
        ex_edge.face=he.sym.face;
        ex_edge.vector=l;
        ex_edge.hl_ID=he.id;
        this.external_dual_edge_map.push(ex_edge);
		he.sym.face.external_dual_edge.push(ex_edge); 

        if(ex_pos.x<this.dual_bound[0].x)
            this.dual_bound[0].x=ex_pos.x;
        else if(ex_pos.x>this.dual_bound[1].x)
            this.dual_bound[1].x=ex_pos.x;

        if(ex_pos.y<this.dual_bound[0].y)
            this.dual_bound[0].y=ex_pos.y;
        else if(ex_pos.y>this.dual_bound[1].y)
            this.dual_bound[1].y=ex_pos.y;

        if(ex_pos.z<this.dual_bound[0].z)
            this.dual_bound[0].z=ex_pos.z
        else if(ex_pos.z>this.dual_bound[1].z)
            this.dual_bound[1].z=ex_pos.z;
        this.dual_fixed_center.add(ex_pos);
		he=he.next;
	}while(he!=start);
}


