# รายงานวิเคราะห์ระบบส่งข้อความและปัญหา Message Duplication

## บทสรุปผู้บริหาร (Executive Summary)

ระบบส่งข้อความใน chat application นี้ใช้ architecture แบบ **Optimistic UI Update** ซึ่งจะสร้าง temp message แสดงทันทีที่ user กดส่ง และเมื่อ backend ตอบกลับก็จะ replace temp message ด้วย real message

**ปัญหาที่พบ**: ข้อความแสดง 2 รายการ (duplicate) เนื่องจากมีจุดที่ทำให้ temp message ไม่ถูก replace โดยข้อความทั้งสองอาจมี ID ต่างกัน (temp_id vs real id)

---

## 1. Message Flow Analysis - ภาพรวมการทำงานทั้งระบบ

### Flow Diagram

```
[User กด Send]
       ↓
[1] useMessage.sendTextMessage() - สร้าง temp message
       ↓
[2] addNewMessage(tempMessage) → conversationStore.addNewMessage()
       ↓ (เพิ่มเข้า conversationMessages)
       ↓
[3] messageStore.sendTextMessage() → API call
       ↓
[4] Backend ตอบกลับ real message (มี real ID + temp_id ใน metadata)
       ↓
[5] WebSocket event: message:message.receive
       ↓
[6] useConversation.ts handler
       ↓ (ตรวจสอบ tempId vs real id)
       ↓
[7] addNewMessage(realMessage with temp_id) → conversationStore
       ↓ (ควร replace temp message)
       ↓
[8] VirtualMessageList render
       ↓ (deduplication logic)
       ↓
[UI Display]
```

---

## 2. จุดที่เกิด Duplication - Root Cause Analysis

### สาเหตุหลัก: **Logic ของ conversationStore.addNewMessage มีปัญหา**

จากไฟล์ `conversationStore.ts` (บรรทัด 454-571):

```typescript
addNewMessage: (message: MessageDTO, currentUserId: string) => {
  set((state) => {
    const conversationId = message.conversation_id;
    const currentMessages = state.conversationMessages[conversationId] || [];

    // ตรวจสอบว่า message นี้เป็น real message ที่มี temp_id
    const isRealMessage = message.id && message.temp_id && message.id !== message.temp_id;

    // ตรวจสอบว่ามีข้อความนี้อยู่แล้วหรือไม่
    const existingIndex = currentMessages.findIndex(msg =>
      msg.id === message.id || (message.temp_id && msg.temp_id === message.temp_id)
    );

    // ✅ ถ้าเป็น real message และเจอ temp message → Replace
    if (isRealMessage && existingIndex !== -1) {
      const existingMsg = currentMessages[existingIndex];
      if (existingMsg.id === existingMsg.temp_id) {
        // This is a temp message, replace it
        console.log(`🔄 Replacing temp message ${existingMsg.temp_id} with real message ${message.id}`);

        const updatedMessages = [...currentMessages];
        updatedMessages[existingIndex] = message;

        return {
          conversations: updatedConversations,
          conversationMessages: {
            ...state.conversationMessages,
            [conversationId]: updatedMessages
          }
        };
      }
    }

    // ✅ ถ้ามี message นี้อยู่แล้ว (same ID) → Skip
    if (existingIndex !== -1) {
      console.log(`⚠️ Message ${message.id || message.temp_id} already exists, skipping`);
      return state;
    }

    // ❌ PROBLEM: ถ้าไม่ match เงื่อนไขข้างบน จะ append เป็น message ใหม่
    return {
      conversations: sortedConversations,
      conversationMessages: {
        ...state.conversationMessages,
        [conversationId]: [...currentMessages, message]
      }
    };
  });
}
```

### ปัญหาที่พบ - 3 Scenarios ที่ทำให้เกิด Duplicate

#### **Scenario 1: Race Condition - Real message มาก่อน temp message ถูกเพิ่มเข้า store**

**Flow:**
1. User กด send → สร้าง temp message (id: "temp-123", temp_id: "temp-123")
2. API call ส่งออกไป
3. **Backend ตอบกลับเร็วมาก** (real message มาถึงก่อน)
4. WebSocket event: message.receive (id: "real-456", temp_id: "temp-123")
5. **addNewMessage(realMessage)** - ไม่เจอ temp message ในstore เพราะยังไม่ถูกเพิ่ม → **Append real message**
6. จากนั้น temp message ถูกเพิ่มเข้า store → **มี 2 รายการ**

