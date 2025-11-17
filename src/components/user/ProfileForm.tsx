// src/features/user/components/ProfileForm.tsx
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { useProfile } from '@/hooks/user/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type ChangeEvent, useRef } from 'react';
import { Camera, Check, X } from 'lucide-react';

export function ProfileForm() {
  const { form, isLoading, error, success, user, onSubmit, uploadProfileImage } = useProfile();
  const { register, formState } = form;
  const { errors } = formState;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // อัพโหลดรูปภาพ
    const result = await uploadProfileImage(file);
    if (!result.success) {
      alert(result.message);
    }
  };
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex flex-col items-center mb-6">
        <div 
          className="relative cursor-pointer group" 
          onClick={handleImageClick}
        >
          <Avatar className="w-20 h-20">
            <AvatarImage src={user?.profile_image_url || ''} alt={user?.display_name} />
            <AvatarFallback className="text-xl">
              {user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-foreground/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-background" />
          </div>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          className="hidden" 
          accept="image/*"
          onChange={handleFileChange}
        />
        <p className=" text-muted-foreground mt-2">คลิกที่รูปเพื่อเปลี่ยนรูปโปรไฟล์</p>
      </div>
      
      <div className="space-y-4 text-foreground">
        <div className="space-y-2">
          <Label htmlFor="display_name">ชื่อที่แสดง</Label>
          <Input
            id="display_name"
            placeholder="ชื่อที่แสดงในแอพ"
            {...register('display_name')}
          />
          {errors.display_name && (
            <p className="text-sm text-destructive">{errors.display_name.message}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">เกี่ยวกับฉัน</Label>
          <Textarea
            id="bio"
            placeholder="เกี่ยวกับตัวคุณ (ไม่บังคับ)"
            rows={4}
            {...register('bio')}
            error={!!errors.bio}
          />
          {errors.bio && (
            <p className="text-sm text-destructive">{errors.bio.message}</p>
          )}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">อีเมล</div>
        <div className="text-sm text-card-foreground">{user?.email}</div>
      </div>
      
      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">ชื่อผู้ใช้</div>
        <div className="text-sm text-card-foreground">{user?.username}</div>
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
        {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
      </Button>
    </form>
  );
}

export default ProfileForm;