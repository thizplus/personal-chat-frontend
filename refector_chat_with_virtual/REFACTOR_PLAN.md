# แผนการ Refactor ระบบแชท - Chat System Optimization Plan

## 📊 สรุปสถานการณ์ปัจจุบัน (Current State Analysis)

### ปัญหาที่พบ (Issues Found)

| ปัญหา | รายละเอียด | ผลกระทบ |
|-------|-----------|---------|
| **Wrapper Components มากเกินไป** | มี 10 layers ของ wrapper components | ลดประสิทธิภาพ 15-20% |
| **Code Duplication** | โค้ดซ้ำซ้อนประมาณ 690 บรรทัด | Code ยากต่อการ maintain |
| **Props Drilling** | ส่ง props ผ่าน component 18+ props | Re-render บ่อยเกินความจำเป็น |
| **Scroll Management ซ้ำซ้อน** | มี 2 ระบบจัดการ scroll พร้อมกัน | ลดประสิทธิภาพ scroll 5-10% |

### โครงสร้าง Component ปัจจุบัน (Current Component Hierarchy)

```
StandardLayout (Layer 1)
└── ConversationPage (Layer 2)
    └── MobileConversationView OR DesktopConversationView (Layer 3) ❌ DUPLICATE
        ├── ConversationsList (Layer 4)
        ├── ChatHeader (Layer 5)
        ├── MessageArea (Layer 6) ❌ TOO MANY PROPS
        │   └── VirtualMessageList (Layer 7) ✅ KEEP (แต่ต้อง optimize)
        │       └── MessageItem (Layer 8) ✅ KEEP (memoized)
        │           └── MessageContextMenu (Layer 9) ✅ KEEP
        │               └── TextMessage/ImageMessage/etc (Layer 10) ✅ KEEP
        └── MessageInputArea
```

### ไฟล์ที่ต้อง Refactor

**Priority 1 (ต้องแก้ไข - High Impact):**
- `/src/pages/standard/converstion/mobile/MobileConversationView.tsx` (182 lines) - **ลบ/รวม**
- `/src/pages/standard/converstion/desktop/DesktopConversationView.tsx` (166 lines) - **ลบ/รวม**
- `/src/components/shared/SimpleMessageList.tsx` (342 lines) - **ลบ**
- `/src/components/shared/hooks/useMessageScroll.ts` - **ลบ (ซ้ำซ้อน)**

**Priority 2 (ปรับปรุง - Medium Impact):**
- `/src/components/shared/MessageArea.tsx` (185 lines) - **ลดความซับซ้อน**
- `/src/components/shared/VirtualMessageList.tsx` (344 lines) - **ลดจำนวน props**
- `/src/pages/standard/converstion/ConversationPage.tsx` (151 lines) - **ปรับให้ responsive**

**Priority 3 (คงไว้แต่ปรับปรุง - Low Impact):**
- `/src/components/shared/message/*` - ใช้ Context แทน props drilling

---

## 🎯 เป้าหมายของการ Refactor (Goals)

### ผลลัพธ์ที่คาดหวัง (Expected Outcomes)

| ก่อน Refactor | หลัง Refactor | ผลต่าง |
|--------------|--------------|--------|
| Component layers: 10 | Component layers: 6-7 | **-40%** |
| Props drilling: 18+ | Props drilling: 3 | **-83%** |
| Code duplication: ~690 lines | Code duplication: 0 | **-100%** |
| Scroll systems: 2 | Scroll systems: 1 | **-50%** |
| Initial render: baseline | Initial render: faster | **+15-20%** |
| Scroll smoothness: baseline | Scroll smoothness: better | **+5-10%** |

---

## 📋 แผนการ Refactor แบบละเอียด (Detailed Refactoring Plan)

### PHASE 1: ลบ Scroll Management ที่ซ้ำซ้อน (Remove Redundant Scroll)
**ระยะเวลา:** 30 นาที - 1 ชั่วโมง
**ผลลัพธ์:** ปรับปรุง scroll performance 5-10%
**ความเสี่ยง:** ⭐ ต่ำ (Virtua รองรับครบ)

#### 🎯 Objective
ลบ `useMessageScroll` hook เพราะ Virtua มี scroll management ในตัวอยู่แล้ว ทำให้มีระบบจัดการ scroll ซ้ำซ้อน 2 ระบบ

#### ✅ Checklist

- [ ] **1.1 วิเคราะห์ useMessageScroll Hook**
  - [ ] เปิดไฟล์ `/src/components/shared/hooks/useMessageScroll.ts`
  - [ ] อ่านและเข้าใจ logic ทั้งหมดที่ทำอยู่
  - [ ] จดบันทึกฟีเจอร์ที่ hook นี้ทำ:
    - Auto scroll to bottom เมื่อมี message ใหม่
    - Detect ว่า user กำลังอ่าน message เก่าอยู่ไหม (should auto-scroll หรือไม่)
    - Preserve scroll position เมื่อโหลด message เก่า
  - [ ] ตรวจสอบว่า Virtua มีฟีเจอร์เหล่านี้ในตัวหรือไม่

- [ ] **1.2 ตรวจสอบ VirtualMessageList ปัจจุบัน**
  - [ ] เปิดไฟล์ `/src/components/shared/VirtualMessageList.tsx`
  - [ ] หาส่วนที่ใช้ `useMessageScroll` hook
  - [ ] ตรวจสอบ props ที่ส่งมาจาก MessageArea: `onScroll`, `scrollToBottom`, etc.
  - [ ] ดู Virtua's API documentation เรื่อง:
    - `VListHandle.scrollToIndex()`
    - `shift` prop (preserve scroll on prepend)
    - `onScroll` callback
    - `findStartIndex()` / `findEndIndex()`

