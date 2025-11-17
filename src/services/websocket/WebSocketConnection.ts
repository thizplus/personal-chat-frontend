// src/services/websocket/WebSocketConnection.ts
import { WS_BASE_URL, WS_RECONNECT_INTERVAL, WS_MAX_RECONNECT_ATTEMPTS, WS_PING_INTERVAL, MessageType } from './constants';
import eventEmitter from './WebSocketEventEmitter';
import { logger } from '@/services/websocket/utils/logger';

export class WebSocketConnection {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private reconnectTimeout: number | null = null;
  private pingInterval: number | null = null;
  private token: string;
  private connectionTimeout: number | null = null;
  private hasEmittedOpenEvent = false;

  private isConnecting = false;
  private manuallyDisconnected = false;
  
  // บันทึก clientId จาก server
  private clientId: string | null = null;

  constructor(token: string, businessId?: string) {
    this.token = token;

    // ตรวจสอบว่าได้รับ token หรือไม่
    if (!token) {
      throw new Error("Authentication token is required for WebSocket connection");
    }

    // เพิ่ม cache buster เพื่อป้องกันการใช้ cache เมื่อ refresh
    const cacheBuster = `&_t=${Date.now()}`;
    //const isProduction = !window.location.hostname.includes('localhost');

    // สร้าง URL ตามรูปแบบที่ backend ต้องการ
    this.url = businessId
      ? `${WS_BASE_URL}/ws/business/${businessId}?token=${this.token}${cacheBuster}`
      : `${WS_BASE_URL}/ws/user?token=${this.token}${cacheBuster}`;

    //console.log(`[WebSocketConnection] Initializing connection to: ${this.url.replace(/token=.*?(&|$)/, 'token=***$1')}`);
    
    // เพิ่ม event listener สำหรับ beforeunload
    this.setupBeforeUnloadHandler();
    
    // บันทึกเวลาเริ่มต้น
    this.savePageLoadTime();
  }
  
  // เพิ่มฟังก์ชันบันทึกเวลาโหลดหน้า
  private savePageLoadTime(): void {
    try {
      // บันทึกเวลาโหลดหน้าปัจจุบัน
      const now = Date.now();
      localStorage.setItem('ws_page_load_time', now.toString());
    } catch (e) {
      // ป้องกันกรณีที่ localStorage ไม่สามารถใช้งานได้
      console.warn('[WebSocketConnection] Unable to access localStorage', e);
    }
  }
  

  // ฟังก์ชันดึง client ID
  public getClientId(): string | null {
    return this.clientId;
  }
  
  /**
   * จัดการ beforeunload event
   */
  private setupBeforeUnloadHandler(): void {
    // ลบตัวจัดการเดิมก่อน (ถ้ามี)
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    
    // เพิ่มตัวจัดการใหม่
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  }
  
