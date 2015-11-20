
var FirstScene = function(camera) {
	
	var baseObject = new THREE.Object3D();

	var geometry = new THREE.BoxGeometry( 250,250,250, 50, 50, 50 );
	var material = new THREE.MeshPhongMaterial( { color: 0x33aa33, wireframe: true } );
	var cube = new THREE.Mesh( geometry, material );
	baseObject.add( cube );

	var material2 = new THREE.MeshPhongMaterial( { color: 0xaa3333, wireframe: true } );
	var cube2 = new THREE.Mesh( geometry, material2 );
	cube2.scale.set(0.5, 0.5, 0.5);
	baseObject.add( cube2 );

	var material3 = new THREE.MeshPhongMaterial( { color: 0x3333aa, wireframe: true } );
	var cube3 = new THREE.Mesh( geometry, material3 );
	cube3.scale.set(0.25, 0.25, 0.25);
	baseObject.add( cube3 );

	camera.position.z = 500;

	var light = new THREE.AmbientLight( 0xffffff );
	baseObject.add( light );

	var pointLight = new THREE.PointLight( 0xffffff, 1, 100 );
	pointLight.position.set( 2,2,3 );
	baseObject.add( pointLight );


	
	return {
			sceneNode: baseObject,
			update: function() {
				cube.rotation.x += 0.02;
				cube.rotation.y += 0.01;
				
				cube2.rotation.x -= 0.02;
				cube2.rotation.y += 0.01;
				
				cube3.rotation.x += 0.02;
				cube3.rotation.y -= 0.01;	
			}
	}	
};