angular.module("rentIT").service("configService", [
  "$http",
  "$q",
  "$rootScope",
  "BASE_URL",
  function ($http, $q, $rootScope, BASE_URL) {
    /**
     * @description Fetches the configuration from the server and stores it in the config variable.
     * @returns {Promise} A promise that resolves to the config object.
     */
    this.getConfig = function () {
      const deferred = $q.defer();
      $http
        .get(`${BASE_URL}/config`)
        .then((response) => {
          config = response.data;
          deferred.resolve(config);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };
    /**
     * @description Updates the configuration on the server and stores it in the config variable.
     * @param {*} config - The configuration object to be updated.
     */
    this.updateConfig = function (config) {
      const deferred = $q.defer();
      $http
        .put(`${BASE_URL}/config`, config, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then((response) => {
          config = response.data;
          deferred.resolve(config);
        })
        .catch((error) => {
          deferred.reject(error);
        });
      return deferred.promise;
    };
  },
]);