**หลักฐานจาก code:**
- `useMessage.ts` บรรทัด 145-146: `addNewMessage(tempMessage)` เรียกก่อน `storeSendTextMessage()`
- แต่ถ้า WebSocket ตอบกลับเร็ว อาจมาก่อน temp message ถูก commit

#### **Scenario 2: Deduplication Logic ไม่จับคู่ temp_id กับ id ได้ครบ**

**Flow:**
1. Temp message ถูกเพิ่ม: `{ id: "temp-123", temp_id: "temp-123" }`
2. Real message มาจาก WebSocket: `{ id: "real-456", temp_id: "temp-123" }`
3. Logic ตรวจสอบ:
   ```typescript
   const existingIndex = currentMessages.findIndex(msg =>
     msg.id === message.id || (message.temp_id && msg.temp_id === message.temp_id)
   );
   ```
4. **ถ้า existingIndex !== -1** และ **isRealMessage = true**
5. **แต่** `existingMsg.id !== existingMsg.temp_id` (กรณี real message มาก่อน) → ไม่เข้า replace logic
6. ตกไปที่ append logic → **มี 2 รายการ**

#### **Scenario 3: VirtualMessageList deduplication ไม่ทำงาน**

**Flow:**
1. Store มี duplicate แล้ว (จาก scenario 1 หรือ 2)
2. VirtualMessageList มี deduplication logic (บรรทัด 126-198)
3. **แต่** logic นี้อาจไม่ filter ออกหมดถ้า:
   - Message มี ID format ที่ไม่เหมือนกัน
   - Timing issue: commit messages ก่อน dedup ทำงาน

---

## 3. Files Involved - ไฟล์ที่เกี่ยวข้องทั้งหมด

### 3.1 Message Sending Layer

**File:** `src/hooks/useMessage.ts`
- **Line 114-190:** `sendTextMessage()` - สร้าง temp message และเรียก API
  - **Line 125-143:** สร้าง temp message object
  - **Line 146:** `addNewMessage(tempMessage)` - เพิ่มเข้า conversationStore
  - **Line 158:** `await storeSendTextMessage()` - เรียก API
  - **Line 167-170:** `updateMessage(tempId, {...message})` - อัพเดท temp message หลัง API ตอบกลับ

**ปัญหา:**
- **Race condition:** ถ้า WebSocket ตอบกลับก่อน `addNewMessage(tempMessage)` ทำงานเสร็จ อาจทำให้มี 2 รายการ
- **updateMessage()** ใช้ messageStore.updateMessage ซึ่งไม่ sync กับ conversationStore

### 3.2 Store Management Layer

**File:** `src/stores/conversationStore.ts`
- **Line 454-571:** `addNewMessage()` - จัดการ temp/real message replacement
  - **Line 467:** `isRealMessage` - ตรวจสอบว่าเป็น real message หรือไม่
  - **Line 472-474:** `existingIndex` - ค้นหา message ที่มีอยู่แล้ว
  - **Line 479-508:** Replace logic - **มีบั๊ก**: เช็คเฉพาะ `existingMsg.id === existingMsg.temp_id`
  - **Line 511-515:** Skip logic - ถ้ามี message อยู่แล้ว
  - **Line 564-570:** **Append logic** - ถ้าไม่ match เงื่อนไขข้างบน → **จุดที่เกิด duplicate**

**ปัญหา:**
- **Replace logic ไม่ครบถ้วน:** เช็คเฉพาะกรณี `existingMsg.id === existingMsg.temp_id` (temp message)
- **ไม่จัดการกรณี:** real message มาก่อน แล้ว temp message มาทีหลัง

**File:** `src/stores/messageStore.ts`
- **Line 575-603:** `updateMessage()` - อัพเดท message ใน messageStore
- **ปัญหา:** messageStore และ conversationStore แยกกัน ไม่ sync

### 3.3 WebSocket Handler Layer

**File:** `src/hooks/useConversation.ts`
- **Line 123-186:** WebSocket event handler `message:message.receive`
  - **Line 147-149:** ดึง `tempId` จาก metadata
  - **Line 155-165:** ถ้ามี tempId → เพิ่ม temp_id ให้ message และเรียก `addNewMessage()`
  - **Line 171-183:** ถ้าไม่มี tempId (ข้อความจากคนอื่น) → เรียก `addNewMessage()`

