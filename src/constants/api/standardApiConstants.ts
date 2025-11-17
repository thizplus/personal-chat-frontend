// src/constants/api/standardApiConstants.ts
/**
 * คอนสแตนท์สำหรับเรียกใช้ API ในส่วนของบัญชีผู้ใช้ทั่วไป
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com/api/v1';

/**
 * API สำหรับจัดการผู้ใช้งานและการยืนยันตัวตน
 */
export const AUTH_API = {
  // การลงทะเบียนและเข้าสู่ระบบ
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  GET_CURRENT_USER: `${API_BASE_URL}/auth/user`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
};

/**
 * API สำหรับจัดการข้อมูลผู้ใช้
 */
export const USER_API = {
  // ข้อมูลผู้ใช้
  GET_CURRENT_USER: `${API_BASE_URL}/users/me`,
  GET_PROFILE: (userId: string) => `${API_BASE_URL}/users/${userId}`,
  UPDATE_PROFILE: (userId: string) => `${API_BASE_URL}/users/${userId}`,
  UPLOAD_PROFILE_IMAGE: (userId: string) => `${API_BASE_URL}/users/${userId}/profile-image`,
  UPDATE_PASSWORD: (userId: string) => `${API_BASE_URL}/users/${userId}/password`,
  SEARCH_BY_EMAIL: (email: string) => `${API_BASE_URL}/users/search-by-email?email=${email}`,
  // การค้นหาผู้ใช้
  SEARCH_USERS: `${API_BASE_URL}/users/search`,
  GET_STATUS: `${API_BASE_URL}/users/status`,
};

/**
 * API สำหรับจัดการเพื่อนและความสัมพันธ์ระหว่างผู้ใช้
 */
export const FRIENDSHIP_API = {
  // การจัดการเพื่อน
  GET_FRIENDS: `${API_BASE_URL}/friends`,
  SEARCH_USERS: `${API_BASE_URL}/friends/search`,
  GET_PENDING_REQUESTS: `${API_BASE_URL}/friends/pending`,
  GET_BLOCKED_USERS: `${API_BASE_URL}/friends/blocked`,

  // การส่งคำขอเป็นเพื่อน
  SEND_FRIEND_REQUEST: (friendId: string) => `${API_BASE_URL}/friends/request/${friendId}`,
  ACCEPT_FRIEND_REQUEST: (requestId: string) => `${API_BASE_URL}/friends/accept/${requestId}`,
  REJECT_FRIEND_REQUEST: (requestId: string) => `${API_BASE_URL}/friends/reject/${requestId}`,
  
  // การลบเพื่อนและบล็อกผู้ใช้
  REMOVE_FRIEND: (friendId: string) => `${API_BASE_URL}/friends/${friendId}`,
  BLOCK_USER: (userId: string) => `${API_BASE_URL}/friends/block/${userId}`,
  UNBLOCK_USER: (userId: string) => `${API_BASE_URL}/friends/block/${userId}`,
};

/**
 * API สำหรับจัดการการสนทนาส่วนตัว
 */
export const CONVERSATION_API = {
  // การจัดการการสนทนา
  CREATE_CONVERSATION: `${API_BASE_URL}/conversations`,
  GET_USER_CONVERSATIONS: `${API_BASE_URL}/conversations`,
  UPDATE_CONVERSATION: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}`,
  DELETE_CONVERSATION: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}`,
  GET_CONVERSATION_MESSAGES: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/messages`,

  // การตั้งค่าการสนทนา
  TOGGLE_PIN_CONVERSATION: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/pin`,
  TOGGLE_MUTE_CONVERSATION: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/mute`,

  // การจัดการสมาชิกในกลุ่มสนทนา
  ADD_CONVERSATION_MEMBER: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/members`,
  BULK_ADD_CONVERSATION_MEMBERS: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/members/bulk`,
  GET_CONVERSATION_MEMBERS: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/members`,
  REMOVE_CONVERSATION_MEMBER: (conversationId: string, userId: string) => `${API_BASE_URL}/conversations/${conversationId}/members/${userId}`,
  TOGGLE_MEMBER_ADMIN: (conversationId: string, userId: string) => `${API_BASE_URL}/conversations/${conversationId}/members/${userId}/admin`,

  // Media Gallery (Telegram-like features)
  GET_MEDIA_SUMMARY: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/media/summary`,
  GET_MEDIA_BY_TYPE: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/media`,
  GET_MESSAGE_CONTEXT: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/messages/context`,
};

/**
 * API สำหรับจัดการข้อความในการสนทนาส่วนตัว
 */
export const MESSAGE_API = {
  // การส่งข้อความประเภทต่างๆ
  SEND_TEXT_MESSAGE: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/messages/text`,
  SEND_STICKER_MESSAGE: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/messages/sticker`,
  SEND_IMAGE_MESSAGE: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/messages/image`,
  SEND_FILE_MESSAGE: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/messages/file`,
  
  // การจัดการข้อความ
  EDIT_MESSAGE: (messageId: string) => `${API_BASE_URL}/messages/${messageId}`,
  GET_MESSAGE_EDIT_HISTORY: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/edit-history`,
  DELETE_MESSAGE: (messageId: string) => `${API_BASE_URL}/messages/${messageId}`,
  GET_MESSAGE_DELETE_HISTORY: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/delete-history`,
  REPLY_TO_MESSAGE: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/reply`,
};

