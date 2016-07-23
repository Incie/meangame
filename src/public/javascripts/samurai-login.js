var loginModule = angular.module('samurai', []);
var loginController = loginModule.controller('samurai-login', ['$scope', '$http', function($scope, $http){
    $scope.username = '';
    $scope.password = '';
    $scope.feedback = '';
    $scope.loginSuccess = false;

    function setFeedback(msg){
        $scope.feedback = msg;
    }

    $scope.login = function(){
        setFeedback('Logging in...');
        $scope.loginSuccess = false;

        let url = '/api/login';
        let payload = {user: $scope.username, pass: $scope.password};
        let config = { withCredentials: true };
        $http.post(url, payload, config)
            .then(r => {
                if( r.status == 200 )
                    $scope.loginSuccess = true;
                setFeedback(r.data.message);
            })
            .catch( err => {
                setFeedback('Error caught:' + err.data.message);
            });

        $scope.password = '';
    }
}]);