**ปัญหา:**
- **ไม่มี deduplication check:** ก่อนเรียก `addNewMessage()`
- **อาจเรียก addNewMessage() หลายครั้ง:** ถ้ามี listener ซ้อนหรือ event trigger หลายครั้ง

**ตรวจสอบ listener ซ้อน:**
- **Line 79-401:** `useEffect` มี dependencies ที่ครบถ้วน
- **Line 372-385:** มี cleanup function ที่ unsubscribe
- **น่าจะไม่มีปัญหา listener ซ้อน**

### 3.4 UI Rendering Layer

**File:** `src/components/shared/VirtualMessageList.tsx`
- **Line 126-198:** `deduplicatedMessages` - Deduplication logic
  - **Line 133-151:** Pass 1: Build map of temp_id → real message
  - **Line 156-189:** Pass 2: Filter และ deduplicate
  - **Line 164-168:** กรณี: temp message ที่ถูก replace → skip
  - **Line 171-177:** กรณี: real message (might replace temp) → เพิ่มเข้า seen
  - **Line 180-188:** กรณี: regular message → เพิ่มเข้า seen

**ปัญหา:**
- **Dedup logic ดูดี** แต่ทำงานหลัง store มี duplicate แล้ว
- **Buffer pattern** (Line 83-122) อาจทำให้ dedup ไม่ทำงานทันเวลา

---

## 4. Root Cause - สาเหตุหลักของปัญหา

### สาเหตุหลัก #1: conversationStore.addNewMessage Logic ไม่ครบถ้วน

**ที่ตั้ง:** `src/stores/conversationStore.ts` Line 479-508

```typescript
// ✅ Replace logic - มีบั๊ก
if (isRealMessage && existingIndex !== -1) {
  const existingMsg = currentMessages[existingIndex];

  // ❌ ปัญหา: เช็คเฉพาะกรณี temp message เท่านั้น
  if (existingMsg.id === existingMsg.temp_id) {
    // Replace temp message with real message
    const updatedMessages = [...currentMessages];
    updatedMessages[existingIndex] = message;
    return { ... };
  }
  // ❌ ถ้า existingMsg เป็น real message → ไม่เข้า if → ตกไปที่ append
}

// ✅ Skip logic
if (existingIndex !== -1) {
  return state; // Skip if message exists
}

// ❌ Append logic - จุดที่เกิด duplicate
return {
  conversationMessages: {
    ...state.conversationMessages,
    [conversationId]: [...currentMessages, message]
  }
};
```

**สถานการณ์ที่เกิดบั๊ก:**

1. **Real message มาก่อน temp message:**
   - Real message เพิ่มเข้า store: `{ id: "real-456", temp_id: "temp-123" }`
   - Temp message มาทีหลัง: `{ id: "temp-123", temp_id: "temp-123" }`
   - `existingIndex = 0` (เจอ real message)
   - `isRealMessage = false` (temp message ไม่ใช่ real message)
   - → ไม่เข้า replace logic
   - → ตกไปที่ skip logic แต่ **existingIndex ตรวจสอบผิด** (เช็ค temp_id ตรง แต่ไม่เข้า if)
   - → **Append temp message** → มี 2 รายการ

2. **Real message มาหลัง temp message แต่ replace ไม่สำเร็จ:**
   - Temp message เพิ่มเข้า store: `{ id: "temp-123", temp_id: "temp-123" }`
   - Real message มาทีหลัง: `{ id: "real-456", temp_id: "temp-123" }`
   - `existingIndex = 0` (เจอ temp message)
   - `isRealMessage = true`
   - `existingMsg.id === existingMsg.temp_id = true` → **เข้า replace logic ✅**
   - → ควรทำงานได้ถูกต้อง

   **แต่ถ้า timing issue** หรือ state update ไม่ทันเวลา อาจทำให้ append ซ้ำ

### สาเหตุหลัก #2: Race Condition ระหว่าง addNewMessage และ WebSocket handler

**ที่ตั้ง:** `src/hooks/useMessage.ts` Line 145-158

```typescript
// 1. เพิ่ม temp message เข้า store
addNewMessage(tempMessage, tempMessage.sender_id || '');

// 2. ส่ง API
const message = await storeSendTextMessage(conversationId, content, updatedMetadata);
```

