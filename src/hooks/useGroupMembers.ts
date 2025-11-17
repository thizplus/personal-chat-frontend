// src/hooks/useGroupMembers.ts
import { useQuery } from '@tanstack/react-query';
import apiService from '@/services/apiService';
import { CONVERSATION_API } from '@/constants/api/standardApiConstants';

export interface GroupMember {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  profile_picture: string | null;
  role: 'admin' | 'member';
  joined_at: string;
  is_online: boolean;
}

interface GroupMembersResponse {
  members: GroupMember[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface UseGroupMembersOptions {
  page?: number;
  limit?: number;
  enabled?: boolean;
}

/**
 * Hook สำหรับดึงรายชื่อสมาชิกในกลุ่ม
 * @param conversationId - ID ของ conversation
 * @param options - ตัวเลือกสำหรับ pagination และ query config
 */
export function useGroupMembers(
  conversationId: string,
  options: UseGroupMembersOptions = {}
) {
  const { page = 1, limit = 20, enabled = true } = options;

  return useQuery({
    queryKey: ['groupMembers', conversationId, page, limit],
    queryFn: async (): Promise<GroupMembersResponse> => {
      const response = await apiService.get<{ data: GroupMembersResponse }>(
        CONVERSATION_API.GET_CONVERSATION_MEMBERS(conversationId),
        { page, limit }
      );
      return response.data;
    },
    enabled: enabled && !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
