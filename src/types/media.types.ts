// src/types/media.types.ts

/**
 * ประเภทของ media
 */
export type MediaType = 'image' | 'video' | 'file' | 'link';

/**
 * สรุปจำนวน media ในการสนทนา
 */
export interface MediaSummary {
  image_count: number;
  video_count: number;
  file_count: number;
  link_count: number;
  total_media: number;
}

/**
 * ข้อมูล media แต่ละรายการ
 */
export interface MediaItem {
  message_id: string;
  message_type: string;
  media_url?: string;
  thumbnail_url?: string;
  file_name?: string;
  file_size?: number;
  content?: string; // สำหรับ link type
  metadata?: {
    links?: string[];
  };
  created_at: string;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * รายการ media พร้อม pagination
 */
export interface MediaListResponse {
  success: boolean;
  data: MediaItem[];
  pagination: PaginationInfo;
}

/**
 * Media summary response
 */
export interface MediaSummaryResponse {
  success: boolean;
  data: MediaSummary;
}

/**
 * Query parameters สำหรับ get media by type
 */
export interface MediaQueryParams {
  type: MediaType;
  limit?: number;
  offset?: number;
}

/**
 * Message context response (สำหรับ jump to message)
 */
export interface MessageContextResponse {
  success: boolean;
  data: any[]; // MessageDTO[]
  has_before: boolean;
  has_after: boolean;
}

/**
 * Query parameters สำหรับ get message context
 */
export interface MessageContextParams {
  targetId: string;
  before?: number;
  after?: number;
}
