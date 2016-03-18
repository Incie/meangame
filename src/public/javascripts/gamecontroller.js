(function(){
    var gameModule = angular.module('gamemodule', ['ngCookies']);

    gameModule.controller('gamecontroller', ['$scope', '$http', '$cookies', function($scope, $http, $cookies){
        $scope.title = 'meow';

        var gameid = $cookies.get('gameid');
        console.log('attempting to boot game ' + gameid);

        $http.get('/api/game/'+gameid).then(function(response){
            console.log(gameid, 'response', response);
        }).catch(function(error){
            console.log(gameid, 'error', error);
        });
    }]);

    gameModule.directive('gameBoard', ['$window', function ($window) {
        return {
            restrict: 'E',
            transclude: true,
            template: '<canvas>noscript</canvas>',
            link: function (scope, element, attrs) {
                scope.gameBoardElement = element[0];

                //initialize hexagons
                //begin fetching data
                  //- call function from controller scope?

            }
        };
    }]);
})();