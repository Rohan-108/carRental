/**
 *@description Main application file
 * @requires angular
 * @requires ui.router
 * @requires ngAnimate
 * @requires toaster
 */
const app = angular.module("rentIT", ["ui.router", "ngAnimate", "toaster"]);

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
  function ($rootScope, toaster, $transitions, sessionService) {
    //get the user from the session
    $rootScope.user = sessionService.getUser();
    //handle the state change errors
    $transitions.onError({}, function (transition) {
      const error = transition.error().detail;
      if (error === undefined) {
        return;
      }
      switch (error) {
        case "User_Not_Authenticated":
          toaster.pop("error", "Error", "User not authenticated");
          break;
        case "Restricted_Access":
          toaster.pop("error", "Error", "Restricted Access");
          break;
        default:
          toaster.pop("error", "Error", "Something went wrong");
          break;
      }
    });
  },
]);
