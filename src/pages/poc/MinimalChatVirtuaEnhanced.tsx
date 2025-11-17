// src/pages/poc/MinimalChatVirtuaEnhanced.tsx
import { useEffect, useState, useRef, useCallback, useLayoutEffect } from 'react';
import { useParams } from 'react-router-dom';
import { VList } from 'virtua';
import type { VListHandle } from 'virtua';
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
 * Enhanced Virtua POC for Testing Multiple Message Types
 * - Tests dynamic height with text, image, file, sticker messages
 * - Tests DOM overlapping issues
 * - Provides quick test buttons
 */
const MinimalChatVirtuaEnhancedContent = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const virtuaRef = useRef<VListHandle>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingRef = useRef(false);
  const hasScrolledToBottomRef = useRef(false);
  const isPrependRef = useRef(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');

  // Local test messages (for testing without backend)
  const [testMessages, setTestMessages] = useState<MessageDTO[]>([]);
  const [useLocalMessages, setUseLocalMessages] = useState(false);

  const {
    conversationMessages,
    getMessages,
    loadMoreMessages,
    hasMoreMessagesAvailable,
  } = useConversation();

  // Get messages (local or from backend)
  const messages = useLocalMessages
    ? testMessages
    : (conversationId ? conversationMessages[conversationId] || [] : []);
  const hasMore = conversationId ? hasMoreMessagesAvailable(conversationId) : false;

  console.log('📊 Virtua Enhanced - Messages count:', messages.length);

  // Track previous message count
  const prevMessageCountRef = useRef(0);

  // Detect prepend
  if (messages.length > prevMessageCountRef.current && prevMessageCountRef.current > 0) {
    const diff = messages.length - prevMessageCountRef.current;
    console.log('[Virtua] 📥 Detected prepend:', diff, 'messages');
    isPrependRef.current = true;
  }

  // Reset isPrepend flag
  useLayoutEffect(() => {
    prevMessageCountRef.current = messages.length;
    isPrependRef.current = false;
  });

  // Initial load
  useEffect(() => {
    if (conversationId && !useLocalMessages) {
      console.log('🔄 Loading messages for conversation:', conversationId);
      hasScrolledToBottomRef.current = false;
      getMessages(conversationId);
    }
  }, [conversationId, getMessages, useLocalMessages]);

  // Scroll to bottom on initial load or when messages change
  useEffect(() => {
    if (messages.length > 0 && !hasScrolledToBottomRef.current && virtuaRef.current) {
      const timer = setTimeout(() => {
        virtuaRef.current?.scrollToIndex(messages.length - 1, { align: 'end' });
        hasScrolledToBottomRef.current = true;
        console.log('📍 Initial scroll to bottom');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    if (!conversationId || isLoadingRef.current || !hasMore || useLocalMessages) {
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
  }, [conversationId, hasMore, conversationMessages, loadMoreMessages, useLocalMessages]);

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

      // Generate content based on type
      switch (type) {
        case 'text':
          const textVariants = [
            'Short message',
            'Medium length message that contains a bit more content to test wrapping and dynamic height adjustment in the virtual list',
            'Very long message that spans multiple lines and will definitely test the dynamic height calculation. This message includes enough text to see how well Virtua handles variable content heights without causing DOM overlapping issues. It should render smoothly and maintain proper spacing between messages.',
          ];
          return {
            ...baseMessage,
            content: textVariants[i % textVariants.length],
          };

        case 'image':
          // Use placeholder images with different sizes
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
          // Use random sticker images
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
    setTestMessages(prev => [...prev, newMessage]);

    // Scroll to bottom after adding
    setTimeout(() => {
      virtuaRef.current?.scrollToIndex(testMessages.length, { align: 'end' });
    }, 100);
  }, [generateTestMessages, testMessages.length]);

  const addMixedMessages = useCallback((count: number) => {
    const newMessages = generateTestMessages(count);
    setTestMessages(prev => [...prev, ...newMessages]);

    // Scroll to bottom
    setTimeout(() => {
      virtuaRef.current?.scrollToIndex(testMessages.length + count - 1, { align: 'end' });
    }, 100);
  }, [generateTestMessages, testMessages.length]);

  const stressTest = useCallback(() => {
    // Add 100 mixed messages rapidly to test DOM handling
    const messages = generateTestMessages(100);
    setTestMessages(prev => [...prev, ...messages]);

    setTimeout(() => {
      virtuaRef.current?.scrollToIndex(testMessages.length + 99, { align: 'end' });
    }, 200);
  }, [generateTestMessages, testMessages.length]);

  const clearMessages = useCallback(() => {
    setTestMessages([]);
    hasScrolledToBottomRef.current = false;
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

  // Render single message with proper component
  const renderMessage = useCallback((message: MessageDTO) => {
    const isUser = message.sender_id === 'current-user-id';

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
        data-message-id={message.id}
        data-message-type={message.message_type}
      >
        <div className={`max-w-[70%]`}>
          {/* Render based on message type */}
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
          <h1 className="text-2xl font-bold mb-2">Virtua Enhanced Testing POC</h1>
          <p className="text-muted-foreground">
            Go to: /poc/chat-virtua-enhanced/[conversationId]
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
              <h1 className="text-lg font-semibold">Virtua Enhanced Testing POC</h1>
              <p className="text-xs text-muted-foreground">
                {messages.length} messages | {hasMore ? 'Has more' : 'No more'} | Mode: {useLocalMessages ? 'Local Test' : 'Backend'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setUseLocalMessages(!useLocalMessages);
                  if (!useLocalMessages) {
                    setTestMessages([]);
                  }
                }}
              >
                {useLocalMessages ? 'Use Backend' : 'Use Local Test'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => virtuaRef.current?.scrollToIndex(messages.length - 1, { align: 'end' })}
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
                Quick Test Actions
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
                  Add Image
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
                  Stress Test (100 messages)
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

              <div className="text-xs text-muted-foreground mt-2">
                Watch for: DOM overlapping, scroll performance, proper spacing
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoadingMore && (
        <div className="absolute top-20 left-0 right-0 z-20 flex justify-center py-2 bg-background/80">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Virtual Message List with Virtua */}
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
          <VList
            ref={virtuaRef}
            style={{ height: '100%' }}
            reverse
            shift={isPrependRef.current}
            onScroll={(offset) => {
              if (offset < 200 && hasMore && !isLoadingRef.current && !useLocalMessages) {
                console.log('[Virtua] 🔝 Near top - triggering load more');
                handleLoadMore();
              }
            }}
          >
            {messages.map((message) => renderMessage(message))}
          </VList>
        )}
      </div>

      {/* Debug Info */}
      <div className="border-t px-4 py-2 bg-card text-xs text-muted-foreground">
        <div className="flex justify-between flex-wrap gap-2">
          <span>ConversationId: {conversationId?.slice(0, 8)}...</span>
          <span>Messages: {messages.length}</span>
          <span>Loading: {isLoadingMore ? 'Yes' : 'No'}</span>
          <span>Mode: {useLocalMessages ? 'Local' : 'Backend'}</span>
          <span>Library: Virtua v0.46.7</span>
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
const MinimalChatVirtuaEnhanced = () => {
  return (
    <WebSocketProvider>
      <MinimalChatVirtuaEnhancedContent />
    </WebSocketProvider>
  );
};

export default MinimalChatVirtuaEnhanced;
