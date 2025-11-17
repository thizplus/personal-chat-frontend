// src/components/standard/conversation/LinkList.tsx
import { Link as LinkIcon, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MediaContextMenu } from '@/components/shared/MediaContextMenu';
import { useLinks } from '@/hooks/useMediaQueries';

interface LinkListProps {
  conversationId: string;
  onItemClick?: (messageId: string) => void;
}

// Helper function to group links by date
function groupLinksByDate(links: any[]) {
  const groups: Record<string, any[]> = {};

  links.forEach((link) => {
    const date = new Date(link.created_at);
    // Use local date instead of UTC to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateKey = `${year}-${month}-${day}`;

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(link);
  });

  // Sort by date descending (newest first)
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
}

// Helper function to format date header
function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'วันนี้';
  if (isYesterday) return 'เมื่อวาน';

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return url;
  }
}

export function LinkList({ conversationId, onItemClick }: LinkListProps) {
  // ✅ Use React Query hook
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useLinks(conversationId, 20);

  const links = data?.pages.flatMap((page) => page.data) ?? [];
  const total = data?.pages[0]?.pagination.total ?? 0;

  // Group links by date
  const linkGroups = groupLinksByDate(links);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <LinkIcon size={48} className="text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">ไม่มีลิงก์</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-muted-foreground px-1">
        ลิงก์ทั้งหมด {total} ลิงก์
      </div>

      {/* Link List - Grouped by Date */}
      <div className="flex flex-col gap-6">
        {linkGroups.map(([dateKey, groupLinks]) => (
          <div key={dateKey} className="flex flex-col gap-3">
            {/* Date Header */}
            <div className="text-sm font-medium text-foreground px-1 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
              {formatDateHeader(dateKey)}
            </div>

            {/* Links for this date */}
            <div className="space-y-2">
              {groupLinks.map((link) => {
                const firstLink = link.metadata?.links?.[0] || '';

                return (
                  <MediaContextMenu
                    key={link.message_id}
                    onJumpToMessage={() => onItemClick?.(link.message_id)}
                  >
                    <button
                      onClick={() => onItemClick?.(link.message_id)}
                      className="w-full flex items-start gap-3 p-3 rounded-md bg-secondary hover:bg-secondary/80 transition-colors text-left"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                        <LinkIcon size={20} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2 mb-1">{link.content}</p>
                        {firstLink && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="truncate">{extractDomain(firstLink)}</span>
                            <span>•</span>
                            <span>{formatTime(link.created_at)}</span>
                          </div>
                        )}
                      </div>
                      {firstLink && (
                        <a
                          href={firstLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 p-2 rounded hover:bg-accent"
                          title="เปิดลิงก์"
                        >
                          <ExternalLink size={16} className="text-muted-foreground" />
                        </a>
                      )}
                    </button>
                  </MediaContextMenu>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full"
        >
          {isFetchingNextPage ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังโหลด...
            </>
          ) : (
            `โหลดเพิ่มเติม (เหลืออีก ${total - links.length} ลิงก์)`
          )}
        </Button>
      )}
    </div>
  );
}
