// src/hooks/auth/useRegister.ts
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuth from '@/hooks/useAuth';
import type { RegisterRequest } from '@/types/auth.types';

// สร้าง schema สำหรับตรวจสอบข้อมูลลงทะเบียน
const registerSchema = z.object({
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  display_name: z.string().min(1, 'กรุณากรอกชื่อที่แสดง'),
  password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  confirmPassword: z.string().min(1, 'กรุณายืนยันรหัสผ่าน'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

// สร้าง type จาก schema
type RegisterFormValues = z.infer<typeof registerSchema>;

/**
 * Hook สำหรับการจัดการฟอร์มลงทะเบียน
 * @param redirectTo เส้นทางที่ต้องการให้นำทางไปหลังจากลงทะเบียนสำเร็จ (ค่าเริ่มต้นคือ '/')
 */
export const useRegister = (redirectTo: string = '/') => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register: registerUser } = useAuth();

  // สร้าง form hook พร้อมทั้งตั้งค่าการตรวจสอบข้อมูล
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      display_name: '',
      password: '',
      confirmPassword: '',
    },
  });

  /**
   * จัดการการส่งฟอร์ม
   */
  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // สร้าง request object สำหรับส่งไปยัง service
      const registerRequest: RegisterRequest = {
        username: values.username,
        email: values.email,
        display_name: values.display_name,
        password: values.password,
      };

      // เรียกใช้ register function จาก useAuth hook
      const success = await registerUser(registerRequest, redirectTo);
      
      if (!success) {
        // ในกรณีที่ลงทะเบียนไม่สำเร็จแต่ไม่มี error message จาก server
        setError('ลงทะเบียนไม่สำเร็จ อาจมีชื่อผู้ใช้หรืออีเมลนี้ในระบบแล้ว');
      }
      
      // หากสำเร็จ การนำทางจะถูกจัดการโดย register function ใน useAuth hook แล้ว
    } catch (err) {
      // จัดการกับข้อผิดพลาดที่ไม่ได้คาดการณ์
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลงทะเบียน';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    error,
    onSubmit: form.handleSubmit(onSubmit),
    setError,
  };
};

export default useRegister;