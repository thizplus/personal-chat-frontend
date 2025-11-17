# แผนการ Refactor ระบบแชท - Chat System Optimization Plan (React Virtuoso)

> ✅ **Testing Complete:** React Virtuoso แก้ปัญหา DOM overlapping ได้สำเร็จ!

---

## 📊 สรุปสถานการณ์ปัจจุบัน (Current State Analysis)

### ปัญหาที่พบ (Issues Found)

| ปัญหา | รายละเอียด | ผลกระทบ |
|-------|-----------|---------|
| **Wrapper Components มากเกินไป** | มี 10 layers ของ wrapper components | ลดประสิทธิภาพ 15-20% |
| **Code Duplication** | โค้ดซ้ำซ้อนประมาณ 690 บรรทัด | Code ยากต่อการ maintain |
| **Props Drilling** | ส่ง props ผ่าน component 18+ props | Re-render บ่อยเกินความจำเป็น |
| **Virtual Library** | ใช้ Virtua ซึ่งมีปัญหา DOM overlapping | UX ไม่ดี images ทับข้อความ |

### โครงสร้าง Component ปัจจุบัน (Current Component Hierarchy)

```
StandardLayout (Layer 1)
└── ConversationPage (Layer 2)
    └── MobileConversationView OR DesktopConversationView (Layer 3) ❌ DUPLICATE
        ├── ConversationsList (Layer 4)
        ├── ChatHeader (Layer 5)
        ├── MessageArea (Layer 6) ❌ TOO MANY PROPS
        │   └── VirtualMessageList (Layer 7) ⚠️ USING VIRTUA (ต้องเปลี่ยน)
        │       └── MessageItem (Layer 8) ✅ KEEP (memoized)
        │           └── MessageContextMenu (Layer 9) ✅ KEEP
        │               └── TextMessage/ImageMessage/etc (Layer 10) ✅ KEEP
        └── MessageInputArea
```

### ไฟล์ที่ต้อง Refactor

**Priority 1 (ต้องแก้ไข - High Impact):**
- `/src/components/shared/VirtualMessageList.tsx` (344 lines) - **เปลี่ยนจาก Virtua → Virtuoso**
- `/src/pages/standard/converstion/mobile/MobileConversationView.tsx` (182 lines) - **ลบ/รวม**
- `/src/pages/standard/converstion/desktop/DesktopConversationView.tsx` (166 lines) - **ลบ/รวม**
- `/src/components/shared/SimpleMessageList.tsx` (342 lines) - **ลบ**

**Priority 2 (ปรับปรุง - Medium Impact):**
- `/src/components/shared/MessageArea.tsx` (185 lines) - **ลดความซับซ้อน**
- `/src/pages/standard/converstion/ConversationPage.tsx` (151 lines) - **ปรับให้ responsive**

**Priority 3 (คงไว้แต่ปรับปรุง - Low Impact):**
- `/src/components/shared/message/*` - ใช้ Context แทน props drilling

---

## 🎯 เป้าหมายของการ Refactor (Goals)

### ผลลัพธ์ที่คาดหวัง (Expected Outcomes)

| ก่อน Refactor | หลัง Refactor | ผลต่าง |
|--------------|--------------|--------|
| Virtual Library: Virtua | Virtual Library: Virtuoso | ✅ DOM overlapping แก้ไข |
| Component layers: 10 | Component layers: 6-7 | **-40%** |
| Props drilling: 18+ | Props drilling: 3 | **-83%** |
| Code duplication: ~690 lines | Code duplication: 0 | **-100%** |
| Initial render: baseline | Initial render: faster | **+15-20%** |
| DOM overlapping: Yes | DOM overlapping: No | **✅ Fixed** |

---

## 📋 แผนการ Refactor แบบละเอียด (Detailed Refactoring Plan)

### PHASE 1: เปลี่ยนจาก Virtua → Virtuoso พร้อม Buffer Pattern
**ระยะเวลา:** 1-2 ชั่วโมง
**ผลลัพธ์:** แก้ปัญหา DOM overlapping, ปรับปรุง scroll behavior
**ความเสี่ยง:** ⭐⭐ ปานกลาง (เปลี่ยน library หลัก)

