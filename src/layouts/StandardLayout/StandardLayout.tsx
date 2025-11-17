import React from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useNavigation } from '@/hooks/useNavigation';
import Header from '@/components/layouts/standardLayout/Header';
import DesktopSidebar from '@/components/layouts/standardLayout/DesktopSidebar';
import MobileNavigation from '@/components/layouts/standardLayout/MobileNavigation';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

const StandardLayout: React.FC = () => {
  const isMobile = useIsMobile();
  const { navigate, isActiveMenu, isInChatPage, handleLogout } = useNavigation();

  return (
    <WebSocketProvider>
      <div className="flex flex-col h-screen bg-background md:flex-row">
        {/* Sidebar สำหรับ Desktop */}
        {!isMobile && (
          <DesktopSidebar
            activeMenu={isActiveMenu}
            onNavigate={navigate}
            onLogout={handleLogout}
          />
        )}

        {/* เนื้อหาหลัก */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ส่วนหัว - ใช้ CSS transform แทน conditional rendering */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isMobile && isInChatPage
                ? '-translate-y-full h-0 opacity-0'
                : 'translate-y-0 opacity-100'
            }`}
          >
            {(!isMobile || (isMobile && !isInChatPage)) && <Header />}
          </div>

          {/* เนื้อหาหลัก - ✅ overflow-hidden เพื่อให้ child จัดการ scroll เอง */}
          <main className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${
            isMobile && !isInChatPage ? 'pb-16' : 'pb-0'
          }`}>
            <Outlet />
          </main>

          {/* Bottom Navigation สำหรับ Mobile - ใช้ CSS transform */}
          <div
            className={`fixed bottom-0 left-0 right-0 transition-all duration-300 ease-in-out ${
              isMobile && !isInChatPage
                ? 'translate-y-0 opacity-100'
                : 'translate-y-full opacity-0'
            }`}
          >
            {isMobile && !isInChatPage && (
              <MobileNavigation activeMenu={isActiveMenu} onNavigate={navigate} />
            )}
          </div>
        </div>
      </div>
    </WebSocketProvider>
  );
};

export default StandardLayout;