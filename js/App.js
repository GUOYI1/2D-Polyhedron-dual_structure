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
    var Force_Line_Geometry=[],Force_Line_Render=[];
    var Force_Face_Geometry=[], Force_Face_Render=[];
    var LineRenderMaterial= new THREE.LineBasicMaterial({
        vertexColors: true
      });
    var Form_Line_Geometry=[], Form_Line_Render=[];
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
        Export_Dual_Data: undefined
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
    function StoreDualData(){
        'use strict'
        localStorage.clear();
        if(!Force.dual_finished && !Form.dual_finished) {
            alert("Dual_Structure cannot be computed");
            return;
        }
        var v=new Array();
        var e=new Array();

        for(var i in Force.internal_dual_edge_direction_map){
            var v1_index=Force.internal_dual_edge_direction_map[i].f_p.x;
            var v2_index=Force.internal_dual_edge_direction_map[i].f_p.y;
            if(v1_index>Force.external_face_ID) v1_index--;
            if(v2_index>Force.external_face_ID) v2_index--;
            var e_obj={
                index:Force.internal_dual_edge_direction_map[i].id,
                v1:v1_index,
                v2:v2_index
            }
            e.push(JSON.stringify(e_obj));
        }
        for(var i in Force.mesh_face){
            var f=Force.mesh_face[i];
            if(f.id==Force.external_face_ID) continue;
            var idx=f.id;
            if(f.id>Force.external_face_ID) idx--;
            var v_obj={
                index: idx,
                x:f.dual_pos.x,
                y:f.dual_pos.y,
                z:f.dual_pos.z
            }
            v.push(JSON.stringify(v_obj));        
        }

        for(var i in Force.mesh_face){
            var f=Force.mesh_face[i];
            if(f.external_dual_edge.length>0){
                for(var j in f.external_dual_edge){
                    var V_ID=v.length;
                    var E_ID=e.length;
                    var v_obj={
                        index: V_ID,
                        x:f.dual_pos.x+f.external_dual_edge[j].x,
                        y:f.dual_pos.y+f.external_dual_edge[j].y,
                        z:f.dual_pos.z+f.external_dual_edge[j].z
                    }
                    v.push(JSON.stringify(v_obj));  
                    var FID=f.id;
                    if(FID>Force.external_face_ID) FID--;
                    var e_obj={
                        index:E_ID,
                        v1:FID,
                        v2:V_ID
                    }
                    e.push(JSON.stringify(e_obj));
                }
            }
        }    
        localStorage.setItem("Vertices",JSON.stringify(v));
        localStorage.setItem("Edges",JSON.stringify(e));
        //localStorage.setItem("Edges",e);

    }
    function DrawForce(){
        'use strict'
        Force_Line_Geometry=[];
        Force_Line_Render=[];
        Force_Face_Geometry=[];
        Force_Face_Render=[];
        scene2=new THREE.Scene;
        views[1].scene=scene2;

        if(!Force.half_finished){
            alert("No Force Geometry constructed");
            return;
        }

        var vert_Group=[];
        for(var v in Force.mesh_vertex){
            var vert=new THREE.Vector3().subVectors(Force.mesh_vertex[v].pos,Force.mesh_face[Force.external_face_ID].center_pos);
            vert.multiplyScalar(Force_scale);
            vert_Group.push(vert);
        }
        for(var i=0;i<Force.mesh_half_edge.length;i+=2){
            Force_Line_Geometry[i]=new THREE.Geometry();
            Force_Line_Geometry[i].vertices.push(new THREE.Vector3().copy(vert_Group[Force.mesh_half_edge[i].sym.vert.id]));
            Force_Line_Geometry[i].vertices.push(new THREE.Vector3().copy(vert_Group[Force.mesh_half_edge[i].vert.id]));
            if(Force.mesh_half_edge[i].external){
                if(Force.mesh_half_edge[i].connected)
                    Force_Line_Geometry[i].colors.push(new THREE.Color( 0xFFFFFF ),new THREE.Color( 0xFFFFFF ));
                else
                    Force_Line_Geometry[i].colors.push(new THREE.Color( 0x7FFF00 ),new THREE.Color( 0x7FFF00 ));
            }
            else 
                Force_Line_Geometry[i].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            Force_Line_Render[i]=new THREE.Line(Force_Line_Geometry[i],LineRenderMaterial,THREE.LineSegments);
            scene2.add(Force_Line_Render[i]);   
        }
        for(var f in Force.mesh_face){
            Force_Face_Geometry[f]=new THREE.Geometry();
            var idx=[];
            var he=Force.mesh_face[f].startedge;
            var count=0;
            do{
                Force_Face_Geometry[f].vertices.push(new THREE.Vector3().copy(vert_Group[he.vert.id]));
                idx.push(count);
                he=he.next;
                count++;
            }while(he!=Force.mesh_face[f].startedge)
            for(var i=1;i<idx.length-1;i++)
                Force_Face_Geometry[f].faces.push(new THREE.Face3(idx[0],idx[i],idx[i+1]));
            Force_Face_Render[f]=new THREE.Mesh(Force_Face_Geometry[f],FaceRenderMaterial);
        }

    }
    function DrawForm(){
        'use strict'
        Form_Line_Geometry=[];
        Form_Line_Render=[];
        scene1=new THREE.Scene;
        views[0].scene=scene1;
        if(!Form.half_finished) {
            alert("No Form Geometry constructed")
            return;
        }

        for(var i=0;i<Form.mesh_half_edge.length;i+=2){
            Form_Line_Geometry[i]=new THREE.Geometry();
            Form_Line_Geometry[i].vertices.push(new THREE.Vector3().copy(Form.mesh_half_edge[i].vert.pos));
            Form_Line_Geometry[i].vertices.push(new THREE.Vector3().copy(Form.mesh_half_edge[i].sym.vert.pos));
            if(Form.mesh_half_edge[i].connected)
                Form_Line_Geometry[i].colors.push(new THREE.Color( 0xFFFFFF ),new THREE.Color( 0xFFFFFF ));
            else if(Form.mesh_half_edge[i].external)
                Form_Line_Geometry[i].colors.push(new THREE.Color( 0x7FFF00 ),new THREE.Color( 0x7FFF00 ));
            else 
                Form_Line_Geometry[i].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            Form_Line_Geometry[i].translate(-Form.mesh_face[Form.external_face_ID].center_pos.x,
                -Form.mesh_face[Form.external_face_ID].center_pos.y,-
                -Form.mesh_face[Form.external_face_ID].center_pos.z);   
            Form_Line_Geometry[i].scale(Form_scale,Form_scale,Form_scale);
            Form_Line_Render[i]=new THREE.Line(Form_Line_Geometry[i],LineRenderMaterial,THREE.LineSegments);
            scene1.add(Form_Line_Render[i]);     
        }
        console.log("here");
        //show dual structure
        // for(var e in Force.internal_dual_edge_length_map)
        // {
        //     Form_Line_Geometry[e]=new THREE.Geometry();
        //     var index1=Force.internal_dual_edge_length_map[e].f_p.x;
        //     var index2=Force.internal_dual_edge_length_map[e].f_p.y;
        //     Form_Line_Geometry[e].vertices.push(new THREE.Vector3().copy(Force.mesh_face[index1].dual_pos));
        //     Form_Line_Geometry[e].vertices.push(new THREE.Vector3().copy(Force.mesh_face[index2].dual_pos));
        //     if(Force.internal_dual_edge_length_map[e].length>=0)
        //         Form_Line_Geometry[e].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
        //     else
        //         Form_Line_Geometry[e].colors.push(new THREE.Color( 0xFF0000 ),new THREE.Color( 0xFF0000 ));
        //     //Form_Line_Geometry[e].
        //     Form_Line_Geometry[e].translate(-Force.dual_geo_center.x,-Force.dual_geo_center.y,-Force.dual_geo_center.z);   
        //     Form_Line_Geometry[e].scale(Form_scale,Form_scale,Form_scale);
        //     Form_Line_Render[e]=new THREE.Line(Form_Line_Geometry[e],LineRenderMaterial,THREE.LineSegments);


        //     scene1.add(Form_Line_Render[e]);        
        // }
        // //draw external dual edge;
        // for(var f in Force.mesh_face)
        // {
        //     if(Force.mesh_face[f].external_dual_edge.length>0)
        //     {
        //         for(var e in Force.mesh_face[f].external_dual_edge)
        //         {
        //             var idx=Form_Line_Geometry.length;
        //             Form_Line_Geometry[idx] = new THREE.Geometry();
        //             var e_v1=new THREE.Vector3().copy(Force.mesh_face[f].dual_pos);
        //             var e_v2=new THREE.Vector3().addVectors(e_v1,Force.mesh_face[f].external_dual_edge[e]);
        //             Form_Line_Geometry[idx].vertices.push(e_v1);
        //             Form_Line_Geometry[idx].vertices.push(e_v2);
        //             Form_Line_Geometry[idx].colors.push(new THREE.Color( 0x7FFF00 ),new THREE.Color( 0x7FFF00 ));
        //             Form_Line_Geometry[idx].translate(-Force.dual_geo_center.x,-Force.dual_geo_center.y,-Force.dual_geo_center.z);   
        //             Form_Line_Geometry[idx].scale(Form_scale,Form_scale,Form_scale);
        //             Form_Line_Render[idx] = new THREE.Line(Form_Line_Geometry[idx],LineRenderMaterial,THREE.LineSegments);
        //             scene1.add(Form_Line_Render[idx]);
        //         }
        //     }
        // }

    }
    function ReComputeMeshScale(mesh){
        'use strict'
        //Adjust the size and scale of the geometry
        var mesh_scale=0, dual_scale=0;
        if(mesh.half_finished){
            var mesh_range=new THREE.Vector3().subVectors(mesh.bound[1],mesh.bound[0]);
            var mesh_aspect=views[1].window.width / views[1].window.height;
            if(mesh_aspect<=1)
                mesh_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*mesh_range.length());
            else
                mesh_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*mesh_aspect*mesh_range.length());
        }
        if(mesh.dual_finished){
            var dual_range=new THREE.Vector3().subVectors(mesh.dual_bound[1],mesh.dual_bound[0]);
            var dual_aspect=views[0].window.width / views[0].window.height;
            if(dual_aspect<=1)
                dual_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*dual_range.length());
            else
                dual_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*dual_aspect*dual_range.length());
        }
        Force_scale=(mesh.type=="Force"? mesh_scale:dual_scale);
        Form_scale=(mesh.type=="Force"? dual_scale:mesh_scale);

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
        ReComputeMeshScale(mesh);

        if(mesh.dual_finished){
            for(var i=0;i<mesh.mesh_face.length;i++){
                if(i==mesh.external_face_ID) continue;
                    v.push([mesh.mesh_face[i].dual_pos.x,mesh.mesh_face[i].dual_pos.y,mesh.mesh_face[i].dual_pos.z]);
            }
            for(var i=0;i<mesh.internal_dual_edge_direction_map.length;i++){
                var idx1=mesh.internal_dual_edge_direction_map[i].f_p.x;
                var idx2=mesh.internal_dual_edge_direction_map[i].f_p.y;
                if(idx1>mesh.external_face_ID)idx1--;
                if(idx2>mesh.external_face_ID)idx2--;
                e.push([idx1,idx2]);
            }
            for(var i=0;i<mesh.mesh_face.length;i++){
                for(var j=0;j<mesh.mesh_face[i].external_dual_edge.length;j++){
                    var idx1=mesh.mesh_face[i].id;
                    var idx2=v.length;
                    if(idx1>mesh.external_face_ID) idx1--;
                    var e_v=new THREE.Vector3().addVectors(mesh.mesh_face[i].dual_pos,mesh.mesh_face[i].external_dual_edge[j]);
                    v.push([e_v.x,e_v.y,e_v.z]);
                    e.push([idx1,idx2]);
                }

            }
            dual.buildHalfEdgeStructure(v,e);
        }   

        console.log(Force,Form);
        DrawForce();
        DrawForm();


        if(Force.half_finished)
        {
            highlight_edge_id=0;
            var highlight_edge_geo=new THREE.Geometry();
            var highlight_point_geo=new THREE.Geometry();
            highlight_edge_geo.vertices.push((new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                            Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale),
                            (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                            Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale));
            highlight_edge_geo.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000));
            highlight_point_geo.vertices.push(new THREE.Vector3(0,0,0));
            highlight_edge=new THREE.Line(highlight_edge_geo,LineRenderMaterial,THREE.LineSegments);
            highlight_point=new THREE.Points(highlight_point_geo,PointRenderMaterial);

            scene2.add(highlight_edge);
        }

        //Store the result
        //StoreDualData();
    }
    function Execute_Barycentric_Subdivision(){
        'use strict'
        if(highlight_face_id==undefined)
            return;
        var num=Force.mesh_half_edge.length;
        var numf=Force.mesh_face.length;
        var RenderLNum=Force_Line_Geometry.length;
        var RenderFNum=Force_Face_Geometry.length;

        Force.BaryCentricSubdivision(highlight_face_id);
        scene2.remove(Force_Face_Render[highlight_face_id]);//Do this to make sure the hightlight elements are the last to be rendered.

        //Change the rendering result of line;
        for(var i=num;i<Force.mesh_half_edge.length;i+=2){
            Force_Line_Geometry[RenderLNum]=new THREE.Geometry();
            Force_Line_Geometry[RenderLNum].vertices.push(new THREE.Vector3().copy(Force.mesh_half_edge[i].sym.vert.pos),
                                                    new THREE.Vector3().copy(Force.mesh_half_edge[i].vert.pos));
            Force_Line_Geometry[RenderLNum].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            Force_Line_Geometry[RenderLNum].translate(-Force.mesh_face[Force.external_face_ID].center_pos.x,
                -Force.mesh_face[Force.external_face_ID].center_pos.y,
                -Force.mesh_face[Force.external_face_ID].center_pos.z);   
            Force_Line_Geometry[RenderLNum].scale(Force_scale,Force_scale,Force_scale);

            Force_Line_Render[RenderLNum]=new THREE.Line(Force_Line_Geometry[RenderLNum],LineRenderMaterial,THREE.LineSegments);
            scene2.add(Force_Line_Render[RenderLNum]);
            RenderLNum++;
        }

        //Change the rendering result of faces
        Force_Face_Geometry[highlight_face_id]=new THREE.Geometry();
        Force_Face_Geometry[highlight_face_id].vertices.push(new THREE.Vector3().copy(Force.mesh_face[highlight_face_id].startedge.vert.pos),
                                            new THREE.Vector3().copy(Force.mesh_face[highlight_face_id].startedge.next.vert.pos),
                                            new THREE.Vector3().copy(Force.mesh_face[highlight_face_id].startedge.sym.vert.pos));
        Force_Face_Geometry[highlight_face_id].translate(-Force.mesh_face[Force.external_face_ID].center_pos.x,
                -Force.mesh_face[Force.external_face_ID].center_pos.y,
                -Force.mesh_face[Force.external_face_ID].center_pos.z); 
        Force_Face_Geometry[highlight_face_id].scale(Force_scale,Force_scale,Force_scale);
        Force_Face_Geometry[highlight_face_id].faces.push(new THREE.Face3(0,1,2));
        Force_Face_Render[highlight_face_id]=new THREE.Mesh(Force_Face_Geometry[highlight_face_id],FaceRenderMaterial);

        for(var i=numf;i<Force.mesh_face.length;i++){
            console.log("here");
            Force_Face_Geometry[i]=new THREE.Geometry();
            Force_Face_Geometry[i].vertices.push(new THREE.Vector3().copy(Force.mesh_face[i].startedge.vert.pos),
                                new THREE.Vector3().copy(Force.mesh_face[i].startedge.next.vert.pos),
                                new THREE.Vector3().copy(Force.mesh_face[i].startedge.sym.vert.pos));
            Force_Face_Geometry[i].translate(-Force.mesh_face[Force.external_face_ID].center_pos.x,
                -Force.mesh_face[Force.external_face_ID].center_pos.y,
                -Force.mesh_face[Force.external_face_ID].center_pos.z); 
            Force_Face_Geometry[i].scale(Force_scale,Force_scale,Force_scale);
            Force_Face_Geometry[i].faces.push(new THREE.Face3(0,1,2));
            Force_Face_Render[i]=new THREE.Mesh(Force_Face_Geometry[i],FaceRenderMaterial);
        }

        var highlight_edge_geo=new THREE.Geometry();
        highlight_edge_geo.vertices.push(new THREE.Vector3(),new THREE.Vector3());
        highlight_edge_geo.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000));
        highlight_edge=new THREE.Line(highlight_edge_geo,LineRenderMaterial,THREE.LineSegments);
        scene2.add(Force_Face_Render[highlight_face_id]);
        DrawForm();
        console.log(Force);

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
                        Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                        Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.verticesNeedUpdate=true;
                    break;
                case 'S':
                    highlight_edge_id=Force.mesh_half_edge[highlight_edge_id].sym.id;
                    highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                        Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                        Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                    highlight_edge.geometry.verticesNeedUpdate=true;
                    break;
                case 'V':
                    highlight_point_id=Force.mesh_half_edge[highlight_edge_id].vert.id;
                    highlight_point.geometry.vertices[0]=(new THREE.Vector3().subVectors(Force.mesh_vertex[highlight_point_id].pos,
                        Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                    highlight_point.geometry.verticesNeedUpdate=true;
                    scene2.add(highlight_point);
                    scene2.remove(highlight_edge);                    
                    highlight_edge_id=undefined;
                    break;
                case 'F':
                    highlight_face_id=Force.mesh_half_edge[highlight_edge_id].face.id;
                    scene2.add(Force_Face_Render[highlight_face_id]);
                    scene2.remove(highlight_edge);
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
                    Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                    Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                scene2.add(highlight_edge);
                scene2.remove(highlight_point); 
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
                    Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(Force.mesh_half_edge[highlight_edge_id].vert.pos, 
                    Force.mesh_face[Force.external_face_ID].center_pos)).multiplyScalar(Force_scale);
                scene2.add(highlight_edge);
                scene2.remove(Force_Face_Render[highlight_face_id]);
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
        guiList.Export_Dual_Structure={
            Export_Form:function(){
                //document.getElementById("Dual_Result").click();
                window.open ('Dual_result.html');
            }
        }

        datgui=new dat.GUI();
        datgui.add(guiList.LoadForceGeometry,'Load_Force_file');
        datgui.add(guiList.LoadFormGeometry,'Load_Form_file');
        datgui.add(guiList.Barycentric_Subdivision,'Barycentric_Subdiv');
        datgui.add(guiList.Export_Dual_Structure,'Export_Form');

        
        viewResize();
        animate();
    	//renderer.render(scene,camera);

    }
})();
    
