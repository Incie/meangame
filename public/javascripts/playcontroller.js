var playModule = angular.module('playmodule', []);

playModule.factory('MapService', ['$http', function($http) {
    var mapservice = {};

    mapservice.maps = {};
    mapservice.selectedMap = {name:'waiting for server'};

    var getLastElement = function(a){
        if(a.length > 0)
            return a[a.length-1];
        return undefined;
    }

    $http.get('/api/maps').then(
        function(successResponse){
            if( successResponse.success === false ){
                postMessage('error fetching maps ' + errorResponse.message);
                return;
            }

            mapservice.maps = successResponse.data;
            mapservice.selectedMap = mapservice.maps[0];
        },
        function(errorResponse){
            postMessage('Error fetching maps: ' + errorResponse.message);
        }
    );

    return mapservice;
}]);

playModule.controller('playcontroller', ['$scope', '$http', '$window', 'MapService', function($scope, $http, $window, mapservice){
    $scope.mapservice = mapservice;

    $scope.players = 4;

    $scope.setNumPlayers = function(num){
        $scope.players = num;
    };

    $scope.startNewGame = function(){
        var element = document.getElementById('gamelink');
    };

    $scope.showSetup = function() {
        var editElement = document.getElementById('editorpanel');
        editElement.style.display = 'none';

        var element = document.getElementById('playpanel');
        element.style.display = 'inline';
    };

    $scope.showEditorSetup = function() {
        var playElement = document.getElementById('playpanel');
        playElement.style.display = 'none';

        var editElement = document.getElementById('editorpanel');
        editElement.style.display = 'inline';
    };

    $scope.editNewMap = function() {
        $window.location.href = '/editor';
    };

    $scope.cloneMap = function() {
        var obj = $scope.mapservice.selectedMap;
        $window.location.href = '/editor?clone=' + obj.name;
    };

    var postMessage = function(msg){
        console.log(msg);
        var element = document.getElementById('messages');
        element.innerHTML = msg + '<br/>' + element.innerHTML;
    };
}]);

playModule.directive('playSetup', function(){
    return {
        transclude: true,
        scope: { maps: "=", set: "=" },
        templateUrl: '/templates/playsetup.html'
    };
});

playModule.directive('editSetup', function(){
    return {
        transclude: true,
        scope: {  },
        templateUrl: '/templates/editorsetup.html'
    };
});