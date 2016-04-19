(function () {
    var gameModule = angular.module('gamemodule', ['ngCookies']);

    gameModule.controller('gamecontroller', ['$scope', '$http', '$cookies', '$window', '$timeout', '$interval', function ($scope, $http, $cookies, $window, $timeout, $interval) {
        $scope.title = 'meow';
        $scope.renderer = {};
        $scope.player = {};
        $scope.lastmessage = 'message';
        $scope.hasNewMessage = false;
        $scope.playerStyle = {'background-color': '#ff0000' };
        $scope.reversedMoves = [];

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

        $scope.updateCycle = function() {
            if( $scope.game === undefined ){
                console.log('UpdateCycle: No game object found');
                return;
            }

            if( $scope.updateInterval ){
                $interval.cancel($scope.updateInterval);
                $scope.updateInterval = null;
            }

             $scope.updateInterval = $interval( function() {
                var url = '/api/game/'+ $scope.game.gameid +'/tick';
                var data = {lastTurn: $scope.game.turnCounter};
                $http.post( url, data )
                    .then( function(response) {
                        if( response.data.update ){
                            $scope.setupGame();
                        }
                    } )
                    .catch(function(error){
                        console.log('tick-error', error);
                    });
            }, 5000);
        };

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
            $scope.renderer.TJS.rendererEventListener('mousemove', $scope.onMouseMove);
            $scope.renderer.TJS.rendererEventListener('mouseleave', $scope.onMouseLeave);

            $scope.cameraController = new cameracontroller($scope.renderer.TJS);
            $scope.renderer.TJS.render();
        };

        function toHexString(number){
            var hex = number.toString(16);
            while( hex.length < 6 )
                hex = '0' + hex;
            return '#' + hex;
        }

        $scope.setupGame = function (centerMap) {
            var gameid = $cookies.get('gameid');
            $http.get('/api/game/' + gameid).then(function (response) {
                console.log(gameid, 'response', response);

                $scope.renderer.TJS.removeSceneObject('hexagons');

                if( !response.data.success ){
                    console.log('Error getting game: ', gameid);
                    console.log('Error message: ', response.data.error);
                    return;
                }

                var gameObject = response.data.game;
                $scope.game = gameObject;
                $scope.player = gameObject.player;
                $scope.playerStyle['background-color'] = toHexString($scope.player.color);
                var map = gameObject.map;
                var hexBoard = hexagonboard(map);
                $scope.hexWire = hexBoard.hexWire;
                $scope.renderer.TJS.addSceneObject(hexBoard.sceneObject);
                $scope.message('Game Updated');

                $scope.reversedMoves = gameObject.moveList.reverse();
                $scope.updateCycle();

                if( centerMap ){
                    $scope.cameraController.centerCameraOn( hexBoard.sceneObject );
                }

            }).catch(function (error) {
                console.log(gameid, 'error', error);
            });
        };

        function capitalFirstLetter(str){
            return str.charAt(0).toUpperCase() + str.substr(1);
        }

        $scope.onMouseLeave = function() {
            $scope.clearHover();
        };

        $scope.onMouseMove = function(event){
            let hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
            if( !hexagons ) {
                $scope.clearHover();
                return;
            }

            var obj = $scope.renderer.TJS.raycaster(hexagons.children, {x: event.offsetX, y: event.offsetY} );

            if( !obj.success ){
                $scope.clearHover();
                return;
            }

            var tileText = [];
            var userData = obj.object.userData;

            if( userData.type == 3 ){
                tileText.push( 'City Tile' );
                tileText.push( 'Resources:');

                let tilesAroundCity = boardHelper.findTilesAround(obj.object, hexagons);
                let players = [];
                $scope.game.state.forEach( function(playerState) {
                    players.push( {name: playerState.player, influence: 0 });
                });

                for( var resource in userData.city ) {
                    players.forEach( p => {p.influence = 0});
                    tilesAroundCity.forEach( function(tile){
                        if( !tile.userData.move ) return;

                        let playerInfluence = players.find( p => p.name == tile.userData.move.player );

                        let suite = tile.userData.move.suite;
                        if( suite == 'boat' || suite == 'ronin' || suite == 'samurai' || suite == resource )
                            playerInfluence.influence += tile.userData.move.size;
                    });

                    let type = capitalFirstLetter(resource);
                    let resourceString = type +':';
                    players.forEach(p => {
                        resourceString += '['+p.name +'('+p.influence+')]';
                    });
                    tileText.push( resourceString );
                }
            }
            else if( userData.type == 2 ) tileText.push('Land Tile');
            else if( userData.type == 1 ) tileText.push('Water Tile');

            if( userData.move )
                tileText.push( 'Move: ' + userData.move.player+'\'s [' + capitalFirstLetter(userData.move.suite) + ' ' +userData.move.size +']');


            $scope.setHover(tileText);
            $scope.setHoverPosition(event.offsetX, event.offsetY);
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
                if( $scope.game.playerTurn != $scope.game.player.turn ){
                    $scope.message('Wait your turn');
                    return;
                }


                var card = $scope.getSelectedPlayerCard();
                if (!card)
                    return;

                if (card.quick === undefined || card.quick == false) {
                    if ($scope.hasPlayedNormal()) {
                        $scope.message('already played normal card');
                        return;
                    }
                }

                var mouseCoords = {x: event.clientX, y: event.clientY};

                var hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
                var result = $scope.renderer.TJS.raycaster(hexagons.children, mouseCoords);
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
                    hex.userData.hexColor = $scope.player.color;

                    card.played = true;
                    $scope.clearSelected();
                }
            });
        };

        $scope.getNumberSource = function (number) {
            return '/img/' + number + '.png';
        };
        $scope.getSuiteSource = function (suite) {
            return '/img/' + suite + '64.png';
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

        $scope.playerTurn = function(index){
            if( index == ($scope.game.turnCounter % $scope.game.numPlayers) )
                return '%';
            return '\xa0';
        };

        $scope.highlightedHexes = [];


        $scope.clearHighlights = function(){
            let hexagons = $scope.renderer.TJS.getSceneObject('hexagons');
            hexagons.children.forEach( hex => {
                if( hex.userData.hexColor ){
                    hex.material.color.setHex(hex.userData.hexColor);
                    hex.material.emissive.setRGB(0,0,0);
                }
            });
        };

        $scope.highlightMove = function(moveIndex){
            var moveObject = $scope.reversedMoves[moveIndex];

            $scope.clearHighlights();

            if( !moveObject )
                return;

            var hexagons = $scope.renderer.TJS.getSceneObject('hexagons');

            hexagons.children.forEach( hex => {
                if( !hex.userData.hexColor ) return;
                hex.material.color.multiplyScalar( 0.3 );
            });

            moveObject.moves.forEach( function(move){
                var hex = hexagons.children.find( function(hex) { return (hex.userData.x == move.x && hex.userData.y == move.y) } );
                hex.material.color.setHex( hex.userData.hexColor );

                const v = 0.1;
                hex.material.emissive.setRGB(v,v,v);
            });
        };

        $scope.toggleCard = function (index) {
            $scope.clearSelected();

            if( $scope.game.playerTurn != $scope.game.player.turn ){
                $scope.message('Wait your turn');
                return;
            }

            if ($scope.player.hand[index].played)
                return;

            $scope.player.hand[index].selected = !$scope.player.hand[index].selected;
        };

        $scope.getCurrentPlayerName = function() {
            if( $scope.game === undefined ) return '-,-';
            return $scope.game.state[ $scope.game.playerTurn ].player;
        };
        $scope.getCurrentPlayerColor = function(){
            if( $scope.game === undefined ) return '-,-';

            return $scope.game.state[ $scope.game.playerTurn ].color;
        };
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

    gameModule.directive('turnIndicator', function() {
        return {
            restrict: 'E',
            templateUrl: '/templates/turnindicator.html'
        };
    });

    gameModule.directive('gameBoard', ['$window', function ($window) {
        return {
            restrict: 'E',
            transclude: true,
            templateUrl: '/templates/gameboard.html',
            link: function (scope, element) {
                console.log('Setting up Samurai..');
                scope.renderer.TJS = tjs();
                scope.renderer.TJS.setDomElement(element[0]);
                scope.setupRenderer();
                scope.setupGame(true);
            }
        };
    }]);

    gameModule.directive('rules', function() {
        return {
            restrict: 'E',
            templateUrl: '/templates/rules.html',
            link: function(scope){
                scope.hideRules = true;
                scope.toggleRules = function() {
                    scope.hideRules = !scope.hideRules;
                }
            }
        };
    });

    gameModule.directive('hover', function() {
        return {
            restrict: 'E',
            templateUrl: '/templates/hover.html',
            link: function(scope, elementArray){
                var el = elementArray[0];

                scope._hover = {
                    texts: [],
                    enabled: true
                };

                scope.setHoverPosition = function(x,y){
                    el.style.left = (x+50) +'px';
                    el.style.top = y+'px';
                };

                scope.setHover = function(hoverText) {
                    scope.$apply( function() {
                        scope._hover.texts = hoverText;
                        scope._hover.enabled = true;
                    });
                };

                scope.clearHover = function(){
                    scope.$apply( function() {
                        scope._hover.text = [];
                        scope._hover.enabled = false;
                    });
                }
            }
        }
    });
})();