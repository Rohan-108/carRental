import { validateSchema, partialValidateSchema } from "../utils.js";
import DbService from "./db.js";
import { USER_SCHEMA } from "./userService.js";

const APPROVED = "approved";
const PENDING = "pending";
const REJECTED = "rejected";

export const APPROVAL_SCHEMA = {
  id: "string",
  userId: "string",
  user: USER_SCHEMA,
  status: "string",
  createdAt: "number",
  updatedAt: "number",
};

function ApprovalService() {
  const STORE_NAME = "approvals";
  const addApproval = async (approval) => {
    if (!validateSchema(APPROVAL_SCHEMA, approval)) {
      return;
    }
    const id = await DbService.addItem(STORE_NAME, approval);
    return id;
  };
  const updateApproval = async (approval) => {
    if (!partialValidateSchema(APPROVAL_SCHEMA, approval)) {
      return;
    }
    const updatedApproval = await DbService.updateItem(STORE_NAME, approval);
    return updatedApproval;
  };
  const getApprovalById = async (id) => {
    const approval = await DbService.getItem(STORE_NAME, id);
    return approval;
  };
  const getApprovalByUserId = async (userId) => {
    const approval = await DbService.searchItemByIndex(
      STORE_NAME,
      "userId",
      userId
    );
    return approval;
  };
  const getPagedApprovals = async (options, filterFunction) => {
    const data = await DbService.getPaginatedItems(
      STORE_NAME,
      options,
      filterFunction
    );
    return data;
  };
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
}

export default ApprovalService();
