var hexEditor = angular.module('hexeditor', []);

hexEditor.controller('hexcontroller', ['$scope', '$http', function ($scope, $http) {
    $scope.TJS = new tjs();

    $scope.metadata = {
      name: '',
      size: { x: 5, y: 5 }
    };

    $scope.colors = [
        {name: 'void', color: 0x000000, typeId: 0},
        {name: 'water', color: 0x6688dd, typeId: 1},
        {name: 'land', color: 0xefde8d, typeId: 2},
        {name: 'city', color: 0xaf8e2d, typeId: 3}
    ];

    $scope.selectedColor = $scope.colors[2];

    var normalizedMouseCoords = {x:0, y:0};
    var moveCamera = false;
    var paintHexagons = false;
    var hoverObject = {oldColor: new THREE.Color};
    var camera = $scope.TJS.getCamera();

    var onMouseDown = function(event) {
        if( event.button == 0 ){
            paintHexagons = true;
            hoverAndPaint();
        }

        if( event.button == 2 ){
            moveCamera = true;
            event.preventDefault();
        }

        if( event.button == 0 ){
            paintHexagons = true;
        }
    };

    var onMouseUp = function(event) {
        if( event.button == 0 ){
            paintHexagons = false;
        }

        if( event.button == 2 ){
            moveCamera = false;
            event.preventDefault();
        }
    };

    var onContextMenu = function(event){
        event.preventDefault();
        return false;
    };

    var onMouseMove = function(event) {
        normalizedMouseCoords.x = (event.clientX / window.innerWidth) * 2 - 1;
        normalizedMouseCoords.y = -(event.clientY / window.innerHeight) * 2 + 1;

        if( moveCamera ){
            camera.position.x -= event.movementX;
            camera.position.y -= event.movementY;
        }

        hoverAndPaint();
    };

    var hoverAndPaint = function() {
        if( hoverObject.obj !== undefined ){
            hoverObject.obj.material.color.copy( hoverObject.oldColor );
            hoverObject.obj = undefined;
        }

        var hexagons = hexagonBoard.sceneNode.getObjectByName('hexagons');

        if( hexagons === undefined )
            return;

        var result = $scope.TJS.raycaster(hexagons.children, normalizedMouseCoords);
        if( result.success ){
            hoverObject.obj = result.object;
            hoverObject.oldColor.copy(result.object.material.color);

            result.object.material.color.multiplyScalar(0.75);
        }

        if( paintHexagons ){
            if( hoverObject.obj !== undefined ){
                hoverObject.obj.material.color.setHex($scope.selectedColor.color);
                hoverObject.obj.material.color.multiplyScalar(0.75);
                hoverObject.oldColor.setHex($scope.selectedColor.color);
            }
        }
    };

    var onMouseWheel = function(event){
        var zoom = 1;
        if( event.wheelDelta < 0 )
            zoom = -1;

        var camera = $scope.TJS.getCamera();
        camera.zoom += zoom * 0.1;
        camera.zoom = Math.max(camera.zoom, 0.3);


        $scope.TJS.getCamera().updateProjectionMatrix();
    };

    $scope.TJS.rendererEventListener('mousewheel', onMouseWheel);
    $scope.TJS.rendererEventListener('mousedown', onMouseDown);
    $scope.TJS.rendererEventListener('mouseup', onMouseUp);
    $scope.TJS.rendererEventListener('mousemove', onMouseMove);
    $scope.TJS.rendererEventListener('contextmenu', onContextMenu);

    $scope.setupBoard = function(){
        hexagonBoard.createBoard($scope.metadata.size.x, $scope.metadata.size.y, $scope.selectedColor);
        camera.position.set( hexagonBoard.bounds.centerX - window.innerWidth/2, hexagonBoard.bounds.centerY - window.innerHeight/2, 500);
    };

    $scope.sendBoard = function(){
        var board = hexagonBoard.export();
        var size = hexagonBoard.size;
        var name = $scope.metadata.name;

        $http.post( '/api/maps/post', {name: name, size: size, data: board }).then( function(response){
            console.log('postsuccess ', response);
        },
        function(response){
            console.log('posterror ', response);
        });
    };

    var hexagonBoard = HexagonBoard();
    $scope.TJS.addSceneObject(hexagonBoard.sceneNode);

    $scope.TJS.setDomElement(document.getElementById('hexeditorview'));
    $scope.TJS.render();
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
            scope.TJS.resize($window.innerWidth, $window.innerHeight);
            angular.element($window).on('resize', function () {
                    scope.TJS.resize($window.innerWidth, $window.innerHeight);
                }
            );
        }
    };
}]);