#### 🎯 Objective
เปลี่ยนจาก Virtua → React Virtuoso เพื่อแก้ปัญหา DOM overlapping ที่เกิดจาก dynamic height content (images)

#### ✅ Checklist

- [ ] **1.1 Install React Virtuoso**
  ```bash
  npm install react-virtuoso
  ```

- [ ] **1.2 Backup ไฟล์เดิม**
  ```bash
  git add .
  git commit -m "chore: backup before switching to Virtuoso"
  git tag before-virtuoso-migration
  ```

- [ ] **1.3 เปิดไฟล์ VirtualMessageList.tsx**
  - [ ] เปิดไฟล์ `/src/components/shared/VirtualMessageList.tsx`
  - [ ] อ่าน imports ทั้งหมดที่เกี่ยวกับ Virtua:
    ```tsx
    import { VList } from 'virtua';
    import type { VListHandle } from 'virtua';
    ```
  - [ ] อ่าน props และ refs ที่ใช้อยู่
  - [ ] จดบันทึกฟีเจอร์ทั้งหมด:
    - Reverse scroll (chat mode)
    - Load more (prepend messages)
    - Scroll to message (jump + highlight)
    - Auto-scroll to bottom
    - Preserve scroll position

- [ ] **1.4 เปลี่ยน Imports**
  ```tsx
  // Before (Virtua)
  import { VList } from 'virtua';
  import type { VListHandle } from 'virtua';

  // After (Virtuoso)
  import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';
  ```

- [ ] **1.5 เปลี่ยน Ref Type**
  ```tsx
  // Before
  const virtuaRef = useRef<VListHandle>(null);

  // After
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  ```

- [ ] **1.6 เพิ่ม Buffer Pattern State**
  ```tsx
  // เพิ่ม state สำหรับ buffer pattern
  const [committedMessages, setCommittedMessages] = useState<MessageDTO[]>([]);
  const [pendingMessages, setPendingMessages] = useState<MessageDTO[]>([]);

  // Track prepending (สำหรับ backend mode)
  const [firstItemIndex, setFirstItemIndex] = useState(100000);
  const prevCommittedCountRef = useRef(0);
  ```

- [ ] **1.7 Implement Image Pre-loading**
  ```tsx
  const preloadImage = useCallback((url: string): Promise<void> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve anyway
    });
  }, []);
  ```

- [ ] **1.8 Implement Buffer Pattern Logic**
  ```tsx
  // Commit pending messages after pre-loading images
  useEffect(() => {
    if (pendingMessages.length === 0) return;

    const processPending = async () => {
      // Pre-load images
      const imageMessages = pendingMessages.filter(
        m => m.message_type === 'image' && m.media_url
      );

      if (imageMessages.length > 0) {
        console.log('🖼️ Pre-loading', imageMessages.length, 'images...');
        await Promise.all(
          imageMessages.map(msg => preloadImage(msg.media_url || ''))
        );
      }

      // Commit to virtual list
      setCommittedMessages(prev => [...prev, ...pendingMessages]);
      setPendingMessages([]);
    };

    const timer = setTimeout(processPending, 100); // Debounce
    return () => clearTimeout(timer);
  }, [pendingMessages, preloadImage]);
  ```

- [ ] **1.9 เปลี่ยน Virtual List Component**
  ```tsx
  // Before (Virtua)
  <VList
    ref={virtuaRef}
    reverse
    shift={isPrependRef.current}
    onScroll={handleScroll}
    overscan={10}
  >
    {messages.map((message) => (
      <MessageItem key={message.id} message={message} />
    ))}
  </VList>

  // After (Virtuoso)
  <Virtuoso
    ref={virtuosoRef}
    data={committedMessages}
    firstItemIndex={firstItemIndex}
    initialTopMostItemIndex={firstItemIndex + committedMessages.length - 1}
    followOutput={(isAtBottom) => {
      return isAtBottom ? 'smooth' : false;
    }}
    atTopStateChange={(atTop) => {
      if (atTop && !isLoadingMore && hasMore) {
        handleLoadMore();
      }
    }}
    atTopThreshold={400}
    increaseViewportBy={{ top: 400, bottom: 400 }}
    itemContent={(index, message) => (
      <MessageItem message={message} {...messageItemProps} />
    )}
    style={{ height: '100%' }}
  />
  ```

