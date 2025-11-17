// src/pages/poc/MinimalChatPOC.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
import type { MessageDTO } from '@/types/message.types';
import { useConversation } from '@/hooks/useConversation';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import useConversationStore from '@/stores/conversationStore';

/**
 * Minimal Chat POC - เพื่อทดสอบว่าปัญหา performance มาจากอะไร
 * - ถ้าหน้านี้ smooth = ปัญหามาจาก component complexity
 * - ถ้าหน้านี้ยัง choppy = ปัญหามาจาก react-virtuoso
 */
const MinimalChatPOCContent = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isAtTop, setIsAtTop] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // ใช้ state แทน ref เพื่อ trigger useEffect

  // Track first item index for prepending messages (preserve scroll position)
  const [firstItemIndex, setFirstItemIndex] = useState(100000);
  const prevMessageCountRef = useRef(0);

  const {
    conversationMessages,
    getMessages,
    loadMoreMessages,
    hasMoreMessagesAvailable,
  } = useConversation();

  // Get messages for active conversation
  const messages = conversationId ? conversationMessages[conversationId] || [] : [];
  const hasMore = conversationId ? hasMoreMessagesAvailable(conversationId) : false;

  console.log('📊 MinimalChatPOC - Messages count:', messages.length);

  // Update firstItemIndex when messages are prepended
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;

    if (currentCount > prevCount && prevCount > 0) {
      // Messages were prepended
      const diff = currentCount - prevCount;
      console.log(`📥 Messages prepended: ${diff} messages`);
      setFirstItemIndex(prev => {
        console.log(`   Adjusting firstItemIndex from ${prev} to ${prev - diff}`);
        return prev - diff;
      });

      // ✅ หลังจาก prepend เสร็จ = พร้อมโหลดเพิ่ม
      setIsInitialLoad(false);
    }

    prevMessageCountRef.current = currentCount;
  }, [messages.length]);

  // Initial load
  useEffect(() => {
    if (conversationId) {
      console.log('🔄 Loading messages for conversation:', conversationId);

      // Reset flags when conversation changes
      setFirstItemIndex(100000);
      prevMessageCountRef.current = 0;
      setIsInitialLoad(true); // เริ่ม initial load

      getMessages(conversationId).then((loadedMessages) => {
        // Set initial message count after first load
        prevMessageCountRef.current = loadedMessages.length;

        // ✅ รอ 500ms หลัง initial load เสร็จ เพื่อให้ user เห็น messages ก่อน
        // ป้องกัน atTopStateChange trigger ทันที
        if (loadedMessages.length > 0) {
          setTimeout(() => {
            setIsInitialLoad(false); // ✅ ตั้งเป็น false จะ trigger useEffect ใหม่
            console.log('✅ Initial load complete - ready for load more');
          }, 500);
        }
      });
    }
  }, [conversationId, getMessages]);

  // Load more handler
  const handleLoadMore = useCallback(async () => {
    console.log('🎯 handleLoadMore called with:', {
      conversationId: !!conversationId,
      isLoadingMore,
      hasMore,
      messageCount: messages.length
    });

    if (!conversationId || isLoadingMore || !hasMore) {
      console.log('⏸️ Load more skipped:', {
        conversationId: !!conversationId,
        isLoadingMore,
        hasMore,
        reason: !conversationId ? 'No conversationId' :
                isLoadingMore ? 'Already loading' :
                !hasMore ? 'No more messages' : 'Unknown'
      });
      return;
    }

    const currentMessages = conversationMessages[conversationId] || [];
    if (currentMessages.length === 0) {
      console.log('❌ No messages to load more from');
      return;
    }

    const oldestMessage = currentMessages[0];
    const messageCountBefore = currentMessages.length;

    console.log('📤 Loading more messages:');
    console.log('   - Before message ID:', oldestMessage.id);
    console.log('   - Created at:', oldestMessage.created_at);
    console.log('   - Current count:', messageCountBefore);

    setIsLoadingMore(true);
    try {
      const result = await loadMoreMessages(conversationId, {
        before: oldestMessage.id,
        limit: 20
      });

      // ✅ ดึงค่าใหม่จาก store โดยตรง (bypass React state) เพื่อให้ได้ค่าล่าสุดทันที
      const latestMessages = useConversationStore.getState().conversationMessages[conversationId] || [];
      const messageCountAfter = latestMessages.length;
      const newMessagesLoaded = messageCountAfter - messageCountBefore;

      console.log('✅ Load more completed:');
      console.log('   - API returned:', result?.length || 0, 'messages');
      console.log('   - Raw result:', result);
      console.log('   - Count before:', messageCountBefore);
      console.log('   - Count after:', messageCountAfter);
      console.log('   - Net new:', newMessagesLoaded);

      // 🔍 Debug: ตรวจสอบ hasMore flag หลัง load เสร็จ
      const currentHasMore = useConversationStore.getState().hasMoreMessages[conversationId];
      console.log('   - hasMore after load:', currentHasMore);
      console.log('   - Can load more?', currentHasMore && !isLoadingMore);

      // Check for duplicates
      if (result && result.length > 0) {
        const resultIds = result.map((m: any) => m.id);
        const existingIds = currentMessages.map(m => m.id);
        const duplicates = resultIds.filter((id: string) => existingIds.includes(id));

        if (duplicates.length > 0) {
          console.error('🔴 DUPLICATES FOUND:', duplicates.length, 'out of', result.length);
          console.error('   Duplicate IDs:', duplicates);
        } else {
          console.log('✅ No duplicates - all messages are unique');
        }
      }

      if (newMessagesLoaded === 0) {
        console.warn('⚠️ No new messages added! Possible duplicate messages from API');
      }
    } catch (error) {
      console.error('❌ Load more failed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [conversationId, isLoadingMore, hasMore, conversationMessages, loadMoreMessages]);

  // Trigger load more when reaching top
  useEffect(() => {
    console.log('[Virtuoso POC] useEffect trigger check:', {
      isAtTop,
      isLoadingMore,
      hasMore,
      conversationId: !!conversationId,
      isInitialLoad
    });

    // ✅ เช็ค isInitialLoad ด้วยเพื่อป้องกันการโหลดอัตโนมัติหลัง initial load
    if (isAtTop && !isLoadingMore && hasMore && conversationId && !isInitialLoad) {
      console.log('🔝 At top detected - triggering load more');
      setIsAtTop(false); // ป้องกัน trigger ซ้ำ
      handleLoadMore();
    } else if (isAtTop && isInitialLoad) {
      console.log('⏸️ Skipping auto-load (initial load in progress) - will retry when isInitialLoad becomes false');
      // ❌ ไม่ reset isAtTop ให้มันรอจน isInitialLoad เป็น false แล้ว trigger อีกที
    } else if (isAtTop) {
      console.log('⏸️ At top but conditions not met:', {
        isLoadingMore,
        hasMore,
        conversationId: !!conversationId,
        isInitialLoad
      });
      setIsAtTop(false); // Reset flag only if really can't proceed
    }
  }, [isAtTop, isLoadingMore, hasMore, conversationId, isInitialLoad, handleLoadMore]);

  // Render single message - MINIMAL
  const renderMessage = useCallback((_index: number, message: MessageDTO) => {
    const isUser = message.sender_id === 'current-user-id'; // Simplified

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
      >
        <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          {/* ข้อความ - Minimal rendering */}
          <div className="text-sm">{message.content}</div>

          {/* เวลา */}
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
          <h1 className="text-2xl font-bold mb-2">Minimal Chat POC</h1>
          <p className="text-muted-foreground">
            Go to: /poc/chat/[conversationId]
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
      {/* Header - Minimal */}
      <div className="border-b px-4 py-3 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Minimal Chat POC</h1>
            <p className="text-xs text-muted-foreground">
              {messages.length} messages | {hasMore ? 'Has more' : 'No more'}
            </p>
          </div>
          <button
            onClick={() => virtuosoRef.current?.scrollToIndex({
              index: firstItemIndex + messages.length - 1,
              align: 'end',
              behavior: 'smooth'
            })}
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

      {/* Virtual Message List */}
      <div className="flex-1">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          firstItemIndex={firstItemIndex}
          initialTopMostItemIndex={firstItemIndex + messages.length - 1}
          followOutput="smooth"
          atTopStateChange={(atTop) => {
            console.log('🔝 atTopStateChange:', atTop, {
              messages: messages.length,
              hasMore,
              isLoadingMore,
              firstItemIndex,
              isInitialLoad
            });
            setIsAtTop(atTop);
          }}
          atTopThreshold={800}
          overscan={200}
          itemContent={renderMessage}
          style={{ height: '100%' }}
        />
      </div>

      {/* Debug Info */}
      <div className="border-t px-4 py-2 bg-card text-xs text-muted-foreground">
        <div className="flex justify-between flex-wrap gap-2">
          <span>ConversationId: {conversationId?.slice(0, 8)}...</span>
          <span>Messages: {messages.length}</span>
          <span>FirstIndex: {firstItemIndex}</span>
          <span>Loading: {isLoadingMore ? 'Yes' : 'No'}</span>
          <span>HasMore: {hasMore ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  );
};

// Wrapper with WebSocketProvider
const MinimalChatPOC = () => {
  return (
    <WebSocketProvider>
      <MinimalChatPOCContent />
    </WebSocketProvider>
  );
};

export default MinimalChatPOC;
