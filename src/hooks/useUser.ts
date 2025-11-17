// src/hooks/useUser.ts
import { useCallback, useEffect, useState } from 'react';
import useUserStore from '@/stores/userStore';
import type { UpdateProfileRequest, UserStatusItem } from '@/types/user.types';

/**
 * Hook สำหรับจัดการข้อมูลผู้ใช้และการดำเนินการที่เกี่ยวข้อง
 */
export const useUser = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // เข้าถึง user store
  const {
    currentUser,
    userProfiles,
    userStatuses,
    searchResults,
    fetchCurrentUser,
    fetchUserProfile,
    updateProfile,
    uploadProfileImage,
    searchUsers,
    fetchUserStatuses,
    setError: setStoreError,
  } = useUserStore();

  // ล้างข้อความผิดพลาดใน store เมื่อ component unmount
  useEffect(() => {
    return () => {
      setStoreError(null);
    };
  }, [setStoreError]);

  /**
   * ดึงข้อมูลผู้ใช้ปัจจุบัน
   */
  const getCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const user = await fetchCurrentUser();
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  /**
   * ดึงข้อมูลโปรไฟล์ผู้ใช้ตาม ID
   * @param userId ID ของผู้ใช้
   * @param forceRefresh บังคับให้ดึงข้อมูลใหม่แม้จะมีข้อมูลในแคชแล้ว
   */
  const getUserProfile = useCallback(async (userId: string, forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // ตรวจสอบว่ามีข้อมูลในแคชหรือไม่
      if (!forceRefresh && userProfiles[userId]) {
        setLoading(false);
        return userProfiles[userId];
      }
      
      const profile = await fetchUserProfile(userId);
      return profile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, userProfiles]);

  /**
   * อัปเดตข้อมูลโปรไฟล์ผู้ใช้
   * @param userId ID ของผู้ใช้
   * @param data ข้อมูลที่ต้องการอัปเดต
   */
  const updateUserProfile = useCallback(async (userId: string, data: UpdateProfileRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedUser = await updateProfile(userId, data);
      return updatedUser;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [updateProfile]);

  /**
   * อัปโหลดรูปโปรไฟล์
   * @param userId ID ของผู้ใช้
   * @param file ไฟล์รูปภาพ
   * @param onProgress callback สำหรับติดตามความคืบหน้า
   */
  const uploadUserProfileImage = useCallback(async (
    userId: string,
    file: File,
    onProgress?: (percentage: number) => void
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const imageUrl = await uploadProfileImage(userId, file, onProgress);
      return imageUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [uploadProfileImage]);

  /**
   * ค้นหาผู้ใช้
   * @param query คำค้นหา
   * @param limit จำนวนผลลัพธ์สูงสุด
   * @param offset ตำแหน่งเริ่มต้นของผลลัพธ์
   */
  const search = useCallback(async (query: string, limit?: number, offset?: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await searchUsers(query, limit, offset);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการค้นหาผู้ใช้';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchUsers]);

  /**
   * ดึงสถานะของผู้ใช้หลายคน
   * @param userIds รายการ ID ของผู้ใช้
   */
  const getUserStatuses = useCallback(async (userIds: string[]) => {
    try {
      const statuses = await fetchUserStatuses(userIds);
      return statuses;
    } catch (error) {
      console.error('Error fetching user statuses:', error);
      return {};
    }
  }, [fetchUserStatuses]);

  /**
   * ดึงสถานะของผู้ใช้ตาม ID
   * @param userId ID ของผู้ใช้
   */
  const getUserStatus = useCallback((userId: string): UserStatusItem | null => {
    return userStatuses[userId] || null;
  }, [userStatuses]);

  /**
   * ตรวจสอบว่าผู้ใช้ออนไลน์อยู่หรือไม่
   * @param userId ID ของผู้ใช้
   */
  const isUserOnline = useCallback((userId: string): boolean => {
    return userStatuses[userId]?.status === 'online';
  }, [userStatuses]);

  /**
   * ฟังก์ชันเพื่อเรียกใช้เมื่อต้องการอัปเดตสถานะผู้ใช้ (จะถูกเรียกเป็นระยะๆ)
   * @param userIds รายการ ID ของผู้ใช้ที่ต้องการตรวจสอบสถานะ
   */
  const refreshUserStatuses = useCallback((userIds: string[]) => {
    return fetchUserStatuses(userIds);
  }, [fetchUserStatuses]);

  return {
    currentUser,
    userProfiles,
    userStatuses,
    searchResults,
    loading,
    error,
    getCurrentUser,
    getUserProfile,
    updateUserProfile,
    uploadUserProfileImage,
    search,
    getUserStatuses,
    getUserStatus,
    isUserOnline,
    refreshUserStatuses,
    setError,
  };
};

export default useUser;