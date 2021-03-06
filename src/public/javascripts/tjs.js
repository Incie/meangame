var tjs = function() {
    var scene = new THREE.Scene();
    var renderer = new THREE.WebGLRenderer({antialias: true});
    var camera = new THREE.OrthographicCamera(0, window.innerWidth, 0, window.innerHeight, -5000, 5000);
    camera.position.set(0,0,250);
    camera.updateProjectionMatrix();
    scene.add(camera);

    //Statistics
    var statsElement = document.getElementById('stats');
    var stats = new Stats();
    statsElement.appendChild(stats.domElement);

    var rendererStats = new THREEx.RendererStats();
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

            var halfSize = { x: width / 2, y: height / 2 };
            var centerPos = {x: camera.left + (camera.right-camera.left) / 2, y: camera.top + (camera.bottom-camera.top) / 2 };

            camera.left = centerPos.x - halfSize.x;
            camera.right = centerPos.x + halfSize.x;
            camera.top = centerPos.y - halfSize.y;
            camera.bottom = centerPos.y + halfSize.y;
            camera.updateProjectionMatrix();
        },
        setDomElement:function(domElement){
            domElement.appendChild(renderer.domElement);
        },
        addSceneObject:function(object){
            scene.add(object);
        },
        removeSceneObject: function(name){
            var oldObject = scene.getObjectByName(name);
            if( oldObject )
                scene.remove(oldObject);
        },
        getSceneObject: function(name){
            return scene.getObjectByName(name);
        },
        rendererEventListener:function(type, callback){
            renderer.domElement.addEventListener(type, callback);
        },
        getCamera: function() { return camera; },
        raycaster: function(objects, mouseCoord){
            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2( (mouseCoord.x / camera.right) * 2 - 1, -(mouseCoord.y / camera.bottom) * 2 + 1);

            raycaster.setFromCamera(mouse, camera);
            var intersects = raycaster.intersectObjects(objects);

            if( intersects.length > 0 ){
                return { success: true, object: intersects[0].object };
            }

            return {success:false};
        }
    }
};