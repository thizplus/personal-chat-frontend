// src/features/user/validators/userValidators.ts
import { z } from 'zod';

export const profileUpdateSchema = z.object({
  display_name: z.string().min(1, 'ชื่อที่แสดงต้องมีอย่างน้อย 1 ตัวอักษร'),
  bio: z.string().optional(),
});

export const passwordUpdateSchema = z.object({
  current_password: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  new_password: z.string().min(8, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'),
  confirm_password: z.string().min(1, 'กรุณายืนยันรหัสผ่านใหม่')
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirm_password']
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>;