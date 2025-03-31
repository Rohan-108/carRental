/**
 *@description Main application file
 * @requires angular
 * @requires ui.router
 * @requires ngAnimate
 * @requires toaster
 * @requires ui.bootstrap
 */
const app = angular.module("rentIT", [
  "ui.router",
  "ngAnimate",
  "toaster",
  "ui.bootstrap",
]);

/**
 * @description Intilaize the application
 * @param {Object} $rootScope - The root scope
 * @param {Object} $state - The state service
 * @param {Object} sessionService - The session service
 */
app.run([
  "$rootScope",
  "toaster",
  "$transitions",
  "sessionService",
  "$state",
  function ($rootScope, toaster, $transitions, sessionService, $state) {
    //get the user from the session
    $rootScope.user = sessionService.getUser();
    //handle the state change errors
    $transitions.onError({}, function (transition) {
      const error = transition.error().detail.message;
      toaster.pop("error", "Error", error);
      //redirect to the home page
      $state.go("home");
    });
  },
]);
