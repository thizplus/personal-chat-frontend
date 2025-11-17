// src/hooks/user/usePassword.ts
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuth from '@/hooks/useAuth';
import userService from '@/services/userService';

// สร้าง schema สำหรับตรวจสอบข้อมูลเปลี่ยนรหัสผ่าน
const passwordSchema = z.object({
  current_password: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  new_password: z.string()
    .min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร')
    .max(100, 'รหัสผ่านใหม่ต้องไม่เกิน 100 ตัวอักษร'),
  confirm_password: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่'),
}).refine(data => data.new_password === data.confirm_password, {
  message: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน',
  path: ['confirm_password'],
});

// สร้าง type จาก schema
type PasswordFormValues = z.infer<typeof passwordSchema>;

/**
 * Hook สำหรับการจัดการฟอร์มเปลี่ยนรหัสผ่าน
 */
export const usePassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  // สร้าง form hook พร้อมทั้งตั้งค่าการตรวจสอบข้อมูล
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  /**
   * จัดการการส่งฟอร์ม
   */
  const onSubmit = async (values: PasswordFormValues) => {
    if (!user?.id) {
      setError('ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // เรียกใช้ updatePassword function จาก userService
      const response = await userService.updatePassword(
        user.id,
        values.current_password,
        values.new_password
      );
      
      if (response.success) {
        setSuccess('เปลี่ยนรหัสผ่านสำเร็จ');
        // รีเซ็ตฟอร์ม
        form.reset({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        setError(response.message || 'เปลี่ยนรหัสผ่านไม่สำเร็จ');
      }
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    error,
    success,
    onSubmit: form.handleSubmit(onSubmit),
    setError,
    setSuccess,
  };
};

export default usePassword;