// Frontend TypeScript types for Conversation Member

// ============ Request Types ============

export interface AddMemberRequest {
    user_id: string;
  }
  
  export interface ToggleAdminRequest {
    is_admin: boolean;
  }
  
  export interface MemberQueryRequest {
    page?: number;
    limit?: number;
  }
  
  // ============ Response Types ============
  
  export interface MemberDTO {
    id: string;
    user_id: string;
    username: string;
    display_name: string;
    profile_picture: string;
    role: string; // "admin" or "member"
    joined_at: string; // ISO string
    is_online: boolean;
  }
  
  export interface ConversationMemberDTO {
    id: string;
    conversation_id: string;
    user_id: string;
    username: string;
    display_name: string;
    profile_image_url?: string | null;
    is_admin: boolean;
    joined_at: string; // ISO string
    last_read_at?: string | null; // ISO string
    is_muted: boolean;
    is_pinned: boolean;
    nickname?: string;
    notification_settings?: unknown;
    status?: string;
    last_active_at?: string | null; // ISO string
  }
  
  export interface MemberListData {
    members: ConversationMemberDTO[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }
  
  export interface MemberResponse {
    success: boolean;
    message: string;
    data: ConversationMemberDTO;
  }
  
  export interface MemberListResponse {
    success: boolean;
    message: string;
    data: MemberListData;
  }
  
  export interface AdminStatusResponse {
    success: boolean;
    message: string;
    is_admin: boolean;
  }