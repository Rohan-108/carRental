/**
 * @description This service is used to handle all the approval related operations.
 * @name approvalService
 * @requires utilService
 * @requires DbService
 */
angular.module("rentIT").factory("approvalService", [
  "utilService",
  "DbService",
  function (utilService, DbService) {
    const STORE_NAME = "approvals";
    const APPROVAL_SCHEMA = {
      id: "string",
      userId: "string",
      user: "object",
      status: "string",
      createdAt: "number",
      updatedAt: "number",
    };
    /**
     * @description This function is used to add a new approval
     * @param {*} approval - approval object
     * @returns {string} - id of the approval
     */
    const addApproval = async (approval) => {
      if (!utilService.validateSchema(APPROVAL_SCHEMA, approval)) {
        return new Error("Invalid approval data");
      }
      const id = await DbService.addItem(STORE_NAME, approval);
      return id;
    };
    /**
     * @description This function is used to update an existing approval
     * @param {*} approval - approval object
     * @returns {object} - updated approval object
     */
    const updateApproval = async (approval) => {
      if (!utilService.partialValidateSchema(APPROVAL_SCHEMA, approval)) {
        return;
      }
      const updatedApproval = await DbService.updateItem(STORE_NAME, approval);
      return updatedApproval;
    };
    /**
     * @description This function is used to get an approval by id
     * @param {*} id - approval id
     * @returns {object} - approval object
     */
    const getApprovalById = async (id) => {
      const approval = await DbService.getItem(STORE_NAME, id);
      return approval;
    };
    /**
     * @description This function is used to get an approval by user id
     * @param {*} userId - user id
     * @returns {object} - approval object
     */
    const getApprovalByUserId = async (userId) => {
      const approval = await DbService.searchItemByIndex(
        STORE_NAME,
        "userId",
        userId
      );
      return approval;
    };
    /**
     * @description This function is used to get paged approvals
     * @param {*} options - options object
     * @param {*} filterFunction - filter function
     * @returns {array} - array of approvals
     */
    const getPagedApprovals = async (options, filterFunction) => {
      const data = await DbService.getPaginatedItems(
        STORE_NAME,
        options,
        filterFunction
      );
      return data;
    };
    /**
     * @description This function is used to get all approvals
     * @returns {array} - array of approvals
     */
    const getAllApprovals = async () => {
      const data = await DbService.getAllItems(STORE_NAME);
      return data;
    };

    return {
      addApproval,
      updateApproval,
      getApprovalById,
      getApprovalByUserId,
      getPagedApprovals,
      getAllApprovals,
    };
  },
]);
