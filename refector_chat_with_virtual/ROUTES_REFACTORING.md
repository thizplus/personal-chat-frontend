# Routes Refactoring Guide

## 🎯 ปัญหาของ Routes ปัจจุบัน

### Routes ซ้ำซ้อน

```tsx
// ❌ ปัญหา: 2 routes ใช้ component เดียวกัน
<Route path="/chat/dashboard" element={<ConversationPageDemo />} />
<Route path="/chat/dashboard/chat/:conversationId" element={<ConversationPageDemo />} />

// ❌ ปัญหา: มี 3 versions ของ layout
ChatLayout: /chat/dashboard
AppLayoutV2: /v2/dashboard
StandardLayout: /dashboard
```

### ผลกระทบ

1. **ซับซ้อนเกินความจำเป็น** - มี 3 versions แต่ใช้จริงแค่ 1
2. **Routes ซ้ำซ้อน** - ใช้ component เดียวกันแต่แยก routes
3. **User confusion** - URL ไม่สม่ำเสมอ
4. **Maintenance ยาก** - แก้ไข 1 feature ต้องอัพเดทหลาย routes

---

## ✅ Solution - Routes ใหม่ที่กระชับ

### แผนการปรับปรุง

```tsx
// ✅ ใหม่: Single route with optional param
<Route path="/chat/:conversationId?" element={<ConversationPageDemo />} />

// ✅ ลบ: Version เก่าที่ไม่ใช้
// - /v2/dashboard (ถ้าไม่ได้ใช้จริง)
// - /dashboard (เปลี่ยนเป็น redirect)

// ✅ Simplify: POC routes
// เก็บแค่ที่จำเป็น ลบ Virtua versions (เพราะใช้ Virtuoso แล้ว)
```

---

## 📋 Route Structure ใหม่

### URL Mapping

| URL | Page | Description |
|-----|------|-------------|
| **Main Routes** | | |
| `/chat` | ConversationPageDemo | List of conversations |
| `/chat/:conversationId` | ConversationPageDemo | Specific conversation |
| | | |
| **Legacy Routes (Redirect)** | | |
| `/` | → `/chat` | Home redirect |
| `/dashboard` | → `/chat` | Old dashboard redirect |
| `/dashboard/chat/:id` | → `/chat/:id` | Old chat redirect |
| | | |
| **Standalone Pages** | | |
| `/contacts` | FriendsPage | Friends/Contacts |
| `/settings` | SettingsPage | Settings |
| | | |
| **Auth Routes** | | |
| `/auth/login` | LoginPage | Login |
| `/auth/register` | RegisterPage | Register |
| | | |
| **POC Routes (Dev only)** | | |
| `/poc/chat/:id` | MinimalChatPOC | Testing POC |
| `/poc/virtuoso/:id` | VirtuosoEnhanced | Virtuoso POC |

---

## 🚀 Migration Steps

### Step 1: Backup ไฟล์เดิม

```bash
# Backup current routes
cp src/routes/index.tsx src/routes/index.backup.tsx

# Commit current state
git add .
git commit -m "chore: backup routes before refactoring"
```

### Step 2: Replace routes file

```bash
# Copy refactored version
cp src/routes/index.refactored.tsx src/routes/index.tsx
```

หรือ copy-paste เนื้อหาจาก `index.refactored.tsx` → `index.tsx`

### Step 3: ลบ imports ที่ไม่ใช้

```tsx
// ลบ imports เหล่านี้ (ถ้าไม่ใช้จริง):
// import AppLayoutV2 from '@/layouts/AppLayoutV2/AppLayoutV2'
// import ConversationPageV2 from '@/pages/v2/ConversationPageV2'
// import ChatConversationPage from '@/pages/chat/ConversationPage'
// import MinimalChatTanStack from '@/pages/poc/MinimalChatTanStack'
// import MinimalChatVirtua from '@/pages/poc/MinimalChatVirtua'
// import MinimalChatVirtuaEnhanced from '@/pages/poc/MinimalChatVirtuaEnhanced'
```