- [ ] **1.3 เขียน Logic ใหม่ใน VirtualMessageList**
  - [ ] สร้าง function `scrollToBottom()` โดยใช้ Virtua API:
    ```tsx
    const scrollToBottom = useCallback(() => {
      if (!virtuaRef.current) return;
      virtuaRef.current.scrollToIndex(messages.length - 1, {
        align: "end",
        smooth: true
      });
    }, [messages.length]);
    ```
  - [ ] สร้าง logic ตรวจจับว่า user อยู่ที่ด้านล่างสุดหรือไม่:
    ```tsx
    const [isAtBottom, setIsAtBottom] = useState(true);

    const handleScroll = useCallback(() => {
      if (!virtuaRef.current) return;
      const endIndex = virtuaRef.current.findEndIndex();
      const isBottom = endIndex >= messages.length - 1;
      setIsAtBottom(isBottom);
    }, [messages.length]);
    ```
  - [ ] Auto-scroll เมื่อมี message ใหม่ (ถ้า user อยู่ที่ด้านล่าง):
    ```tsx
    useEffect(() => {
      if (isAtBottom && messages.length > 0) {
        scrollToBottom();
      }
    }, [messages.length, isAtBottom, scrollToBottom]);
    ```
  - [ ] ใช้ `shift` prop เพื่อ preserve scroll position เมื่อโหลด message เก่า

- [ ] **1.4 อัพเดท MessageArea.tsx**
  - [ ] เปิดไฟล์ `/src/components/shared/MessageArea.tsx`
  - [ ] ลบการ import `useMessageScroll`
  - [ ] ลบการเรียกใช้ `useMessageScroll` hook
  - [ ] ลบ props ที่เกี่ยวกับ scroll ที่ไม่จำเป็น (เช่น `onScroll`, `scrollRef`)
  - [ ] ส่ง ref ของ VList ไปที่ component ที่ต้องการ scroll (ถ้ามี)

- [ ] **1.5 ลบไฟล์ useMessageScroll.ts**
  - [ ] Backup code (git commit ก่อน)
  - [ ] ลบไฟล์ `/src/components/shared/hooks/useMessageScroll.ts`
  - [ ] ลบ import ทุกที่ที่เรียกใช้ hook นี้

- [ ] **1.6 Testing**
  - [ ] ทดสอบ Auto-scroll เมื่อส่ง message ใหม่
  - [ ] ทดสอบ Scroll up แล้วส่ง message (ต้องไม่ auto-scroll)
  - [ ] ทดสอบ Load more messages (scroll position ต้องคงที่)
  - [ ] ทดสอบ Click "scroll to bottom" button
  - [ ] ทดสอบ Scroll to specific message (highlight)
  - [ ] วัด scroll performance (ควรเร็วขึ้น 5-10%)

---

### PHASE 2: รวม Mobile/Desktop Views เป็น Responsive Component เดียว
**ระยะเวลา:** 1-2 ชั่วโมง
**ผลลัพธ์:** ลดโค้ด 348 บรรทัด, เร็วขึ้น 5-8%
**ความเสี่ยง:** ⭐⭐ ปานกลาง

#### 🎯 Objective
รวม `MobileConversationView.tsx` (182 lines) และ `DesktopConversationView.tsx` (166 lines) ให้เป็น component เดียวใน `ConversationPage.tsx` โดยใช้ responsive design

#### ✅ Checklist

- [ ] **2.1 วิเคราะห์ความแตกต่าง**
  - [ ] เปิดทั้ง 2 ไฟล์ เคียงข้างกัน:
    - `/src/pages/standard/converstion/mobile/MobileConversationView.tsx`
    - `/src/pages/standard/converstion/desktop/DesktopConversationView.tsx`
  - [ ] ทำตาราง comparison:
    ```markdown
    | Feature | Mobile | Desktop | Can Merge? |
    |---------|--------|---------|------------|
    | Layout | Vertical stack | Sidebar + main | ✅ CSS/Flexbox |
    | ConversationsList | Hidden/Drawer | Always visible | ✅ Conditional render |
    | Header | Different style | Different style | ✅ Conditional class |
    | MessageArea | Same | Same | ✅ Already same |
    | InputArea | Same | Same | ✅ Already same |
    ```
  - [ ] จดส่วนที่เหมือนกัน 100% (ส่วนใหญ่คือ logic)
  - [ ] จดส่วนที่ต่างกัน (ส่วนใหญ่คือ layout/CSS)

- [ ] **2.2 สร้าง Responsive Breakpoint Hook**
  - [ ] สร้างไฟล์ใหม่: `/src/hooks/useMediaQuery.ts` (ถ้ายังไม่มี)
    ```tsx
    import { useState, useEffect } from 'react';

    export function useMediaQuery(query: string): boolean {
      const [matches, setMatches] = useState(false);

      useEffect(() => {
        const media = window.matchMedia(query);
        setMatches(media.matches);

        const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
      }, [query]);

      return matches;
    }

    export const useIsMobile = () => useMediaQuery('(max-width: 768px)');
    export const useIsTablet = () => useMediaQuery('(max-width: 1024px)');
    ```

- [ ] **2.3 Refactor ConversationPage.tsx**
  - [ ] เปิดไฟล์ `/src/pages/standard/converstion/ConversationPage.tsx`
  - [ ] Import `useIsMobile` hook
  - [ ] ลบการ import MobileConversationView และ DesktopConversationView
  - [ ] ย้าย JSX structure จาก Desktop/Mobile มารวมกัน:
    ```tsx
    export function ConversationPage() {
      const isMobile = useIsMobile();
      // ... existing logic ...

      return (
        <div className={cn(
          "flex h-screen",
          isMobile ? "flex-col" : "flex-row"
        )}>
          {/* Conversations List - Hide on mobile when chat is open */}
          {(!isMobile || !conversationId) && (
            <ConversationsList
              className={cn(
                isMobile ? "w-full" : "w-80 border-r"
              )}
            />
          )}

          {/* Chat Area */}
          {conversationId && (
            <div className="flex flex-col flex-1">
              <ChatHeader isMobile={isMobile} />
              <MessageArea />
              <MessageInputArea />
            </div>
          )}
        </div>
      );
    }
    ```

