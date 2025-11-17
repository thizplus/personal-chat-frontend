// src/components/app/shared/EmojiPicker.tsx
import React from 'react';

const commonEmojis = ['😀', '😂', '😍', '🥰', '😎', '👍', '❤️', '😊', '🙏', '👋', '🔥', '✨', '🎉', '👌', '🤔', '😢', '😭', '😡', '👏', '🤝'];

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelectEmoji }) => {
  return (
    <div className="w-full">
      <div className="grid grid-cols-5 gap-2">
        {commonEmojis.map((emoji, index) => (
          <button
            key={index}
            type="button"
            className="text-2xl hover:bg-accent active:bg-accent/80 p-3 rounded-lg transition-all duration-200 hover:scale-110"
            onClick={() => onSelectEmoji(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;