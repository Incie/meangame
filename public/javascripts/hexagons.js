var HexagonBoard = function() {
    var bounds = {
        x0: 0, y0: 0,
        x1: 0, y1: 0,
        centerX: 0, centerY: 0
    };

    var boardSize = {x:0, y:0};

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



    var getObjectAt = function(x,y){
        var hexagons = baseObject.getObjectByName('hexagons');
        var hexes = hexagons.children;
        for( var i = 0; i < hexes.length; i += 1 ){
            var hex = hexes[i];
            if( hex.userData.x == x && hex.userData.y == y )
                return hex;
        }
    };

	var baseObject = new THREE.Object3D();

    var createBoardFrom = function(boardObject, states){
        createBoard(boardObject.size.x, boardObject.size.y, states[0]);

        var hexagons = baseObject.getObjectByName('hexagons');
        var hexes = hexagons.children;

        var getObject = function(x,y){
            for( var i = 0; i < hexes.length; i += 1 ){
                var hex = hexes[i];
                if( hex.userData.x == x && hex.userData.y == y )
                    return hex;
            }
        };

        var getState = function(typeId){
            for( var s = 0; s < states.length; s+= 1){
                if(typeId == states[s].typeId)
                    return states[s];
            }
            return states[0];
        };

        boardObject.data.forEach(function(hexData){
            var state = getState(hexData.type);
            var hex = getObject(hexData.x, hexData.y);

            hex.material.color.setHex(state.color);
            hex.userData.type = state.typeId;

            if( state.typeId == 3 ){
                if( hexData.city !== undefined ){
                    hex.userData.city = hexData.city;
                    generateCityObjects(hex);
                }
            }
        });
    };

    var textures = [
        {name: "square", map: THREE.ImageUtils.loadTexture('/img/square.png')},
        {name: "circle", map: THREE.ImageUtils.loadTexture('/img/circle.png')},
        {name: "star", map: THREE.ImageUtils.loadTexture('/img/star.png')}
    ];

    var getTextureByName = function(name){
        for( var i = 0; i < textures.length; i += 1 ){
            if( textures[i].name == name )
                return textures[i];
        }

        return textures[2]; //TODO: replace with invalid texture
    };

    var addSingleObject = function(hex, name, map, xTranslate, zTranslate, radius){
        var planeMaterial = new THREE.MeshPhongMaterial({color: 0xFFFFFF, shininess: 1.0, map: map, transparent: true});
        var planeGeometry = new THREE.BoxGeometry(radius, radius, 0.1, 1, 1, 1);
        var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.position.y += 50;
        planeMesh.position.x += xTranslate;
        planeMesh.position.z += zTranslate;
        planeMesh.rotation.x = Math.PI / 2.0;
        planeMesh.name = name;
        hex.add(planeMesh);
    };

    var addSingleCityType = function(hex){
        var name;
        if( existsAndTrue(hex.userData.city.circle) )
            name = "circle";
        else if( existsAndTrue(hex.userData.city.star) )
            name = "star";
        else if( existsAndTrue(hex.userData.city.square) )
            name = "square";
        else {
            console.log("invalid citytype ", hex.userData.city);
            return;
        }

        addSingleObject(hex, name, getTextureByName(name).map, 0, 0, radius);
    };

    var existsAndTrue = function(object){
        if( object !== undefined ){
            if( object == true )
                return true;
        }
        return false;
    };

    var addDoubleCities = function(hex){
        var xTranslate = 0;
        var zTranslate = -5;
        var cityRadius = radius * 0.7;

        if( existsAndTrue(hex.userData.city.circle) ){
            addSingleObject(hex, "circle", getTextureByName("circle").map, xTranslate, zTranslate, cityRadius);
            zTranslate = 5;
        }

        if( existsAndTrue(hex.userData.city.square) ){
            addSingleObject(hex, "square", getTextureByName("square").map, xTranslate, zTranslate, cityRadius);
            zTranslate = 5;
        }

        if( existsAndTrue(hex.userData.city.star) ){
            addSingleObject(hex, "star", getTextureByName("star").map, xTranslate, zTranslate, cityRadius);
        }
    };

    var addAllCities = function(hex){
        var xTranslate = 5;
        var zTranslate = 0;
        var cityRadius = radius * 0.7;

        addSingleObject(hex, "circle", getTextureByName("circle").map, xTranslate, zTranslate, cityRadius);
        xTranslate = -5;
        zTranslate = 5;

        addSingleObject(hex, "square", getTextureByName("square").map, xTranslate, zTranslate, cityRadius);
        xTranslate = -5;
        zTranslate = -5;

        addSingleObject(hex, "star", getTextureByName("star").map, xTranslate, zTranslate, cityRadius);
    };

    var countCities = function(cityObject) {
        if( cityObject === undefined )
            return 0;

        var count = 0;
        if( cityObject.circle !== undefined && cityObject.circle == true )
            count += 1;

        if( cityObject.star !== undefined && cityObject.star == true )
            count += 1;

        if( cityObject.square !== undefined && cityObject.square == true )
            count += 1;

        return count;
    };

    var generateCityObjects = function(hex){
        var cityCount = countCities(hex.userData.city);

        removeAllCityObjects(hex);

        if( cityCount == 1 )
            addSingleCityType(hex);
        else if( cityCount == 2 ){
            addDoubleCities(hex);
        } else if( cityCount == 3 ){
            addAllCities(hex);
        }
    };

    var addCityElement = function(hex, type){
        if( hex.userData.city === undefined )
            hex.userData.city = {};

        hex.userData.city[type] = true;

        generateCityObjects(hex);
    };

    var removeAllCityObjects = function(hex){
        hex.remove( hex.getObjectByName('circle') );
        hex.remove( hex.getObjectByName('star') );
        hex.remove( hex.getObjectByName('square') );
    };

    var removeCityElement = function(hex, type) {
        if( hex === undefined ) return;
        if( hex.userData.city === undefined ) return;
        if( hex.userData.city[type] === undefined ) return;

        hex.userData.city[type] = false;
        generateCityObjects(hex);
    };

    var radius = 20;

    var createBoard = function(sizeX, sizeY, startState){
        baseObject.remove(baseObject.getObjectByName('hexagons'));

        var hexagons = new THREE.Object3D();
        hexagons.name = 'hexagons';


        var geometry = new THREE.CylinderGeometry( radius, radius-3, 10, 6 );

        var width = radius * 2;
        var height = Math.sqrt(3) / 2 * width;
        var halfPI = Math.PI / 2;

        boardSize.x = sizeX;
        boardSize.y = sizeY;

        for( var y = 0; y < sizeY; y += 1 ){
            for( var x = 0; x < sizeX; x += 1 ){
                var material = new THREE.MeshPhongMaterial( { color: startState.color, wireframe: false, shininess: 1.0} );
                var hexagon = new THREE.Mesh( geometry, material );
                hexagon.rotation.set( halfPI, halfPI, 0);
                hexagon.position.set( x * (width / 4 * 3), y * height, 0 );

                if( (x % 2) == 1 )
                    hexagon.position.y += height / 2;

                hexagon.userData.x = x;
                hexagon.userData.y = y;
                hexagon.userData.type = startState.typeId;

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

    var exportBoard = function() {
        var board = [];
        var hexagons = baseObject.getObjectByName('hexagons');

        for( var i = 0; i < hexagons.children.length; i += 1 ){
            var hex = hexagons.children[i];
            var boardObject = {x:hex.userData.x, y:hex.userData.y, type:hex.userData.type};

            if( boardObject.type == 3 && hex.userData.city !== undefined ){
                boardObject.city = {};
                var cities = ["circle", "star", "square"];
                cities.forEach(function(city){
                    if( existsAndTrue(hex.userData.city[city]) )
                        boardObject.city[city] = true;
                });
            }

            board.push( boardObject );
        }

        return board;
    };

    var showAll = function(){
        var hexagons = baseObject.getObjectByName('hexagons');

        if( hexagons === undefined )
            return;

        for( var i = 0; i < hexagons.children.length; i += 1 ){
            var child = hexagons.children[i];
            child.visible = true;
        }
    };

    var showOnly = function(type){
        var hexagons = baseObject.getObjectByName('hexagons');
        for( var i = 0; i < hexagons.children.length; i += 1 ){
            var child = hexagons.children[i];

            if( child.userData.type == type )
                child.visible = true;
            else
                child.visible = false;
        }
    };

	return {
		sceneNode: baseObject,
        bounds: bounds,
        size: boardSize,

        addCityElement: addCityElement,
        removeCityElement: removeCityElement,
        showOnly: showOnly,
        showAll: showAll,
        createBoard: createBoard,
        createBoardFrom: createBoardFrom,
        export: exportBoard
	}
};