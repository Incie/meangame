var hexagonboard = function(map) {
    var mapWidth = Number(map.size.x);
    var mapHeight = Number(map.size.y);
    var board = new Array(mapWidth*mapHeight);

    var sceneObject = new THREE.Object3D();
    sceneObject.name = 'hexagons';

    var radius = 20;
    var hexWidth = radius * 2;
    var hexHeight = Math.sqrt(3) / 2 * hexWidth;
    var hexGeometry = new THREE.CylinderGeometry( radius, radius-3, 10, 6 );
    function createHex(posX, posY, type) {
        var color = '#111111';
        if( type == 1 ) color = '#6688dd';
        else if( type == 2 ) color = '#efde8d';
        else if( type == 3 ) color = '#af8e2d';

        var hexMaterial = new THREE.MeshPhongMaterial( { color: color, wireframe: false, shininess: 1.0} );
        var hexMesh = new THREE.Mesh( hexGeometry, hexMaterial );

        hexMesh.rotation.set( 1.57, 1.57, 0);
        hexMesh.position.set( posX * (hexWidth / 4 * 3), posY * hexHeight, 0 );
        if( (posX % 2) == 1 )
            hexMesh.position.y += hexHeight / 2;

        hexMesh.updateMatrix();
        return hexMesh;
    }

    map.data.forEach( tile => {
        let hexObject = createHex(tile.x, tile.y, tile.type);
        hexObject.userData.x = tile.x;
        hexObject.userData.y = tile.y;
        hexObject.userData.type = tile.type;
        sceneObject.add( hexObject );

        if( tile.move !== undefined ) {
            let tileObject = planeGenerator.tile(tile.move);
            tileObject.name = 'move';
            hexObject.add(tileObject);
            hexObject.material.color.setHex(tile.move.color);
            hexObject.userData.hexColor = tile.move.color;
        }

        if( tile.type == 3 )
            hexObject.add( planeGenerator.city(tile.city) );
    });

    return {
        sceneObject: sceneObject
    };
};

var planeGenerator = (function() {
    var cityTextures = {
        textures: [
            {name: "religion", map: THREE.ImageUtils.loadTexture('/img/buddhism64.png')},
            {name: "trade", map: THREE.ImageUtils.loadTexture('/img/eastindia64.png')},
            {name: "politics", map: THREE.ImageUtils.loadTexture('/img/politics64.png')},

            {name: "samurai", map: THREE.ImageUtils.loadTexture('/img/samurai64.png')},
            {name: "1", map: THREE.ImageUtils.loadTexture('/img/1.png')},
            {name: "2", map: THREE.ImageUtils.loadTexture('/img/2.png')},
            {name: "3", map: THREE.ImageUtils.loadTexture('/img/3.png')},
            {name: "4", map: THREE.ImageUtils.loadTexture('/img/4.png')},
            {name: "ronin", map: THREE.ImageUtils.loadTexture('/img/ronin64.png')},
            {name: "boat", map: THREE.ImageUtils.loadTexture('/img/sailboat64.png')}
        ],
        get: function(name){return this.textures.find( function(tex){return tex.name==name;} ); }
    };

    function getCityProperties(count){
        if( count == 1 ) return { properties: [ {radius: 20, x: 0, y: 0} ] };
        if( count == 2 ) return { properties: [ {radius: 10, x: -0, y: -5}, {radius: 10, x: 0, y: 5} ] };
        return { properties: [ {radius: 10, x: 5, y: 0}, {radius: 10, x: -5, y: 5}, {radius: 10, x: -5, y: -5} ] };
    }

    function addSingleObject(name, map, xTranslate, zTranslate, radius, radiusY){
        var planeMaterial = new THREE.MeshPhongMaterial({color: 0xFFFFFF, shininess: 1.0, map: map, transparent: true});
        var planeGeometry = new THREE.BoxGeometry(radius, radiusY || radius, 0.1, 1, 1, 1);
        var planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.position.y += 50;
        planeMesh.position.x += xTranslate;
        planeMesh.position.z += zTranslate;
        planeMesh.rotation.x = Math.PI/2;
        planeMesh.rotation.z = Math.PI/2;
        planeMesh.name = name;

        return planeMesh;
    }

    function city(properties) {
        var count = 0;
        var cities = [];
        for( key in properties ) {
            if( !properties.hasOwnProperty(key) )
                continue;

            count ++;
            var textureObject = cityTextures.get(key);
            if( textureObject === undefined ){
                console.log('invalid city type', key);
                continue;
            }

            cities.push(textureObject);
        }

        var cityObject = new THREE.Object3D();
        cityObject.name = 'city';

        var cityProperties = getCityProperties(count);
        for( var i = 0; i < cities.length; i += 1 ){
            var property = cityProperties.properties[i];
            cityObject.add( addSingleObject(cities[i].name, cities[i].map, property.x, property.y, property.radius) );
        }

        return cityObject;
    }

    function tile(card){
        var numberTexture = cityTextures.get(card.size);
        var typeTexture = cityTextures.get(card.suite);
        var properties = getCityProperties(2);

        var tileObject = new THREE.Object3D();
        tileObject.name = 'tempTurn';
        tileObject.userData.card = card;
        tileObject.add( addSingleObject(card.suite, typeTexture.map, properties.properties[0].x, properties.properties[0].y, properties.properties[0].radius) );
        tileObject.add( addSingleObject(card.size, numberTexture.map, properties.properties[1].x, properties.properties[1].y, properties.properties[1].radius) );
        return tileObject;
    }

    return {
        city: city,
        tile: tile
    };
})();