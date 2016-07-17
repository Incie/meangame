var loginModule = angular.module('samurai', []);
var loginController = loginModule.controller('samurai-login', ['$scope', '$http', function($scope, $http){
    $scope.username = '';
    $scope.password = '';

    $scope.login = function(){
        let url = '/api/login';
        let payload = {user: $scope.username, pass: $scope.password};
        let config = { withCredentials: true };
        $http.post(url, payload, config).then(r => {
            let data = r.data;
            console.log(data);
            //TODO - login and redirect
        });

        $scope.password = '';
    }
}]);