  /**
   * ฟังก์ชัน handler สำหรับ beforeunload event
   */
  private handleBeforeUnload = (): void => {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      // ส่ง close frame แบบปกติ
      try {
        logger.info('Closing WebSocket connection gracefully before page unload');
        // ส่ง disconnect message ก่อน
        this.send(MessageType.DISCONNECT, { client_id: this.clientId });
        // ปิดการเชื่อมต่อด้วย close code ปกติ
        this.ws.close(1000, "User navigated away");
      } catch (error) {
        logger.error('Error closing WebSocket before page unload', error);
      }
    }
  };

  /**
   * เชื่อมต่อ WebSocket
   */
  public connect(): void {
    //console.log(`[WebSocketConnection] Connecting to: ${this.url.replace(/token=.*/, 'token=***')}`);

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      logger.warn('[WebSocketConnection] WebSocket is already connected or connecting');
      
      // ถ้าเชื่อมต่อแล้วแต่ยังไม่ได้ส่ง open event ให้ส่งทันที
      if (this.ws.readyState === WebSocket.OPEN && !this.hasEmittedOpenEvent) {
        //console.log('[WebSocketConnection] Connection already open but event not emitted, emitting now');
        this.emitOpenEvent();
      }
      return;
    }

    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.manuallyDisconnected = false;
    this.hasEmittedOpenEvent = false;

    try {
      //console.log(`[WebSocketConnection] Creating new WebSocket connection`);
      this.ws = new WebSocket(this.url);

      // เพิ่ม timeout สำหรับการเชื่อมต่อ
      const isProduction = !window.location.hostname.includes('localhost');
      const timeoutDuration = isProduction ? 10000 : 5000; // 10 วินาทีสำหรับ production, 5 วินาทีสำหรับ localhost
      
      this.connectionTimeout = window.setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          //console.log('[WebSocketConnection] Connection timeout, forcing reconnect');
          this.handleError(new Event('timeout'));
          this.ws?.close(4000, "Connection timeout");
        }
      }, timeoutDuration);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      logger.error('[WebSocketConnection] Failed to create connection', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * ยกเลิกการเชื่อมต่อ WebSocket
   */
  public disconnect(): void {
    this.manuallyDisconnected = true;
    this.clearTimers();

    if (this.ws) {
      try {
        // ส่ง disconnect message ก่อน
        if (this.ws.readyState === WebSocket.OPEN) {
          this.send(MessageType.DISCONNECT, { client_id: this.clientId });
        }
        this.ws.close(1000, "User closed connection");
      } catch (error) {
        logger.error('[WebSocketConnection] Error closing WebSocket', error);
      }
      this.ws = null;
    }
    
    // รีเซ็ตสถานะ
    this.hasEmittedOpenEvent = false;
    this.clientId = null;
  }

  /**
   * ส่งข้อความผ่าน WebSocket
   */
  public send(type: string, data: unknown, requestId?: string): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.error(`[WebSocketConnection] WebSocket is not connected while trying to send message type: ${type}`);
      return false;
    }

    try {
      const rid = requestId || crypto.randomUUID();
      const message = JSON.stringify({
        type,
        data,
        timestamp: new Date(),
        request_id: rid,
      });

      //console.log(`[WebSocketConnection] Sending message - Type: ${type}, RequestID: ${rid}`, data);
     // logger.debug(`[WebSocketConnection] Sending raw message: ${message}`);

      this.ws.send(message);
      return true;
    } catch (error) {
      logger.error(`[WebSocketConnection] Error sending WebSocket message type ${type}:`, error);
      return false;
    }
  }

  /**
   * เช็คว่า WebSocket เชื่อมต่ออยู่หรือไม่
   */
  public isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * ส่ง ping เพื่อรักษาการเชื่อมต่อ
   */
  private sendPing(): void {
    this.send(MessageType.PING, { timestamp: Date.now() });
  }

  /**
   * ส่ง open event
   */
  private emitOpenEvent(): void {
    if (this.hasEmittedOpenEvent) {
      //console.log('[WebSocketConnection] Open event already emitted, skipping');
      return;
    }
    
    ////console.log('[WebSocketConnection] Emitting ws:open event');
    
    // แสดง listeners ก่อนส่ง event
    eventEmitter.listAllListeners();
    
    // ส่ง event
    eventEmitter.emit('ws:open', new Event('open'));
    
    this.hasEmittedOpenEvent = true;
    //console.log('[WebSocketConnection] Open event emitted successfully');
  }

  /**
   * จัดการเหตุการณ์เมื่อเชื่อมต่อสำเร็จ
   */
  private handleOpen(): void {
    //console.log('[WebSocketConnection] Connection opened successfully', event);
    
    // ล้าง connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Start ping interval
    this.pingInterval = window.setInterval(() => {
      this.sendPing();
    }, WS_PING_INTERVAL);

    // ส่ง open event ทันที
    this.emitOpenEvent();
    
    /*
    // ตรวจสอบสถานะหลังจากเชื่อมต่อ
    console.log('[WebSocketConnection] Connection status after open:', {
      readyState: this.ws?.readyState,
      isConnected: this.isConnected()
    });

    */
  }

  /**
   * จัดการเหตุการณ์เมื่อได้รับข้อความ
   */
  /**
 * จัดการเหตุการณ์เมื่อได้รับข้อความ
 */
  private static isProcessingMessage = false;

  private handleMessage(event: MessageEvent): void {
    try {
      // ป้องกันการประมวลผลซ้ำซ้อน
      if (WebSocketConnection.isProcessingMessage) {
      //  console.warn("[WebSocketConnection] Message processing already in progress, skipping");
        return;
      }
      
      WebSocketConnection.isProcessingMessage = true;
      
      // เก็บข้อมูลดิบไว้ในตัวแปรก่อนจะเรียก console.log
      const rawData = event.data;
      //console.log("[RAW] WebSocket message received:", rawData);
      
      // ทำสำเนาข้อมูลดิบโดยไม่เรียกจาก event.data อีก
      const dataClone = String(rawData);
      
      // แปลง string เป็น object และทำ deep clone ทันทีเพื่อป้องกันการเปลี่ยนแปลง
      const message = JSON.parse(dataClone);
      const messageClone = JSON.parse(JSON.stringify(message));
      
      // แสดงข้อมูลหลังจาก parse
    // console.log("[PARSED] WebSocket message parsed:", messageClone);
      
      // เพิ่มการตรวจจับการเปลี่ยนแปลงโดยตรง
      const originalSenderName = message.data?.sender_name;
      
      // ประมวลผลข้อความปกติ...
      
      // บันทึก clientId ถ้ามี
      if (messageClone.type === MessageType.CONNECT && messageClone.data?.client_id) {
        this.clientId = messageClone.data.client_id;
        if (!this.hasEmittedOpenEvent) {
          this.emitOpenEvent();
        }
      }
      
      if (!this.hasEmittedOpenEvent && this.ws?.readyState === WebSocket.OPEN) {
        this.emitOpenEvent();
      }
  
      // Handle pong response
      if (messageClone.type === MessageType.PONG) {
        eventEmitter.emit('ws:pong', messageClone);
        WebSocketConnection.isProcessingMessage = false;
        return;
      }
  
      // ส่ง event ตามประเภทข้อความ โดยใช้ข้อมูลที่ clone แล้ว
      if (messageClone.type) {
        const eventName = `message:${messageClone.type}`;
        // เก็บค่า sender_name ก่อนส่ง event
        const beforeEventSenderName = messageClone.data?.sender_name;
        
        // ส่ง event โดยใช้ immutable copy
        const immutableCopy = JSON.parse(JSON.stringify(messageClone));
        eventEmitter.emitDynamic(eventName, immutableCopy);
        
        // ตรวจสอบการเปลี่ยนแปลงหลังจากส่ง event
        if (messageClone.data?.sender_name !== beforeEventSenderName) {
          console.error("===== SENDER NAME CHANGED AFTER EVENT! =====");
          console.error(`Before event: "${beforeEventSenderName}"`);
          console.error(`After event : "${messageClone.data?.sender_name}"`);
        }
      }
  
      // เช็คการเปลี่ยนแปลงอีกครั้งหลังจากทำงานทั้งหมด
      if (message.data?.sender_name !== originalSenderName) {
        console.error("===== SENDER NAME CHANGED DURING PROCESSING! =====");
        console.error(`Original: "${originalSenderName}"`);
        console.error(`Current : "${message.data?.sender_name}"`);
      }
  
      // ส่ง general message event ด้วย immutable copy
      eventEmitter.emit('ws:message', JSON.parse(JSON.stringify(messageClone)));
      
      WebSocketConnection.isProcessingMessage = false;
    } catch (error) {
      WebSocketConnection.isProcessingMessage = false;
      logger.error('[WebSocketConnection] Error parsing WebSocket message', error);
    }
  }

  /**
   * จัดการเหตุการณ์เมื่อเกิดข้อผิดพลาด
   */
  private handleError(event: Event): void {
    console.error('[WebSocketConnection] WebSocket error', event);
    
    // ล้าง connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    eventEmitter.emit('ws:error', event);
    
    // ถ้าอยู่ในสถานะกำลังเชื่อมต่อ แต่เกิดข้อผิดพลาด ให้ยกเลิกการเชื่อมต่อ
    if (this.ws?.readyState === WebSocket.CONNECTING) {
      //console.log('[WebSocketConnection] Aborting connection attempt due to error');
      this.ws.close(4000, "Connection error");
    }
  }

  /**
   * จัดการเหตุการณ์เมื่อการเชื่อมต่อถูกปิด
   */
  private handleClose(event: CloseEvent): void {
    //console.log(`[WebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
    
    // ล้าง connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    this.isConnecting = false;
    this.clearTimers();
    this.ws = null;
    this.clientId = null;
    this.hasEmittedOpenEvent = false;

    // Add more detailed logging based on close code
    switch (event.code) {
      case 1000:
        //console.log('[WebSocketConnection] Normal closure');
        break;
      case 1001:
        //console.log('[WebSocketConnection] Remote going away');
        break;
      case 1006:
        //console.log('[WebSocketConnection] Abnormal closure - connection might have timed out or network error');
        break;
      default:
        //console.log(`[WebSocketConnection] Connection closed with code: ${event.code}`);
    }

    eventEmitter.emit('ws:close', event);

    // Try to reconnect if not manually disconnected
    if (!this.manuallyDisconnected) {
      this.scheduleReconnect();
    }
  }

  /**
   * กำหนดเวลาในการเชื่อมต่อใหม่
   */
  private scheduleReconnect(): void {
    if (this.manuallyDisconnected) {
      return;
    }

    if (this.reconnectAttempts >= WS_MAX_RECONNECT_ATTEMPTS) {
      logger.error('[WebSocketConnection] Maximum reconnect attempts reached');
      eventEmitter.emit('ws:reconnect_failed');
      return;
    }

    this.reconnectAttempts += 1;
    const delay = this.reconnectAttempts * WS_RECONNECT_INTERVAL;

    logger.info(`[WebSocketConnection] Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    eventEmitter.emit('ws:reconnecting', {
      attempt: this.reconnectAttempts,
      delay,
    });

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * ล้าง timers ทั้งหมด
   */
  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
}