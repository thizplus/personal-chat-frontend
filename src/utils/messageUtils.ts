// src/lib/utils/messageUtils.ts

import type { MessageDTO, MessageMetadata } from '@/types/message.types';

/**
 * ดึงข้อมูลไฟล์จาก message โดยตรวจสอบทั้ง field ตรงและ metadata
 */
export const getFileInfoFromMessage = (message: MessageDTO) => {
  // ลองดึงจาก field ตรงก่อน
  let fileName = message.file_name;
  let fileSize = message.file_size;
  let fileType = message.file_type;

  // ถ้าไม่มี ลองดึงจาก metadata
  if (!fileName && message.metadata) {
    fileName = (message.metadata as MessageMetadata).file_name;
    fileSize = (message.metadata as MessageMetadata).file_size;
    fileType = (message.metadata as MessageMetadata).file_type;
  }

  // ถ้ายังไม่มี ลองใช้ content
  if (!fileName) {
    fileName = message.content;
  }

  return {
    fileName: fileName || 'Unknown file',
    fileSize: fileSize || 0,
    fileType: fileType || 'application/octet-stream',
    format: (message.metadata as MessageMetadata)?.format || '',
    publicId: (message.metadata as MessageMetadata)?.public_id || ''
  };
};

/**
 * ตรวจสอบว่าไฟล์เป็นรูปภาพหรือไม่
 */
export const isImageFile = (fileType: string, fileName: string): boolean => {
  // ตรวจสอบจาก MIME type
  if (fileType?.startsWith('image/')) return true;
  
  // ตรวจสอบจาก file extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const extension = fileName?.toLowerCase().substring(fileName.lastIndexOf('.'));
  return imageExtensions.includes(extension || '');
};

/**
 * ตรวจสอบว่าไฟล์เป็นประเภทวิดีโอหรือไม่
 */
export const isVideoFile = (fileType: string, fileName: string): boolean => {
  // ตรวจสอบจาก MIME type
  if (fileType?.startsWith('video/')) return true;
  
  // ตรวจสอบจาก file extension
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  const extension = fileName?.toLowerCase().substring(fileName.lastIndexOf('.'));
  return videoExtensions.includes(extension || '');
};

/**
 * ตรวจสอบว่าไฟล์เป็นประเภทเสียงหรือไม่
 */
export const isAudioFile = (fileType: string, fileName: string): boolean => {
  // ตรวจสอบจาก MIME type
  if (fileType?.startsWith('audio/')) return true;
  
  // ตรวจสอบจาก file extension
  const audioExtensions = ['.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a'];
  const extension = fileName?.toLowerCase().substring(fileName.lastIndexOf('.'));
  return audioExtensions.includes(extension || '');
};

/**
 * ได้ icon ที่เหมาะสมตาม file type
 */
export const getFileIcon = (fileType: string, fileName: string): string => {
  if (isImageFile(fileType, fileName)) return '🖼️';
  if (isVideoFile(fileType, fileName)) return '🎬';
  if (isAudioFile(fileType, fileName)) return '🎵';
  
  // ตรวจสอบจาก file extension อื่นๆ
  const extension = fileName?.toLowerCase().substring(fileName.lastIndexOf('.'));
  
  switch (extension) {
    case '.pdf':
      return '📄';
    case '.doc':
    case '.docx':
      return '📝';
    case '.xls':
    case '.xlsx':
      return '📊';
    case '.ppt':
    case '.pptx':
      return '📋';
    case '.zip':
    case '.rar':
    case '.7z':
      return '🗜️';
    case '.txt':
      return '📃';
    default:
      return '📁';
  }
};

export function sortAndGroupMessages(messages: MessageDTO[]) {
  // จัดเรียงข้อความจากเก่าไปใหม่
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  
  // จัดกลุ่มข้อความ
  return sortedMessages.map((message, index, arr) => {
    const prevMessage = index > 0 ? arr[index - 1] : null;
    const nextMessage = index < arr.length - 1 ? arr[index + 1] : null;
    
    // ข้อความเป็นกลุ่มเดียวกันเมื่อส่งจากคนเดียวกันและห่างกันไม่เกิน 2 นาที
    const isFirstInGroup = !prevMessage || 
      prevMessage.sender_id !== message.sender_id || 
      (new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() > 120000);
    
    const isLastInGroup = !nextMessage || 
      nextMessage.sender_id !== message.sender_id || 
      (new Date(nextMessage.created_at).getTime() - new Date(message.created_at).getTime() > 120000);
    
    return {
      ...message,
      isFirstInGroup,
      isLastInGroup
    };
  });
}

/**
 * ฟังก์ชันสำหรับกำหนดสถานะข้อความ
 * @param message ข้อความ
 * @param isUser สถานะว่าเป็นข้อความของผู้ใช้หรือไม่
 * @returns สถานะข้อความ
 */
export function getMessageStatus(message: MessageDTO, isUser: boolean) {
  if (!isUser) return undefined;
  if (message.is_deleted) return undefined;

  // ✅ Backend now sends status field - use it directly
  if (message.status) {
    return message.status;
  }

  // Fallback: temp message detection (should rarely happen now)
  if (message.id === message.temp_id) {
    return 'sending';
  }

  return 'sent';
}

