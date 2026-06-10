import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Get API base URL from your existing backend (defaulting to port 5005 on host mac)
const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://127.0.0.1:5005';

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
      'X-Requested-With': 'ResilienceHub-Mobile',
      'X-App-Platform': 'mobile',
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

      if (response.status === 401) {
        this.clearAuthToken();
        try {
          await SecureStore.deleteItemAsync('authToken');
          await SecureStore.deleteItemAsync('userId');
          await SecureStore.deleteItemAsync('userEmail');
        } catch (e) {
          console.error('Failed to clear SecureStore credentials:', e);
        }
      }

      // Safely parse JSON or handle empty response to avoid SyntaxError: JSON Parse error
      let data: any = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('JSON parsing failed:', e);
            throw new Error('Invalid JSON response from server');
          }
        }
      } else {
        const text = await response.text();
        if (!response.ok) {
          throw new Error(text || `HTTP ${response.status}`);
        }
      }

      if (!response.ok) {
        throw new Error((data?.message) || `HTTP ${response.status}`);
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
    const response = await this.request<any>('/api/auth/mobile-login', {
      method: 'POST',
      body: JSON.stringify({ username: email, password }),
    });

    // Wrap the response user object under `user` property to match mobile frontend expectations
    if (response.data && !response.data.user) {
      response.data = {
        user: response.data,
      };
    }
    return response;
  }

  static async forgotPassword(email: string) {
    return this.request<any>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async register(data: any) {
    const response = await this.request<any>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  }

  static async logout() {
    const result = await this.request('/api/auth/logout', {
      method: 'POST',
    });
    this.clearAuthToken();
    return result;
  }

  static async getCurrentUser() {
    const response = await this.request<any>('/api/auth/me');
    return response;
  }

  // Emotions
  static async getEmotions(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/emotions`);
  }

  // Alias for mobile compatibility
  static async getUserEmotions(userId: number) {
    return this.getEmotions(userId);
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

  static async updateJournalEntry(entryId: number, entryData: any) {
    return this.request<any>(`/api/journal/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(entryData),
    });
  }

  static async deleteJournalEntry(entryId: number) {
    return this.request<any>(`/api/journal/${entryId}`, {
      method: 'DELETE',
    });
  }

  static async updateJournalTags(entryId: number, selectedTags: string[]) {
    return this.request<any>(`/api/journal/${entryId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ selectedTags }),
    });
  }

  // Alias for mobile compatibility
  static async createJournal(userId: number, entryData: any) {
    return this.createJournalEntry(userId, entryData);
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

  // Milestones
  static async getGoalMilestones(goalId: number) {
    return this.request<any[]>(`/api/goals/${goalId}/milestones`);
  }

  static async createMilestone(goalId: number, milestoneData: any) {
    return this.request<any>(`/api/goals/${goalId}/milestones`, {
      method: 'POST',
      body: JSON.stringify({ ...milestoneData, goalId }),
    });
  }

  static async toggleMilestoneCompletion(milestoneId: number, isCompleted: boolean) {
    return this.request<any>(`/api/milestones/${milestoneId}/completion`, {
      method: 'PATCH',
      body: JSON.stringify({ isCompleted }),
    });
  }

  static async getAllMilestones(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/goals/milestones`);
  }

  // Reframe Coach
  static async getReframePractices(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/reframe-coach/results`);
  }

  static async getReframeProfile(userId: number) {
    return this.request<any>(`/api/users/${userId}/reframe-coach/profile`);
  }

  static async getReframeScenarios(userId: number, thoughtId: number) {
    return this.request<any>(`/api/users/${userId}/thoughts/${thoughtId}/practice-scenarios`);
  }

  static async createReframeResult(resultData: any) {
    return this.request<any>('/api/reframe-coach/results', {
      method: 'POST',
      body: JSON.stringify(resultData),
    });
  }

  // Resources
  static async getResources() {
    return this.request<any[]>('/api/resources');
  }

  // Notifications
  static async getNotifications() {
    return this.request<any[]>('/api/notifications');
  }

  static async getUnreadNotifications() {
    return this.request<any[]>('/api/notifications/unread');
  }

  static async markNotificationRead(id: number) {
    return this.request<any>(`/api/notifications/read/${id}`, {
      method: 'POST',
    });
  }

  static async markAllNotificationsRead() {
    return this.request<any>('/api/notifications/read-all', {
      method: 'POST',
    });
  }

  // Emotions update and delete
  static async updateEmotion(userId: number, emotionId: number, emotionData: any) {
    return this.request<any>(`/api/users/${userId}/emotions/${emotionId}`, {
      method: 'PATCH',
      body: JSON.stringify(emotionData),
    });
  }

  static async deleteEmotion(userId: number, emotionId: number) {
    return this.request<any>(`/api/users/${userId}/emotions/${emotionId}`, {
      method: 'DELETE',
    });
  }

  // Thoughts update and delete
  static async updateThoughtRecord(userId: number, thoughtId: number, thoughtData: any) {
    return this.request<any>(`/api/users/${userId}/thoughts/${thoughtId}`, {
      method: 'PATCH',
      body: JSON.stringify(thoughtData),
    });
  }

  static async deleteThoughtRecord(userId: number, thoughtId: number) {
    return this.request<any>(`/api/users/${userId}/thoughts/${thoughtId}`, {
      method: 'DELETE',
    });
  }

  // Protective Factors
  static async getProtectiveFactors(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/protective-factors`);
  }

  static async createProtectiveFactor(userId: number, data: any) {
    return this.request<any>(`/api/users/${userId}/protective-factors`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateProtectiveFactor(userId: number, factorId: number, data: any) {
    return this.request<any>(`/api/users/${userId}/protective-factors/${factorId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteProtectiveFactor(userId: number, factorId: number) {
    return this.request<any>(`/api/users/${userId}/protective-factors/${factorId}`, {
      method: 'DELETE',
    });
  }

  // Coping Strategies
  static async getCopingStrategies(userId: number) {
    return this.request<any[]>(`/api/users/${userId}/coping-strategies`);
  }

  static async createCopingStrategy(userId: number, data: any) {
    return this.request<any>(`/api/users/${userId}/coping-strategies`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateCopingStrategy(userId: number, strategyId: number, data: any) {
    return this.request<any>(`/api/users/${userId}/coping-strategies/${strategyId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async deleteCopingStrategy(userId: number, strategyId: number) {
    return this.request<any>(`/api/users/${userId}/coping-strategies/${strategyId}`, {
      method: 'DELETE',
    });
  }

  // Therapist & Client Assignments
  static async getTherapistAssignments() {
    return this.request<any[]>('/api/therapist/assignments');
  }

  static async assignResource(resourceId: number, clientId: number, notes: string) {
    return this.request<any>('/api/resources/assign', {
      method: 'POST',
      body: JSON.stringify({ resourceId, clientId, notes }),
    });
  }

  static async deleteResourceAssignment(assignmentId: number) {
    return this.request<any>(`/api/resource-assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  }

  static async getTherapistClients() {
    return this.request<any[]>('/api/users/clients');
  }

  // Therapist Stats
  static async getTherapistJournalStats() {
    return this.request<{ totalCount: number }>('/api/therapist/stats/journal');
  }

  static async getTherapistThoughtStats() {
    return this.request<{ totalCount: number }>('/api/therapist/stats/thoughts');
  }

  static async getTherapistGoalStats() {
    return this.request<{ totalCount: number }>('/api/therapist/stats/goals');
  }

  // Admin
  static async getAdminStats() {
    return this.request<any>('/api/admin/stats');
  }

  static async getAllUsers() {
    return this.request<any[]>('/api/users');
  }

  static async updateUser(userId: number, data: any) {
    return this.request<any>(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  static async deleteUser(userId: number) {
    return this.request<any>(`/api/users/${userId}`, {
      method: 'DELETE',
    });
  }

  static async registerByAdmin(data: any) {
    return this.request<any>('/api/users/register-by-admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async resetUserPassword(userId: number) {
    return this.request<any>(`/api/users/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  // Invitations
  static async getInvitations() {
    return this.request<any[]>('/api/invitations');
  }

  static async inviteClient(data: { name: string; email: string }) {
    return this.request<any>('/api/auth/invite-client', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async resendInvitation(invitationId: number) {
    return this.request<any>(`/api/invitations/${invitationId}/resend`, {
      method: 'POST',
    });
  }

  // Client Viewing Context (for therapist/admin viewing client data)
  static async setCurrentViewingClient(clientId: number) {
    return this.request<any>('/api/users/current-viewing-client', {
      method: 'POST',
      body: JSON.stringify({ clientId }),
    });
  }

  static async getCurrentViewingClient() {
    return this.request<any>('/api/users/current-viewing-client');
  }
}