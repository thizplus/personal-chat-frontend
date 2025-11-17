// src/utils/messageHelpers.ts
import type { MessageDTO } from '@/types/message.types';

/**
 * ฟังก์ชันตรวจสอบว่าข้อความควรแสดงเป็นของผู้ใช้ปัจจุบันหรือไม่
 * - ในมุมมองธุรกิจ:
 *   - ถ้าเป็นแอดมิน: ข้อความจากธุรกิจจะแสดงทางขวา (isUser=true) ไม่ว่าจะเป็นแอดมินคนไหน
 *   - ถ้าเป็นลูกค้า: ข้อความจากลูกค้าจะแสดงทางขวา (isUser=true)
 * - ในมุมมองทั่วไป: ตรวจสอบว่า sender_id ตรงกับ currentUserId หรือไม่
 * 
 * @param message ข้อความที่ต้องการตรวจสอบ
 * @param currentUserId ID ของผู้ใช้ปัจจุบัน
 * @param isBusinessView เป็นมุมมองธุรกิจหรือไม่
 * @param isAdmin เป็นแอดมินหรือไม่ (สำหรับมุมมองธุรกิจ)
 * @returns true ถ้าควรแสดงเป็นข้อความของผู้ใช้ปัจจุบัน (ด้านขวา)
 */
export const isSenderCurrentUser = (
  message: MessageDTO, 
  currentUserId: string,
  isBusinessView: boolean,
  isAdmin: boolean = false
): boolean => {
  // กรณีมุมมองธุรกิจ
  if (isBusinessView) {
    // ถ้าเป็นแอดมิน ข้อความจากธุรกิจทั้งหมดควรแสดงทางขวา
    if (isAdmin) {
      return message.sender_type === 'business';
    } 
    // ถ้าเป็นลูกค้า ข้อความจากลูกค้าควรแสดงทางขวา
    else {
      return message.sender_type === 'user';
    }
  }
  
  // กรณีมุมมองทั่วไป (ไม่ใช่ธุรกิจ)
  return message.sender_id === currentUserId;
};

/**
 * ฟังก์ชันตรวจสอบว่าข้อความควรแสดงเป็นของผู้ใช้ปัจจุบันหรือไม่ (เวอร์ชันขยาย)
 * มีการ log ข้อมูลเพิ่มเติมเพื่อช่วยในการ debug
 * 
 * @param message ข้อความที่ต้องการตรวจสอบ
 * @param currentUserId ID ของผู้ใช้ปัจจุบัน
 * @param isBusinessView เป็นมุมมองธุรกิจหรือไม่
 * @param isAdmin เป็นแอดมินหรือไม่ (สำหรับมุมมองธุรกิจ)
 * @returns true ถ้าควรแสดงเป็นข้อความของผู้ใช้ปัจจุบัน (ด้านขวา)
 */
export const isSenderCurrentUserWithDebug = (
  message: MessageDTO, 
  currentUserId: string,
  isBusinessView: boolean,
  isAdmin: boolean = false
): boolean => {
  // สำหรับ debug
  console.group(`Message ID: ${message.id || message.temp_id}`);
  console.log('message.sender_id:', message.sender_id);
  console.log('message.sender_type:', message.sender_type);
  console.log('message.metadata:', message.metadata);
  console.log('currentUserId:', currentUserId);
  console.log('isBusinessView:', isBusinessView);
  console.log('isAdmin:', isAdmin);
  
  let result = false;
  
  // กรณีมุมมองธุรกิจ
  if (isBusinessView) {
    if (isAdmin) {
      result = message.sender_type === 'business';
      console.log(`Admin view, business message check: ${result}`);
    } else {
      result = message.sender_type === 'user';
      console.log(`Customer view, user message check: ${result}`);
    }
  } else {
    // กรณีมุมมองทั่วไป
    result = message.sender_id === currentUserId;
    console.log(`Normal view, checking sender_id: ${result}`);
  }
  
  console.log('Final result:', result);
  console.groupEnd();
  
  return result;
};

/**
 * ฟังก์ชันฟอร์แมตข้อความสถานะเป็น string หรือ undefined
 * @param status สถานะข้อความ
 * @returns สถานะในรูปแบบ string หรือ undefined
 */
export const formatMessageStatus = (status: string | null): string | undefined => {
  return status === null ? undefined : status;
};