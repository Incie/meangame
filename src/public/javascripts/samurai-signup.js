var signupModule = angular.module('samurai', []);
var signupController = signupModule.controller('samurai-signup', ['$scope', '$http', function($scope, $http){
    $scope.username = '';
    $scope.password = '';
    $scope.repeatPassword = '';
    $scope.name = '';

    function validate(){
        if( $scope.username.length == 0 )
            return false;
        if( $scope.password.length > 4 && $scope.password !== $scope.repeatPassword )
            return false;
        if( $scope.name.length == 0 )
            return false;
        return true;
    }

    $scope.signup = function() {
        if( !validate() ){
            return;
        }

        let payload = {
            user: $scope.username,
            pass: $scope.password,
            name: $scope.name
        };
        let config = { useCredentials: true };
        let url = '/api/signup';
        $http.post(url, payload, config).then( response => {
            console.log(response);
        });
    }
}]);