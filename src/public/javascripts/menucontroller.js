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

playModule.controller('menucontroller', ['$scope', '$http', '$window', '$cookies', 'MapService', function($scope, $http, $window, $cookies, mapservice){
    $scope.navClass = { 'btn':true, 'btn-sm':true, 'btn-primary':true };

    $scope.mapservice = mapservice;
    $scope.playerName = '';
    $scope.players = 4;

    $scope.joinGamePlayerID = 'vypvyp';
    $scope.joinGameID = 'E6UuCO';

    $scope.joinGame = function() {
        console.log('/join/'+$scope.joinGameID);
        $http.post( '/game/join/'+$scope.joinGameID, {playerName: $scope.joinGamePlayerID}).then(function(response){
            console.log(response);
        });
    };

    $scope.adminGameID = 'E6UuCO';
    $scope.adminGameObject = undefined;
    $scope.adminStatus = function() {
        console.log('admin status');
        var url = '/game/admin/status/'+$scope.adminGameID;
        $http.get(url).then(function(response){
            console.log(response);
            $scope.adminGameObject = response.data.gameObject;
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
            roomName: 'testroom 1234',
            mapName:$scope.mapservice.selectedMap,
            numPlayers:$scope.players,
            isPrivate: false,
            passphrase: 'abcd'
        };

        $http.post('/game/create', newGameObject).then(function(response){
            console.log(response);

            $cookies.put('player-name', $scope.playerName);

            var gamelink = document.getElementById('gamelink');
            gamelink.innerHTML = $scope.playerName + '<br/>' + $scope.mapservice.selectedMap + '<br/>' + $scope.players;
            gamelink.innerHTML = gamelink.innerHTML + '<br/>' + response.data;
        });
    };

    var postMessage = function(msg){
        console.log(msg);
        var element = document.getElementById('messages');
        element.innerHTML = msg + '<br/>' + element.innerHTML;
    };
}]);