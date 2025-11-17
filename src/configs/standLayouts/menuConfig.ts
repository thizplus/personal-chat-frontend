import { MessageCircle, Users, Settings, type LucideIcon } from 'lucide-react';

export interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
  size: {
    desktop: number;
    mobile: number;
  };
}

export const MENU_ITEMS: MenuItem[] = [
  {
    path: '/chat',
    icon: MessageCircle,
    label: 'แชท',
    size: { desktop: 24, mobile: 20 }
  },
  {
    path: '/chat/contacts',
    icon: Users,
    label: 'รายชื่อ',
    size: { desktop: 24, mobile: 20 }
  },
  {
    path: '/chat/settings',
    icon: Settings,
    label: 'ตั้งค่า',
    size: { desktop: 24, mobile: 20 }
  }
];