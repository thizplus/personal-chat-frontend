// src/components/shared/message/EditMessageForm.tsx
import React from 'react';

interface EditMessageFormProps {
  content: string;
  onChange?: (content: string) => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  isUser: boolean;
}

/**
 * คอมโพเนนต์สำหรับฟอร์มแก้ไขข้อความ
 */
const EditMessageForm: React.FC<EditMessageFormProps> = ({
  content,
  onChange,
  onConfirm,
  onCancel,
  isUser
}) => {
  return (
    <div
      className={`rounded-2xl px-4 py-2 ${
        isUser
          ? 'bg-primary/10 text-card-foreground rounded-tr-none'
          : 'bg-card text-card-foreground rounded-tl-none border border-border'
      }`}
    >
      <textarea
        value={content}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full bg-transparent resize-none focus:outline-none p-0 text-sm text-foreground"
        autoFocus
        rows={Math.min(5, content.split('\n').length)}
      />
      <div className="flex justify-end gap-2 mt-2">
        <button
          onClick={onCancel}
          className=" text-muted-foreground hover:text-foreground"
        >
          ยกเลิก
        </button>
        <button
          onClick={onConfirm}
          className=" text-primary hover:text-primary/80"
          disabled={!content.trim()}
        >
          บันทึก
        </button>
      </div>
    </div>
  );
};

export default EditMessageForm;