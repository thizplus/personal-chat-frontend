// src/services/websocket/WebSocketEventEmitter.ts
import type { WebSocketEventMap } from '@/types/websocket.types';

type EventCallback = (data: unknown) => void;

export class WebSocketEventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  // เพิ่ม logging สำหรับ debug (development only)
  private logEvent(_action: string, _event: string, _data?: unknown): void {
    // ปิดการ log เพื่อลด console noise
    // if (import.meta.env.DEV) {
    //   console.log(`[EventEmitter] ${_action}: ${_event}`, _data ? { data: _data } : '');
    // }
  }

  // เมธอดสำหรับ typed events
  public on<K extends keyof WebSocketEventMap>(
    event: K, 
    callback: (data: WebSocketEventMap[K]) => void
  ): () => void {
    this.logEvent('Registering listener for', String(event));
    
    // Type assertion จำเป็นเพื่อให้ทำงานกับ internal implementation ที่ใช้ unknown
    const typedCallback = callback as EventCallback;
    
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(typedCallback);

    // Return unsubscribe function
    return () => {
      this.logEvent('Unsubscribing from', String(event));
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(typedCallback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // เมธอดสำหรับ dynamic events
  public onDynamic(
    event: string,
    callback: (data: unknown) => void
  ): () => void {
    this.logEvent('Registering dynamic listener for', event);
    
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(callback);

    return () => {
      this.logEvent('Unsubscribing from dynamic', event);
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // เมธอดสำหรับ typed events
  public off<K extends keyof WebSocketEventMap>(
    event: K, 
    callback: (data: WebSocketEventMap[K]) => void
  ): void {
    this.logEvent('Removing listener for', String(event));
    
    const callbacks = this.events.get(event);
    if (callbacks) {
      // Type assertion จำเป็นเพื่อให้ทำงานกับ internal implementation ที่ใช้ unknown
      const typedCallback = callback as EventCallback;
      const index = callbacks.indexOf(typedCallback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // เมธอดสำหรับ dynamic events
  public offDynamic(
    event: string,
    callback: (data: unknown) => void
  ): void {
    this.logEvent('Removing dynamic listener for', event);
    
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // เมธอดสำหรับ typed events
  public emit<K extends keyof WebSocketEventMap>(
    event: K, 
    data?: WebSocketEventMap[K]
  ): void {
    this.logEvent('Emitting event', String(event), data);
    
    const callbacks = this.events.get(event);
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => callback(data));
    } else {
      console.warn(`[EventEmitter] No listeners for event: ${String(event)}`);
    }
    
    // เพิ่มการตรวจสอบหลังจาก emit
    //console.log(`[EventEmitter] After emit ${String(event)}: ${callbacks?.length || 0} listeners called`);
  }

  // เมธอดสำหรับ dynamic events
  public emitDynamic(
    event: string,
    data?: unknown
  ): void {
    this.logEvent('Emitting dynamic event', event, data);
    
    const callbacks = this.events.get(event);
    if (callbacks && callbacks.length > 0) {
      callbacks.forEach(callback => callback(data));
    } else {
      //console.warn(`[EventEmitter] No listeners for dynamic event: ${event}`);
    }
    
    // เพิ่มการตรวจสอบหลังจาก emit
    //console.log(`[EventEmitter] After dynamic emit ${event}: ${callbacks?.length || 0} listeners called`);
  }

  public clear(): void {
    this.logEvent('Clearing', 'all event listeners');
    this.events.clear();
  }

  // เพิ่มเมธอดเพื่อดูรายการ listeners ทั้งหมด (ปิดการใช้งานเพื่อลด console log)
  public listAllListeners(): void {
    // ปิดการแสดง listeners เพื่อลด console noise
    // if (import.meta.env.DEV) {
    //   console.log('[EventEmitter] Current listeners:');
    //   this.events.forEach((callbacks, event) => {
    //     console.log(`- ${String(event)}: ${callbacks.length} listeners`);
    //   });
    // }
  }
}

// ต้องแน่ใจว่ามีเพียง instance เดียวเท่านั้น
const eventEmitterInstance = new WebSocketEventEmitter();

export default eventEmitterInstance;