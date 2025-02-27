/**
 * @description This service is used to handle sessiom management
 * @name sessionService
 * @requires $rootScope
 */
angular.module("rentIT").service("sessionService", [
  "$rootScope",
  function ($rootScope) {
    /**
     * @description This function is used to set the current user
     * @param {*} user - user object
     */
    this.setUser = function (user) {
      $rootScope.user = user;
      sessionStorage.setItem("currentUser", JSON.stringify(user));
    };
    /**
     * @description This function is used to get the current user
     * @returns {object} - user object
     */
    this.getUser = function () {
      return JSON.parse(sessionStorage.getItem("currentUser")) || null;
    };
    /**
     * @description This function is used to remove the current user
     */
    this.removeUser = function () {
      $rootScope.user = null;
      sessionStorage.removeItem("currentUser");
    };
  },
]);
