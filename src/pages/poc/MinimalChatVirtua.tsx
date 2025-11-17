// src/pages/poc/MinimalChatVirtua.tsx
import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { VList } from 'virtua';
import type { VListHandle } from 'virtua';
import type { MessageDTO } from '@/types/message.types';
import { useConversation } from '@/hooks/useConversation';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

/**
 * Minimal Chat POC with Virtua
 * - ✅ Built-in reverse scroll support
 * - ✅ Automatic scroll position preservation with "shift" prop
 * - ✅ Zero-config, lightweight (~3kB)
 */
const MinimalChatVirtuaContent = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const virtuaRef = useRef<VListHandle>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingRef = useRef(false);
  const hasScrolledToBottomRef = useRef(false);
  const isPrependRef = useRef(false); // ✅ Flag สำหรับบอก Virtua ว่ากำลัง prepend

  const {
    conversationMessages,
    getMessages,
    loadMoreMessages,
    hasMoreMessagesAvailable,
  } = useConversation();

  // Get messages for active conversation
  const messages = conversationId ? conversationMessages[conversationId] || [] : [];
  const hasMore = conversationId ? hasMoreMessagesAvailable(conversationId) : false;

  console.log('📊 Virtua - Messages count:', messages.length);

  // Track previous message count to detect prepend
  const prevMessageCountRef = useRef(0);

  // ✅ Detect prepend และตั้ง flag (ก่อน render)
  if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
    const diff = messages.length - prevMessageCountRef.current;
    // ถ้า messages เพิ่มขึ้น = มีการ prepend
    console.log('[Virtua] 📥 Detected prepend:', diff, 'messages');
    isPrependRef.current = true;
  }

  // ✅ Reset isPrepend flag หลัง render (ตาม Virtua pattern)
  useLayoutEffect(() => {
    prevMessageCountRef.current = messages.length;
    isPrependRef.current = false;
  });

  // Initial load
  useEffect(() => {
    if (conversationId) {
      console.log('🔄 Loading messages for conversation:', conversationId);
      hasScrolledToBottomRef.current = false;
      getMessages(conversationId);
    }
  }, [conversationId, getMessages]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (messages.length > 0 && conversationId && !hasScrolledToBottomRef.current && virtuaRef.current) {
      const timer = setTimeout(() => {
        virtuaRef.current?.scrollToIndex(messages.length - 1, { align: 'end' });
        hasScrolledToBottomRef.current = true;
        console.log('📍 Initial scroll to bottom');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [conversationId, messages.length]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (!conversationId || isLoadingRef.current || !hasMore) {
      return;
    }

    const currentMessages = conversationMessages[conversationId] || [];
    if (currentMessages.length === 0) return;

    const oldestMessage = currentMessages[0];

    console.log('[Virtua] 📤 Loading more messages - oldest:', oldestMessage.id);

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    try {
      const result = await loadMoreMessages(conversationId, {
        before: oldestMessage.id,
        limit: 50
      });

      console.log('[Virtua] ✅ Loaded', result?.length || 0, 'more messages');
    } catch (error) {
      console.error('[Virtua] ❌ Load more failed:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, conversationMessages, loadMoreMessages]);

  // Render single message
  const renderMessage = useCallback((message: MessageDTO) => {
    const isUser = message.sender_id === 'current-user-id';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
      >
        <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          <div className="text-sm">{message.content}</div>
          <div className="text-xs opacity-70 mt-1">
            {new Date(message.created_at).toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>
    );
  }, []);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Virtua POC</h1>
          <p className="text-muted-foreground">
            Go to: /poc/chat-virtua/[conversationId]
          </p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Virtua POC</h1>
            <p className="text-xs text-muted-foreground">
              {messages.length} messages | {hasMore ? 'Has more' : 'No more'}
            </p>
          </div>
          <button
            onClick={() => virtuaRef.current?.scrollToIndex(messages.length - 1, { align: 'end' })}
            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
          >
            Scroll to Bottom
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoadingMore && (
        <div className="absolute top-16 left-0 right-0 z-20 flex justify-center py-2 bg-background/80">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Virtual Message List with Virtua */}
      <div className="flex-1">
        <VList
          ref={virtuaRef}
          style={{ height: '100%' }}
          reverse  // ✅ Chat mode: new messages at bottom
          shift={isPrependRef.current}  // ✅ Magic! Preserve scroll on prepend
          onScroll={(offset) => {
            // Auto-load more when near top
            if (offset < 200 && hasMore && !isLoadingRef.current) {
              console.log('[Virtua] 🔝 Near top (offset:', offset, ') - triggering load more');
              handleLoadMore();
            }
          }}
        >
          {messages.map((message) => renderMessage(message))}
        </VList>
      </div>

      {/* Debug Info */}
      <div className="border-t px-4 py-2 bg-card text-xs text-muted-foreground">
        <div className="flex justify-between flex-wrap gap-2">
          <span>ConversationId: {conversationId?.slice(0, 8)}...</span>
          <span>Messages: {messages.length}</span>
          <span>Loading: {isLoadingMore ? 'Yes' : 'No'}</span>
          <span>HasMore: {hasMore ? 'Yes' : 'No'}</span>
          <span>Library: Virtua (~3kB)</span>
        </div>
      </div>
    </div>
  );
};

// Wrapper with WebSocketProvider
const MinimalChatVirtua = () => {
  return (
    <WebSocketProvider>
      <MinimalChatVirtuaContent />
    </WebSocketProvider>
  );
};

export default MinimalChatVirtua;
