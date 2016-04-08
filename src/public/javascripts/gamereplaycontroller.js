(function () {
    var replayModule = angular.module('gameReplay', ['ngCookies']);

    replayModule.controller('replayController', ['$scope', '$http', '$cookies', '$window', '$timeout', '$interval',
        function ($scope, $http, $cookies, $window, $timeout, $interval) {
            $scope.renderer = {};
            $scope.currentTurn = -1;

            $scope.setupRenderer = function() {
                var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
                directionalLight.position.set(0, 0.5, -1);
                $scope.renderer.TJS.addSceneObject(directionalLight);

                $scope.renderer.TJS.resize($window.innerWidth, $window.innerHeight);
                angular.element($window).on('resize', function () {
                        $scope.renderer.TJS.resize($window.innerWidth, $window.innerHeight);
                    }
                );

                cameracontroller($scope.renderer.TJS);
                $scope.renderer.TJS.render();
            }

            $scope.setupBoard = function() {
                $http.get('/api/game-replay/'+$cookies.get('gameid')).then(function(response){
                    console.log(response.data);


                    var data = response.data;
                    if( data.success === false ){
                        return;
                    }
                    var gameObject = response.data.game;

                    $scope.currentTurn = gameObject.turnCounter;

                    console.log('Error', data.error);
                    $scope.game = gameObject;

                    var map = gameObject.map;
                    var hexBoard = hexagonboard(map);
                    $scope.renderer.TJS.addSceneObject(hexBoard.sceneObject);
                    $scope.message('Game Updated');
                });
            };

            $scope.simulateMove = function(move){
                var hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
                var tile = hexagons.children.find( function(tile) { return (tile.userData.x == move.x && tile.userData.y == move.y)});
                if( !tile ) {
                    console.log('tile not found for move', move);
                    return;
                }

                let tileObject = planeGenerator.tile(move);
                tileObject.name = 'move';
                tile.add(tileObject);
                tile.material.color.setHex(move.color);
            };

            $scope.advanceTurn = function(delta) {
                $scope.currentTurn += delta;
                $scope.clearMoves();

                $scope.game.moveList.every(function(moveObject){
                    moveObject.moves.forEach( function(move, index) {
                        if( index > $scope.currentTurn ){
                            return false;
                        }

                        $scope.simulateMove(move);
                        return true;
                    });
                });
            };

            $scope.clearMoves = function() {
                $scope.game.map.data.forEach(function(tile){
                    if( tile.move )
                    delete tile['move'];
                });

                var hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
                hexagons.children.forEach(function(hex){
                    if( hex.getObjectByName('move') ){
                        //reset color
                        hex.remove(hex.getObjectByName('move'));
                    }
                });
            }
        }
    ]);

    replayModule.directive('gameBoard', ['$window', function ($window) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: '/templates/replayboard.html',
            link: function (scope, element) {
                console.log('Setting up Samurai..');
                scope.renderer.TJS = tjs();
                scope.renderer.TJS.setDomElement(element[0]);
                scope.setupRenderer();
                scope.setupBoard();
            }
        };
    }]);
})();