// src/components/shared/message/EmojiStickerPanel.tsx
import React, { type RefObject } from 'react';  // เพิ่มการนำเข้า RefObject type
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmojiPicker from '@/components/shared/EmojiPicker';
import StickerPicker from '@/components/shared/StickerPicker';

interface EmojiStickerPanelProps {
  activeTab: "sticker" | "emoji";
  onTabChange: (value: "sticker" | "emoji") => void;
  onEmojiSelect: (emoji: string) => void;
  onStickerSelect: (stickerId: string, stickerUrl: string, stickerSetId: string) => void;
  panelRef: RefObject<HTMLDivElement>;  // กำหนด type ให้ชัดเจน
}

/**
 * คอมโพเนนต์แสดงแผงเลือก Emoji และ Sticker
 */
const EmojiStickerPanel: React.FC<EmojiStickerPanelProps> = ({
  activeTab,
  onTabChange,
  onEmojiSelect,
  onStickerSelect,
  panelRef
}) => {
  return (
    <div 
      ref={panelRef}
      className="absolute bottom-12 right-0 bg-card rounded-lg z-10 w-80 shadow-lg border border-border overflow-hidden"
    >
      <Tabs 
        defaultValue={activeTab} 
        className="w-full" 
        onValueChange={(value) => onTabChange(value as "sticker" | "emoji")}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger 
            value="sticker" 
            className="data-[state=active]:bg-card data-[state=active]:text-primary"
          >
            สติกเกอร์
          </TabsTrigger>
          <TabsTrigger 
            value="emoji" 
            className="data-[state=active]:bg-card data-[state=active]:text-primary"
          >
            อีโมจิ
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sticker" className="p-2 min-h-[240px] max-h-[320px] overflow-y-auto">
          <StickerPicker onSelectSticker={onStickerSelect} />
        </TabsContent>
        <TabsContent value="emoji" className="p-2 min-h-[240px] max-h-[320px] overflow-y-auto">
          <EmojiPicker onSelectEmoji={onEmojiSelect} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmojiStickerPanel;