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
    var canvas;
    var scene1,scene2;
    var camera;
    var renderer;
    var mesh;
    //var RenderGeometry=[],Renderline=[];
    var RenderGeometry,RenderMesh;
    var RenderMaterial;
    var datgui;
    var axis;
    var Mouse1,Mouse2;
    var orbit;
    var guiList={
        LoadGeometry:undefined
    };
    var edgepair=[];

    function readJson(event)
    {
        'use strict'
        var files_list=event.target.files;
        var reader= new FileReader();
        var file=files_list[0];

        reader.readAsText(file, "UTF-8");
        reader.onload=buildMeshStructure;
    }
    function buildMeshStructure(event)
    {
        console.log("here");
        var json=JSON.parse(event.target.result);
        // var vertex=[];

        for(var v in json.vertices)
        {
            var vertex=new Vertex(v);
            vertex.pos=new THREE.Vector3(
                json.vertices[v][0],
                json.vertices[v][1],
                json.vertices[v][2]);
            mesh.mesh_vertex[v]=vertex;

        }
        for(var e in json.edges)
            edgepair[e]=new THREE.Vector2(
                json.edges[e][0],
                json.edges[e][1]);

    }

    function onMouseMove( event ) {
        'use strict'
        event.preventDefault();
        mouseScene1.x = ( event.clientX / window.innerWidth * 2 ) * 2 - 1;
        mouseScene1.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        mouseScene2.x = mouseScene1.x - 2;
        mouseScene2.y = mouseScene1.y;

        mousePositionDirty = true;

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
    function render(){
        'use strict'
        requestAnimationFrame( render );

        // ray caster temp test
        //pick();
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

        //Assign value for varables
        canvas = document.getElementById('WebGl_Canvas');
        scene1=new THREE.Scene;
        scene2=new THREE.Scene;
        views[0].scene=scene1;
        views[1].scene=scene2;

        Mouse1 = new THREE.Vector2();
        Mouse2 = new THREE.Vector2();

        camera=new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000);
        renderer=new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        renderer.setClearColor(new THREE.Color().setRGB( 0.9, 0.9, 0.9 ));
        renderer.setPixelRatio(window.devicePixelRatio);
        //renderer.setSize(window.innerWidth, window.innerHeight);

        var mesh=new Mesh();
        RenderGeometry=new THREE.BoxGeometry(20,20,20);
        RenderMaterial =new THREE.MeshBasicMaterial({
                color: 0x156289,
                opacity: 0.1,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
                });
        //RenderMaterial =new THREE.LineBasicMaterial({color:0x0000ff});
        RenderMesh=new THREE.Mesh(RenderGeometry,RenderMaterial);
        //Renderline=new THREE.Mesh(RenderGeometry,RenderMaterial);
        RenderMesh.position.x=0;
        RenderMesh.position.y=0;
        RenderMesh.position.z=0;
        scene1.add(RenderMesh);

        axis = new THREE.AxisHelper(20);
        scene2.add(axis);

        camera.position.x=40;
        camera.position.y=40;
        camera.position.z=40;

        camera.lookAt(scene1.position);
        orbit = new THREE.OrbitControls( camera, renderer.domElement);

        //Gui Initialization
        guiList.LoadGeometry={
            load_geometry_file: function(){
                 document.getElementById("files").click();

            }
        }
        datgui=new dat.GUI();
        datgui.add(guiList.LoadGeometry,'load_geometry_file');
        
        viewResize();
        render();
    	//renderer.render(scene,camera);

    }
})();
    
