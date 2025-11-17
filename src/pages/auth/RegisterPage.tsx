// src/features/auth/pages/RegisterPage.tsx
import { Link } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="space-y-6 py-8">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <MessageSquare className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">สร้างบัญชีใหม่</h1>
        <p className="text-sm text-muted-foreground">
          กรอกข้อมูลของคุณเพื่อสร้างบัญชีใหม่
        </p>
      </div>

      <RegisterForm />

      <div className="mt-4 text-center text-sm">
        มีบัญชีอยู่แล้ว?{' '}
        <Link to="/auth/login" className="font-medium text-primary hover:underline">
          เข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}