### Step 4: Testing

**ทดสอบทุก routes:**

- [ ] `/auth/login` - Login page
- [ ] `/auth/register` - Register page
- [ ] `/chat` - Conversation list (logged in)
- [ ] `/chat/:conversationId` - Specific conversation
- [ ] `/` - Redirect to `/chat`
- [ ] `/dashboard` - Redirect to `/chat`
- [ ] `/contacts` - Friends page
- [ ] `/settings` - Settings page
- [ ] `/poc/virtuoso/:id` - POC page (dev)

**ทดสอบ redirects:**

- [ ] `/dashboard` → `/chat`
- [ ] `/dashboard/chat/:id` → `/chat/:id`
- [ ] `/chat/dashboard` → `/chat`
- [ ] `/chat/dashboard/:id` → `/chat/:id`

### Step 5: อัพเดท Links/Navigation

**หาและแทนที่ links ใน code:**

```bash
# หา links ทั้งหมดที่ชี้ไป /dashboard
grep -r "/dashboard" src/ --include="*.tsx" --include="*.ts"

# หา links ที่ชี้ไป /chat/dashboard
grep -r "/chat/dashboard" src/ --include="*.tsx" --include="*.ts"
```

**แทนที่:**

```tsx
// ❌ เก่า
navigate('/dashboard')
navigate('/dashboard/chat/' + conversationId)
navigate('/chat/dashboard')
navigate('/chat/dashboard/chat/' + conversationId)

// ✅ ใหม่
navigate('/chat')
navigate('/chat/' + conversationId)
```

### Step 6: อัพเดท Tests (ถ้ามี)

```tsx
// อัพเดท test cases ที่ test routes
// เปลี่ยน URL ให้ตรงกับ structure ใหม่
```

### Step 7: Commit

```bash
git add .
git commit -m "refactor(routes): simplify route structure

- Merge /chat/dashboard routes into single /chat route
- Add optional :conversationId param to /chat
- Redirect old routes (/dashboard) to new routes (/chat)
- Remove duplicate POC routes (Virtua versions)
- Clean up unused imports

BREAKING CHANGE: /dashboard now redirects to /chat"
```

---

## 📊 Before & After Comparison

### Before (ซับซ้อน)

```tsx
{/* 3 different layouts */}
<Route element={<ChatLayout />}>
  <Route path="/chat/dashboard" element={<ConversationPageDemo />} />
  <Route path="/chat/dashboard/chat/:id" element={<ConversationPageDemo />} />
</Route>

<Route element={<AppLayoutV2 />}>
  <Route path="/v2/dashboard" element={<ConversationPageV2 />} />
  <Route path="/v2/dashboard/chat/:id" element={<ConversationPageV2 />} />
</Route>

<Route element={<StandardLayout />}>
  <Route path="/dashboard" element={<ConversationPage />} />
  <Route path="/dashboard/chat/:id" element={<ConversationPage />} />
</Route>

{/* 5 POC routes */}
<Route path="/poc/chat/:id" element={<MinimalChatPOC />} />
<Route path="/poc/chat-tanstack/:id" element={<MinimalChatTanStack />} />
<Route path="/poc/chat-virtua/:id" element={<MinimalChatVirtua />} />
<Route path="/poc/chat-virtua-enhanced/:id" element={<MinimalChatVirtuaEnhanced />} />
<Route path="/poc/chat-virtuoso-enhanced/:id" element={<MinimalChatVirtuosoEnhanced />} />
```

**Stats:**
- Layouts: 3
- Main routes: 6 (2 per layout)
- POC routes: 5
- Total lines: ~40 lines

### After (กระชับ)

