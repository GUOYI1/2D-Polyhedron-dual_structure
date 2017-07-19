//HalfEdge.js must be included
Mesh.prototype.BaryCentricSubdivision=function(f_id)
{

	if(f_id==this.external_face_ID) 
	{
		alert("Cannot Subdivide the External Face")
		return;
	}
	var start=this.mesh_face[f_id].startedge;
	var he=start;
	var edgeCount=0;
	var he_num=this.mesh_half_edge.length;
	var v_num=this.mesh_vertex.length;
	var f_num=this.mesh_face.length;

	var map_index=this.internal_dual_edge_direction_map.length;
	var original_direction_map_length=map_index;
	var original_dual_pos=this.mesh_face[f_id].dual_pos;

	var ex_scale=0;
	if(this.mesh_face[f_id].external_dual_edge.length>0)
		ex_scale=this.mesh_face[f_id].external_dual_edge[0].length();


	
	//Create a new node;
	var v= new Vertex(v_num);
	var center_node=new Node(this.node.length);
	center_node.vert=v;
	v.node=center_node;

	v_num++;
	v.pos=this.mesh_face[f_id].center_pos;
	this.mesh_vertex.push(v);


	//Update the halfEdge data Structure
	var head_he_start=new HalfEdge();
	var head_he=head_he_start;
	do
	{
		var temp=he.next;

		var new_he= new HalfEdge(he_num);
		var new_he_sym=undefined;
		if(temp.id==start.id)
		{
			new_he_sym=head_he_start;
			new_he_sym.id=he_num+1;
		}	
		else
			new_he_sym=new HalfEdge(he_num+1);
		//Set Vert
		new_he.vert=v;
		head_he.vert=he.sym.vert;

		new_he.next=head_he;
		head_he.next=he;
		he.next=new_he;

		new_he.sym=new_he_sym;
		new_he_sym.sym=new_he;

		//Produce new face
		var new_face=undefined;
		if(he.id==start.id)
			new_face=he.face;
		else
		{
			new_face=new Face(f_num);
			new_face.startedge=he;
			he.face=new_face;
			this.mesh_face.push(new_face);
			f_num++;
		}
		new_he.face=new_face;
		head_he.face=new_face;
		new_face.center_pos=new THREE.Vector3(he.vert.pos.x+he.sym.vert.pos.x+v.pos.x,
			he.vert.pos.y+he.sym.vert.pos.y+v.pos.y,
			he.vert.pos.z+he.sym.vert.pos.z+v.pos.z);
		new_face.center_pos.divideScalar(3);
		new_face.external_dual_edge=[];
		if(he.sym.face.id==this.external_face_ID)
		{
			var l=GetEdgeNormal2D(new THREE.Vector3().subVectors(he.sym.vert.pos,he.vert.pos));
			l.multiplyScalar(ex_scale);
			new_face.external_dual_edge.push(l);
		}

		this.mesh_half_edge.push(new_he);
		this.mesh_half_edge.push(new_he_sym);
		he_num+=2;
		he=temp;
		head_he=new_he_sym;
	}while(he!=start);
	v.edge=he.next;

	//Update the node information
	he=v.edge;
	do{
		//Update the center node
		center_node.Sort_Face_ID.push(he.sym.face.id);
		var node_face_pair_obj=new Node_Face_Pair;
		var reverse_face_pair_obj=new Node_Face_Pair;

	    node_face_pair_obj.f_p=new THREE.Vector2(he.sym.face.id,he.face.id); 		
	    reverse_face_pair_obj.f_p=new THREE.Vector2(he.face.id,he.sym.face.id);
	    
		var l=(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos));
		var dir=GetEdgeNormal2D(l);
		var thick=l.length();
		var sign=1;
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
		reverse_face_pair_obj.dual_edge_ID=map_index;
		map_index++;

		center_node.face_pair.push(node_face_pair_obj);
	

		
		//Update the old nodes;
		var n=he.sym.vert.node;
		if(n!=undefined)
		{
			var idx=n.Sort_Face_ID.findIndex(function(x) { 
	    		return (x==f_id); });
			
			var idx1=idx,idx2=idx;
			if(idx==0) 
			{
				idx1=n.face_pair.length;
				idx2=n.Sort_Face_ID.length;
			}
			n.face_pair[idx].f_p.x=he.sym.face.id;
			n.Sort_Face_ID[idx]=he.sym.face.id;
			if(he.sym.face.id!=f_id)
			{
				if(n.face_pair[idx].f_p.y>f_id)
					this.internal_dual_edge_direction_map[n.face_pair[idx].dual_edge_ID].direction_vector.multiplyScalar(-1);
				this.internal_dual_edge_direction_map[n.face_pair[idx].dual_edge_ID].f_p.x=n.face_pair[idx].f_p.y;
				this.internal_dual_edge_direction_map[n.face_pair[idx].dual_edge_ID].f_p.y=n.face_pair[idx].f_p.x;
				this.internal_dual_edge_length_map[n.face_pair[idx].dual_edge_ID].f_p.x=n.face_pair[idx].f_p.y;
				this.internal_dual_edge_length_map[n.face_pair[idx].dual_edge_ID].f_p.y=n.face_pair[idx].f_p.x;
			}
			n.face_pair[idx1-1].f_p.y=he.face.id;
			n.face_pair.splice(idx1,0,reverse_face_pair_obj);
			n.Sort_Face_ID.splice(idx2,0,he.face.id);
			if(he.face.id!=f_id)
			{
				if(n.face_pair[idx1-1].f_p.x>f_id)
					this.internal_dual_edge_direction_map[n.face_pair[idx1-1].dual_edge_ID].direction_vector.multiplyScalar(-1);
				this.internal_dual_edge_direction_map[n.face_pair[idx1-1].dual_edge_ID].f_p.x=n.face_pair[idx1-1].f_p.x;
				this.internal_dual_edge_direction_map[n.face_pair[idx1-1].dual_edge_ID].f_p.y=n.face_pair[idx1-1].f_p.y;
				this.internal_dual_edge_length_map[n.face_pair[idx1-1].dual_edge_ID].f_p.x=n.face_pair[idx1-1].f_p.x;
				this.internal_dual_edge_length_map[n.face_pair[idx1-1].dual_edge_ID].f_p.y=n.face_pair[idx1-1].f_p.y;
			}
		}
		he=he.next.sym;
	}while(he!=v.edge);
	this.node.push(center_node);


	//Compute dual pos for the new faces;
	he=this.mesh_face[f_id].startedge;
	var edge=new THREE.Vector3().subVectors(he.sym.vert.pos,he.vert.pos);
	var original_direction=GetEdgeNormal2D(edge);
	var perpendecular_dual_direciton=new THREE.Vector3().subVectors(he.next.vert.pos,he.next.sym.vert.pos);
	var dual_pos_start=new THREE.Vector3().addVectors(original_dual_pos,original_direction);
	var min_original_length=undefined;
	if(he.sym.face.id!=this.external_face_ID)
		min_original_length=(new THREE.Vector3().subVectors(he.sym.face.dual_pos,he.face.dual_pos)).length();

	var max_dual_length=1;
	this.mesh_face[f_id].dual_pos=dual_pos_start;
	he=he.next.sym.next;
	while(he!=this.mesh_face[f_id].startedge)
	{
		edge=new THREE.Vector3().subVectors(he.sym.vert.pos,he.vert.pos);
		var A1=perpendecular_dual_direciton.x;
		var B1=perpendecular_dual_direciton.y;
		var C1=-A1*dual_pos_start.x-B1*dual_pos_start.y;
		var A2=edge.x;
		var B2=edge.y;
		var C2=-A2*original_dual_pos.x-B2*original_dual_pos.y;
		solution=Line_intersection(A1,B1,C1,A2,B2,C2);
		dual_pos_start=new THREE.Vector3(solution[0],solution[1],0);
		perpendecular_dual_direciton=new THREE.Vector3().subVectors(he.next.vert.pos,he.next.sym.vert.pos);
		he.face.dual_pos=dual_pos_start;
		//update the min_original_length and max_dual_length
		var length1=undefined,length2=undefined;
		if(he.sym.face.id!=this.external_face_ID)
			length1=(new THREE.Vector3().subVectors(he.sym.face.dual_pos,original_dual_pos)).length();
		length2=(new THREE.Vector3().subVectors(dual_pos_start,original_dual_pos)).length();
		if(length1!=undefined)
		{
			if(min_original_length==undefined || length1<min_original_length)
				min_original_length=length1;
		}
		if(length2>max_dual_length)
			max_dual_length=length2;
		he=he.next.sym.next;
	}

	//Rescale the dual pos of new faces
	if(min_original_length==undefined) min_original_length=ex_scale;
	var scale=min_original_length/(3*max_dual_length);
	console.log(scale);
	do
	{
		he.face.dual_pos.x=original_dual_pos.x+(he.face.dual_pos.x-original_dual_pos.x)*scale;
		he.face.dual_pos.y=original_dual_pos.y+(he.face.dual_pos.y-original_dual_pos.y)*scale;
		he.face.dual_pos.z=original_dual_pos.z+(he.face.dual_pos.z-original_dual_pos.z)*scale;
		he=he.next.sym.next;
	}while(he!=this.mesh_face[f_id].startedge);


	for(var i=original_direction_map_length;i<map_index;i++)
	{
		var length_map_obj=new Length_Map_Obj();
		length_map_obj.id=i;
		length_map_obj.f_p=new THREE.Vector2(this.internal_dual_edge_direction_map[i].f_p.x,
										this.internal_dual_edge_direction_map[i].f_p.y);
		var p1=this.mesh_face[length_map_obj.f_p.x].dual_pos;
		var p2=this.mesh_face[length_map_obj.f_p.y].dual_pos;

		length_map_obj.length=(new THREE.Vector3().subVectors(p2,p1)).length();
		this.internal_dual_edge_length_map.push(length_map_obj);
	}

}