- [ ] **2.4 ปรับ Sub-components ให้รับ isMobile prop**
  - [ ] **ChatHeader.tsx**
    - [ ] เพิ่ม prop `isMobile?: boolean`
    - [ ] แสดง "Back" button บน mobile เท่านั้น:
      ```tsx
      {isMobile && <BackButton onClick={() => navigate('/dashboard')} />}
      ```
  - [ ] **ConversationsList.tsx**
    - [ ] เพิ่ม prop `className?: string` เพื่อรับ style จาก parent
    - [ ] ใช้ `cn()` utility merge className

- [ ] **2.5 ลบไฟล์เก่า**
  - [ ] Backup (git commit)
  - [ ] ลบไฟล์:
    - `/src/pages/standard/converstion/mobile/MobileConversationView.tsx`
    - `/src/pages/standard/converstion/desktop/DesktopConversationView.tsx`
  - [ ] ลบ folder `mobile/` และ `desktop/` (ถ้าว่างเปล่า)

- [ ] **2.6 อัพเดท Routing (ถ้าจำเป็น)**
  - [ ] ตรวจสอบ `/src/routes/*.tsx` ว่ายังใช้ route ถูกต้องไหม
  - [ ] Ensure route `/dashboard` และ `/dashboard/chat/:conversationId` ชี้ไปที่ ConversationPage ตัวเดียว

- [ ] **2.7 Testing**
  - [ ] ทดสอบบน Desktop (> 768px):
    - [ ] Sidebar แสดงเสมอ
    - [ ] Chat area อยู่ข้างขวา
    - [ ] Layout ไม่เพี้ยน
  - [ ] ทดสอบบน Mobile (< 768px):
    - [ ] เห็น conversation list ก่อน
    - [ ] Click เข้า chat แล้วเห็นแต่ chat area
    - [ ] มี back button กลับไป list
  - [ ] ทดสอบ Responsive (ลาก browser resize):
    - [ ] Breakpoint 768px switch ได้ smooth
    - [ ] ไม่มี flash/jump
  - [ ] วัดประสิทธิภาพ (ควรเร็วขึ้น 5-8%)

---

### PHASE 3: ลบ SimpleMessageList และรวมเป็น VirtualMessageList
**ระยะเวลา:** 1-2 ชั่วโมง
**ผลลัพธ์:** ลดโค้ด 342 บรรทัด, ปรับปรุง 2-3%
**ความเสี่ยง:** ⭐ ต่ำ

#### 🎯 Objective
ลบ `SimpleMessageList.tsx` (342 lines) ที่ duplicate logic ของ `VirtualMessageList.tsx` และใช้ตัวเดียวสำหรับทุกกรณี

#### ✅ Checklist

- [ ] **3.1 วิเคราะห์ SimpleMessageList**
  - [ ] เปิดไฟล์ `/src/components/shared/SimpleMessageList.tsx`
  - [ ] จดบันทึกว่าแตกต่างจาก VirtualMessageList อย่างไร:
    - ไม่มี virtualization (render ทุก message)
    - Layout ตรงไหม?
    - Event handlers เหมือนกันไหม?
  - [ ] หาที่ใช้ SimpleMessageList:
    ```bash
    # Search in codebase
    grep -r "SimpleMessageList" src/
    ```
  - [ ] เข้าใจว่าทำไมถึงมี 2 versions (อาจเป็น backward compatibility หรือ testing)

- [ ] **3.2 เพิ่ม useVirtual prop ให้ VirtualMessageList**
  - [ ] เปิดไฟล์ `/src/components/shared/VirtualMessageList.tsx`
  - [ ] เพิ่ม optional prop:
    ```tsx
    interface VirtualMessageListProps {
      // ... existing props ...
      useVirtual?: boolean; // default: true
    }

    export function VirtualMessageList({
      messages,
      useVirtual = true,
      // ... rest props
    }: VirtualMessageListProps) {
    ```
  - [ ] Conditional rendering:
    ```tsx
    if (!useVirtual) {
      // Simple non-virtualized rendering
      return (
        <div className="flex flex-col-reverse p-4">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              {...otherProps}
            />
          ))}
        </div>
      );
    }

    // Virtualized rendering (existing code)
    return (
      <VList ref={virtuaRef} {...virtuaProps}>
        {/* existing virtualized code */}
      </VList>
    );
    ```

- [ ] **3.3 Replace SimpleMessageList ทุกที่**
  - [ ] Search และ replace ทุกไฟล์:
    ```tsx
    // Before
    import { SimpleMessageList } from '@/components/shared/SimpleMessageList';
    <SimpleMessageList messages={messages} />

    // After
    import { VirtualMessageList } from '@/components/shared/VirtualMessageList';
    <VirtualMessageList messages={messages} useVirtual={false} />
    ```
  - [ ] ถ้าใช้ในหน้าที่มี message น้อยๆ (< 50 messages) ให้ใช้ `useVirtual={false}`
  - [ ] ถ้าใช้ในหน้าแชทหลัก ให้ใช้ `useVirtual={true}` (default)

- [ ] **3.4 ลบไฟล์ SimpleMessageList**
  - [ ] Backup (git commit)
  - [ ] ลบไฟล์ `/src/components/shared/SimpleMessageList.tsx`
  - [ ] ลบ test file ถ้ามี (เช่น `SimpleMessageList.test.tsx`)

