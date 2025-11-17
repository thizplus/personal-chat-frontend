// src/components/standard/conversation/ConversationDetailsSheet.tsx
import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users, LogOut, User, AlertCircle,
  Image as ImageIcon, Video, FileText, Link as LinkIcon
} from 'lucide-react';
import type { ConversationDTO } from '@/types/conversation.types';
import { toast } from '@/utils/toast';
import { useMediaSummary } from '@/hooks/useMediaQueries';
import { PhotoGallery } from './PhotoGallery';
import { VideoGallery } from './VideoGallery';
import { FileList } from './FileList';
import { LinkList } from './LinkList';
import { MembersList } from './MembersList';

interface ConversationDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversation: ConversationDTO | null;
  currentUserId: string;
  isUserOnline: (userId: string) => boolean;
  onRemoveMember?: (memberId: string) => Promise<boolean>;
  onLeaveGroup?: () => Promise<boolean>;
  onToggleMute?: () => Promise<boolean>;
  onTogglePin?: () => Promise<boolean>;
  onJumpToMessage?: (messageId: string) => void;
}

export function ConversationDetailsSheet({
  open,
  onOpenChange,
  conversation,
  currentUserId,
  onLeaveGroup,
  onJumpToMessage
}: ConversationDetailsSheetProps) {
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Use React Query hook - auto caching and refetching
  const { data: mediaSummary } = useMediaSummary(
    open && conversation ? conversation.id : ''
  );

  // Handle jump to message
  const handleJumpToMessage = (messageId: string) => {
    if (onJumpToMessage) {
      onJumpToMessage(messageId);
      onOpenChange(false); // Close the sheet after jumping
    }
  };

  if (!conversation) {
    return null;
  }

  const isGroup = conversation.type === 'group';
  const isCreator = conversation.creator_id === currentUserId;

  // Handle leave group
  const handleLeaveGroup = async () => {
    if (!onLeaveGroup) return;

    setLoading(true);
    try {
      const success = await onLeaveGroup();

      if (success) {
        toast.success('ออกจากกลุ่มสำเร็จ', 'คุณได้ออกจากกลุ่มแล้ว');
        onOpenChange(false);
      } else {
        toast.error('ไม่สามารถออกจากกลุ่มได้', 'โปรดลองอีกครั้ง');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('เกิดข้อผิดพลาด', 'ไม่สามารถออกจากกลุ่มได้');
    } finally {
      setLoading(false);
      setLeavingGroup(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-[80%] px-6 sm:max-w-md border-l-0 flex flex-col overflow-y-auto">
          <SheetHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={conversation.icon_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {isGroup ? <Users size={32} /> : <User size={32} />}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <SheetTitle className="text-xl">{conversation.title}</SheetTitle>
                <SheetDescription className="flex items-center justify-center gap-1">
                  {isGroup ? (
                    <>
                      <Users size={14} />
                      {conversation.member_count || 0} สมาชิก
                    </>
                  ) : (
                    'แชทส่วนตัว'
                  )}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <Separator />

          {/* Quick Actions */}
          

          <Separator />

          {/* Tabs: Info, Photos, Videos, Files, Links */}
          <Tabs defaultValue="info" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-5 text-xs">
              <TabsTrigger value="info" className="text-xs px-2">ข้อมูล</TabsTrigger>
              <TabsTrigger value="photos" className="text-xs px-1">
                <ImageIcon size={14} />
                {mediaSummary && mediaSummary.image_count > 0 && (
                  <span className="ml-0.5">{mediaSummary.image_count}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="videos" className="text-xs px-1">
                <Video size={14} />
                {mediaSummary && mediaSummary.video_count > 0 && (
                  <span className="ml-0.5">{mediaSummary.video_count}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="files" className="text-xs px-1">
                <FileText size={14} />
                {mediaSummary && mediaSummary.file_count > 0 && (
                  <span className="ml-0.5">{mediaSummary.file_count}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="links" className="text-xs px-1">
                <LinkIcon size={14} />
                {mediaSummary && mediaSummary.link_count > 0 && (
                  <span className="ml-0.5">{mediaSummary.link_count}</span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="flex-1 overflow-y-auto">
              {isGroup && (
                <MembersList
                  conversationId={conversation.id}
                  currentUserId={currentUserId}
                  isCreator={isCreator}
                />
              )}

              {!isGroup && (
                <div className="py-4">
                  <p className="text-sm text-muted-foreground text-center">
                    ข้อมูลแชทส่วนตัว
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="flex-1 overflow-y-auto">
              <div className="py-4">
                <PhotoGallery
                  conversationId={conversation.id}
                  onItemClick={handleJumpToMessage}
                />
              </div>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="flex-1 overflow-y-auto">
              <div className="py-4">
                <VideoGallery
                  conversationId={conversation.id}
                  onItemClick={handleJumpToMessage}
                />
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="flex-1 overflow-y-auto">
              <div className="py-4">
                <FileList
                  conversationId={conversation.id}
                  onItemClick={handleJumpToMessage}
                />
              </div>
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="flex-1 overflow-y-auto">
              <div className="py-4">
                <LinkList
                  conversationId={conversation.id}
                  onItemClick={handleJumpToMessage}
                />
              </div>
            </TabsContent>
          </Tabs>

          <Separator />

          {/* Leave Group Button */}
          {isGroup && onLeaveGroup && (
            <div className="pt-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setLeavingGroup(true)}
              >
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากกลุ่ม
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Leave Group Confirmation */}
      {isGroup && (
        <AlertDialog open={leavingGroup} onOpenChange={setLeavingGroup}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="text-destructive" size={20} />
                ออกจากกลุ่ม
              </AlertDialogTitle>
              <AlertDialogDescription>
                คุณแน่ใจหรือไม่ว่าต้องการออกจากกลุ่ม{' '}
                <span className="font-semibold">{conversation.title}</span>?
                {isCreator && (
                  <span className="block mt-2 text-destructive font-medium">
                    เนื่องจากคุณเป็นผู้สร้างกลุ่ม การออกจากกลุ่มอาจส่งผลต่อการจัดการกลุ่ม
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>ยกเลิก</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleLeaveGroup}
                disabled={loading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? 'กำลังดำเนินการ...' : 'ออกจากกลุ่ม'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
