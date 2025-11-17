// Frontend TypeScript types for Sticker

// ============ Request Types ============

export interface CreateStickerSetRequest {
    name: string;
    description?: string;
    author?: string;
    is_official?: boolean;
    is_default?: boolean;
  }
  
  export interface UpdateStickerSetRequest {
    name?: string;
    description?: string;
    author?: string;
    is_official?: boolean;
    is_default?: boolean;
  }
  
  // For multipart/form-data, not directly convertible to TypeScript interface
  // export interface UploadStickerSetCoverRequest {}
  
  export interface AddStickerToSetRequest {
    name: string;
    sort_order?: number;
    is_animated?: boolean;
    // file will be handled by FormData
  }
  
  export interface UpdateStickerRequest {
    name?: string;
    sort_order?: number;
  }
  
  export interface SetStickerSetAsFavoriteRequest {
    is_favorite: boolean;
  }
  
  // ============ Response Types ============
  
  export interface StickerSetInfo {
    id: string;
    name: string;
    description: string;
    author: string;
    cover_image_url: string;
    created_at: string; // ISO string
    is_official: boolean;
    is_default: boolean;
    sort_order: number;
    sticker_count?: number;
    is_favorite?: boolean;
  }
  
  export interface StickerInfo {
    id: string;
    sticker_set_id: string;
    name: string;
    sticker_url: string;
    thumbnail_url: string;
    created_at: string; // ISO string
    is_animated: boolean;
    sort_order: number;
    sticker_set_name?: string;
  }
  
  export interface UserStickerSetInfo {
    id: string;
    user_id: string;
    sticker_set_id: string;
    purchased_at: string; // ISO string
    is_favorite: boolean;
    sticker_set?: StickerSetInfo;
  }
  
  export interface UserStickerInfo {
    id: string;
    user_id: string;
    sticker_id: string;
    created_at?: string; // ISO string, for favorite stickers
    used_at?: string; // ISO string, for recently used stickers
    sticker: StickerInfo;
  }
  
  // ============ Response Wrapper Types ============
  
  export interface CreateStickerSetResponse {
    success: boolean;
    message: string;
    data: StickerSetInfo;
  }
  
  export interface GetStickerSetResponse {
    success: boolean;
    message: string;
    data: {
      sticker_set: StickerSetInfo;
      stickers: StickerInfo[];
    };
  }
  
  export interface GetAllStickerSetsResponse {
    success: boolean;
    message: string;
    data: {
      sticker_sets: StickerSetInfo[];
      count: number;
      limit: number;
      offset: number;
    };
  }
  
  export interface GetDefaultStickerSetsResponse {
    success: boolean;
    message: string;
    data: StickerSetInfo[];
  }
  
  export interface UpdateStickerSetResponse {
    success: boolean;
    message: string;
    data: StickerSetInfo;
  }
  
  export interface UploadStickerSetCoverResponse {
    success: boolean;
    message: string;
    data: {
      sticker_set: StickerSetInfo;
      cover_image_url: string;
    };
  }
  
  export interface DeleteStickerSetResponse {
    success: boolean;
    message: string;
  }
  
  export interface AddStickerToSetResponse {
    success: boolean;
    message: string;
    data: StickerInfo;
  }
  
  export interface UpdateStickerResponse {
    success: boolean;
    message: string;
    data: StickerInfo;
  }
  
  export interface DeleteStickerResponse {
    success: boolean;
    message: string;
  }
  
  export interface AddStickerSetToUserResponse {
    success: boolean;
    message: string;
  }
  
  export interface GetUserStickerSetsResponse {
    success: boolean;
    message: string;
    data: UserStickerSetInfo[];
  }
  
  export interface SetStickerSetAsFavoriteResponse {
    success: boolean;
    message: string;
  }
  
  export interface RemoveStickerSetFromUserResponse {
    success: boolean;
    message: string;
  }
  
  export interface RecordStickerUsageResponse {
    success: boolean;
    message: string;
  }
  
  export interface GetUserRecentStickersResponse {
    success: boolean;
    message: string;
    data: UserStickerInfo[];
  }
  
  export interface GetUserFavoriteStickersResponse {
    success: boolean;
    message: string;
    data: UserStickerInfo[];
  }


  // src/types/sticker.types.ts
export interface Sticker {
  id: string;
  sticker_set_id: string;
  name: string;
  sticker_url: string;
  thumbnail_url: string;
  created_at: string;
  is_animated: boolean;
  sort_order: number;
}

export interface StickerSet {
  id: string;
  name: string;
  description: string;
  author: string;
  cover_image_url?: string;
  created_at: string;
  is_official: boolean;
  is_default: boolean;
  sort_order: number;
}

export interface StickerSetsResponse {
  success: boolean;
  data: {
    count: number;
    limit: number;
    offset: number;
    sticker_sets: StickerSet[];
  };
}

export interface StickerSetResponse {
  success: boolean;
  data: {
    sticker_set: StickerSet;
    stickers: Sticker[];
  };
}

export interface UserStickerSetsResponse {
  success: boolean;
  data: StickerSet[];
}

export interface RecentStickersResponse {
  success: boolean;
  data: Sticker[];
}