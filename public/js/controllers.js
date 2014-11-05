/**
 * Created by Andres Monroy (HyveMynd) on 11/4/14.
 */
var app = angular.module('app');

app.controller('Ctrl', ['$scope', '$http', function ($scope, $http) {
    $scope.games = [];
    $scope.playerId = '';
    $scope.gameId = '';
    $scope.name = '';

    $http.get('/api/games').
        success(function (data) {
            $scope.games = data;
        });

    $scope.getSize = function (n) {
        return new Array(n);
    };

    $scope.newGame = function () {
        $http.post('/api/games', {gameName: 'Web test 1', playerName: 'Player 1'}).
            success(function (data) {
                $scope.playerId = data.playerId;
                $scope.gameId = data.gameId;
            })
    };

    $scope.gameClick = function (game) {
        $http.get('/api/games/' + game.id).
            success(function (data) {
                console.log(data);
            });
    }
}]);