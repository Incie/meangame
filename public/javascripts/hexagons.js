var HexagonBoard = function() {
    var bounds = {
        x0: 0, y0: 0,
        x1: 0, y1: 0,
        centerX: 0, centerY: 0
    };

    var calcBounds = function( sizeX, sizeY, width, height ){
        bounds.x0 = 0;
        bounds.y0 = 0;
        bounds.x1 = sizeX * (width / 4 * 3);
        bounds.y1 = sizeY * height;

        if( sizeY % 2 == 1 )
            bounds.y1 += 0.5 * height;

        bounds.centerX = bounds.x0 + (bounds.x1-bounds.x0)/2;
        bounds.centerY = bounds.y0 + (bounds.y1-bounds.y0)/2;

        console.log(bounds);
    };

	var baseObject = new THREE.Object3D();

    var createBoard = function(sizeX, sizeY, startingColor){
        baseObject.remove(baseObject.getObjectByName('hexagons'));

        var hexagons = new THREE.Object3D();
        hexagons.name = 'hexagons';

        var radius = 20;
        var geometry = new THREE.CylinderGeometry( radius, radius-3, 10, 6 );

        var width = radius * 2;
        var height = Math.sqrt(3) / 2 * width;
        var halfPI = Math.PI / 2;

        for( var y = 0; y < sizeY; y += 1 ){
            for( var x = 0; x < sizeX; x += 1 ){
                var material = new THREE.MeshPhongMaterial( { color: startingColor, wireframe: false, shininess: 1.0 } );
                var hexagon = new THREE.Mesh( geometry, material );
                hexagon.rotation.set( halfPI, halfPI, 0);
                hexagon.position.set( x * (width / 4 * 3), y * height, 0 );

                if( (x % 2) == 1 )
                    hexagon.position.y += height / 2;

                hexagons.add(hexagon);
            }
        }

        baseObject.add(hexagons);
        calcBounds(sizeX, sizeY, width, height);
    };

    var amblientLight = new THREE.AmbientLight( 0x202020 );
    baseObject.add( amblientLight );

    var directionalLight = new THREE.DirectionalLight( 0xffffff, 0.9 );
    directionalLight.position.set( 0, 0.5, -1 );
    baseObject.add( directionalLight );

	return {
		sceneNode: baseObject,
        createBoard: createBoard,
        bounds: bounds
	}
};