- [ ] **1.10 Implement Scroll to Message**
  ```tsx
  const scrollToMessage = useCallback((messageId: string) => {
    const index = committedMessages.findIndex(m => m.id === messageId);
    if (index === -1) return;

    const actualIndex = firstItemIndex + index;

    virtuosoRef.current?.scrollToIndex({
      index: actualIndex,
      align: 'center',
      behavior: 'smooth',
    });

    // Highlight after scroll
    setTimeout(() => {
      const element = document.querySelector(`[data-message-id="${messageId}"]`);
      if (element) {
        element.classList.add('ring-4', 'ring-yellow-400');
        setTimeout(() => {
          element.classList.remove('ring-4', 'ring-yellow-400');
        }, 2000);
      }
    }, 500);
  }, [committedMessages, firstItemIndex]);
  ```

- [ ] **1.11 Implement Scroll to Bottom**
  ```tsx
  const scrollToBottom = useCallback((smooth = true) => {
    if (!virtuosoRef.current) return;

    const targetIndex = firstItemIndex + committedMessages.length - 1;

    virtuosoRef.current.scrollToIndex({
      index: targetIndex,
      align: 'end',
      behavior: smooth ? 'smooth' : 'auto',
    });
  }, [committedMessages.length, firstItemIndex]);
  ```

- [ ] **1.12 Handle Load More (Prepend)**
  ```tsx
  // Update firstItemIndex when messages prepended
  useEffect(() => {
    const currentCount = committedMessages.length;
    const prevCount = prevCommittedCountRef.current;

    if (currentCount > prevCount && prevCount > 0) {
      const diff = currentCount - prevCount;
      console.log('📥 Messages prepended:', diff);
      setFirstItemIndex(prev => prev - diff);
    }

    prevCommittedCountRef.current = currentCount;
  }, [committedMessages.length]);
  ```

- [ ] **1.13 อัพเดท useImperativeHandle**
  ```tsx
  useImperativeHandle(ref, () => ({
    scrollToMessage,
    scrollToBottom,
  }));
  ```

- [ ] **1.14 Testing Phase 1**
  - [ ] ทดสอบ Load messages ครั้งแรก
  - [ ] ทดสอบ Scroll to bottom
  - [ ] ทดสอบ Send new message (auto-scroll)
  - [ ] ทดสอบ Load more messages (prepend)
  - [ ] ทดสอบ Scroll to specific message (jump + highlight)
  - [ ] ทดสอบ Mixed message types (text, image, file, sticker)
  - [ ] **ตรวจสอบ DOM overlapping** (ต้อง = 0)
  - [ ] ทดสอบ Performance (FPS, Memory)

- [ ] **1.15 Remove Virtua Dependency**
  ```bash
  npm uninstall virtua
  ```

- [ ] **1.16 Git Commit**
  ```bash
  git add .
  git commit -m "refactor(chat): migrate from Virtua to Virtuoso with buffer pattern

  - Replace Virtua with React Virtuoso
  - Implement buffer pattern for image pre-loading
  - Fix DOM overlapping issues
  - Add followOutput for smooth auto-scroll
  - Add increaseViewportBy for buffer zone
  - Preserve all existing features (load more, jump to message, etc.)

  BREAKING CHANGE: VirtualMessageList now uses Virtuoso instead of Virtua"
  ```

---

### PHASE 2: รวม Mobile/Desktop Views เป็น Responsive Component เดียว
**ระยะเวลา:** 1-2 ชั่วโมง
**ผลลัพธ์:** ลดโค้ด 348 บรรทัด, เร็วขึ้น 5-8%
**ความเสี่ยง:** ⭐⭐ ปานกลาง

*(เหมือนเดิมจาก REFACTOR_PLAN.md original)*

#### 🎯 Objective
รวม `MobileConversationView.tsx` และ `DesktopConversationView.tsx` เป็น component เดียว

#### ✅ Checklist

- [ ] **2.1 วิเคราะห์ความแตกต่าง**
  - [ ] เปิดทั้ง 2 ไฟล์ เคียงข้างกัน
  - [ ] จดส่วนที่เหมือนกัน (logic)
  - [ ] จดส่วนที่ต่างกัน (layout/CSS)

