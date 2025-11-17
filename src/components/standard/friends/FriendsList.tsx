// src/components/standard/friends/FriendsList.tsx
import React from 'react';
import type { FriendCategory } from '@/pages/standard/friend/FriendsPage';
import FriendItem from './FriendItem';
import GroupItem from './GroupItem'; // เพิ่ม import
import PendingRequestItem from './PendingRequestItem';
import BlockedUserItem from './BlockedUserItem';
import EmptyState from './EmptyState';
import type {
  FriendItem as FriendItemType,
  PendingRequestItem as PendingRequestItemType,
  BlockedUserItem as BlockedUserItemType
} from '@/types/user-friendship.types';
import type { ConversationDTO } from '@/types/conversation.types'; // เพิ่ม import

interface FriendsListProps {
  category: FriendCategory;
  loading: boolean;
  
  // แยกข้อมูลตาม category
  friends?: FriendItemType[];
  groups?: ConversationDTO[]; // เพิ่ม prop นี้
  pendingRequests?: PendingRequestItemType[];
  blockedUsers?: BlockedUserItemType[];

  onAcceptRequest: (id: string) => Promise<boolean>;
  onRejectRequest: (id: string) => Promise<boolean>;
  onUnblockUser: (id: string) => Promise<boolean>;
  onRemoveFriend?: (id: string) => Promise<boolean>;
  onBlockUser?: (id: string) => Promise<boolean>;
  onStartConversation?: (id: string) => Promise<string>;
  onLeaveGroup?: (id: string) => Promise<boolean>; // เพิ่ม prop นี้
}

const FriendsList: React.FC<FriendsListProps> = ({
  category,
  loading,
  friends = [],
  groups = [],
  pendingRequests = [],
  blockedUsers = [],
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onBlockUser,
  onUnblockUser,
  onStartConversation,
  onLeaveGroup,
}) => {
  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto px-6 pb-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // แสดงข้อมูลตาม category ที่เลือก
  const renderContent = () => {
    switch (category) {
      case 'all':
        return (
          <>
            {friends.length > 0 ? (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-medium text-card-foreground">รายชื่อเพื่อน ({friends.length})</h2>
                </div>
                {friends.map(friend => (
                  <FriendItem 
                    key={friend.id} 
                    friend={friend}
                    onRemoveFriend={onRemoveFriend}
                    onBlockUser={onBlockUser}
                    onStartConversation={onStartConversation}
                  />
                ))}
              </>
            ) : (
              <EmptyState category="all" />
            )}
          </>
        );
        
      case 'groups':
        return (
          <>
            {groups.length > 0 ? (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-medium text-card-foreground">กลุ่มสนทนา ({groups.length})</h2>
                </div>
                {groups.map(group => (
                  <GroupItem 
                    key={group.id} 
                    group={group}
                    onLeaveGroup={onLeaveGroup}
                  />
                ))}
              </>
            ) : (
              <EmptyState category="groups" />
            )}
          </>
        );

      case 'pending':
        return (
          <>
            {pendingRequests.length > 0 ? (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-medium text-card-foreground">คำขอเป็นเพื่อน ({pendingRequests.length})</h2>
                </div>
                {pendingRequests.map(request => (
                  <PendingRequestItem 
                    key={request.request_id} 
                    request={request} 
                    onAccept={onAcceptRequest}
                    onReject={onRejectRequest}
                  />
                ))}
              </>
            ) : (
              <EmptyState category="pending" />
            )}
          </>
        );
        
      case 'blocked':
        return (
          <>
            {blockedUsers.length > 0 ? (
              <>
                <div className="px-4 py-3 border-b border-border">
                  <h2 className="text-sm font-medium text-card-foreground">ผู้ใช้ที่ถูกบล็อก ({blockedUsers.length})</h2>
                </div>
                {blockedUsers.map(user => (
                  <BlockedUserItem 
                    key={user.id} 
                    user={user} 
                    onUnblock={onUnblockUser}
                  />
                ))}
              </>
            ) : (
              <EmptyState category="blocked" />
            )}
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="bg-card rounded-xl shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
};

export default FriendsList;