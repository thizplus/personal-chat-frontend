// src/services/apiService.ts
import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { AUTH_API } from '@/constants/api/standardApiConstants';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';

/**
 * สร้าง axios instance สำหรับเรียกใช้ API
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

/**
 * Interceptor สำหรับเพิ่ม token ใน header ทุกครั้งที่มีการเรียก API
 */
apiClient.interceptors.request.use(
  (config) => {
    // เข้าถึง token จาก localStorage แบบถูกต้อง
    const authData = localStorage.getItem('auth-storage');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        const accessToken = parsed.state?.accessToken;
        
        if (accessToken && config.headers) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
      } catch (e) {
        console.error('Failed to parse auth data:', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor สำหรับจัดการเมื่อ token หมดอายุ
 */
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // ถ้าเป็น error 401 (Unauthorized) และยังไม่เคยลองทำการ refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // ดึง refreshToken จาก Zustand store
        const refreshToken = useAuthStore.getState().refreshToken;
        
        if (!refreshToken) {
          // ถ้าไม่มี refresh token ให้ logout
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }
        
        // เรียกใช้ API เพื่อขอ token ใหม่
        const response = await axios.post(`${API_BASE_URL}${AUTH_API.REFRESH_TOKEN}`, {
          refresh_token: refreshToken,
        });
        
        if (response.data.success && response.data.access_token) {
          // อัปเดตข้อมูลใน store
          const currentUser = useAuthStore.getState().user;
          useAuthStore.getState().setAuth(
            currentUser!, 
            response.data.access_token, 
            response.data.refresh_token || refreshToken
          );
          
          // ส่งคำขอเดิมอีกครั้งพร้อม token ใหม่
          originalRequest.headers['Authorization'] = `Bearer ${response.data.access_token}`;
          return axios(originalRequest);
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (refreshError) {
        // หากไม่สามารถ refresh token ได้ให้ logout
        useAuthStore.getState().clearAuth();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Service สำหรับเรียกใช้ API
 */
const apiService = {
  /**
   * ส่งคำขอ GET
   * @param url - URL ปลายทาง
   * @param params - พารามิเตอร์สำหรับ query string
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  get: async <T>(url: string, params?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.get<T>(url, { params, ...config });
    return response.data;
  },
  
  /**
   * ส่งคำขอ POST
   * @param url - URL ปลายทาง
   * @param data - ข้อมูลที่จะส่งไปยัง API
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  post: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  },
  
  /**
   * ส่งคำขอ PUT
   * @param url - URL ปลายทาง
   * @param data - ข้อมูลที่จะส่งไปยัง API
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  put: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  },
  
  /**
   * ส่งคำขอ PATCH
   * @param url - URL ปลายทาง
   * @param data - ข้อมูลที่จะส่งไปยัง API
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  patch: async <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
  },
  
  /**
   * ส่งคำขอ DELETE
   * @param url - URL ปลายทาง
   * @param config - ค่า config เพิ่มเติมสำหรับ axios
   */
  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  },
  
  /**
   * ส่งคำขอ Upload ไฟล์
   * @param url - URL ปลายทาง
   * @param formData - FormData ที่มีไฟล์ที่จะอัปโหลด
   * @param onProgress - callback สำหรับติดตามความคืบหน้าในการอัปโหลด
   */
  upload: async <T>(
    url: string, 
    formData: FormData, 
    onProgress?: (percentage: number) => void
  ): Promise<T> => {
    const response = await apiClient.put<T>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentage);
        }
      },
    });
    return response.data;
  },
};

export default apiService;