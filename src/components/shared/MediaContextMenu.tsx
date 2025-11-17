// src/components/shared/MediaContextMenu.tsx
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';

interface MediaContextMenuProps {
  children: React.ReactNode;
  onJumpToMessage: () => void;
}

/**
 * Context Menu สำหรับ Media Items (Photos, Videos, Files, Links)
 * แสดงเมนูเมื่อคลิกขวา
 */
export const MediaContextMenu: React.FC<MediaContextMenuProps> = ({
  children,
  onJumpToMessage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  // ปิดเมนูเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // จัดการคลิกขวา
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;

    setPosition({ x, y });
    setIsOpen(true);
  };

  // จัดการคลิกเมนู
  const handleMenuClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        {children}
      </div>

      {/* Context Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div
            ref={menuRef}
            className="fixed z-50 min-w-[200px] rounded-md border border-border bg-popover shadow-md"
            style={{
              top: `${position.y}px`,
              left: `${position.x}px`,
            }}
          >
            <div className="p-1">
              <button
                onClick={() => handleMenuClick(onJumpToMessage)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <MessageSquare size={16} />
                <span>ไปที่ข้อความนี้</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};
