// src/components/standard/conversation/ChatHeader.tsx
import React, { useState } from 'react';
import { User, MoreVertical } from 'lucide-react';
import type { ConversationDTO } from '@/types/conversation.types';
import { ConversationDetailsSheet } from './ConversationDetailsSheet';

interface ChatHeaderProps {
  activeChat?: ConversationDTO;
  otherUserId?: string;
  currentUserId: string;
  isUserOnline?: (userId: string) => boolean; // รับ function นี้จาก parent
  onToggleMute?: () => Promise<boolean>;
  onTogglePin?: () => Promise<boolean>;
  onRemoveMember?: (memberId: string) => Promise<boolean>;
  onLeaveGroup?: () => Promise<boolean>;
  onJumpToMessage?: (messageId: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  activeChat,
  otherUserId,
  currentUserId,
  isUserOnline = () => false, // กำหนดค่าเริ่มต้นเป็น function ที่คืนค่า false
  onToggleMute,
  onTogglePin,
  onRemoveMember,
  onLeaveGroup,
  onJumpToMessage
}) => {
  const [showConversationDetails, setShowConversationDetails] = useState(false);
  // ตรวจสอบสถานะ
  const isOnline = otherUserId ? isUserOnline(otherUserId) : false;
  
  // กำหนดข้อความและสีสถานะ
  const getStatusDisplay = () => {
    if (!otherUserId) {
      if (activeChat?.type === 'group') {
        return { text: `${activeChat.member_count || 0} สมาชิก`, color: 'text-muted-foreground' };
      }
      if (activeChat?.type === 'business') {
        return { text: 'ธุรกิจ', color: 'text-muted-foreground' };
      }
      return { text: '', color: 'text-muted-foreground' };
    }

    if (isOnline) {
      return { text: 'ออนไลน์', color: 'text-emerald-600 dark:text-emerald-400' };
    }

    return { text: 'ออฟไลน์', color: 'text-muted-foreground' };
  };

  const statusDisplay = getStatusDisplay();

  if (!activeChat) return null;

  return (
    <>
    <div className="h-16 w-full bg-card border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center relative">
          {activeChat.icon_url ? (
            <img
              src={activeChat.icon_url}
              alt={activeChat.title || ''}
              className="w-full h-full object-cover rounded-full overflow-hidden"
            />
          ) : (
            <User size={18} className="text-muted-foreground" />
          )}
          
          {/* แสดงจุดสถานะออนไลน์ */}
          {otherUserId && (
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-card ${
              isOnline ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-muted'
            }`}></div>
          )}
        </div>
        <div>
          <h2 className="text-sm font-medium text-card-foreground">{activeChat.title}</h2>
          <p className={` ${statusDisplay.color}`}>
            {statusDisplay.text}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* MoreVertical button - เปิด ConversationDetailsSheet */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent text-muted-foreground hover:text-accent-foreground transition-colors"
          onClick={() => setShowConversationDetails(true)}
        >
          <MoreVertical size={18} />
        </button>
      </div>
    </div>

    {/* Conversation Details Sheet */}
    <ConversationDetailsSheet
      open={showConversationDetails}
      onOpenChange={setShowConversationDetails}
      conversation={activeChat}
      currentUserId={currentUserId}
      isUserOnline={isUserOnline}
      onRemoveMember={onRemoveMember}
      onLeaveGroup={onLeaveGroup}
      onToggleMute={onToggleMute}
      onTogglePin={onTogglePin}
      onJumpToMessage={onJumpToMessage}
    />
    </>
  );
};

export default React.memo(ChatHeader);