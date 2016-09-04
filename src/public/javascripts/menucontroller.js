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
            // postMessage('Error fetching maps: ' + errorResponse.message);
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

    $scope.isLoggedIn = true;
    $scope.whoami = '';

    $scope.login = function(){
        let payload = {
            user: document.getElementById('username').value,
            pass: document.getElementById('password').value
        };
        let config = { withCredentials: true };
        $http.post('/login', payload, config)
            .then(response => console.log(response));
    };

    console.log('' + $location.search('game') );

    $scope.mapservice = mapservice;
    $scope.playerName = $cookies.get('player-name') || '';
    $scope.players = 4;

    $scope.joinGamePlayerID = '';
    $scope.joinGameID = $cookies.get('gameid');

    $scope.games = [];
    $scope.availableGames = [];

    $scope.fetchLobby = function() {
        $http.get('/api/lobby/available').then(function(response){
            console.log('available', response);
            var responseData = response.data;
            if( responseData.success )
                $scope.availableGames = responseData.data;
        });

        $http.post('/api/lobby/mygames', {player: $scope.playerName}).then(function(response){
            console.log('mygames', response);
            var responseData = response.data;
            if( responseData.success )
                $scope.myGames = responseData.data;
        });
    };

    $scope.fetchLobby();

    $http.get('/api/game/admin/games').then(function(response){
        console.log(response);
        $scope.games = response.data.games;
    });

    $scope.openGame = function(gameid) {
        $cookies.put('gameid', gameid);
        $cookies.put('player-name', $scope.playerName);
        location.href = '/game';
    };

    $scope.replayGame = function() {
        $cookies.put('gameid', $scope.joinGameID);
        location.href = '/replay';
    };

    $scope.joinGame = function(gameid) {
        var joinGameURL = '/api/game/'+gameid;
        var postData = {playerName: $scope.playerName};
        $http.post(joinGameURL , postData).then(function(response){
            if( response.data.success ){
                $scope.openGame(gameid);
            }
        });
    };

    $scope.adminGameID = $cookies.get('gameid');
    $scope.adminGameObject = undefined;
    $scope.adminStatus = function(gameid) {
        console.log(gameid);
        var adminGameID = gameid || $scope.adminGameID;

        var url = '/api/game/'+adminGameID+'/admin';
        $http.get(url).then(function(response){
            $scope.adminGameObject = response.data.gameObject;
        });
    };

    $scope.adminDeleteGame = function(gameid){
        console.log('deleting gameid: ' + gameid);
        $http.delete('/api/game/'+gameid+'/admin').then(function(response){
            console.log('delete game', response);
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

    $scope.loggedIn = function() {
        return $scope.isLoggedIn;
    };

    $scope.notLoggedIn = function() {
        return !$scope.isLoggedIn;
    };

    $http.get('/api/whoami').then( response => {
        if( response.status >= 400 ){
            $scope.isLoggedIn = false;
            $scope.whoami = '';
            console.log("logged out");

            return;
        }
        console.log("logged in");
        $scope.isLoggedIn = true;
        $scope.whoami = response.data.name;
    }).catch(e => {
        $scope.isLoggedIn = false;
        $scope.whoami = '';
        console.log("not logged in");
    });

    $scope.logout = function() {
        $http.post( '/api/logout' ).then( response => {
            if( response.code === 200 ){
                $scope.isLoggedIn = false;
            }
        })
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
            gamelink.innerHTML += '<a href="/game/">'+response.data.gameid+'</a>'
        });
    };

    $scope.postMessage = function(msg){
        console.log(msg);
        var element = document.getElementById('messages');
        element.innerHTML = msg + '<br/>' + element.innerHTML;
    };
}]);