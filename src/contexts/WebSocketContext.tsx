// src/contexts/WebSocketContext.tsx
import React, { createContext, type ReactNode, useContext, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '@/hooks/useWebSocket';
import WebSocketManager from '@/services/websocket/WebSocketManager';
import type { WebSocketEventMap } from '@/types/websocket.types';

interface WebSocketContextProps {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempt: number;
  connect: () => void;
  disconnect: () => void;
  addEventListener: <K extends keyof WebSocketEventMap>(
    event: K, 
    callback: (data: WebSocketEventMap[K]) => void
  ) => () => void;
  send: <T>(type: string, data: T) => boolean;
  
  // เพิ่ม methods สำหรับจัดการ user status subscriptions
  subscribeToUserStatus: (userId: string) => boolean;
  unsubscribeFromUserStatus: (userId: string) => boolean;
  getSubscribedUserStatuses: () => string[];
  resetConnection: () => void; // เพิ่มบรรทัดนี้
}

const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  // ดึง businessId จาก URL params (ถ้ามี)
  const { businessId } = useParams<{ businessId?: string }>();
  
  // เรียกใช้ hook พร้อมส่ง businessId (ถ้ามี)
  const websocket = useWebSocket({
    autoConnect: true,
    businessId
  });

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: WebSocketContextProps = useMemo(() => ({
    ...websocket,

    // เพิ่ม methods สำหรับจัดการ user status subscriptions
    subscribeToUserStatus: (userId: string) => {
      return WebSocketManager.subscribeToUserStatus(userId);
    },

    unsubscribeFromUserStatus: (userId: string) => {
      return WebSocketManager.unsubscribeFromUserStatus(userId);
    },

    getSubscribedUserStatuses: () => {
      return WebSocketManager.getSubscribedUserStatuses();
    },

    // เพิ่ม method สำหรับ reset connection
    resetConnection: () => {
      return WebSocketManager.resetConnection();
    }
  }), [websocket]);

  

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};