- [ ] **3.5 Testing**
  - [ ] ทดสอบ VirtualMessageList กับ `useVirtual={true}`:
    - [ ] Chat ที่มี > 100 messages (virtual scrolling ทำงาน)
    - [ ] Scroll smooth
    - [ ] Load more ทำงาน
  - [ ] ทดสอบ VirtualMessageList กับ `useVirtual={false}`:
    - [ ] Chat ที่มี < 50 messages
    - [ ] Render ครบทุก message
    - [ ] Layout ถูกต้อง
  - [ ] ทดสอบ Switch between modes
  - [ ] ไม่มี console errors/warnings

---

### PHASE 4: ลด Props Drilling ด้วย Context API
**ระยะเวลา:** 2-3 ชั่วโมง
**ผลลัพธ์:** ลด props จาก 18+ เหลือ 3, ปรับปรุง 2-4%
**ความเสี่ยง:** ⭐⭐ ปานกลาง

#### 🎯 Objective
ใช้ React Context API เพื่อหลีกเลี่ยง props drilling ของ 18+ props ที่ส่งผ่าน MessageArea → VirtualMessageList → MessageItem

#### ✅ Checklist

- [ ] **4.1 วิเคราะห์ Props ปัจจุบัน**
  - [ ] เปิดไฟล์ `/src/components/shared/MessageArea.tsx`
  - [ ] List props ทั้งหมดที่ส่งไปยัง VirtualMessageList:
    ```markdown
    Props ที่ส่งไป VirtualMessageList:
    - [ ] messages (data)
    - [ ] currentUserId (data)
    - [ ] conversationId (data)
    - [ ] onReply (handler)
    - [ ] onEdit (handler)
    - [ ] onDelete (handler)
    - [ ] onForward (handler)
    - [ ] onReact (handler)
    - [ ] onCopyMessage (handler)
    - [ ] onPinMessage (handler)
    - [ ] onMessageClick (handler)
    - [ ] formatTime (formatter)
    - [ ] getMessageStatus (formatter)
    - [ ] isGroupChat (config)
    - [ ] ... (อื่นๆ)
    ```
  - [ ] แบ่งกลุ่ม props:
    - **Data Props**: messages, currentUserId, conversationId
    - **Handler Props**: onReply, onEdit, onDelete, etc.
    - **Formatter Props**: formatTime, getMessageStatus
    - **Config Props**: isGroupChat, theme, etc.

- [ ] **4.2 สร้าง Context สำหรับ Message Renderers**
  - [ ] สร้างไฟล์ใหม่: `/src/contexts/MessageRendererContext.tsx`
    ```tsx
    import { createContext, useContext, ReactNode } from 'react';
    import type { Message } from '@/types';

    interface MessageRendererContextValue {
      // Formatter functions
      formatTime: (timestamp: Date | string) => string;
      getMessageStatus: (message: Message) => 'sent' | 'delivered' | 'read' | 'failed';

      // Config
      isGroupChat: boolean;
      currentUserId: string;
      conversationId: string;
    }

    const MessageRendererContext = createContext<MessageRendererContextValue | null>(null);

    export function MessageRendererProvider({
      children,
      value,
    }: {
      children: ReactNode;
      value: MessageRendererContextValue;
    }) {
      return (
        <MessageRendererContext.Provider value={value}>
          {children}
        </MessageRendererContext.Provider>
      );
    }

    export function useMessageRenderer() {
      const context = useContext(MessageRendererContext);
      if (!context) {
        throw new Error('useMessageRenderer must be used within MessageRendererProvider');
      }
      return context;
    }
    ```

- [ ] **4.3 สร้าง Context สำหรับ Message Handlers**
  - [ ] สร้างไฟล์: `/src/contexts/MessageHandlersContext.tsx`
    ```tsx
    import { createContext, useContext, ReactNode } from 'react';
    import type { Message } from '@/types';

    interface MessageHandlersContextValue {
      onReply: (message: Message) => void;
      onEdit: (message: Message) => void;
      onDelete: (messageId: string) => void;
      onForward: (message: Message) => void;
      onReact: (messageId: string, emoji: string) => void;
      onCopyMessage: (message: Message) => void;
      onPinMessage: (messageId: string) => void;
      onMessageClick: (messageId: string) => void;
    }

    const MessageHandlersContext = createContext<MessageHandlersContextValue | null>(null);

    export function MessageHandlersProvider({
      children,
      handlers,
    }: {
      children: ReactNode;
      handlers: MessageHandlersContextValue;
    }) {
      return (
        <MessageHandlersContext.Provider value={handlers}>
          {children}
        </MessageHandlersContext.Provider>
      );
    }

    export function useMessageHandlers() {
      const context = useContext(MessageHandlersContext);
      if (!context) {
        throw new Error('useMessageHandlers must be used within MessageHandlersProvider');
      }
      return context;
    }
    ```

