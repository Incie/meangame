var tjs = function() {
    var scene = new THREE.Scene();
    var renderer = new THREE.WebGLRenderer({antialias: true});
    var camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -5000, 5000);
    camera.position.set(300,300,500);
    camera.updateProjectionMatrix();
    scene.add(camera);

    //Statistics
    var statsElement = document.getElementById('stats');
    var stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '100px';
    statsElement.appendChild(stats.domElement);

    var rendererStats = new THREEx.RendererStats();
    rendererStats.domElement.style.right = '0px';
    statsElement.appendChild(rendererStats.domElement);

    var updateStats = function() {
        rendererStats.update(renderer);
        stats.update();
    };

    var renderScene = function() {
        requestAnimationFrame(renderScene);

        renderer.render(scene, camera);
        updateStats();
    };

    return {
        render:function () {renderScene();},
        resize:function(width, height){
            renderer.setSize(width, height);
            camera.right = width;
            camera.bottom = height;
            camera.updateProjectionMatrix();
        },
        setDomElement:function(domElement){
            domElement.appendChild(renderer.domElement);
        },
        addSceneObject:function(object){
            scene.add(object);
        },
        rendererEventListener:function(type, callback, scope){
            renderer.domElement.addEventListener(type, callback);
        },
        getCamera: function() { return camera; },
        raycaster: function(objects, mouseCoord){
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2(mouseCoord.x, mouseCoord.y);

            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(objects);

            if( intersects.length > 0 ){
                return { success: true, object: intersects[0].object };
            }

            return {success:false};
        }
    }
};