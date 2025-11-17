// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import authService from '@/services/authService';
import type { UserResponse, LoginRequest, RegisterRequest } from '@/types/auth.types';

interface AuthState {
  user: UserResponse | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserToken: () => Promise<boolean>;
  setAuth: (user: UserResponse, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setError: (error: string | null) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      /**
       * ดำเนินการเข้าสู่ระบบ
       * @param credentials ข้อมูลการเข้าสู่ระบบ
       */
      login: async (credentials: LoginRequest) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authService.login(credentials);
          
          if (response.success) {
            set({
              user: response.user,
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ error: response.message || 'เข้าสู่ระบบไม่สำเร็จ', isLoading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
          set({ error: errorMessage, isLoading: false });
        }
      },

      /**
       * ดำเนินการลงทะเบียน
       * @param userData ข้อมูลการลงทะเบียน
       */
      register: async (userData: RegisterRequest) => {
        try {
          set({ isLoading: true, error: null });
          const response = await authService.register(userData);
          
          if (response.success) {
            set({
              user: response.user,
              accessToken: response.access_token,
              refreshToken: response.refresh_token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ error: response.message || 'ลงทะเบียนไม่สำเร็จ', isLoading: false });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลงทะเบียน';
          set({ error: errorMessage, isLoading: false });
        }
      },

      /**
       * ดำเนินการออกจากระบบ
       */
      logout: async () => {
        try {
          set({ isLoading: true });
          
          // ทำการเรียก API เพื่อออกจากระบบ (ถ้าจำเป็น)
          if (get().isAuthenticated) {
            await authService.logout();
          }
          
          // ล้างข้อมูลผู้ใช้ทั้งหมดจาก store
          get().clearAuth();
        } catch (error) {
          console.error('Error during logout:', error);
          // ถึงแม้จะเกิดข้อผิดพลาด ก็ยังต้องล้างข้อมูลผู้ใช้ออกจาก store
          get().clearAuth();
        }
      },

      /**
       * รีเฟรช token ของผู้ใช้
       */
      refreshUserToken: async () => {
        try {
          const currentRefreshToken = get().refreshToken;
          
          if (!currentRefreshToken) {
            return false;
          }
          
          const response = await authService.refreshToken({
            refresh_token: currentRefreshToken
          });
          
          if (response.success) {
            set({
              accessToken: response.access_token,
              refreshToken: response.refresh_token || currentRefreshToken,
            });
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Error refreshing token:', error);
          return false;
        }
      },

      /**
       * ตั้งค่าข้อมูลการยืนยันตัวตน
       * @param user ข้อมูลผู้ใช้
       * @param accessToken token สำหรับเข้าถึง API
       * @param refreshToken token สำหรับรีเฟรช
       */
      setAuth: (user: UserResponse, accessToken: string, refreshToken: string) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          error: null,
        });
      },

      /**
       * ล้างข้อมูลการยืนยันตัวตนทั้งหมด
       */
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      /**
       * ตั้งค่าข้อความผิดพลาด
       * @param error ข้อความผิดพลาด
       */
      setError: (error: string | null) => {
        set({ error });
      },

      /**
       * ตั้งค่าสถานะการโหลด
       * @param isLoading สถานะการโหลด
       */
      setLoading: (isLoading: boolean) => {
        set({ isLoading });
      },
    }),
    {
      name: 'auth-storage', // ชื่อที่ใช้เก็บใน localStorage
      // ระบุ state ที่ต้องการเก็บใน localStorage
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;