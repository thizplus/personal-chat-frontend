// src/components/standard/conversation/ConversationsList.tsx

import React, { useState, useCallback, memo, useMemo } from 'react';
import { Search, User, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';

import ConversationItem from './ConversationItem';
import CategoryTab from './CategoryTab';
import type { ConversationDTO, ConversationType } from '@/types/conversation.types';

// Helper function เพื่อแปลง timestamp เป็นค่าตัวเลขสำหรับเรียงลำดับ
const getTimestampValue = (timestamp?: string): number => {
  if (!timestamp) return 0;
  return new Date(timestamp).getTime();
};

interface ConversationsListProps {
  conversations: ConversationDTO[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onTogglePin: (conversationId: string, isPinned: boolean) => Promise<boolean>;
  onToggleMute: (conversationId: string, isMuted: boolean) => Promise<boolean>;
  isUserOnline?: (userId: string) => boolean; // เพิ่ม prop นี้

  // ✅ Optional context menu actions
  onViewDetails?: (conversationId: string) => void;
  onBlockUser?: (conversationId: string) => void;
  onLeaveGroup?: (conversationId: string) => void;
  onArchive?: (conversationId: string) => void;
  onDelete?: (conversationId: string) => void;
}

// สร้าง component ด้านนอก และใช้ React.memo เพื่อป้องกันการ render ซ้ำเมื่อ props ไม่เปลี่ยนแปลง
const ConversationsList = memo(({
  conversations,
  activeConversationId,
  onSelectConversation,
  onTogglePin,
  onToggleMute,
  isUserOnline = () => false, // กำหนดค่าเริ่มต้นเป็น function ที่คืนค่า false
  onDelete,
}: ConversationsListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<ConversationType[]>([]);
  const isMobile = useIsMobile();

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleCategory = useCallback((type: ConversationType) => {
    setSelectedTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  }, []);

  // นับจำนวนข้อความที่ยังไม่ได้อ่านในแต่ละหมวดหมู่ - แปลงเป็น useMemo
  const { unreadDirectCount, unreadGroupCount } = useMemo(() => {
    const direct = conversations
      .filter(c => c.type === 'direct' && c.unread_count > 0)
      .reduce((sum, c) => sum + (c.unread_count || 0), 0);

    const group = conversations
      .filter(c => c.type === 'group' && c.unread_count > 0)
      .reduce((sum, c) => sum + (c.unread_count || 0), 0);

    return { unreadDirectCount: direct, unreadGroupCount: group };
  }, [conversations]);

  // กรองการสนทนาตามคำค้นหาและประเภทที่เลือก และเรียงลำดับตามเวลาล่าสุด - แปลงเป็น useMemo
  const filteredConversations = useMemo(() => {
    // ก่อนอื่นแยกการสนทนาที่ปักหมุดและไม่ได้ปักหมุด
    const pinnedConversations: ConversationDTO[] = [];
    const unpinnedConversations: ConversationDTO[] = [];
    
    conversations.forEach(conv => {
      if (conv.is_pinned) {
        pinnedConversations.push(conv);
      } else {
        unpinnedConversations.push(conv);
      }
    });
    
    // กรองและเรียงลำดับทั้งสองส่วน
    const filterAndSort = (convs: ConversationDTO[]) => {
      return convs
        .filter(conversation => {
          // กรองตามการค้นหา
          const matchesSearch = (conversation.title || '').toLowerCase().includes(searchQuery.toLowerCase());
          
          // กรองตามประเภทที่เลือก (ถ้าไม่ได้เลือกอะไรเลย แสดงทั้งหมด)
          const matchesCategory = selectedTypes.length === 0 || selectedTypes.includes(conversation.type as ConversationType);
          
          return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
          // เรียงลำดับตามข้อความใหม่ก่อน
          const aHasUnread = (a.unread_count || 0) > 0;
          const bHasUnread = (b.unread_count || 0) > 0;
          
          if (aHasUnread && !bHasUnread) return -1;
          if (!aHasUnread && bHasUnread) return 1;
          
          // ถ้าทั้งคู่มีสถานะการแจ้งเตือนเหมือนกัน เรียงตาม timestamp
          const aTimestamp = getTimestampValue(a.last_message_at || '');
          const bTimestamp = getTimestampValue(b.last_message_at || '');
          
          return bTimestamp - aTimestamp; // เรียงจากใหม่ไปเก่า
        });
    };
    
    // รวมผลลัพธ์: แสดงการสนทนาที่ปักหมุดก่อน แล้วตามด้วยการสนทนาที่ไม่ได้ปักหมุด
    return [
      ...filterAndSort(pinnedConversations),
      ...filterAndSort(unpinnedConversations)
    ];
  }, [conversations, searchQuery, selectedTypes]);

  return (
    <div className={`bg-card border-r border-border flex flex-col h-full ${isMobile ? 'w-full' : 'w-80'}`}>
      {/* ส่วนหัวของรายการแชท */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search size={18} className="text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="ค้นหา..."
            className="w-full pl-10 pr-4 py-2 border border-input rounded-full text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        {/* แท็บหมวดหมู่แบบ toggle */}
        <div className="flex justify-between items-center gap-2 mt-3">
          <CategoryTab
            icon={User}
            label="เพื่อน"
            isSelected={selectedTypes.includes('direct')}
            unreadCount={unreadDirectCount > 0 ? unreadDirectCount : undefined}
            onClick={() => toggleCategory('direct')}
          />
          <CategoryTab
            icon={Users}
            label="กลุ่ม"
            isSelected={selectedTypes.includes('group')}
            unreadCount={unreadGroupCount > 0 ? unreadGroupCount : undefined}
            onClick={() => toggleCategory('group')}
          />
        </div>
      </div>

      {/* รายการแชท */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          filteredConversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isActive={activeConversationId === conversation.id}
              onSelect={() => onSelectConversation(conversation.id)}
              onTogglePin={onTogglePin}
              onToggleMute={onToggleMute}
              isUserOnline={isUserOnline}
              onDelete={onDelete}
            />
          ))
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            {searchQuery 
              ? 'ไม่พบผลการค้นหา' 
              : 'ไม่พบการสนทนาที่ตรงกับหมวดหมู่ที่เลือก'
            }
          </div>
        )}
      </div>
    </div>
  );
});

ConversationsList.displayName = 'ConversationsList';

export default ConversationsList;