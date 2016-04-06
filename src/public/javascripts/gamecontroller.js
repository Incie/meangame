(function () {
    var gameModule = angular.module('gamemodule', ['ngCookies']);

    gameModule.controller('gamecontroller', ['$scope', '$http', '$cookies', '$window', '$timeout', '$interval', function ($scope, $http, $cookies, $window, $timeout, $interval) {
        $scope.title = 'meow';
        $scope.renderer = {};
        $scope.player = {};
        $scope.lastmessage = 'message';
        $scope.hasNewMessage = false;
        $scope.playerStyle = {'background-color': '#ff0000' };

        $scope.message = function (msg) {
            $scope.lastmessage = msg;
            console.log(msg);

            $scope.hasNewMessage = true;
            console.log($scope.hasNewMessage);
            $timeout(function () {
                $scope.hasNewMessage = false;
                console.log($scope.hasNewMessage);
            }, 500);
        };
        $scope.clearMessage = function () {
            $scope.lastmessage = '';
        };

        //UpdateCycle
        $interval( function() {
            $cookies.put( 'lastTurn', $scope.game.turnCounter );
            $http.get( '/api/game/tick' )
                .then( function(response) {
                    console.log('tick', response.data);
                    if( response.data.update ){
                        $scope.setupGame();
                    }
                } )
                .catch(function(error){
                    console.log('tick-error', error);
                });
        }, 5000);

        $scope.setupRenderer = function () {
            var directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
            directionalLight.position.set(0, 0.5, -1);
            $scope.renderer.TJS.addSceneObject(directionalLight);

            $scope.renderer.TJS.resize($window.innerWidth, $window.innerHeight);
            angular.element($window).on('resize', function () {
                    $scope.renderer.TJS.resize($window.innerWidth, $window.innerHeight);
                }
            );

            $scope.renderer.TJS.rendererEventListener('mousedown', $scope.onMouseClick);

            cameracontroller($scope.renderer.TJS);
            $scope.renderer.TJS.render();
        };

        function toHexString(number){
            var hex = number.toString(16);
            while( hex.length < 6 )
                hex = '0' + hex;
            return '#' + hex;
        }

        $scope.setupGame = function () {
            var gameid = $cookies.get('gameid');
            $http.get('/api/game/' + gameid).then(function (response) {
                console.log(gameid, 'response', response);

                $scope.renderer.TJS.removeSceneObject('hexagons');

                var gameObject = response.data.game;
                $scope.game = gameObject;
                $scope.player = gameObject.player;
                $scope.playerStyle['background-color'] = toHexString($scope.player.color);
                var map = gameObject.map;
                var hexBoard = hexagonboard(map);
                $scope.renderer.TJS.addSceneObject(hexBoard.sceneObject);
                $scope.message('Game Updated');
            }).catch(function (error) {
                console.log(gameid, 'error', error);
            });
        };

        $scope.getSelectedPlayerCard = function () {
            for (var i = 0; i < $scope.player.hand.length; i += 1) {
                if ($scope.player.hand[i].selected)
                    return $scope.player.hand[i];
            }
        };

        $scope.onMouseClick = function (event) {
            if (event.button != 0)
                return;

            $scope.$apply(function () {
                var card = $scope.getSelectedPlayerCard();
                if (!card)
                    return;

                if (card.quick === undefined || card.quick == false) {
                    if ($scope.hasPlayedNormal()) {
                        $scope.message('already played normal card');
                        return;
                    }
                }

                var normalizedMouseCoords = {
                    x: (event.clientX / window.innerWidth) * 2 - 1,
                    y: -(event.clientY / window.innerHeight) * 2 + 1
                };

                var hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
                var result = $scope.renderer.TJS.raycaster(hexagons.children, normalizedMouseCoords);
                if (result.success) {
                    var hex = result.object;

                    if (hex.userData.type == 3 || hex.userData.type == 0) {
                        $scope.message('Invalid tile');
                        return;
                    }

                    if (hex.userData.type == 2 && card.suite == 'boat') {
                        $scope.message('Boats do not go on land');
                        return;
                    }

                    if (hex.userData.type == 1 && card.suite !== 'boat') {
                        $scope.message('Only boats go on water');
                        return;
                    }

                    hex.add(planeGenerator.tile(card));
                    hex.material.color.setHex($scope.player.color);

                    card.played = true;
                    $scope.clearSelected();
                }
            });
        };

        $scope.getScoreSource = function(scoreType){
            var type = scoreType;
            if (scoreType == 'religion') type = 'buddhism';
            if (scoreType == 'trade') type = 'eastindia';

            return '/img/' + type + '16.png';
        };
        $scope.getNumberSource = function (number) {
            return '/img/' + number + '.png';
        };
        $scope.getSuiteSource = function (suite) {
            var type = suite;
            if (suite == 'religion') type = 'buddhism';
            if (suite == 'trade') type = 'eastindia';
            if( suite == 'boat' ) type = 'sailboat';

            return '/img/' + type + '64.png';
        };

        $scope.finishTurn = function () {
            $scope.message('Finishing Turn...');

            var turnData = {
                moves: []
            };

            var hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
            hexagons.children.forEach(function (hex) {
                var temp = hex.getObjectByName('tempTurn');
                if (temp) {
                    turnData.moves.push({
                        suite: temp.userData.card.suite,
                        size: temp.userData.card.size,
                        x: hex.userData.x,
                        y: hex.userData.y
                    });
                }
            });

            console.log('posting turn', turnData);
            $http.put('/api/game/' + $cookies.get('gameid'), turnData)
                .then(function (response) {
                        console.log(response);
                        if (!response.data.success) {
                            $scope.message(response.data.error);
                        }
                        $scope.setupGame();
                        $scope.message('success, updating..');
                    }
                );
        };

        $scope.resetTurn = function () {
            $scope.message('reset turn');
            $scope.player.hand.forEach(function (card) {
                card.selected = false;
                card.played = false;
            });


            var hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
            hexagons.children.forEach(function (hex) {
                var temp = hex.getObjectByName('tempTurn');
                if (temp) {
                    if (hex.userData.type == 2) hex.material.color.setHex(0xefde8d);
                    if (hex.userData.type == 3) hex.material.color.setHex(0xaf8e2d);
                    if (hex.userData.type == 1) hex.material.color.setHex(0x6688dd);

                    hex.remove(temp);
                }
            });
        };

        $scope.hasPlayedNormal = function () {
            var playedNormal = false;
            $scope.player.hand.forEach(function (card) {
                if (!card.played)
                    return;

                if (card.suite == 'boat' || card.suite == 'ronin')
                    return;

                playedNormal = true;
            });
            return playedNormal;
        };

        $scope.clearSelected = function (exceptIndex) {
            $scope.player.hand.forEach(function (card, cardIndex) {
                if (exceptIndex == cardIndex)
                    return;
                card.selected = false;
            });
        };

        $scope.toggleCard = function (index) {
            $scope.clearSelected();

            if ($scope.player.hand[index].played)
                return;

            $scope.player.hand[index].selected = !$scope.player.hand[index].selected;
        }
    }]);

    gameModule.directive('playerInterface', function () {
        return {
            restrict: 'E',
            templateUrl: '/templates/playerinterface.html',
            link: function (scope, element) {}
        }
    });

    gameModule.directive('gameInfo', function() {
        return {
            restrict: 'E',
            templateUrl: '/templates/gameinfo.html'
        }
    });

    gameModule.directive('gameBoard', ['$window', function ($window) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: '/templates/gameboard.html',
            link: function (scope, element) {
                scope.renderer.TJS = tjs();
                scope.renderer.TJS.setDomElement(element[0]);
                scope.setupRenderer();
                scope.setupGame();
            }
        };
    }]);
})();