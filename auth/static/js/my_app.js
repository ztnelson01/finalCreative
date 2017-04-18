angular.module('myApp', []).
  controller('myController', ['$scope', '$http', function($scope, $http) {

    $scope.sendData = function() {
        console.log('sending data')
        $http({
            url: 'user/addComment',
            method: "POST",
            data: {"comment":$scope.comment}
        })
        .then(function(response) {
          console.log("response: ", response)
            $scope.comments = response.data.comments;
        },
        function(response) { // optional
                // failed
        });
    }



    $http.get('/user/profile').success(function(data, status, headers, config) {
      console.log("data is: ", data)
      $scope.user = data;
      $scope.error = "";
      $scope.comments = data.comments
    }).
    error(function(data, status, headers, config) {
      $scope.user = {};
      $scope.error = data;
    });
  }]);
