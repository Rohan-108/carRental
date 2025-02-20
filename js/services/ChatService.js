import { validateSchema } from "../utils.js";
import DbService from "./db.js";
import { USER_SCHEMA } from "./userService.js";
import { CAR_SCHEMA } from "./carService.js";

// Schema for a chat object
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

// Schema for a conversation object
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

  // Add a chat object to the database
  const addChat = async (chat) => {
    if (!validateSchema(CHAT_SCHEMA, chat)) {
      return;
    }
    const id = await DbService.addItem(CHAT_STORE_NAME, chat);
    return id;
  };

  // Add a conversation object to the database
  const addConversation = async (conversation) => {
    if (!validateSchema(CONVERSATION_SCHEMA, conversation)) {
      return;
    }
    const id = await DbService.addItem(CONVERSATION_STORE_NAME, conversation);
    return id;
  };

  // Get a chat object by its ID
  const getChatById = async (id) => {
    const chat = await DbService.getItem(CHAT_STORE_NAME, id);
    return chat;
  };

  // Get a conversation object by its ID
  const getConversationById = async (id) => {
    const conversation = await DbService.getItem(CONVERSATION_STORE_NAME, id);
    return conversation;
  };

  // Get all chat objects for a given conversation ID
  const getChatsByConversationId = async (conversationId) => {
    const chats = await DbService.searchAllByIndex(
      CHAT_STORE_NAME,
      "conversationId",
      conversationId
    );
    return chats;
  };

  // Get all conversation objects for a given car ID
  const getConversationsByCarId = async (carId) => {
    const conversations = await DbService.searchAllByIndex(
      CONVERSATION_STORE_NAME,
      "carId",
      carId
    );
    return conversations;
  };

  // Get all conversation objects
  const getAllConversations = async () => {
    const conversations = await DbService.getAllItems(CONVERSATION_STORE_NAME);
    return conversations;
  };

  // Return the public API of the ChatService
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
