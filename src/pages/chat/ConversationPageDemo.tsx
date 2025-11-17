// src/pages/chat/ConversationPageDemo.tsx
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useConversationPageLogic } from '@/pages/standard/converstion/hooks/useConversationPageLogic';
import { useMessageJump } from '@/contexts/MessageJumpContext';
import MessageArea from '@/components/shared/MessageArea';
import MessageInputArea from '@/components/shared/MessageInputArea';

/**
 * ConversationPageDemo - Message list with MessageArea (Virtua + Full rendering)
 * ใช้ MessageArea component ที่มี sticker, emoji, images rendering
 * Header และ Sheet อยู่ใน ChatLayout แล้ว
 *
 * Step 2: เปลี่ยนเป็น MessageArea component พร้อม useConversationPageLogic
 */
export default function ConversationPageDemo() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { setJumpToMessage } = useMessageJump();

  // ใช้ useConversationPageLogic hook ที่มี logic ครบถ้วน
  const {
    conversationMessages,
    isSending,
    isLoadingMoreMessages,
    replyingTo,
    currentUserId,
    handleSendMessage,
    handleSendSticker,
    handleUploadImage,
    handleUploadFile,
    handleLoadMoreMessages,
    handleLoadMoreMessagesAtBottom, // ⬇️ NEW: Load newer messages (for Jump context)
    handleReplyToMessage,
    handleEditMessage,
    handleResendMessage,
    handleCancelReply,
    handleJumpToMessage,
    messageAreaRef,
  } = useConversationPageLogic(conversationId);

  // ✅ Register jumpToMessage in MessageJumpContext
  useEffect(() => {
    setJumpToMessage(handleJumpToMessage);
  }, [handleJumpToMessage, setJumpToMessage]);

  return (
    <div className="flex flex-col h-full">
      {/* Message Area with Virtua - handles sticker, emoji, images */}
      <MessageArea
        ref={messageAreaRef}
        messages={conversationMessages}
        isLoadingHistory={isLoadingMoreMessages}
        isBusinessView={false}
        onLoadMore={handleLoadMoreMessages}
        onLoadMoreAtBottom={handleLoadMoreMessagesAtBottom}
        currentUserId={currentUserId}
        activeConversationId={conversationId || ''}
        onReplyMessage={handleReplyToMessage}
        onEditMessage={handleEditMessage}
        onResendMessage={handleResendMessage}
        onJumpToMessage={handleJumpToMessage}
      />

      {/* Message Input Area - fixed height */}
      <MessageInputArea
        onSendMessage={handleSendMessage}
        onSendSticker={handleSendSticker}
        onUploadImage={handleUploadImage}
        onUploadFile={handleUploadFile}
        isLoading={isSending}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
    </div>
  );
}
