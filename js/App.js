(function() {
    'use strict'

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
    var canvas,idx_canvas;
    var result_viewer;
    var scene1,scene2;
    var camera;
    var renderer;
    //view1
    var Force,Form;
    var Import_Mesh_Type;
    var Force_root;
    var Form_root;
    var Force_Line_Render=[];
    var Force_Face_Render=[];
    var LineRenderMaterial= new THREE.LineBasicMaterial({
        vertexColors: true
      });
    var Form_Line_Render=[];
    var FaceRenderMaterial=new THREE.MeshBasicMaterial( { 
        color: 0xe46a6a, 
        opacity: 0.1,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    })
    var PointRenderMaterial=new THREE.PointsMaterial( { 
        size: 8, 
        sizeAttenuation: false,
        color: 0xFF0000 });
    var datgui;
    var axis;
    var Mouse1,Mouse2;
    var orbit;
    var guiList={
        LoadForceGeometry:undefined,
        LoadFormGeometry:undefined,
        Barycentric_Subdivision:undefined,
        Export_Poly_Data: undefined
    };
    var highlight_edge=undefined;
    var highlight_point=undefined;
    var highlight_edge_id=undefined;
    var highlight_face_id=undefined;
    var highlight_point_id=undefined;

    var Force_scale=0;
    var Form_scale=0;


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
        if(!Force.half_finished && !Form.half_finished) {
            alert("No Poly data to be exported");
            return;
        }
        var form_v=new Array();
        var form_e=new Array();
        var force_v=new Array();
        var force_e=new Array();

        if(Form.half_finished){
            for(var i=0;i<Form.mesh_vertex.length;i++){
                var v_obj={
                    index:i,
                    x:Form.mesh_vertex[i].pos.x,
                    y:Form.mesh_vertex[i].pos.y,
                    z:Form.mesh_vertex[i].pos.z,
                }
                form_v.push(JSON.stringify(v_obj));
            }
            for(var i=0;i<Form.mesh_half_edge.length;i+=2){
                var e_obj={
                    index:i/2,
                    v1:Form.mesh_half_edge[i].sym.vert.id,
                    v2:Form.mesh_half_edge[i].vert.id,
                }
                form_e.push(JSON.stringify(e_obj));
            }
            localStorage.setItem("Form_Vertices",JSON.stringify(form_v));
            localStorage.setItem("Form_Edges",JSON.stringify(form_e));
        }
        else
            alert("No Form is constructed");

        if(Force.half_finished){
            for(var i=0;i<Force.mesh_vertex.length;i++){
                var v_obj={
                    index:i,
                    x:Force.mesh_vertex[i].pos.x,
                    y:Force.mesh_vertex[i].pos.y,
                    z:Force.mesh_vertex[i].pos.z,
                }
                force_v.push(JSON.stringify(v_obj));
            }
            for(var i=0;i<Force.mesh_half_edge.length;i+=2){
                var e_obj={
                    index:i/2,
                    v1:Force.mesh_half_edge[i].sym.vert.id,
                    v2:Force.mesh_half_edge[i].vert.id,
                }
                force_e.push(JSON.stringify(e_obj));
            }
            localStorage.setItem("Force_Vertices",JSON.stringify(force_v));
            localStorage.setItem("Force_Edges",JSON.stringify(force_e));
        }
        else 
            alert("No Force is constructed");
    }

    function DrawForce(){
        'use strict'
        // for(int i=0;i<Force_root.children.length;i++){
        //     Force_root.remove(Force_root.children[i]);
        // }
        if(scene2.children.length>0)
            scene2.remove(Force_root);
        Force_root=new THREE.Object3D();
        Force_Line_Render=[];
        Force_Face_Render=[];
        if(!Force.half_finished){
            alert("No Force Geometry constructed");
            return;
        }

        var vert_Group=[];
        for(var v in Force.mesh_vertex){
            var vert=new THREE.Vector3().subVectors(Force.mesh_vertex[v].pos,Force.fixed_center);
            vert.multiplyScalar(Force_scale);
            vert_Group.push(vert);
        }
        for(var i=0;i<Force.mesh_half_edge.length;i+=2){
            var force_line_geo=new THREE.Geometry();
            force_line_geo.vertices.push(new THREE.Vector3().copy(vert_Group[Force.mesh_half_edge[i].sym.vert.id]));
            force_line_geo.vertices.push(new THREE.Vector3().copy(vert_Group[Force.mesh_half_edge[i].vert.id]));
            if(Force.mesh_half_edge[i].external){
                if(Force.mesh_half_edge[i].connected)
                    force_line_geo.colors.push(new THREE.Color( 0xFFFFFF ),new THREE.Color( 0xFFFFFF ));
                else
                    force_line_geo.colors.push(new THREE.Color( 0x7FFF00 ),new THREE.Color( 0x7FFF00 ));
            }
            else 
                force_line_geo.colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            Force_Line_Render[i/2]=new THREE.Line(force_line_geo,LineRenderMaterial,THREE.LineSegments);
            Force_root.add(Force_Line_Render[i/2]);
        }

        for(var f in Force.mesh_face){
            var force_face_geo=new THREE.Geometry();
            var idx=[];
            var he=Force.mesh_face[f].startedge;
            var count=0;
            do{
                force_face_geo.vertices.push(new THREE.Vector3().copy(vert_Group[he.vert.id]));
                idx.push(count);
                he=he.next;
                count++;
            }while(he!=Force.mesh_face[f].startedge)
            for(var i=1;i<idx.length-1;i++)
                force_face_geo.faces.push(new THREE.Face3(idx[0],idx[i],idx[i+1]));
            Force_Face_Render[f]=new THREE.Mesh(force_face_geo,FaceRenderMaterial);
        }
        scene2.add(Force_root);
    }

    function DrawForm(){
        'use strict'
        if(scene1.children.length>0)
            scene1.remove(Form_root);
        Form_root=new THREE.Object3D();
        Form_Line_Render=[];
        if(!Form.half_finished) {
            alert("No Form Geometry constructed")
            return;
        }
        for(var i=0;i<Form.mesh_half_edge.length;i+=2){
            var form_line_geo=new THREE.Geometry();
            form_line_geo=new THREE.Geometry();
            form_line_geo.vertices.push(new THREE.Vector3().copy(Form.mesh_half_edge[i].vert.pos));
            form_line_geo.vertices.push(new THREE.Vector3().copy(Form.mesh_half_edge[i].sym.vert.pos));
            if(Form.mesh_half_edge[i].connected)
                form_line_geo.colors.push(new THREE.Color( 0xFFFFFF ),new THREE.Color( 0xFFFFFF ));
            else if(Form.mesh_half_edge[i].external)
                form_line_geo.colors.push(new THREE.Color( 0x7FFF00 ),new THREE.Color( 0x7FFF00 ));
            else 
                form_line_geo.colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            form_line_geo.translate(-Form.fixed_center.x,-Form.fixed_center.y,-Form.fixed_center.z);   
            form_line_geo.scale(Form_scale,Form_scale,Form_scale);
            Form_Line_Render[i/2]=new THREE.Line(form_line_geo,LineRenderMaterial,THREE.LineSegments);
            Form_root.add(Form_Line_Render[i/2]);    
        }
        scene1.add(Form_root);
    }

    function ReComputeMeshScale(){
        'use strict'
        if(Force.half_finished){
            var Force_range=new THREE.Vector3().subVectors(Force.bound[1],Force.bound[0]);
            var Force_aspect=views[1].window.width / views[1].window.height;
            if(Force_aspect<=1)
                Force_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Force_range.length());
            else
                Force_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Force_aspect*Force_range.length());
        }
        if(Form.half_finished){
            var Form_range=new THREE.Vector3().subVectors(Form.bound[1],Form.bound[0]);
            var Form_aspect=views[0].window.width / views[0].window.height;
            if(Form_aspect<=1)
                Form_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Form_range.length());
            else
                Form_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*Form_aspect*Form_range.length());
        }
    }
    function buildMeshStructure(event){
        'use strict'
        //ReInitialize
        var json=JSON.parse(event.target.result);
        var mesh=Import_Mesh_Type=="Force"? Force:Form;
        var dual=Import_Mesh_Type=="Force"? Form:Force;
        var v=[],e=[];

        highlight_edge=undefined;
        highlight_point=undefined;

        highlight_edge_id=undefined;
        highlight_face_id=undefined;
        highlight_point_id=undefined;

       
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
        console.log(Force,Form);
        DrawForce();
        DrawForm();

        if(Force.half_finished)
        {
            highlight_edge_id=0;
            var highlight_edge_geo=new THREE.Geometry();
            var highlight_point_geo=new THREE.Geometry();
            highlight_edge_geo.vertices.push(
                (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].sym.vert.pos,Force.fixed_center)).multiplyScalar(Force_scale),
                (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos,Force.fixed_center)).multiplyScalar(Force_scale));
            highlight_edge_geo.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000));
            highlight_point_geo.vertices.push(new THREE.Vector3(0,0,0));
            highlight_edge=new THREE.Line(highlight_edge_geo,LineRenderMaterial,THREE.LineSegments);
            highlight_point=new THREE.Points(highlight_point_geo,PointRenderMaterial);
            Force_root.add(highlight_edge);
        }

        //Store the result
        StoreData();
    }

    function ConnectForceForm(){
        var mesh,dual;
        if(Import_Mesh_Type=="Force"){
            for(var i=0;i<Force.mesh_face.length-1;i++){
                var id=i<Force.external_face_ID?i:i+1;
                Form.mesh_vertex[i].Force_Face_ID=id;
                Force.mesh_face[id].Form_Vert_ID=i;
            }
            mesh=Force;
            dual=Form;
        }
        else{
            for(var i=0;i<Form.node.length;i++){
                var v_arr=Form.node[i].Sort_Face_ID.slice(0);
                for(var j in v_arr)
                    if(v_arr[j]>Form.external_face_ID)
                        v_arr[j]--;
                var he=Force.mesh_vertex[v_arr[0]].edge;
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
                        Form.node[i].vert.Force_Face_ID=face.id;
                        face.Form_Vert_ID=Form.node[i].vert.id;
                        break;
                    }
                }while(he!=Force.mesh_vertex[v_arr[0]].edge)             
            }
            mesh=Form;
            dual=Force;
        }
        for(var i=0;i<mesh.internal_dual_edge_map.length;i++){
            var id=mesh.internal_dual_edge_map[i].hl_ID;
            dual.mesh_half_edge[2*i].Perpendicular_hl_ID=id;
            dual.mesh_half_edge[2*i].sym.Perpendicular_hl_ID=mesh.mesh_half_edge[id].sym.id;
            mesh.mesh_half_edge[id].Perpendicular_hl_ID=2*i;
            mesh.mesh_half_edge[id].sym.Perpendicular_hl_ID=dual.mesh_half_edge[2*i].sym.id;
        }
        for(var i=0;i<mesh.external_dual_edge_map.length;i++){
            var id=mesh.external_dual_edge_map[i].hl_ID;
            var idx=2*(i+mesh.internal_dual_edge_map.length);
            dual.mesh_half_edge[idx].Perpendicular_hl_ID=id;
            dual.mesh_half_edge[idx].sym.Perpendicular_hl_ID=mesh.mesh_half_edge[id].sym.id;
            mesh.mesh_half_edge[id].Perpendicular_hl_ID=idx;
            mesh.mesh_half_edge[id].sym.Perpendicular_hl_ID=dual.mesh_half_edge[idx].sym.id;
        }
    }

    function Execute_Barycentric_Subdivision(){
        'use strict'
        if(highlight_face_id==undefined)
            return;
        var num=Force.mesh_half_edge.length;
        var numf=Force.mesh_face.length;
        var RenderLNum=Force_Line_Render.length;
        var RenderFNum=Force_Face_Render.length;

        BaryCentricSubdivision(Force,Form,highlight_face_id);
        Force_root.remove(Force_Face_Render[highlight_face_id]);
        //scene2.remove(Force_Face_Render[highlight_face_id]);//Do this to make sure the hightlight elements are the last to be rendered.

        //Change the rendering result of line;
        for(var i=num;i<Force.mesh_half_edge.length;i+=2){
            var force_line=new THREE.Geometry();
            force_line.vertices.push(new THREE.Vector3().copy(Force.mesh_half_edge[i].sym.vert.pos),
                new THREE.Vector3().copy(Force.mesh_half_edge[i].vert.pos));
            force_line.colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            force_line.translate(-Force.fixed_center.x,-Force.fixed_center.y,-Force.fixed_center.z);   
            force_line.scale(Force_scale,Force_scale,Force_scale);

            Force_Line_Render[RenderLNum]=new THREE.Line(force_line,LineRenderMaterial,THREE.LineSegments);
            Force_root.add(Force_Line_Render[RenderLNum]);
            RenderLNum++;
        }

        //Change the rendering result of faces
        var original_face=new THREE.Geometry();
        original_face.vertices.push(new THREE.Vector3().copy(Force.mesh_face[highlight_face_id].startedge.vert.pos),
            new THREE.Vector3().copy(Force.mesh_face[highlight_face_id].startedge.next.vert.pos),
            new THREE.Vector3().copy(Force.mesh_face[highlight_face_id].startedge.sym.vert.pos));
        original_face.translate(-Force.fixed_center.x,-Force.fixed_center.y,-Force.fixed_center.z); 
        original_face.scale(Force_scale,Force_scale,Force_scale);
        original_face.faces.push(new THREE.Face3(0,1,2));
        Force_Face_Render[highlight_face_id]=new THREE.Mesh(original_face,FaceRenderMaterial);

        //Produce new rendering faces
        for(var i=numf;i<Force.mesh_face.length;i++){
            var force_face=new THREE.Geometry();
            force_face.vertices.push(new THREE.Vector3().copy(Force.mesh_face[i].startedge.vert.pos),
                new THREE.Vector3().copy(Force.mesh_face[i].startedge.next.vert.pos),
                new THREE.Vector3().copy(Force.mesh_face[i].startedge.sym.vert.pos));
            force_face.translate(-Force.fixed_center.x,
                -Force.fixed_center.y,
                -Force.fixed_center.z); 
            force_face.scale(Force_scale,Force_scale,Force_scale);
            force_face.faces.push(new THREE.Face3(0,1,2));
            Force_Face_Render[i]=new THREE.Mesh(force_face,FaceRenderMaterial);
        }

        var highlight_edge_geo=new THREE.Geometry();
        highlight_edge_geo.vertices.push(new THREE.Vector3(),new THREE.Vector3());
        highlight_edge_geo.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000));
        highlight_edge=new THREE.Line(highlight_edge_geo,LineRenderMaterial,THREE.LineSegments);
        Force_root.add(Force_Face_Render[highlight_face_id]);
        DrawForm();

        //Store the result
        StoreData();

    }
    function keyEvent(event){
        'use strict'
        var keynum= window.event ? event.keyCode : event.which;
        var keychar = String.fromCharCode(keynum);
        if(highlight_edge_id!=undefined)
        {
            switch(keychar){
                case 'N':
                    highlight_edge_id=Force.mesh_half_edge[highlight_edge_id].next.id;
                    highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                        Force.fixed_center)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                        Force.fixed_center)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.verticesNeedUpdate=true;
                    break;
                case 'S':
                    highlight_edge_id=Force.mesh_half_edge[highlight_edge_id].sym.id;
                    highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                        Force.fixed_center)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                        Force.fixed_center)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.verticesNeedUpdate=true;
                    break;
                case 'V':
                    highlight_point_id=Force.mesh_half_edge[highlight_edge_id].vert.id;
                    highlight_point.geometry.vertices[0]=(new THREE.Vector3().subVectors(Force.mesh_vertex[highlight_point_id].pos,
                        Force.fixed_center)).multiplyScalar(Force_scale);
                    highlight_point.geometry.verticesNeedUpdate=true;
                    Force_root.add(highlight_point);
                    Force_root.remove(highlight_edge);                    
                    highlight_edge_id=undefined;
                    break;
                case 'F':
                    highlight_face_id=Force.mesh_half_edge[highlight_edge_id].face.id;
                    Force_root.add(Force_Face_Render[highlight_face_id]);
                    Force_root.remove(highlight_edge);
                    highlight_edge_id=undefined;               
                    break;
            }  
        }
        else if(highlight_point_id!=undefined)
        {
            if(keychar=='L')
            {
                highlight_edge_id=Force.mesh_vertex[highlight_point_id].edge.id;
                highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                    Force.fixed_center)).multiplyScalar(Force_scale);
                highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                    Force.fixed_center)).multiplyScalar(Force_scale);
                Force_root.add(highlight_edge);
                Force_root.remove(highlight_point); 
                highlight_edge.geometry.verticesNeedUpdate=true;  
                highlight_point_id=undefined;                
            }
        }
        else if(highlight_face_id!=undefined)
        {
            if(keychar=='L')
            {
                highlight_edge_id=Force.mesh_face[highlight_face_id].startedge.id;
                highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                    Force.fixed_center)).multiplyScalar(Force_scale);
                highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                    Force.fixed_center)).multiplyScalar(Force_scale);
                Force_root.add(highlight_edge);
                Force_root.remove(Force_Face_Render[highlight_face_id]);
                highlight_edge.geometry.verticesNeedUpdate=true;
                highlight_face_id=undefined;               
            }
        }

    }
    // function onMouseMove( event ) {
    //     'use strict'
    //     event.preventDefault();
    //     mouseScene1.x = ( event.clientX / window.innerWidth * 2 ) * 2 - 1;
    //     mouseScene1.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    //     mouseScene2.x = mouseScene1.x - 2;
    //     mouseScene2.y = mouseScene1.y;

    //     mousePositionDirty = true;

    // }
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
        // ray caster temp test
        //pick();
        renderer.clear();

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
        document.addEventListener('keydown',keyEvent,false);
        //Assign value for varables
        canvas = document.getElementById('WebGl_Canvas');
        idx_canvas=document.getElementById('Idx_Canvas');
        //ctx=idx_canvas.getContext("2d");
        scene1=new THREE.Scene;
        scene2=new THREE.Scene;
        views[0].scene=scene1;
        views[1].scene=scene2;

        Mouse1 = new THREE.Vector2();
        Mouse2 = new THREE.Vector2();

        camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 50000);
        renderer=new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setClearColor(new THREE.Color().setRGB( 0.9, 0.9, 0.9 ));
        renderer.setPixelRatio(window.devicePixelRatio);

        Force=new Mesh("Force");
        Form=new Mesh("Form");
        Force_root=new THREE.Object3D();
        Form_root=new THREE.Object3D();

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
        guiList.Export_Poly_Data={
            Export_Poly_Data:function(){
                window.open ('Poly_result.html');
            }
        }

        datgui=new dat.GUI();
        datgui.add(guiList.LoadForceGeometry,'Load_Force_file');
        datgui.add(guiList.LoadFormGeometry,'Load_Form_file');
        datgui.add(guiList.Barycentric_Subdivision,'Barycentric_Subdiv');
        datgui.add(guiList.Export_Poly_Data,'Export_Poly_Data');

        
        viewResize();
        animate();
    	//renderer.render(scene,camera);

    }
})();
    
