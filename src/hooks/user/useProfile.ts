// src/hooks/user/useProfile.ts
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useUser from '@/hooks/useUser';
import useAuth from '@/hooks/useAuth';
import type { UpdateProfileRequest } from '@/types/user.types';

// สร้าง schema สำหรับตรวจสอบข้อมูลโปรไฟล์
const profileSchema = z.object({
  display_name: z.string()
    .min(1, 'ชื่อที่แสดงต้องไม่ว่างเปล่า')
    .max(50, 'ชื่อที่แสดงต้องไม่เกิน 50 ตัวอักษร'),
  bio: z.string()
    .max(255, 'ข้อมูลเกี่ยวกับตัวคุณต้องไม่เกิน 255 ตัวอักษร')
    .optional(),
});

// สร้าง type จาก schema
type ProfileFormValues = z.infer<typeof profileSchema>;

/**
 * Hook สำหรับการจัดการฟอร์มโปรไฟล์ผู้ใช้
 */
export const useProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();
  const { 
    currentUser, 
    updateUserProfile, 
    uploadUserProfileImage, 
    getCurrentUser 
  } = useUser();

  // สร้าง form hook พร้อมทั้งตั้งค่าการตรวจสอบข้อมูล
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: currentUser?.display_name || '',
      bio: currentUser?.bio || '',
    },
  });

  // อัปเดตค่าเริ่มต้นของฟอร์มเมื่อข้อมูลผู้ใช้เปลี่ยนแปลง
  useEffect(() => {
    if (currentUser) {
      form.reset({
        display_name: currentUser.display_name || '',
        bio: currentUser.bio || '',
      });
    }
  }, [currentUser, form]);

  // โหลดข้อมูลผู้ใช้เมื่อ component mount หรือเมื่อ user ID เปลี่ยน
  useEffect(() => {
    if (user?.id) {
      getCurrentUser();
    }
  }, [user?.id, getCurrentUser]);

  /**
   * จัดการการส่งฟอร์ม
   */
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) {
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // สร้าง request object สำหรับส่งไปยัง service
      const updateRequest: UpdateProfileRequest = {
        display_name: values.display_name,
        bio: values.bio,
      };

      // เรียกใช้ updateUserProfile function จาก useUser hook
      const result = await updateUserProfile(user.id, updateRequest);
      
      if (result) {
        setSuccess('อัปเดตข้อมูลโปรไฟล์สำเร็จ');
      } else {
        setError('อัปเดตข้อมูลโปรไฟล์ไม่สำเร็จ');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * อัปโหลดรูปโปรไฟล์
   */
  const uploadProfileImage = async (file: File) => {
    if (!user?.id) {
      return { 
        success: false, 
        message: 'ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่' 
      };
    }

    try {
      setIsLoading(true);
      setError(null);

      // สร้าง callback สำหรับติดตามความคืบหน้า
      const onProgress = (percentage: number) => {
        console.log(`อัปโหลดรูปโปรไฟล์: ${percentage}%`);
      };

      // เรียกใช้ uploadUserProfileImage function จาก useUser hook
      const imageUrl = await uploadUserProfileImage(user.id, file, onProgress);
      
      if (imageUrl) {
        setSuccess('อัปโหลดรูปโปรไฟล์สำเร็จ');
        return { success: true, imageUrl };
      } else {
        setError('อัปโหลดรูปโปรไฟล์ไม่สำเร็จ');
        return { 
          success: false, 
          message: 'อัปโหลดรูปโปรไฟล์ไม่สำเร็จ' 
        };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์';
      setError(errorMessage);
      return { 
        success: false, 
        message: errorMessage 
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    error,
    success,
    user: currentUser,
    onSubmit: form.handleSubmit(onSubmit),
    uploadProfileImage,
    setError,
    setSuccess,
  };
};

export default useProfile;