/**
 * @description This service is responsible for handling all the operations related to bidding booking.

* @requires $http
* @requires $rootScope
* @requires $q
 */

angular.module("rentIT").service("bidBookService", [
  "$http",
  "$rootScope",
  "$q",
  function ($http, $rootScope, $q) {
    const BACKEND_URL = "http://localhost:5000/api/v1/bids";
    /**
     * @description Add Bid to the database
     * @param {*} bid - The bid object to be added
     */
    function addBid(bid, carId) {
      const deferred = $q.defer();
      $http
        .post(`${BACKEND_URL}/${carId}`, bid, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (response) {
            deferred.reject(response.data);
          }
        );
      return deferred.promise;
    }
    /**
     * @description Get the booked dates for a car
     * @param {*} carId - The car id
     * @returns
     */
    function getBookedDates(carId) {
      const deferred = $q.defer();
      $http.get(`${BACKEND_URL}/bookedDates/${carId}`).then(
        function (response) {
          deferred.resolve(response.data);
        },
        function (error) {
          deferred.reject(error.data);
        }
      );
      return deferred.promise;
    }

    /**
     * @description To get the bids by user
     * @param {*} pageNumber
     * @param {*} pageSize
     * @param {*} filter
     * @param {*} sort
     */
    function getAllBidsByUser(pageNumber, pageSize, filter = {}, sort = {}) {
      const deferred = $q.defer();
      filter = JSON.stringify(filter);
      sort = JSON.stringify(sort);
      $http
        .get(
          `${BACKEND_URL}/user?pageNumber=${pageNumber}&pageSize=${pageSize}&filter=${filter}&sort=${sort}`,
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (error) {
            deferred.reject(error.data);
          }
        );
      return deferred.promise;
    }
    /**
     * @description To get the bids by owner
     * @param {*} pageNumber
     * @param {*} pageSize
     * @param {*} filter
     * @param {*} sort
     */
    function getAllBidsByOwner(pageNumber, pageSize, filter = {}, sort = {}) {
      const deferred = $q.defer();
      filter = JSON.stringify(filter);
      sort = JSON.stringify(sort);
      $http
        .get(
          `${BACKEND_URL}/owner?pageNumber=${pageNumber}&pageSize=${pageSize}&filter=${filter}&sort=${sort}`,
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (error) {
            deferred.reject(error.data);
          }
        );
      return deferred.promise;
    }

    /**
     * @description Approve a bid
     * @param {*} bidId - bid id
     * @returns
     */
    function approveBid(bidId) {
      const deferred = $q.defer();
      $http
        .patch(
          `${BACKEND_URL}/approve/${bidId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (response) {
            deferred.reject(response.data);
          }
        );
      return deferred.promise;
    }
    /**
     * @description Reject a bid
     * @param {*} bidId - bid id
     */
    function rejectBid(bidId) {
      const deferred = $q.defer();
      $http
        .patch(
          `${BACKEND_URL}/reject/${bidId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (response) {
            deferred.reject(response.data);
          }
        );
      return deferred.promise;
    }

    /**
     * @description Get the unique cars for filter
     * @returns {Promise} A promise that resolves to the unique cars for filter.
     */
    function getUniqueCarsForFilter() {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/uniqueVehicles`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
        })
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (error) {
            deferred.reject(error.data);
          }
        );
      return deferred.promise;
    }

    /**
     * @description Add the start odometer reading for the bid
     * @param {string} bidId
     * @param {Number} currentOdometer
     * @param {string} type
     * @returns
     */
    function addOdometerReading(bidId, currentOdometer, type) {
      const deferred = $q.defer();
      const url = type === "start" ? "startOdometer" : "finalOdometer";
      $http
        .patch(
          `${BACKEND_URL}/${url}/${bidId}`,
          { currentOdometer },
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (error) {
            deferred.reject(error.data);
          }
        );
      return deferred.promise;
    }
    /**
     * @description End the trip
     * @param {*} bidId - The bid id
     */
    function endTrip(bidId) {
      const deferred = $q.defer();
      $http
        .patch(
          `${BACKEND_URL}/endTrip/${bidId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${$rootScope.user.accessToken}`,
            },
          }
        )
        .then(
          function (response) {
            deferred.resolve(response.data);
          },
          function (error) {
            deferred.reject(error.data);
          }
        );
      return deferred.promise;
    }
    return {
      addBid,
      getBookedDates,
      getAllBidsByUser,
      getAllBidsByOwner,
      approveBid,
      rejectBid,
      getUniqueCarsForFilter,
      addOdometerReading,
      endTrip,
    };
  },
]);
