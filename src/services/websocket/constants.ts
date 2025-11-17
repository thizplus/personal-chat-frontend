// src/services/websocket/constants.ts
export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'wss://api.example.com';

export enum MessageType {
  // Connection management
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  PING = "ping",
  PONG = "pong",

  MESSAGE_SEND = "message.send",
  MESSAGE_RECEIVE = "message.receive",
  MESSAGE_EDIT = "message.edit",
  MESSAGE_DELETE = "message.delete",
  MESSAGE_READ = "message.read",
  MESSAGE_TYPING = "message.typing",

  CONVERSATION_CREATE = "conversation.create",
  CONVERSATION_UPDATE = "conversation.update",
  CONVERSATION_JOIN = "conversation.join",
  CONVERSATION_LEAVE = "conversation.leave",

  // User status subscription
  USER_STATUS_SUBSCRIBE = "user.status.subscribe",
  USER_STATUS_UNSUBSCRIBE = "user.status.unsubscribe",
  
  // Don't forget to include these existing constants
  USER_ONLINE = "user.online",
  USER_OFFLINE = "user.offline",
  USER_STATUS = "user.status",
}


export const WS_RECONNECT_INTERVAL = 3000; // 3 seconds
export const WS_MAX_RECONNECT_ATTEMPTS = 10;
export const WS_PING_INTERVAL = 30000; // 30 seconds