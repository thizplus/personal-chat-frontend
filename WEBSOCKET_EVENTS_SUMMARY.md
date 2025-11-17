# WebSocket Events Summary

เอกสารสรุป WebSocket Events ทั้งหมดที่มีในระบบ Chat Application

## สารบัญ
- [Message Events](#message-events)
- [Conversation Events](#conversation-events)
- [Friend Events](#friend-events)
- [User Events](#user-events)
- [WebSocket Connection Events](#websocket-connection-events)
- [สรุปสถานะการ Implement](#สรุปสถานะการ-implement)
- [ปัญหาที่พบ](#ปัญหาที่พบ)

---

## Message Events

### 1. `message:message.receive`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:123`

**หน้าที่**:
- รับข้อความใหม่จากผู้ใช้อื่นหรือข้อความที่ส่งสำเร็จจาก server
- Replace temp message ด้วย real message ที่มี ID จาก server

**การอัพเดทข้อมูล**:
- เพิ่มข้อความใหม่เข้า `conversationMessages` store
- อัพเดท `lastMessage` และ `updatedAt` ของการสนทนา
- เพิ่ม `unreadCount` ถ้าไม่ใช่ active conversation
- Mark message as read ถ้าเป็น active conversation
- Invalidate media cache ถ้าข้อความมี media หรือ links

**Data Structure**:
```typescript
WebSocketEnvelope<MessageDTO>
```

---

### 2. `message:message.edit`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:242`

**หน้าที่**:
- รับการแก้ไขข้อความจากผู้ใช้อื่น

**การอัพเดทข้อมูล**:
- อัพเดทข้อมูลข้อความใน `conversationMessages` store
- อัพเดท `editedAt` timestamp
- อัพเดท `content` ของข้อความ

**Data Structure**:
```typescript
WebSocketEnvelope<MessageDTO>
```

---

### 3. `message:message.read`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:213`

**หน้าที่**:
- รับการแจ้งเตือนว่าข้อความถูกอ่านแล้ว

**การอัพเดทข้อมูล**:
- อัพเดทสถานะข้อความเป็น `read`
- อัพเดท `read_count` ของข้อความ

**Data Structure**:
```typescript
WebSocketEnvelope<MessageReadDTO>
{
  message_id: string;
  read_by: string;
  read_at: string;
  read_count: number;
}
```

---

### 4. `message:message.read_all`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:223`

**หน้าที่**:
- รับการแจ้งเตือนว่าข้อความทั้งหมดในการสนทนาถูกอ่านแล้ว

**การอัพเดทข้อมูล**:
- อัพเดทสถานะข้อความทั้งหมดในการสนทนาเป็น `read`
- รีเซ็ต `unreadCount` เป็น 0

**Data Structure**:
```typescript
WebSocketEnvelope<MessageReadAllDTO>
{
  conversation_id: string;
  read_by: string;
  read_at: string;
}
```

---

### 5. `message:message.updated`
**ประเภท**: Incoming Event
**สถานะ**: ❌ Not Implemented
**ไฟล์ที่ใช้**: -

**หน้าที่**:
- อัพเดทข้อมูลข้อความ (อาจใช้แทน `message.edit` หรือใช้ร่วมกัน)

**การอัพเดทข้อมูล**:
- N/A (ยังไม่ได้ implement)

**หมายเหตุ**: มี type definition แต่ไม่ได้ใช้งานใน code - อาจจะซ้ำซ้อนกับ `message.edit`

---

### 6. `message:message.delete`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:257`

**หน้าที่**:
- รับการแจ้งเตือนว่าข้อความถูกลบ

**การอัพเดทข้อมูล**:
- อัพเดทข้อความเป็น "ข้อความนี้ถูกลบแล้ว"
- ตั้งค่า `is_deleted = true`
- บันทึก `deleted_at` timestamp
- **ไม่ลบข้อความออกจาก store** (soft delete)

**Data Structure**:
```typescript
WebSocketEnvelope<MessageDeletedData>
{
  message_id: string;
  deleted_at: string;
}
```

---

## Conversation Events

### 7. `message:conversation.list`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented (แต่ไม่ได้ define ใน types)
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:87`

**หน้าที่**:
- รับรายการการสนทนาทั้งหมดจาก server

**การอัพเดทข้อมูล**:
- Merge กับ conversations ที่มีอยู่แล้ว
- รักษาข้อมูลเดิมที่อาจจะหายไปจาก WebSocket (เช่น `icon_url`, `contact_info`)
- อัพเดทข้อมูลใหม่ (เช่น `unread_count`, `last_message`)

**Data Structure**:
```typescript
WebSocketEnvelope<ConversationDTO[]>
```

**หมายเหตุ**: ใช้งานจริงแต่ไม่ได้ define ใน `WebSocketEventMap`

---

### 8. `message:conversation.create`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:278`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อมีการสนทนาใหม่ถูกสร้าง (โดยผู้อื่น)

**การอัพเดทข้อมูล**:
- เพิ่มการสนทนาใหม่เข้า `conversations` store
- Subscribe to conversation room อัตโนมัติ

**Data Structure**:
```typescript
WebSocketEnvelope<ConversationDTO>
```

**หมายเหตุ**: Skip event ถ้า `creator_id` ตรงกับ `currentUserId` (ป้องกัน duplicate)

---

### 9. `message:conversation.updated`
**ประเภท**: Incoming Event
**สถานะ**: ⚠️ Partially Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:363` (ใช้ dynamic event: `conversation_update`)

**หน้าที่**:
- รับการอัพเดทข้อมูลการสนทนา (ชื่อ, รูปภาพ, etc.)

**การอัพเดทข้อมูล**:
- อัพเดทข้อมูลการสนทนาใน `conversations` store

**Data Structure**:
```typescript
WebSocketEnvelope<ConversationDTO>
```

**ปัญหา**:
- ใช้ชื่อ event ไม่ตรงกับ types (`conversation_update` แทน `conversation.updated`)
- ใช้ `WebSocketManager.onDynamic()` แทน `addEventListener()`

---

### 10. `message:conversation.deleted`
**ประเภท**: Incoming Event
**สถานะ**: ⚠️ Partially Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:378` (ใช้ dynamic event: `conversation_delete`)

**หน้าที่**:
- รับการแจ้งเตือนเมื่อการสนทนาถูกลบ

**การอัพเดทข้อมูล**:
- ลบการสนทนาออกจาก `conversations` store

**Data Structure**:
```typescript
WebSocketEnvelope<ConversationDTO>
```

**ปัญหา**:
- ใช้ชื่อ event ไม่ตรงกับ types (`conversation_delete` แทน `conversation.deleted`)
- ใช้ `WebSocketManager.onDynamic()` แทน `addEventListener()`

---

### 11. `message:conversation.join`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:305`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อผู้ใช้เข้าร่วมการสนทนา

**การอัพเดทข้อมูล**:
- Subscribe to conversation room อัตโนมัติ

**Data Structure**:
```typescript
WebSocketEnvelope<ConversationDTO>
```

---

### 12. `message:conversation.user_added`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:323`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อมีสมาชิกใหม่เข้าร่วมกลุ่ม

**การอัพเดทข้อมูล**:
- Refetch conversations ถ้าเป็น active conversation
- แสดง toast notification

**Data Structure**:
```typescript
WebSocketEnvelope<ConversationUserAddedData>
{
  conversation_id: string;
  user_id: string;
  added_by: string;
  added_at: string;
  user: {
    id: string;
    username: string;
    display_name: string;
    profile_image_url: string | null;
  };
}
```

---

### 13. `message:conversation.user_removed`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useConversation.ts:336`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อสมาชิกถูกลบออกจากกลุ่ม

**การอัพเดทข้อมูล**:
- ถ้าผู้ใช้ปัจจุบันถูกลบ:
  - ลบ conversation ออกจาก store
  - Navigate กลับไปหน้า dashboard ถ้ากำลังเปิด conversation นั้นอยู่
- ถ้าคนอื่นถูกลบ:
  - Refetch conversations
- แสดง toast notification

**Data Structure**:
```typescript
WebSocketEnvelope<ConversationUserRemovedData>
{
  conversation_id: string;
  user_id: string;
  removed_by: string;
  removed_at: string;
}
```

---

## Friend Events

### 14. `message:friend.request`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useFriendship.ts:67`

**หน้าที่**:
- รับคำขอเป็นเพื่อนใหม่

**การอัพเดทข้อมูล**:
- เพิ่มคำขอใหม่เข้า `pendingRequests` store

**Data Structure**:
```typescript
WebSocketEnvelope<FriendRequestNotification>
{
  user_id: string;
  request_id: string;
  requested_at: string;
  sender: {
    username: string;
    display_name: string;
    profile_image_url: string | null;
  };
}
```

---

### 15. `message:friend.accept`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useFriendship.ts:87`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อคำขอเป็นเพื่อนถูกตอบรับ

**การอัพเดทข้อมูล**:
- เพิ่มผู้ใช้เข้า `friends` store
- อัพเดท `friendship_status` เป็น `accepted`

**Data Structure**:
```typescript
WebSocketEnvelope<FriendAcceptNotification>
{
  friendship_id: string;
  acceptor: {
    id: string;
    username: string;
    display_name: string;
    profile_image_url: string | null;
    last_active_at: string | null;
  };
}
```

---

### 16. `message:friend.reject`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useFriendship.ts:125`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อคำขอเป็นเพื่อนถูกปฏิเสธ

**การอัพเดทข้อมูล**:
- ลบคำขอออกจาก `pendingRequests` store
- แสดง toast notification

**Data Structure**:
```typescript
PendingRequestItem
{
  request_id: string;
  user_id: string;
  username: string;
  display_name: string;
  profile_image_url: string | null;
  requested_at: string;
}
```

---

### 17. `message:friend.remove`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useFriendship.ts:114`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อเพื่อนถูกลบ

**การอัพเดทข้อมูล**:
- ลบเพื่อนออกจาก `friends` store
- แสดง toast notification

**Data Structure**:
```typescript
PendingRequestItem
{
  user_id: string;
  display_name: string;
}
```

---

## User Events

### 18. `message:user.blocked`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useFriendship.ts:136`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อมีการบล็อกผู้ใช้

**การอัพเดทข้อมูล**:
- แสดง toast notification

**Data Structure**:
```typescript
WebSocketEnvelope<UserBlockedData>
{
  blocker_id: string;
  blocked_at: string;
}
```

**หมายเหตุ**: ไม่ได้อัพเดท store โดยตรง - อาจต้อง refetch blocked users

---

### 19. `message:user.unblocked`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useFriendship.ts:144`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อมีการปลดบล็อกผู้ใช้

**การอัพเดทข้อมูล**:
- แสดง toast notification

**Data Structure**:
```typescript
WebSocketEnvelope<UserUnblockedData>
{
  unblocker_id: string;
  unblocked_at: string;
}
```

**หมายเหตุ**: ไม่ได้อัพเดท store โดยตรง - อาจต้อง refetch blocked users

---

### 20. `message:user.online`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useOnlineStatus.ts:34`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อผู้ใช้ออนไลน์

**การอัพเดทข้อมูล**:
- อัพเดท `userStatuses` store
- ตั้งค่า `status = 'online'`
- อัพเดท `timestamp`

**Data Structure**:
```typescript
WebSocketEnvelope<UserStatusData>
{
  user_id: string;
  online: boolean;
  timestamp: string;
}
```

---

### 21. `message:user.offline`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useOnlineStatus.ts:44`

**หน้าที่**:
- รับการแจ้งเตือนเมื่อผู้ใช้ออฟไลน์

**การอัพเดทข้อมูล**:
- อัพเดท `userStatuses` store
- ตั้งค่า `status = 'offline'`
- อัพเดท `timestamp`

**Data Structure**:
```typescript
WebSocketEnvelope<UserStatusData>
{
  user_id: string;
  online: boolean;
  timestamp: string;
}
```

---

### 22. `message:user.status`
**ประเภท**: Incoming Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/hooks/useOnlineStatus.ts:54`

**หน้าที่**:
- รับการอัพเดทสถานะผู้ใช้ทั่วไป

**การอัพเดทข้อมูล**:
- อัพเดท `userStatuses` store
- ตั้งค่า `status` ตาม `online` boolean
- อัพเดท `timestamp`

**Data Structure**:
```typescript
WebSocketEnvelope<UserStatusData>
{
  user_id: string;
  online: boolean;
  timestamp: string;
}
```

---

### 23. `message:user.status.subscribe`
**ประเภท**: Outgoing Event
**สถานะ**: ⚠️ Type Only (ใช้งานผ่าน `WebSocketManager.subscribeToUserStatus()`)
**ไฟล์ที่ใช้**: `src/services/websocket/WebSocketManager.ts:277`

**หน้าที่**:
- ส่งคำขอ subscribe สถานะผู้ใช้ไปยัง server

**การส่งข้อมูล**:
```typescript
{
  user_id: string;
  client_id: string;
}
```

**หมายเหตุ**: เป็น outgoing event - ไม่ต้องมี listener

---

### 24. `message:user.status.unsubscribe`
**ประเภท**: Outgoing Event
**สถานะ**: ⚠️ Type Only (ใช้งานผ่าน `WebSocketManager.unsubscribeFromUserStatus()`)
**ไฟล์ที่ใช้**: `src/services/websocket/WebSocketManager.ts:319`

**หน้าที่**:
- ส่งคำขอ unsubscribe สถานะผู้ใช้ไปยัง server

**การส่งข้อมูล**:
```typescript
{
  user_id: string;
  client_id: string;
}
```

**หมายเหตุ**: เป็น outgoing event - ไม่ต้องมี listener

---

### 25. `message:user.status.subscribed`
**ประเภท**: Incoming Event
**สถานะ**: ❌ Not Implemented
**ไฟล์ที่ใช้**: -

**หน้าที่**:
- รับการตอบกลับเมื่อ subscribe สถานะผู้ใช้สำเร็จ

**การอัพเดทข้อมูล**:
- N/A (ยังไม่ได้ implement)

**Data Structure**:
```typescript
WebSocketEnvelope<UserStatusData>
```

**หมายเหตุ**: อาจใช้เพื่อยืนยันการ subscribe หรือรับสถานะเริ่มต้น

---

## WebSocket Connection Events

### 26. `ws:open`
**ประเภท**: Internal Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**:
- `src/hooks/useWebSocket.ts:91`
- `src/services/websocket/WebSocketConnection.ts:218`

**หน้าที่**:
- แจ้งเตือนเมื่อ WebSocket เชื่อมต่อสำเร็จ

**การอัพเดทข้อมูล**:
- ตั้งค่า `isConnected = true`
- ตั้งค่า `isConnecting = false`
- รีเซ็ต `reconnectAttempt = 0`
- แสดง toast success (ถ้า reconnect)
- เริ่ม ping interval

---

### 27. `ws:close`
**ประเภท**: Internal Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**:
- `src/hooks/useWebSocket.ts:92`
- `src/services/websocket/WebSocketConnection.ts:384`

**หน้าที่**:
- แจ้งเตือนเมื่อ WebSocket ปิดการเชื่อมต่อ

**การอัพเดทข้อมูล**:
- ตั้งค่า `isConnected = false`
- แสดง toast warning
- เริ่ม reconnection process (ถ้าไม่ใช่ manual disconnect)
- ล้าง ping interval

---

### 28. `ws:error`
**ประเภท**: Internal Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/services/websocket/WebSocketConnection.ts:363`

**หน้าที่**:
- แจ้งเตือนเมื่อเกิด error ใน WebSocket

**การอัพเดทข้อมูล**:
- Log error
- Emit error event

---

### 29. `ws:reconnecting`
**ประเภท**: Internal Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**:
- `src/hooks/useWebSocket.ts:93`
- `src/services/websocket/WebSocketConnection.ts:440`

**หน้าที่**:
- แจ้งเตือนเมื่อกำลังพยายามเชื่อมต่อใหม่

**การอัพเดทข้อมูล**:
- ตั้งค่า `isConnecting = true`
- อัพเดท `reconnectAttempt`

**Data Structure**:
```typescript
{
  attempt: number;
  delay: number;
}
```

---

### 30. `ws:reconnect_failed`
**ประเภท**: Internal Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**:
- `src/hooks/useWebSocket.ts:94`
- `src/services/websocket/WebSocketConnection.ts:432`

**หน้าที่**:
- แจ้งเตือนเมื่อพยายามเชื่อมต่อใหม่ล้มเหลว (ครบจำนวนครั้งที่กำหนด)

**การอัพเดทข้อมูล**:
- ตั้งค่า `isConnecting = false`
- แสดง toast error

---

### 31. `ws:pong`
**ประเภท**: Internal Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/services/websocket/WebSocketConnection.ts:319`

**หน้าที่**:
- รับการตอบกลับ ping จาก server (keep-alive)

**การอัพเดทข้อมูล**:
- ไม่มี (แค่ยืนยันการเชื่อมต่อ)

**Data Structure**:
```typescript
{
  timestamp: number;
}
```

---

### 32. `ws:message`
**ประเภท**: Internal Event
**สถานะ**: ✅ Implemented
**ไฟล์ที่ใช้**: `src/services/websocket/WebSocketConnection.ts:351`

**หน้าที่**:
- รับ raw message จาก WebSocket (ก่อนจะ parse เป็น specific events)

**การอัพเดทข้อมูล**:
- Parse และส่งต่อไปยัง specific event handlers

---

## สรุปสถานะการ Implement

### Events ที่ Implement ครบถ้วน ✅
**Message Events (5/6)**
- `message:message.receive`
- `message:message.edit`
- `message:message.read`
- `message:message.read_all`
- `message:message.delete`

**Conversation Events (5/7)**
- `message:conversation.list` (ใช้แต่ไม่ได้ define ใน types)
- `message:conversation.create`
- `message:conversation.join`
- `message:conversation.user_added`
- `message:conversation.user_removed`

**Friend Events (4/4)**
- `message:friend.request`
- `message:friend.accept`
- `message:friend.reject`
- `message:friend.remove`

**User Events (3/8)**
- `message:user.online`
- `message:user.offline`
- `message:user.status`

**WebSocket Connection Events (7/7)**
- `ws:open`
- `ws:close`
- `ws:error`
- `ws:reconnecting`
- `ws:reconnect_failed`
- `ws:pong`
- `ws:message`

**รวม: 24/32 events (75%)**

---

### Events ที่ยังไม่ได้ Implement ❌

1. **`message:message.updated`** - อาจซ้ำซ้อนกับ `message.edit`
2. **`message:conversation.updated`** - ใช้ dynamic event แทน (ชื่อไม่ตรง)
3. **`message:conversation.deleted`** - ใช้ dynamic event แทน (ชื่อไม่ตรง)
4. **`message:user.blocked`** - มี listener แต่ไม่ได้อัพเดท store
5. **`message:user.unblocked`** - มี listener แต่ไม่ได้อัพเดท store
6. **`message:user.status.subscribe`** - Outgoing event (ไม่ต้องมี listener)
7. **`message:user.status.unsubscribe`** - Outgoing event (ไม่ต้องมี listener)
8. **`message:user.status.subscribed`** - ยังไม่ได้ใช้

---

## ปัญหาที่พบ

### 1. Event Naming Inconsistency
**ปัญหา**: บาง events ใช้ชื่อไม่ตรงกับ type definition

**ตัวอย่าง**:
```typescript
// ใน types: 'message:conversation.updated'
// แต่ใช้: 'message:conversation_update'

// ใน types: 'message:conversation.deleted'
// แต่ใช้: 'message:conversation_delete'
```

**ผลกระทบ**:
- ต้องใช้ `onDynamic()` แทน type-safe `addEventListener()`
- ไม่มี type checking
- ยากต่อการ debug

**แนวทางแก้ไข**:
- แก้ไขชื่อ event ใน code ให้ตรงกับ types
- หรือแก้ไข types ให้ตรงกับ event ที่ส่งมาจาก backend

---

### 2. Missing Event Implementations
**ปัญหา**: มี event definitions แต่ไม่ได้ implement listeners

**Events ที่ควร implement**:

#### `message:user.status.subscribed`
- ใช้เพื่อรับสถานะเริ่มต้นหลัง subscribe
- ช่วยให้แน่ใจว่า subscribe สำเร็จ
- รับ initial status ของผู้ใช้

**แนวทางแก้ไข**:
```typescript
// ใน useOnlineStatus.ts
const unsubscribeSubscribed = addEventListener('message:user.status.subscribed', (data) => {
  if (data?.data?.user_id) {
    const userId = data.data.user_id;
    const isOnline = data.data.online === true;
    const timestamp = data.data.timestamp || new Date().toISOString();
    updateUserStatus(userId, isOnline, timestamp);
  }
});
```

---

### 3. Block/Unblock Events Not Updating Store
**ปัญหา**: `message:user.blocked` และ `message:user.unblocked` มี listeners แต่ไม่ได้อัพเดท store

**ผลกระทบ**:
- ต้อง refetch blocked users manually
- UI ไม่อัพเดททันที

**แนวทางแก้ไข**:
```typescript
// ใน useFriendship.ts
const unsubUserBlocked = addEventListener('message:user.blocked', (rawData) => {
  const data = rawData.data;

  // เพิ่มผู้ใช้เข้า blockedUsers store
  addToBlockedUsers({
    id: data.blocked_user_id,
    blocked_at: data.blocked_at
  });

  // ลบออกจาก friends ถ้ามี
  removeFromFriends(data.blocked_user_id);

  toast.warning('บล็อกผู้ใช้สำเร็จ');
});

const unsubUserUnblocked = addEventListener('message:user.unblocked', (rawData) => {
  const data = rawData.data;

  // ลบออกจาก blockedUsers store
  removeFromBlockedUsers(data.unblocked_user_id);

  toast.success('ปลดบล็อกสำเร็จ');
});
```

---

### 4. Missing Type Definition for `conversation.list`
**ปัญหา**: ใช้งาน `message:conversation.list` แต่ไม่ได้ define ใน `WebSocketEventMap`

**ผลกระทบ**:
- ต้อง type cast เป็น `any`
- ไม่มี type safety

**แนวทางแก้ไข**:
```typescript
// ใน websocket.types.ts
export interface WebSocketEventMap {
  // เพิ่ม event นี้
  'message:conversation.list': WebSocketEnvelope<ConversationDTO[]>;

  // ... events อื่นๆ
}
```

---

### 5. Duplicate/Overlapping Events
**ปัญหา**: มี events ที่อาจซ้ำซ้อนกัน

**ตัวอย่าง**:
- `message:message.edit` vs `message:message.updated`
- อาจจะมีจุดประสงค์ต่างกัน แต่ไม่ชัดเจน

**แนวทางแก้ไข**:
- ตรวจสอบกับ backend ว่า event ไหนใช้งาน
- ลบ event ที่ไม่ได้ใช้ออกจาก types
- เพิ่ม documentation อธิบายความแตกต่าง

---

## สรุป

### สิ่งที่ทำได้แล้ว ✅
1. Message events - ครบทุกอย่างที่จำเป็น
2. Conversation events - ครบส่วนใหญ่
3. Friend events - ครบทุก event
4. User status events - ทำงานได้ดี
5. Connection events - ครบทุก event

### สิ่งที่ควรปรับปรุง 🔧
1. แก้ไข event naming ให้สอดคล้องกัน
2. Implement `message:user.status.subscribed`
3. แก้ไข block/unblock events ให้อัพเดท store
4. เพิ่ม type definition สำหรับ `conversation.list`
5. ทำความสะอาด unused events

### สิ่งที่ควรพิจารณา 💭
1. เพิ่ม error handling สำหรับ WebSocket events
2. เพิ่ม retry logic สำหรับ failed subscriptions
3. เพิ่ม event logging สำหรับ debugging
4. พิจารณาใช้ TypeScript strict mode
5. เพิ่ม unit tests สำหรับ event handlers

---

**อัพเดทล่าสุด**: 2025-11-17
**เวอร์ชัน**: 1.0
**ผู้จัดทำ**: Claude Code
