// src/hooks/useFriendship.ts
import { useCallback, useEffect, useState } from 'react';
import useFriendshipStore from '@/stores/friendshipStore';
import useUserStore from '@/stores/userStore';
import type {  FriendAcceptNotification, FriendRequestNotification, FriendshipStatus, PendingRequestItem, WebSocketEnvelope } from '@/types/user-friendship.types';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { toast } from '@/utils/toast';


/**
 * Hook สำหรับจัดการความสัมพันธ์ระหว่างผู้ใช้ (เพื่อน, คำขอเป็นเพื่อน, การบล็อก)
 */
export const useFriendship = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // เข้าถึง WebSocket context
  const { addEventListener, isConnected } = useWebSocketContext();

  // เข้าถึง friendship store
  const {
    friends,
    pendingRequests,
    blockedUsers,
    searchResults,
    friendshipStatusMap,
    fetchFriends,
    fetchPendingRequests,
    fetchBlockedUsers,
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    blockUser,
    unblockUser,
    getFriendshipStatus,
    setError: setStoreError,

    // เพิ่ม function สำหรับการอัพเดทข้อมูลจาก WebSocket
    addNewFriendRequest,
    updateFriendStatus,
    removeFromPendingRequests,
    addToFriends,
    removeFromFriends,

  } = useFriendshipStore();

  // เข้าถึง user store เพื่อดึงสถานะผู้ใช้
  const fetchUserStatuses = useUserStore(state => state.fetchUserStatuses);

  // ล้างข้อความผิดพลาดใน store เมื่อ component unmount
  useEffect(() => {
    return () => {
      setStoreError(null);
    };
  }, [setStoreError]);


