// src/pages/chat/ConversationPage.tsx
import { useParams } from "react-router-dom"
import { useConversationPageLogic } from "@/pages/standard/converstion/hooks/useConversationPageLogic"

// Import components
import ChatHeader from "@/components/standard/conversation/ChatHeader"
import MessageArea from "@/components/shared/MessageArea"
import MessageInputArea from "@/components/shared/MessageInputArea"
import EmptyConversationView from "@/components/standard/conversation/EmptyConversationView"

/**
 * ConversationPage - ใช้กับ ChatLayout (shadcn sidebar pattern)
 *
 * โครงสร้าง:
 * ┌──────────────────────────────────────────┐
 * │ ChatLayout (AppSidebar + SidebarInset)   │
 * │ ├─ AppSidebar                            │
 * │ │  ├─ Icon nav                           │
 * │ │  └─ Conversation list                  │
 * │ └─ SidebarInset (this page)              │
 * │    ├─ ChatHeader                         │
 * │    ├─ MessageArea (Virtua scroll)        │
 * │    └─ MessageInputArea                   │
 * └──────────────────────────────────────────┘
 *
 * หมายเหตุ: ConversationsList ย้ายไปอยู่ใน AppSidebar แล้ว
 */
export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()

  // ใช้ logic เดิม
  const {
    activeConversationId,
    conversationMessages,
    isSending,
    isLoadingMoreMessages,
    replyingTo,
    currentUserId,
    activeChat,
    chatPartnerId,
    isUserOnline,
    handleSendMessage,
    handleSendSticker,
    handleUploadImage,
    handleUploadFile,
    handleLoadMoreMessages,
    handleReplyToMessage,
    handleEditMessage,
    handleResendMessage,
    handleCancelReply,
    handleJumpToMessage,
    togglePin,
    toggleMute,
    messageAreaRef,
  } = useConversationPageLogic(conversationId)

  return (
    <div className="flex flex-1 flex-col h-screen overflow-hidden">
      {activeConversationId && activeChat ? (
        <>
          {/* Chat Header - fixed height */}
          <ChatHeader
            activeChat={activeChat}
            otherUserId={chatPartnerId}
            currentUserId={currentUserId}
            isUserOnline={isUserOnline}
            onToggleMute={async () => {
              if (!activeConversationId) return false
              return toggleMute(activeConversationId, !activeChat.is_muted)
            }}
            onTogglePin={async () => {
              if (!activeConversationId) return false
              return togglePin(activeConversationId, !activeChat.is_pinned)
            }}
            onLeaveGroup={async () => {
              console.log("Leave group not implemented yet")
              return false
            }}
            onJumpToMessage={handleJumpToMessage}
          />

          {/* Message Area - flex-1 with Virtua scroll */}
          <MessageArea
            ref={messageAreaRef}
            messages={conversationMessages}
            isLoadingHistory={isLoadingMoreMessages}
            isBusinessView={false}
            onLoadMore={handleLoadMoreMessages}
            currentUserId={currentUserId}
            activeConversationId={activeConversationId}
            onReplyMessage={handleReplyToMessage}
            onEditMessage={handleEditMessage}
            onResendMessage={handleResendMessage}
          />

          {/* Message Input - fixed height */}
          <MessageInputArea
            onSendMessage={handleSendMessage}
            onSendSticker={handleSendSticker}
            onUploadImage={handleUploadImage}
            onUploadFile={handleUploadFile}
            isLoading={isSending}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
          />
        </>
      ) : (
        <EmptyConversationView />
      )}
    </div>
  )
}