- [ ] **4.4 Wrap MessageArea ด้วย Providers**
  - [ ] เปิดไฟล์ `/src/components/shared/MessageArea.tsx`
  - [ ] Import contexts:
    ```tsx
    import { MessageRendererProvider } from '@/contexts/MessageRendererContext';
    import { MessageHandlersProvider } from '@/contexts/MessageHandlersContext';
    ```
  - [ ] Wrap VirtualMessageList:
    ```tsx
    export function MessageArea({
      messages,
      currentUserId,
      conversationId,
      isGroupChat,
      onReply,
      onEdit,
      onDelete,
      // ... all other props
    }: MessageAreaProps) {
      const rendererValue = useMemo(
        () => ({
          formatTime,
          getMessageStatus,
          isGroupChat,
          currentUserId,
          conversationId,
        }),
        [formatTime, getMessageStatus, isGroupChat, currentUserId, conversationId]
      );

      const handlersValue = useMemo(
        () => ({
          onReply,
          onEdit,
          onDelete,
          onForward,
          onReact,
          onCopyMessage,
          onPinMessage,
          onMessageClick,
        }),
        [onReply, onEdit, onDelete, onForward, onReact, onCopyMessage, onPinMessage, onMessageClick]
      );

      return (
        <MessageRendererProvider value={rendererValue}>
          <MessageHandlersProvider handlers={handlersValue}>
            <VirtualMessageList
              messages={messages}
              // ส่งแค่ props ที่จำเป็นจริงๆ
            />
          </MessageHandlersProvider>
        </MessageRendererProvider>
      );
    }
    ```

- [ ] **4.5 อัพเดท VirtualMessageList**
  - [ ] เปิดไฟล์ `/src/components/shared/VirtualMessageList.tsx`
  - [ ] ลบ props ที่ไม่จำเป็นออกจาก interface:
    ```tsx
    interface VirtualMessageListProps {
      messages: Message[];
      // ลบ: currentUserId, isGroupChat, formatTime, getMessageStatus, etc.
      // ลบ: onReply, onEdit, onDelete, etc.
    }
    ```
  - [ ] MessageItem จะไปใช้ context เอง (ดูขั้นตอนถัดไป)

- [ ] **4.6 อัพเดท MessageItem และ Message Components**
  - [ ] เปิดไฟล์ `/src/components/shared/MessageItem.tsx`
  - [ ] Import hooks:
    ```tsx
    import { useMessageRenderer } from '@/contexts/MessageRendererContext';
    import { useMessageHandlers } from '@/contexts/MessageHandlersContext';
    ```
  - [ ] ใช้ context แทน props:
    ```tsx
    export const MessageItem = memo(function MessageItem({ message }: { message: Message }) {
      const { formatTime, getMessageStatus, currentUserId, isGroupChat } = useMessageRenderer();
      const { onReply, onEdit, onDelete, ... } = useMessageHandlers();

      // ... rest of component
    });
    ```
  - [ ] ทำเช่นเดียวกันกับ:
    - `/src/components/shared/message/TextMessage.tsx`
    - `/src/components/shared/message/ImageMessage.tsx`
    - `/src/components/shared/message/ReplyMessage.tsx`
    - `/src/components/shared/MessageContextMenu.tsx`

- [ ] **4.7 Testing**
  - [ ] ทดสอบทุก message action:
    - [ ] Reply message
    - [ ] Edit message
    - [ ] Delete message
    - [ ] Forward message
    - [ ] React to message
    - [ ] Copy message
    - [ ] Pin message
    - [ ] Click message
  - [ ] ทดสอบ message rendering:
    - [ ] Time format ถูกต้อง
    - [ ] Status icon แสดงถูกต้อง
    - [ ] Group chat vs. DM แสดงต่างกันถูกต้อง
  - [ ] ทดสอบ Performance:
    - [ ] Re-render ลดลง (ใช้ React DevTools Profiler)
    - [ ] Scroll ควร smooth ขึ้น 2-4%
  - [ ] ไม่มี console errors

---

### PHASE 5: Optimize Message Components
**ระยะเวลา:** 1-2 ชั่วโมง
**ผลลัพธ์:** ลด re-render ที่ไม่จำเป็น
**ความเสี่ยง:** ⭐ ต่ำ

#### 🎯 Objective
Optimize การ render ของ MessageItem และ sub-components ให้มีประสิทธิภาพสูงสุด

#### ✅ Checklist

- [ ] **5.1 ตรวจสอบ Memoization**
  - [ ] เปิด React DevTools Profiler
  - [ ] Record session ขณะ:
    - [ ] Scroll ดู messages
    - [ ] ส่ง message ใหม่
    - [ ] Load more messages
  - [ ] ดู components ที่ re-render บ่อยเกินความจำเป็น:
    - [ ] MessageItem
    - [ ] TextMessage
    - [ ] ImageMessage
    - [ ] MessageContextMenu

- [ ] **5.2 เพิ่ม React.memo กับ Message Components**
  - [ ] **TextMessage.tsx**:
    ```tsx
    export const TextMessage = memo(function TextMessage({ content }: { content: string }) {
      // ... component code
    }, (prevProps, nextProps) => {
      // Custom comparison
      return prevProps.content === nextProps.content;
    });
    ```
  - [ ] ทำเช่นเดียวกันกับ:
    - ImageMessage (compare `url`, `width`, `height`)
    - FileMessage (compare `fileId`, `fileName`, `fileSize`)
    - StickerMessage (compare `stickerId`)
    - ReplyMessage (compare `replyTo.id`)

- [ ] **5.3 Optimize MessageItem**
  - [ ] เปิดไฟล์ `/src/components/shared/MessageItem.tsx`
  - [ ] แน่ใจว่าใช้ `React.memo` อยู่แล้ว
  - [ ] เพิ่ม custom comparison:
    ```tsx
    export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
      // ... component
    }, (prevProps, nextProps) => {
      const prev = prevProps.message;
      const next = nextProps.message;

      return (
        prev.id === next.id &&
        prev.content === next.content &&
        prev.status === next.status &&
        prev.reactions === next.reactions &&
        prev.updatedAt === next.updatedAt
      );
    });
    ```

