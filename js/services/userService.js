import DbService from "./db.js";
import { toast } from "../index.js";
import { validateSchema, partialValidateSchema } from "../utils.js";
//user-Schema
export const USER_SCHEMA = {
  id: "string",
  name: "string",
  email: "string",
  password: "string",
  tel: "string",
  adhaar: "string",
  role: "string", // e.g., "general" or "admin"
  avatar: "ArrayBuffer", // URL or base64 string
  createdAt: "number", // timestamp
  updatedAt: "number", // timestamp
};
function UserService() {
  const STORE_NAME = "users";
  const getByEmail = async (email) => {
    const user = await DbService.searchItemByIndex(STORE_NAME, "email", email);
    return user;
  };
  const getUserById = async (id) => {
    const user = await DbService.getItem(STORE_NAME, id);
    return user;
  };
  const addUser = async (user) => {
    if (!validateSchema(USER_SCHEMA, user)) {
      return;
    }
    const existingUser = await getByEmail(user.email);
    if (existingUser) {
      toast("error", "Email already exists").showToast();
      return;
    }
    const id = await DbService.addItem(STORE_NAME, user);
    return id;
  };
  const updateUser = async (user) => {
    if (!partialValidateSchema(USER_SCHEMA, user)) {
      return;
    }
    user.updatedAt = Date.now();
    const updatedUser = await DbService.updateItem(STORE_NAME, user);
    return updatedUser;
  };
  const getAllUsers = async () => {
    const users = await DbService.getAllItems(STORE_NAME);
    return users;
  };
  const countUsers = async () => {
    const count = await DbService.countItems(STORE_NAME);
    return count;
  };
  const countUserByEmail = async (email) => {
    const count = await DbService.countItemByIndex(STORE_NAME, "email", email);
    return count;
  };
  const getPaginatedUsers = async (page, pageSize, indexName) => {
    const data = await DbService.getPaginatedItems(STORE_NAME, {
      page,
      pageSize,
      indexName,
    });
    return data;
  };
  return {
    getByEmail,
    addUser,
    updateUser,
    getUserById,
    getAllUsers,
    countUsers,
    countUserByEmail,
    getPaginatedUsers,
  };
}

export default UserService();
