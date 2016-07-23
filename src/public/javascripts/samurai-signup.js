var signupModule = angular.module('samurai', []);
var signupController = signupModule.controller('samurai-signup', ['$scope', '$http', function($scope, $http){
    $scope.username = '';
    $scope.password = '';
    $scope.repeatPassword = '';
    $scope.name = '';
    $scope.signupFeedback = '';
    $scope.signupSuccess = false;

    function setFeedback(message){
        $scope.signupFeedback = message;
    }

    function validate(){
        if( $scope.username.length == 0 ) {
            setFeedback('Empty username not allowed');
            return false;
        }

        if( $scope.password.length > 4 && $scope.password !== $scope.repeatPassword ){
            setFeedback('Passwords do not match');
            return false;
        }

        if( $scope.name.length == 0 ) {
            setFeedback('Empty name not allowed')
            return false;
        }

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
            setFeedback('Response: ' + response.data.message);
            if( response.status == 200 )
                $scope.signupSuccess = true;
        }).catch( errorResponse => {
            setFeedback('Failed to sign up: ' + errorResponse.data.message );
        });

        setFeedback('Request sent...');
    }
}]);