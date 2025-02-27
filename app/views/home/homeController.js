/**
 * @description The controller for the home page.
 * @param {Object} $scope - The scope
 * @param {Object} $state - The state
 */
angular.module("rentIT").controller("homeController", [
  "$scope",
  "$state",
  function ($scope, $state) {
    //change the state to the given state (call it from the view)
    $scope.changeState = function (state) {
      $state.go(state);
    };
  },
]);
