// Frontend TypeScript types for Auth

// ============ Request Types ============

export interface RegisterRequest {
    username: string;
    password: string;
    email: string;
    display_name: string;
  }
  
  export interface LoginRequest {
    username: string;
    password: string;
  }
  
  export interface RefreshTokenRequest {
    refresh_token: string;
  }
  
  // ============ Response Types ============
  
  export interface UserResponse {
    id: string;
    username: string;
    email: string;
    display_name: string;
    profile_image_url?: string | null;
    bio?: string | null;
    created_at: string; // ISO string
    last_active_at?: string | null; // ISO string
    status: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    message: string;
    access_token: string;
    refresh_token: string;
    user: UserResponse;
  }
  
  export interface RefreshTokenResponse {
    success: boolean;
    message: string;
    access_token: string;
    refresh_token: string;
  }
  
  export interface LogoutResponse {
    success: boolean;
    message: string;
  }
  
  export interface UserProfileResponse {
    success: boolean;
    user: UserResponse;
  }