// Frontend TypeScript types for File Upload

// ============ Request Types ============

export interface FileUploadRequest {
    folder?: string;
    // file will be handled by FormData
  }
  
  // ============ Response Types ============
  
  export interface FileUploadDTO {
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    mime_type: string;
    url: string;
    path: string;
    folder: string;
    storage_type: string;
    uploaded_at: string; // ISO string
    expires_at?: string | null; // ISO string
    metadata?: Record<string, unknown>;
    
    // For images specifically
    width?: number | null;
    height?: number | null;
    thumbnail_url?: string | null;
  }
  
  export interface FileUploadResponse {
    success: boolean;
    message: string;
    data: FileUploadDTO;
  }
  
  export interface FileError {
    code: string;
    message: string;
    detail?: string;
  }
  
  export interface FileErrorResponse {
    success: boolean;
    message: string;
    error: FileError;
  }
  
  export interface FilesListDTO {
    files: FileUploadDTO[];
    total: number;
    limit: number;
    offset: number;
  }
  
  export interface FilesListResponse {
    success: boolean;
    message: string;
    data: FilesListDTO;
  }