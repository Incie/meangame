var playModule = angular.module('playmodule', []);

playModule.controller('playcontroller', ['$scope', '$http', '$window', function($scope, $http, $window){
    $scope.maplist = [{name:'notinitializedyet'}];
    $scope.selectedMap = $scope.maplist[0];

    $scope.players = 4;

    $scope.setNumPlayers = function(num){
        $scope.players = num;
    };

    $http.get('/api/maps').then( function(successResponse){
        if( successResponse.success === false ){
            postMessage('error fetching maps' + errorResponse.message);
        }

        $scope.maplist = successResponse.data;
    },
    function(errorResponse){
        postMessage('Error fetching maps: ' + errorResponse.message);
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
        $window.location.href = '/editor';
    };

    $scope.editselectedmap = function() {
        $window.location.href = '/editor?clone=' + $scope.selectedMap.name;
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
        scope: { maps: "=", editnew: "=", editclone: "=" },
        templateUrl: '/templates/editorsetup.html'
    };
});