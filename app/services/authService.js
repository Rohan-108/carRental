angular.module("rentIT").factory("authService", [
  "$http",
  "$q",
  "$rootScope",
  function ($http, $q, $rootScope) {
    const BACKEND_URL = "http://localhost:5000/api/v1/users";
    function isLoggedIn() {
      const deferred = $q.defer();
      if ($rootScope.user) {
        deferred.resolve(true);
      } else {
        deferred.reject(false);
      }
      return deferred.promise;
    }
    /**
     * @description Check if the user is a super admin.
     * @returns {Promise} A promise that resolves to true if the user is a super admin, false otherwise.
     */
    function isSuperAdmin() {
      const deferred = $q.defer();
      if ($rootScope.user && $rootScope.user.role === "super-admin") {
        deferred.resolve(true);
      } else {
        deferred.reject(false);
      }
      return deferred.promise;
    }
    /**
     * @description Check if the user is an admin.
     * @returns {Promise} A promise that resolves to true if the user is an admin, false otherwise
     */
    function isAdmin() {
      const deferred = $q.defer();
      if ($rootScope.user && $rootScope.user.role === "admin")
        deferred.resolve(true);
      else deferred.reject(false);
      return deferred.promise;
    }
    /**
     * @description Logs out the user.
     */
    function logout() {
      const deferred = $q.defer();
      $http
        .post(`${BACKEND_URL}/logout`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function successCallback(response) {
            return deferred.resolve(response.data);
          },
          function errorCallback(error) {
            return deferred.reject(error.data);
          }
        );
      return deferred.promise;
    }
    return {
      isSuperAdmin,
      isAdmin,
      logout,
      isLoggedIn,
    };
  },
]);
