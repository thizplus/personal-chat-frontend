// src/hooks/useAuth.ts
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import useUserStore from '@/stores/userStore';
import useFriendshipStore from '@/stores/friendshipStore';
import type { LoginRequest, RegisterRequest } from '@/types/auth.types';
import { toast } from '@/utils/toast';

/**
 * Hook สำหรับจัดการการยืนยันตัวตนและเซสชัน
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selective subscriptions to prevent unnecessary re-renders
  const user = useAuthStore(state => state.user);
  const accessToken = useAuthStore(state => state.accessToken);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const storeLogin = useAuthStore(state => state.login);
  const storeRegister = useAuthStore(state => state.register);
  const storeLogout = useAuthStore(state => state.logout);
  const setStoreError = useAuthStore(state => state.setError);

  // เข้าถึง user store และ friendship store เพื่อล้างข้อมูลเมื่อออกจากระบบ
  const clearUserStore = useUserStore(state => state.clearUserStore);
  const clearFriendshipStore = useFriendshipStore(state => state.clearFriendshipStore);

  // ล้างข้อความผิดพลาดใน store เมื่อ component unmount
  useEffect(() => {
    return () => {
      setStoreError(null);
    };
  }, [setStoreError]);

  /**
   * เข้าสู่ระบบ
   * @param credentials ข้อมูลการเข้าสู่ระบบ
   * @param redirectTo เส้นทางที่ต้องการให้นำทางไปหลังจากเข้าสู่ระบบสำเร็จ (ถ้ามี)
   */
  const login = useCallback(async (credentials: LoginRequest, redirectTo?: string) => {
    try {
      setLoading(true);
      setError(null);

      await storeLogin(credentials);

      // ตรวจสอบว่าเข้าสู่ระบบสำเร็จหรือไม่
      if (useAuthStore.getState().isAuthenticated) {
        toast.success('เข้าสู่ระบบสำเร็จ', 'กำลังพาคุณไปยังหน้าหลัก...');

        if (redirectTo) {
          navigate(redirectTo);
        }
        return true;
      } else {
        // ถ้าไม่สำเร็จ ให้ดึงข้อความผิดพลาดจาก store
        const storeError = useAuthStore.getState().error;
        const errorMsg = storeError || 'เข้าสู่ระบบไม่สำเร็จ';
        setError(errorMsg);
        toast.error('เข้าสู่ระบบไม่สำเร็จ', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setError(errorMessage);
      toast.error('เข้าสู่ระบบไม่สำเร็จ', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeLogin, navigate]);

  /**
   * ลงทะเบียน
   * @param userData ข้อมูลการลงทะเบียน
   * @param redirectTo เส้นทางที่ต้องการให้นำทางไปหลังจากลงทะเบียนสำเร็จ (ถ้ามี)
   */
  const register = useCallback(async (userData: RegisterRequest, redirectTo?: string) => {
    try {
      setLoading(true);
      setError(null);

      await storeRegister(userData);

      // ตรวจสอบว่าลงทะเบียนสำเร็จหรือไม่
      if (useAuthStore.getState().isAuthenticated) {
        toast.success('ลงทะเบียนสำเร็จ', 'ยินดีต้อนรับสู่ระบบ!');

        if (redirectTo) {
          navigate(redirectTo);
        }
        return true;
      } else {
        // ถ้าไม่สำเร็จ ให้ดึงข้อความผิดพลาดจาก store
        const storeError = useAuthStore.getState().error;
        const errorMsg = storeError || 'ลงทะเบียนไม่สำเร็จ';
        setError(errorMsg);
        toast.error('ลงทะเบียนไม่สำเร็จ', errorMsg);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลงทะเบียน';
      setError(errorMessage);
      toast.error('ลงทะเบียนไม่สำเร็จ', errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeRegister, navigate]);

  /**
   * ออกจากระบบ
   * @param redirectTo เส้นทางที่ต้องการให้นำทางไปหลังจากออกจากระบบ (ค่าเริ่มต้นคือ '/auth/login')
   */
  const logout = useCallback(async (redirectTo: string = '/auth/login') => {
    try {
      setLoading(true);
      
      // ออกจากระบบใน store
      await storeLogout();
      
      // ล้างข้อมูลใน stores อื่นๆ
      clearUserStore();
      clearFriendshipStore();
      
      // นำทางไปยังหน้าเข้าสู่ระบบ
      navigate(redirectTo);
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [storeLogout, clearUserStore, clearFriendshipStore, navigate]);

  /**
   * ตรวจสอบว่ามีการเข้าสู่ระบบอยู่หรือไม่ และนำทางไปยังหน้าที่เหมาะสม
   * @param fallbackUrl เส้นทางที่ต้องการให้นำทางไปเมื่อไม่ได้เข้าสู่ระบบ (ค่าเริ่มต้นคือ '/auth/login')
   */
  const requireAuth = useCallback((fallbackUrl: string = '/auth/login') => {
    if (!isAuthenticated) {
      navigate(fallbackUrl);
      return false;
    }
    return true;
  }, [isAuthenticated, navigate]);

  /**
   * ตรวจสอบว่ามีการเข้าสู่ระบบอยู่หรือไม่ และนำทางไปยังหน้าแรกถ้าเข้าสู่ระบบแล้ว
   * @param redirectTo เส้นทางที่ต้องการให้นำทางไปเมื่อเข้าสู่ระบบแล้ว (ค่าเริ่มต้นคือ '/')
   */
  const redirectIfAuthenticated = useCallback((redirectTo: string = '/') => {
    if (isAuthenticated) {
      navigate(redirectTo);
      return true;
    }
    return false;
  }, [isAuthenticated, navigate]);

  return {
    user,
    accessToken,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    requireAuth,
    redirectIfAuthenticated,
    setError,
  };
};

export default useAuth;