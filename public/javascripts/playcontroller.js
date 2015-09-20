var playModule = angular.module('playmodule', []);

playModule.controller('playcontroller', ['$scope', '$http', function($scope, $http){
    $scope.maplist = [{name:'notinitializedyet'}];
    $scope.players = 4;

    $scope.$watch('players', function(newvalue){
        console.log(newvalue);
    });

    $scope.setNumPlayers = function(num){
        console.log(num);
        $scope.players = num;
    };

    $http.get('/api/maps').then( function(response){
        $scope.maplist = response.data;
    });

    $scope.startNewGame = function(){
        var element = document.getElementById('gamelink');
    };

    $scope.showSetup = function() {
        var element = document.getElementById('playpanel');
        element.style.display = 'inline';
    };
}]);

playModule.directive('playSetup', function(){
    return {
        transclude: true,
        scope: { maps: "=", set: "=" },
        templateUrl: '/templates/playsetup.html'
    };
});