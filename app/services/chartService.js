/**
 * @description This service is responsible for handling all the chart related operations.
 */

angular.module("rentIT").factory("chartService", [
  "$http",
  "$q",
  "$rootScope",
  "BASE_URL",
  function ($http, $q, $rootScope, BASE_URL) {
    const BACKEND_URL = `${BASE_URL}/charts`;

    /**
     * @description Get the chart data for the dashboard.
     * @returns {Promise} A promise that resolves to the chart data.
     */
    function getBookingChartDataForOwner(key, days) {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/bookings/owner?key=${key}&days=${days}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
    /**
     * @description Get the chart data for the dashboard.
     * @returns {Promise} A promise that resolves to the chart data.
     */
    function getBookingChartDataForSuperAdmin(key, days) {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/bookings/superAdmin?key=${key}&days=${days}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
    /**
     * @description Get the revenue chart data for the dashboard.
     * @returns {Promise} A promise that resolves to the chart data.
     */
    function getRevenueChartDataForOwner(key, days) {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/revenue/owner?key=${key}&days=${days}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
    /**
     * @description Get the revenue chart data for the dashboard.
     * @returns {Promise} A promise that resolves to the chart data.
     */
    function getRevenueChartDataForSuperAdmin(key, days) {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/revenue/superAdmin?key=${key}&days=${days}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
    /**
     * @description Get the car data for the super admin
     * @param {*} key
     */
    function getCarDataForSuperAdmin(key) {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/cars/superAdmin?key=${key}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
    /**
     * @description Build the chart data from the data object.
     * @param {*} data
     */
    function buildChartDataForBooking(data) {
      // Extract the labels from the keys of the data object.
      const labels = Object.keys(data);

      // Map through the labels to create arrays for each dataset.
      const bookingsData = labels.map((label) => data[label].bookings);
      const bidsData = labels.map((label) => data[label].bids);

      // Return the chart configuration.
      return {
        labels: labels,
        datasets: [
          {
            label: "Bookings",
            data: bookingsData,
            backgroundColor: "rgb(224, 48, 45)",
            borderWidth: 1,
          },
          {
            label: "Bids",
            data: bidsData,
            backgroundColor: "rgba(234, 245, 19, 1)",
            borderWidth: 1,
          },
        ],
      };
    }
    /**
     * @description Build the chart data from the data object.
     * @param {*} data
     */
    function buildChartDataForRevenue(data) {
      // Extract the labels from the keys of the data object.
      const labels = Object.keys(data);

      // Map through the labels to create arrays for each dataset.
      const outstationData = labels.map((label) => data[label].outstation);
      const localData = labels.map((label) => data[label].local);

      // Return the chart configuration.
      return {
        labels: labels,
        datasets: [
          {
            label: "Outstation",
            data: outstationData,
            backgroundColor: "rgba(52, 152, 219,0.5)",
            fill: true,
            tension: 0.4,
            borderWidth: 1,
          },
          {
            label: "Local",
            data: localData,
            backgroundColor: "rgba(231, 76, 60,0.5)",
            fill: true,
            tension: 0.4,
            borderWidth: 1,
          },
        ],
      };
    }
    /**
     * @description Build the chart data for the car data for the super admin.
     * @param {*} data
     */
    function generateRandomColor() {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      return `rgba(${r}, ${g}, ${b}, 0.8)`;
    }
    /**
     * @description Build the chart data for the car data for the super admin.
     * @param {*} data
     * @returns {Object} The chart data for the car data.
     * */
    function buildChartDataForCar(data) {
      const labels = Object.keys(data);
      const carData = labels.map((label) => data[label]);
      const backgroundColors = labels.map(() => generateRandomColor());
      return {
        labels: labels,
        datasets: [
          {
            label: "Cars",
            data: carData,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      };
    }
    /**
     * @description Get the popular vehicle details.
     */
    function getPopularVehicleDetails() {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/popular/vehicles`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
    /**
     * @description This function fetches the top owners for the super admin.
     * @param {*} days - The number of days for which the data is to be fetched.
     */
    function getTopOwnersForSuperAdmin(days) {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/revenue/superAdmin/owners?days=${days}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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

    /**
     * @description Build the chart data for the top owners
     * @param {*} data
     */
    function buildChartDataForTopOwners(data) {
      const labels = Object.keys(data);
      const revenueData = labels.map((label) => data[label].totalRevenue);
      const backgroundColors = labels.map(() => generateRandomColor());
      return {
        labels: labels,
        datasets: [
          {
            label: "Revenue",
            data: revenueData,
            backgroundColor: backgroundColors,
            fill: true,
            borderWidth: 1,
          },
        ],
      };
    }
    /**
     * @description Get the average revenue of the owner against all owners.
     * @returns {Promise} A promise that resolves to the average revenue of the owner against all owners.
     */
    function getOwnerAverageAgainstAllOwners() {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/revenue/owner/average`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
    /**
     * @description Build the chart data for the comparision of the revenue of the owner against all owners.
     * @param {*} data
     */
    function buildChartDataForComparision(data) {
      const labels = Object.keys(data);
      const revenueData = labels.map((label) => data[label]);
      return {
        labels: labels,
        datasets: [
          {
            label: "Revenue",
            data: revenueData,
            backgroundColor: "rgba(75, 192, 192, 0.4)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      };
    }

    /**
     * @description Get the car growth for the owner.
     * @param {*} carId - The ID of the car.
     * @param {*} days - The number of days for which the data is to be fetched.
     * @returns {Promise} A promise that resolves to the car growth data.
     */
    function getOwnerCarGrowth(carId, days) {
      const deferred = $q.defer();
      $http
        .get(`${BACKEND_URL}/owner/growth/${carId}?days=${days}`, {
          headers: {
            Authorization: `Bearer ${$rootScope.user.accessToken}`,
          },
          cache: true,
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
      getBookingChartDataForOwner,
      buildChartDataForBooking,
      getRevenueChartDataForOwner,
      buildChartDataForRevenue,
      getBookingChartDataForSuperAdmin,
      getRevenueChartDataForSuperAdmin,
      getCarDataForSuperAdmin,
      buildChartDataForCar,
      getPopularVehicleDetails,
      getTopOwnersForSuperAdmin,
      buildChartDataForTopOwners,
      getOwnerAverageAgainstAllOwners,
      buildChartDataForComparision,
      getOwnerCarGrowth,
    };
  },
]);
