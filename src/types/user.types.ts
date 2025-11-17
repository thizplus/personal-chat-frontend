// Frontend TypeScript types for User

// ============ Constants ============

export type UserStatus = 'online' | 'away' | 'offline' | 'busy';

// ============ Request Types ============

export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string | null;
  status?: UserStatus;
}



// UploadProfileImageRequest uses FormData, not directly convertible to TypeScript interface

export interface GetUserStatusRequest {
  ids: string; // Comma-separated UUIDs
}

// ============ Response Types ============

export interface UserData {
  id: string;
  username: string;
  display_name: string;
  email?: string | null;
  profile_image_url?: string | null;
  bio?: string | null;
  status: UserStatus;
  last_active_at?: string | null; // ISO string
  created_at?: string; // ISO string
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  phone?: string | null;
  notification_prefs?: string | null;
}

export interface PublicUserData {
  id: string;
  username: string;
  display_name: string;
  profile_image_url?: string | null;
  bio?: string | null;
  status: UserStatus;
  last_active_at?: string | null; // ISO string
}

export interface UserStatusItem {
  user_id: string;
  status: UserStatus;
  last_active_at?: string | null; // ISO string
}

export interface ProfileImageUploadResult {
  profile_image_url: string;
  public_id: string;
}

export interface SearchUserItem {
  id: string;
  username: string;
  display_name: string;
  profile_image_url?: string | null;
  bio?: string | null;
  status: UserStatus;
}

// ============ Response Wrapper Types ============

export interface GetCurrentUserResponse {
  success: boolean;
  message: string;
  user: UserData;
}

export interface GetProfileResponse {
  success: boolean;
  message: string;
  data: UserData | PublicUserData;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  data: UserData;
}

export interface UploadProfileImageResponse {
  success: boolean;
  message: string;
  data: ProfileImageUploadResult;
}

export interface SearchUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: SearchUserItem[];
    count: number;
    limit: number;
    offset: number;
  };
}

export interface GetUserStatusResponse {
  success: boolean;
  message: string;
  data: UserStatusItem[];
}

export interface SearchUserByEmailResponse {
  success: boolean;
  message: string;
  user: UserData;
}