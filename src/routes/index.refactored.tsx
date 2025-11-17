// AppRoutes.tsx - Refactored & Cleaned
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import AuthLayout from '@/layouts/AuthLayout/AuthLayout'
import ChatLayout from '@/layouts/ChatLayout/ChatLayout'
import StandardLayout from '@/layouts/StandardLayout/StandardLayout'

// Auth Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

// Main Chat Page (Latest - shadcn sidebar)
import ConversationPageDemo from '@/pages/chat/ConversationPageDemo'

// Legacy Pages (for backward compatibility)
import ConversationPage from '@/pages/standard/converstion/ConversationPage'
import FriendsPage from '@/pages/standard/friend/FriendsPage'
import SettingsPage from '@/pages/standard/setting/SettingsPage'

// POC Pages (Development/Testing only)
import VirtualMessageListPOC from '@/components/poc/VirtualMessageListPOC'
import MinimalChatPOC from '@/pages/poc/MinimalChatPOC'
import MinimalChatVirtuosoEnhanced from '@/pages/poc/MinimalChatVirtuosoEnhanced'

export default function AppRoutes() {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated)

  return (
    <Routes>
      {/* ============================================
          PUBLIC ROUTES (No Auth Required)
          ============================================ */}

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />
      </Route>

      {/* POC Routes (Public for easy testing) */}
      <Route path="/poc/virtual-scroll" element={<VirtualMessageListPOC />} />

      {/* ============================================
          PROTECTED ROUTES (Auth Required)
          ============================================ */}

      {isAuthenticated ? (
        <>
          {/* ==========================================
              MAIN CHAT ROUTES (Latest Version)
              ========================================== */}
          <Route element={<ChatLayout />}>
            {/* Single route with optional conversationId */}
            <Route
              path="/chat/:conversationId?"
              element={<ConversationPageDemo />}
            />

            {/* Alias for backward compatibility */}
            <Route
              path="/chat/dashboard/:conversationId?"
              element={<Navigate to="/chat" replace />}
            />
          </Route>

          {/* ==========================================
              LEGACY ROUTES (Backward Compatibility)
              ========================================== */}
          <Route element={<StandardLayout />}>
            {/* Redirect old routes to new chat */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/dashboard" element={<Navigate to="/chat" replace />} />
            <Route
              path="/dashboard/chat/:conversationId"
              element={<Navigate to="/chat/:conversationId" replace />}
            />

            {/* Legacy pages (keep for now) */}
            <Route path="/contacts" element={<FriendsPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Keep old dashboard for fallback (optional - can remove) */}
            <Route path="/legacy/dashboard" element={<ConversationPage />} />
          </Route>

          {/* ==========================================
              POC ROUTES (Development/Testing)
              ========================================== */}
          <Route path="/poc/chat/:conversationId" element={<MinimalChatPOC />} />
          <Route path="/poc/virtuoso/:conversationId" element={<MinimalChatVirtuosoEnhanced />} />
        </>
      ) : (
        /* Redirect unauthenticated users to login */
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      )}

      {/* ============================================
          FALLBACK (404)
          ============================================ */}
      <Route path="*" element={<Navigate to="/chat" replace />} />
    </Routes>
  )
}
