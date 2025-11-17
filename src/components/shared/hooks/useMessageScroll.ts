// src/components/shared/hooks/useMessageScroll.ts
import { useState, useRef, useEffect, useCallback } from 'react';
import type { MessageDTO } from '@/types/message.types';

interface UseMessageScrollProps {
  messages: MessageDTO[];
  currentUserId: string;
  activeConversationId: string;
  isLoadingHistory?: boolean;
  onLoadMore?: () => void;
  isBusinessView?: boolean;
}

/**
 * Custom hook สำหรับจัดการ scrolling behavior ในพื้นที่แสดงข้อความ
 */
export function useMessageScroll({
  messages,
  currentUserId,
  activeConversationId,
  isLoadingHistory = false,
  onLoadMore,
  isBusinessView = false
}: UseMessageScrollProps) {
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef<number>(messages.length);
  const isInitialRenderRef = useRef<boolean>(true);
  const isLoadingMoreRef = useRef<boolean>(false);
  const scrollAnimationRef = useRef<number>(0);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const previousScrollDataRef = useRef<{ height: number, position: number } | null>(null);
  const isLoadingOlderMessagesRef = useRef<boolean>(false);
  const scrollPositionRestoredRef = useRef<boolean>(false);
  const lastScrollRestoreTimeRef = useRef<number>(0);

  // State
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [newMessagesCount, setNewMessagesCount] = useState<number>(0);

  // ฟังก์ชันสำหรับตรวจสอบว่าผู้ใช้อยู่ที่ด้านล่างสุดหรือไม่
  const isUserAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return false;
    
    // เพิ่มค่า threshold ให้มากขึ้น เพื่อให้เลื่อนลงล่างสุดง่ายขึ้น
    const threshold = 150;
    const isBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    
    return isBottom;
  }, []);

  // ฟังก์ชันสำหรับเลื่อนลงล่างสุด (แบบ smooth)
  const scrollToBottom = useCallback((force: boolean = false) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // ยกเลิก animation frame ก่อนหน้าถ้ามี
    cancelAnimationFrame(scrollAnimationRef.current);
    
    // ใช้ requestAnimationFrame เพื่อให้แน่ใจว่า DOM ได้อัปเดตก่อน
    scrollAnimationRef.current = requestAnimationFrame(() => {
      try {
        // ใช้ scrollTo ด้วย behavior: 'smooth' เพื่อให้เลื่อนแบบนุ่มนวล
        container.scrollTo({
          top: container.scrollHeight,
          behavior: force ? 'auto' : 'smooth'
        });
      } catch (error) {
        // Fallback สำหรับ browser ที่ไม่รองรับ smooth scrolling
        container.scrollTop = container.scrollHeight;
        console.error('Error scrolling to bottom:', error);
      }
      
      setShowScrollButton(false);
      setNewMessagesCount(0);
    });
  }, []);

  // ฟังก์ชันสำหรับเลื่อนไปที่ข้อความที่ระบุ
  const scrollToMessage = useCallback((messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      // เลื่อนไปที่ข้อความนั้นๆ แบบ smooth (มีอยู่แล้ว)
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // หา element ที่เป็นตัวข้อความจริงๆ (bubble)
      const messageBubble = messageElement.querySelector('.rounded-2xl');
      
      if (messageBubble) {
        // เพิ่ม class animation
        messageBubble.classList.add('animate-bounce', 'shadow-lg');
        
        // ลบ class หลังจากผ่านไป 1 วินาที
        setTimeout(() => {
          messageBubble.classList.remove('animate-bounce', 'shadow-lg');
        }, 1000);
      }
    }
  }, []);

  // ฟังก์ชันสำหรับจัดการการรักษาตำแหน่ง scroll
  const restoreScrollPosition = useCallback((prevPosition: number, heightDiff: number) => {
    const container = messagesContainerRef.current;
    if (!container) return;

    // ป้องกันการเรียกซ้ำในระยะเวลาสั้นๆ
    const now = Date.now();
    if (now - lastScrollRestoreTimeRef.current < 300) {
      return;
    }
    
    lastScrollRestoreTimeRef.current = now;
    scrollPositionRestoredRef.current = true;
    
    const newScrollPosition = prevPosition + heightDiff;
    
    // รักษาตำแหน่งการเลื่อนโดยเพิ่มความแตกต่างของความสูง
    container.scrollTop = newScrollPosition;
  }, []);

  // ฟังก์ชันสำหรับ reset state หลังจากโหลดข้อความเสร็จ
  const resetLoadingState = useCallback(() => {
    isLoadingMoreRef.current = false;
    isLoadingOlderMessagesRef.current = false;
    previousScrollDataRef.current = null;
    scrollPositionRestoredRef.current = false;
  }, []);

  // ฟังก์ชันสำหรับจัดการ scroll - ปรับปรุงเพื่อป้องกันการ trigger ซ้ำ
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // ตรวจสอบว่าควรแสดงปุ่มเลื่อนลงหรือไม่
    const shouldShowButton = !isUserAtBottom();
    setShowScrollButton(shouldShowButton);
    
    // ถ้าไม่มี onLoadMore หรือกำลังโหลดอยู่แล้ว ให้ออกจากฟังก์ชัน
    if (!onLoadMore || isLoadingHistory || isLoadingMoreRef.current || isLoadingOlderMessagesRef.current) {
      return;
    }
    
    // ถ้าเลื่อนขึ้นไปใกล้ด้านบน
    if (container.scrollTop < 50) {
      // บันทึกตำแหน่งปัจจุบัน
      const scrollHeight = container.scrollHeight;
      const scrollPosition = container.scrollTop;
      
      // สำคัญ: ต้องตั้งค่า flags ก่อนเรียก onLoadMore เพื่อป้องกันการเรียกซ้ำ
      isLoadingMoreRef.current = true;
      isLoadingOlderMessagesRef.current = true;
      scrollPositionRestoredRef.current = false;
      
      // บันทึกข้อมูลตำแหน่งเลื่อน
      previousScrollDataRef.current = {
        height: scrollHeight,
        position: scrollPosition
      };
      
      // โหลดข้อความเพิ่มเติม
      onLoadMore();
    }
  }, [isLoadingHistory, onLoadMore, isUserAtBottom]);

  // ใช้ useEffect เพื่อจัดการ event listener สำหรับ scroll
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // เพิ่ม CSS property เพื่อให้การ scroll smooth มากขึ้น
    container.style.scrollBehavior = 'smooth';
    
    let scrollTimeout: number;
    
    const debouncedHandleScroll = () => {
      // Simple debounce logic
      clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        if (isLoadingMoreRef.current || isLoadingOlderMessagesRef.current) return;
        handleScroll();
      }, 100);
    };
    
    container.addEventListener('scroll', debouncedHandleScroll);
    
    return () => {
      container.removeEventListener('scroll', debouncedHandleScroll);
      clearTimeout(scrollTimeout);
      // Reset CSS property
      container.style.scrollBehavior = '';
    };
  }, [handleScroll]);
  
  // ใช้ Intersection Observer สำหรับตรวจจับเมื่อเลื่อนถึงด้านบน
  useEffect(() => {
    if (!onLoadMore || isLoadingHistory) return;
    
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // ฟังก์ชันที่จะเรียกเมื่อ sentinel element เข้ามาในหน้าจอ
    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isLoadingOlderMessagesRef.current && !isLoadingMoreRef.current) {
          // บันทึกตำแหน่งการเลื่อนก่อนโหลดข้อความเพิ่มเติม
          isLoadingMoreRef.current = true;
          isLoadingOlderMessagesRef.current = true;
          scrollPositionRestoredRef.current = false;
          
          previousScrollDataRef.current = {
            height: container.scrollHeight,
            position: container.scrollTop
          };
          
          // โหลดข้อความเพิ่มเติม
          onLoadMore();
        }
      });
    };
    
    // สร้าง Intersection Observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: container,
      threshold: 0.1,
      rootMargin: '50px 0px 0px 0px'
    });
    
    // เริ่มสังเกต sentinel ถ้ามี
    if (topSentinelRef.current) {
      observerRef.current.observe(topSentinelRef.current);
    }
    
    return () => {
      // ยกเลิกการสังเกต
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [onLoadMore, isLoadingHistory]);
  
  // จัดการการเลื่อนเมื่อข้อความเปลี่ยนแปลง
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    
    // เช็คว่าจำนวนข้อความเปลี่ยนแปลงหรือไม่
    const prevCount = prevMessagesLengthRef.current;
    const currentCount = messages.length;
  
    // กรณีที่กำลังโหลดข้อความเก่ากว่า (จากการเลื่อนขึ้นบน)
    if (isLoadingOlderMessagesRef.current && previousScrollDataRef.current && currentCount > prevCount && !scrollPositionRestoredRef.current) {
      // คำนวณความแตกต่างของความสูง
      const prevHeight = previousScrollDataRef.current.height;
      const prevPosition = previousScrollDataRef.current.position;
      const currentHeight = container.scrollHeight;
      const heightDiff = currentHeight - prevHeight;
      
      // ใช้ microtask (หรือ setTimeout ระยะสั้น) เพื่อให้ DOM rendering เสร็จสมบูรณ์ก่อน
      queueMicrotask(() => {
        // รักษาตำแหน่งการเลื่อน - ต้องปิด smooth ชั่วคราว เพื่อให้รักษาตำแหน่งได้แม่นยำ
        const tempScrollBehavior = container.style.scrollBehavior;
        container.style.scrollBehavior = 'auto';
        restoreScrollPosition(prevPosition, heightDiff);
        
        // คืนค่า scrollBehavior
        setTimeout(() => {
          container.style.scrollBehavior = tempScrollBehavior;
        }, 10);
        
        // รีเซ็ตข้อมูลหลังจากการเลื่อนเสร็จสมบูรณ์ - ต้องรอให้นานพอ
        setTimeout(resetLoadingState, 150); 
      });
    } 
    // กรณีการโหลดครั้งแรกหรือเปลี่ยน conversation
    else if (isInitialRenderRef.current && currentCount > 0) {
      // เลื่อนไปล่างสุดทันที (ใช้ smooth = false)
      requestAnimationFrame(() => {
        if (container) {
          // ในกรณีแรก ไม่ใช้ smooth เพื่อให้เลื่อนลงล่างสุดทันที
          scrollToBottom(true);
        }
        isInitialRenderRef.current = false;
      });
    } 
    // กรณีมีข้อความใหม่เข้ามา (ไม่ใช่จากการโหลดข้อความเก่า)
    else if (currentCount > prevCount && !isLoadingOlderMessagesRef.current) {
      // เช็คว่าอยู่ที่ด้านล่างสุดหรือไม่
      const isAtBottom = isUserAtBottom();
      
      // ตรวจสอบว่าเป็นข้อความของเราเองหรือไม่
      const latestMessage = currentCount > 0 ? messages[currentCount - 1] : null;
      const isOurMessage = latestMessage && (
        isBusinessView 
          ? (latestMessage.sender_type === 'business' || latestMessage.sender_type === 'admin')
          : latestMessage.sender_id === currentUserId
      );
      
      // กรณีส่งข้อความเอง หรืออยู่ที่ด้านล่างอยู่แล้ว ให้เลื่อนลงล่างสุด
      if (isOurMessage || isAtBottom) {
        // รอให้ DOM render เสร็จก่อนเลื่อนลงล่าง - ใช้ smooth
        setTimeout(() => {
          scrollToBottom(false); // smooth = true
        }, 50);
      } else {
        // ถ้าไม่ได้อยู่ที่ด้านล่างสุด เพิ่มจำนวนข้อความใหม่
        setNewMessagesCount(prev => prev + 1);
      }
    }
    // กรณีมีการรีเซ็ต
    else if (currentCount < prevCount) {
      setTimeout(() => {
        scrollToBottom(false); // ใช้ smooth
      }, 50);
    }
    
    // อัปเดตจำนวนข้อความในรอบก่อนหน้า
    prevMessagesLengthRef.current = currentCount;
  }, [messages, currentUserId, isUserAtBottom, scrollToBottom, restoreScrollPosition, resetLoadingState, isBusinessView]);

  // เพิ่ม effect สำหรับจัดการ URL parameter change หรือการเลือก conversation ใหม่
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && messages.length > 0) {
      // เลื่อนไปล่างสุดทันทีเมื่อเปลี่ยนห้องแชท - ไม่ใช้ smooth
      requestAnimationFrame(() => {
        scrollToBottom(true); // force = true ให้เลื่อนทันทีไม่ใช้ smooth
      });
      
      // รีเซ็ต state
      isInitialRenderRef.current = false;
      prevMessagesLengthRef.current = messages.length;
      isLoadingOlderMessagesRef.current = false;
      isLoadingMoreRef.current = false;
      previousScrollDataRef.current = null;
      scrollPositionRestoredRef.current = false;
      setNewMessagesCount(0);
    }
  }, [activeConversationId, scrollToBottom]);

  return {
    // Refs
    messagesEndRef,
    messagesContainerRef,
    topSentinelRef,
    
    // State
    showScrollButton,
    newMessagesCount,
    
    // Handlers
    scrollToMessage,
    scrollToBottom: (force = false) => scrollToBottom(force), // ส่งต่อ parameter
    isUserAtBottom,
    
    // Helper flags
    isInitialRender: isInitialRenderRef.current,
    isLoadingOlderMessages: isLoadingOlderMessagesRef.current
  };
}