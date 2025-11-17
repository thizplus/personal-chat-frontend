// src/services/authService.ts
import apiService from './apiService';
import { AUTH_API } from '@/constants/api/standardApiConstants';
import type {
  RegisterRequest,
  LoginRequest,
  RefreshTokenRequest,
  AuthResponse,
  RefreshTokenResponse,
  LogoutResponse,
  UserProfileResponse
} from '@/types/auth.types';

/**
 * Service สำหรับจัดการการยืนยันตัวตนและผู้ใช้งาน
 */
const authService = {
  /**
   * ลงทะเบียนผู้ใช้ใหม่
   * @param data - ข้อมูลการลงทะเบียน
   * @returns ข้อมูลการลงทะเบียนและ token
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    return await apiService.post<AuthResponse>(AUTH_API.REGISTER, data);
  },

  /**
   * เข้าสู่ระบบ
   * @param data - ข้อมูลการเข้าสู่ระบบ
   * @returns ข้อมูลผู้ใช้และ token
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return await apiService.post<AuthResponse>(AUTH_API.LOGIN, data);
  },

  /**
   * ดึงข้อมูลผู้ใช้ปัจจุบัน
   * @returns ข้อมูลผู้ใช้ปัจจุบัน
   */
  getCurrentUser: async (): Promise<UserProfileResponse> => {
    return await apiService.get<UserProfileResponse>(AUTH_API.GET_CURRENT_USER);
  },

  /**
   * Refresh token เมื่อ access token หมดอายุ
   * @param data - ข้อมูล refresh token
   * @returns token ใหม่
   */
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    return await apiService.post<RefreshTokenResponse>(AUTH_API.REFRESH_TOKEN, data);
  },

  /**
   * ออกจากระบบ
   * @returns ผลลัพธ์การออกจากระบบ
   */
  logout: async (): Promise<LogoutResponse> => {
    return await apiService.post<LogoutResponse>(AUTH_API.LOGOUT);
  },
};

export default authService;