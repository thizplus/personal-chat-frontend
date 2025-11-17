// src/components/mobile-bottom-nav.tsx
import { MessageSquare, Users, Settings } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

interface NavItem {
  path: string
  icon: typeof MessageSquare
  label: string
}

const NAV_ITEMS: NavItem[] = [
  {
    path: "/chat",
    icon: MessageSquare,
    label: "แชท",
  },
  {
    path: "/chat/contacts",
    icon: Users,
    label: "รายชื่อ",
  },
  {
    path: "/chat/settings",
    icon: Settings,
    label: "ตั้งค่า",
  },
]

export function MobileBottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === "/chat") {
      // For /chat, match exactly or with conversationId
      return location.pathname === "/chat" || location.pathname.startsWith("/chat/") && !location.pathname.startsWith("/chat/contacts") && !location.pathname.startsWith("/chat/settings")
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "fill-current")} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