**ถ้า WebSocket ตอบกลับเร็วมาก:**
- WebSocket event ถูก trigger ก่อน `addNewMessage(tempMessage)` ทำงานเสร็จ
- Real message ถูกเพิ่มเข้า store ก่อน
- จากนั้น temp message ถูกเพิ่มเข้า store → มี 2 รายการ

### สาเหตุหลัก #3: messageStore.updateMessage() ไม่ sync กับ conversationStore

**ที่ตั้ง:** `src/hooks/useMessage.ts` Line 167-170

```typescript
// อัพเดทข้อมูลอื่นๆ ของข้อความ
updateMessage(tempId, {
  status: 'delivered',
  ...message
});
```

**ปัญหา:**
- `updateMessage()` เป็นของ **messageStore** (ไม่ใช่ conversationStore)
- messageStore และ conversationStore แยกกัน ไม่ sync
- อาจทำให้ temp message ใน messageStore ไม่ถูก replace แต่ conversationStore ถูก replace → inconsistent state

---

## 5. Recommended Solutions - วิธีแก้ไขที่ถูกต้อง

### Solution #1: แก้ไข conversationStore.addNewMessage Logic ⭐ (แนะนำ - Priority สูงสุด)

**File:** `src/stores/conversationStore.ts` Line 454-571

**แก้ไขที่:**
```typescript
addNewMessage: (message: MessageDTO, currentUserId: string) => {
  set((state) => {
    const conversationId = message.conversation_id;
    const currentMessages = state.conversationMessages[conversationId] || [];

    const isRealMessage = message.id && message.temp_id && message.id !== message.temp_id;
    const isTempMessage = message.id === message.temp_id;

    // ✅ ปรับปรุง: ค้นหาทั้ง by ID และ by temp_id
    const existingIndex = currentMessages.findIndex(msg => {
      // Case 1: Match by real ID
      if (msg.id === message.id) return true;

      // Case 2: Match by temp_id (real message replacing temp)
      if (message.temp_id && msg.temp_id === message.temp_id) return true;

      // Case 3: Match temp message with incoming temp_id (temp replacing real - rare)
      if (message.id && msg.temp_id === message.id) return true;

      return false;
    });

    // ✅ ถ้าเจอ message ที่ match → ตัดสินใจว่าจะ replace หรือ skip
    if (existingIndex !== -1) {
      const existingMsg = currentMessages[existingIndex];

      console.log('🔍 [Store] Found existing message:', {
        existingId: existingMsg.id,
        existingTempId: existingMsg.temp_id,
        newId: message.id,
        newTempId: message.temp_id,
        isRealMessage,
        isTempMessage
      });

      // ✅ กรณีที่ควร replace:
      // 1. Real message replacing temp message
      // 2. Update same message (same ID)
      const isExistingTemp = existingMsg.id === existingMsg.temp_id;
      const shouldReplace =
        (isRealMessage && isExistingTemp) ||  // Real replacing temp
        (message.id === existingMsg.id && !isTempMessage); // Update real message

      // ✅ กรณีที่ควร skip:
      // 1. Temp message trying to replace real message (ignore temp)
      // 2. Duplicate message (same ID, same data)
      const shouldSkip =
        (isTempMessage && !isExistingTemp) || // Temp after real → Skip temp
        (message.id === existingMsg.id && message.temp_id === existingMsg.temp_id); // Exact duplicate

      if (shouldReplace) {
        console.log(`🔄 [Store] Replacing message ${existingMsg.id || existingMsg.temp_id} with ${message.id}`);

        const updatedMessages = [...currentMessages];
        updatedMessages[existingIndex] = message;

        // อัพเดท conversation metadata
        const lastMessageText = getLastMessageTextBySender(message, currentUserId);
        const updatedConversations = state.conversations.map(conv => {
          if (conv.id === conversationId) {
            return {
              ...conv,
              last_message_text: lastMessageText,
              last_message_at: message.created_at
            };
          }
          return conv;
        });

        return {
          conversations: updatedConversations,
          conversationMessages: {
            ...state.conversationMessages,
            [conversationId]: updatedMessages
          }
        };
      }

      if (shouldSkip) {
        console.log(`⚠️ [Store] Skipping message ${message.id || message.temp_id} (duplicate or late temp)`);
        return state;
      }
    }

    // ✅ ไม่เจอ message ที่ match → Append (new message)
    console.log(`📩 [Store] Adding new message ${message.id || message.temp_id}`);

    // ตรวจสอบเงื่อนไขสำหรับการเพิ่ม unread_count
    const isFromOtherUser = message.sender_id !== currentUserId;
    const isInActiveConversation = state.activeConversationId === conversationId;
    const shouldIncreaseUnread = isFromOtherUser && !isInActiveConversation;

    const lastMessageText = getLastMessageTextBySender(message, currentUserId);

    // อัปเดตข้อความล่าสุดในการสนทนา
    const updatedConversations = state.conversations.map(conv => {
      if (conv.id === conversationId) {
        const newUnreadCount = shouldIncreaseUnread
          ? (conv.unread_count || 0) + 1
          : conv.unread_count || 0;

        return {
          ...conv,
          last_message_text: lastMessageText,
          last_message_at: message.created_at,
          unread_count: newUnreadCount
        };
      }
      return conv;
    });

    // เรียงลำดับการสนทนาใหม่
    const sortedConversations = [...updatedConversations].sort((a, b) => {
      const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return bTime - aTime;
    });

    return {
      conversations: sortedConversations,
      conversationMessages: {
        ...state.conversationMessages,
        [conversationId]: [...currentMessages, message]
      }
    };
  });
}
```

