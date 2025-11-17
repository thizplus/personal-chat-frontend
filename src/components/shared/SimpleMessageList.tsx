// src/components/shared/SimpleMessageList.tsx
import { memo, forwardRef, useImperativeHandle, useCallback, useRef, useEffect } from 'react';
import type { MessageDTO } from '@/types/message.types';

// นำเข้าคอมโพเนนต์ข้อความ
import MessageContextMenu from '@/components/shared/MessageContextMenu';
import TextMessage from '@/components/shared/message/TextMessage';
import StickerMessage from '@/components/shared/message/StickerMessage';
import ImageMessage from '@/components/shared/message/ImageMessage';
import FileMessage from '@/components/shared/message/FileMessage';
import ReplyMessage from '@/components/shared/message/ReplyMessage';

interface SimpleMessageListProps {
  messages: MessageDTO[];
  currentUserId: string;
  activeConversationId: string;

  // Callbacks
  onLoadMore?: () => void;
  onReplyMessage?: (messageId: string) => void;
  onEditMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
  onResendMessage?: (messageId: string) => void;
  onImageClick?: (imageUrl: string) => void;
  scrollToMessage?: (messageId: string) => void;

  // Display options
  isBusinessView?: boolean;
  isAdmin?: boolean;
  formatTime: (timestamp: string) => string;
  getMessageStatus: (message: MessageDTO, isUser: boolean) => string | undefined;
  renderMessageStatus: (status: string | null) => string | null;
  getFormattedSender: (message: MessageDTO, defaultName?: string) => string;
  isOwnMessage: (message: MessageDTO) => boolean;
  handleCopyMessage: (content: string) => void;

  // Edit state
  editingMessageId?: string | null;
  editingContent?: string;
  onEditingContentChange?: (content: string) => void;
  onConfirmEdit?: () => void;
  onCancelEdit?: () => void;
}

export interface SimpleMessageListRef {
  scrollToMessage: (messageId: string) => void;
  scrollToBottom: (smooth?: boolean) => void;
}

/**
 * Simple Message List (NO Virtualization)
 * ไม่ใช้ virtual scrolling - render ข้อความทั้งหมด
 * เหมาะสำหรับ chat ที่มี dynamic height
 */
