//HalfEdge.js must be included
BaryCentricSubdivision=function(ForceMesh,FormMesh,f_id)
{
	//Subdivide ForceMesh and update the FormMesh
	if(!ForceMesh.half_finished || !FormMesh.half_finished){
		alert("HalfEdge structure is unfinished.Subdivision is not approved");
		return;
	}
	if(f_id==ForceMesh.external_face_ID) 
	{
		alert("Cannot Subdivide the External Face")
		return;
	}
	var start=ForceMesh.mesh_face[f_id].startedge;
	var he=start;
	var Force_he_num=ForceMesh.mesh_half_edge.length;
	var Force_v_num=ForceMesh.mesh_vertex.length;
	var Force_f_num=ForceMesh.mesh_face.length;
	var Form_he_num=FormMesh.mesh_half_edge.length;
	var Form_v_num=FormMesh.mesh_vertex.length;
	var ex_group=ForceMesh.mesh_face[f_id].external_dual_edge;	

	/********************Update ForceMesh*************************/ 
	//Create a new node;
	var v= new Vertex(Force_v_num);
	Force_v_num++;
	v.pos=ForceMesh.mesh_face[f_id].center_pos;
	ForceMesh.mesh_vertex.push(v);


	//Update the ForceMesh halfEdge data Structure
	var head_he_start=new HalfEdge();
	var head_he=head_he_start;
	do
	{
		var temp=he.next;

		var new_he= new HalfEdge(Force_he_num);
		var new_he_sym=undefined;
		if(temp.id==start.id)
		{
			new_he_sym=head_he_start;
			new_he_sym.id=Force_he_num+1;
		}	
		else
			new_he_sym=new HalfEdge(Force_he_num+1);
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
			new_face=new Face(Force_f_num);
			new_face.startedge=he;
			he.face=new_face;
			ForceMesh.mesh_face.push(new_face);
			Force_f_num++;
		}
		new_he.face=new_face;
		head_he.face=new_face;
		new_face.center_pos=new THREE.Vector3(he.vert.pos.x+he.sym.vert.pos.x+v.pos.x,
			he.vert.pos.y+he.sym.vert.pos.y+v.pos.y,
			he.vert.pos.z+he.sym.vert.pos.z+v.pos.z);
		new_face.center_pos.divideScalar(3);
		new_face.external_dual_edge=[];
		for(var i=0;i<ex_group.length;i++){
			if(ex_group[i].hl_ID==he.sym.id){
				ex_group[i].face=new_face;
				new_face.external_dual_edge.push(ex_group[i]);
			}
		}

		ForceMesh.mesh_half_edge.push(new_he);
		ForceMesh.mesh_half_edge.push(new_he_sym);
		Force_he_num+=2;
		he=temp;
		head_he=new_he_sym;
	}while(he!=start);
	v.edge=he.next;


	/********************Update FormMesh*************************/ 
	var form_e=FormMesh.mesh_half_edge[he.Perpendicular_hl_ID]
	var original_form_pos=new THREE.Vector3().copy(form_e.vert.pos);
	var original_direction=new THREE.Vector3().subVectors(form_e.sym.vert.pos,original_form_pos).normalize();

	var min_origin_length=new THREE.Vector3().subVectors(form_e.sym.vert.pos,original_form_pos).length();
	if(ex_group.length!=0) min_origin_length=ex_group[0].vector.length();
	var max_dual_length=1;

	var new_form_face=new Face(FormMesh.mesh_face.length);
	form_e.vert.pos=new THREE.Vector3().addVectors(original_form_pos,original_direction);
	form_e.vert.edge=form_e;
	var first_new_he=undefined,end_new_he=undefined;

	do{
		var next_he=he.next.sym.next;
		var next_form_e=FormMesh.mesh_half_edge[next_he.Perpendicular_hl_ID];
		var new_v=new Vertex(Form_v_num);
		var new_he=new HalfEdge(Form_he_num);
		var new_he_sym=new HalfEdge(Form_he_num+1);

		if(next_he.id!=start.id){
			//Compute intersection
			var perpen1=new THREE.Vector3().subVectors(he.next.vert.pos,he.next.sym.vert.pos);
			var perpen2=new THREE.Vector3().subVectors(next_he.vert.pos,next_he.sym.vert.pos);
			var A1=perpen1.x;
			var B1=perpen1.y;
			var A2=perpen2.x;
			var B2=perpen2.y;
			var C1=-A1*form_e.vert.pos.x-B1*form_e.vert.pos.y;
			var C2=-A2*original_form_pos.x-B2*original_form_pos.y;
			solution=Line_intersection_2D(A1,B1,C1,A2,B2,C2);
			new_v.pos=new THREE.Vector3(solution[0],solution[1],0);
			new_v.Force_Face_ID=next_he.face.id;
			next_he.face.Form_Vert_ID=new_v.id;
			new_v.edge=new_he;
			next_form_e.vert=new_v;
			FormMesh.mesh_vertex.push(new_v);
			Form_v_num++;
		}
		else
			new_v=next_form_e.vert;

		//Update the halfedge of FormMesh

		new_he.vert=new_v;
		new_he.face=new_form_face;
		new_he.Perpendicular_hl_ID=he.next.sym.id;
		he.next.sym.Perpendicular_hl_ID=new_he.id;

		new_he_sym.vert=form_e.vert;
		new_he_sym.face=form_e.sym.face;
		new_he_sym.Perpendicular_hl_ID=he.next.id;
		he.next.Perpendicular_hl_ID=new_he_sym.id;
		new_he_sym.next=form_e.sym;

		next_form_e.next=new_he_sym;

		new_he.sym=new_he_sym;
		new_he_sym.sym=new_he;
		FormMesh.mesh_half_edge.push(new_he);
		FormMesh.mesh_half_edge.push(new_he_sym);	
		Form_he_num+=2;
		if(first_new_he==undefined) first_new_he=new_he;
		else
			end_new_he.next=new_he;
		end_new_he=new_he;

		//Update the min and max length;
		var length1=new THREE.Vector3().subVectors(form_e.sym.vert.pos,original_form_pos).length();
		if(length1<min_origin_length) min_origin_length=length1;
		var length2=new THREE.Vector3().subVectors(new_v.pos,original_form_pos).length();
		if(length2>max_dual_length) max_dual_length=length2;

		he=next_he;
		form_e=next_form_e;		
	}while(he!=start);
	end_new_he.next=first_new_he;
	var scale=min_origin_length/(3*max_dual_length);
	new_form_face.startedge=first_new_he;
	new_form_face.center_pos=original_form_pos;
	FormMesh.mesh_face.push(new_form_face);
	form_e=first_new_he;
	do{
		form_e.vert.pos=new THREE.Vector3().addVectors(form_e.vert.pos.multiplyScalar(scale),
			new THREE.Vector3().addScaledVector(original_form_pos,1-scale));
		if(form_e.next.sym.next.external)
			form_e.next.sym.next.vert.pos.add(new THREE.Vector3().subVectors(form_e.vert.pos,original_form_pos));
		form_e=form_e.next;

	}while(form_e!=first_new_he);

	/********************Update dual structure*************************/ 
	
	if(ForceMesh.dual_finished){
		var map_index=ForceMesh.internal_dual_edge_map.length;
		var center_node=new Node(ForceMesh.node.length);
		center_node.vert=v;
		v.node=center_node;
		ForceMesh.node.push(center_node);
		he=v.edge;
		do{
			//Update the center node
			center_node.Sort_Face_ID.push(he.sym.face.id);
			he.sym.face.dual_pos=FormMesh.mesh_vertex[he.sym.face.Form_Vert_ID].pos;
			var node_face_pair_obj=new Node_Face_Pair;
			var reverse_face_pair_obj=new Node_Face_Pair;

			node_face_pair_obj.f_p=new THREE.Vector2(he.sym.face.id,he.face.id); 		
			reverse_face_pair_obj.f_p=new THREE.Vector2(he.face.id,he.sym.face.id);
			var in_edge_obj=new Internal_Dual_Edge_Obj();	
			var sign=1;	    
			if(node_face_pair_obj.f_p.y>node_face_pair_obj.f_p.x)
				in_edge_obj.f_p=new THREE.Vector2(node_face_pair_obj.f_p.x,node_face_pair_obj.f_p.y);	
			else{
				sign=-1;
				in_edge_obj.f_p=new THREE.Vector2(node_face_pair_obj.f_p.y,node_face_pair_obj.f_p.x);
			}
			var startPos=FormMesh.mesh_vertex[ForceMesh.mesh_face[in_edge_obj.f_p.x].Form_Vert_ID].pos;
			var endPos=FormMesh.mesh_vertex[ForceMesh.mesh_face[in_edge_obj.f_p.y].Form_Vert_ID].pos;
			var dir=new THREE.Vector3().subVectors(endPos,startPos);
			in_edge_obj.length=dir.length();
			in_edge_obj.direction_vector=dir.normalize();
			in_edge_obj.id=map_index;
			if(sign==1) in_edge_obj.hl_ID=he.id;
			else in_edge_obj.hl_ID=he.sym.id;
			ForceMesh.internal_dual_edge_map.push(in_edge_obj);
			node_face_pair_obj.dual_edge_ID=map_index;
			reverse_face_pair_obj.dual_edge_ID=map_index;
			center_node.face_pair.push(node_face_pair_obj);
			map_index++;
			
			//Update the old nodes;
			var n=he.sym.vert.node;
			if(n!=undefined)
			{
				var idx=n.Sort_Face_ID.findIndex(function(x) { 
					return (x==f_id); });
				
				var idx1=idx;
				if(idx==0) 
					idx1=n.face_pair.length;
				n.face_pair[idx].f_p.x=he.sym.face.id;
				n.Sort_Face_ID[idx]=he.sym.face.id;
				ForceMesh.internal_dual_edge_map[n.face_pair[idx].dual_edge_ID].length-=(new THREE.Vector3().subVectors(
					startPos,original_form_pos).length());
				if(he.sym.face.id!=f_id)
				{
					if(n.face_pair[idx].f_p.y>f_id)
						ForceMesh.internal_dual_edge_map[n.face_pair[idx].dual_edge_ID].direction_vector.multiplyScalar(-1);
					ForceMesh.internal_dual_edge_map[n.face_pair[idx].dual_edge_ID].f_p.x=n.face_pair[idx].f_p.y;
					ForceMesh.internal_dual_edge_map[n.face_pair[idx].dual_edge_ID].f_p.y=n.face_pair[idx].f_p.x;
				}
				n.face_pair[idx1-1].f_p.y=he.face.id;
				n.face_pair.splice(idx1,0,reverse_face_pair_obj);
				n.Sort_Face_ID.splice(idx1,0,he.face.id);
				ForceMesh.internal_dual_edge_map[n.face_pair[idx1-1].dual_edge_ID].length-=(new THREE.Vector3().subVectors(
					endPos,original_form_pos).length());
				if(he.face.id!=f_id)
				{
					if(n.face_pair[idx1-1].f_p.x>f_id)
						ForceMesh.internal_dual_edge_map[n.face_pair[idx1-1].dual_edge_ID].direction_vector.multiplyScalar(-1);
					ForceMesh.internal_dual_edge_map[n.face_pair[idx1-1].dual_edge_ID].f_p.x=n.face_pair[idx1-1].f_p.x;
					ForceMesh.internal_dual_edge_map[n.face_pair[idx1-1].dual_edge_ID].f_p.y=n.face_pair[idx1-1].f_p.y;
				}

			}
			he=he.next.sym;
		}while(he!=v.edge);	
	}
	else if(FormMesh.dual_finished){
		new_form_face.dual_pos=v.pos;
		do{
			var n=form_e.vert.node;
			if(n==undefined){
				n=new Node(FormMesh.node.length);
				n.vert=form_e.vert;
				FormMesh.node.push(n);
			}
			else{
				n.Sort_Face_ID=[];
				n.face_pair=[];
			}
			var sign=1;
			var temp_he=n.vert.edge;
			map_index=FormMesh.internal_dual_edge_map.length;
			do
			{
				n.Sort_Face_ID.push(temp_he.sym.face.id); 
				var node_face_pair_obj=new Node_Face_Pair();
				node_face_pair_obj.f_p=new THREE.Vector2(temp_he.sym.face.id,temp_he.face.id);	
				var index=FormMesh.internal_dual_edge_map.findIndex(function(x) { 
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
					var l=(new THREE.Vector3().subVectors(temp_he.vert.pos,temp_he.sym.vert.pos));
					var dir=GetEdgeNormal2D(l).multiplyScalar(sign);
					in_edge_obj.direction_vector=dir;
					in_edge_obj.id=map_index;
					in_edge_obj.length=new THREE.Vector3().subVectors(temp_he.face.dual_pos,temp_he.sym.face.dual_pos).length();
					if(sign==-1) in_edge_obj.hl_ID=temp_he.id;
					else in_edge_obj.hl_ID=temp_he.sym.id;              
					FormMesh.internal_dual_edge_map.push(in_edge_obj);
					node_face_pair_obj.dual_edge_ID=map_index;
					map_index++;
				}
				else
					node_face_pair_obj.dual_edge_ID=index;
				n.face_pair.push(node_face_pair_obj);
				temp_he=temp_he.next.sym;
			}while(temp_he!=n.vert.edge)

			form_e=form_e.next;
		}while(form_e!=first_new_he)
	}

}