**อธิบาย:**
1. **ปรับปรุง existingIndex logic:** ค้นหาทั้ง by ID, by temp_id, และ reverse case
2. **เพิ่ม shouldReplace และ shouldSkip flags:** กำหนดชัดเจนว่าเมื่อไหร่ควร replace หรือ skip
3. **Handle ทุกกรณี:**
   - Real message replacing temp message ✅
   - Temp message after real message → Skip temp ✅
   - Update same message ✅
   - Duplicate → Skip ✅

### Solution #2: ลบ debug logs ที่ไม่จำเป็น

**Files:**
- `src/stores/conversationStore.ts` - ลบ logs ที่เพิ่มไว้ทั้งหมด
- `src/hooks/useConversation.ts` - ลบ logs ที่เพิ่มไว้ทั้งหมด
- `src/components/shared/VirtualMessageList.tsx` - ลบ logs ที่เพิ่มไว้ทั้งหมด

**หลังจากแก้ไขและทดสอบเสร็จแล้ว** ควรลบ logs เหล่านี้ออกเพื่อ performance

### Solution #3: ลบ VirtualMessageList deduplication logic (Optional)

**File:** `src/components/shared/VirtualMessageList.tsx`

**เหตุผล:**
- ถ้า store จัดการ deduplication ได้ดีแล้ว ไม่จำเป็นต้องทำซ้ำใน UI
- ลด complexity และ improve performance

**แต่ควรเก็บไว้ในระยะแรกเป็น safety net**

---

## 6. Priority และ Action Plan

### Phase 1: Critical Fix (ทำทันที) ⭐

**Task 1.1: แก้ไข conversationStore.addNewMessage**
- **File:** `src/stores/conversationStore.ts` (Line 454-571)
- **Action:** ใช้ Solution #1
- **Time:** 30-45 นาที
- **Expected Result:** แก้ไข 90% ของปัญหา duplicate

**Task 1.2: ทดสอบ**
- ส่งข้อความปกติ → ต้องไม่มี duplicate
- ส่งข้อความหลายครั้งติดกัน → ต้องไม่มี duplicate
- ส่งข้อความใน slow network → ต้องไม่มี duplicate

### Phase 2: Cleanup (ควรทำหลัง Phase 1)

**Task 2.1: ลบ debug logs**
- **Files:**
  - `src/stores/conversationStore.ts`
  - `src/hooks/useConversation.ts`
  - `src/components/shared/VirtualMessageList.tsx`
- **Action:** ลบ console.log ทั้งหมดที่เพิ่มมาเพื่อ debug
- **Time:** 15 นาที

**Task 2.2: ลบ deduplication logic ใน VirtualMessageList (Optional)**
- **File:** `src/components/shared/VirtualMessageList.tsx`
- **Action:** ถ้า store ทำงานได้ดี ให้ลบ dedup logic ออก
- **Time:** 10 นาที

### Phase 3: Long-term Improvements (ถ้ามีเวลา)

