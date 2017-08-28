(function() {
    'use strict'
    //layout
    var views = [
    {
        left: 0,
        bottom: 0,
        width: 0.5,
        height: 1.0,

        // updated in window resize
        window: {
            left: 0,
            bottom: 0,
            width: 0.5,
            height: 1.0
        },

        // background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 )
        background: new THREE.Color().setRGB( 0.9, 0.9, 0.9 )
        // background: new THREE.Color().setRGB( 1, 1, 1 )
    },

    {
        left: 0.5,
        bottom: 0,
        width: 0.5,
        height: 1.0,

        // updated in window resize
        window: {
            left: 0,
            bottom: 0,
            width: 0.5,
            height: 1.0
        },

        // background: new THREE.Color().setRGB( 0.5, 0.5, 0.7 )
        background: new THREE.Color().setRGB( 0.9, 0.9, 0.9 )
        // background: new THREE.Color().setRGB( 1, 1, 1 )
    }
    ];
    var canvas;
    var result_viewer;
    var scene1,scene2;
    var camera;
    var renderer;


    var MaxForceLength=undefined;
    var MaxThickness=1;
    var datgui;
    var axis;
    var raycaster, mouseScene1, mouseScene2;
    var clicked=false, multFace=false,AllFace=false;
    var orbit;
    var guiList={
        LoadForceGeometry:undefined,
        LoadFormGeometry:undefined,
        Barycentric_Subdivision:undefined,
        Parameter:undefined,
        Export_Poly_Data: undefined
    };



    //Data
    var Import_Mesh_Type;
    var Force={
        diagram:new Mesh("Force"),
        scale:1,
        root: new THREE.Object3D(),
        Line_Render:new Array(),
        Face_Render:new Array(),
        Material:[
            //Edge 
            new THREE.LineBasicMaterial({
            color: 0x156289
            }),

            //Face
            new THREE.MeshBasicMaterial( { 
            color: 0x156289, 
            opacity: 0.1,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
            }),
        ]
    }
    var Form={
        diagram: new Mesh("Form"),
        scale:1,
        root: new THREE.Object3D(),
        Vert_Render: new Array(),
        Edge_Render: new Array(),
        Material:[
            //Internal edges
            new THREE.MeshBasicMaterial( { 
            color: 0x156289, 
            opacity: 0.6,
            transparent:true,
            side: THREE.DoubleSide,
            depthWrite: false
            }),

            //Fliped internal edges
            new THREE.MeshBasicMaterial( { 
            color: 0xFF0000, 
            opacity: 0.6,
            transparent:true,
            side: THREE.DoubleSide,
            depthWrite: false
            }),

            //External Edges
            new THREE.MeshBasicMaterial( { 
            color: 0x7FFF00, 
            opacity: 0.6,
            transparent:true,
            side: THREE.DoubleSide,
            depthWrite: false
            }),

            //Connected Boundary Edges
            new THREE.MeshBasicMaterial( { 
            color: 0xFFFFFF, 
            opacity: 0.6,
            transparent:true,
            side: THREE.DoubleSide,
            depthWrite: false
            }),

            //Vertex
            new THREE.MeshBasicMaterial( { 
            color: 0xEEC900, 
            })
        ]
    }
    var FormIntersected=null,ForceResponding=null;
    var ForceIntersected=[];
    var Force_Selected_Color=new THREE.Color(0xe46a6a);
    var Responding_Color=new THREE.Color(0xFFFFFF);
    // var Force,Form;
    
    // var Force_root;
    // var Form_root;
    // var Force_Line_Render=[];
    // var Force_Face_Render=[];
    // var Form_Vert_Render=[];
    // var Form_Edge_Render=[];

    
    // var FormIntersected=null,ForceResponding=null;
    // var ForceIntersected=null;
    // var Force_Material=[
    //     //Edge 
    //     new THREE.LineBasicMaterial({
    //     color: 0x156289
    //     }),

    //     //Face
    //     new THREE.MeshBasicMaterial( { 
    //     color: 0x156289, 
    //     opacity: 0.1,
    //     transparent: true,
    //     side: THREE.DoubleSide,
    //     depthWrite: false
    //     }),
    // ]

    // var Form_Material=[
    //     //Internal edges
    //     new THREE.MeshBasicMaterial( { 
    //     color: 0x156289, 
    //     opacity: 0.6,
    //     transparent:true,
    //     side: THREE.DoubleSide,
    //     depthWrite: false
    //     }),

    //     //Fliped internal edges
    //     new THREE.MeshBasicMaterial( { 
    //     color: 0xFF0000, 
    //     opacity: 0.6,
    //     transparent:true,
    //     side: THREE.DoubleSide,
    //     depthWrite: false
    //     }),

    //     //External Edges
    //     new THREE.MeshBasicMaterial( { 
    //     color: 0x7FFF00, 
    //     opacity: 0.6,
    //     transparent:true,
    //     side: THREE.DoubleSide,
    //     depthWrite: false
    //     }),

    //     //Connected Boundary Edges
    //     new THREE.MeshBasicMaterial( { 
    //     color: 0xFFFFFF, 
    //     opacity: 0.6,
    //     transparent:true,
    //     side: THREE.DoubleSide,
    //     depthWrite: false
    //     }),

    //     //Vertex
    //     new THREE.MeshBasicMaterial( { 
    //     color: 0xEEC900, 
    //     })
    // ]

    // var Force_scale=0;
    // var Form_scale=0;


    function readJson(event){
        'use strict'
        var files_list=event.target.files;
        var reader= new FileReader();
        var file=files_list[0];

        reader.readAsText(file, "UTF-8");
        reader.onload=buildMeshStructure;
    }
    function StoreData(){
        'use strict'
        localStorage.clear();
        if(!Force.diagram.half_finished && !Form.diagram.half_finished) {
            alert("No Poly data to be exported");
            return;
        }
        var form_v=new Array();
        var form_e=new Array();
        var force_v=new Array();
        var force_e=new Array();

        if(Form.diagram.half_finished){
            for(var i=0;i<Form.diagram.mesh_vertex.length;i++){
                var v_obj={
                    index:i,
                    x:Form.diagram.mesh_vertex[i].pos.x,
                    y:Form.diagram.mesh_vertex[i].pos.y,
                    z:Form.diagram.mesh_vertex[i].pos.z,
                }
                form_v.push(JSON.stringify(v_obj));
            }
            for(var i=0;i<Form.diagram.mesh_half_edge.length;i+=2){
                var e_obj={
                    index:i/2,
                    v1:Form.diagram.mesh_half_edge[i].sym.vert.id,
                    v2:Form.diagram.mesh_half_edge[i].vert.id,
                }
                form_e.push(JSON.stringify(e_obj));
            }
            localStorage.setItem("Form_Vertices",JSON.stringify(form_v));
            localStorage.setItem("Form_Edges",JSON.stringify(form_e));
        }
        else
            alert("No Form mesh is constructed");

        if(Force.diagram.half_finished){
            for(var i=0;i<Force.diagram.mesh_vertex.length;i++){
                var v_obj={
                    index:i,
                    x:Force.diagram.mesh_vertex[i].pos.x,
                    y:Force.diagram.mesh_vertex[i].pos.y,
                    z:Force.diagram.mesh_vertex[i].pos.z,
                }
                force_v.push(JSON.stringify(v_obj));
            }
            for(var i=0;i<Force.diagram.mesh_half_edge.length;i+=2){
                var e_obj={
                    index:i/2,
                    v1:Force.diagram.mesh_half_edge[i].sym.vert.id,
                    v2:Force.diagram.mesh_half_edge[i].vert.id,
                }
                force_e.push(JSON.stringify(e_obj));
            }
            localStorage.setItem("Force_Vertices",JSON.stringify(force_v));
            localStorage.setItem("Force_Edges",JSON.stringify(force_e));
        }
        else 
            alert("No Force mesh is constructed");
    }
    function doRayCast(){
        'use strict'
        var intersects;
        if ( mouseScene1.x >= 1 )
                ReleaseHighlight();
        else{
            raycaster.setFromCamera( mouseScene1, camera );
            intersects = raycaster.intersectObjects(Form.root.children, true );
            if(intersects.length>0){
                if(FormIntersected && FormIntersected!=intersects[0].object || !FormIntersected){
                    ReleaseHighlight();
                    FormIntersected=intersects[0].object;
                    FormIntersected.material.color=Responding_Color;
                    if(FormIntersected.type=="Form_Edge"){
                        if(FormIntersected.ForceEdgeID!=undefined){
                            var id=FormIntersected.ForceEdgeID;
                            ForceResponding=Force.Line_Render[id];
                            ForceResponding.material.color=Responding_Color;
                        }
                    }
                    else if(FormIntersected.type=="Form_Vert"){
                        if(FormIntersected.ForceFaceID!=undefined){
                            var id=FormIntersected.ForceFaceID;
                            ForceResponding=Force.Face_Render[id];
                            ForceResponding.material.color=Responding_Color;              
                        }
                    }
                }
            }
            else 
                ReleaseHighlight();
        }


        

        if(mouseScene2.x>-1){
            raycaster.setFromCamera( mouseScene2, camera);
            intersects = raycaster.intersectObjects(Force.root.children, true);
            if(clicked){
                if(intersects.length>0 && intersects[0].object.type=="Force_Face"){
                    if(AllFace){
                        SelectedAllForceFaces();
                    }
                    else{
                        var index=ForceIntersected.findIndex(function(x) { 
                        return (x==intersects[0].object.idx); 
                        });
                        if(index==-1){
                            if(!multFace) ReleaseForceSelected();
                            ForceIntersected.push(intersects[0].object.idx);
                            intersects[0].object.material.color=Force_Selected_Color;
                            intersects[0].object.base_color=Force_Selected_Color;
                        }
                        else if(ForceIntersected.length>1 && (!multFace)){
                            ReleaseForceSelected();
                            ForceIntersected.push(intersects[0].object.idx);
                            intersects[0].object.material.color=Force_Selected_Color;
                            intersects[0].object.base_color=Force_Selected_Color;
                        }                        

                    }

                }
                else
                    ReleaseForceSelected();
                clicked=false;
            }     
        }
        

    }
    function SelectedAllForceFaces(){
        ForceIntersected=[];
        for(var i=0;i<Force.Face_Render.length;i++){
            if(Force.Face_Render[i].idx==Force.diagram.external_face_ID)
                continue;
            ForceIntersected.push(Force.Face_Render[i].idx);
            Force.Face_Render[i].material.color=Force_Selected_Color;
            Force.Face_Render[i].base_color=Force_Selected_Color;
        }
    }
    function ReleaseForceSelected(){
        'use strict'
        if(ForceIntersected.length){
            for(var i=0;i<ForceIntersected.length;i++){
                Force.Face_Render[ForceIntersected[i]].material.color=Force.Material[1].color;
                Force.Face_Render[ForceIntersected[i]].base_color=Force.Material[1].color;
            }
            ForceIntersected=[];
        }
    }
    function ReleaseHighlight(){
        'use strict'
        if(FormIntersected){
            FormIntersected.material.color=FormIntersected.base_color;
            FormIntersected=null;
        }
        if(ForceResponding){
            ForceResponding.material.color=ForceResponding.base_color;
            ForceResponding=null;
        }
    }
    function DrawForce(){
        'use strict'

        if(scene2.children.length>0)
            scene2.remove(Force.root);
        Force.root=new THREE.Object3D();
        Force.Line_Render=[];
        Force.Face_Render=[];
        if(!Force.diagram.half_finished){
            alert("No Force mesh Geometry constructed");
            return;
        }

        var vert_Group=[];
        for(var v in Force.diagram.mesh_vertex){
            var vert=new THREE.Vector3().subVectors(Force.diagram.mesh_vertex[v].pos,Force.diagram.fixed_center);
            vert.multiplyScalar(Force.scale);
            vert_Group.push(vert);
        }
        for(var i=0;i<Force.diagram.mesh_half_edge.length;i+=2){
            var len=new THREE.Vector3().subVectors(Force.diagram.mesh_half_edge[i].sym.vert.pos,Force.diagram.mesh_half_edge[i].vert.pos).length();
            if(MaxForceLength==undefined || len>MaxForceLength)
                MaxForceLength=len;
            var force_line_geo=new THREE.Geometry();
            force_line_geo.vertices.push(new THREE.Vector3().copy(vert_Group[Force.diagram.mesh_half_edge[i].sym.vert.id]));
            force_line_geo.vertices.push(new THREE.Vector3().copy(vert_Group[Force.diagram.mesh_half_edge[i].vert.id]));
            Force.Line_Render[i/2]=new THREE.Line(force_line_geo,Force.Material[0].clone(),THREE.LineSegments);
            Force.Line_Render[i/2].type="Force_Edge";
            Force.Line_Render[i/2].idx=parseInt(i/2);
            Force.Line_Render[i/2].base_color=Force.Material[0].color;
            Force.Line_Render[i/2].FormEdgeID=undefined;
            if(Force.diagram.mesh_half_edge[i].Perpendicular_hl_ID!=undefined)
                Force.Line_Render[i/2].FormEdgeID=parseInt(Force.diagram.mesh_half_edge[i].Perpendicular_hl_ID/2);
            Force.root.add(Force.Line_Render[i/2]);
        }

        for(var f in Force.diagram.mesh_face){
            var force_face_geo=new THREE.Geometry();
            var idx=[];
            var he=Force.diagram.mesh_face[f].startedge;
            var count=0;
            do{
                force_face_geo.vertices.push(new THREE.Vector3().copy(vert_Group[he.vert.id]));
                idx.push(count);
                he=he.next;
                count++;
            }while(he!=Force.diagram.mesh_face[f].startedge)
            for(var i=1;i<idx.length-1;i++)
                force_face_geo.faces.push(new THREE.Face3(idx[0],idx[i],idx[i+1]));
            Force.Face_Render[f]=new THREE.Mesh(force_face_geo,Force.Material[1].clone());
            Force.Face_Render[f].type="Force_Face";
            Force.Face_Render[f].idx=f;
            Force.Face_Render[f].base_color=Force.Material[1].color;
            Force.Face_Render[f].FormVertID=Force.diagram.mesh_face[f].Form_Vert_ID;
            if(Force.diagram.mesh_face[f].id!=Force.diagram.external_face_ID)
                Force.root.add(Force.Face_Render[f]);
        }
        scene2.add(Force.root);
    }

    function DrawForm(){
        'use strict'
        if(scene1.children.length>0)
            scene1.remove(Form.root);
        Form.root=new THREE.Object3D();
        Form.Vert_Render=[];
        Form.Edge_Render=[];
        if(!Form.diagram.half_finished) {
            alert("No Form mesh Geometry constructed")
            return;
        }

        for(var i=0;i<Form.diagram.mesh_vertex.length;i++){
            var pos=new THREE.Vector3().subVectors(Form.diagram.mesh_vertex[i].pos,Form.diagram.fixed_center);
            pos.multiplyScalar(Form.scale);
            var r;
            if(Form.diagram.mesh_vertex[i].radius==undefined)
                r=guiList.Parameter.MaxThickness*1.25;
            else
                r=Form.diagram.mesh_vertex[i].radius/MaxForceLength*guiList.Parameter.MaxThickness*1.35;

            Form.Vert_Render[i]=createSphereMesh(pos,Form.Material[4].clone(),r);
            Form.Vert_Render[i].type="Form_Vert";
            Form.Vert_Render[i].idx=i;
            Form.Vert_Render[i].ForceFaceID=Form.diagram.mesh_vertex[i].Force_Face_ID;
            Form.Vert_Render[i].base_color=Form.Material[4].color;
            if(!Form.diagram.mesh_vertex[i].external)
                Form.root.add(Form.Vert_Render[i]);
        }

        for(var i=0;i<Form.diagram.mesh_half_edge.length;i+=2){
            var pos1= new THREE.Vector3().subVectors(Form.diagram.mesh_half_edge[i].vert.pos,Form.diagram.fixed_center);
            var pos2= new THREE.Vector3().subVectors(Form.diagram.mesh_half_edge[i].sym.vert.pos,Form.diagram.fixed_center);
            pos1.multiplyScalar(Form.scale);
            pos2.multiplyScalar(Form.scale);
            var thick;
            var material;
            if(Form.diagram.mesh_half_edge[i].connected){
                thick=0.5*guiList.Parameter.MaxThickness;
                material=Form.Material[3].clone();
                Form.Edge_Render[i/2]=createCylinderMesh(pos1,pos2,material,thick);
            }
            else{
                if(Force.diagram.half_finished){
                    var force_he=Force.diagram.mesh_half_edge[Form.diagram.mesh_half_edge[i].Perpendicular_hl_ID];
                    var len=new THREE.Vector3().subVectors(force_he.vert.pos,force_he.sym.vert.pos).length();
                    thick=len/MaxForceLength*guiList.Parameter.MaxThickness;
                }
                else
                    thick=0.5*guiList.Parameter.MaxThickness;

                if(Form.diagram.mesh_half_edge[i].external){
                    material=Form.Material[2].clone();
                    Form.Edge_Render[i/2]=createCylinderArrowMesh(pos1,pos2,material,thick);
                }
                else{
                    if(Force.diagram.dual_finished && Form.diagram.mesh_half_edge[i].fliped)
                        material=Form.Material[1].clone();
                    else
                        material=Form.Material[0].clone();
                    Form.Edge_Render[i/2]=createCylinderMesh(pos1,pos2,material,thick);
                }
            }
            Form.Edge_Render[i/2].type="Form_Edge";
            Form.Edge_Render[i/2].idx=parseInt(i/2);
            Form.Edge_Render[i/2].base_color=material.color;   
            Form.Edge_Render[i/2].ForceEdgeID=undefined;
            if(Form.diagram.mesh_half_edge[i].Perpendicular_hl_ID!=undefined)
                Form.Edge_Render[i/2].ForceEdgeID=parseInt(Form.diagram.mesh_half_edge[i].Perpendicular_hl_ID/2);
            if(!Form.diagram.mesh_half_edge[i].connected)
                Form.root.add(Form.Edge_Render[i/2]); 
        }
        scene1.add(Form.root);
    }

    function ReComputeMeshScale(){
        'use strict'
        if(Force.diagram.half_finished){
            var Force_range=new THREE.Vector3().subVectors(Force.diagram.bound[1],Force.diagram.bound[0]);
            var Force_aspect=views[1].window.width / views[1].window.height;
            if(Force_aspect<=1)
                Force.scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Force_range.length());
            else
                Force.scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Force_aspect*Force_range.length());
        }



        if(Form.diagram.half_finished){
            var Form_range=new THREE.Vector3().subVectors(Form.diagram.bound[1],Form.diagram.bound[0]);
            var Form_aspect=views[0].window.width / views[0].window.height;
            if(Form_aspect<=1)
                Form.scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Form_range.length());
            else
                Form.scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Form_aspect*Form_range.length());
        }
    }
    function buildMeshStructure(event){
        'use strict'
        //ReInitialize
        var json=JSON.parse(event.target.result);
        var mesh=Import_Mesh_Type=="Force"? Force.diagram:Form.diagram;
        var dual=Import_Mesh_Type=="Force"? Form.diagram:Force.diagram;
        var v=[],e=[];

       
        mesh.buildHalfEdgeStructure(json.vertices,json.edges);       
        mesh.find_2D_Nodes();
        mesh.Produce_dual_structure();
 

        if(mesh.dual_finished){
            for(var i=0;i<mesh.mesh_face.length;i++){
                if(i==mesh.external_face_ID) continue;
                    v.push([mesh.mesh_face[i].dual_pos.x,mesh.mesh_face[i].dual_pos.y,mesh.mesh_face[i].dual_pos.z]);
            }
            for(var i=0;i<mesh.internal_dual_edge_map.length;i++){
                var idx1=mesh.internal_dual_edge_map[i].f_p.x;
                var idx2=mesh.internal_dual_edge_map[i].f_p.y;
                if(idx1>mesh.external_face_ID)idx1--;
                if(idx2>mesh.external_face_ID)idx2--;
                e.push([idx1,idx2]);
            }
            for(var i=0;i<mesh.external_dual_edge_map.length;i++){
                var ex_edge=mesh.external_dual_edge_map[i];
                var idx1=ex_edge.face.id;
                var idx2=v.length;
                var endpos=new THREE.Vector3().addVectors(ex_edge.face.dual_pos,ex_edge.vector);
                if(idx1>mesh.external_face_ID) idx1--;
                v.push([endpos.x,endpos.y,endpos.z]);
                e.push([idx1,idx2]);

            }
            dual.buildHalfEdgeStructure(v,e);
            ConnectForceForm();
        }
        else
            dual.clear();
        ReComputeMeshScale();
        console.log(Force.diagram,Form.diagram);
        DrawForce();
        DrawForm();

        //Store the result
        StoreData();
    }

    function ConnectForceForm(){
        'use strict'

        //Build 
        var mesh,dual;
        if(Import_Mesh_Type=="Force"){
            for(var i=0;i<Force.diagram.mesh_face.length-1;i++){
                var id=i<Force.diagram.external_face_ID?i:i+1;
                Form.diagram.mesh_vertex[i].Force_Face_ID=id;
                Force.diagram.mesh_face[id].Form_Vert_ID=i;
            }
            mesh=Force.diagram;
            dual=Form.diagram;
        }
        else{
            for(var i=0;i<Form.diagram.node.length;i++){
                var v_arr=Form.diagram.node[i].Sort_Face_ID.slice(0);
                for(var j in v_arr)
                    if(v_arr[j]>Form.diagram.external_face_ID)
                        v_arr[j]--;
                var he=Force.diagram.mesh_vertex[v_arr[0]].edge;
                do{
                    var face=he.face;
                    var f_l=face.startedge;
                    var flag=true;
                    do{
                        var idx=v_arr.findIndex(function(x) { 
                        return (x==f_l.vert.id);});
                        if(idx==-1) {
                            flag=false;
                            break;
                        }
                        else f_l=f_l.next;
                    }while(f_l!=face.startedge);
                    if(!flag)
                        he=he.next.sym;
                    else{
                        Form.diagram.node[i].vert.Force_Face_ID=face.id;
                        face.Form_Vert_ID=Form.diagram.node[i].vert.id;
                        break;
                    }
                }while(he!=Force.diagram.mesh_vertex[v_arr[0]].edge)             
            }
            mesh=Form.diagram;
            dual=Force.diagram;
        }
        for(var i=0;i<mesh.internal_dual_edge_map.length;i++){
            var id=mesh.internal_dual_edge_map[i].hl_ID;
            dual.mesh_half_edge[2*i].Perpendicular_hl_ID=id;
            dual.mesh_half_edge[2*i].sym.Perpendicular_hl_ID=mesh.mesh_half_edge[id].sym.id;
            mesh.mesh_half_edge[id].Perpendicular_hl_ID=2*i;
            mesh.mesh_half_edge[id].sym.Perpendicular_hl_ID=dual.mesh_half_edge[2*i].sym.id;
            if(mesh.internal_dual_edge_map[i].length<0){
                dual.mesh_half_edge[2*i].fliped=true;
                dual.mesh_half_edge[2*i].sym.fliped=true;
            }
        }


        for(var i=0;i<mesh.external_dual_edge_map.length;i++){
            var id=mesh.external_dual_edge_map[i].hl_ID;
            var idx=2*(i+mesh.internal_dual_edge_map.length);
            dual.mesh_half_edge[idx].Perpendicular_hl_ID=id;
            dual.mesh_half_edge[idx].sym.Perpendicular_hl_ID=mesh.mesh_half_edge[id].sym.id;
            mesh.mesh_half_edge[id].Perpendicular_hl_ID=idx;
            mesh.mesh_half_edge[id].sym.Perpendicular_hl_ID=dual.mesh_half_edge[idx].sym.id;
        }


        for(var i=0;i<Form.diagram.mesh_vertex.length;i++){
            if(Form.diagram.mesh_vertex[i].Force_Face_ID!=undefined){
                var f=Force.diagram.mesh_face[Form.diagram.mesh_vertex[i].Force_Face_ID];
                var e=f.startedge;
                var maxthick=0;
                do{
                    var thick=new THREE.Vector3().subVectors(e.vert.pos,e.sym.vert.pos).length();
                    if(thick>maxthick)
                        maxthick=thick;
                    e=e.next;
                }while(e!=f.startedge)
                Form.diagram.mesh_vertex[i].radius=maxthick;
            }
        }
    }

    function Execute_Barycentric_Subdivision(){
        'use strict'
        if(ForceIntersected.length==0)
            return;
        var numl,numf,highlight_face_id;
        for(var j=0;j<ForceIntersected.length;j++){
            numl=Force.diagram.mesh_half_edge.length;
            numf=Force.diagram.mesh_face.length;
            highlight_face_id=ForceIntersected[j];
            Force.root.remove(Force.Face_Render[highlight_face_id]);
            BaryCentricSubdivision(Force.diagram,Form.diagram,highlight_face_id);
            
            //Change the rendering result of line;
            for(var i=numl;i<Force.diagram.mesh_half_edge.length;i+=2){
                var force_line=new THREE.Geometry();
                force_line.vertices.push(new THREE.Vector3().copy(Force.diagram.mesh_half_edge[i].sym.vert.pos),
                    new THREE.Vector3().copy(Force.diagram.mesh_half_edge[i].vert.pos));
                force_line.colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
                force_line.translate(-Force.diagram.fixed_center.x,-Force.diagram.fixed_center.y,-Force.diagram.fixed_center.z);   
                force_line.scale(Force.scale,Force.scale,Force.scale);

                Force.Line_Render[i/2]=new THREE.Line(force_line,Force.Material[0].clone(),THREE.LineSegments);
                Force.Line_Render[i/2].type="Force_Edge";
                Force.Line_Render[i/2].idx=parseInt(i/2);
                Force.Line_Render[i/2].base_color=Force.Material[0].color;
                Force.Line_Render[i/2].FormEdgeID=undefined;
                if(Force.diagram.mesh_half_edge[i].Perpendicular_hl_ID!=undefined)
                    Force.Line_Render[i/2].FormEdgeID=parseInt(Force.diagram.mesh_half_edge[i].Perpendicular_hl_ID/2);
                Force.root.add(Force.Line_Render[i/2]);
            }

            //Change the rendering result of faces
            var original_face=new THREE.Geometry();
            original_face.vertices.push(new THREE.Vector3().copy(Force.diagram.mesh_face[highlight_face_id].startedge.vert.pos),
                new THREE.Vector3().copy(Force.diagram.mesh_face[highlight_face_id].startedge.next.vert.pos),
                new THREE.Vector3().copy(Force.diagram.mesh_face[highlight_face_id].startedge.sym.vert.pos));
            original_face.translate(-Force.diagram.fixed_center.x,-Force.diagram.fixed_center.y,-Force.diagram.fixed_center.z); 
            original_face.scale(Force.scale,Force.scale,Force.scale);
            original_face.faces.push(new THREE.Face3(0,1,2));
            Force.Face_Render[highlight_face_id]=new THREE.Mesh(original_face,Force.Material[1].clone());
            Force.Face_Render[highlight_face_id].type="Force_Face";
            Force.Face_Render[highlight_face_id].idx=highlight_face_id;
            Force.Face_Render[highlight_face_id].material.color=Force_Selected_Color;
            Force.Face_Render[highlight_face_id].base_color=Force_Selected_Color;
            Force.Face_Render[highlight_face_id].FormVertID=Force.diagram.mesh_face[highlight_face_id].Form_Vert_ID;
            Force.root.add(Force.Face_Render[highlight_face_id]);


            //Produce new rendering faces
            for(var i=numf;i<Force.diagram.mesh_face.length;i++){
                var force_face=new THREE.Geometry();
                force_face.vertices.push(new THREE.Vector3().copy(Force.diagram.mesh_face[i].startedge.vert.pos),
                    new THREE.Vector3().copy(Force.diagram.mesh_face[i].startedge.next.vert.pos),
                    new THREE.Vector3().copy(Force.diagram.mesh_face[i].startedge.sym.vert.pos));
                force_face.translate(-Force.diagram.fixed_center.x,
                    -Force.diagram.fixed_center.y,
                    -Force.diagram.fixed_center.z); 
                force_face.scale(Force.scale,Force.scale,Force.scale);
                force_face.faces.push(new THREE.Face3(0,1,2));
                Force.Face_Render[i]=new THREE.Mesh(force_face,Force.Material[1].clone());
                Force.Face_Render[i].type="Force_Face";
                Force.Face_Render[i].idx=i;
                Force.Face_Render[i].base_color=Force.Material[1].color;
                Force.Face_Render[i].FormVertID=Force.diagram.mesh_face[i].Form_Vert_ID;
                Force.root.add(Force.Face_Render[i]);
            }
        }
        DrawForm();

        //Store the result
        StoreData();

    }
    function keyUp(event){
        'use strict'
        if(multFace) multFace=false;
        if(AllFace) AllFace=false;
    }
    function keyDown(event){
        'use strict'
        if(event.ctrlKey==1)
            multFace=true;
        if(event.shiftKey==1)
            AllFace=true;

    }
    function pick(){
        'use strict'
        doRayCast();
    }
    function onMouseMove( event ) {
        'use strict'
        event.preventDefault();
        mouseScene1.x = ( event.clientX / window.innerWidth * 2 ) * 2 - 1;
        mouseScene1.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        mouseScene2.x = mouseScene1.x - 2;
        mouseScene2.y = mouseScene1.y;
        //mousePositionDirty = true;
    }
    function onMouseDown(){
        clicked=true;
    }
    function viewResize(){
        'use strict'
        renderer.setSize(window.innerWidth, window.innerHeight);
        var view;
        for ( var ii = 0; ii < views.length; ++ii ) {
            view = views[ii];

            view.window.left   = Math.floor( window.innerWidth  * view.left );
            view.window.bottom = Math.floor( window.innerHeight * view.bottom );
            view.window.width  = Math.floor( window.innerWidth  * view.width );
            view.window.height = Math.floor( window.innerHeight * view.height );
        }

    }
    function animate(){
        'use strict'
        requestAnimationFrame( animate );
        render();
    }
    function render(){
        'use strict'      
        //pick();
        renderer.clear();
        pick();
        var view;
        for ( var ii = 0; ii < views.length; ++ii ) {
            view = views[ii];

            renderer.setViewport( view.window.left, view.window.bottom, view.window.width, view.window.height );
            renderer.setScissor( view.window.left, view.window.bottom, view.window.width, view.window.height );
            renderer.setScissorTest( true );
            renderer.setClearColor( view.background );
            camera.aspect = view.window.width / view.window.height;
            camera.updateProjectionMatrix();
            renderer.render( view.scene, camera );
            // outlineEffect.render( view.scene, camera );      
        }
    }
    window.onload = function(){
        'use strict'
        //Define event
        window.addEventListener('resize', viewResize, false);
        document.getElementById('files').addEventListener('change', readJson, false);
        document.addEventListener('keydown',keyDown,false);
        document.addEventListener('keyup',keyUp,false);

        //Assign value for varables
        canvas = document.getElementById('WebGl_Canvas');
        scene1=new THREE.Scene;
        scene2=new THREE.Scene;
        views[0].scene=scene1;
        views[1].scene=scene2;

        raycaster= new THREE.Raycaster();
        raycaster.linePrecision = 0.1;
        mouseScene1 = new THREE.Vector2();
        mouseScene2 = new THREE.Vector2();
        canvas.addEventListener('mousemove',  onMouseMove, false);
        canvas.addEventListener('click',  onMouseDown, false);

        camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 50000);
        renderer=new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setClearColor(new THREE.Color().setRGB( 0.9, 0.9, 0.9 ));
        renderer.setPixelRatio(window.devicePixelRatio);

        camera.position.x=0;
        camera.position.y=0;
        camera.position.z=100;

        orbit = new THREE.OrbitControls( camera, renderer.domElement);

        //Gui Initialization
        guiList.LoadForceGeometry={
            Load_Force_file: function(){
                Import_Mesh_Type="Force";
                 document.getElementById("files").click();
            }
        }
        guiList.LoadFormGeometry={
            Load_Form_file: function(){
                Import_Mesh_Type="Form";
                 document.getElementById("files").click();
            }
        }

        guiList.Barycentric_Subdivision={
            Barycentric_Subdiv: Execute_Barycentric_Subdivision
        }
        guiList.Parameter={
            MaxThickness:1
        }
        guiList.Export_Poly_Data={
            Export_Poly_Data:function(){
                window.open ('Poly_result.html');
            }
        }

        datgui=new dat.GUI();
        datgui.add(guiList.LoadForceGeometry,'Load_Force_file');
        datgui.add(guiList.LoadFormGeometry,'Load_Form_file');
        datgui.add(guiList.Barycentric_Subdivision,'Barycentric_Subdiv');
        var MaxController=datgui.add(guiList.Parameter,'MaxThickness',0.01,2,0.01);
        datgui.add(guiList.Export_Poly_Data,'Export_Poly_Data');

        MaxController.onChange(function(value) {
            if(Form.diagram.half_finished)
                DrawForm();
        });



        
        viewResize();
        animate();

    }
})();
    