// ลงทะเบียนรับเหตุการณ์ WebSocket เมื่อ hook ถูกเรียกใช้
useEffect(() => {
  if (!isConnected) return;
  
  //console.log('Registering WebSocket event listeners for friendship events');
  
   // รับคำขอเป็นเพื่อนใหม่
   const unsubFriendRequest = addEventListener('message:friend.request', (rawData: WebSocketEnvelope<FriendRequestNotification>) => {
    //console.log('Friend friend.request HOOK:', rawData);
    
    const data = rawData.data;


    const newRequest = {
            display_name: data.sender.display_name,
            profile_image_url: data.sender.profile_image_url,
            request_id: data.request_id,
            requested_at: data.requested_at,
            user_id: data.user_id,
            username: data.sender.username
    };


    addNewFriendRequest(newRequest);
  });
  
  // รับการตอบรับคำขอเป็นเพื่อน
  const unsubFriendAccept = addEventListener('message:friend.accept', (rawData: WebSocketEnvelope<FriendAcceptNotification>) => {
    //console.log('friend.accept HOOK:', rawData);
    
    const data = rawData.data;

    // 1. อัพเดทสถานะความสัมพันธ์เป็น "accepted"
    //updateFriendStatus(data.id, 'accepted', data.friendship_id);
    
    // 2. เพิ่มผู้ใช้เข้าไปในรายชื่อเพื่อน
    const newFriend = {
      id: data.acceptor?.id || "",
      username: data.acceptor?.username || "",
      display_name: data.acceptor?.display_name || "",
      profile_image_url: data.acceptor?.profile_image_url || null,
      friendship_id: data.friendship_id,
      friendship_status: 'accepted' as FriendshipStatus,
      last_active_at: data.acceptor?.last_active_at || null,
      status: 'active', // Default value
    };


    //console.log('newFriend:', newFriend);
 
    addToFriends(newFriend);
  });
  
  // รับการลบเพื่อน
  const unsubFriendRemove = addEventListener('message:friend.remove', (data: PendingRequestItem) => {
    console.log('Friend removed via WebSocket:', data);

    // อัพเดท store - ลบออกจากรายชื่อเพื่อน
    removeFromFriends(data.user_id);

    // แสดง toast notification
    toast.error('เพื่อนถูกลบ', `${data.display_name} ได้ถูกลบออกจากรายชื่อเพื่อน`);
  });

  // รับการปฏิเสธคำขอเป็นเพื่อน
  const unsubFriendReject = addEventListener('message:friend.reject', (data: PendingRequestItem) => {
    console.log('Friend request rejected via WebSocket:', data);

    // อัพเดท store - ลบออกจาก pending requests
    removeFromPendingRequests(data.request_id);

    // แสดง toast notification
    toast.info('คำขอถูกปฏิเสธ', `${data.display_name} ได้ปฏิเสธคำขอเป็นเพื่อน`);
  });

  // รับการบล็อกผู้ใช้
  const unsubUserBlocked = addEventListener('message:user.blocked', (rawData) => {
    console.log('User blocked via WebSocket:', rawData);

    // แสดง toast notification
    toast.warning('บล็อกผู้ใช้สำเร็จ', 'คุณได้บล็อกผู้ใช้นี้แล้ว');
  });

  // รับการปลดบล็อกผู้ใช้
  const unsubUserUnblocked = addEventListener('message:user.unblocked', (rawData) => {
    console.log('User unblocked via WebSocket:', rawData);

    // แสดง toast notification
    toast.success('ปลดบล็อกสำเร็จ', 'คุณสามารถติดต่อกับผู้ใช้นี้ได้แล้ว');
  });



  // คืนค่า function สำหรับยกเลิกการลงทะเบียน event listeners เมื่อ component unmount
  return () => {
    unsubFriendRequest();
    unsubFriendAccept();
    unsubFriendRemove();
    unsubFriendReject();
    unsubUserBlocked();
    unsubUserUnblocked();

  };
}, [
  isConnected, 
  addEventListener, 
  addNewFriendRequest, 
  updateFriendStatus, 
  removeFromPendingRequests, 
  addToFriends, 
  removeFromFriends, 
  fetchFriends, 
  fetchUserStatuses
]);


  /**
   * ดึงรายชื่อเพื่อนทั้งหมด และอัปเดตสถานะผู้ใช้
   */
  const getFriends = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const friendsList = await fetchFriends();

      // ดึงสถานะผู้ใช้
      if (friendsList.length > 0) {
        const userIds = friendsList.map(friend => friend.id);
        await fetchUserStatuses(userIds);
      }

      return friendsList;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงรายชื่อเพื่อน';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, fetchUserStatuses]);

  /**
   * ดึงคำขอเป็นเพื่อนที่รอการตอบรับ
   */
  const getPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const requests = await fetchPendingRequests();

      // ดึงสถานะผู้ใช้
      if (requests.length > 0) {
        const userIds = requests.map(request => request.user_id);
        await fetchUserStatuses(userIds);
      }

      return requests;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงคำขอเป็นเพื่อน';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchPendingRequests, fetchUserStatuses]);

  /**
   * ดึงรายชื่อผู้ใช้ที่ถูกบล็อก
   */
  const getBlockedUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const blocked = await fetchBlockedUsers();
      return blocked;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงรายชื่อผู้ใช้ที่ถูกบล็อก';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [fetchBlockedUsers]);

  /**
   * ค้นหาผู้ใช้สำหรับเพิ่มเป็นเพื่อน
   * @param query คำค้นหา
   * @param limit จำนวนผลลัพธ์สูงสุด
   * @param offset ตำแหน่งเริ่มต้นของผลลัพธ์
   * @param exactMatch ถ้าเป็น true จะค้นหาให้ตรงกับทั้งคำเท่านั้น
   */
  const search = useCallback(async (query: string, limit?: number, offset?: number, exactMatch?: boolean) => {
    try {
      setLoading(true);
      setError(null);

      const results = await searchUsers(query, limit, offset, exactMatch);

      // ดึงสถานะผู้ใช้
      if (results.length > 0) {
        const userIds = results.map(user => user.id);
        await fetchUserStatuses(userIds);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการค้นหาผู้ใช้';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchUsers, fetchUserStatuses]);

  /**
   * ส่งคำขอเป็นเพื่อน
   * @param friendId ID ของผู้ใช้ที่ต้องการส่งคำขอเป็นเพื่อน
   */
  const sendRequest = useCallback(async (friendId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await sendFriendRequest(friendId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งคำขอเป็นเพื่อน';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [sendFriendRequest]);

  /**
   * ยอมรับคำขอเป็นเพื่อน
   * @param requestId ID ของคำขอเป็นเพื่อน
   */
  const acceptRequest = useCallback(async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await acceptFriendRequest(requestId);

      // รีเฟรชรายชื่อเพื่อนหลังจากยอมรับคำขอ
      if (success) {
        await fetchFriends();
      }

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการยอมรับคำขอเป็นเพื่อน';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [acceptFriendRequest, fetchFriends]);

  /**
   * ปฏิเสธคำขอเป็นเพื่อน
   * @param requestId ID ของคำขอเป็นเพื่อน
   */
  const rejectRequest = useCallback(async (requestId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await rejectFriendRequest(requestId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการปฏิเสธคำขอเป็นเพื่อน';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [rejectFriendRequest]);

  /**
   * ลบเพื่อน
   * @param friendId ID ของเพื่อนที่ต้องการลบ
   */
  const deleteFriend = useCallback(async (friendId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await removeFriend(friendId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบเพื่อน';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [removeFriend]);

  /**
   * บล็อกผู้ใช้
   * @param userId ID ของผู้ใช้ที่ต้องการบล็อก
   */
  const block = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await blockUser(userId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการบล็อกผู้ใช้';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [blockUser]);

  /**
   * เลิกบล็อกผู้ใช้
   * @param userId ID ของผู้ใช้ที่ต้องการเลิกบล็อก
   */
  const unblock = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);

      const success = await unblockUser(userId);
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการเลิกบล็อกผู้ใช้';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [unblockUser]);

  /**
   * ดึงสถานะความสัมพันธ์กับผู้ใช้
   * @param userId ID ของผู้ใช้
   */
  const getFriendshipStatusWithUser = useCallback((userId: string): FriendshipStatus | null => {
    return getFriendshipStatus(userId);
  }, [getFriendshipStatus]);

  /**
   * ตรวจสอบว่าผู้ใช้เป็นเพื่อนกับผู้ใช้ปัจจุบันหรือไม่
   * @param userId ID ของผู้ใช้
   */
  const isFriend = useCallback((userId: string): boolean => {
    return getFriendshipStatus(userId) === 'accepted';
  }, [getFriendshipStatus]);

  /**
   * ตรวจสอบว่ามีคำขอเป็นเพื่อนที่รอการตอบรับหรือไม่
   * @param userId ID ของผู้ใช้
   */
  const hasPendingRequest = useCallback((userId: string): boolean => {
    return getFriendshipStatus(userId) === 'pending';
  }, [getFriendshipStatus]);

  /**
   * ตรวจสอบว่าผู้ใช้ถูกบล็อกหรือไม่
   * @param userId ID ของผู้ใช้
   */
  const isBlocked = useCallback((userId: string): boolean => {
    return getFriendshipStatus(userId) === 'blocked';
  }, [getFriendshipStatus]);

  /**
   * ดึงรายชื่อเพื่อน, คำขอเป็นเพื่อน, และผู้ใช้ที่ถูกบล็อกทั้งหมดพร้อมกัน
   */
  const loadAllFriendshipData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [friendsList, pendingReqs, blockedList] = await Promise.all([
        fetchFriends(),
        fetchPendingRequests(),
        fetchBlockedUsers()
      ]);

      // ดึงสถานะผู้ใช้
      const allUserIds = [
        ...friendsList.map(friend => friend.id),
        ...pendingReqs.map(request => request.user_id)
      ];

      if (allUserIds.length > 0) {
        await fetchUserStatuses(allUserIds);
      }

      return {
        friends: friendsList,
        pendingRequests: pendingReqs,
        blockedUsers: blockedList
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดึงข้อมูลความสัมพันธ์';
      setError(errorMessage);
      return {
        friends: [],
        pendingRequests: [],
        blockedUsers: []
      };
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, fetchPendingRequests, fetchBlockedUsers, fetchUserStatuses]);

  return {
    friends,
    pendingRequests,
    blockedUsers,
    searchResults,
    friendshipStatusMap,
    loading,
    error,
    getFriends,
    getPendingRequests,
    getBlockedUsers,
    search,
    sendRequest,
    acceptRequest,
    rejectRequest,
    deleteFriend,
    block,
    unblock,
    getFriendshipStatusWithUser,
    isFriend,
    hasPendingRequest,
    isBlocked,
    loadAllFriendshipData,
    setError,

    // เพิ่ม property เพื่อให้รู้ว่า WebSocket เชื่อมต่ออยู่หรือไม่
    isWebSocketConnected: isConnected,
  };
};

export default useFriendship;