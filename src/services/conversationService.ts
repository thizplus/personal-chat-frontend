// src/services/conversationService.ts
import apiService from './apiService';
import { CONVERSATION_API } from '@/constants/api/standardApiConstants';
import type {
  ConversationCreateResponse,
  ConversationUpdateResponse,
  ConversationListResponse,
  ConversationMessagesResponse,
  ConversationPinResponse,
  ConversationMuteResponse,
  CreateDirectConversationRequest,
  CreateGroupConversationRequest,
  ConversationQueryRequest,
  ConversationMessagesQueryRequest,
  ConversationPinRequest,
  ConversationMuteRequest,
  UpdateConversationRequest
} from '@/types/conversation.types';
import type {
  MediaSummaryResponse,
  MediaListResponse,
  MediaQueryParams,
  MessageContextResponse,
  MessageContextParams
} from '@/types/media.types';

/**
 * Service สำหรับจัดการการสนทนา
 */
const conversationService = {
  /**
   * สร้างการสนทนาแบบ direct (1:1)
   */
  createDirectConversation: async (memberIds: string[]): Promise<ConversationCreateResponse> => {
    const data: CreateDirectConversationRequest = {
      type: 'direct',
      member_ids: memberIds
    };
    return await apiService.post<ConversationCreateResponse>(CONVERSATION_API.CREATE_CONVERSATION, data);
  },

  /**
   * สร้างการสนทนาแบบกลุ่ม
   */
  createGroupConversation: async (title: string, memberIds?: string[], iconUrl?: string): Promise<ConversationCreateResponse> => {
    const data: CreateGroupConversationRequest = {
      type: 'group',
      title,
      member_ids: memberIds,
      icon_url: iconUrl
    };
    return await apiService.post<ConversationCreateResponse>(CONVERSATION_API.CREATE_CONVERSATION, data);
  },

  /**
   * ดึงการสนทนาทั้งหมดของผู้ใช้
   */
  getUserConversations: async (params?: ConversationQueryRequest): Promise<ConversationListResponse> => {
    return await apiService.get<ConversationListResponse>(CONVERSATION_API.GET_USER_CONVERSATIONS, params);
  },

  /**
   * อัปเดตข้อมูลการสนทนา
   */
  updateConversation: async (conversationId: string, data: UpdateConversationRequest): Promise<ConversationUpdateResponse> => {
    return await apiService.patch<ConversationUpdateResponse>(
      CONVERSATION_API.UPDATE_CONVERSATION(conversationId),
      data
    );
  },

  /**
   * ดึงข้อความในการสนทนา
   */
  getConversationMessages: async (conversationId: string, params?: ConversationMessagesQueryRequest): Promise<ConversationMessagesResponse> => {
    return await apiService.get<ConversationMessagesResponse>(
      CONVERSATION_API.GET_CONVERSATION_MESSAGES(conversationId),
      params
    );
  },

  /**
   * เปลี่ยนสถานะปักหมุดของการสนทนา
   */
  togglePinConversation: async (conversationId: string, isPinned: boolean): Promise<ConversationPinResponse> => {
    const data: ConversationPinRequest = { is_pinned: isPinned };
    return await apiService.patch<ConversationPinResponse>(
      CONVERSATION_API.TOGGLE_PIN_CONVERSATION(conversationId),
      data
    );
  },

  /**
   * เปลี่ยนสถานะการปิดเสียงของการสนทนา
   */
  toggleMuteConversation: async (conversationId: string, isMuted: boolean): Promise<ConversationMuteResponse> => {
    const data: ConversationMuteRequest = { is_muted: isMuted };
    return await apiService.patch<ConversationMuteResponse>(
      CONVERSATION_API.TOGGLE_MUTE_CONVERSATION(conversationId),
      data
    );
  },

  /**
   * ดึงสรุปจำนวน media ในการสนทนา (Telegram-like feature)
   */
  getMediaSummary: async (conversationId: string): Promise<MediaSummaryResponse> => {
    return await apiService.get<MediaSummaryResponse>(
      CONVERSATION_API.GET_MEDIA_SUMMARY(conversationId)
    );
  },

  /**
   * ดึงรายการ media ตามประเภท พร้อม pagination (Telegram-like feature)
   */
  getMediaByType: async (conversationId: string, params: MediaQueryParams): Promise<MediaListResponse> => {
    return await apiService.get<MediaListResponse>(
      CONVERSATION_API.GET_MEDIA_BY_TYPE(conversationId),
      params
    );
  },

  /**
   * ดึง context ของข้อความเพื่อ jump to message (Telegram-like feature)
   */
  getMessageContext: async (conversationId: string, params: MessageContextParams): Promise<MessageContextResponse> => {
    return await apiService.get<MessageContextResponse>(
      CONVERSATION_API.GET_MESSAGE_CONTEXT(conversationId),
      params
    );
  },

  /**
   * ลบการสนทนา (Soft Delete / Hide)
   * - สำหรับ Direct Chat: ซ่อนแชทจากรายการ (Hide)
   * - สำหรับ Group Chat: ออกจากกลุ่ม (Leave)
   */
  deleteConversation: async (conversationId: string): Promise<{ success: boolean; message: string }> => {
    return await apiService.delete<{ success: boolean; message: string }>(
      CONVERSATION_API.DELETE_CONVERSATION(conversationId)
    );
  },

  /**
   * ออกจากกลุ่ม (สำหรับ Group Chat)
   */
  leaveGroup: async (conversationId: string, userId: string): Promise<{ success: boolean; message: string }> => {
    return await apiService.delete<{ success: boolean; message: string }>(
      CONVERSATION_API.REMOVE_CONVERSATION_MEMBER(conversationId, userId)
    );
  },

  /**
   * เชิญสมาชิกเข้ากลุ่ม (Bulk)
   */
  addMember: async (conversationId: string, userIds: string[]): Promise<{
    success: boolean;
    message: string;
    data?: {
      added_members: Array<{
        id: string;
        user_id: string;
        username: string;
        display_name: string;
        profile_picture: string | null;
        role: string;
        joined_at: string;
        is_online: boolean;
      }>;
      failed_members: Array<{
        user_id: string;
        reason: string;
      }>;
    }
  }> => {
    return await apiService.post(
      CONVERSATION_API.BULK_ADD_CONVERSATION_MEMBERS(conversationId),
      { user_ids: userIds }
    );
  }
};

export default conversationService;