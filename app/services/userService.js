/**
 * @description This module contains services for intercating with the user data.
 * @requires DbService
 * @requires utilService
 */

angular.module("rentIT").factory("userService", [
  "$q",
  "$http",
  "$rootScope",
  function ($q, $http, $rootScope) {
    const BACKEND_URL = "http://localhost:5000/api/v1/users";
    /**
     * @description Get a user by email.
     * @param {string} email The email of the user.
     * @returns {Promise} A promise that resolves to the user object.
     */
    function login(email, password) {
      const deffered = $q.defer();
      $http
        .post(`${BACKEND_URL}/login`, {
          email: email,
          password: password,
        })
        .then(
          function successCallback(response) {
            return deffered.resolve(response.data);
          },
          function errorCallback(error) {
            return deffered.reject(error.data);
          }
        );
      return deffered.promise;
    }
    /**
     * @description Add a user to the database.
     * @param {*} user - The user object to be added
     * @returns
     */
    function addUser(user) {
      const deffered = $q.defer();
      $http
        .post(`${BACKEND_URL}/register`, user, {
          headers: {
            "Content-Type": undefined,
          },
        })
        .then(
          function successCallback(response) {
            return deffered.resolve(response.data);
          },
          function errorCallback(error) {
            return deffered.reject(error.data);
          }
        );
      return deffered.promise;
    }

    /**
     * @description Update a user's password in the database.
     * @param {*} oldPassword - The old password
     * @param {*} newPassword - The new password
     */
    function changePassword(oldPassword, newPassword) {
      const deffered = $q.defer();
      $http
        .patch(
          `${BACKEND_URL}/changePassword`,
          {
            oldPassword: oldPassword,
            newPassword: newPassword,
          },
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function successCallback(response) {
            return deffered.resolve(response.data);
          },
          function errorCallback(error) {
            return deffered.reject(error.data);
          }
        );
      return deffered.promise;
    }
    /**
     * @description Update a user's details in the database.
     */
    function updateUser(formData) {
      const deffered = $q.defer();
      $http
        .patch(`${BACKEND_URL}`, formData, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
            "Content-Type": undefined,
          },
        })
        .then(
          function successCallback(response) {
            return deffered.resolve(response.data);
          },
          function errorCallback(error) {
            return deffered.reject(error.data);
          }
        );
      return deffered.promise;
    }
    /**
     * @description Get the stats for the owner.
     * @returns {Promise} A promise that resolves to the user object.
     */
    function getStatsForOwner() {
      const deffered = $q.defer();
      $http
        .get(`${BACKEND_URL}/stats/owner`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function successCallback(response) {
            return deffered.resolve(response.data);
          },
          function errorCallback(error) {
            return deffered.reject(error.data);
          }
        );
      return deffered.promise;
    }
    /**
     * @description Get the stats for the super admin.
     * @returns {Promise} A promise that resolves to the user object.
     */
    function getStatsForSuperAdmin() {
      const deffered = $q.defer();
      $http
        .get(`${BACKEND_URL}/stats/superAdmin`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function successCallback(response) {
            return deffered.resolve(response.data);
          },
          function errorCallback(error) {
            return deffered.reject(error.data);
          }
        );
      return deffered.promise;
    }
    return {
      login,
      changePassword,
      addUser,
      updateUser,
      getStatsForOwner,
      getStatsForSuperAdmin,
    };
  },
]);
