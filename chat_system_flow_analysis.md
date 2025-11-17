# 📊 Chat System Flow Analysis - Complete Documentation

> **วันที่สร้าง:** 2025-11-13
> **ระบบ:** React + Zustand + React Virtuoso Chat Application
> **สถาปัตยกรรม:** Virtual Scrolling + WebSocket + RESTful API

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Initial Chat Load Flow](#1-initial-chat-load-flow)
3. [Load More Flow (Scroll Up)](#2-load-more-flow-scroll-up)
4. [Jump to Message Flow](#3-jump-to-message-flow)
5. [After Jump - Scroll Behavior](#4-after-jump-scroll-behavior)
6. [State Management](#state-management)
7. [API Endpoints](#api-endpoints)
8. [Key Technical Details](#key-technical-details)

---

## Overview

### เทคโนโลยีที่ใช้

- **State Management:** Zustand (conversationStore, messageStore)
- **Virtual Scrolling:** React Virtuoso v4.14.1
- **Real-time:** WebSocket
- **API:** RESTful with conversationService, messageService

### โครงสร้างหลัก

```
src/
├── stores/
│   ├── conversationStore.ts    # จัดการ conversations และ messages
│   └── messageStore.ts          # จัดการการส่ง/แก้ไข/ลบ messages
├── hooks/
│   ├── useConversation.ts       # Hook หลักสำหรับ conversation operations
│   └── useConversationPageLogic.ts  # Logic ระดับ page
├── services/
│   ├── conversationService.ts   # API calls สำหรับ conversations
│   └── messageService.ts        # API calls สำหรับ messages
└── components/
    ├── MessageArea.tsx          # Wrapper component
    └── VirtualMessageList.tsx   # Virtuoso-based list
```

---

## 1. Initial Chat Load Flow

### 🔄 Flow Diagram

```
USER เปิด Conversation
       │
       ▼
┌──────────────────────────────┐
│  ConversationPageDemo        │
│  useConversationPageLogic    │
└──────────────┬───────────────┘
               │
               ├─────────────────────┐
               │                     │
               ▼                     ▼
    ┌──────────────────┐   ┌─────────────────┐
    │ selectConversation│   │  getMessages()  │
    │  (conversationId) │   │                 │
    └──────────┬────────┘   └────────┬────────┘
               │                     │
               ▼                     ▼
    ┌──────────────────────────────────────┐
    │ conversationStore.setActive          │
    │ conversationStore.fetchMessages      │
    └──────────┬──────────────────────┬────┘
               │                      │
               ▼                      ▼
    ┌──────────────────┐   ┌─────────────────────┐
    │  Update State     │   │ API Call:           │
    │  activeConvId     │   │ GET /conversations/ │
    └───────────────────┘   │     :id/messages    │
                            │ ?limit=20           │
                            └──────────┬──────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Response:            │
                            │ {                    │
                            │   messages: [...],   │
                            │   has_more: true     │
                            │ }                    │
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ Process:             │
                            │ - Sort ASC           │
                            │ - Add localKey       │
                            │ - Store in state     │
                            └──────────┬───────────┘
                                       │
                                       ▼
                            ┌──────────────────────┐
                            │ VirtualMessageList   │
                            │ - firstItemIndex:    │
                            │   100000             │
                            │ - initialTopMost:    │
                            │   100000 + len - 1   │
                            │ - Scroll to bottom   │
                            └──────────────────────┘
```

### 📝 Step-by-Step

#### 1. Component Mount & Route Params

```typescript
// src/pages/chat/ConversationPageDemo.tsx
const { conversationId } = useParams<{ conversationId: string }>();

// src/pages/standard/converstion/hooks/useConversationPageLogic.ts (line 135-146)
useEffect(() => {
  if (conversationId) {
    selectConversation(conversationId);
    setShowMessageView(true);
    setInitialMessagesLoaded(false);

    getMessages(conversationId).then(() => {
      setInitialMessagesLoaded(true);
      markAllMessagesAsRead(conversationId);
    });
  }
}, [conversationId, getMessages, selectConversation, markAllMessagesAsRead]);
```

#### 2. API Call

```typescript
// src/stores/conversationStore.ts (line 117-156)
fetchConversationMessages: async (conversationId: string, params?: ConversationMessagesQueryRequest) => {
  try {
    const response = await conversationService.getConversationMessages(
      conversationId,
      params || { limit: 20 }
    );

    if (response.success && response.data) {
      const { messages, has_more } = response.data;

      // Sort ASC (oldest first)
      const sortedMessages = [...messages].sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Add localKey for React key stability
      const messagesWithKeys = sortedMessages.map(msg => ({
        ...msg,
        localKey: msg.localKey || msg.temp_id || msg.id,
      }));

      set((state) => ({
        conversationMessages: {
          ...state.conversationMessages,
          [conversationId]: messagesWithKeys,
        },
        hasMoreMessages: {
          ...state.hasMoreMessages,
          [conversationId]: has_more,
        },
      }));
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
}
```

#### 3. State After Initial Load

```javascript
conversationStore.state = {
  activeConversationId: "69cd966b-c0f4-44bf-ae6f-f08eaf501e20",

  conversationMessages: {
    "69cd966b-c0f4-44bf-ae6f-f08eaf501e20": [
      { id: "msg-1", content: "...", created_at: "2024-01-01T10:00:00Z" },
      { id: "msg-2", content: "...", created_at: "2024-01-01T10:01:00Z" },
      // ... (20 messages, sorted ASC)
      { id: "msg-20", content: "...", created_at: "2024-01-01T10:19:00Z" }
    ]
  },

  hasMoreMessages: {
    "69cd966b-c0f4-44bf-ae6f-f08eaf501e20": true  // มี messages เก่ากว่านี้อีก
  },

  hasAfterMessages: {
    "69cd966b-c0f4-44bf-ae6f-f08eaf501e20": false  // โหลดจากล่างสุด
  }
}
```

#### 4. Virtuoso Initialization

```typescript
// src/components/shared/VirtualMessageList.tsx
const INITIAL_INDEX = 100000;
const [firstItemIndex, setFirstItemIndex] = useState(INITIAL_INDEX);

<Virtuoso
  data={deduplicatedMessages}
  firstItemIndex={firstItemIndex}                    // 100000
  initialTopMostItemIndex={firstItemIndex + deduplicatedMessages.length - 1}  // 100019
  followOutput={(isAtBottom) => isAtBottom ? 'smooth' : false}
  // ... other props
/>
```

**หมายเหตุ:** Virtuoso ใช้ virtual index range [100000, 100019] สำหรับ 20 messages แรก

---

## 2. Load More Flow (Scroll Up)

### 🔄 Flow Diagram

```
USER เลื่อน Scroll ขึ้นด้านบน
       │
       ▼
┌──────────────────────────────┐
│ VirtualMessageList           │
│ atTopStateChange triggered   │
│ (atTop = true)               │
└──────────────┬───────────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Check conditions:    │
    │ - onLoadMore exists? │
    │ - !isLoadingMore?    │
    │ - !isJumping?        │
    └──────────┬───────────┘
               │ ✅ All true
               ▼
    ┌──────────────────────┐
    │ handleLoadMore()     │
    │ setIsLoadingMore(true)│
    └──────────┬───────────┘
               │
               ▼
    ┌───────────────────────────┐
    │ useConversationPageLogic  │
    │ handleLoadMoreMessages()  │
    └──────────┬────────────────┘
               │
               ├──────────────────────┐
               │                      │
               ▼                      ▼
    ┌──────────────────┐   ┌─────────────────────┐
    │ Get oldest msg   │   │ Check hasMore flag  │
    │ messages[0]      │   │ hasMoreMessages[id] │
    └──────────┬───────┘   └─────────┬───────────┘
               │                     │
               └─────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ API Call:            │
              │ GET /conversations/  │
              │     :id/messages     │
              │ ?before=oldestMsgId  │
              │ &limit=20            │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Response:            │
              │ {                    │
              │   messages: [...20], │
              │   has_more: true     │
              │ }                    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ conversationStore    │
              │ fetchMoreMessages    │
              │                      │
              │ - Filter duplicates  │
              │ - PREPEND new msgs   │
              │ - Sort all ASC       │
              │ - Update hasMore     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ VirtualMessageList   │
              │ useEffect detects    │
              │ prepending           │
              │                      │
              │ firstItemIndex -=20  │
              │ (100000 -> 99980)    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Virtuoso maintains   │
              │ scroll position      │
              │ automatically        │
              └──────────────────────┘
```

### 📝 Step-by-Step

#### 1. Trigger Detection

```typescript
// src/components/shared/VirtualMessageList.tsx (line 382-388)
<Virtuoso
  atTopStateChange={(atTop) => {
    if (atTop && !isLoadingMore) {
      handleLoadMore(); // ← Call directly
    }
  }}
  atTopThreshold={400}  // Trigger 400px before actual top
/>
```

#### 2. Load More Handler

```typescript
// src/components/shared/VirtualMessageList.tsx (line 214-233)
const handleLoadMore = useCallback(async () => {
  if (!onLoadMore || isLoadingMore) {
    return;
  }

  console.log('[debug_scroll] ⬆️ Load more triggered');
  setIsLoadingMore(true);

  try {
    await Promise.resolve(onLoadMore());
    console.log('[debug_scroll] ✅ Load more completed');
  } catch (error) {
    console.error('[debug_scroll] ❌ Load more failed:', error);
  } finally {
    // Reset immediately in finally
    setIsLoadingMore(false);
  }
}, [onLoadMore, isLoadingMore]);
```

#### 3. Fetch More Messages

```typescript
// src/pages/standard/converstion/hooks/useConversationPageLogic.ts (line 282-357)
const handleLoadMoreMessages = useCallback(async () => {
  if (!activeConversationId || isLoadingMoreMessages) {
    return;
  }

  const currentMessages = conversationMessages[activeConversationId] || [];
  if (currentMessages.length === 0) return;

  const oldestMessage = currentMessages[0];
  const hasMore = hasMoreMessagesAvailable(activeConversationId);

  if (!hasMore) {
    return; // No more messages to load
  }

  setIsLoadingMoreMessages(true);
  lastLoadedMessageIdRef.current = oldestMessage.id;

  try {
    await loadMoreMessages(activeConversationId, {
      before: oldestMessage.id,
      limit: 20
    });
  } catch (error) {
    console.error('Error loading more messages:', error);
  } finally {
    setIsLoadingMoreMessages(false);
  }
}, [activeConversationId, conversationMessages, hasMoreMessagesAvailable, loadMoreMessages, isLoadingMoreMessages]);
```

#### 4. Store Update - Prepending

```typescript
// src/stores/conversationStore.ts (line 161-229)
fetchMoreMessages: async (conversationId: string, params: ConversationMessagesQueryRequest) => {
  try {
    const response = await conversationService.getConversationMessages(
      conversationId,
      params
    );

    if (response.success && response.data) {
      const { messages: newMessages, has_more } = response.data;

      set((state) => {
        const existingMessages = state.conversationMessages[conversationId] || [];

        // Filter duplicates
        const filteredNew = newMessages.filter(
          newMsg => !existingMessages.some(existing => existing.id === newMsg.id)
        );

        let mergedMessages;

        if (params.before) {
          // PREPEND - เพิ่มข้างหน้า (older messages)
          mergedMessages = [...filteredNew, ...existingMessages];
        } else if (params.after) {
          // APPEND - เพิ่มข้างหลัง (newer messages)
          mergedMessages = [...existingMessages, ...filteredNew];
        } else {
          mergedMessages = [...existingMessages, ...filteredNew];
        }

        // Sort ASC
        const sortedMessages = mergedMessages.sort((a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        return {
          conversationMessages: {
            ...state.conversationMessages,
            [conversationId]: sortedMessages,
          },
          hasMoreMessages: {
            ...state.hasMoreMessages,
            [conversationId]: has_more,
          },
        };
      });
    }
  } catch (error) {
    console.error('Error fetching more messages:', error);
  }
}
```

#### 5. firstItemIndex Update

```typescript
// src/components/shared/VirtualMessageList.tsx (line 131-158)
useEffect(() => {
  const currentCount = deduplicatedMessages.length;
  const prevCount = prevMessageCountRef.current;
  const firstMessageId = deduplicatedMessages[0]?.id;
  const prevFirstId = prevFirstMessageIdRef.current;

  if (currentCount > prevCount && prevCount > 0) {
    const diff = currentCount - prevCount;
    console.log(`[debug_scroll] 📥 Messages changed: ${prevCount} -> ${currentCount} (diff: ${diff})`);

    if (prevFirstId && firstMessageId !== prevFirstId) {
      // Prepending at top
      console.log(`[debug_scroll]    📥 Prepending ${diff} messages at top`);
      setFirstItemIndex(prev => {
        const newIndex = prev - diff;
        console.log(`[debug_scroll]    ✅ firstItemIndex: ${prev} -> ${newIndex}`);
        return newIndex;
      });
    } else {
      // Appending at bottom
      console.log(`[debug_scroll]    📤 Appending ${diff} messages at bottom`);
    }
  }

  prevMessageCountRef.current = currentCount;
  prevFirstMessageIdRef.current = firstMessageId || null;
}, [deduplicatedMessages.length]);
```

### 📊 State Changes Example

```javascript
// Before Load More
messages.length = 20
firstItemIndex = 100000
Virtual range: [100000, 100019]
Oldest message: msg-1

// After Load More (20 new messages)
messages.length = 40
firstItemIndex = 99980  // Decreased by 20
Virtual range: [99980, 100019]
Oldest message: msg--19 (new)
Previously oldest: msg-1 (now at index 99999)

// User's scroll position is maintained!
```

---

## 3. Jump to Message Flow

### 🔄 Flow Diagram

```
USER คลิก "Jump to Message" (เช่น จาก reply หรือ search)
       │
       ▼
┌──────────────────────────────┐
│ handleJumpToMessage(msgId)   │
│ (MessageJumpContext)         │
└──────────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ API Call:                │
    │ GET /conversations/:id/  │
    │     messages/context     │
    │ ?targetId=msg-123        │
    │ &before=20               │
    │ &after=20                │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Response:                │
    │ {                        │
    │   success: true,         │
    │   data: [...41 msgs],    │
    │   has_before: true,      │
    │   has_after: true        │
    │ }                        │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ conversationStore        │
    │ replaceMessagesWithContext│
    │                          │
    │ REPLACE (ไม่ใช่ merge!)  │
    │ - Clear old messages     │
    │ - Set context messages   │
    │ - Update hasMore flags   │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Wait 100ms for DOM       │
    │ setTimeout(() => {...})  │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ messageAreaRef.current   │
    │   .scrollToMessage(id)   │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ VirtualMessageList       │
    │ jumpToMessage(msgId)     │
    │                          │
    │ 1. Find index            │
    │ 2. Mark isJumping=true   │
    │ 3. scrollToIndex()       │
    │ 4. Highlight animation   │
    │ 5. Reset isJumping=false │
    └──────────────────────────┘
```

### 📝 Step-by-Step

#### 1. Trigger Jump

```typescript
// User clicks "Jump to Message" button
// Context: MessageJumpContext or reply click
handleJumpToMessage("msg-2150");
```

#### 2. Fetch Message Context

```typescript
// src/pages/standard/converstion/hooks/useConversationPageLogic.ts (line 449-485)
const handleJumpToMessage = useCallback(async (messageId: string) => {
  if (!activeConversationId) return;

  console.log('🎯 Jumping to message:', messageId);

  try {
    // Fetch context around target message
    const response = await conversationService.getMessageContext(
      activeConversationId,
      messageId,
      20, // before
      20  // after
    );

    if (response.success && response.data) {
      const contextMessages = response.data;
      const has_before = response.has_before ?? true;
      const has_after = response.has_after ?? false;

      // REPLACE messages with context
      await replaceMessagesWithContext(
        activeConversationId,
        contextMessages,
        has_before,
        has_after
      );

      // Wait for DOM update
      setTimeout(() => {
        messageAreaRef.current?.scrollToMessage(messageId);
      }, 100);
    }
  } catch (error) {
    console.error('Error jumping to message:', error);
    toast.error('ไม่สามารถไปยังข้อความได้');
  }
}, [activeConversationId, replaceMessagesWithContext, messageAreaRef]);
```

#### 3. API Endpoint

```typescript
// src/services/conversationService.ts (line 126-131)
async getMessageContext(
  conversationId: string,
  targetMessageId: string,
  before: number = 20,
  after: number = 20
) {
  return apiClient.get<MessageDTO[]>(
    `/conversations/${conversationId}/messages/context`,
    {
      params: {
        targetId: targetMessageId,
        before,
        after,
      },
    }
  );
}
```

**API Response Format:**
```json
{
  "success": true,
  "data": [
    { "id": "msg-2130", "content": "..." },
    { "id": "msg-2131", "content": "..." },
    // ... 20 messages before target
    { "id": "msg-2150", "content": "..." },  // ← Target message
    // ... 20 messages after target
    { "id": "msg-2169", "content": "..." },
    { "id": "msg-2170", "content": "..." }
  ],
  "has_before": true,  // มี messages เก่ากว่า msg-2130 อีก
  "has_after": true    // มี messages ใหม่กว่า msg-2170 อีก
}
```

#### 4. Replace Messages

```typescript
// src/stores/conversationStore.ts (line 824-849)
replaceMessagesWithContext: (
  conversationId: string,
  contextMessages: MessageDTO[],
  hasBefore: boolean = false,
  hasAfter: boolean = false
) => {
  const sortedMessages = [...contextMessages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const messagesWithKeys = sortedMessages.map(msg => ({
    ...msg,
    localKey: msg.localKey || msg.temp_id || msg.id,
  }));

  set((state) => ({
    conversationMessages: {
      ...state.conversationMessages,
      [conversationId]: messagesWithKeys,  // REPLACE!
    },
    hasMoreMessages: {
      ...state.hasMoreMessages,
      [conversationId]: hasBefore,  // ← Important for scroll up
    },
    hasAfterMessages: {
      ...state.hasAfterMessages,
      [conversationId]: hasAfter,   // ← Important for scroll down
    },
  }));
}
```

#### 5. Scroll to Message

```typescript
// src/components/shared/VirtualMessageList.tsx (line 166-199)
const jumpToMessage = useCallback((messageId: string) => {
  const targetIndex = deduplicatedMessages.findIndex(msg => msg.id === messageId);

  if (targetIndex === -1 || !virtuosoRef.current) {
    return;
  }

  // Mark as jumping to prevent auto scroll
  isJumpingRef.current = true;
  setAtBottom(false);

  // Virtuoso scrollToIndex
  virtuosoRef.current.scrollToIndex({
    index: targetIndex,
    align: 'center',
    behavior: 'smooth'
  });

  // Highlight after scroll
  setTimeout(() => {
    const element = document.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.classList.add('ring-4', 'ring-yellow-400', 'transition-all', 'duration-300');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-yellow-400');
        // Reset jumping flag after animation
        isJumpingRef.current = false;
      }, 2000);
    } else {
      // Reset even if element not found
      isJumpingRef.current = false;
    }
  }, 500);
}, [deduplicatedMessages]);
```

### 📊 State After Jump

```javascript
// Before Jump
conversationMessages["conv-123"] = [
  msg-1, msg-2, ..., msg-20  // Latest 20 messages
]
hasMoreMessages["conv-123"] = true   // มีข้อความเก่ากว่า
hasAfterMessages["conv-123"] = false // อยู่ล่างสุดแล้ว

// After Jump to msg-2150
conversationMessages["conv-123"] = [
  msg-2130, msg-2131, ..., msg-2149,
  msg-2150,  // ← Target (อยู่กลาง list)
  msg-2151, msg-2152, ..., msg-2170
]
hasMoreMessages["conv-123"] = true   // มีข้อความเก่ากว่า msg-2130
hasAfterMessages["conv-123"] = true  // มีข้อความใหม่กว่า msg-2170

// ตอนนี้ user อยู่กลางแชท สามารถ scroll ทั้ง 2 ทิศทางได้!
```

---

## 4. After Jump - Scroll Behavior

### 4A. Scroll UP After Jump (โหลดข้อความเก่ากว่า)

```
USER เลื่อน Scroll ขึ้นหลัง Jump
       │
       ▼
┌──────────────────────────────┐
│ VirtualMessageList           │
│ atTopStateChange(true)       │
└──────────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Check:                   │
    │ hasMoreMessages[id]      │
    │ = has_before from jump   │
    └──────────┬───────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
    true            false
       │                │
       │                └──> ไม่ทำอะไร
       │
       ▼
┌──────────────────────────────┐
│ handleLoadMore()             │
│ Get oldest: msg-2130         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ API:                         │
│ GET /messages                │
│ ?before=msg-2130             │
│ &limit=20                    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Response:                    │
│ [msg-2110, ..., msg-2129]    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ PREPEND to list              │
│ firstItemIndex -= 20         │
│ Maintain scroll position     │
└──────────────────────────────┘
```

**ตัวอย่าง Code:**

```typescript
// src/pages/standard/converstion/hooks/useConversationPageLogic.ts
const handleLoadMoreMessages = useCallback(async () => {
  const hasMore = hasMoreMessagesAvailable(activeConversationId);

  if (!hasMore) {
    console.log('No more older messages');
    return;  // has_before = false from jump
  }

  const oldestMessage = conversationMessages[activeConversationId][0];

  await loadMoreMessages(activeConversationId, {
    before: oldestMessage.id,  // msg-2130
    limit: 20
  });

  // Store will prepend messages automatically
}, [...]);
```

### 4B. Scroll DOWN After Jump (โหลดข้อความใหม่กว่า)

```
USER เลื่อน Scroll ลงหลัง Jump
       │
       ▼
┌──────────────────────────────┐
│ VirtualMessageList           │
│ (ไม่มี atBottomStateChange) │
│ หรือ endReached callback     │
└──────────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ useConversationPageLogic │
    │ handleLoadMoreAtBottom() │
    └──────────┬───────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │ Check:                   │
    │ hasAfterMessages[id]     │
    │ = has_after from jump    │
    └──────────┬───────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
    true            false
       │                │
       │                └──> ไม่ทำอะไร
       │
       ▼
┌──────────────────────────────┐
│ Get newest: msg-2170         │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ API:                         │
│ GET /messages                │
│ ?after=msg-2170              │
│ &limit=20                    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ Response:                    │
│ [msg-2171, ..., msg-2190]    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ APPEND to list               │
│ firstItemIndex same          │
│ Add to bottom                │
└──────────────────────────────┘
```

**ตัวอย่าง Code:**

```typescript
// src/pages/standard/converstion/hooks/useConversationPageLogic.ts (line 360-393)
const handleLoadMoreMessagesAtBottom = useCallback(async () => {
  const hasAfter = hasAfterMessagesAvailable(activeConversationId);

  if (!hasAfter) {
    console.log('No more newer messages');
    return;  // has_after = false from jump
  }

  const currentMessages = conversationMessages[activeConversationId] || [];
  const newestMessage = currentMessages[currentMessages.length - 1];

  await loadMoreMessages(activeConversationId, {
    after: newestMessage.id,  // msg-2170
    limit: 20
  });

  // Store will append messages automatically
}, [...]);
```

### 📊 State Transitions

```javascript
// สถานะต่างๆ ของ hasMore flags

// 1. Initial Load (อยู่ล่างสุด)
hasMoreMessages["conv-123"] = true   // สามารถโหลดเก่ากว่าได้
hasAfterMessages["conv-123"] = false // อยู่ล่างสุดแล้ว

// 2. After Jump to Middle
hasMoreMessages["conv-123"] = true   // สามารถโหลดเก่ากว่าได้
hasAfterMessages["conv-123"] = true  // สามารถโหลดใหม่กว่าได้

// 3. After Jump to Oldest Message
hasMoreMessages["conv-123"] = false  // ไม่มีข้อความเก่ากว่า
hasAfterMessages["conv-123"] = true  // สามารถโหลดใหม่กว่าได้

// 4. After Scroll Down to Bottom (from middle)
hasMoreMessages["conv-123"] = true   // ยังมีข้อความเก่ากว่า (จาก jump)
hasAfterMessages["conv-123"] = false // โหลดจนล่างสุดแล้ว
```

---

## State Management

### conversationStore State Schema

```typescript
interface ConversationState {
  // Conversations List
  conversations: ConversationDTO[];

  // Active Conversation
  activeConversationId: string | null;

  // Messages by Conversation ID
  conversationMessages: {
    [conversationId: string]: MessageDTO[];  // Always sorted ASC
  };

  // Pagination Flags
  hasMoreMessages: {
    [conversationId: string]: boolean;  // มีข้อความเก่ากว่าไหม (scroll up)
  };

  hasAfterMessages: {
    [conversationId: string]: boolean;  // มีข้อความใหม่กว่าไหม (scroll down)
  };

  // Loading States
  isLoading: boolean;

  // Error
  error: string | null;
}
```

### Key Store Actions

```typescript
// 1. fetchConversationMessages - Initial load
fetchConversationMessages(conversationId, { limit: 20 })
→ GET /conversations/:id/messages?limit=20
→ Replace conversationMessages[id]
→ Set hasMoreMessages[id]

// 2. fetchMoreMessages - Load more (up or down)
fetchMoreMessages(conversationId, { before: msgId, limit: 20 })
→ GET /conversations/:id/messages?before=msgId&limit=20
→ PREPEND to conversationMessages[id]
→ Update hasMoreMessages[id]

fetchMoreMessages(conversationId, { after: msgId, limit: 20 })
→ GET /conversations/:id/messages?after=msgId&limit=20
→ APPEND to conversationMessages[id]
→ Update hasAfterMessages[id]

// 3. replaceMessagesWithContext - Jump to message
replaceMessagesWithContext(conversationId, contextMsgs, hasBefore, hasAfter)
→ REPLACE conversationMessages[id] = contextMsgs
→ Set hasMoreMessages[id] = hasBefore
→ Set hasAfterMessages[id] = hasAfter
```

---

## API Endpoints

### Summary Table

| Scenario | Endpoint | Method | Query Parameters | Response |
|----------|----------|--------|------------------|----------|
| **Initial Load** | `/conversations/:id/messages` | GET | `?limit=20` | `{ messages[], has_more }` |
| **Load Older** | `/conversations/:id/messages` | GET | `?before=msgId&limit=20` | `{ messages[], has_more }` |
| **Load Newer** | `/conversations/:id/messages` | GET | `?after=msgId&limit=20` | `{ messages[], has_more }` |
| **Jump Context** | `/conversations/:id/messages/context` | GET | `?targetId=msgId&before=20&after=20` | `{ data[], has_before, has_after }` |

### API Response Details

#### 1. Get Messages (Initial/Load More)

```
GET /api/v1/conversations/:conversationId/messages
```

**Query Parameters:**
- `limit` (number): จำนวนข้อความที่ต้องการ (default: 20)
- `before` (string): Message ID - โหลดข้อความก่อนหน้า ID นี้
- `after` (string): Message ID - โหลดข้อความหลัง ID นี้

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-123",
        "conversation_id": "conv-456",
        "sender_id": "user-789",
        "sender_type": "user",
        "sender_name": "John Doe",
        "message_type": "text",
        "content": "Hello world",
        "created_at": "2024-01-01T10:00:00Z",
        "updated_at": "2024-01-01T10:00:00Z",
        "is_deleted": false,
        "is_edited": false,
        "is_read": true,
        "status": "sent"
      }
    ],
    "has_more": true
  }
}
```

#### 2. Get Message Context (Jump)

```
GET /api/v1/conversations/:conversationId/messages/context
```

**Query Parameters:**
- `targetId` (string, required): Target message ID
- `before` (number): จำนวนข้อความก่อนหน้า (default: 20)
- `after` (number): จำนวนข้อความหลัง (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    // ... 20 messages before target
    { "id": "target-msg-id", "..." },
    // ... 20 messages after target
  ],
  "has_before": true,
  "has_after": true
}
```

---

## Key Technical Details

### 1. Message Deduplication

```typescript
// src/components/shared/VirtualMessageList.tsx (line 94-115)
const deduplicatedMessages = useMemo(() => {
  if (messages.length === 0) return [];
  if (messages.length < 2) return messages;

  const seen = new Set<string>();
  const result: MessageDTO[] = [];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const key = msg.temp_id || msg.id;

    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(msg);
    }
  }

  return result;
}, [messages]);
```

**จุดประสงค์:**
- กันข้อความซ้ำเมื่อ WebSocket ส่งมาขณะกำลัง load more
- ใช้ `temp_id` หรือ `id` เป็น unique key
- Single pass O(n) complexity

### 2. Message Sorting

**ทุกที่ที่เก็บ messages ต้อง sort ASC:**

```typescript
// Pattern ที่ใช้ทั่วทั้ง codebase
const sortedMessages = [...messages].sort(
  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
);
```

**เหตุผล:**
- Virtuoso ต้องการ index ที่เรียงตามลำดับ
- firstItemIndex pattern ทำงานได้ถูกต้องเมื่อ messages เรียง ASC
- ง่ายต่อการหา oldest (index 0) และ newest (index length-1)

### 3. localKey Pattern

```typescript
const messagesWithKeys = messages.map(msg => ({
  ...msg,
  localKey: msg.localKey || msg.temp_id || msg.id,
}));
```

**จุดประสงค์:**
- React key stability - ไม่ re-render ซ้ำเมื่อ message update
- Temp messages → Real messages transition ไม่กระตุก
- Virtuoso scroll position คงที่

### 4. firstItemIndex Pattern

```typescript
// ตัวอย่างการทำงาน
INITIAL_INDEX = 100000

// Load 20 messages
firstItemIndex = 100000
messages = [msg1, msg2, ..., msg20]
Virtual indices: [100000, 100001, ..., 100019]

// Load 20 more (prepend)
firstItemIndex = 99980  // Decreased by 20
messages = [msg-19, ..., msg1, msg2, ..., msg20]
Virtual indices: [99980, 99981, ..., 100019]

// msg1 ยังอยู่ที่ virtual index 100000
// User ยังเห็น msg1 ที่ตำแหน่งเดิม (scroll stable!)
```

**เหตุผล:**
- Virtuoso ใช้ virtual index เพื่อ calculate scroll position
- เมื่อ prepend messages ต้องลด firstItemIndex เท่าจำนวน messages ที่เพิ่ม
- ทำให้ scroll position คงที่แม้ messages เพิ่มข้างหน้า

### 5. Image Caching (Prevent Skeleton Flash)

```typescript
// src/components/shared/message/ImageMessage.tsx
const loadedImagesCache = new Set<string>();

const ImageMessage = ({ message }) => {
  const imageUrl = message.media_url || message.media_thumbnail_url || '';
  const isCached = loadedImagesCache.has(imageUrl);

  const [isLoaded, setIsLoaded] = useState(isCached); // ← Start loaded if cached

  const handleLoad = () => {
    setIsLoaded(true);
    loadedImagesCache.add(imageUrl); // ← Cache it
  };

  return (
    <>
      {!isLoaded && <Skeleton />}
      <img src={imageUrl} onLoad={handleLoad} />
    </>
  );
};
```

**จุดประสงค์:**
- เมื่อ load more และ re-render component → ไม่แสดง skeleton flash
- ใช้ global Set เก็บ URLs ที่โหลดแล้ว
- Component mount ใหม่จะเช็ค cache ก่อน

### 6. WebSocket Integration

```typescript
// src/hooks/useConversation.ts (line 119-175)
useEffect(() => {
  if (!wsData) return;

  const { event, data } = wsData;

  if (event === 'new_message' && data.message) {
    const message: MessageDTO = data.message;

    // Check if temp message exists
    const existingMessages = conversationMessages[message.conversation_id] || [];
    const tempIndex = existingMessages.findIndex(
      msg => msg.temp_id && msg.temp_id === message.temp_id
    );

    if (tempIndex !== -1) {
      // Replace temp message with real one
      replaceTemporaryMessage(
        message.conversation_id,
        message.temp_id!,
        message
      );
    } else {
      // Add new message
      addNewMessage(message);
    }

    // Auto mark as read if active
    if (message.conversation_id === activeConversationId) {
      markAllMessagesAsRead(message.conversation_id);
    }
  }
}, [wsData, activeConversationId, conversationMessages]);
```

**Flow:**
1. User ส่งข้อความ → สร้าง temp message ด้วย `temp_id`
2. WebSocket รับ message จาก server → มี `id` จริงและ `temp_id`
3. Replace temp message ด้วย real message (ใช้ `localKey` เดิม)
4. ไม่มี re-render กระตุก เพราะ key เท่าเดิม

---

## การเปรียบเทียบกับ Guide

### ✅ สิ่งที่ตรงกับ Guide (jump_to_message_guide.txt)

1. **Virtual Scrolling with Virtuoso** ✓
   - ใช้ `firstItemIndex` pattern
   - `initialTopMostItemIndex` สำหรับ scroll to bottom
   - `followOutput` สำหรับ auto-scroll

2. **Jump to Message Pattern** ✓
   - Check ว่า message อยู่ใน list ไหม
   - ถ้าไม่มี → เรียก API `around=messageId`
   - Replace messages ด้วย context
   - Scroll to target message
   - Highlight animation

3. **Bi-directional Scrolling** ✓
   - Scroll up → Load `before`
   - Scroll down → Load `after`
   - ใช้ flags `hasMoreMessages` และ `hasAfterMessages`

4. **Message Context API** ✓
   - Endpoint: `/messages/context?targetId=...&before=20&after=20`
   - Response มี `has_before` และ `has_after`

### ⚠️ ข้อแตกต่างจาก Guide

1. **Replace vs Merge**
   - Guide แนะนำ: อาจ merge messages
   - เราใช้: **REPLACE ทั้งหมด** (`replaceMessagesWithContext`)
   - **เหตุผล:** ง่ายกว่า ไม่ต้องจัดการ duplicate ซับซ้อน

2. **Load More at Bottom**
   - Guide: ใช้ `endReached` callback
   - เราใช้: `handleLoadMoreMessagesAtBottom` แยกออกมา
   - **เหตุผล:** Control logic ได้ดีกว่า

3. **Caching Strategy**
   - Guide: ไม่ได้พูดถึง
   - เราเพิ่ม: Global image cache (`loadedImagesCache`)
   - **เหตุผล:** แก้ปัญหา skeleton flash

---

## สรุป Flow ทั้งหมด (Sequence Diagram)

```
┌─────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────┐   ┌──────────┐
│  User   │   │  Component   │   │    Hook     │   │   Store  │   │   API    │
└────┬────┘   └──────┬───────┘   └──────┬──────┘   └────┬─────┘   └────┬─────┘
     │               │                  │               │              │
     │ Open Chat     │                  │               │              │
     ├──────────────>│                  │               │              │
     │               │ getMessages()    │               │              │
     │               ├─────────────────>│               │              │
     │               │                  │ fetch()       │              │
     │               │                  ├──────────────>│              │
     │               │                  │               │ GET /msgs    │
     │               │                  │               ├─────────────>│
     │               │                  │               │<─────────────┤
     │               │                  │<──────────────┤ Response     │
     │               │<─────────────────┤               │              │
     │               │ Render msgs      │               │              │
     │<──────────────┤                  │               │              │
     │               │                  │               │              │
     │ Scroll Up     │                  │               │              │
     ├──────────────>│                  │               │              │
     │               │ atTopChange()    │               │              │
     │               │ loadMore()       │               │              │
     │               ├─────────────────>│               │              │
     │               │                  │ fetchMore()   │              │
     │               │                  ├──────────────>│              │
     │               │                  │               │ GET ?before  │
     │               │                  │               ├─────────────>│
     │               │                  │               │<─────────────┤
     │               │                  │<──────────────┤              │
     │               │<─────────────────┤ Prepend msgs  │              │
     │<──────────────┤ Update UI        │               │              │
     │               │                  │               │              │
     │ Click Jump    │                  │               │              │
     ├──────────────>│                  │               │              │
     │               │ jumpToMsg()      │               │              │
     │               ├─────────────────>│               │              │
     │               │                  │ getContext()  │              │
     │               │                  ├──────────────>│              │
     │               │                  │               │ GET /context │
     │               │                  │               ├─────────────>│
     │               │                  │               │<─────────────┤
     │               │                  │<──────────────┤              │
     │               │                  │ replace()     │              │
     │               │                  ├──────────────>│              │
     │               │<─────────────────┤               │              │
     │               │ scrollToIndex()  │               │              │
     │<──────────────┤ + Highlight      │               │              │
     │               │                  │               │              │
```

---

## 📚 ไฟล์ที่เกี่ยวข้อง

### Stores
- `src/stores/conversationStore.ts` - การจัดการ conversations และ messages
- `src/stores/messageStore.ts` - การส่ง/แก้ไข/ลบ messages

### Hooks
- `src/hooks/useConversation.ts` - Hook หลักสำหรับ conversation operations
- `src/pages/standard/converstion/hooks/useConversationPageLogic.ts` - Page logic

### Services
- `src/services/conversationService.ts` - API calls
- `src/services/messageService.ts` - Message API calls

### Components
- `src/components/shared/VirtualMessageList.tsx` - Virtuoso virtual scrolling
- `src/components/shared/MessageArea.tsx` - Message display wrapper
- `src/pages/chat/ConversationPageDemo.tsx` - Main chat page

---

## 🎯 Best Practices

### 1. Message Sorting
```typescript
// ❌ Don't mutate original array
messages.sort(...);

// ✅ Always create new sorted array
const sortedMessages = [...messages].sort(...);
```

### 2. Deduplication
```typescript
// ❌ Inefficient - nested loop O(n²)
messages.filter((msg, idx, arr) =>
  arr.findIndex(m => m.id === msg.id) === idx
);

// ✅ Efficient - Set O(n)
const seen = new Set();
messages.filter(msg => {
  const key = msg.temp_id || msg.id;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
```

### 3. firstItemIndex Updates
```typescript
// ❌ Don't use length directly
setFirstItemIndex(100000 - messages.length);

// ✅ Use relative update
setFirstItemIndex(prev => prev - newMessagesCount);
```

### 4. Load More Checks
```typescript
// ❌ Missing checks
const handleLoadMore = () => {
  loadMoreMessages(...);
};

// ✅ Proper checks
const handleLoadMore = async () => {
  if (!conversationId || isLoading || !hasMore) {
    return;
  }
  // ... load logic
};
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Skeleton Flash on Load More

**Problem:** Images show skeleton every time messages re-render

**Solution:** Use global cache
```typescript
const loadedImagesCache = new Set<string>();
const [isLoaded, setIsLoaded] = useState(
  loadedImagesCache.has(imageUrl)
);
```

### Issue 2: Scroll Jumps on Prepend

**Problem:** Scroll position jumps when loading older messages

**Solution:** Update `firstItemIndex` correctly
```typescript
useEffect(() => {
  const diff = currentCount - prevCount;
  if (firstMessageId !== prevFirstId) {
    setFirstItemIndex(prev => prev - diff);
  }
}, [messages.length]);
```

### Issue 3: Duplicate Messages

**Problem:** Same message appears twice

**Solution:** Deduplicate using unique key
```typescript
const seen = new Set();
const deduped = messages.filter(msg => {
  const key = msg.temp_id || msg.id;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
```

### Issue 4: Jump Not Working

**Problem:** `scrollToIndex()` not scrolling

**Solution:**
1. Wait for DOM update: `setTimeout(() => scrollToIndex(), 100)`
2. Check message exists: `findIndex() !== -1`
3. Ensure `virtuosoRef.current` exists

---

## 📝 Notes

1. **Performance:** Virtuoso จัดการ virtual rendering ให้อัตโนมัติ ไม่ต้องกังวลเรื่อง DOM nodes มากเกินไป

2. **Memory:** Messages ใน store จะเก็บตามที่โหลดมา ไม่มีการ clear (cache แบบ infinite)

3. **WebSocket:** Real-time messages จะ merge เข้ามาอัตโนมัติ และ replace temp messages

4. **Error Handling:** ทุก API call มี try-catch และ toast notification

5. **Mobile Support:** ใช้ `isMobile` hook เพื่อ adjust behavior

---

**สร้างเมื่อ:** 2025-11-13
**Version:** 1.0.0
**สถานะ:** ✅ Complete & Production-Ready
