var hexagonboard = function(map) {
    let sceneObject = new THREE.Object3D();
    sceneObject.name = 'hexagons';

    const radius = 20;
    const hexWidth = radius * 2;
    const hexHeight = Math.sqrt(3) / 2 * hexWidth;
    const hexGeometry = new THREE.CylinderGeometry( radius, radius-3, 10, 6 );

    function createHexWire( radius ){
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        const geometry = new THREE.Geometry();

        for( let i = 0; i <= 6; i += 1 ){
            const angle = i / 6.0 * (Math.PI * 2.0);
            const vertex = new THREE.Vector3(Math.sin(angle) * radius, 0.0, Math.cos(angle) * radius);
            geometry.vertices.push( vertex );
        }

        let line = new THREE.Line( geometry, material );
        line.name = 'hexWire';
        return line;
    }

    const hexWire = createHexWire(17);

    function createHex(posX, posY, type) {
        let color = '#111111';
        if( type == 1 ) color = '#6688dd';
        else if( type == 2 ) color = '#efde8d';
        else if( type == 3 ) color = '#af8e2d';

        const hexMaterial = new THREE.MeshPhongMaterial( { color: color, wireframe: false, shininess: 1.0} );
        let hexMesh = new THREE.Mesh( hexGeometry, hexMaterial );

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
            hexObject.userData.move = tile.move;
        }

        if( tile.type == 3 ) {
            hexObject.add( planeGenerator.city(tile.city) );
            hexObject.userData.city = tile.city;
        }
    });

    return {
        sceneObject: sceneObject,
        hexWire: hexWire
    };
};

var planeGenerator = (function() {
    var cityTextures = {
        textures: [
            {name: "religion", map: THREE.ImageUtils.loadTexture('/img/religion64.png')},
            {name: "trade", map: THREE.ImageUtils.loadTexture('/img/trade64.png')},
            {name: "politics", map: THREE.ImageUtils.loadTexture('/img/politics64.png')},
            {name: "samurai", map: THREE.ImageUtils.loadTexture('/img/samurai64.png')},
            {name: "1", map: THREE.ImageUtils.loadTexture('/img/1.png')},
            {name: "2", map: THREE.ImageUtils.loadTexture('/img/2.png')},
            {name: "3", map: THREE.ImageUtils.loadTexture('/img/3.png')},
            {name: "4", map: THREE.ImageUtils.loadTexture('/img/4.png')},
            {name: "ronin", map: THREE.ImageUtils.loadTexture('/img/ronin64.png')},
            {name: "boat", map: THREE.ImageUtils.loadTexture('/img/boat64.png')}
        ],
        get: function(name){return this.textures.find( function(tex){return tex.name==name;} ); }
    };

    function getCityProperties(count){
        if( count == 1 ) return { properties: [ {radius: 13, x: 0, y: 0} ] };
        if( count == 2 ) return { properties: [ {radius: 13, x: -0, y: -6}, {radius: 13, x: 0, y: 6} ] };
        return { properties: [ {radius: 11, x: 6, y: 0}, {radius: 11, x: -5, y: 6}, {radius: 11, x: -5, y: -6} ] };
    }

    function addSingleObject(name, map, xTranslate, zTranslate, radius, radiusY){
        const planeMaterial = new THREE.MeshPhongMaterial({color: 0xFFFFFF, shininess: 1.0, map: map, transparent: true});
        const planeGeometry = new THREE.BoxGeometry(radius, radiusY || radius, 0.1, 1, 1, 1);
        let planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
        planeMesh.position.y += 50;
        planeMesh.position.x += xTranslate;
        planeMesh.position.z += zTranslate;
        planeMesh.rotation.x = Math.PI/2;
        planeMesh.rotation.z = Math.PI/2;
        planeMesh.name = name;

        return planeMesh;
    }

    function city(properties) {
        let count = 0;
        let cities = [];
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

        let cityObject = new THREE.Object3D();
        cityObject.name = 'city';

        let cityProperties = getCityProperties(count);
        for( let i = 0; i < cities.length; i += 1 ){
            const property = cityProperties.properties[i];
            cityObject.add( addSingleObject(cities[i].name, cities[i].map, property.x, property.y, property.radius) );
        }

        return cityObject;
    }

    function tile(card){
        const numberTexture = cityTextures.get(card.size);
        const typeTexture = cityTextures.get(card.suite);
        const properties = getCityProperties(2);

        let tileObject = new THREE.Object3D();
        tileObject.name = 'tempTurn';
        tileObject.userData.card = card;
        tileObject.add( addSingleObject(card.suite, typeTexture.map, properties.properties[0].x, properties.properties[0].y, properties.properties[0].radius) );
        tileObject.add( addSingleObject(card.size, numberTexture.map, properties.properties[1].x, properties.properties[1].y, properties.properties[1].radius - 3) );
        return tileObject;
    }

    return {
        city: city,
        tile: tile
    };
})();

var boardHelper = ( function() {
    function findSurroundingTiles(tile, mapObject) {
        const tileOffsets = [{x: 0, y: 1}, {x: 0, y: -1}, {x: 1, y: 0}, {x: -1, y: 0}];
        const specialOffsets = [
            [{x: 1, y: -1}, {x: -1, y: -1}], //%2 == 0
            [{x: 1, y: 1}, {x: -1, y: 1}]  //%2 == 1
        ];

        let surroundingTiles = [];

        function findTilesFor(offset) {
            let t = mapObject.children.find(
                maptile =>
                    (offset.x + tile.userData.x) == maptile.userData.x &&
                    (offset.y + tile.userData.y) == maptile.userData.y
                );

            if (t)
                surroundingTiles.push(t);
        }

        let specialOffset = specialOffsets[tile.userData.x % 2];
        specialOffset.forEach(findTilesFor);
        tileOffsets.forEach(findTilesFor);
        return surroundingTiles;
    }

    return {
        findTilesAround: findSurroundingTiles
    };
})();