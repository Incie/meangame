var playModule = angular.module('playmodule', []);

playModule.controller('playcontroller', ['$scope', '$http', '$window', function($scope, $http, $window){
    $scope.maplist = [{name:'notinitializedyet'}];
    $scope.selectedMap = $scope.maplist[0];

    $scope.players = 4;

    $scope.setNumPlayers = function(num){
        $scope.players = num;
    };

    $http.get('/api/maps').then( function(response){
        $scope.maplist = response.data;
    });

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

    $scope.editnewmap = function() {
        console.log('edit new map');
        $window.location.href = '/editor';
    };

    $scope.editselectedmap = function() {
        console.log('edit ', $scope.selectedMap);
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
        scope: { maps: "=", editnew: "=", editclone: "=" },
        templateUrl: '/templates/editorsetup.html'
    };
});