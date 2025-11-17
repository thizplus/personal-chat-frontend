// src/utils/appEventBus.ts

/**
 * กำหนด interface สำหรับ event types ทั้งหมดในแอพพลิเคชัน
 * ใช้สำหรับการสื่อสารภายในแอพพลิเคชันเท่านั้น (ไม่เกี่ยวกับ WebSocket)
 */
export interface AppEventMap {
  // Placeholder event to satisfy TypeScript (not actually used)
  '_placeholder': never;
  // Reserved for future events
  // 'event:example': ExampleType;
}

// กำหนด type สำหรับ callback function ที่รับพารามิเตอร์ตามประเภทเหตุการณ์
export type AppEventCallback<T> = (data: T) => void;

/**
 * AppEventBus - ระบบจัดการเหตุการณ์ภายในแอพพลิเคชัน
 * ใช้สำหรับการสื่อสารระหว่างส่วนต่างๆ ภายในแอพพลิเคชันเดียวกัน
 * (ไม่เกี่ยวข้องกับ WebSocket ที่ใช้สื่อสารกับเซิร์ฟเวอร์)
 */
class AppEventBus {
  private events: {
    [K in keyof AppEventMap]?: Array<AppEventCallback<AppEventMap[K]>>;
  } = {};

  /**
   * ลงทะเบียนเพื่อรับเหตุการณ์
   * @param event ชื่อเหตุการณ์
   * @param callback ฟังก์ชันที่จะเรียกเมื่อเกิดเหตุการณ์
   * @returns ฟังก์ชันสำหรับยกเลิกการลงทะเบียน
   */
  on<K extends keyof AppEventMap>(
    event: K,
    callback: AppEventCallback<AppEventMap[K]>
  ): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    
    this.events[event]!.push(callback);

    // คืนค่าฟังก์ชันสำหรับยกเลิกการลงทะเบียน
    return () => {
      this.events[event] = this.events[event]!.filter(cb => cb !== callback);
      if (this.events[event]!.length === 0) {
        delete this.events[event];
      }
    };
  }

  /**
   * ส่งเหตุการณ์
   * @param event ชื่อเหตุการณ์
   * @param data ข้อมูลที่จะส่ง
   */
  emit<K extends keyof AppEventMap>(event: K, data: AppEventMap[K]): void {
    if (this.events[event]) {
      this.events[event]!.forEach(callback => {
        callback(data);
      });
    }
  }

  /**
   * ลบการลงทะเบียนทั้งหมดสำหรับเหตุการณ์หนึ่ง หรือทุกเหตุการณ์
   * @param event ชื่อเหตุการณ์ (ถ้าไม่ระบุจะลบทุกเหตุการณ์)
   */
  removeAllListeners<K extends keyof AppEventMap>(event?: K): void {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

// สร้าง singleton instance
const appEvents = new AppEventBus();

export default appEvents;