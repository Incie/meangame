var hexEditor = angular.module('hexeditor', []);

hexEditor.controller('hexcontroller', ['$scope', function ($scope) {
    var win = {width: window.innerWidth, height: window.innerHeight};

    $scope.onSize = function () {
        win.width = window.innerWidth;
        win.height = window.innerHeight;

        console.log(win);

        camera.right = win.width;
        camera.bottom = win.height;
        camera.updateProjectionMatrix();

        $scope.renderer.setSize(win.width, win.height);
    };

    var scene = new THREE.Scene();
    $scope.renderer = new THREE.WebGLRenderer({antialias: true});
    var editorView = document.getElementById('hexeditorview');
    editorView.appendChild($scope.renderer.domElement);

    var camera = new THREE.OrthographicCamera(0, 150, 0, 150, -5000, 5000);
    camera.position.x = -win.width / 2;
    camera.position.y = -win.height / 2;
    camera.position.z = 500;

    $scope.onSize();

    var firstScene = new HexagonScene($scope.renderer, camera);
    scene.add(firstScene.sceneNode);


    var render = function () {
        requestAnimationFrame(render);

        firstScene.update();
        $scope.renderer.render(scene, camera);
        updateStats();
    };

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

    $scope.colors = [
        {name: 'void', color: 0x000000},
        {name: 'water', color: 0x6688dd},
        {name: 'land', color: 0xffffff}
    ];

    $scope.selectedColor = $scope.colors[2];
    firstScene.setColor($scope.selectedColor);

    $scope.$watch('selectedColor', function(newvalue){
        console.log(newvalue);
        firstScene.setColor(newvalue);
    });

    render();
}]);

hexEditor.directive('hexeditorgui', function () {
    return {
        templateUrl: '/templates/editorinterface.html'
    };
});

hexEditor.directive('onResize', ['$window', function ($window) {
    return {
        transclude: true,
        link: function (scope, element, attrs) {
            angular.element($window).on('resize', function () {
                    scope.onSize();
                }
            );
        }
    };
}]);