// src/services/userService.ts
import apiService from './apiService';
import { USER_API } from '@/constants/api/standardApiConstants';
import type {
  UserData,
  PublicUserData,
  UpdateProfileRequest,
  GetProfileResponse,
  UpdateProfileResponse,
  UploadProfileImageResponse,
  SearchUsersResponse,
  GetUserStatusResponse,
  UserStatusItem,
  SearchUserByEmailResponse
} from '@/types/user.types';

/**
 * Service สำหรับจัดการข้อมูลผู้ใช้
 */
const userService = {

  /**
 * ค้นหาผู้ใช้ด้วยอีเมล
 * @param email อีเมลที่ต้องการค้นหา
 * @returns ข้อมูลผู้ใช้ที่พบ หรือ null ถ้าไม่พบ
 */
  findUserByEmail: async (email: string): Promise<UserData | null> => {
    try {
      const response = await apiService.get<SearchUserByEmailResponse>(
        USER_API.SEARCH_BY_EMAIL(email)
      );

      if (response.success && response.user) {
        return response.user;
      }
      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  },
  /**
   * ดึงข้อมูลผู้ใช้ปัจจุบัน
   * @returns ข้อมูลผู้ใช้ปัจจุบัน
   */
  getCurrentUser: async (): Promise<UserData> => {
    const response = await apiService.get<{ success: boolean; user: UserData }>(USER_API.GET_CURRENT_USER);
    return response.user;
  },

  /**
   * ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม ID
   * @param userId - ID ของผู้ใช้ที่ต้องการดึงข้อมูล
   * @returns ข้อมูลโปรไฟล์ผู้ใช้
   */
  getProfile: async (userId: string): Promise<UserData | PublicUserData> => {
    const response = await apiService.get<GetProfileResponse>(USER_API.GET_PROFILE(userId));
    return response.data;
  },

  /**
   * อัปเดตข้อมูลโปรไฟล์ผู้ใช้
   * @param userId - ID ของผู้ใช้ที่ต้องการอัปเดต
   * @param data - ข้อมูลที่ต้องการอัปเดต
   * @returns ข้อมูลผู้ใช้ที่อัปเดตแล้ว
   */
  updateProfile: async (userId: string, data: UpdateProfileRequest): Promise<UserData> => {
    const response = await apiService.patch<UpdateProfileResponse>(USER_API.UPDATE_PROFILE(userId), data);
    return response.data;
  },

  /**
   * อัปโหลดรูปโปรไฟล์
   * @param userId - ID ของผู้ใช้
   * @param formData - FormData ที่มีรูปภาพที่ต้องการอัปโหลด
   * @param onProgress - callback สำหรับติดตามความคืบหน้าในการอัปโหลด
   * @returns ข้อมูลรูปโปรไฟล์ที่อัปโหลดแล้ว
   */
  uploadProfileImage: async (
    userId: string,
    formData: FormData,
    onProgress?: (percentage: number) => void
  ): Promise<UploadProfileImageResponse> => {
    return await apiService.upload<UploadProfileImageResponse>(
      USER_API.UPLOAD_PROFILE_IMAGE(userId),
      formData,
      onProgress
    );
  },

  /**
   * อัปเดตรหัสผ่าน
   * @param userId - ID ของผู้ใช้
   * @param currentPassword - รหัสผ่านปัจจุบัน
   * @param newPassword - รหัสผ่านใหม่
   * @returns ผลลัพธ์การอัปเดตรหัสผ่าน
   */
  updatePassword: async (
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    return await apiService.put<{ success: boolean; message: string }>(
      USER_API.UPDATE_PASSWORD(userId),
      {
        current_password: currentPassword,
        new_password: newPassword,
      }
    );
  },

  /**
   * ค้นหาผู้ใช้
   * @param query - คำค้นหา
   * @param limit - จำนวนผลลัพธ์สูงสุดที่ต้องการ
   * @param offset - ตำแหน่งเริ่มต้นของผลลัพธ์
   * @param exactMatch - ถ้าเป็น true จะค้นหาให้ตรงกับทั้งคำเท่านั้น
   * @returns ผลลัพธ์การค้นหาผู้ใช้
   */
  searchUsers: async (query: string, limit?: number, offset?: number, exactMatch?: boolean): Promise<SearchUsersResponse> => {
    return await apiService.get<SearchUsersResponse>(USER_API.SEARCH_USERS, {
      q: query,
      limit,
      offset,
      exact_match: exactMatch,
    });
  },

  /**
   * ดึงสถานะของผู้ใช้หลายคน
   * @param userIds - รายการ ID ของผู้ใช้ที่ต้องการดึงสถานะ
   * @returns สถานะของผู้ใช้
   */
  getUserStatuses: async (userIds: string[]): Promise<UserStatusItem[]> => {
    const response = await apiService.get<GetUserStatusResponse>(USER_API.GET_STATUS, {
      ids: userIds.join(','),
    });
    return response.data;
  },
};

export default userService;