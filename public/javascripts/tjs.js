var tjs = function() {
    var scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({antialias: true});

    var camera = new THREE.OrthographicCamera(0, 150, 0, 150, -5000, 5000);
    camera.position.x = 300;
    camera.position.y = 300;
    camera.position.z = 500;


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
        rendererStats.update($scope.renderer);
        stats.update();
    };

    var updateSize = function(){
        camera.right = win.width;
        camera.bottom = win.height;
        camera.updateProjectionMatrix();

        $scope.renderer.setSize(win.width, win.height);
    }


    return {
        win: {width: window.innerWidth, height: window.innerHeight},
        render: function () {
            requestAnimationFrame(render);

            firstScene.update();
            $scope.renderer.render(scene, camera);
            updateStats();
        },
        resize: function(width, height){
            win.width = window.innerWidth;
            win.height = window.innerHeight;
            updateSize();
        },
        setDomElement: function(domElement){
            domElement.appendChild(renderer.domElement);
        },
        addSceneObject: function(object){
            scene.add(object);
        },
        rendererEventListener: function(type, callback){
            renderer.addEventListener(type, callback);
        }
    };
};