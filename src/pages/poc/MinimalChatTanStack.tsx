// src/pages/poc/MinimalChatTanStack.tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { MessageDTO } from '@/types/message.types';
import { useConversation } from '@/hooks/useConversation';
import { WebSocketProvider } from '@/contexts/WebSocketContext';

/**
 * Minimal Chat POC with TanStack Virtual
 * - เปรียบเทียบ performance กับ Virtuoso
 * - API ง่ายกว่า ควบคุมได้มากกว่า
 */
const MinimalChatTanStackContent = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const parentRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingRef = useRef(false);
  const hasScrolledToBottomRef = useRef(false); // Track if initial scroll to bottom is done
  const canTriggerLoadMoreRef = useRef(true); // Cooldown flag (must be ref, not state!)
  const lastScrollTopRef = useRef(0); // Track scroll direction
  const scrollOffsetRef = useRef<number | null>(null); // Track scroll offset for restoration

  const {
    conversationMessages,
    getMessages,
    loadMoreMessages,
    hasMoreMessagesAvailable,
  } = useConversation();

  // Get messages for active conversation
  const messages = conversationId ? conversationMessages[conversationId] || [] : [];
  const hasMore = conversationId ? hasMoreMessagesAvailable(conversationId) : false;

  console.log('📊 TanStack - Messages count:', messages.length);

  // TanStack Virtual setup
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimate เท่านั้น จะวัดจริงด้วย measureElement
    overscan: 5, // จำนวน items ที่ render นอกหน้าจอ
  });

  // Initial load
  useEffect(() => {
    if (conversationId) {
      console.log('🔄 Loading messages for conversation:', conversationId);
      hasScrolledToBottomRef.current = false; // Reset scroll flag
      getMessages(conversationId);
    }
  }, [conversationId, getMessages]);

  // Scroll to bottom on initial load using virtualizer
  useEffect(() => {
    if (messages.length > 0 && conversationId && !hasScrolledToBottomRef.current) {
      // ใช้ scrollToIndex เพื่อ scroll ไปยัง message สุดท้าย
      const lastIndex = messages.length - 1;

      // รอให้ virtualizer render เสร็จก่อน
      const timer = setTimeout(() => {
        virtualizer.scrollToIndex(lastIndex, {
          align: 'end',
          behavior: 'auto'
        });
        hasScrolledToBottomRef.current = true; // Mark as scrolled
        console.log('📍 Initial scroll to last message (index:', lastIndex, ')');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [conversationId, messages.length, virtualizer]); // Trigger when messages load

  // ✅ Scroll restoration using distance from bottom (GitHub discussion approach)
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement || scrollOffsetRef.current === null) return;

    console.log('[debug_scroll] 📍 Restoring scroll using offset:', {
      savedOffset: scrollOffsetRef.current,
      totalMessages: messages.length
    });

    // รอให้ virtualizer measure elements ใหม่
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Restore scroll offset
        scrollElement.scrollTop = scrollOffsetRef.current!;

        // Verify
        setTimeout(() => {
          const itemsAfter = virtualizer.getVirtualItems();
          console.log('[debug_scroll] ✅ Scroll restored:', {
            scrollTop: scrollElement.scrollTop,
            firstVisibleIndex: itemsAfter[0]?.index,
            firstVisibleContent: messages[itemsAfter[0]?.index]?.content?.slice(0, 20)
          });

          // Clear ref
          scrollOffsetRef.current = null;
        }, 50);
      });
    });
  }, [messages.length, virtualizer, messages]); // Trigger เมื่อ messages.length เปลี่ยน

  // Load more handler with message anchor
  const handleLoadMore = useCallback(async () => {
    if (!conversationId || isLoadingRef.current || !hasMore) {
      return;
    }

    const currentMessages = conversationMessages[conversationId] || [];
    if (currentMessages.length === 0) return;

    const oldestMessage = currentMessages[0];
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    console.log('📤 Loading more messages - oldest:', oldestMessage.id);

    // ✅ เก็บ distance from bottom ก่อนโหลด (GitHub discussion approach)
    const totalSizeBefore = virtualizer.getTotalSize();
    const scrollTopBefore = scrollElement.scrollTop;
    const scrollHeightBefore = scrollElement.scrollHeight;
    const distanceFromBottom = scrollHeightBefore - scrollTopBefore;

    // Debug info
    const items = virtualizer.getVirtualItems();
    const anchorMessage = currentMessages[items[0]?.index];

    console.log('[debug_scroll] 📍 Before load more:', {
      totalSizeBefore,
      scrollTopBefore,
      scrollHeightBefore,
      distanceFromBottom,
      firstVisibleMessage: anchorMessage?.content?.slice(0, 20)
    });

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    try {
      const result = await loadMoreMessages(conversationId, {
        before: oldestMessage.id,
        limit: 50 // เพิ่มจาก 20 → 50 เพื่อลดความถี่ของ load more
      });

      const newMessagesLoaded = result?.length || 0;
      console.log('✅ Loaded', newMessagesLoaded, 'more messages');

      // ✅ คำนวณ scrollTop ใหม่โดยคงระยะห่างจาก bottom (GitHub discussion)
      // หลังโหลด: scrollHeight จะเพิ่มขึ้น
      // ต้องการ: scrollTop ใหม่ที่ทำให้ distanceFromBottom เท่าเดิม
      // Formula: newScrollTop = newScrollHeight - distanceFromBottom
      requestAnimationFrame(() => {
        const scrollHeightAfter = scrollElement.scrollHeight;
        const newScrollTop = scrollHeightAfter - distanceFromBottom;

        console.log('[debug_scroll] 📍 Calculating new scroll position:', {
          scrollHeightBefore,
          scrollHeightAfter,
          heightDiff: scrollHeightAfter - scrollHeightBefore,
          distanceFromBottom,
          scrollTopBefore,
          newScrollTop,
          formula: `${scrollHeightAfter} - ${distanceFromBottom} = ${newScrollTop}`
        });

        // เก็บไว้ใน ref ให้ useEffect จัดการ scroll
        scrollOffsetRef.current = newScrollTop;
      });
    } catch (error) {
      console.error('❌ Load more failed:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [conversationId, hasMore, conversationMessages, loadMoreMessages, virtualizer]);

  // Detect scroll to top with scroll direction detection
  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const scrollTop = scrollElement.scrollTop;
      const lastScrollTop = lastScrollTopRef.current;

      // ✅ Detect scroll direction: ถ้า scrollTop < lastScrollTop = กำลังเลื่อนขึ้น
      const isScrollingUp = scrollTop < lastScrollTop;

      // เงื่อนไขการ trigger:
      // 1. เลื่อนขึ้น (scrolling up)
      // 2. ใกล้บนสุด (< 200px - เพิ่มจาก 100)
      // 3. ยังมี messages เพิ่ม
      // 4. ไม่ได้ loading อยู่
      // 5. cooldown หมดแล้ว
      if (
        isScrollingUp &&
        scrollTop < 200 &&
        hasMore &&
        !isLoadingRef.current &&
        canTriggerLoadMoreRef.current
      ) {
        console.log('🔝 Scrolling up near top (scrollTop:', scrollTop, ') - triggering load more');

        // ✅ Trigger ทันที
        handleLoadMore();

        // ตั้ง cooldown 800ms (เพิ่มจาก 500ms)
        canTriggerLoadMoreRef.current = false;
        console.log('⏸️ Cooldown started (800ms) - preventing duplicate triggers');

        setTimeout(() => {
          canTriggerLoadMoreRef.current = true;
          console.log('✅ Cooldown complete - ready for next load');
        }, 800);
      }

      // บันทึก scrollTop สำหรับครั้งถัดไป
      lastScrollTopRef.current = scrollTop;
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [hasMore, handleLoadMore]);

  // Render single message
  const renderMessage = useCallback((message: MessageDTO) => {
    const isUser = message.sender_id === 'current-user-id'; // Simplified

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-4 py-2`}
      >
        <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        }`}>
          {/* ข้อความ */}
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
          <h1 className="text-2xl font-bold mb-2">TanStack Virtual POC</h1>
          <p className="text-muted-foreground">
            Go to: /poc/chat-tanstack/[conversationId]
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

  const items = virtualizer.getVirtualItems();

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b px-4 py-3 bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">TanStack Virtual POC</h1>
            <p className="text-xs text-muted-foreground">
              {messages.length} messages | {hasMore ? 'Has more' : 'No more'}
            </p>
          </div>
          <button
            onClick={() => {
              if (parentRef.current) {
                parentRef.current.scrollTop = parentRef.current.scrollHeight;
              }
            }}
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
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {items.map((virtualItem) => {
            const message = messages[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {renderMessage(message)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Debug Info */}
      <div className="border-t px-4 py-2 bg-card text-xs text-muted-foreground">
        <div className="flex justify-between flex-wrap gap-2">
          <span>ConversationId: {conversationId?.slice(0, 8)}...</span>
          <span>Messages: {messages.length}</span>
          <span>Rendered: {items.length}</span>
          <span>Loading: {isLoadingMore ? 'Yes' : 'No'}</span>
          <span>HasMore: {hasMore ? 'Yes' : 'No'}</span>
        </div>
      </div>
    </div>
  );
};

// Wrapper with WebSocketProvider
const MinimalChatTanStack = () => {
  return (
    <WebSocketProvider>
      <MinimalChatTanStackContent />
    </WebSocketProvider>
  );
};

export default MinimalChatTanStack;
