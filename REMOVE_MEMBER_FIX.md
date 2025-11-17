# แก้ไขปัญหา Remove Member ใน Group Chat

## ปัญหา
คนที่ถูก remove จากกลุ่มยังเห็น conversation อยู่

## สาเหตุ
1. Backend ยังส่ง conversation ที่ user ไม่ได้เป็นสมาชิกกลับมาใน API
2. WebSocket event `message:conversation.user_removed` ไม่ได้ถูกส่งให้คนที่ถูก remove
3. มีการ refetch conversations ที่ทำให้ conversation กลับมาปรากฏอีก

## วิธีตรวจสอบ

### 1. เปิด Developer Console และทดสอบ remove member

คุณควรเห็น logs แบบนี้:

```
[DEBUG] conversation.user_removed event received: {
  removed_user_id: "user-123",
  current_user_id: "user-123",
  conversation_id: "conv-456",
  removed_by: "user-789",
  is_current_user: true
}

[DEBUG] Current user was removed from conversation: conv-456
[DEBUG] removeConversation called for: conv-456
[DEBUG] Removing conversation from store: conv-456
[DEBUG] Conversations before remove: 10
[DEBUG] Conversations after remove: 9
```

### 2. ตรวจสอบว่า event ถูกส่งมาหรือไม่

**ถ้าไม่เห็น log `conversation.user_removed event received`**:
- Backend ไม่ได้ส่ง WebSocket event
- ✅ **แก้ไข**: ให้ Backend ส่ง event `message:conversation.user_removed` ให้ทั้งคนที่ remove และคนที่ถูก remove

**ถ้า `is_current_user: false`**:
- `user_id` ใน event ไม่ตรงกับ `currentUserId`
- ✅ **แก้ไข**: Backend ต้องส่ง `user_id` ที่ถูกต้อง

### 3. ตรวจสอบว่า conversation ถูกลบจาก store หรือไม่

**ถ้าถูกลบแล้วแต่กลับมาปรากฏอีก**:
- Backend ยังส่ง conversation ที่ user ไม่ได้เป็นสมาชิกกลับมาใน API
- ✅ **แก้ไข**: Backend ต้อง filter conversations ให้ถูกต้อง

## แนวทางแก้ไข

### วิธีที่ 1: แก้ที่ Backend (แนะนำ)

#### 1.1 ตรวจสอบว่า Backend ส่ง WebSocket event หรือไม่

Backend ควรส่ง event `conversation.user_removed` ไปยังผู้ใช้ทุกคนในกลุ่ม **รวมถึงคนที่ถูก remove ด้วย**

```python
# ตัวอย่าง Backend (Python/FastAPI)
async def remove_user_from_conversation(
    conversation_id: str,
    user_id_to_remove: str,
    removed_by: str
):
    # ... ลบ user ออกจาก database ...

    # ส่ง event ไปยัง user ที่ถูก remove
    await websocket_manager.send_to_user(
        user_id=user_id_to_remove,
        event_type="conversation.user_removed",
        data={
            "conversation_id": conversation_id,
            "user_id": user_id_to_remove,
            "removed_by": removed_by,
            "removed_at": datetime.utcnow().isoformat()
        }
    )

    # ส่ง event ไปยัง user ที่เหลือในกลุ่ม
    await websocket_manager.send_to_conversation(
        conversation_id=conversation_id,
        event_type="conversation.user_removed",
        data={
            "conversation_id": conversation_id,
            "user_id": user_id_to_remove,
            "removed_by": removed_by,
            "removed_at": datetime.utcnow().isoformat()
        },
        exclude_user_id=user_id_to_remove  # ไม่ส่งซ้ำให้คนที่ถูก remove
    )
```

#### 1.2 ตรวจสอบ API Endpoint สำหรับ GET /conversations

Backend ควร filter เฉพาะ conversations ที่ user ยังเป็นสมาชิกอยู่

```python
# ตัวอย่าง Backend (Python/FastAPI)
@router.get("/conversations")
async def get_conversations(
    current_user: User = Depends(get_current_user)
):
    # ✅ ถูกต้อง: ดึงเฉพาะ conversations ที่ user ยังเป็นสมาชิก
    conversations = await db.conversations.find({
        "participants": current_user.id,
        "deleted_at": None  # ยังไม่ถูกลบ
    }).to_list()

    return conversations
```

### วิธีที่ 2: Workaround ที่ Frontend

ถ้าไม่สามารถแก้ที่ Backend ได้ทันที สามารถเพิ่ม workaround ที่ Frontend:

