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
    var ctx;
    var scene1,scene2;
    var camera;
    var renderer;
    //view1
    var mesh;
    var RenderGeometry=[],Renderline=[];
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
        Barycentric_Subdivision:undefined 
    };
    var highlight_edge=undefined;
    var highlight_face=undefined;
    var highlight_point=undefined;
    var highlight_edge_id=undefined;
    var highlight_face_id=undefined;
    var highlight_point_id=undefined;

    var mesh_scale=0;
    var dual_scale=0;


    function readJson(event)
    {
        'use strict'
        var files_list=event.target.files;
        var reader= new FileReader();
        var file=files_list[0];

        reader.readAsText(file, "UTF-8");
        reader.onload=buildMeshStructure;
    }
    function updateDualStructure()
    {
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
    function buildMeshStructure(event)
    {
        //ReInitialize
        var edgepair=[];
        var vertex_edge_count=[];//Used to record the number of edges start from each point
        var vertex_edge_map=[];//Used to record the edges start from each point
        var h_id=0,e_id=0;
        var json=JSON.parse(event.target.result);
        RenderGeometry=[];
        Renderline=[];
        dualGeometry=[];
        Renderdualline=[];
        mesh.clear();
        scene1=new THREE.Scene;
        scene2=new THREE.Scene;
        views[0].scene=scene1;
        views[1].scene=scene2;
        mesh_scale=0;
        dual_scale=0;
        highlight_edge=new THREE.Line();
        highlight_edge.material=LineRenderMaterial;
        highlight_face=new THREE.Mesh();
        highlight_face.material=FaceRenderMaterial;
        highlight_point=new THREE.Points();
        highlight_point.material=PointRenderMaterial;

        highlight_edge_id=undefined;
        highlight_face_id=undefined;
        highlight_point_id=undefined;


        //read vertices
        for(var v in json.vertices)
        {
            if(json.vertices[v][2]!=0.0) 
            {
                alert("Z coords must be 0");
                return;
            }
            mesh.mesh_vertex[v]=new Vertex(v);
            mesh.mesh_vertex[v].pos=new THREE.Vector3(
                json.vertices[v][0],
                json.vertices[v][1],
                json.vertices[v][2]); 
            if(v==0)
            {
                mesh.bound[0].x=json.vertices[v][0];
                mesh.bound[0].y=json.vertices[v][1];
                mesh.bound[0].z=json.vertices[v][2];
                mesh.bound[1].x=json.vertices[v][0];
                mesh.bound[1].y=json.vertices[v][1];
                mesh.bound[1].z=json.vertices[v][2];
            }
            else
            {
                if(json.vertices[v][0]<mesh.bound[0].x)
                    mesh.bound[0].x=json.vertices[v][0]
                else if(json.vertices[v][0]>mesh.bound[1].x)
                    mesh.bound[1].x=json.vertices[v][0];

                if(json.vertices[v][1]<mesh.bound[0].y)
                    mesh.bound[0].y=json.vertices[v][1];
                else if(json.vertices[v][1]>mesh.bound[1].y)
                    mesh.bound[1].y=json.vertices[v][1];

                if(json.vertices[v][2]<mesh.bound[0].z)
                    mesh.bound[0].z=json.vertices[v][2]
                else if(json.vertices[v][2]>mesh.bound[1].z)
                    mesh.bound[1].z=json.vertices[v][2];
            }
            vertex_edge_count[v]=0;
            vertex_edge_map[v]=new Array();
        }
        

        //read edges
        for(var e in json.edges)
        {
            if(json.edges[e][0]!=undefined && json.edges[e][0]!=undefined)
            {
                edgepair[e]=new THREE.Vector2(
                    json.edges[e][0],
                    json.edges[e][1]);
                vertex_edge_count[json.edges[e][0]]+=1;
                vertex_edge_count[json.edges[e][1]]+=1;
            }

        }
        //building external edges and half edges
        for(var e in edgepair)
        {
            RenderGeometry[e]=new THREE.Geometry();
            RenderGeometry[e].vertices.push(new THREE.Vector3().copy(mesh.mesh_vertex[edgepair[e].x].pos));
            RenderGeometry[e].vertices.push(new THREE.Vector3().copy(mesh.mesh_vertex[edgepair[e].y].pos));
            

            if(vertex_edge_count[edgepair[e].x]==1 || vertex_edge_count[edgepair[e].y]==1)
            {
                //building external edges
                var ex_edge=new ExternalEdge(e_id);
                ex_edge.pair=new THREE.Vector2(edgepair[e].x,edgepair[e].y);
                mesh.external_edge[e_id]=ex_edge;
                e_id+=1;
                RenderGeometry[e].colors.push(new THREE.Color( 0x7FFF00 ),new THREE.Color( 0x7FFF00 ));
            } 
            else{
                //building half_edge
                var he=new HalfEdge(h_id);
                var he_sym=new HalfEdge(h_id+1);
                
                he.vert=mesh.mesh_vertex[edgepair[e].x];
                he_sym.vert=mesh.mesh_vertex[edgepair[e].y];
                vertex_edge_map[edgepair[e].x].push(he_sym);
                vertex_edge_map[edgepair[e].y].push(he);
                he.sym=he_sym;
                he_sym.sym=he;  
                mesh.mesh_half_edge[h_id]=he;
                mesh.mesh_half_edge[h_id+1]=he_sym;
                h_id+=2;
                RenderGeometry[e].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            }   
     
        }

        //find Next
        for(var i in mesh.mesh_half_edge)
        {
            var halfedgeGroup=vertex_edge_map[mesh.mesh_half_edge[i].vert.id];
            var next_idx=sortAngle(mesh.mesh_half_edge[i],halfedgeGroup);
            mesh.mesh_half_edge[i].next=halfedgeGroup[next_idx];
        }
        //build face
        var f_id=0;
        for(var i in mesh.mesh_half_edge)
        {
            
            if(mesh.mesh_half_edge[i].face==undefined)
            {
                var he=mesh.mesh_half_edge[i];
                var edge_count=0;
                var sum=new THREE.Vector3(0,0,0);
                var f=new Face(f_id);
                f.startedge=he;
                mesh.mesh_face[f_id]=f;
                do
                {
                    he.face=f;
                    sum.add(he.vert.pos);
                    edge_count+=1;
                    he=he.next;
                }while(he!=mesh.mesh_half_edge[i])
                f.center_pos=new THREE.Vector3(sum.x/edge_count,sum.y/edge_count,sum.z/edge_count);


                var v1=(new THREE.Vector3().subVectors(he.vert.pos,f.center_pos)).normalize(); 
                var v2=(new THREE.Vector3().subVectors(he.vert.pos,he.sym.vert.pos)).normalize(); 
                if(v1.cross(v2).z<0)
                    mesh.external_face_ID=f_id; 
                else
                {
                    do
                    {
                        if(he.vert.edge==undefined)
                            he.vert.edge=he;
                        he=he.next;
                    }while(he!=mesh.mesh_half_edge[i])
                }
                f_id+=1;
            }
        }
        if(mesh.external_face_ID==undefined)
        {
            alert("No External Face.");
            return;
        }    

        mesh.half_finished=true;
        mesh.find_2D_Nodes();
        mesh.Produce_dual_structure();

        //
        //Adjust the size and scale of the geometry
        var mesh_range=new THREE.Vector3().subVectors(mesh.bound[1],mesh.bound[0]);
        var dual_range=new THREE.Vector3().subVectors(mesh.dual_bound[1],mesh.dual_bound[0]);
        var mesh_aspect=views[1].window.width / views[1].window.height;
        var dual_aspect=views[0].window.width / views[0].window.height;
        if(mesh_range.x>mesh_range.y*mesh_aspect)
            mesh_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/mesh_range.x;
        else
            mesh_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(mesh_aspect*mesh_range.y);
        
        if(dual_range.x>dual_range.y*dual_aspect)
            dual_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/dual_range.x;
        else
            dual_scale=camera.position.z*Math.tan(camera.fov/360*Math.PI)/(dual_aspect*dual_range.y);
        //console.log(mesh_scale);
        for(var e in RenderGeometry)
        {
            RenderGeometry[e].translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);   
            RenderGeometry[e].scale(mesh_scale,mesh_scale,mesh_scale);
            Renderline[e]=new THREE.Line(RenderGeometry[e],LineRenderMaterial,THREE.LineSegments);
            scene2.add(Renderline[e]);   
        }
        updateDualStructure();

        highlight_edge_id=0;
        var highlight_edge_geometry=new THREE.Geometry();
        highlight_edge_geometry.vertices.push(new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos),
            new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].vert.pos));
        highlight_edge_geometry.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000))

        highlight_edge_geometry.translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);   
        highlight_edge_geometry.scale(mesh_scale,mesh_scale,mesh_scale);

        highlight_edge=new THREE.Line(highlight_edge_geometry,LineRenderMaterial,THREE.LineSegments)

        scene2.add(highlight_edge);
        scene2.add(highlight_face);
        scene2.add(highlight_point);
        console.log(mesh);

  
    }
    function Execute_Barycentric_Subdivision()
    {
        if(highlight_face_id==undefined)
            return;
        var start=mesh.mesh_face[highlight_face_id].startedge;
        var he=start;
        var num=RenderGeometry.length;

        do
        {
            RenderGeometry[num]=new THREE.Geometry();
            RenderGeometry[num].vertices.push(new THREE.Vector3().copy(mesh.mesh_face[highlight_face_id].center_pos));
            RenderGeometry[num].vertices.push(new THREE.Vector3().copy(he.vert.pos));
            RenderGeometry[num].colors.push(new THREE.Color( 0x156289 ),new THREE.Color( 0x156289 ));
            RenderGeometry[num].translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);   
            RenderGeometry[num].scale(mesh_scale,mesh_scale,mesh_scale);

            Renderline[num]=new THREE.Line(RenderGeometry[num],LineRenderMaterial,THREE.LineSegments);
            num++;
            scene2.add(Renderline[num]);
            he=he.next;
        }while(he!=start);

        mesh.BaryCentricSubdivision(highlight_face_id);

        //Do this to make sure the hightlight elements are the last to be rendered.
        scene2.remove(highlight_edge);
        scene2.remove(highlight_face);
        scene2.remove(highlight_point);

        highlight_edge=new THREE.Line();
        highlight_edge.material=LineRenderMaterial;
        highlight_edge.geometry=new THREE.Geometry();
        highlight_edge.geometry.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000));
        highlight_point=new THREE.Points();
        highlight_point.material=PointRenderMaterial;

        scene2.add(highlight_edge);
        scene2.add(highlight_face);
        scene2.add(highlight_point);

        updateDualStructure();
        console.log(mesh);

    }
    function keyEvent(event)
    {
        var keynum= window.event ? event.keyCode : event.which;
        var keychar = String.fromCharCode(keynum);
        var highlight_edge_geo=new THREE.Geometry();
        highlight_edge_geo.colors.push(new THREE.Color(0xFFFF00),new THREE.Color(0xFF0000))
        var highlight_point_geo=new THREE.Geometry();
        highlight_point_geo.colors.push(new THREE.Color(0xFF0000));
        var highlight_face_geo=undefined;

        if(highlight_edge_id!=undefined)
        {

            if(keychar=='N')
            {
                highlight_edge_id=mesh.mesh_half_edge[highlight_edge_id].next.id;
                highlight_edge_geo.vertices[0]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos);
                highlight_edge_geo.vertices[1]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].vert.pos);

                highlight_edge_geo.translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);  

                highlight_edge_geo.scale(mesh_scale,mesh_scale,mesh_scale);
                highlight_edge.geometry=highlight_edge_geo;
            }
            else if(keychar=='S')
            {
                highlight_edge_id=mesh.mesh_half_edge[highlight_edge_id].sym.id;
                highlight_edge_geo.vertices[0]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos);
                highlight_edge_geo.vertices[1]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].vert.pos);
                highlight_edge_geo.translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);  

                highlight_edge_geo.scale(mesh_scale,mesh_scale,mesh_scale);
                highlight_edge.geometry=highlight_edge_geo;

            }    
            else if(keychar=='F')
            {
                highlight_face_id=mesh.mesh_half_edge[highlight_edge_id].face.id;
                var he=mesh.mesh_face[highlight_face_id].startedge;
                var PolyShape= new THREE.Shape();
                PolyShape.moveTo(he.vert.pos.x,he.vert.pos.y);
                do
                {
                    he=he.next;
                    PolyShape.lineTo(he.vert.pos.x,he.vert.pos.y);
                }while(he!=mesh.mesh_face[highlight_face_id].startedge);
                highlight_face_geo=new THREE.ShapeGeometry(PolyShape);
                highlight_face_geo.translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);  
                highlight_face_geo.scale(mesh_scale,mesh_scale,mesh_scale);
                highlight_face.geometry=highlight_face_geo;
                
                highlight_edge_id=undefined;
                highlight_edge.geometry=new THREE.Geometry();
            }
            else if(keychar=='V')
            {
                highlight_point_id=mesh.mesh_half_edge[highlight_edge_id].vert.id;
                highlight_point_geo.vertices[0]=new THREE.Vector3().copy(mesh.mesh_vertex[highlight_point_id].pos);
                highlight_point_geo.translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);  
                highlight_point_geo.scale(mesh_scale,mesh_scale,mesh_scale);
                highlight_point.geometry=highlight_point_geo;

                
                highlight_edge_id=undefined;
                highlight_edge.geometry=new THREE.Geometry();
            }    

        }
        else if(highlight_point_id!=undefined)
        {
            if(keychar=='L')
            {
                highlight_edge_id=mesh.mesh_vertex[highlight_point_id].edge.id;
                highlight_edge_geo.vertices[0]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos);
                highlight_edge_geo.vertices[1]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].vert.pos);
                highlight_edge_geo.translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);  
                highlight_edge_geo.scale(mesh_scale,mesh_scale,mesh_scale);
                highlight_edge.geometry=highlight_edge_geo;
                
                highlight_point_id=undefined;
                highlight_point.geometry=new THREE.Geometry();
            }
        }
        else if(highlight_face_id!=undefined)
        {
            if(keychar=='L')
            {
                highlight_edge_id=mesh.mesh_face[highlight_face_id].startedge.id;
                highlight_edge_geo.vertices[0]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].sym.vert.pos);
                highlight_edge_geo.vertices[1]=new THREE.Vector3().copy(mesh.mesh_half_edge[highlight_edge_id].vert.pos);
                highlight_edge_geo.translate(-mesh.mesh_face[mesh.external_face_ID].center_pos.x,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.y,
                -mesh.mesh_face[mesh.external_face_ID].center_pos.z);  
                highlight_edge_geo.scale(mesh_scale,mesh_scale,mesh_scale);

                highlight_edge.geometry=highlight_edge_geo;

                highlight_face_id=undefined;
                highlight_face.geometry=new THREE.Geometry();
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
    function animate()
    {
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
        console.log(camera);
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
        datgui=new dat.GUI();
        datgui.add(guiList.LoadGeometry,'Load_geometry_file');
        datgui.add(guiList.Barycentric_Subdivision,'Barycentric_Subdiv');

        
        viewResize();
        animate();
    	//renderer.render(scene,camera);

    }
})();
    