const SimpleMessageList = forwardRef<SimpleMessageListRef, SimpleMessageListProps>((
  {
    messages,
    currentUserId,
    activeConversationId: _activeConversationId,
    onLoadMore,
    onReplyMessage,
    onEditMessage,
    onDeleteMessage,
    onResendMessage,
    onImageClick,
    scrollToMessage: scrollToMessageProp,
    isBusinessView = false,
    formatTime,
    getMessageStatus,
    renderMessageStatus,
    getFormattedSender,
    isOwnMessage,
    handleCopyMessage,
    editingMessageId: _editingMessageId,
  },
  ref
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const isJumpingRef = useRef(false);

  // ฟังก์ชันช่วยสำหรับจัดการค่า messageStatus ให้เป็น string | undefined เท่านั้น
  const formatMessageStatus = useCallback((status: string | null): string | undefined => {
    return status === null ? undefined : status;
  }, []);

  // Check if at bottom
  const checkIfAtBottom = useCallback(() => {
    if (!containerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (!containerRef.current) return;
    containerRef.current.scrollTo({
      top: containerRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, []);

  // Jump to message
  const jumpToMessage = useCallback((messageId: string) => {
    const element = document.querySelector(`[data-message-id="${messageId}"]`);
    if (!element || !containerRef.current) {
      console.warn(`Message ${messageId} not found`);
      return;
    }

    console.log(`🎯 Jumping to message: ${messageId}`);
    isJumpingRef.current = true;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Highlight
    element.classList.add('ring-4', 'ring-yellow-400', 'transition-all', 'duration-300');
    setTimeout(() => {
      element.classList.remove('ring-4', 'ring-yellow-400');
      isJumpingRef.current = false;
    }, 2000);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottomRef.current && !isJumpingRef.current) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [messages.length, scrollToBottom]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    isAtBottomRef.current = checkIfAtBottom();

    // Load more when near top
    if (containerRef.current && containerRef.current.scrollTop < 200) {
      onLoadMore?.();
    }
  }, [checkIfAtBottom, onLoadMore]);

  // Expose API via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToMessage: jumpToMessage,
      scrollToBottom
    }),
    [jumpToMessage, scrollToBottom]
  );

  // Render message
  const renderMessage = useCallback(
    (message: MessageDTO) => {
      const isUser = isOwnMessage(message);
      const messageStatus = getMessageStatus(message, isUser);
      const status = renderMessageStatus(messageStatus || null);
      const formattedStatus = formatMessageStatus(status);
      const formattedSender = getFormattedSender(message, message.sender_name);

      return (
        <div
          key={message.id || message.temp_id}
          data-message-id={message.id}
          className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-1`}
        >
          {onReplyMessage || onEditMessage || onDeleteMessage || onResendMessage ? (
            <MessageContextMenu
              message={message}
              currentUserId={currentUserId}
              onReply={messageId => onReplyMessage?.(messageId)}
              onEdit={messageId => onEditMessage?.(messageId)}
              onCopy={handleCopyMessage}
              onResend={onResendMessage}
            >
              <div className={`max-w-[70%] grid grid-cols-1`}>
                {/* Render message based on type */}
                {message.message_type === 'text' &&
                  (message.reply_to_message || message.reply_to_id ? (
                    <ReplyMessage
                      message={message}
                      isUser={isUser}
                      formatTime={formatTime}
                      messageStatus={formattedStatus}
                      isBusinessView={isBusinessView}
                      senderName={formattedSender}
                      onJumpToMessage={scrollToMessageProp}
                    />
                  ) : (
                    <TextMessage
                      message={message}
                      isUser={isUser}
                      formatTime={formatTime}
                      messageStatus={formattedStatus}
                      isBusinessView={isBusinessView}
                      senderName={formattedSender}
                    />
                  ))}

                {message.message_type === 'sticker' && (
                  <StickerMessage
                    message={message}
                    isUser={isUser}
                    formatTime={formatTime}
                    messageStatus={formattedStatus}
                    isBusinessView={isBusinessView}
                    senderName={formattedSender}
                  />
                )}

                {message.message_type === 'image' && (
                  <ImageMessage
                    message={message}
                    isUser={isUser}
                    formatTime={formatTime}
                    messageStatus={formattedStatus}
                    onImageClick={onImageClick || (() => {})}
                    isBusinessView={isBusinessView}
                    senderName={formattedSender}
                  />
                )}

                {message.message_type === 'file' && (
                  <FileMessage
                    message={message}
                    isUser={isUser}
                    formatTime={formatTime}
                    messageStatus={formattedStatus}
                    isBusinessView={isBusinessView}
                    senderName={formattedSender}
                  />
                )}
              </div>
            </MessageContextMenu>
          ) : (
            <div className={`max-w-[70%] grid grid-cols-1`}>
              {/* Same rendering without context menu */}
              {message.message_type === 'text' &&
                (message.reply_to_message || message.reply_to_id ? (
                  <ReplyMessage
                    message={message}
                    isUser={isUser}
                    formatTime={formatTime}
                    messageStatus={formattedStatus}
                    isBusinessView={isBusinessView}
                    senderName={formattedSender}
                    onJumpToMessage={scrollToMessageProp}
                  />
                ) : (
                  <TextMessage
                    message={message}
                    isUser={isUser}
                    formatTime={formatTime}
                    messageStatus={formattedStatus}
                    isBusinessView={isBusinessView}
                    senderName={formattedSender}
                  />
                ))}

              {message.message_type === 'sticker' && (
                <StickerMessage
                  message={message}
                  isUser={isUser}
                  formatTime={formatTime}
                  messageStatus={formattedStatus}
                  isBusinessView={isBusinessView}
                  senderName={formattedSender}
                />
              )}

              {message.message_type === 'image' && (
                <ImageMessage
                  message={message}
                  isUser={isUser}
                  formatTime={formatTime}
                  messageStatus={formattedStatus}
                  onImageClick={onImageClick || (() => {})}
                  isBusinessView={isBusinessView}
                  senderName={formattedSender}
                />
              )}

              {message.message_type === 'file' && (
                <FileMessage
                  message={message}
                  isUser={isUser}
                  formatTime={formatTime}
                  messageStatus={formattedStatus}
                  isBusinessView={isBusinessView}
                  senderName={formattedSender}
                />
              )}
            </div>
          )}
        </div>
      );
    },
    [
      isOwnMessage,
      getMessageStatus,
      renderMessageStatus,
      formatMessageStatus,
      getFormattedSender,
      currentUserId,
      onReplyMessage,
      onEditMessage,
      onDeleteMessage,
      onResendMessage,
      handleCopyMessage,
      formatTime,
      isBusinessView,
      scrollToMessageProp,
      onImageClick
    ]
  );

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">ยังไม่มีข้อความ</p>
          <p className="text-sm text-muted-foreground">ส่งข้อความแรกเพื่อเริ่มการสนทนา</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-background overflow-y-auto min-h-0"
      onScroll={handleScroll}
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {messages.map(message => renderMessage(message))}
    </div>
  );
});

SimpleMessageList.displayName = 'SimpleMessageList';

export default memo(SimpleMessageList);