/**
 * ฟังก์ชันสำหรับแปลงข้อความที่ตอบกลับให้อยู่ในรูปแบบที่พร้อมแสดง
 * @param message ข้อความที่ต้องการแปลง
 * @returns ข้อความที่แปลงแล้ว
 */
export function formatReplyingToMessage(message: MessageDTO): string {
  if (!message) return '[ข้อความ]';
  
  switch (message.message_type) {
    case 'text':
      return message.content || '';
    case 'sticker':
      return '[สติกเกอร์]';
    case 'image':
      return message.content ? `[รูปภาพ] ${message.content}` : '[รูปภาพ]';
    case 'file':
      return `[ไฟล์] ${message.file_name || ''}`;
    default:
      return '[ข้อความ]';
  }
}

/**
 * ฟังก์ชันสำหรับ format เวลา
 * @param timestamp เวลาในรูปแบบ ISO string
 * @returns เวลาในรูปแบบที่อ่านง่าย
 */
export function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}


export const getAdminInfoFromMessage = (message: MessageDTO) => {
  if (!message.metadata) {
    //console.log('[getAdminInfoFromMessage] No metadata found');
    return undefined;
  }

  const metadata = message.metadata as MessageMetadata;
  
  //console.log('[getAdminInfoFromMessage] Metadata:', metadata);
  
  // ตรวจสอบว่ามี admin_display_name หรือไม่
  if (!metadata.admin_display_name) {
   // console.log('[getAdminInfoFromMessage] No admin_display_name found');
    return undefined;
  }

  return {
    admin_display_name: metadata.admin_display_name,
    admin_role: metadata.admin_role || 'staff',
    admin_id: metadata.admin_id
  };
};

/**
 * สร้างข้อความแสดงชื่อและตำแหน่งของ admin
 * @param message ข้อความที่ต้องการสร้างข้อความแสดงชื่อ admin
 * @returns ข้อความแสดงชื่อและตำแหน่งของ admin หรือชื่อผู้ส่งปกติถ้าไม่ใช่ admin
 */
export const getFormattedSenderInfo = (message: MessageDTO): string => {
  /*
  console.log('[getFormattedSenderInfo] Message:', {
    id: message.id,
    sender_type: message.sender_type,
    sender_name: message.sender_name,
    metadata: message.metadata
  });
  */

  // ถ้าเป็นข้อความจากธุรกิจ ให้ดึงข้อมูล admin
  if (message.sender_type === 'business') {
    const adminInfo = getAdminInfoFromMessage(message);
    
//console.log('[getFormattedSenderInfo] AdminInfo:', adminInfo);
    
    if (adminInfo) {
      // แปลง role เป็นภาษาไทย
      const roleMap: Record<string, string> = {
        'owner': 'เจ้าของ',
        'admin': 'แอดมิน',
        'staff': 'พนักงาน'
      };
      
      const thaiRole = roleMap[adminInfo.admin_role] || adminInfo.admin_role;
      
      // รูปแบบ: ชื่อ (ตำแหน่ง)
      const result = `${adminInfo.admin_display_name} (${thaiRole})`;
     // console.log('[getFormattedSenderInfo] Result:', result);
      return result;
    }
  }
  
  // กรณีไม่ใช่ข้อความจากธุรกิจหรือไม่มีข้อมูล admin
 // console.log('[getFormattedSenderInfo] Fallback to sender_name:', message.sender_name);
  return message.sender_name || 'ผู้ใช้';
};


/**
 * ตรวจสอบว่าผู้ส่งข้อความเป็นผู้ใช้ปัจจุบันหรือไม่
 * สำหรับมุมมองธุรกิจ จะตรวจสอบ sender_type แทน userId
 * @param message ข้อความที่ต้องการตรวจสอบ
 * @param currentUserId ID ของผู้ใช้ปัจจุบัน
 * @param isBusinessView เป็นมุมมองธุรกิจหรือไม่
 * @param isAdmin เป็นแอดมินหรือไม่ (สำหรับมุมมองธุรกิจ)
 */
export const isSenderCurrentUser = (
  message: MessageDTO,
  currentUserId: string,
  isBusinessView?: boolean,
  isAdmin?: boolean
): boolean => {
  // ถ้าเป็นมุมมองธุรกิจ
  if (isBusinessView) {
    // ถ้าผู้ใช้ปัจจุบันเป็นแอดมิน
    if (isAdmin) {
      // ข้อความจากธุรกิจควรแสดงเป็นของเรา (ฝั่งขวา)
      return message.sender_type === 'business';
    } else {
      // ถ้าผู้ใช้ปัจจุบันเป็นลูกค้า ข้อความจากลูกค้าควรแสดงเป็นของเรา (ฝั่งขวา)
      return message.sender_type === 'user';
    }
  }
  
  // กรณีทั่วไป ตรวจสอบจาก userId
  return message.sender_id === currentUserId;
};