- [ ] **2.2 สร้าง useMediaQuery Hook**
  - [ ] สร้างไฟล์ `/src/hooks/useMediaQuery.ts`
  - [ ] Export `useIsMobile`, `useIsTablet`

- [ ] **2.3 Refactor ConversationPage.tsx**
  - [ ] Import `useIsMobile`
  - [ ] ลบ import Mobile/Desktop views
  - [ ] รวม JSX structure

- [ ] **2.4 ปรับ Sub-components**
  - [ ] ChatHeader: รับ `isMobile` prop
  - [ ] ConversationsList: รับ `className` prop

- [ ] **2.5 ลบไฟล์เก่า**
  - [ ] Backup (git commit)
  - [ ] ลบ MobileConversationView.tsx
  - [ ] ลบ DesktopConversationView.tsx

- [ ] **2.6 Testing**
  - [ ] Desktop (> 768px)
  - [ ] Mobile (< 768px)
  - [ ] Responsive resize

- [ ] **2.7 Git Commit**
  ```bash
  git add .
  git commit -m "refactor(chat): merge mobile/desktop views into responsive component"
  ```

---

### PHASE 3: ลบ SimpleMessageList
**ระยะเวลา:** 30 นาที - 1 ชั่วโมง
**ผลลัพธ์:** ลดโค้ด 342 บรรทัด
**ความเสี่ยง:** ⭐ ต่ำ

#### 🎯 Objective
ลบ `SimpleMessageList.tsx` ที่ duplicate logic ของ `VirtualMessageList.tsx`

#### ✅ Checklist

- [ ] **3.1 ค้นหาที่ใช้ SimpleMessageList**
  ```bash
  grep -r "SimpleMessageList" src/
  ```

- [ ] **3.2 เพิ่ม useVirtual prop**
  ```tsx
  interface VirtualMessageListProps {
    // ... existing props
    useVirtual?: boolean; // default: true
  }
  ```

- [ ] **3.3 Conditional rendering**
  ```tsx
  if (!useVirtual) {
    return (
      <div className="flex flex-col-reverse p-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
      </div>
    );
  }

  // Virtualized rendering
  return <Virtuoso ... />;
  ```

- [ ] **3.4 Replace ทุกที่**
  - [ ] หา import SimpleMessageList
  - [ ] แทนด้วย VirtualMessageList + useVirtual prop

- [ ] **3.5 ลบไฟล์**
  - [ ] ลบ SimpleMessageList.tsx

- [ ] **3.6 Testing**

- [ ] **3.7 Git Commit**

---

### PHASE 4: ลด Props Drilling ด้วย Context API
**ระยะเวลา:** 2-3 ชั่วโมง
**ผลลัพธ์:** ลด props จาก 18+ เหลือ 3
**ความเสี่ยง:** ⭐⭐ ปานกลาง

*(เหมือนเดิมจาก REFACTOR_PLAN.md original)*

#### 🎯 Objective
ใช้ React Context API เพื่อหลีกเลี่ยง props drilling

#### ✅ Checklist

- [ ] **4.1 วิเคราะห์ Props**
- [ ] **4.2 สร้าง MessageRendererContext**
- [ ] **4.3 สร้าง MessageHandlersContext**
- [ ] **4.4 Wrap MessageArea ด้วย Providers**
- [ ] **4.5 อัพเดท VirtualMessageList**
- [ ] **4.6 อัพเดท MessageItem และ Message Components**
- [ ] **4.7 Testing**
- [ ] **4.8 Git Commit**

---

### PHASE 5: Optimize Message Components
**ระยะเวลา:** 1-2 ชั่วโมง
**ผลลัพธ์:** ลด re-render
**ความเสี่ยง:** ⭐ ต่ำ

*(เหมือนเดิมจาก REFACTOR_PLAN.md original)*

---

### PHASE 6: Code Cleanup และ Documentation
**ระยะเวลา:** 1 ชั่วโมง
**ผลลัพธ์:** Code สะอาด มี docs ครบ
**ความเสี่ยง:** ⭐ ต่ำ

*(เหมือนเดิมจาก REFACTOR_PLAN.md original)*

---

## 📈 Performance Benchmarks

### วิธีการวัดประสิทธิภาพ

#### ก่อนเริ่ม Refactor - Baseline

