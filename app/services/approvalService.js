/**
 * @description This service is used to handle all the approval related operations.
 * @name approvalService
 * @requires utilService
 * @requires DbService
 */
angular.module("rentIT").factory("approvalService", [
  "$q",
  "$http",
  "$rootScope",
  "BASE_URL",
  function ($q, $http, $rootScope, BASE_URL) {
    const BACKEND_URL = `${BASE_URL}/approvals`;

    /**
     * @description Add an approval request to the database.
     */
    function addApproval() {
      const deffered = $q.defer();
      $http
        .post(
          `${BACKEND_URL}/add`,
          {},
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
     * @description Get all the approvals for a user.
     */
    function getApprovalByUserId() {
      const deffered = $q.defer();
      $http
        .get(`${BACKEND_URL}/user`, {
          headers: { Authorization: `Bearer ${$rootScope.user.accessToken}` },
          cache: true,
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
     * @description Get all the approvals.
     * @param {*} pageNumber
     * @param {*} pageSize
     * @param {*} filter
     * @param {*} sort
     */
    function getApprovals(pageNumber, pageSize, filter, sort) {
      const deffered = $q.defer();
      filter = JSON.stringify(filter);
      sort = JSON.stringify(sort);
      $http
        .get(
          `${BACKEND_URL}?pageNumber=${pageNumber}&pageSize=${pageSize}&filter=${filter}&sort=${sort}`,
          {
            headers: { Authorization: `Bearer ${$rootScope.user.accessToken}` },
            cache: true,
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
     * @description Approve an approval request.
     * @param {*} approvalId
     */
    function approveApprovalRequest(approvalId) {
      const deffered = $q.defer();
      $http
        .patch(
          `${BACKEND_URL}/approve/${approvalId}`,
          {},
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
     * @description Reject an approval request.
     * @param {*} approvalId
     */
    function rejectApprovalRequest(approvalId) {
      const deffered = $q.defer();
      $http
        .patch(
          `${BACKEND_URL}/reject/${approvalId}`,
          {},
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
    return {
      addApproval,
      getApprovalByUserId,
      getApprovals,
      approveApprovalRequest,
      rejectApprovalRequest,
    };
  },
]);