- [ ] **5.4 Optimize Image Loading**
  - [ ] เปิดไฟล์ `/src/components/shared/message/ImageMessage.tsx`
  - [ ] เพิ่ม lazy loading:
    ```tsx
    <img
      src={imageUrl}
      loading="lazy"
      decoding="async"
      onLoad={handleImageLoad}
      className="max-w-[240px] rounded-lg"
    />
    ```
  - [ ] เพิ่ม placeholder ขณะโหลด:
    ```tsx
    {!imageLoaded && (
      <div className="max-w-[240px] h-48 bg-gray-200 animate-pulse rounded-lg" />
    )}
    ```
  - [ ] พิจารณาใช้ `srcset` สำหรับ responsive images:
    ```tsx
    <img
      src={imageUrl}
      srcSet={`${thumbnailUrl} 240w, ${imageUrl} 480w`}
      sizes="(max-width: 768px) 240px, 480px"
    />
    ```

- [ ] **5.5 Optimize Context Selectors**
  - [ ] ถ้า context มี values เยอะ แต่ component ใช้แค่บางส่วน
  - [ ] สร้าง selector hooks:
    ```tsx
    // MessageRendererContext.tsx
    export function useFormatTime() {
      const context = useMessageRenderer();
      return context.formatTime;
    }

    export function useMessageStatus() {
      const context = useMessageRenderer();
      return context.getMessageStatus;
    }
    ```
  - [ ] ใช้ใน components:
    ```tsx
    // แทนที่จะ
    const { formatTime, getMessageStatus, ... } = useMessageRenderer();

    // ใช้แค่สิ่งที่จำเป็น
    const formatTime = useFormatTime();
    ```

- [ ] **5.6 ใช้ useCallback สำหรับ Event Handlers**
  - [ ] ตรวจสอบว่า handlers ใน MessageHandlersContext ใช้ `useCallback`:
    ```tsx
    // ใน ConversationPage หรือ MessageArea
    const handleReply = useCallback((message: Message) => {
      // ... logic
    }, [/* dependencies */]);

    const handleEdit = useCallback((message: Message) => {
      // ... logic
    }, [/* dependencies */]);
    ```

- [ ] **5.7 Testing**
  - [ ] ใช้ React DevTools Profiler วัดประสิทธิภาพ:
    - [ ] Before optimization
    - [ ] After optimization
    - [ ] Compare render times
  - [ ] ทดสอบ:
    - [ ] Scroll ดู 100+ messages (smooth ไหม)
    - [ ] ส่ง message ใหม่ (render เฉพาะ message ใหม่ไหม)
    - [ ] Edit message (render เฉพาะ message ที่ edit ไหม)
    - [ ] React to message (render เฉพาะ message ที่ react ไหม)
  - [ ] วัด performance metrics:
    - [ ] Time to Interactive (TTI)
    - [ ] First Contentful Paint (FCP)
    - [ ] Largest Contentful Paint (LCP)

---

### PHASE 6: Code Cleanup และ Documentation
**ระยะเวลา:** 1 ชั่วโมง
**ผลลัพธ์:** Code สะอาด มี docs ครบ
**ความเสี่ยง:** ⭐ ต่ำ

#### 🎯 Objective
ทำความสะอาดโค้ด ลบโค้ดที่ไม่ใช้ และเขียน documentation

#### ✅ Checklist

- [ ] **6.1 ลบโค้ดที่ไม่ได้ใช้**
  - [ ] ใช้ IDE หา unused imports:
    - VS Code: "Organize Imports" (Shift+Alt+O)
    - หรือ run ESLint: `npm run lint`
  - [ ] ลบ:
    - [ ] Unused imports
    - [ ] Unused variables
    - [ ] Commented code (ถ้าไม่จำเป็น)
    - [ ] Console.logs (debug statements)

- [ ] **6.2 ปรับ Code Style ให้สม่ำเสมอ**
  - [ ] Run Prettier: `npm run format`
  - [ ] ตรวจสอบ naming conventions:
    - Components: PascalCase
    - Functions/variables: camelCase
    - Constants: UPPER_SNAKE_CASE
    - Hooks: useXxx
  - [ ] ตรวจสอบ file structure:
    - 1 component per file
    - Export ชื่อตรงกับชื่อไฟล์
    - Index files เฉพาะที่จำเป็น

- [ ] **6.3 เขียน TypeScript Types ให้ครบ**
  - [ ] ตรวจสอบว่าทุก component มี proper types:
    ```tsx
    interface MessageItemProps {
      message: Message;
    }

    export const MessageItem = memo(function MessageItem({ message }: MessageItemProps) {
      // ...
    });
    ```
  - [ ] ตรวจสอบ Context types ครบถ้วน
  - [ ] ไม่ใช้ `any` type (ถ้าจำเป็นจริงๆ ให้ comment ว่าทำไม)
  - [ ] Run TypeScript check: `npm run type-check` (ถ้ามี)

- [ ] **6.4 เพิ่ม JSDoc Comments**
  - [ ] เขียน JSDoc สำหรับ:
    - Public components
    - Context providers
    - Custom hooks
    - Utility functions
  - [ ] ตัวอย่าง:
    ```tsx
    /**
     * Renders a virtualized list of chat messages with dynamic height support.
     *
     * @param messages - Array of messages to display
     * @param useVirtual - Enable virtualization (default: true)
     * @returns Virtualized message list component
     *
     * @example
     * ```tsx
     * <VirtualMessageList
     *   messages={chatMessages}
     *   useVirtual={true}
     * />
     * ```
     */
    export function VirtualMessageList({ ... }) { ... }
    ```

