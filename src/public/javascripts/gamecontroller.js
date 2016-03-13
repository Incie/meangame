(function(){
    var gameModule = angular.module('gamemodule', []);

    gameModule.controller('gamecontroller', ['$scope', '$http', function($scope, $http){
        $scope.title = 'meow';

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