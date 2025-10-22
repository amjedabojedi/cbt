import Constants from 'expo-constants';

// Get API base URL from your existing backend
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:5003';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}

export class ApiService {
  private static baseURL = API_BASE_URL;
  private static authToken: string | null = null;

  static setAuthToken(token: string) {
    this.authToken = token;
  }

  static clearAuthToken() {
    this.authToken = null;
  }

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session auth
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return { data };
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      return { 
        error: error instanceof Error ? error.message : 'Network error' 
      };
    }
  }

  // Authentication
  static async login(email: string, password: string) {
    return this.request<{ user: any; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  static async logout() {
    const result = await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearAuthToken();
    return result;
  }

  static async getCurrentUser() {
    return this.request<any>('/api/auth/me');
  }

  // Emotions
  static async getEmotions(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/emotions`);
  }

  static async createEmotion(userId: number, emotionData: any) {
    return this.request<any>(`/api/users/${userId}/emotions`, {
      method: 'POST',
      body: JSON.stringify(emotionData),
    });
  }

  // Thought Records
  static async getThoughtRecords(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/thoughts`);
  }

  static async createThoughtRecord(userId: number, thoughtData: any) {
    return this.request<any>(`/api/users/${userId}/thoughts`, {
      method: 'POST',
      body: JSON.stringify(thoughtData),
    });
  }

  // Journal
  static async getJournalEntries(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/journal`);
  }

  static async createJournalEntry(userId: number, entryData: any) {
    return this.request<any>(`/api/users/${userId}/journal`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  // Goals
  static async getGoals(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/goals`);
  }

  static async createGoal(userId: number, goalData: any) {
    return this.request<any>(`/api/users/${userId}/goals`, {
      method: 'POST',
      body: JSON.stringify(goalData),
    });
  }
}