**Task 3.1: Consolidate messageStore และ conversationStore**
- **Rationale:** มี 2 stores ที่ไม่ sync กัน เป็นสาเหตุของ bugs หลายตัว
- **Action:** ยุบ messageStore เข้ากับ conversationStore หรือสร้าง sync mechanism
- **Time:** 2-4 ชั่วโมง
- **Impact:** แก้ไขปัญหา architecture ระยะยาว

---

## 7. Testing Checklist

### Basic Tests (ต้องทดสอบทั้งหมด)
- [ ] ส่งข้อความ text ธรรมดา → ไม่มี duplicate
- [ ] ส่งข้อความหลายข้อความติดกัน (3-5 ข้อความ) → ไม่มี duplicate
- [ ] ส่งข้อความใน slow network (throttle 3G) → ไม่มี duplicate
- [ ] ส่งข้อความ image → ไม่มี duplicate
- [ ] ส่งข้อความ file → ไม่มี duplicate
- [ ] ส่งข้อความ sticker → ไม่มี duplicate

### Edge Cases (ควรทดสอบ)
- [ ] ส่งข้อความแล้ว refresh หน้าทันที → ไม่มี duplicate
- [ ] ส่งข้อความใน 2 tabs พร้อมกัน → ไม่มี duplicate (ถ้า support multi-tab)
- [ ] ส่งข้อความ reply → ไม่มี duplicate
- [ ] รับข้อความจากคนอื่น → ไม่มี duplicate
- [ ] ส่งข้อความ 10 ข้อความติดกัน (spam test) → ไม่มี duplicate

### Performance Tests (ควรตรวจสอบ)
- [ ] ส่งข้อความไม่ทำให้ UI lag
- [ ] Console ไม่มี errors/warnings
- [ ] Memory leak check (ส่งข้อความ 100 ข้อความ แล้วดู memory)

---

## 8. Code Review Checklist

### Before Merge
- [ ] Logic ของ `conversationStore.addNewMessage` ถูกต้องครบถ้วน
- [ ] Handle ทุก edge cases (temp before real, real before temp, duplicate)
- [ ] มี comments อธิบาย logic ที่ซับซ้อน
- [ ] Debug logs ถูกลบออกหมดแล้ว (หรือเปลี่ยนเป็น debug mode)
- [ ] Tests ผ่านทั้งหมด
- [ ] ไม่มี console errors/warnings

---

## 9. สรุป

### Root Causes
1. **conversationStore.addNewMessage** มี logic ไม่ครบถ้วน ไม่ handle ทุกกรณีของ temp/real message
2. **Replace logic เช็คไม่ครบ:** เช็คเฉพาะ temp message แต่ไม่เช็คกรณี real message มาก่อน
3. **Skip logic ไม่ cover ทุกกรณี:** ทำให้ temp message ถูก append แม้ว่าจะมี real message อยู่แล้ว

### Recommended Solution (Priority)
1. **แก้ไข conversationStore.addNewMessage** (Solution #1) - **ต้องทำ**
   - Handle ทุกกรณี: real before temp, temp before real, duplicates
   - เพิ่ม shouldReplace และ shouldSkip logic

2. **ลบ debug logs** (Solution #2) - **ควรทำ**
   - Clean up code

3. **ลบ VirtualMessageList dedup** (Solution #3) - **Optional**
   - ลด redundancy

### Expected Result
- ✅ ไม่มี duplicate messages
- ✅ Temp message ถูก replace ด้วย real message ทุกครั้ง
- ✅ Real message มาก่อน → skip temp message ที่มาทีหลัง
- ✅ UI แสดงผลสม่ำเสมอ
- ✅ Performance ดีขึ้น (ไม่มี unnecessary deduplication)

### Files ที่ต้องแก้ไข
1. **`src/stores/conversationStore.ts`** (Line 454-571) - **Priority สูงสุด ⭐**
2. **`src/hooks/useConversation.ts`** - ลบ debug logs
3. **`src/components/shared/VirtualMessageList.tsx`** - ลบ debug logs

---

## 10. Next Steps

1. **Review รายงานนี้** และตกลงแนวทางแก้ไข
2. **แก้ไข conversationStore.addNewMessage** ตาม Solution #1
3. **ทดสอบ** ตาม Testing Checklist
4. **ลบ debug logs** ทั้งหมด
5. **Code review** ก่อน merge
6. **Monitor** หลัง deploy เพื่อดูว่ายังมี duplicate หรือไม่

---

**Author:** Claude Code Analysis
**Date:** 2025-11-13
**Status:** Ready for Implementation
