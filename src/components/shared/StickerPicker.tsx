// src/components/shared/StickerPicker.tsx
import React, { useState, useEffect } from 'react';
import useStickerStore from '@/stores/stickerStore'; // ต้องสร้าง store นี้

interface StickerPickerProps {
  onSelectSticker: (stickerId: string, stickerUrl: string, stickerSetId: string) => void;
}

const StickerPicker: React.FC<StickerPickerProps> = ({ onSelectSticker }) => {
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  
  const {
    stickerSets,
    stickers,
    recentStickers,
    isLoading,
    fetchStickerSets,
    fetchStickersInSet,
   // addToRecentStickers
  } = useStickerStore();

  useEffect(() => {
    // โหลดชุดสติกเกอร์เมื่อคอมโพเนนต์ถูกโหลด
    if (stickerSets.length === 0) {
      fetchStickerSets().then((sets) => {
        if (sets.length > 0) {
          fetchStickersInSet(sets[0].id);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เมื่อเปลี่ยนชุดสติกเกอร์
  const handleSetChange = async (index: number) => {
    setActiveSetIndex(index);
    const setId = stickerSets[index]?.id;
    
    if (setId && !stickers[setId]) {
      await fetchStickersInSet(setId);
    }
  };

  const handleStickerSelect = (stickerId: string, stickerUrl: string, stickerSetId: string) => {
    // เพิ่มสติกเกอร์ในรายการล่าสุด
    /*
    const sticker = {
      id: stickerId,
      sticker_url: stickerUrl,
      thumbnail_url: stickerUrl,
      sticker_set_id: stickerSetId
    };
    addToRecentStickers(sticker);
    */
    // เรียกฟังก์ชัน callback
    onSelectSticker(stickerId, stickerUrl, stickerSetId);
  };

  if (isLoading && stickerSets.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-2 text-muted-foreground text-sm">กำลังโหลดสติกเกอร์...</p>
      </div>
    );
  }

  if (stickerSets.length === 0) {
    return <div className="p-4 text-center text-muted-foreground text-sm">ไม่พบสติกเกอร์</div>;
  }

  const activeSet = stickerSets[activeSetIndex];
  const activeStickers = stickers[activeSet?.id] || [];

  return (
    <div className="sticker-picker">
      {/* Sticker Set Tabs */}
      <div className="flex overflow-x-auto mb-2 pb-2 border-b border-border">
        {stickerSets.map((set, index) => (
          <button
            key={set.id}
            type="button"
            className={`flex-shrink-0 p-1 mx-1 rounded-lg transition-all ${
              activeSetIndex === index 
                ? 'bg-accent border border-border' 
                : 'hover:bg-accent border border-transparent'
            }`}
            onClick={() => handleSetChange(index)}
          >
            {set.cover_image_url ? (
              <img src={set.cover_image_url} alt={set.name} className="w-8 h-8 object-contain" />
            ) : (
              <span className="w-8 h-8 flex items-center justify-center text-sm font-bold bg-muted rounded">
                {set.name.substring(0, 1)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Recent Stickers (if any) */}
      {recentStickers.length > 0 && (
        <div className="mb-2">
          <h3 className=" text-muted-foreground mb-1">ล่าสุด</h3>
          <div className="grid grid-cols-4 gap-2">
            {recentStickers.slice(0, 8).map((sticker) => (
              <button
                key={sticker.id}
                type="button"
                className="p-1 hover:bg-accent rounded-lg transition-all"
                onClick={() => handleStickerSelect(sticker.id, sticker.sticker_url, sticker.sticker_set_id)}
              >
                <img
                  src={sticker.thumbnail_url || sticker.sticker_url}
                  alt="Sticker"
                  className="w-full h-auto object-contain"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stickers Grid */}
      <div className="grid grid-cols-4 gap-2">
        {activeStickers.length > 0 ? (
          activeStickers.map((sticker) => (
            <button
              key={sticker.id}
              type="button"
              className="p-1 hover:bg-accent rounded-lg transition-all hover:scale-105"
              onClick={() => handleStickerSelect(sticker.id, sticker.sticker_url, sticker.sticker_set_id)}
            >
              <img
                src={sticker.thumbnail_url || sticker.sticker_url}
                alt={sticker.name || 'Sticker'}
                className="w-full h-auto object-contain"
              />
            </button>
          ))
        ) : (
          <div className="col-span-4 py-4 text-center text-muted-foreground text-sm">
            {isLoading ? 'กำลังโหลดสติกเกอร์...' : 'ไม่พบสติกเกอร์ในชุดนี้'}
          </div>
        )}
      </div>
    </div>
  );
};

export default StickerPicker;