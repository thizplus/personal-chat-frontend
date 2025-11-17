// src/components/standard/friends/FriendHeader.tsx
import React from 'react';
import { Search, UserPlus, Users } from 'lucide-react';

interface FriendHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddFriend: () => void;
  onCreateGroup: () => void;
  isMobile: boolean;
  activeCategory: string;
}

const FriendHeader: React.FC<FriendHeaderProps> = ({
  searchQuery,
  onSearchChange,
  onAddFriend,
  onCreateGroup,
  isMobile,
  activeCategory
}) => {
  // กำหนดหัวข้อตาม category ที่เลือก
  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'all': return 'รายชื่อเพื่อน';
      case 'groups': return 'กลุ่มสนทนา';
      case 'official': return 'บัญชีทางการ';
      case 'pending': return 'คำขอเป็นเพื่อน';
      case 'blocked': return 'ผู้ใช้ที่ถูกบล็อก';
      default: return 'รายชื่อเพื่อน';
    }
  };

  // คำอธิบายตาม category ที่เลือก
  const getCategoryDescription = () => {
    switch (activeCategory) {
      case 'all': return 'จัดการรายชื่อเพื่อนของคุณ';
      case 'groups': return 'กลุ่มสนทนาที่คุณเป็นสมาชิก';
      case 'official': return 'บัญชีทางการที่คุณติดตาม';
      case 'pending': return 'คำขอเป็นเพื่อนที่รอการตอบรับ';
      case 'blocked': return 'ผู้ใช้ที่คุณบล็อก';
      default: return 'จัดการรายชื่อเพื่อนและคำขอเป็นเพื่อน';
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-card-foreground mb-2">{getCategoryTitle()}</h1>
      <p className="text-muted-foreground text-sm mb-6">{getCategoryDescription()}</p>
      
      {/* ส่วนค้นหาและปุ่มเพิ่ม */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder={`ค้นหา${activeCategory === 'all' ? 'เพื่อน' : activeCategory === 'groups' ? 'กลุ่ม' : activeCategory === 'official' ? 'บัญชีทางการ' : ''}...`}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-full text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {/* แสดงปุ่มตาม category */}
        {activeCategory === 'all' && (
          <button 
            onClick={onAddFriend}
            className="bg-primary text-primary-foreground rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium"
          >
            <UserPlus size={18} />
            {!isMobile && <span>เพิ่มเพื่อน</span>}
          </button>
        )}
        
        {activeCategory === 'groups' && (
          <button 
            onClick={onCreateGroup}
            className="bg-primary text-primary-foreground rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium"
          >
            <Users size={18} />
            {!isMobile && <span>สร้างกลุ่ม</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default FriendHeader;