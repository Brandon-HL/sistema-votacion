const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Recuperar token del localStorage si existe
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type to json if it's not already set (e.g. by FormData logic) and not explicitly removed
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error desconocido en la petición');
    }
  }

  // Auth
  async signIn(dni: string, password: string) {
    const response = await this.request<{ token: string; user: any }>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ dni, password }),
    });

    if (response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  async signUp(data: {
    dni: string;
    password: string;
    full_name: string;
    phone: string;
    age: number;
    role: 'supervisor' | 'voter';
  }) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Polls
  async getPolls() {
    return this.request<any[]>('/polls');
  }

  async getPollById(id: string | number) {
    return this.request<any>(`/polls/${id}`);
  }

  async createPoll(data: {
    title: string;
    description?: string;
    closingDate: string;
    min_age?: number;
  }) {
    return this.request<any>('/polls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePoll(id: string | number, data: Partial<any>) {
    return this.request<any>(`/polls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePoll(id: string | number) {
    return this.request(`/polls/${id}`, {
      method: 'DELETE',
    });
  }

  // Candidates
  async getCandidatesByPoll(pollId: string | number) {
    return this.request<any[]>(`/candidates/poll/${pollId}`);
  }

  async createCandidate(pollId: string | number, data: {
    name: string;
    party: string;
    photo_url?: string;
    age?: number;
    description?: string;
  } | FormData) {
    const isFormData = data instanceof FormData;

    return this.request<any>(`/candidates/poll/${pollId}`, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: isFormData ? {} : { 'Content-Type': 'application/json' }, // Let browser set boundary for FormData
    });
  }

  async deleteCandidate(id: string | number) {
    return this.request(`/candidates/${id}`, {
      method: 'DELETE',
    });
  }

  // Votes
  async createVote(pollId: string | number, candidateId: string | number) {
    return this.request('/votes', {
      method: 'POST',
      body: JSON.stringify({ pollId, candidateId }),
    });
  }

  async getUserVotes() {
    return this.request<{ poll_id: number }[]>('/votes/my-votes');
  }

  async getVoteCounts(pollId: string | number) {
    return this.request<{ candidate_id: number; candidate_name: string; count: number }[]>(
      `/votes/counts/${pollId}`
    );
  }

  // Users (Admin only)
  async getAllUsers() {
    return this.request<any[]>('/users');
  }

  async getPendingUsers() {
    return this.request<any[]>('/users/pending');
  }

  async updateUserStatus(userId: string | number, status: 'active' | 'suspended' | 'pending') {
    return this.request<any>(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export const apiClient = new ApiClient(API_URL);