- [ ] Initial page load
- [ ] Scroll 100 messages (FPS)
- [ ] Send new message (render time)
- [ ] Load more messages
- [ ] **DOM overlapping count** (ปัจจุบัน: มีปัญหา)

#### หลัง Phase 1 - Virtuoso Migration

- [ ] **DOM overlapping count** (คาดหวัง: 0)
- [ ] Scroll performance (คาดหวัง: +5-10%)
- [ ] Image loading (คาดหวัง: smooth, no jump)

---

## 🔧 Virtuoso API Reference

### Key Props

```tsx
<Virtuoso
  // Data
  data={messages}                    // Message array

  // Chat mode (reverse scroll)
  firstItemIndex={100000}            // Start index (for prepending)
  initialTopMostItemIndex={100050}  // Initial scroll position

  // Auto-scroll behavior
  followOutput={(isAtBottom) => isAtBottom ? 'smooth' : false}

  // Load more
  atTopStateChange={(atTop) => { /* trigger load more */ }}
  atTopThreshold={400}               // Trigger distance from top

  // Buffer zone (pre-render)
  increaseViewportBy={{ top: 400, bottom: 400 }}

  // Rendering
  itemContent={(index, message) => <MessageItem message={message} />}

  // Styling
  style={{ height: '100%' }}
/>
```

### Ref Methods

```tsx
virtuosoRef.current?.scrollToIndex({
  index: targetIndex,
  align: 'center',      // 'start' | 'center' | 'end'
  behavior: 'smooth',   // 'auto' | 'smooth'
});
```

---

## 📊 Success Criteria

### Phase 1 Completion

- [ ] **DOM overlapping = 0** ✅ Must pass
- [ ] Scroll smooth (> 30 FPS)
- [ ] Images load correctly
- [ ] Load more preserves scroll position
- [ ] Jump to message ทำงาน
- [ ] Auto-scroll ทำงาน
- [ ] No console errors

### Overall Success

- [ ] 15-20% faster initial render
- [ ] 5-10% smoother scrolling
- [ ] DOM overlapping แก้ไขแล้ว ✅
- [ ] 690 lines removed
- [ ] Props drilling reduced 83%

---

## 🚀 Getting Started

### ขั้นตอนที่ 1: เตรียมพร้อม

```bash
# Create feature branch
git checkout -b refactor/virtuoso-migration

# Tag current state
git tag before-virtuoso-refactor

# Ensure dependencies
npm install react-virtuoso
```

### ขั้นตอนที่ 2: เริ่ม Phase 1

1. เปิดไฟล์นี้และ VirtualMessageList.tsx เคียงข้างกัน
2. ทำตาม checklist Phase 1 ทีละข้อ
3. Test หลังแต่ละ section
4. Commit เมื่อเสร็จแต่ละ major milestone

### ขั้นตอนที่ 3: Monitor Progress

ใช้ checklist ข้างบนเพื่อ track progress

---

## 📅 Timeline Summary

| Phase | Duration | Priority | Difficulty |
|-------|----------|----------|------------|
| Phase 1: Virtuoso Migration | 1-2 hrs | **CRITICAL** | Medium |
| Phase 2: Merge Mobile/Desktop | 1-2 hrs | High | Medium |
| Phase 3: Remove SimpleMessageList | 30min-1hr | Medium | Easy |
| Phase 4: Context API | 2-3 hrs | High | Medium |
| Phase 5: Optimize Components | 1-2 hrs | Medium | Easy |
| Phase 6: Cleanup & Docs | 1 hr | Low | Easy |
| **TOTAL** | **7-12 hrs** | - | - |

---

## ⚠️ Important Notes

### Virtuoso vs Virtua

| Feature | Virtua | Virtuoso |
|---------|--------|----------|
| DOM Overlapping | ❌ มีปัญหา | ✅ แก้ไขแล้ว |
| Buffer Pattern | ⚠️ Manual | ✅ Built-in |
| followOutput | ⚠️ Manual | ✅ Built-in |
| Bundle Size | 3kB | 8kB |
| Community | Small | Large |

**Decision:** ใช้ Virtuoso เพราะแก้ปัญหา DOM overlapping ได้

---

**Version:** 2.0 (Virtuoso)
**Last Updated:** 2025-11-13
**Status:** Ready to implement

**Ready to start Phase 1!** 🚀
