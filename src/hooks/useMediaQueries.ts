// src/hooks/useMediaQueries.ts
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import conversationService from '@/services/conversationService';
import type { MediaSummary } from '@/types/media.types';

/**
 * Query key factory for media queries
 * Helps with cache invalidation and organization
 */
export const mediaKeys = {
  all: ['media'] as const,
  conversation: (conversationId: string) => ['media', conversationId] as const,
  type: (conversationId: string, type: string) => ['media', conversationId, type] as const,
  summary: (conversationId: string) => ['media', conversationId, 'summary'] as const,
  links: (conversationId: string) => ['media', conversationId, 'links'] as const,
};

/**
 * Hook to fetch media items by type with infinite scroll support
 *
 * @param conversationId - Conversation ID
 * @param type - Media type: 'image', 'video', 'file'
 * @param limit - Items per page
 */
export function useMediaByType(
  conversationId: string,
  type: 'image' | 'video' | 'file',
  limit: number = 20
) {
  return useInfiniteQuery({
    queryKey: mediaKeys.type(conversationId, type),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await conversationService.getMediaByType(conversationId, {
        type,
        limit,
        offset: pageParam,
      });

      if (!response.success) {
        throw new Error('Failed to fetch media');
      }

      return {
        data: response.data,
        pagination: response.pagination,
      };
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.has_more ? pagination.offset + limit : undefined;
    },
    initialPageParam: 0,
    enabled: !!conversationId, // Only fetch if conversationId exists
  });
}

/**
 * Hook to fetch links with infinite scroll support
 *
 * @param conversationId - Conversation ID
 * @param limit - Items per page
 */
export function useLinks(conversationId: string, limit: number = 20) {
  return useInfiniteQuery({
    queryKey: mediaKeys.links(conversationId),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await conversationService.getMediaByType(conversationId, {
        type: 'link',
        limit,
        offset: pageParam,
      });

      if (!response.success) {
        throw new Error('Failed to fetch links');
      }

      return {
        data: response.data,
        pagination: response.pagination,
      };
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.has_more ? pagination.offset + limit : undefined;
    },
    initialPageParam: 0,
    enabled: !!conversationId,
  });
}

/**
 * Hook to fetch media summary (counts)
 *
 * @param conversationId - Conversation ID
 */
export function useMediaSummary(conversationId: string) {
  return useQuery({
    queryKey: mediaKeys.summary(conversationId),
    queryFn: async () => {
      const response = await conversationService.getMediaSummary(conversationId);

      if (!response.success) {
        throw new Error('Failed to fetch media summary');
      }

      return response.data as MediaSummary;
    },
    enabled: !!conversationId,
  });
}

/**
 * Hook to invalidate all media queries for a conversation
 * Useful when a new message is received
 */
export function useInvalidateMedia() {
  const queryClient = useQueryClient();

  return (conversationId: string) => {
    console.log('[Media Cache] Invalidating media cache for conversation:', conversationId);

    // Invalidate all media queries for this conversation
    queryClient.invalidateQueries({
      queryKey: mediaKeys.conversation(conversationId),
      refetchType: 'all', // Refetch both active and inactive queries
    });

    // Also explicitly refetch to ensure immediate update
    queryClient.refetchQueries({
      queryKey: mediaKeys.conversation(conversationId),
      type: 'all', // Refetch all queries (active and inactive)
    });
  };
}
