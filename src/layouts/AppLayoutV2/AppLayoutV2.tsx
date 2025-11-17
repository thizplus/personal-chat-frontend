// src/layouts/AppLayoutV2/AppLayoutV2.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { MessageSquare, Users, Settings, LogOut } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

/**
 * Layout V2 - เรียบง่าย ไม่มี overflow ซ้อน
 *
 * โครงสร้าง:
 * - Desktop: Sidebar (80px) + Main Content (flex-1)
 * - ไม่มี Header แยก (ทำให้ layout เรียบง่าย)
 * - Main content ไม่มี overflow-auto (ให้ page จัดการเอง)
 */
const AppLayoutV2: React.FC = () => {
  const { navigate, isActiveMenu, handleLogout } = useNavigation();

  // Menu items
  const menuItems = [
    { icon: MessageSquare, path: '/v2/dashboard', label: 'Messages' },
    { icon: Users, path: '/v2/contacts', label: 'Contacts' },
    { icon: Settings, path: '/v2/settings', label: 'Settings' },
  ];

  return (
    <WebSocketProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar - 80px fixed width */}
        <aside className="w-20 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-6 shrink-0">
          {/* Logo */}
          <div className="mb-8">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground p-2 rounded-xl">
              <MessageSquare size={24} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col items-center gap-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveMenu(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                  }`}
                  title={item.label}
                >
                  <Icon size={24} />
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-sidebar-accent text-destructive transition-colors"
            title="Logout"
          >
            <LogOut size={24} />
          </button>
        </aside>

        {/* Main Content - ไม่มี overflow ให้ child จัดการเอง */}
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
      </div>
    </WebSocketProvider>
  );
};

export default AppLayoutV2;
