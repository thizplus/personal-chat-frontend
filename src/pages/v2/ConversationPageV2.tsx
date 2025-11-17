// src/pages/v2/ConversationPageV2.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import { useConversationPageLogic } from '@/pages/standard/converstion/hooks/useConversationPageLogic';

// Import components ที่ทำงานดีอยู่แล้ว
import ConversationsList from '@/components/standard/conversation/ConversationsList';
import ChatHeader from '@/components/standard/conversation/ChatHeader';
import MessageArea from '@/components/shared/MessageArea';
import MessageInputArea from '@/components/shared/MessageInputArea';
import EmptyConversationView from '@/components/standard/conversation/EmptyConversationView';

/**
 * ConversationPageV2 - Layout ใหม่ที่เรียบง่าย
 *
 * โครงสร้าง:
 * ┌─────────────────────────────────────┐
 * │ ConversationsList │ Chat Area       │
 * │ (320px, scroll)   │ ├─ ChatHeader   │
 * │                   │ ├─ MessageArea  │ ← Virtua scroll
 * │                   │ └─ InputArea    │
 * └─────────────────────────────────────┘
 *
 * ✅ ไม่มี overflow ซ้อน
 * ✅ height calculation ชัดเจน (h-screen -> flex-1)
 * ✅ Virtua จัดการ scroll เอง
 */
const ConversationPageV2: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();

  // ใช้ logic เดิม
  const {
    conversations,
    activeConversationId,
    conversationMessages,
    isSending,
    isLoadingMoreMessages,
    replyingTo,
    currentUserId,
    activeChat,
    chatPartnerId,
    isUserOnline,
    handleSelectConversation,
    handleSendMessage,
    handleSendSticker,
    handleUploadImage,
    handleUploadFile,
    handleLoadMoreMessages,
    handleReplyToMessage,
    handleEditMessage,
    handleResendMessage,
    handleCancelReply,
    handleJumpToMessage,
    togglePin,
    toggleMute,
    messageAreaRef,
  } = useConversationPageLogic(conversationId);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Conversations List - fixed width, own scroll */}
      <div className="w-80 shrink-0 flex flex-col overflow-hidden">
        <ConversationsList
          conversations={conversations}
          activeConversationId={activeConversationId || undefined}
          onSelectConversation={handleSelectConversation}
          onTogglePin={togglePin}
          onToggleMute={toggleMute}
          isUserOnline={isUserOnline}
        />
      </div>

      {/* Chat Area - flex-1, no overflow */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeConversationId && activeChat ? (
          <>
            {/* Chat Header - fixed height */}
            <ChatHeader
              activeChat={activeChat}
              otherUserId={chatPartnerId}
              currentUserId={currentUserId}
              isUserOnline={isUserOnline}
              onToggleMute={async () => {
                if (!activeConversationId) return false;
                return toggleMute(activeConversationId, !activeChat.is_muted);
              }}
              onTogglePin={async () => {
                if (!activeConversationId) return false;
                return togglePin(activeConversationId, !activeChat.is_pinned);
              }}
              onLeaveGroup={async () => {
                console.log('Leave group not implemented yet');
                return false;
              }}
              onJumpToMessage={handleJumpToMessage}
            />

            {/* Message Area - flex-1 with Virtua scroll */}
            <MessageArea
              ref={messageAreaRef}
              messages={conversationMessages}
              isLoadingHistory={isLoadingMoreMessages}
              isBusinessView={false}
              onLoadMore={handleLoadMoreMessages}
              currentUserId={currentUserId}
              activeConversationId={activeConversationId}
              onReplyMessage={handleReplyToMessage}
              onEditMessage={handleEditMessage}
              onResendMessage={handleResendMessage}
            />

            {/* Message Input - fixed height */}
            <MessageInputArea
              onSendMessage={handleSendMessage}
              onSendSticker={handleSendSticker}
              onUploadImage={handleUploadImage}
              onUploadFile={handleUploadFile}
              isLoading={isSending}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
            />
          </>
        ) : (
          <EmptyConversationView />
        )}
      </div>
    </div>
  );
};

export default ConversationPageV2;
