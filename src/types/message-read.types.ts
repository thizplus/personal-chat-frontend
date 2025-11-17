// Frontend TypeScript types for Message Read

// ============ Request Types ============

export interface MarkMessageAsReadRequest {
    message_id: string;
  }
  
  export interface GetMessageReadsRequest {
    message_id: string;
  }
  
  export interface MarkAllMessagesAsReadRequest {
    conversation_id: string;
  }
  
  export interface GetUnreadCountRequest {
    conversation_id: string;
  }
  
  // ============ Response Types ============
  
  export interface MessageReadInfo {
    user_id: string;
    read_at: string; // ISO string
    user_name?: string;
    avatar_url?: string;
    is_online?: boolean;
    last_seen?: string; // ISO string
  }
  
  export interface MarkMessageAsReadResponse {
    success: boolean;
    message: string;
  }
  
  export interface GetMessageReadsResponse {
    success: boolean;
    message: string;
    data: {
      reads: MessageReadInfo[];
      total_reads: number;
    };
  }
  
  export interface MarkAllMessagesAsReadResponse {
    success: boolean;
    message: string;
    data: {
      marked_count: number;
    };
  }
  
  export interface GetUnreadCountResponse {
    success: boolean;
    message: string;
    data: {
      unread_count: number;
    };
  }
  
  export interface MessageReadSummary {
    message_id: string;
    total_reads: number;
    latest_read?: string; // ISO string
    is_read_by_all: boolean;
  }
  
  export interface ConversationReadStatus {
    conversation_id: string;
    total_messages: number;
    read_messages: number;
    unread_messages: number;
    last_read_at?: string; // ISO string
  }