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
    var ctx;
    var scene1,scene2;
    var camera;
    var renderer;
    //view1
    var mesh;
    var RenderGeometry_Line=[],Renderline=[];
    var RenderGeometry_Mesh=[], RenderMesh=[];
    var LineRenderMaterial= new THREE.LineBasicMaterial({
        vertexColors: true
      });
    var dualGeometry=[], Renderdualline=[];
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
        LoadGeometry:undefined,
        Barycentric_Subdivision:undefined,
        Export_Dual_Data: undefined
    };
    var highlight_edge=undefined;
    var highlight_point=undefined;
    var highlight_edge_id=undefined;
    var highlight_face_id=undefined;
    var highlight_point_id=undefined;

    var mesh_scale=0;
    var dual_scale=0;


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
        if(!mesh.dual_finished) alert("Dual_Structure cannot be computed");
        var v=new Array();
        var e=new Array();

        for(var i in mesh.internal_dual_edge_direction_map){
            var v1_index=mesh.internal_dual_edge_direction_map[i].f_p.x;
            var v2_index=mesh.internal_dual_edge_direction_map[i].f_p.y;
            if(v1_index>mesh.external_face_ID) v1_index--;
            if(v2_index>mesh.external_face_ID) v2_index--;
            var e_obj={
                index:mesh.internal_dual_edge_direction_map[i].id,
                v1:v1_index,
                v2:v2_index
            }
            e.push(JSON.stringify(e_obj));
        }
        for(var i in mesh.mesh_face){
            var f=mesh.mesh_face[i];
            if(f.id==mesh.external_face_ID) continue;
            var idx=f.id;
            if(f.id>mesh.external_face_ID) idx--;
            var v_obj={
                index: idx,
                x:f.dual_pos.x,
                y:f.dual_pos.y,
                z:f.dual_pos.z
            }
            v.push(JSON.stringify(v_obj));        
        }

        for(var i in mesh.mesh_face){
            var f=mesh.mesh_face[i];
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
                    if(FID>mesh.external_face_ID) FID--;
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
    function DrawMesh(){
        'use strict'
        if(!mesh.half_finished){
            alert("HalfEdge Structure Error!");
            return;
        }
        RenderGeometry_Line=[];
        Renderline=[];
        RenderGeometry_Mesh=[];
        RenderMesh=[];
        scene2=new THREE.Scene;
        views[1].scene=scene2;
        var vert_Group=[];
        for(var v in mesh.mesh_vertex){
            var vert=new THREE.Vector3().subVectors(mesh.mesh_vertex[v].pos,mesh.mesh_face[mesh.external_face_ID].center_pos);
            vert.multiplyScalar(mesh_scale);
            vert_Group.push(vert);
        }
        for(var i=0;i<mesh.mesh_half_edge.length;i+=2){
            RenderGeometry_Line[i]=new THREE.Geometry();
            RenderGeometry_Line[i].vertices.push(new THREE.Vector3().copy(vert_Group[mesh.mesh_half_edge[i].sym.vert.id]));
            RenderGeometry_Line[i].vertices.push(new THREE.Vector3().copy(vert_Group[mesh.mesh_half_edge[i].vert.id]));
            RenderGeometry_Line[i].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            Renderline[i]=new THREE.Line(RenderGeometry_Line[i],LineRenderMaterial,THREE.LineSegments);
            scene2.add(Renderline[i]);   
        }
        for(var f in mesh.mesh_face){
            if(mesh.mesh_face[f].id==mesh.external_face_ID) continue;
            RenderGeometry_Mesh[f]=new THREE.Geometry();
            var idx=[];
            var he=mesh.mesh_face[f].startedge;
            var count=0;
            do{
                RenderGeometry_Mesh[f].vertices.push(new THREE.Vector3().copy(vert_Group[he.vert.id]));
                idx.push(count);
                he=he.next;
                count++;
            }while(he!=mesh.mesh_face[f].startedge)
            for(var i=1;i<idx.length-1;i++)
                RenderGeometry_Mesh[f].faces.push(new THREE.Face3(idx[0],idx[i],idx[i+1]));
            RenderMesh[f]=new THREE.Mesh(RenderGeometry_Mesh[f],FaceRenderMaterial);
        }

    }
    function updateDualStructure(){
        'use strict'
        if(mesh.internal_dual_edge_length_map.length==0) return;
        scene1=new THREE.Scene;
        views[0].scene=scene1;
        dualGeometry=[];
        Renderdualline=[];

        //show dual structure
        for(var e in mesh.internal_dual_edge_length_map)
        {
            dualGeometry[e]=new THREE.Geometry();
            var index1=mesh.internal_dual_edge_length_map[e].f_p.x;
            var index2=mesh.internal_dual_edge_length_map[e].f_p.y;
            dualGeometry[e].vertices.push(new THREE.Vector3().copy(mesh.mesh_face[index1].dual_pos));
            dualGeometry[e].vertices.push(new THREE.Vector3().copy(mesh.mesh_face[index2].dual_pos));
            if(mesh.internal_dual_edge_length_map[e].length>=0)
                dualGeometry[e].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            else
                dualGeometry[e].colors.push(new THREE.Color( 0xFF0000 ),new THREE.Color( 0xFF0000 ));
            //dualGeometry[e].
            dualGeometry[e].translate(-mesh.dual_geo_center.x,-mesh.dual_geo_center.y,-mesh.dual_geo_center.z);   
            dualGeometry[e].scale(dual_scale,dual_scale,dual_scale);
            Renderdualline[e]=new THREE.Line(dualGeometry[e],LineRenderMaterial,THREE.LineSegments);


            scene1.add(Renderdualline[e]);        
        }
        //draw external dual edge;
        for(var f in mesh.mesh_face)
        {
            if(mesh.mesh_face[f].external_dual_edge.length>0)
            {
                for(var e in mesh.mesh_face[f].external_dual_edge)
                {
                    var idx=dualGeometry.length;
                    dualGeometry[idx] = new THREE.Geometry();
                    var e_v1=new THREE.Vector3().copy(mesh.mesh_face[f].dual_pos);
                    var e_v2=new THREE.Vector3().addVectors(e_v1,mesh.mesh_face[f].external_dual_edge[e]);
                    dualGeometry[idx].vertices.push(e_v1);
                    dualGeometry[idx].vertices.push(e_v2);
                    dualGeometry[idx].colors.push(new THREE.Color( 0x7FFF00 ),new THREE.Color( 0x7FFF00 ));
                    dualGeometry[idx].translate(-mesh.dual_geo_center.x,-mesh.dual_geo_center.y,-mesh.dual_geo_center.z);   
                    dualGeometry[idx].scale(dual_scale,dual_scale,dual_scale);
                    Renderdualline[idx] = new THREE.Line(dualGeometry[idx],LineRenderMaterial,THREE.LineSegments);
                    scene1.add(Renderdualline[idx]);
                }
            }
        }

    }
    function ReComputeMeshScale(){
        'use strict'
        if(!mesh.dual_finished || !mesh.half_finished) return;
        //Adjust the size and scale of the geometry
        var mesh_range=new THREE.Vector3().subVectors(mesh.bound[1],mesh.bound[0]);
        var dual_range=new THREE.Vector3().subVectors(mesh.dual_bound[1],mesh.dual_bound[0]);
        var mesh_aspect=views[1].window.width / views[1].window.height;
        var dual_aspect=views[0].window.width / views[0].window.height;
        if(mesh_aspect<=1)
            mesh_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*mesh_range.length());
        else
            mesh_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*mesh_aspect*mesh_range.length());
        if(dual_aspect<=1)
            dual_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*dual_range.length());
        else
            dual_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(0.75*dual_aspect*dual_range.length());

    }
    function buildMeshStructure(event){
        'use strict'
        //ReInitialize
        var json=JSON.parse(event.target.result);
        highlight_edge=undefined;
        highlight_point=undefined;

        highlight_edge_id=undefined;
        highlight_face_id=undefined;
        highlight_point_id=undefined;

       
        mesh.buildHalfEdgeStructure(json.vertices,json.edges);       
        mesh.find_2D_Nodes();
        mesh.Produce_dual_structure();
        ReComputeMeshScale();
        DrawMesh();
        updateDualStructure();


        highlight_edge_id=0;
        var highlight_edge_geo=new THREE.Geometry();
        var highlight_point_geo=new THREE.Geometry();
        highlight_edge_geo.vertices.push((new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                        mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale),
                        (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].vert.pos, 
                        mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale));
        highlight_edge_geo.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000));
        highlight_point_geo.vertices.push(new THREE.Vector3(0,0,0));
        highlight_edge=new THREE.Line(highlight_edge_geo,LineRenderMaterial,THREE.LineSegments);
        highlight_point=new THREE.Points(highlight_point_geo,PointRenderMaterial);

        scene2.add(highlight_edge);

        //Store the result
        StoreDualData();
        console.log(mesh);

  
    }
    function Execute_Barycentric_Subdivision(){
        'use strict'
        if(highlight_face_id==undefined)
            return;
        var num=mesh.mesh_half_edge.length;
        var numf=mesh.mesh_face.length;
        var RenderLNum=RenderGeometry_Line.length;
        var RenderFNum=RenderGeometry_Mesh.length;

        mesh.BaryCentricSubdivision(highlight_face_id);
        scene2.remove(RenderMesh[highlight_face_id]);//Do this to make sure the hightlight elements are the last to be rendered.

        //Change the rendering result of line;
        for(var i=num;i<mesh.mesh_half_edge.length;i+=2){
            RenderGeometry_Line[RenderLNum]=new THREE.Geometry();
            RenderGeometry_Line[RenderLNum].vertices.push(new THREE.Vector3().copy(mesh.mesh_half_edge[i].sym.vert.pos),
                                                    new THREE.Vector3().copy(mesh.mesh_half_edge[i].vert.pos));
            RenderGeometry_Line[RenderLNum].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            RenderGeometry_Line[RenderLNum].translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);   
            RenderGeometry_Line[RenderLNum].scale(mesh_scale,mesh_scale,mesh_scale);

            Renderline[RenderLNum]=new THREE.Line(RenderGeometry_Line[RenderLNum],LineRenderMaterial,THREE.LineSegments);
            scene2.add(Renderline[RenderLNum]);
            RenderLNum++;
        }

        //Change the rendering result of faces
        RenderGeometry_Mesh[highlight_face_id]=new THREE.Geometry();
        RenderGeometry_Mesh[highlight_face_id].vertices.push(new THREE.Vector3().copy(mesh.mesh_face[highlight_face_id].startedge.vert.pos),
                                            new THREE.Vector3().copy(mesh.mesh_face[highlight_face_id].startedge.next.vert.pos),
                                            new THREE.Vector3().copy(mesh.mesh_face[highlight_face_id].startedge.sym.vert.pos));
        RenderGeometry_Mesh[highlight_face_id].translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z); 
        RenderGeometry_Mesh[highlight_face_id].scale(mesh_scale,mesh_scale,mesh_scale);
        RenderGeometry_Mesh[highlight_face_id].faces.push(new THREE.Face3(0,1,2));
        RenderMesh[highlight_face_id]=new THREE.Mesh(RenderGeometry_Mesh[highlight_face_id],FaceRenderMaterial);

        for(var i=numf;i<mesh.mesh_face.length;i++){
            console.log("here");
            RenderGeometry_Mesh[i]=new THREE.Geometry();
            RenderGeometry_Mesh[i].vertices.push(new THREE.Vector3().copy(mesh.mesh_face[i].startedge.vert.pos),
                                new THREE.Vector3().copy(mesh.mesh_face[i].startedge.next.vert.pos),
                                new THREE.Vector3().copy(mesh.mesh_face[i].startedge.sym.vert.pos));
            RenderGeometry_Mesh[i].translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z); 
            RenderGeometry_Mesh[i].scale(mesh_scale,mesh_scale,mesh_scale);
            RenderGeometry_Mesh[i].faces.push(new THREE.Face3(0,1,2));
            RenderMesh[i]=new THREE.Mesh(RenderGeometry_Mesh[i],FaceRenderMaterial);
        }

        var highlight_edge_geo=new THREE.Geometry();
        highlight_edge_geo.vertices.push(new THREE.Vector3(),new THREE.Vector3());
        highlight_edge_geo.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000));
        highlight_edge=new THREE.Line(highlight_edge_geo,LineRenderMaterial,THREE.LineSegments);
        scene2.add(RenderMesh[highlight_face_id]);
        updateDualStructure();
        console.log(mesh);

    }
    function keyEvent(event){
        'use strict'
        var keynum= window.event ? event.keyCode : event.which;
        var keychar = String.fromCharCode(keynum);
        if(highlight_edge_id!=undefined)
        {
            switch(keychar){
                case 'N':
                    highlight_edge_id=mesh.mesh_half_edge[highlight_edge_id].next.id;
                    highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                        mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                    highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].vert.pos, 
                        mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                    highlight_edge.geometry.verticesNeedUpdate=true;
                    break;
                case 'S':
                    highlight_edge_id=mesh.mesh_half_edge[highlight_edge_id].sym.id;
                    highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                        mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                    highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].vert.pos, 
                        mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                    highlight_edge.geometry.verticesNeedUpdate=true;
                    break;
                case 'V':
                    highlight_point_id=mesh.mesh_half_edge[highlight_edge_id].vert.id;
                    highlight_point.geometry.vertices[0]=(new THREE.Vector3().subVectors(mesh.mesh_vertex[highlight_point_id].pos,
                        mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                    highlight_point.geometry.verticesNeedUpdate=true;
                    scene2.add(highlight_point);
                    scene2.remove(highlight_edge);                    
                    highlight_edge_id=undefined;
                    break;
                case 'F':
                    highlight_face_id=mesh.mesh_half_edge[highlight_edge_id].face.id;
                    scene2.add(RenderMesh[highlight_face_id]);
                    scene2.remove(highlight_edge);
                    highlight_edge_id=undefined;                  
                    break;
            }  
        }
        else if(highlight_point_id!=undefined)
        {
            if(keychar=='L')
            {
                highlight_edge_id=mesh.mesh_vertex[highlight_point_id].edge.id;
                highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                    mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].vert.pos, 
                    mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                scene2.add(highlight_edge);
                scene2.remove(highlight_point);   
                highlight_point_id=undefined;                
            }
        }
        else if(highlight_face_id!=undefined)
        {
            if(keychar=='L')
            {
                highlight_edge_id=mesh.mesh_face[highlight_face_id].startedge.id;
                highlight_edge.geometry.vertices[0]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos, 
                    mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                highlight_edge.geometry.vertices[1]= (new THREE.Vector3().subVectors(mesh.mesh_half_edge[highlight_edge_id].vert.pos, 
                    mesh.mesh_face[mesh.external_face_ID].center_pos)).multiplyScalar(mesh_scale);
                scene2.add(highlight_edge);
                scene2.remove(RenderMesh[highlight_face_id]);
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
        // ctx.clearRect(0, 0, canvas.width, canvas.height);
        // if(mesh.half_finished) 
        // {
        //     for (var i in mesh.mesh_face) 
        //     {
        //         var pos = new THREE.Vector3().copy(mesh.mesh_face[i].center_pos);
        //         pos.applyMatrix4(Renderline[0].matrixWorld);
        //         pos.project(camera);

        //         pos.x = ((pos.x + 1) * 0.5 * canvas.width)*0.5;
        //         pos.y = (-pos.y + 1) * 0.5 * canvas.height;
        //         ctx.font = "10px Arial";
        //         ctx.strokeText(i, pos.x, pos.y);
        //         console.log(pos);
        //     }
        // }
        //console.log("here");
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
        ctx=idx_canvas.getContext("2d");
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

        mesh=new Mesh();

        camera.position.x=0;
        camera.position.y=0;
        camera.position.z=100;

       
        orbit = new THREE.OrbitControls( camera, renderer.domElement);

        //Gui Initialization
        guiList.LoadGeometry={
            Load_geometry_file: function(){
                 document.getElementById("files").click();
            }
        }
        guiList.Barycentric_Subdivision={
            Barycentric_Subdiv: Execute_Barycentric_Subdivision
        }
        guiList.Export_Dual_Structure={
            Export_Dual:function(){
                //document.getElementById("Dual_Result").click();
                window.open ('Dual_result.html');
            }
        }

        datgui=new dat.GUI();
        datgui.add(guiList.LoadGeometry,'Load_geometry_file');
        datgui.add(guiList.Barycentric_Subdivision,'Barycentric_Subdiv');
        datgui.add(guiList.Export_Dual_Structure,'Export_Dual');

        
        viewResize();
        animate();
    	//renderer.render(scene,camera);

    }
})();
    
