// src/features/user/components/PasswordForm.tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { usePassword } from '@/hooks/user/usePassword';
import { Check, X } from 'lucide-react';

export function PasswordForm() {
  const { form, isLoading, error, success, onSubmit } = usePassword();
  const { register, formState } = form;
  const { errors } = formState;
  
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-foreground">
      <div className="space-y-2">
        <Label htmlFor="current_password">รหัสผ่านปัจจุบัน</Label>
        <Input
          id="current_password"
          type="password"
          placeholder="••••••••"
          {...register('current_password')}
        />
        {errors.current_password && (
          <p className="text-sm text-destructive">{errors.current_password.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new_password">รหัสผ่านใหม่</Label>
        <Input
          id="new_password"
          type="password"
          placeholder="••••••••"
          {...register('new_password')}
        />
        {errors.new_password && (
          <p className="text-sm text-destructive">{errors.new_password.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="confirm_password">ยืนยันรหัสผ่านใหม่</Label>
        <Input
          id="confirm_password"
          type="password"
          placeholder="••••••••"
          {...register('confirm_password')}
        />
        {errors.confirm_password && (
          <p className="text-sm text-destructive">{errors.confirm_password.message}</p>
        )}
      </div>
      
      {error && (
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}
      
      {success && (
        <Alert variant="default" className="border-primary text-primary">
          <Check className="h-4 w-4" />
          <AlertTitle>{success}</AlertTitle>
        </Alert>
      )}
      
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'กำลังบันทึก...' : 'เปลี่ยนรหัสผ่าน'}
      </Button>
    </form>
  );
}

export default PasswordForm;