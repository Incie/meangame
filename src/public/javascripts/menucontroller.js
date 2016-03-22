var playModule = angular.module('menumodule', ['ngCookies', 'ui.router']);

playModule.factory('MapService', ['$http', function($http) {
    var mapservice = {};

    mapservice.maps = {};
    mapservice.selectedMap = {name:'waiting for server'};

    var getLastElement = function(a){
        if(a.length > 0)
            return a[a.length-1];
        return undefined;
    };

    $http.get('/api/maps').then(
        function(successResponse){
            console.log('maps returned');
            if( successResponse.success === false ){
                postMessage('error fetching maps ' + errorResponse.message);
                return;
            }

            mapservice.maps = successResponse.data.mapList;
            mapservice.selectedMap = mapservice.maps[0];
        },
        function(errorResponse){
            postMessage('Error fetching maps: ' + errorResponse.message);
        }
    );

    return mapservice;
}]);

playModule.config(function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');
    $stateProvider
        .state('home', { url: '/', templateUrl: 'templates/home.html'})
        .state('about', { url: '/about', templateUrl: 'templates/about.html'})
        .state('play', { url: '/play', templateUrl: 'templates/playsetup.html'})
        .state('editor', { url: '/edit', templateUrl: 'templates/editorsetup.html'})
        .state('admin', { url: '/admin', templateUrl: 'templates/adminstatus.html'})
        .state('join', {url: '/join', templateUrl: 'templates/joingame.html'});
});

playModule.controller('menucontroller', ['$scope', '$http', '$window', '$cookies', 'MapService', '$location', function($scope, $http, $window, $cookies, mapservice, $location){
    $scope.navClass = { 'btn':true, 'btn-sm':true, 'btn-primary':true };

    console.log('' + $location.search('game') );

    $scope.mapservice = mapservice;
    $scope.playerName = $cookies.get('player-name') || '';
    $scope.players = 4;

    $scope.joinGamePlayerID = '';
    $scope.joinGameID = $cookies.get('gameid');

    $scope.games = [];

    $http.get('/api/game/admin/games').then(function(response){
        console.log(response);
        $scope.games = response.data.games;
    });

    $scope.openGame = function() {
        $cookies.put('gameid', $scope.joinGameID);
        $cookies.put('player-name', $scope.playerName);
        location.href = '/game';
    };

    $scope.joinGame = function() {
        console.log('/join/'+$scope.joinGameID);
        $http.post( '/api/game/'+$scope.joinGameID, {playerName: $scope.joinGamePlayerID}).then(function(response){
            console.log(response);
        });
    };

    $scope.adminGameID = $cookies.get('gameid');
    $scope.adminGameObject = undefined;
    $scope.adminStatus = function(gameid) {
        console.log(gameid);
        var adminGameID = gameid || $scope.adminGameID;

        var url = '/api/game/admin/'+adminGameID;
        $http.get(url).then(function(response){
            $scope.adminGameObject = response.data.gameObject;
            console.log($scope.adminGameObject);
        });
    };

    $scope.adminDeleteGame = function(gameid){
        console.log('deleting gameid: ' + gameid)
        $http.delete('/api/game/admin/'+gameid).then(function(response){
            console.log(response);
            location.reload();
        });
    };

    $scope.setNumPlayers = function(num){
        console.log(num);
        $scope.players = num;
    };

    $scope.startNewGame = function(){
        var element = document.getElementById('gamelink');
    };

    $scope.editNewMap = function() {
        $window.location.href = '/editor';
    };

    $scope.cloneMap = function() {
        var selectedMap = $scope.mapservice.selectedMap;
        $window.location.href = '/editor?clone=' + selectedMap;
    };

    $scope.createNewGame = function(){
        var newGameObject = {
            ownerName:$scope.playerName,
            roomName: $scope.roomName,
            mapName:$scope.mapservice.selectedMap,
            numPlayers:$scope.players,
            isPrivate: false,
            passphrase: 'abcd'
        };

        $http.post('/api/game', newGameObject).then(function(response){
            console.log(response);

            $cookies.put('player-name', $scope.playerName);
            $cookies.put('gameid', response.data.gameid);

            var gamelink = document.getElementById('gamelink');
            gamelink.innerHTML = $scope.playerName + '<br/>' + $scope.mapservice.selectedMap + '<br/>' + $scope.players;
            gamelink.innerHTML = gamelink.innerHTML + '<br/>';
            gamelink.innerHTML += '<a href="'+response.data.gameid+'">GAME</a>'
        });
    };

    var postMessage = function(msg){
        console.log(msg);
        var element = document.getElementById('messages');
        element.innerHTML = msg + '<br/>' + element.innerHTML;
    };
}]);