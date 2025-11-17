// src/components/standard/conversation/MessageInputArea.tsx
import React from 'react';
import MessageInput from '@/components/shared/MessageInput';

interface MessageInputAreaProps {
  onSendMessage: (message: string) => void;
  onSendSticker: (stickerId: string, stickerUrl: string, stickerSetId: string) => void;
  onUploadImage: (file: File) => void;
  onUploadFile: (file: File) => void;
  isLoading: boolean;
  replyingTo: { id: string; text: string; sender: string } | null;
  onCancelReply: () => void;
}

/**
 * คอมโพเนนต์สำหรับส่วนป้อนข้อความ
 * แยกออกมาจาก ConversationPage เพื่อลดความซับซ้อนของ parent component
 */
const MessageInputArea: React.FC<MessageInputAreaProps> = ({
  onSendMessage,
  onSendSticker,
  onUploadImage,
  onUploadFile,
  isLoading,
  replyingTo,
  onCancelReply
}) => {
  return (
    <MessageInput
      onSendMessage={onSendMessage}
      onSendSticker={onSendSticker}
      onUploadImage={onUploadImage}
      onUploadFile={onUploadFile}
      isLoading={isLoading}
      replyingTo={replyingTo}
      onCancelReply={onCancelReply}
    />
  );
};

export default MessageInputArea;