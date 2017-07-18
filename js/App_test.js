window.onload = function(){
    'use strict'
     require(['config'],function(){
        require(['jquery','THREE','numeric','dat',''],function(jquery,THREE,numeric,dat){
            var OrbitControls = require('three-orbit-controls')(THREE)
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
            var geometry,mesh;
            var material;
            var guiControler,datgui;
            var axis;
            var Mouse1,Mouse2;
            var mousePositionDirty = false;
            var clicked=false;
            function onMouseMove( event ) {

                event.preventDefault();
                mouseScene1.x = ( event.clientX / window.innerWidth * 2 ) * 2 - 1;
                mouseScene1.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

                mouseScene2.x = mouseScene1.x - 2;
                mouseScene2.y = mouseScene1.y;

                mousePositionDirty = true;

            }
            function viewResize(){
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
            function keyEvent(event)
            {
                var keynum= window.event ? event.keyCode : event.which;
                var keychar = String.fromCharCode(keynum);
                if(keychar=='N')
                {
                     mesh.rotation.x+=guiControler.rotationx;
                }    
            
            }
            function render(){

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
            document.addEventListener('keydown',keyEvent,false);
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

            window.addEventListener('resize', viewResize, false);

            geometry=new THREE.BoxGeometry(20,20,20);
            material =new THREE.MeshBasicMaterial({
                color: 0x156289,
                opacity: 0.1,
                transparent: true,
                side: THREE.DoubleSide,
                depthWrite: false
                });
            mesh=new THREE.Mesh(geometry,material);
            mesh.position.x=0;
            mesh.position.y=0;
            mesh.position.z=0;
            scene1.add(mesh);

            axis = new THREE.AxisHelper(20);
            scene2.add(axis);

            camera.position.x=40;
            camera.position.y=40;
            camera.position.z=40;

            camera.lookAt(scene1.position);

            guiControler=new function(){
                this.rotationx=0.01;
                this.rotationy=0.01;
                this.rotationz=0.01;
            }
            datgui=new dat.GUI();
            datgui.add(guiControler,'rotationx',0,1);
            datgui.add(guiControler,'rotationy',0,1);
            datgui.add(guiControler,'rotationz',0,1);
            viewResize();
            render();
           
        })
     })
	
	//renderer.render(scene,camera);

}
    