```tsx
{/* 1 main layout */}
<Route element={<ChatLayout />}>
  <Route path="/chat/:conversationId?" element={<ConversationPageDemo />} />
</Route>

{/* Legacy redirects */}
<Route path="/dashboard" element={<Navigate to="/chat" replace />} />
<Route path="/dashboard/chat/:id" element={<Navigate to="/chat/:id" replace />} />

{/* 2 POC routes (essential only) */}
<Route path="/poc/chat/:id" element={<MinimalChatPOC />} />
<Route path="/poc/virtuoso/:id" element={<MinimalChatVirtuosoEnhanced />} />
```

**Stats:**
- Layouts: 1
- Main routes: 1 (with optional param)
- POC routes: 2
- Total lines: ~20 lines

**Improvement:**
- 📉 50% less code
- ✅ 1 main route (was 6)
- ✅ Clear URL structure
- ✅ Easy to maintain

---

## 🔧 Advanced: Dynamic route param

### ConversationPageDemo Implementation

Component ต้องรองรับ optional `conversationId`:

```tsx
// src/pages/chat/ConversationPageDemo.tsx
import { useParams } from 'react-router-dom';

export default function ConversationPageDemo() {
  const { conversationId } = useParams();

  return (
    <div className="flex h-screen">
      {/* Left: Conversation List - แสดงเสมอบน desktop */}
      <ConversationsList />

      {/* Right: Chat Area - แสดงเฉพาะเมื่อมี conversationId */}
      {conversationId ? (
        <ChatArea conversationId={conversationId} />
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
}
```

### Responsive Behavior

**Desktop:**
```
/chat               → Shows: List + WelcomeScreen
/chat/:id           → Shows: List + ChatArea
```

**Mobile:**
```
/chat               → Shows: List only
/chat/:id           → Shows: ChatArea only (with back button)
```

---

## ⚠️ Breaking Changes

### For Users

- `/dashboard` → redirect ไป `/chat`
- `/chat/dashboard` → redirect ไป `/chat`
- Bookmarks ต้องอัพเดท

### For Developers

- Navigation code ต้องเปลี่ยนจาก `/dashboard` → `/chat`
- Test cases ต้องอัพเดท URLs
- Deep links ต้องอัพเดท

---

## 🎯 Benefits

### Simplified Structure

```
✅ เข้าใจง่าย: /chat/:id? (แทน 6 routes)
✅ Maintain ง่าย: แก้ที่เดียว (แทน 3 ที่)
✅ Scale ง่าย: เพิ่ม feature ที่เดียว
```

### Better UX

```
✅ URL สั้นกระชับ: /chat/xxx
✅ Consistent: ไม่ต้องจำหลาย patterns
✅ Predictable: ทุก chat อยู่ใน /chat
```

### Performance

```
✅ Less code: 50% reduction
✅ Fewer components loaded: 1 layout instead of 3
✅ Smaller bundle: Remove unused layouts
```

---

## 🚦 Rollback Plan (ถ้าเจอปัญหา)

```bash
# Option 1: Restore from backup
cp src/routes/index.backup.tsx src/routes/index.tsx

# Option 2: Git revert
git revert HEAD

# Option 3: Reset to previous commit
git reset --hard HEAD~1
```

---

## 📝 Checklist

### Pre-refactor

- [ ] Backup `index.tsx`
- [ ] Git commit current state
- [ ] Review all current routes
- [ ] List all navigation calls in codebase

### During refactor

- [ ] Copy refactored routes
- [ ] Remove unused imports
- [ ] Test all routes manually
- [ ] Fix navigation calls
- [ ] Update tests

### Post-refactor

- [ ] All routes work
- [ ] Redirects work
- [ ] No console errors
- [ ] Navigation smooth
- [ ] Git commit with detailed message

---

## 🎓 Next Steps

1. **Review refactored routes** - เปิด `index.refactored.tsx`
2. **Test in dev** - Copy และทดสอบ
3. **Fix navigation** - Update navigate() calls
4. **Commit** - บันทึก changes
5. **Monitor** - ดู errors ใน production (ถ้ามี)

---

**Ready to simplify?** 🚀

File: `src/routes/index.refactored.tsx`
