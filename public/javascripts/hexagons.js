
var HexagonScene = function(renderer, camera) {

	var baseObject = new THREE.Object3D();
    var hexagons = new THREE.Object3D();

    var radius = 20;
	var geometry = new THREE.CylinderGeometry( radius, radius-3, 10, 6 );

    for( var y = 0; y < 30; y += 1 ){
        for( var x = 0; x < 20; x += 1 ){
            var material = new THREE.MeshPhongMaterial( { color: 0x6688dd, wireframe: false, shininess: 1.0 } );
            var hexagon = new THREE.Mesh( geometry, material );
            hexagon.rotation.y = Math.PI / 2;
            hexagon.rotation.x = Math.PI / 2;

            var width = radius * 2;
            var height = Math.sqrt(3) / 2 * width;

            hexagon.position.x += x * (width / 4 * 3);
            hexagon.position.y += y * height;

            if( (x % 2) == 1 ){
                hexagon.position.y += height / 2;
            }

            hexagons.add(hexagon);
        }
    }

    baseObject.add(hexagons);

    var amblientLight = new THREE.AmbientLight( 0x202020 );
    baseObject.add( amblientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
    directionalLight.position.set( 0, 0.5, -1 );
    baseObject.add( directionalLight );

    var moveCamera = false;
    var paintHexagons = false;
    renderer.domElement.addEventListener( 'mousedown', function(event) {
        if( event.button == 2 ){
            moveCamera = true;
            event.preventDefault();
        }

        if( event.button == 0 ){
            paintHexagons = true;
        }
    });

    renderer.domElement.addEventListener( 'mouseup', function(event) {
        if( event.button == 2 ){
            moveCamera = false;
            event.preventDefault();
        }
        if( event.button == 0 )
            paintHexagons = false;
    });

    renderer.domElement.addEventListener('contextmenu', function(event){
        event.preventDefault();
        return false;
    });


    var rayPacket = { raycaster: new THREE.Raycaster(), mouse: new THREE.Vector2() };

    var highlightedObject;

    renderer.domElement.addEventListener( 'mousemove', function(event) {
        if( moveCamera ){
            camera.position.x -= event.movementX;
            camera.position.y -= event.movementY;
        }else {
            if( highlightedObject !== undefined && highlightedObject.obj !== undefined ){
                console.log(highlightedObject);
                highlightedObject.obj.material.color.set( highlightedObject.color );
                highlightedObject = undefined;
            }

            rayPacket.mouse.set( event.clientX / window.innerWidth * 2 - 1.0, (window.innerHeight - event.clientY) / window.innerHeight * 2 - 1.0 );
            rayPacket.raycaster.setFromCamera(rayPacket.mouse, camera);

            var intersects = rayPacket.raycaster.intersectObjects( hexagons.children );

            if( intersects.length > 0 ){
                var obj = intersects[0].object;
                var oldColor = obj.material.color.clone();

                highlightedObject = {
                    color: oldColor,
                    obj: obj
                };

                obj.material.color.multiplyScalar(0.5);

                if( paintHexagons ){
                    highlightedObject.color.set(color.color);
                    highlightedObject.obj.material.color.set(color.color);
                    highlightedObject.obj.material.color.multiplyScalar(0.5);
                }
            }
        }
    });

    camera.position.z = 50;

    var color = { };

	return {
		sceneNode: baseObject,
		update: function() {},
        setColor: function(c){ color = c; }
	}
};