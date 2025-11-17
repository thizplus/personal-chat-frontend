// src/features/user/pages/SettingsPage.tsx
import { useState } from 'react';
import { User, Key, LogOut, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ProfileForm } from '@/components/user/ProfileForm';
import { PasswordForm } from '@/components/user/PasswordForm';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/hooks/useNavigation';
import { Button } from '@/components/ui/button';

// ประเภทของการตั้งค่า
type SettingCategory = 'profile' | 'password' | 'logout';

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState<SettingCategory>('profile');
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { handleLogout, isLoggingOut } = useNavigation();
  
  const handleBackToMenu = () => {
    navigate('/dashboard');
  };

  // เมนูการตั้งค่า
  const settingMenus = [
    { id: 'profile', label: 'โปรไฟล์', icon: User },
    { id: 'password', label: 'รหัสผ่าน', icon: Key },
    { id: 'logout', label: 'ออกจากระบบ', icon: LogOut, danger: true }
  ];

  // เนื้อหาแต่ละหน้า
  const renderContent = () => {
    switch (activeCategory) {
      case 'profile':
        return <ProfileForm />;
      
      case 'password':
        return <PasswordForm />;
      
      default:
        return null;
    }
  };

  // สำหรับ Mobile: แสดงแท็บแนวนอนที่สามารถเลื่อนได้
  if (isMobile) {
    // สำหรับ logout ให้ทำงานทันที
    if (activeCategory === 'logout') {
      handleLogout();
      // รีเซ็ตกลับไปที่หน้าโปรไฟล์หลังจากกดออกจากระบบ
      setActiveCategory('profile');
    }
    
    return (
      <div className="h-full flex flex-col bg-card">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToMenu}
              className="p-1 rounded-full hover:bg-muted/50"
            >
              <ArrowLeft size={20} className="text-card-foreground" />
            </button>
            <h1 className="text-lg font-medium text-card-foreground">การตั้งค่า</h1>
          </div>
          <p className=" text-muted-foreground mt-1">จัดการบัญชีและความเป็นส่วนตัวของคุณ</p>
        </div>
        
        {/* แท็บแนวนอนที่สามารถเลื่อนได้ */}
        <div className="border-b border-border relative">
          <div className="overflow-x-auto hide-scrollbar">
            <div className="flex whitespace-nowrap py-2 px-4">
              {settingMenus.filter(menu => menu.id !== 'logout').map((menu) => (
                <button 
                  key={menu.id}
                  className={`px-4 py-2 text-sm font-medium flex items-center gap-2 mr-2
                    ${activeCategory === menu.id 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:bg-muted/50'}`}
                  onClick={() => setActiveCategory(menu.id as SettingCategory)}
                >
                  <menu.icon size={16} />
                  <span>{menu.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* เนื้อหาของแท็บที่เลือก */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderContent()}
        </div>

        {/* แสดงปุ่มออกจากระบบแยกต่างหาก */}
        <div className="border-t border-border p-4">
          <Button 
            variant="destructive"
            className="w-full flex items-center justify-center gap-2 p-6"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={18} />
            <span>{isLoggingOut ? 'กำลังออกจากระบบ...' : 'ออกจากระบบ'}</span>
          </Button>
        </div>
      </div>
    );
  }

  // สำหรับ Desktop: แสดงทั้งเมนูและเนื้อหาคู่กัน
  return (
    <div className="h-full w-full md:w-3/5 mx-auto flex flex-col bg-background">
      <div className="p-6 flex items-center gap-3">
        <button
          onClick={handleBackToMenu}
          className="p-1 rounded-full hover:bg-muted/50"
        >
          <ArrowLeft size={20} className="text-card-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground">การตั้งค่า</h1>
          <p className="text-muted-foreground text-sm">จัดการบัญชีและความเป็นส่วนตัวของคุณ</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex gap-6">
          {/* เมนูด้านซ้าย */}
          <div className="w-60 bg-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-medium text-card-foreground">การตั้งค่า</h2>
            </div>
            
            <nav>
              {settingMenus.map((menu) => (
                <button 
                  key={menu.id}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 ${
                    activeCategory === menu.id 
                      ? 'bg-primary/10 text-primary' 
                      : menu.danger 
                        ? 'text-destructive hover:bg-destructive/10' 
                        : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                  onClick={() => menu.id === 'logout' ? handleLogout() : setActiveCategory(menu.id as SettingCategory)}
                  disabled={menu.id === 'logout' && isLoggingOut}
                >
                  <menu.icon size={18} />
                  <span className="text-sm">
                    {menu.id === 'logout' && isLoggingOut 
                      ? 'กำลังออกจากระบบ...' 
                      : menu.label}
                  </span>
                </button>
              ))}
            </nav>
          </div>
          
          {/* เนื้อหาด้านขวา */}
          <div className="flex-1 bg-card rounded-xl shadow-sm overflow-hidden">
            {!isMobile && activeCategory !== 'logout' && (
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-medium text-card-foreground">
                  {activeCategory === 'profile' && 'ข้อมูลโปรไฟล์'}
                  {activeCategory === 'password' && 'เปลี่ยนรหัสผ่าน'}
                </h2>
              </div>
            )}
            <div className="p-4">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// เพิ่ม CSS สำหรับซ่อน scrollbar แต่ยังเลื่อนได้
export const scrollbarStyles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;