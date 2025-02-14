import { validateSchema, partialValidateSchema } from "../utils.js";
import DbService from "./db.js";
import { USER_SCHEMA } from "./userService.js";
import { CAR_SCHEMA } from "./carService.js";

export const CHAT_SCHEMA = {
  id: "string",
  user: USER_SCHEMA,
  conversationId: "string",
  message: "string",
  image: "string",
  sender: "string",
  createdAt: "number",
  updatedAt: "number",
};
export const CONVERSATION_SCHEMA = {
  id: "string",
  carId: "string",
  car: CAR_SCHEMA,
  members: [USER_SCHEMA],
  createdAt: "number",
  updatedAt: "number",
};

function ChatService() {
  const CHAT_STORE_NAME = "chat";
  const CONVERSATION_STORE_NAME = "conversations";
  const addChat = async (chat) => {
    if (!validateSchema(CHAT_SCHEMA, chat)) {
      return;
    }
    const id = await DbService.addItem(CHAT_STORE_NAME, chat);
    return id;
  };
  const addConversation = async (conversation) => {
    if (!validateSchema(CONVERSATION_SCHEMA, conversation)) {
      return;
    }
    const id = await DbService.addItem(CONVERSATION_STORE_NAME, conversation);
    return id;
  };
  const getChatById = async (id) => {
    const chat = await DbService.getItem(CHAT_STORE_NAME, id);
    return chat;
  };
  const getConversationById = async (id) => {
    const conversation = await DbService.getItem(CONVERSATION_STORE_NAME, id);
    return conversation;
  };
  const getChatsByConversationId = async (conversationId) => {
    const chats = await DbService.searchAllByIndex(
      CHAT_STORE_NAME,
      "conversationId",
      conversationId
    );
    return chats;
  };
  const getConversationsByCarId = async (carId) => {
    const conversations = await DbService.searchAllByIndex(
      CONVERSATION_STORE_NAME,
      "carId",
      carId
    );
    return conversations;
  };
  const getAllConversations = async () => {
    const conversations = await DbService.getAllItems(CONVERSATION_STORE_NAME);
    return conversations;
  };
  return {
    addChat,
    addConversation,
    getChatById,
    getConversationById,
    getChatsByConversationId,
    getConversationsByCarId,
    getAllConversations,
  };
}
export default ChatService();
