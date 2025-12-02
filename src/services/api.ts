import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = 'https://tbctjhfypfcjextmxaow.supabase.co/functions/v1';
const SUPABASE_URL = 'https://tbctjhfypfcjextmxaow.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRiY3RqaGZ5cGZjamV4dG14YW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4Njk0NTMsImV4cCI6MjA3NDQ0NTQ1M30.YHapmamp0zmXna-SVn__db4b2BNASh07NxI4NB5RKks';

// Supabase 클라이언트 생성
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// API 응답 타입 정의
interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

interface User {
  id: number;
  email: string;
  name: string | null;
}

interface LoginResponse {
  token: string;
  user: User;
}

interface ResultData {
  petInfo: {
    name: string;
    age: string;
    weight: string;
    symptoms: string;
  };
  answers: string[];
  constitution: string;
}

// API 호출 헬퍼 함수
const apiCall = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Content-Type 헤더만 설정
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  const config: RequestInit = {
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    ...options,
  };
  
  // Authorization 헤더가 없으면 에러 발생 (로그인/회원가입 제외)
  console.log('Config headers:', config.headers);
  console.log('Authorization header:', config.headers?.Authorization);
  console.log('Request URL:', url);
  
  // 로그인/회원가입/찾기/이미지생성 엔드포인트는 Authorization 헤더가 필요하지 않음 (게스트 모드 지원)
  const isAuthEndpoint = url.includes('/auth-login') || url.includes('/auth-register') || url.includes('/auth-find-id') || url.includes('/auth-find-password') || url.includes('/generate-result-image');
  
  console.log('API Call Debug:', {
    url,
    isAuthEndpoint,
    hasAuthHeader: !!(config.headers && config.headers.Authorization),
    endpoint
  });
  
  if (!isAuthEndpoint && (!config.headers || !config.headers.Authorization)) {
    console.error('Missing Authorization header in config:', config);
    throw new Error('Authorization header is required');
  }

  // AbortController로 타임아웃 설정 (30초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  try {
    console.log('API Request:', { url, config });
    console.log('Request URL:', url);
    console.log('Request method:', config.method || 'GET');
    console.log('Request headers:', config.headers);
    
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('API Response:', { status: response.status, data });
    
    // 디버깅을 위한 추가 로그
    if (data.data && data.data.debug) {
      console.log('DEBUG INFO:', data.data.debug);
    }
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: API 호출 중 오류가 발생했습니다.`);
    }
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('API Error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // 네트워크 오류인 경우 더 자세한 정보 제공
    if (error.message === 'Network request failed' || error.name === 'AbortError') {
      console.error('Network request failed - possible causes:');
      console.error('1. Server is down or unreachable');
      console.error('2. Network connectivity issues');
      console.error('3. CORS issues');
      console.error('4. SSL/TLS certificate problems');
      console.error('5. Request timeout (10초 초과)');
      console.error('6. Expo Go network restrictions');
    }
    
    throw error;
  }
};

// 인증 API
export const authAPI = {
  // 회원가입
  register: async (userData: { email: string; password: string; nickname?: string }): Promise<ApiResponse<LoginResponse>> => {
    return apiCall<LoginResponse>('/auth-register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // 로그인
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<LoginResponse>> => {
    return apiCall<LoginResponse>('/auth-login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // 사용자 정보 조회
  getMe: async (token: string): Promise<ApiResponse<{ user: User }>> => {
    return apiCall<{ user: User }>('/auth-me', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // 아이디 찾기
  findId: async (email: string): Promise<ApiResponse> => {
    return apiCall('/auth-find-id', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // 비밀번호 찾기
  findPassword: async (email: string): Promise<ApiResponse> => {
    return apiCall('/auth-find-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // 회원 탈퇴
  withdraw: async (token: string): Promise<ApiResponse> => {
    return apiCall('/auth-withdraw', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },
};

// 결과 API
export const resultsAPI = {
  // 결과 저장
  saveResult: async (resultData: ResultData, token: string | null = null): Promise<ApiResponse<{ resultId: number; isLoggedIn: boolean }>> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return apiCall<{ resultId: number; isLoggedIn: boolean }>('/results-save', {
      method: 'POST',
      body: JSON.stringify(resultData),
      headers,
    });
  },

  // 내 결과 목록 조회 (auth-me 함수 사용)
  getMyResults: async (token: string): Promise<ApiResponse<{ results: any[] }>> => {
    const response = await authAPI.getMe(token);
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          results: response.data.results || []
        }
      };
    }
    return response;
  },

  // 특정 결과 조회
  getResult: async (resultId: number, token: string | null = null): Promise<ApiResponse<{ result: any }>> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return apiCall<{ result: any }>(`/results/${resultId}`, {
      method: 'POST',
      body: JSON.stringify({ resultId, token }),
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
    });
  },

  // 결과 삭제
  deleteResult: async (resultId: number, token: string): Promise<ApiResponse> => {
    return apiCall(`/results/${resultId}`, {
      method: 'POST',
      body: JSON.stringify({ resultId, token, action: 'delete' }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },

  // 이메일로 식단 전송
  sendDietEmail: async (resultId: string, email: string, token: string): Promise<ApiResponse<{ message: string }>> => {
    console.log('=== API SEND EMAIL DEBUG ===');
    console.log('resultId:', resultId);
    console.log('email:', email);
    console.log('token length:', token ? token.length : 0);
    
    const requestBody = { resultId, email };
    console.log('Request body:', requestBody);
    
    return apiCall<{ message: string }>('/email-send', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 결과 이미지 생성 (서버 사이드 렌더링)
  generateResultImage: async (petInfo: any, constitution: string, constitutionInfo: any, token: string | null = null): Promise<ApiResponse<{ image?: string; html?: string }>> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return apiCall<{ image?: string; html?: string }>('/generate-result-image', {
      method: 'POST',
      body: JSON.stringify({ petInfo, constitution, constitutionInfo }),
      headers,
    });
  },
};

// 상담 문의 API
export const consultationAPI = {
  // 상담 문의 저장
  createConsultation: async (consultationData: {
    name: string;
    phone: string;
    preferredDate: string;
    content: string;
  }, token: string | null = null): Promise<ApiResponse<{ consultationId: number }>> => {
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return apiCall<{ consultationId: number }>('/consultation-save', {
      method: 'POST',
      body: JSON.stringify(consultationData),
      headers,
    });
  },

  // 내 상담 문의 목록 조회
  getMyConsultations: async (token: string): Promise<ApiResponse<{ consultations: any[] }>> => {
    return apiCall<{ consultations: any[] }>('/consultations-get', {
      method: 'POST',
      body: JSON.stringify({ token }),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  },
};
