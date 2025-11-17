import React, { memo } from 'react';

interface CategoryTabProps {
  icon: React.ElementType;
  label: string;
  isSelected: boolean;
  unreadCount?: number;
  onClick: () => void;
  hideLabel?: boolean;
}

const CategoryTab = memo(({
  icon: Icon,
  label,
  isSelected,
  unreadCount,
  onClick,
  hideLabel = false
}: CategoryTabProps) => (
  <button
    className={`
      flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors relative
      ${isSelected 
        ? 'bg-primary/10 text-primary' 
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      }
    `}
    onClick={onClick}
  >
    <Icon size={16} />
    {!hideLabel && <span>{label}</span>}
    {unreadCount && unreadCount > 0 && (
      <span className="absolute -top-1 -right-1 flex items-center justify-center bg-primary text-primary-foreground  font-medium rounded-full min-w-[16px] h-[16px] px-1">
        {unreadCount}
      </span>
    )}
  </button>
));

CategoryTab.displayName = 'CategoryTab';

export default CategoryTab;