- [ ] **6.5 สร้าง README สำหรับ Chat System**
  - [ ] สร้างไฟล์: `/src/components/shared/chat/README.md`
  - [ ] เขียนเนื้อหา:
    ```markdown
    # Chat System Documentation

    ## Architecture Overview
    [Diagram หรือ description ของ component hierarchy]

    ## Key Components
    - **VirtualMessageList**: Main virtualized list component
    - **MessageItem**: Individual message renderer
    - **MessageContextMenu**: Right-click menu for messages
    - **Message Types**: TextMessage, ImageMessage, FileMessage, etc.

    ## Context Providers
    - **MessageRendererContext**: Provides formatters and config
    - **MessageHandlersContext**: Provides event handlers

    ## Usage
    [Code examples]

    ## Performance Considerations
    - Uses Virtua for efficient virtualization
    - Memoized components to prevent unnecessary re-renders
    - Context API to avoid props drilling
    - Lazy loading for images

    ## Testing
    [How to test the chat system]
    ```

- [ ] **6.6 อัพเดท CHANGELOG**
  - [ ] สร้างหรือแก้ไข `/CHANGELOG.md`:
    ```markdown
    ## [Unreleased] - Chat System Refactoring

    ### Added
    - MessageRendererContext for shared formatters
    - MessageHandlersContext for event handlers
    - Responsive chat layout (merged mobile/desktop views)

    ### Changed
    - Replaced SimpleMessageList with VirtualMessageList
    - Reduced component wrapper layers from 10 to 6-7
    - Reduced props drilling from 18+ to 3 props

    ### Removed
    - useMessageScroll hook (redundant with Virtua)
    - MobileConversationView.tsx (merged into ConversationPage)
    - DesktopConversationView.tsx (merged into ConversationPage)
    - SimpleMessageList.tsx (consolidated into VirtualMessageList)

    ### Performance
    - 15-20% faster initial render
    - 5-10% smoother scrolling
    - 60% reduction in props drilling
    - 690 lines of code removed
    ```

- [ ] **6.7 Testing และ Validation**
  - [ ] Run all tests: `npm test` (ถ้ามี)
  - [ ] Run linter: `npm run lint`
  - [ ] Run type check: `npm run type-check`
  - [ ] Build production: `npm run build`
  - [ ] ไม่มี errors/warnings

---

## 📈 Performance Benchmarks

### วิธีการวัดประสิทธิภาพ (How to Measure)

#### ก่อนเริ่ม Refactor - Baseline Measurement

- [ ] **Setup Performance Monitoring**
  ```tsx
  // Add to main App.tsx or ConversationPage
  useEffect(() => {
    // Measure render time
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`Render time: ${end - start}ms`);
    };
  });
  ```

- [ ] **Benchmarks ที่ต้องวัด**
  - [ ] Initial page load (Time to Interactive)
  - [ ] Scroll 100 messages (FPS)
  - [ ] Send new message (render time)
  - [ ] Load more messages (prepend time)
  - [ ] React DevTools Profiler (component render counts)

- [ ] **บันทึกผลลัพธ์ Baseline**
  ```markdown
  ## Baseline Performance (Before Refactoring)
  - Initial page load: XXX ms
  - Scroll 100 messages: XX FPS
  - Send new message: XX ms
  - Load more messages: XX ms
  - MessageItem renders: XX times per scroll
  - Wrapper layers: 10
  - Props count: 18+
  ```

#### หลัง Refactor แต่ละ Phase - Progress Measurement

- [ ] **After Phase 1** (Remove Scroll Redundancy)
  - [ ] วัด scroll performance
  - [ ] Expected: +5-10% scroll smoothness

- [ ] **After Phase 2** (Merge Mobile/Desktop)
  - [ ] วัด initial render time
  - [ ] Expected: +5-8% faster

- [ ] **After Phase 3** (Remove SimpleMessageList)
  - [ ] วัด code size และ render time
  - [ ] Expected: +2-3% faster

- [ ] **After Phase 4** (Context API)
  - [ ] วัด re-render count ด้วย React DevTools
  - [ ] Expected: +2-4% faster, 60% less props

- [ ] **After Phase 5** (Optimize Components)
  - [ ] วัดทุก metrics
  - [ ] Expected: Overall +15-20% improvement

- [ ] **Final Benchmark Report**
  ```markdown
  ## Final Performance (After Refactoring)
  - Initial page load: XXX ms (↓ 15-20%)
  - Scroll 100 messages: XX FPS (↑ 5-10%)
  - Send new message: XX ms (↓ 10%)
  - Load more messages: XX ms (stable)
  - MessageItem renders: XX times (↓ 60%)
  - Wrapper layers: 6-7 (↓ 40%)
  - Props count: 3 (↓ 83%)
  - Code removed: 690 lines
  ```

---

## 🔧 Tools และ Commands

### Development Commands
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format

# Build for production
npm run build

# Run tests (if available)
npm test
```

### Git Workflow
```bash
# Before starting
git checkout -b refactor/chat-system-optimization
git commit -m "chore: baseline commit before refactor"

# After each phase
git add .
git commit -m "refactor(chat): phase 1 - remove scroll redundancy"
git commit -m "refactor(chat): phase 2 - merge mobile/desktop views"
git commit -m "refactor(chat): phase 3 - consolidate message lists"
git commit -m "refactor(chat): phase 4 - introduce context api"
git commit -m "refactor(chat): phase 5 - optimize components"
git commit -m "docs(chat): phase 6 - cleanup and documentation"

