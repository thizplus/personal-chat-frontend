// src/hooks/auth/useLogin.ts
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuth from '@/hooks/useAuth';
import type { LoginRequest } from '@/types/auth.types';

// สร้าง schema สำหรับตรวจสอบข้อมูล login
const loginSchema = z.object({
  username: z.string().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
  remember: z.boolean().optional(),
});

// สร้าง type จาก schema
type LoginFormValues = z.infer<typeof loginSchema>;

/**
 * Hook สำหรับการจัดการฟอร์มเข้าสู่ระบบ
 * @param redirectTo เส้นทางที่ต้องการให้นำทางไปหลังจากเข้าสู่ระบบสำเร็จ (ค่าเริ่มต้นคือ '/')
 */
export const useLogin = (redirectTo: string = '/') => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  // สร้าง form hook พร้อมทั้งตั้งค่าการตรวจสอบข้อมูล
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
      remember: false,
    },
  });

  /**
   * จัดการการส่งฟอร์ม
   */
  const onSubmit = async (values: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // สร้าง request object สำหรับส่งไปยัง service
      const loginRequest: LoginRequest = {
        username: values.username,
        password: values.password,
      };

      // เรียกใช้ login function จาก useAuth hook
      const success = await login(loginRequest, redirectTo);
      
      if (!success) {
        // ในกรณีที่ login ไม่สำเร็จแต่ไม่มี error message จาก server
        setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่าน');
      }
      
      // หากสำเร็จ การนำทางจะถูกจัดการโดย login function ใน useAuth hook แล้ว
    } catch (err) {
      // จัดการกับข้อผิดพลาดที่ไม่ได้คาดการณ์
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
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

export default useLogin;