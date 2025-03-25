/**
 * @description This service is responsible for handling all the car related operations.
 * @requires utilService
 * @requires DbService
 */

angular.module("rentIT").factory("carService", [
  "$http",
  "$q",
  "$rootScope",
  function ($http, $q, $rootScope) {
    const BACKEND_URL = "http://localhost:5000/api/v1/vehicles";

    /**
     * @description This function is responsible for fetching the cars from the backend.
     * @param {*} pageNumber - page number
     * @param {*} pageSize - number of items per page
     * @param {*} filter - filter object
     * @param {*} sort - sort object
     */
    function getCars(
      pageNumber,
      pageSize,
      filter = {},
      searchText = "",
      sort = {}
    ) {
      const deferred = $q.defer();
      const filterString = JSON.stringify(filter);
      const sortString = JSON.stringify(sort);
      $http
        .get(
          `${BACKEND_URL}?pageNumber=${pageNumber}&pageSize=${pageSize}&filter=${filterString}&sort=${sortString}&searchText=${searchText}`
        )
        .then(
          function successCallback(response) {
            deferred.resolve(response.data);
          },
          function errorCallback(error) {
            deferred.reject(error);
          }
        );
      return deferred.promise;
    }
    /**
     * @description This function is responsible for adding a new car to the backend.
     * @param {*} formData
     */
    function addCar(formData) {
      const deferred = $q.defer();
      $http
        .post(`${BACKEND_URL}`, formData, {
          headers: {
            "Content-Type": undefined,
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function successCallback(response) {
            return deferred.resolve(response.data);
          },
          function errorCallback(error) {
            return deferred.reject(error);
          }
        );
      return deferred.promise;
    }
    /**
     * @description Update the car details
     */
    function updateCar(formData, carId) {
      const deferred = $q.defer();
      $http
        .patch(`${BACKEND_URL}/${carId}`, formData, {
          headers: {
            "Content-Type": undefined,
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function successCallback(response) {
            return deferred.resolve(response.data);
          },
          function errorCallback(error) {
            return deferred.reject(error);
          }
        );
      return deferred.promise;
    }
    function getCarById(carId) {
      const deferred = $q.defer();
      $http.get(`${BACKEND_URL}/${carId}`).then(
        function successCallback(response) {
          deferred.resolve(response.data);
        },
        function errorCallback(error) {
          deferred.reject(error);
        }
      );
      return deferred.promise;
    }
    return {
      getCars,
      addCar,
      updateCar,
      getCarById,
    };
  },
]);
