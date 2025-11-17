// src/pages/poc/MinimalChatVirtuosoEnhanced.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { MessageDTO } from '@/types/message.types';
import { useConversation } from '@/hooks/useConversation';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { Button } from '@/components/ui/button';
import { ImageIcon, FileIcon, SmileIcon, MessageSquare, Zap, AlertCircle } from 'lucide-react';

// Import message components
import TextMessage from '@/components/shared/message/TextMessage';
import ImageMessage from '@/components/shared/message/ImageMessage';
import FileMessage from '@/components/shared/message/FileMessage';
import StickerMessage from '@/components/shared/message/StickerMessage';

/**
 * Enhanced React Virtuoso POC with Buffer Pattern
 *
 * Key Features:
 * - Buffer layer pattern to prevent DOM overlapping
 * - Image pre-loading before commit to virtual list
 * - followOutput for smooth auto-scroll
 * - increaseViewportBy for buffer zone
 * - Jump to message with highlight
 */
const MinimalChatVirtuosoEnhancedContent = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [atBottom, setAtBottom] = useState(true);

  // Buffer Pattern - Two layers
  const [committedMessages, setCommittedMessages] = useState<MessageDTO[]>([]);
  const [pendingMessages, setPendingMessages] = useState<MessageDTO[]>([]);
  const [useLocalMessages, setUseLocalMessages] = useState(false);

  // Track prepending
  const [firstItemIndex, setFirstItemIndex] = useState(100000);
  const prevCommittedCountRef = useRef(0);

  const {
    conversationMessages,
    getMessages,
    loadMoreMessages,
    hasMoreMessagesAvailable,
  } = useConversation();

  // Get messages (local or backend)
  const backendMessages = conversationId ? conversationMessages[conversationId] || [] : [];
  const messages = useLocalMessages ? committedMessages : backendMessages;
  const hasMore = conversationId ? hasMoreMessagesAvailable(conversationId) : false;

  console.log('📊 Virtuoso Enhanced - Committed:', committedMessages.length, 'Pending:', pendingMessages.length);

  // ==================== BUFFER PATTERN IMPLEMENTATION ====================

  /**
   * Pre-load images before committing to virtual list
   * This prevents height calculation issues and DOM overlapping
   */
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve anyway to not block
    });
  }, []);

  /**
   * Commit pending messages to virtual list
   * - Pre-loads images first
   * - Debounces to batch multiple messages
   * - Smooth append to prevent re-calculation
   */
  useEffect(() => {
    if (pendingMessages.length === 0) return;

    console.log('🔄 Processing', pendingMessages.length, 'pending messages...');

    const processPending = async () => {
      // Pre-load all images in pending queue
      const imageMessages = pendingMessages.filter(m => m.message_type === 'image' && m.media_url);

      if (imageMessages.length > 0) {
        console.log('🖼️ Pre-loading', imageMessages.length, 'images...');
        await Promise.all(
          imageMessages.map(msg => preloadImage(msg.media_url || ''))
        );
        console.log('✅ Images pre-loaded');
      }

      // Commit to virtual list
      setCommittedMessages(prev => {
        const newMessages = [...prev, ...pendingMessages];
        console.log('✅ Committed', pendingMessages.length, 'messages. Total:', newMessages.length);
        return newMessages;
      });

      // Clear pending queue
      setPendingMessages([]);
    };

    // Debounce 100ms to batch rapid messages
    const timer = setTimeout(processPending, 100);
    return () => clearTimeout(timer);
  }, [pendingMessages, preloadImage]);

  /**
   * Add new message to pending queue
   * - Images are pre-loaded
   * - Other types are instant
   */
  const addMessageToPending = useCallback((message: MessageDTO) => {
    setPendingMessages(prev => [...prev, message]);
  }, []);

  // Update firstItemIndex when messages are prepended (backend mode)
  useEffect(() => {
    if (useLocalMessages) return; // Skip for local mode

    const currentCount = backendMessages.length;
    const prevCount = prevCommittedCountRef.current;

    if (currentCount > prevCount && prevCount > 0) {
      const diff = currentCount - prevCount;
      console.log('📥 Backend messages prepended:', diff);
      setFirstItemIndex(prev => prev - diff);
    }

    prevCommittedCountRef.current = currentCount;
  }, [backendMessages.length, useLocalMessages]);

  // Initial load (backend mode)
  useEffect(() => {
    if (conversationId && !useLocalMessages) {
      console.log('🔄 Loading messages for conversation:', conversationId);
      setFirstItemIndex(100000);
      prevCommittedCountRef.current = 0;
      getMessages(conversationId);
    }
  }, [conversationId, getMessages, useLocalMessages]);

  // Load more handler (backend mode)
  const handleLoadMore = useCallback(async () => {
    if (!conversationId || isLoadingMore || !hasMore || useLocalMessages) {
      return;
    }

    const currentMessages = conversationMessages[conversationId] || [];
    if (currentMessages.length === 0) return;

    const oldestMessage = currentMessages[0];
    console.log('[Virtuoso] 📤 Loading more messages - oldest:', oldestMessage.id);

    setIsLoadingMore(true);
    try {
      const result = await loadMoreMessages(conversationId, {
        before: oldestMessage.id,
        limit: 20
      });
      console.log('[Virtuoso] ✅ Loaded', result?.length || 0, 'more messages');
    } catch (error) {
      console.error('[Virtuoso] ❌ Load more failed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore, hasMore, conversationMessages, loadMoreMessages, useLocalMessages]);

  // ==================== TEST MESSAGE GENERATORS ====================

  const generateTestMessages = useCallback((count: number, types?: string[]): MessageDTO[] => {
    const messageTypes = types || ['text', 'image', 'file', 'sticker'];
    const now = Date.now();

    return Array.from({ length: count }, (_, i) => {
      const type = messageTypes[i % messageTypes.length];
      const isUser = i % 2 === 0;
      const baseId = `test-${now}-${i}`;

      const baseMessage: MessageDTO = {
        id: baseId,
        conversation_id: conversationId || 'test-conv',
        sender_id: isUser ? 'current-user-id' : 'other-user-id',
        sender_type: 'user',
        sender_name: isUser ? 'You' : 'Test User',
        message_type: type,
        content: '',
        created_at: new Date(now - (count - i) * 1000).toISOString(),
        updated_at: new Date(now - (count - i) * 1000).toISOString(),
        is_deleted: false,
        is_edited: false,
        edit_count: 0,
        is_read: true,
        read_count: 1,
        status: 'sent',
      };

      switch (type) {
        case 'text':
          const textVariants = [
            'Short message',
            'Medium length message that contains a bit more content to test wrapping and dynamic height adjustment',
            'Very long message that spans multiple lines and will test the dynamic height calculation. This message includes enough text to see how well Virtuoso handles variable content heights without causing DOM overlapping issues.',
          ];
          return {
            ...baseMessage,
            content: textVariants[i % textVariants.length],
          };

        case 'image':
          const imageUrls = [
            'https://picsum.photos/300/200?random=' + i,
            'https://picsum.photos/400/300?random=' + i,
            'https://picsum.photos/240/180?random=' + i,
          ];
          return {
            ...baseMessage,
            content: i % 3 === 0 ? 'Image with caption ' + i : '',
            media_url: imageUrls[i % imageUrls.length],
            media_thumbnail_url: imageUrls[i % imageUrls.length],
          };

        case 'file':
          const fileTypes = [
            { name: 'document.pdf', size: 1024 * 500, type: 'application/pdf' },
            { name: 'presentation.pptx', size: 1024 * 1024 * 2, type: 'application/vnd.ms-powerpoint' },
            { name: 'spreadsheet.xlsx', size: 1024 * 800, type: 'application/vnd.ms-excel' },
          ];
          const fileInfo = fileTypes[i % fileTypes.length];
          return {
            ...baseMessage,
            content: 'File attachment',
            media_url: `https://example.com/files/${fileInfo.name}`,
            metadata: {
              file_name: fileInfo.name,
              file_size: fileInfo.size,
              file_type: fileInfo.type,
            },
          };

        case 'sticker':
          const stickerUrls = [
            'https://media.giphy.com/media/ICOgUNjpvO0PC/200.gif',
            'https://media.giphy.com/media/3o7btPCcdNniyf0ArS/200.gif',
            'https://media.giphy.com/media/l4FGuhL4U2WyjdkaY/200.gif',
          ];
          return {
            ...baseMessage,
            content: '',
            media_url: stickerUrls[i % stickerUrls.length],
            sticker_id: `sticker-${i}`,
            sticker_set_id: 'test-set',
          };

        default:
          return baseMessage;
      }
    });
  }, [conversationId]);

  // Test actions
  const addSingleMessage = useCallback((type: string) => {
    const newMessage = generateTestMessages(1, [type])[0];
    addMessageToPending(newMessage);
  }, [generateTestMessages, addMessageToPending]);

  const addMixedMessages = useCallback((count: number) => {
    const newMessages = generateTestMessages(count);
    // Add all to pending queue (will be processed in batch)
    newMessages.forEach(msg => addMessageToPending(msg));
  }, [generateTestMessages, addMessageToPending]);

  const stressTest = useCallback(() => {
    console.log('🔴 Stress Test: Adding 100 messages...');
    const messages = generateTestMessages(100);
    messages.forEach(msg => addMessageToPending(msg));
  }, [generateTestMessages, addMessageToPending]);

  const clearMessages = useCallback(() => {
    setCommittedMessages([]);
    setPendingMessages([]);
  }, []);

  // Format time
  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Image click handler
  const handleImageClick = useCallback((url: string) => {
    setLightboxImage(url);
    setShowLightbox(true);
  }, []);

  // Jump to message
  // Commented out as it's not currently being used
  // const jumpToMessage = useCallback((messageId: string) => {
  //   const index = messages.findIndex(m => m.id === messageId);
  //   if (index === -1) return;

  //   const actualIndex = useLocalMessages ? index : firstItemIndex + index;

  //   virtuosoRef.current?.scrollToIndex({
  //     index: actualIndex,
  //     align: 'center',
  //     behavior: 'smooth',
  //   });

  //   // Highlight after scroll
  //   setTimeout(() => {
  //     const element = document.querySelector(`[data-message-id="${messageId}"]`);
  //     if (element) {
  //       element.classList.add('ring-4', 'ring-yellow-400', 'transition-all');
  //       setTimeout(() => {
  //         element.classList.remove('ring-4', 'ring-yellow-400');
  //       }, 2000);
  //     }
  //   }, 500);
  // }, [messages, useLocalMessages, firstItemIndex]);

  // Render single message
  const renderMessage = useCallback((_index: number, message: MessageDTO) => {
    const isUser = message.sender_id === 'current-user-id';

    return (
      <div
        key={message.id}
        data-message-id={message.id}
        data-message-type={message.message_type}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
      >
        <div className={`max-w-[70%]`}>
          {message.message_type === 'text' && (
            <div className={`rounded-lg px-4 py-2 ${
              isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
            }`}>
              <TextMessage
                message={message}
                isUser={isUser}
                formatTime={formatTime}
              />
            </div>
          )}

          {message.message_type === 'image' && (
            <div>
              <ImageMessage
                message={message}
                isUser={isUser}
                formatTime={formatTime}
                onImageClick={handleImageClick}
              />
            </div>
          )}

          {message.message_type === 'file' && (
            <div>
              <FileMessage
                message={message}
                isUser={isUser}
                formatTime={formatTime}
              />
            </div>
          )}

          {message.message_type === 'sticker' && (
            <div>
              <StickerMessage
                message={message}
                isUser={isUser}
                formatTime={formatTime}
              />
            </div>
          )}
        </div>
      </div>
    );
  }, [formatTime, handleImageClick]);

  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Virtuoso Enhanced Testing POC</h1>
          <p className="text-muted-foreground">
            Go to: /poc/chat-virtuoso-enhanced/[conversationId]
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Test Controls */}
      <div className="border-b bg-card">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-semibold">Virtuoso Enhanced Testing POC</h1>
              <p className="text-xs text-muted-foreground">
                {messages.length} messages | Pending: {pendingMessages.length} | {hasMore ? 'Has more' : 'No more'} | Mode: {useLocalMessages ? 'Local Test' : 'Backend'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                ✅ Buffer Pattern Active | Pre-loading: {pendingMessages.filter(m => m.message_type === 'image').length} images
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUseLocalMessages(!useLocalMessages);
                  if (!useLocalMessages) {
                    setCommittedMessages([]);
                    setPendingMessages([]);
                  }
                }}
              >
                {useLocalMessages ? 'Use Backend' : 'Use Local Test'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const targetIndex = useLocalMessages
                    ? messages.length - 1
                    : firstItemIndex + messages.length - 1;
                  virtuosoRef.current?.scrollToIndex({
                    index: targetIndex,
                    align: 'end',
                    behavior: 'smooth'
                  });
                }}
              >
                Scroll to Bottom
              </Button>
            </div>
          </div>

          {/* Test Controls */}
          {useLocalMessages && (
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap size={16} />
                Quick Test Actions - Buffer Pattern Enabled
              </div>

              {/* Single Message Tests */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addSingleMessage('text')}
                  className="text-xs"
                >
                  <MessageSquare size={14} className="mr-1" />
                  Add Text
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addSingleMessage('image')}
                  className="text-xs"
                >
                  <ImageIcon size={14} className="mr-1" />
                  Add Image (Pre-load)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addSingleMessage('file')}
                  className="text-xs"
                >
                  <FileIcon size={14} className="mr-1" />
                  Add File
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addSingleMessage('sticker')}
                  className="text-xs"
                >
                  <SmileIcon size={14} className="mr-1" />
                  Add Sticker
                </Button>
              </div>

              {/* Batch Tests */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addMixedMessages(10)}
                  className="text-xs"
                >
                  Add 10 Mixed
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => addMixedMessages(50)}
                  className="text-xs"
                >
                  Add 50 Mixed
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={stressTest}
                  className="text-xs"
                >
                  <AlertCircle size={14} className="mr-1" />
                  Stress Test (100)
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearMessages}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>

              <div className="text-xs text-muted-foreground mt-2 space-y-1">
                <div>✅ Images are pre-loaded before adding to virtual list</div>
                <div>✅ Buffer pattern prevents DOM overlapping</div>
                <div>✅ followOutput provides smooth auto-scroll</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {(isLoadingMore || pendingMessages.length > 0) && (
        <div className="absolute top-20 left-0 right-0 z-20 flex justify-center py-2 bg-background/80">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            {pendingMessages.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Processing {pendingMessages.length} messages...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Virtual Message List with Virtuoso */}
      <div className="flex-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-muted-foreground">
              {useLocalMessages ? (
                <>
                  <p className="mb-2">No test messages yet</p>
                  <p className="text-xs">Click buttons above to add test messages</p>
                </>
              ) : (
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
              )}
            </div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            data={messages}
            firstItemIndex={useLocalMessages ? 0 : firstItemIndex}
            initialTopMostItemIndex={useLocalMessages ? messages.length - 1 : firstItemIndex + messages.length - 1}
            followOutput={(isAtBottom) => {
              setAtBottom(isAtBottom);
              return isAtBottom ? 'smooth' : false;
            }}
            atTopStateChange={(atTop) => {
              if (atTop && !isLoadingMore && hasMore && !useLocalMessages) {
                console.log('[Virtuoso] 🔝 At top - triggering load more');
                handleLoadMore();
              }
            }}
            atTopThreshold={400}
            increaseViewportBy={{ top: 400, bottom: 400 }} // 🔥 Buffer zone
            itemContent={renderMessage}
            style={{ height: '100%' }}
          />
        )}
      </div>

      {/* Debug Info */}
      <div className="border-t px-4 py-2 bg-card text-xs text-muted-foreground">
        <div className="flex justify-between flex-wrap gap-2">
          <span>ConversationId: {conversationId?.slice(0, 8)}...</span>
          <span>Messages: {messages.length}</span>
          <span>Pending: {pendingMessages.length}</span>
          <span>At Bottom: {atBottom ? 'Yes' : 'No'}</span>
          <span>Mode: {useLocalMessages ? 'Local' : 'Backend'}</span>
          <span>Library: React Virtuoso v4.14.1</span>
        </div>
      </div>

      {/* Simple Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowLightbox(false)}
        >
          <img
            src={lightboxImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
};

// Wrapper with WebSocketProvider
const MinimalChatVirtuosoEnhanced = () => {
  return (
    <WebSocketProvider>
      <MinimalChatVirtuosoEnhancedContent />
    </WebSocketProvider>
  );
};

export default MinimalChatVirtuosoEnhanced;
