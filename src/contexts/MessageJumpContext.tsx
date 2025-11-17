// src/contexts/MessageJumpContext.tsx
import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

interface MessageJumpContextType {
  jumpToMessage: ((messageId: string) => void) | null;
  setJumpToMessage: (fn: (messageId: string) => void) => void;
}

const MessageJumpContext = createContext<MessageJumpContextType | undefined>(undefined);

export function MessageJumpProvider({ children }: { children: ReactNode }) {
  const [jumpToMessage, setJumpToMessageState] = useState<((messageId: string) => void) | null>(null);

  const setJumpToMessage = useCallback((fn: (messageId: string) => void) => {
    setJumpToMessageState(() => fn);
  }, []);

  return (
    <MessageJumpContext.Provider value={{ jumpToMessage, setJumpToMessage }}>
      {children}
    </MessageJumpContext.Provider>
  );
}

export function useMessageJump() {
  const context = useContext(MessageJumpContext);
  if (context === undefined) {
    throw new Error('useMessageJump must be used within a MessageJumpProvider');
  }
  return context;
}
