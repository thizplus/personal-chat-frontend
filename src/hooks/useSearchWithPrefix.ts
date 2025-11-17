// src/hooks/useSearchWithPrefix.ts
import { useState, useCallback } from 'react';
import useFriendship from '@/hooks/useFriendship';


// ประเภทของผลลัพธ์การค้นหา
export type SearchResultType = 'user' | 'business';

// ผลลัพธ์การค้นหาแบบรวม
export interface CombinedSearchResult {
  id: string;
  type: SearchResultType;
  username: string;
  display_name: string;
  profile_image_url?: string | null;
  description?: string | null;
  friendship_status?: string;
  is_followed?: boolean;
}

/**
 * Custom hook สำหรับการค้นหาผู้ใช้หรือธุรกิจด้วย prefix
 * ถ้าเริ่มต้นด้วย @ จะค้นหาธุรกิจ
 * ถ้าไม่มี prefix จะค้นหาผู้ใช้ทั่วไป
 */
export const useSearchWithPrefix = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CombinedSearchResult[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  // เรียกใช้ hooks ที่เกี่ยวข้อง
  const { search: searchUsers } = useFriendship();
  // Business search removed
  // const { searchBusinesses } = useBusinessAccount();
  // const { isFollowingBusiness } = useBusiness();

  /**
   * ค้นหาตาม prefix ในคำค้นหา
   * @param query คำค้นหา (อาจมี @ นำหน้าหรือไม่ก็ได้)
   * @param exactMatch ถ้าเป็น true จะค้นหาให้ตรงกับทั้งคำเท่านั้น
   */
  const search = useCallback(async (query: string, exactMatch: boolean = false) => {
    if (query.trim().length < 2) {
      setResults([]);
      setError('กรุณาระบุคำค้นหาอย่างน้อย 2 ตัวอักษร');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const combinedResults: CombinedSearchResult[] = [];
      
      // Business search removed - @ prefix no longer supported
      if (query.startsWith('@')) {
        setResults([]);
        setError('การค้นหาธุรกิจถูกปิดใช้งาน');
        setLoading(false);
        return [];
      } else {
        // ค้นหาผู้ใช้ปกติ
        const users = await searchUsers(query, 10, 0, exactMatch);
        
        if (users && users.length > 0) {
          users.forEach(user => {
            // กรองผลลัพธ์ตาม exactMatch ถ้าต้องการ (กรณี backend ไม่รองรับ)
            if (exactMatch && 
                !user.username?.toLowerCase().includes(query.toLowerCase()) && 
                !user.display_name?.toLowerCase().includes(query.toLowerCase())) {
              return; // ข้ามข้อมูลที่ไม่ตรงกับคำค้นหา
            }
            
            combinedResults.push({
              id: user.id,
              type: 'user',
              username: user.username || '',
              display_name: user.display_name || '',
              profile_image_url: user.profile_image_url,
              friendship_status: user.friendship_status
            });
          });
        }
      }
      
      setResults(combinedResults);
      
      if (combinedResults.length === 0) {
        setError('ไม่พบผลลัพธ์ที่ตรงกับการค้นหา');
      }
      
      return combinedResults;
    } catch (err) {
      console.error('Error searching:', err);
      const errorMessage = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการค้นหา';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchUsers]);

  /**
   * อัปเดตสถานะความสัมพันธ์หลังส่งคำขอเป็นเพื่อน
   */
  const updateFriendshipStatus = useCallback((userId: string, status: string) => {
    setResults(prev => 
      prev.map(item => 
        item.id === userId && item.type === 'user'
          ? { ...item, friendship_status: status }
          : item
      )
    );
  }, []);

  /**
   * อัปเดตสถานะการติดตามธุรกิจ
   */
  const updateFollowStatus = useCallback((businessId: string, isFollowed: boolean) => {
    setResults(prev => 
      prev.map(item => 
        item.id === businessId && item.type === 'business'
          ? { ...item, is_followed: isFollowed }
          : item
      )
    );
  }, []);

  /**
   * ตั้งค่าข้อความสำเร็จ
   */
  const setSuccessMessage = useCallback((message: string | null) => {
    setSuccess(message);
  }, []);

  return {
    loading,
    error,
    success,
    results,
    search,
    updateFriendshipStatus,
    updateFollowStatus,
    setError,
    setSuccessMessage
  };
};

export default useSearchWithPrefix;