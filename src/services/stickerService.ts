// src/services/stickerService.ts
import apiService from './apiService';
import { STICKER_API } from '@/constants/api/standardApiConstants';
import type {
  StickerSetsResponse,
  StickerSetResponse,
  UserStickerSetsResponse,
  RecentStickersResponse
} from '@/types/sticker.types'; // คุณต้องสร้าง types เหล่านี้

/**
 * Service สำหรับจัดการสติกเกอร์
 */
const stickerService = {
  /**
   * ดึงรายการชุดสติกเกอร์ทั้งหมด
   * @returns รายการชุดสติกเกอร์
   */
  getStickerSets: async (): Promise<StickerSetsResponse> => {
    return await apiService.get<StickerSetsResponse>(STICKER_API.GET_ALL_STICKER_SETS);
  },
  
  /**
   * ดึงสติกเกอร์ในชุด
   * @param setId - ID ของชุดสติกเกอร์
   * @returns รายการสติกเกอร์ในชุด
   */
  getStickersInSet: async (setId: string): Promise<StickerSetResponse> => {
    return await apiService.get<StickerSetResponse>(STICKER_API.GET_STICKER_SET(setId));
  },
  
  /**
   * ดึงชุดสติกเกอร์ของผู้ใช้
   * @returns รายการชุดสติกเกอร์ของผู้ใช้
   */
  getUserStickerSets: async (): Promise<UserStickerSetsResponse> => {
    return await apiService.get<UserStickerSetsResponse>(STICKER_API.GET_USER_STICKER_SETS);
  },
  
  /**
   * ดึงสติกเกอร์ที่ใช้ล่าสุด
   * @returns รายการสติกเกอร์ที่ใช้ล่าสุด
   */
  getRecentStickers: async (): Promise<RecentStickersResponse> => {
    return await apiService.get<RecentStickersResponse>(STICKER_API.GET_USER_RECENT_STICKERS);
  }
};

export default stickerService;