#### 2.1 Filter conversations เมื่อ fetch

แก้ไขไฟล์ `src/stores/conversationStore.ts`

```typescript
fetchConversations: async (params?: ConversationQueryRequest) => {
  try {
    set({ isLoading: true, error: null });

    const response = await messageService.getConversations(params);

    if (response.success && response.data) {
      // ✅ เพิ่ม: Filter เฉพาะ conversations ที่ user ยังเป็นสมาชิก
      const currentUserId = useAuthStore.getState().user?.id;

      const validConversations = response.data.filter(conv => {
        // ตรวจสอบว่า user ยังเป็นสมาชิกอยู่หรือไม่
        if (conv.type === 'direct') {
          return true; // Direct conversation ไม่มีปัญหา
        }

        // Group conversation: ตรวจสอบว่ามี currentUserId ใน participants หรือไม่
        return conv.participants?.some(p => p.id === currentUserId);
      });

      set({
        conversations: validConversations,
        isLoading: false,
      });

      return validConversations;
    }

    // ... rest of the code
  } catch (error) {
    // ... error handling
  }
}
```

#### 2.2 เพิ่มการตรวจสอบเมื่อรับ conversation.list event

แก้ไขไฟล์ `src/hooks/useConversation.ts`

```typescript
// Listen for conversation list from WebSocket
const unsubConversationList = addEventListener('message:conversation.list' as any, (rawData: WebSocketEnvelope<ConversationDTO[]>) => {
  const newConversations = rawData.data;

  if (newConversations && Array.isArray(newConversations)) {
    // ✅ เพิ่ม: Filter เฉพาะ conversations ที่ user ยังเป็นสมาชิก
    const validConversations = newConversations.filter(conv => {
      if (conv.type === 'direct') return true;

      // Group: ตรวจสอบว่ามี currentUserId ใน participants
      return conv.participants?.some(p => p.id === currentUserId);
    });

    const currentState = useConversationStore.getState();
    const existingConversations = currentState.conversations;

    // Merge with valid conversations only
    const existingMap = new Map(existingConversations.map(conv => [conv.id, conv]));

    const mergedConversations = validConversations.map(newConv => {
      const existing = existingMap.get(newConv.id);
      if (existing) {
        return {
          ...existing,
          ...newConv,
          icon_url: newConv.icon_url || existing.icon_url,
          contact_info: newConv.contact_info || existing.contact_info,
        };
      }
      return newConv;
    });

    useConversationStore.setState({ conversations: mergedConversations });
  }
});
```

### วิธีที่ 3: เพิ่มการตรวจสอบก่อนแสดง Conversation (Quick Fix)

ถ้าต้องการ quick fix แบบง่ายๆ สามารถเพิ่มการตรวจสอบตอนแสดง conversation list:

แก้ไขไฟล์ที่แสดง conversation list (เช่น `ConversationList.tsx`)

```typescript
const ConversationList = () => {
  const { conversations } = useConversation();
  const currentUserId = useAuth().user?.id;

  // ✅ Filter เฉพาะ conversations ที่ user ยังเป็นสมาชิก
  const validConversations = conversations.filter(conv => {
    if (conv.type === 'direct') return true;

    // ตรวจสอบว่ามี currentUserId ใน participants
    return conv.participants?.some(p => p.id === currentUserId);
  });

  return (
    <div>
      {validConversations.map(conv => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}
    </div>
  );
};
```

## การทดสอบหลังแก้ไข

1. **Remove member จากกลุ่ม**
2. **ตรวจสอบ logs ใน Console**:
   - ต้องเห็น `conversation.user_removed event received`
   - `is_current_user: true`
   - `removeConversation called`
   - Conversation ถูกลบออกจาก store
3. **Refresh หน้า**:
   - Conversation ที่ถูก remove ต้องไม่ปรากฏอีก
4. **ตรวจสอบ API Response**:
   - เรียก `GET /conversations`
   - ต้องไม่เห็น conversation ที่ user ไม่ได้เป็นสมาชิกแล้ว

## สรุป

**แนวทางที่แนะนำ**: แก้ที่ Backend
- ส่ง WebSocket event `conversation.user_removed` ให้คนที่ถูก remove
- Filter conversations ให้ถูกต้องใน API

**ถ้าแก้ Backend ไม่ได้ทันท**ี: ใช้ Workaround ที่ Frontend
- Filter conversations ใน store
- Filter ตอนรับ WebSocket event
- Filter ตอนแสดง UI

---

**อัพเดทล่าสุด**: 2025-11-17
**ผู้จัดทำ**: Claude Code
