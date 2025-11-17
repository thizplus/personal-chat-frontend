// src/pages/standard/conversation/ConversationPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';

// นำเข้า custom hooks
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useConversationPageLogic } from './hooks/useConversationPageLogic';

// นำเข้าคอมโพเนนต์
import MobileConversationView from './mobile/MobileConversationView';
import DesktopConversationView from './desktop/DesktopConversationView';

/**
 * หน้าการสนทนา - เป็นหน้าหลักสำหรับแสดงการสนทนา
 * ปรับปรุงโดยแยกส่วน logic ไปยัง custom hook และแบ่งการแสดงผลตาม device
 */
const ConversationPage: React.FC = React.memo(() => {
  // ดึง conversationId จาก URL parameter
  const { conversationId } = useParams<{ conversationId: string }>();
  
  // ตรวจสอบว่าเป็น mobile หรือไม่
  const isMobile = useIsMobile();
  
  // ใช้ custom hook เพื่อจัดการ logic ทั้งหมด
  const {
    // State
    conversations,
    activeConversationId,
    conversationMessages,
    isSending,
    isLoadingMoreMessages,
    showMessageView,
    editingMessageId,
    editingContent,
    replyingTo,
    
    // Data
    currentUserId,
    activeChat,
    chatPartnerId,
    isUserOnline,
    
    // Handlers
    handleSelectConversation,
    handleBackToList,
    handleSendMessage,
    handleSendSticker,
    handleUploadImage,
    handleUploadFile,
    handleLoadMoreMessages,
    handleLoadMoreMessagesAtBottom,
    handleEditMessage,
    handleConfirmEdit,
    handleCancelEdit,
    handleReplyToMessage,
    handleCancelReply,
    handleResendMessage,
    handleJumpToMessage,
    setEditingContent,
    togglePin,
    toggleMute,
    messageAreaRef
  } = useConversationPageLogic(conversationId);

  // แสดงคอมโพเนนต์ตามประเภทของอุปกรณ์
  if (isMobile) {
    return (
      <MobileConversationView
        // state
        conversations={conversations}
        activeConversationId={activeConversationId}
        conversationMessages={conversationMessages}
        isSending={isSending}
        isLoadingMoreMessages={isLoadingMoreMessages}
        showMessageView={showMessageView}
        editingMessageId={editingMessageId}
        editingContent={editingContent}
        replyingTo={replyingTo}
        
        // data
        currentUserId={currentUserId}
        activeChat={activeChat}
        chatPartnerId={chatPartnerId}
        isUserOnline={isUserOnline}
        
        // handlers
        handleSelectConversation={handleSelectConversation}
        handleBackToList={handleBackToList}
        handleSendMessage={handleSendMessage}
        handleSendSticker={handleSendSticker}
        handleUploadImage={handleUploadImage}
        handleUploadFile={handleUploadFile}
        handleLoadMoreMessages={handleLoadMoreMessages}
        handleLoadMoreMessagesAtBottom={handleLoadMoreMessagesAtBottom}
        handleReplyToMessage={handleReplyToMessage}
        handleEditMessage={handleEditMessage}
        handleResendMessage={handleResendMessage}
        handleConfirmEdit={handleConfirmEdit}
        handleCancelEdit={handleCancelEdit}
        handleCancelReply={handleCancelReply}
        handleJumpToMessage={handleJumpToMessage}
        setEditingContent={setEditingContent}
        togglePin={togglePin}
        toggleMute={toggleMute}
        messageAreaRef={messageAreaRef}
      />
    );
  }

  // สำหรับ desktop
  return (
    <DesktopConversationView
      // state
      conversations={conversations}
      activeConversationId={activeConversationId}
      conversationMessages={conversationMessages}
      isSending={isSending}
      isLoadingMoreMessages={isLoadingMoreMessages}
      editingMessageId={editingMessageId}
      editingContent={editingContent}
      replyingTo={replyingTo}
      
      // data
      currentUserId={currentUserId}
      activeChat={activeChat}
      chatPartnerId={chatPartnerId}
      isUserOnline={isUserOnline}
      
      // handlers
      handleSelectConversation={handleSelectConversation}
      handleSendMessage={handleSendMessage}
      handleSendSticker={handleSendSticker}
      handleUploadImage={handleUploadImage}
      handleUploadFile={handleUploadFile}
      handleLoadMoreMessages={handleLoadMoreMessages}
      handleLoadMoreMessagesAtBottom={handleLoadMoreMessagesAtBottom}
      handleReplyToMessage={handleReplyToMessage}
      handleEditMessage={handleEditMessage}
      handleResendMessage={handleResendMessage}
      handleConfirmEdit={handleConfirmEdit}
      handleCancelEdit={handleCancelEdit}
      handleCancelReply={handleCancelReply}
      handleJumpToMessage={handleJumpToMessage}
      setEditingContent={setEditingContent}
      togglePin={togglePin}
      toggleMute={toggleMute}
      messageAreaRef={messageAreaRef}
    />
  );
});

ConversationPage.displayName = 'ConversationPage';

export default ConversationPage;