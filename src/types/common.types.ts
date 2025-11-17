// Frontend TypeScript types for Common DTOs

export interface ErrorResponse {
    success: boolean;
    message: string;
  }
  
  export interface PaginationData {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }
  
  export interface GenericResponse {
    success: boolean;
    message: string;
  }