// src/lib/utils/messageTextUtils.ts

import type { MessageDTO } from '@/types/message.types';
import React from 'react';

/**
 * สร้างข้อความสำหรับแสดงใน last_message_text ตามประเภทข้อความ
 */
export const getLastMessageText = (message: MessageDTO): string => {
  switch (message.message_type) {
    case 'text':
      return message.content || '';
      
    case 'sticker':
      return 'ส่งสติกเกอร์';
      
    case 'image':
      return 'ส่งรูปภาพ';
      
    case 'file':
      return 'ส่งไฟล์';
      
    case 'voice':
      return 'ส่งข้อความเสียง';
      
    case 'video':
      return 'ส่งวิดีโอ';
      
    case 'location':
      return 'ส่งตำแหน่ง';
      
    case 'contact':
      return 'ส่งรายชื่อติดต่อ';
      
    default:
      // สำหรับประเภทข้อความที่ไม่รู้จัก
      return message.content || 'ส่งข้อความ';
  }
};

/**
 * สร้างข้อความสำหรับแสดงใน last_message_text สำหรับข้อความที่ได้รับ
 */
export const getReceivedMessageText = (message: MessageDTO): string => {
  switch (message.message_type) {
    case 'text':
      return message.content || '';
      
    case 'sticker':
      return 'ได้รับสติกเกอร์';
      
    case 'image':
      return 'ได้รับรูปภาพ';
      
    case 'file':
      return 'ได้รับไฟล์';
      
    case 'voice':
      return 'ได้รับข้อความเสียง';
      
    case 'video':
      return 'ได้รับวิดีโอ';
      
    case 'location':
      return 'ได้รับตำแหน่ง';
      
    case 'contact':
      return 'ได้รับรายชื่อติดต่อ';
      
    default:
      return message.content || 'ได้รับข้อความ';
  }
};

/**
 * สร้างข้อความ last_message_text โดยดูจาก sender
 */
export const getLastMessageTextBySender = (message: MessageDTO, currentUserId: string): string => {
  const isOwnMessage = message.sender_id === currentUserId;

  if (isOwnMessage) {
    return getLastMessageText(message); // ส่ง...
  } else {
    return getReceivedMessageText(message); // ได้รับ...
  }
};

/**
 * URL detection regex pattern
 * Matches http://, https://, www., and common TLDs
 */
const URL_REGEX = /(?:(?:https?:)?\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/gi;

/**
 * แปลงข้อความที่มี URL ให้เป็น clickable links
 * @param text - ข้อความที่ต้องการแปลง
 * @param linkClassName - CSS classes สำหรับลิงก์
 * @returns Array ของ React elements (text และ links)
 */
export const linkifyText = (text: string, linkClassName?: string): (string | React.ReactElement)[] => {
  if (!text) return [text];

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // Reset regex lastIndex
  URL_REGEX.lastIndex = 0;

  while ((match = URL_REGEX.exec(text)) !== null) {
    const url = match[0];
    const startIndex = match.index;

    // Add text before the URL
    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    // Ensure URL has protocol for href
    let href = url;
    if (!url.match(/^https?:\/\//i)) {
      href = 'https://' + url;
    }

    // Add the link
    parts.push(
      React.createElement(
        'a',
        {
          key: `link-${startIndex}`,
          href: href,
          target: '_blank',
          rel: 'noopener noreferrer',
          className: linkClassName || 'underline hover:opacity-80 break-all',
          onClick: (e: React.MouseEvent) => e.stopPropagation()
        },
        url
      )
    );

    lastIndex = startIndex + url.length;
  }

  // Add remaining text after the last URL
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no URLs were found, return the original text
  return parts.length === 0 ? [text] : parts;
};