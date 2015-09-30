var hexEditor = angular.module('hexeditor', []);

hexEditor.controller('hexcontroller', ['$scope', function ($scope) {
    var scene = new HexagonScene($scope.renderer, camera);
    tjs.addSceneObject(scene.sceneNode);

    $scope.colors = [
        {name: 'void', color: 0x000000},
        {name: 'water', color: 0x6688dd},
        {name: 'land', color: 0xefde8d},
        {name: 'city', color: 0xaf8e2d}
    ];

    $scope.selectedColor = $scope.colors[2];
    scene.setColor($scope.selectedColor);

    $scope.$watch('selectedColor', function(newvalue){
        scene.setColor(newvalue);
    });

    tjs.setDomElement(document.getElementById('hexeditorview'));
    tjs.render();
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
                    tjs.resize($window.innerWidth, $window.innerHeight);
                }
            );
        }
    };
}]);