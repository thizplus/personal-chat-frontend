// src/stores/stickerStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import stickerService from '@/services/stickerService';
import type { Sticker, StickerSet } from '@/types/sticker.types';

interface StickerState {
  stickerSets: StickerSet[];
  stickers: Record<string, Sticker[]>;
  recentStickers: Sticker[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStickerSets: () => Promise<StickerSet[]>;
  fetchStickersInSet: (setId: string) => Promise<Sticker[]>;
  addToRecentStickers: (sticker: Sticker) => void;
}

export const useStickerStore = create<StickerState>()(devtools((set, get) => ({
  stickerSets: [],
  stickers: {},
  recentStickers: [],
  isLoading: false,
  error: null,

  fetchStickerSets: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await stickerService.getStickerSets();
      
      if (response.success) {
        const stickerSets = response.data.sticker_sets;
        set({ stickerSets, isLoading: false });
        return stickerSets;
      }
      
      set({ isLoading: false });
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch sticker sets';
      set({ error: errorMessage, isLoading: false });
      
      // สำหรับการทดสอบ
      return [];
    }
  },

  fetchStickersInSet: async (setId: string) => {
    try {
      // ตรวจสอบว่ามีข้อมูลในแคชหรือไม่
      const cachedStickers = get().stickers[setId];
      if (cachedStickers) {
        return cachedStickers;
      }
      
      set({ isLoading: true, error: null });
      const response = await stickerService.getStickersInSet(setId);
      
      if (response.success) {
        const stickersData = response.data.stickers;
        
        set((state) => ({
          stickers: {
            ...state.stickers,
            [setId]: stickersData
          },
          isLoading: false
        }));
        
        return stickersData;
      }
      
      set({ isLoading: false });
      return [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch stickers in set ${setId}`;
      set({ error: errorMessage, isLoading: false });
      
      return [];
    }
  },

  addToRecentStickers: (sticker: Sticker) => {
    set((state) => {
      // ตรวจสอบว่ามีสติกเกอร์นี้ในรายการล่าสุดหรือไม่
      const existingIndex = state.recentStickers.findIndex(s => s.id === sticker.id);
      
      let updatedRecent;
      if (existingIndex !== -1) {
        // ถ้ามีอยู่แล้ว ให้ย้ายไปด้านบนสุด
        updatedRecent = [
          sticker,
          ...state.recentStickers.filter(s => s.id !== sticker.id)
        ];
      } else {
        // ถ้ายังไม่มี ให้เพิ่มไว้ด้านบนสุด และจำกัดจำนวนไว้ที่ 20 อัน
        updatedRecent = [
          sticker,
          ...state.recentStickers
        ].slice(0, 20);
      }
      
      return {
        recentStickers: updatedRecent
      };
    });
  }
}), {
  name: 'StickerStore', // ชื่อใน Redux DevTools
  enabled: import.meta.env.DEV // เปิดเฉพาะตอน development
}));

export default useStickerStore;