/**
 * API สำหรับจัดการการอ่านข้อความ
 */
export const MESSAGE_READ_API = {
  // การมาร์คข้อความว่าอ่านแล้ว
  MARK_MESSAGE_AS_READ: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/read`,
  GET_MESSAGE_READS: (messageId: string) => `${API_BASE_URL}/messages/${messageId}/reads`,
  
  // การจัดการการอ่านข้อความทั้งหมดในการสนทนา
  MARK_ALL_MESSAGES_AS_READ: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/read_all`,
  GET_UNREAD_COUNT: (conversationId: string) => `${API_BASE_URL}/conversations/${conversationId}/unread_count`,
};

/**
 * API สำหรับจัดการไฟล์และรูปภาพ
 */
export const FILE_API = {
  UPLOAD_IMAGE: `${API_BASE_URL}/upload/image`,
  UPLOAD_FILE: `${API_BASE_URL}/upload/file`,
  DELETE: (id: string) => `${API_BASE_URL}/files/${id}`,
  GET: (id: string) => `${API_BASE_URL}/files/${id}`,
};

/**
 * API สำหรับจัดการสติกเกอร์
 */
export const STICKER_API = {
  // การจัดการชุดสติกเกอร์ของผู้ใช้
  GET_ALL_STICKER_SETS: `${API_BASE_URL}/stickers/sets`,
  GET_DEFAULT_STICKER_SETS: `${API_BASE_URL}/stickers/sets/default`,
  GET_STICKER_SET: (stickerSetId: string) => `${API_BASE_URL}/stickers/sets/${stickerSetId}`,
  GET_USER_STICKER_SETS: `${API_BASE_URL}/stickers/my-sets`,
  
  // การจัดการสติกเกอร์ในชุดของผู้ใช้
  ADD_STICKER_SET_TO_USER: (stickerSetId: string) => `${API_BASE_URL}/stickers/sets/${stickerSetId}/add`,
  REMOVE_STICKER_SET_FROM_USER: (stickerSetId: string) => `${API_BASE_URL}/stickers/sets/${stickerSetId}/remove`,
  SET_STICKER_SET_AS_FAVORITE: (stickerSetId: string) => `${API_BASE_URL}/stickers/sets/${stickerSetId}/favorite`,
  
  // การใช้งานสติกเกอร์
  RECORD_STICKER_USAGE: (stickerId: string) => `${API_BASE_URL}/stickers/stickers/${stickerId}/usage`,
  GET_USER_RECENT_STICKERS: `${API_BASE_URL}/stickers/recent`,
  GET_USER_FAVORITE_STICKERS: `${API_BASE_URL}/stickers/favorites`,
};

/**
 * API สำหรับจัดการ Broadcast deliveries ของผู้ใช้
 */
export const BROADCAST_DELIVERY_API = {
  GET_USER_DELIVERIES: `${API_BASE_URL}/broadcast-deliveries`,
  TRACK_OPEN: (deliveryId: string) => `${API_BASE_URL}/broadcast-deliveries/${deliveryId}/track-open`,
  TRACK_CLICK: (deliveryId: string) => `${API_BASE_URL}/broadcast-deliveries/${deliveryId}/track-click`,
};




export default {
  AUTH_API,
  USER_API,
  FRIENDSHIP_API,
  CONVERSATION_API,
  MESSAGE_API,
  MESSAGE_READ_API,
  FILE_API,
  STICKER_API,
};