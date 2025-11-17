// src/components/standard/conversation/desktop/DesktopConversationView.tsx
import React from 'react';
import type { MessageDTO } from '@/types/message.types';
import type { ConversationDTO } from '@/types/conversation.types';

// นำเข้าคอมโพเนนต์
import ConversationsList from '@/components/standard/conversation/ConversationsList';
import ChatHeader from '@/components/standard/conversation/ChatHeader';
import MessageArea, { type MessageAreaRef } from '@/components/shared/MessageArea';
import MessageInputArea from '@/components/shared/MessageInputArea';
import EmptyConversationView from '@/components/standard/conversation/EmptyConversationView';

interface DesktopConversationViewProps {
  // state
  conversations: ConversationDTO[];
  activeConversationId: string | null;
  conversationMessages: MessageDTO[];
  isSending: boolean;
  isLoadingMoreMessages: boolean;
  editingMessageId: string | null;
  editingContent: string;
  replyingTo: { id: string; text: string; sender: string } | null;
  
  // data
  currentUserId: string;
  activeChat: ConversationDTO | null;
  chatPartnerId?: string;
  isUserOnline: (userId: string) => boolean;
  
  // handlers
  handleSelectConversation: (id: string) => void;
  handleSendMessage: (message: string) => void;
  handleSendSticker: (stickerId: string, stickerUrl: string, stickerSetId: string) => void;
  handleUploadImage: (file: File) => void;
  handleUploadFile: (file: File) => void;
  handleLoadMoreMessages: () => void;
  handleLoadMoreMessagesAtBottom: () => void;
  handleReplyToMessage: (messageId: string) => void;
  handleEditMessage: (messageId: string) => void;
  handleResendMessage: (messageId: string) => void;
  handleConfirmEdit: () => void;
  handleCancelEdit: () => void;
  handleCancelReply: () => void;
  handleJumpToMessage: (messageId: string) => void;
  setEditingContent: (content: string) => void;
  togglePin: (conversationId: string, isPinned: boolean) => Promise<boolean>;
  toggleMute: (conversationId: string, isMuted: boolean) => Promise<boolean>;
  messageAreaRef?: React.RefObject<MessageAreaRef | null>;
}

/**
 * คอมโพเนนต์สำหรับแสดงหน้าแชทบน desktop
 * แยกออกมาจาก ConversationPage เพื่อรองรับการแสดงผลที่แตกต่างระหว่าง mobile และ desktop
 */
const DesktopConversationView: React.FC<DesktopConversationViewProps> = React.memo(({
  // state
  conversations,
  activeConversationId,
  conversationMessages,
  isSending,
  isLoadingMoreMessages,
  editingMessageId,
  editingContent,
  replyingTo,
  
  // data
  currentUserId,
  activeChat,
  chatPartnerId,
  isUserOnline,
  
  // handlers
  handleSelectConversation,
  handleSendMessage,
  handleSendSticker,
  handleUploadImage,
  handleUploadFile,
  handleLoadMoreMessages,
  handleLoadMoreMessagesAtBottom,
  handleReplyToMessage,
  handleEditMessage,
  handleResendMessage,
  handleConfirmEdit,
  handleCancelEdit,
  handleCancelReply,
  handleJumpToMessage,
  setEditingContent,
  togglePin,
  toggleMute,
  messageAreaRef
}) => {
  return (
    <div className="flex flex-1">
      {/* Conversation List */}
      <ConversationsList
        conversations={conversations}
        activeConversationId={activeConversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onTogglePin={togglePin}
        onToggleMute={toggleMute}
        isUserOnline={isUserOnline}
      />

      {/* Message View */}
      <div className="flex-1 flex flex-col">
        {activeConversationId && activeChat ? (
          <>
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
                // TODO: Implement leave group functionality
                console.log('Leave group not implemented yet');
                return false;
              }}
              onJumpToMessage={handleJumpToMessage}
            />
            {/* Message List */}
            <MessageArea
              ref={messageAreaRef}
              messages={conversationMessages}
              isLoadingHistory={isLoadingMoreMessages}
             // isBusinessView={activeChat?.type === 'business'}
              isBusinessView={false}
              onLoadMore={handleLoadMoreMessages}
              onLoadMoreAtBottom={handleLoadMoreMessagesAtBottom}
              currentUserId={currentUserId}
              activeConversationId={activeConversationId}
              onReplyMessage={handleReplyToMessage}
              onEditMessage={handleEditMessage}
              onResendMessage={handleResendMessage}
              editingMessageId={editingMessageId}
              editingContent={editingContent}
              onEditingContentChange={setEditingContent}
              onConfirmEdit={handleConfirmEdit}
              onCancelEdit={handleCancelEdit}
            />
            
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
});

DesktopConversationView.displayName = 'DesktopConversationView';

export default DesktopConversationView;