# Final
git push origin refactor/chat-system-optimization
```

### Performance Profiling Tools
- **React DevTools Profiler**: Measure component render times
- **Chrome DevTools Performance Tab**: Measure page load and FPS
- **Lighthouse**: Measure overall performance score
- **Bundle Analyzer**: Check bundle size changes
  ```bash
  npm run build
  npx vite-bundle-visualizer
  ```

---

## ⚠️ Risks และ Mitigation

### Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Breaking existing functionality | Medium | High | Thorough testing after each phase |
| Performance regression | Low | High | Benchmark before/after each phase |
| Merge conflicts (if team is large) | Medium | Medium | Small PRs, frequent communication |
| User experience disruption | Low | High | Feature flags, gradual rollout |
| Context re-render issues | Low | Medium | Proper memoization, split contexts |

### Mitigation Strategies

- [ ] **Create Feature Branch**
  - Work on `refactor/chat-system-optimization` branch
  - Don't merge to main until fully tested

- [ ] **Backup Strategy**
  - Git commit before each phase
  - Tag baseline: `git tag baseline-before-refactor`
  - Easy rollback: `git revert` or `git reset`

- [ ] **Incremental Rollout**
  - Deploy to staging first
  - Test with real users (beta testers)
  - Monitor error tracking (Sentry, LogRocket)
  - Gradual rollout (10% → 50% → 100%)

- [ ] **Testing Checklist**
  - [ ] Unit tests pass
  - [ ] Integration tests pass
  - [ ] E2E tests pass
  - [ ] Manual QA testing
  - [ ] Performance benchmarks meet targets

---

## 📞 Support และ Questions

### ถ้าเจอปัญหา (Troubleshooting)

#### Context Error: "must be used within Provider"
```
Solution: ตรวจสอบว่า component ที่เรียกใช้ context อยู่ภายใต้ Provider หรือไม่
```

#### Virtualization ไม่ทำงาน
```
Solution:
1. ตรวจสอบ Virtua ref setup
2. ตรวจสอบ parent container มี height fixed หรือไม่
3. ตรวจสอบ CSS conflicts
```

#### Props type errors หลัง refactor
```
Solution:
1. Run type-check: npm run type-check
2. อัพเดท interface definitions
3. ใช้ TypeScript strict mode
```

#### Performance regression
```
Solution:
1. ใช้ React DevTools Profiler หา components ที่ render บ่อย
2. ตรวจสอบ memoization
3. ตรวจสอบ dependencies ใน useCallback/useMemo
```

---

## 🎯 Success Criteria

### Phase Completion Checklist

เมื่อจบแต่ละ Phase ต้องผ่านเกณฑ์:

- [ ] **Code Quality**
  - [ ] No TypeScript errors
  - [ ] No ESLint warnings
  - [ ] Code formatted (Prettier)
  - [ ] All imports organized

- [ ] **Functionality**
  - [ ] All features work as before
  - [ ] No regressions
  - [ ] Edge cases handled
  - [ ] Error handling proper

- [ ] **Performance**
  - [ ] Meets or exceeds performance targets
  - [ ] No console errors/warnings
  - [ ] Smooth scrolling
  - [ ] Fast interactions

- [ ] **Testing**
  - [ ] Manual testing complete
  - [ ] Automated tests pass
  - [ ] Cross-browser tested
  - [ ] Mobile/desktop tested

### Final Success Criteria

เมื่อ Refactor ทั้งหมดเสร็จ:

- [ ] **Performance Goals Achieved**
  - [ ] 15-20% faster initial render ✅
  - [ ] 5-10% smoother scrolling ✅
  - [ ] Reduced wrapper layers by 40% ✅
  - [ ] Reduced props drilling by 80% ✅

- [ ] **Code Quality Goals**
  - [ ] 690 lines removed ✅
  - [ ] No code duplication ✅
  - [ ] Clean architecture ✅
  - [ ] Well documented ✅

- [ ] **User Experience**
  - [ ] No UX regressions ✅
  - [ ] Faster perceived performance ✅
  - [ ] Responsive on all devices ✅
  - [ ] Smooth interactions ✅

---

## 📅 Timeline Summary

| Phase | Duration | Priority | Difficulty |
|-------|----------|----------|------------|
| Phase 1: Remove Scroll Redundancy | 30min-1hr | High | Easy |
| Phase 2: Merge Mobile/Desktop | 1-2 hrs | High | Medium |
| Phase 3: Consolidate Message Lists | 1-2 hrs | Medium | Easy |
| Phase 4: Context API | 2-3 hrs | High | Medium |
| Phase 5: Optimize Components | 1-2 hrs | Medium | Easy |
| Phase 6: Cleanup & Docs | 1 hr | Low | Easy |
| **TOTAL** | **6-11 hrs** | - | - |

### แนะนำลำดับการทำ:
1. **Week 1, Day 1**: Phase 1 + Phase 2 (Quick wins)
2. **Week 1, Day 2**: Phase 3 + Phase 4 (Core refactoring)
3. **Week 1, Day 3**: Phase 5 + Phase 6 + Testing (Polish and ship)

---

## 🚀 Next Steps

### เริ่มต้น Refactor

1. **Review แผนนี้กับทีม**
   - อ่านและทำความเข้าใจทั้งหมด
   - ถามคำถามที่ไม่เข้าใจ
   - ตกลงใจว่าจะทำหรือไม่

2. **Setup Environment**
   ```bash
   git checkout -b refactor/chat-system-optimization
   npm install
   npm run dev
   ```

3. **วัด Baseline Performance**
   - ทำตาม "Performance Benchmarks" section
   - บันทึกผลลัพธ์

4. **เริ่ม Phase 1**
   - ทำตาม checklist ทีละข้อ
   - Test ทุกอย่างก่อนไป phase ถัดไป
   - Git commit หลังแต่ละ phase

5. **Monitor Progress**
   - วัด performance หลังแต่ละ phase
   - Document ปัญหาที่เจอและวิธีแก้
   - Update แผนนี้ถ้าจำเป็น

---

**Good luck! 🎉**

คุณสามารถเริ่มต้นได้เลยจาก **Phase 1** เพราะเป็น quick win ที่ให้ผลลัพธ์เห็นได้ชัดเจน (5-10% scroll improvement) ภายใน 30 นาที - 1 ชั่วโมง!
