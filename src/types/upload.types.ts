// src/types/upload.types.ts

/**
 * Response จากการอัพโหลดรูปภาพ
 */
export interface UploadImageResponse {
    success: boolean;
    message: string;
    data: {
      URL: string;
      PublicID: string;
      ResourceType: string;
      Format: string;
      Size: number;
    };
  }
  
  /**
   * Response จากการอัพโหลดไฟล์
   */
  export interface UploadFileResponse {
    success: boolean;
    message: string;
    data: {
      URL: string;
      PublicID: string;
      ResourceType: string;
      Format: string;
      Size: number;
    };
  }
  
  /**
   * ข้อมูลที่ส่งกลับหลังจากอัพโหลดสำเร็จ (normalized)
   */
  export interface UploadResult {
    url: string;
    thumbnail_url?: string;
    file_name?: string;
    file_size: number;
    file_type: string;
    public_id: string;
    format: string;
  }