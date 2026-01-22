/**
 * API Service for Voting System
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  ApiResponse,
  User,
  AuthUser,
  Election,
  Candidate,
  Vote,
  VoteSubmission,
  Block,
  BlockchainStats,
  Transaction,
} from '@/types';

class ApiService {
  private api: AxiosInstance;
  private blockchainApi: AxiosInstance;
  private wsUrl: string;

  constructor() {
    // Main PHP API
    this.api = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Python Blockchain API
    this.blockchainApi = axios.create({
      baseURL: '/blockchain',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // WebSocket URL - use default if window is not available
    this.wsUrl = typeof window !== 'undefined' 
      ? `ws://${window.location.hostname}:3001/ws`
      : 'ws://localhost:3001/ws';

    // Request interceptor for auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('authToken');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(userData: any): Promise<ApiResponse<User>> {
    const response = await this.api.post<ApiResponse<User>>('/auth/register', userData);
    return response.data;
  }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<AuthUser>> {
    const response = await this.api.post<ApiResponse<AuthUser>>('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      localStorage.setItem('authToken', response.data.data.token);
    }
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('authToken');
  }

  async getProfile(): Promise<ApiResponse<User>> {
    const response = await this.api.get<ApiResponse<User>>('/auth/profile');
    return response.data;
  }

  // Election endpoints
  async getActiveElections(): Promise<ApiResponse<Election[]>> {
    const response = await this.api.get<ApiResponse<Election[]>>('/elections/active');
    return response.data;
  }

  async getElection(electionId: string): Promise<ApiResponse<Election>> {
    const response = await this.api.get<ApiResponse<Election>>(`/elections/${electionId}`);
    return response.data;
  }

  async getCandidates(electionId: string): Promise<ApiResponse<Candidate[]>> {
    const response = await this.api.get<ApiResponse<Candidate[]>>(`/elections/${electionId}/candidates`);
    return response.data;
  }

  async checkEligibility(electionId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/elections/${electionId}/eligibility`);
    return response.data;
  }

  // Vote endpoints
  async castVote(voteData: VoteSubmission): Promise<ApiResponse<Vote>> {
    const response = await this.api.post<ApiResponse<Vote>>('/votes/cast', voteData);
    return response.data;
  }

  async getVote(voteId: string): Promise<ApiResponse<Vote>> {
    const response = await this.api.get<ApiResponse<Vote>>(`/votes/${voteId}`);
    return response.data;
  }

  async verifyVote(voteId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/votes/verify/${voteId}`);
    return response.data;
  }

  async getVotingHistory(page = 1, limit = 10): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>('/votes/history', {
      params: { page, limit },
    });
    return response.data;
  }

  // Blockchain endpoints
  async getBlockchainStats(): Promise<ApiResponse<BlockchainStats>> {
    const response = await this.blockchainApi.get<ApiResponse<BlockchainStats>>('/api/blockchain/stats');
    return response.data;
  }

  async getBlocks(page = 1, perPage = 10): Promise<ApiResponse<{ blocks: Block[]; pagination: any }>> {
    const response = await this.blockchainApi.get<ApiResponse<any>>('/api/blockchain/blocks', {
      params: { page, perPage },
    });
    return response.data;
  }

  async getBlock(blockIndex: number): Promise<ApiResponse<Block>> {
    const response = await this.blockchainApi.get<ApiResponse<Block>>(`/api/blockchain/blocks/${blockIndex}`);
    return response.data;
  }

  async getTransaction(transactionId: string): Promise<ApiResponse<Transaction>> {
    const response = await this.blockchainApi.get<ApiResponse<Transaction>>(`/api/blockchain/transactions/${transactionId}`);
    return response.data;
  }

  // Admin endpoints
  async getPendingRegistrations(): Promise<ApiResponse<User[]>> {
    const response = await this.api.get<ApiResponse<User[]>>('/admin/pending-registrations');
    return response.data;
  }

  async updateUserStatus(userId: string, status: string): Promise<ApiResponse<User>> {
    const response = await this.api.put<ApiResponse<User>>(`/admin/users/${userId}/status`, { status });
    return response.data;
  }

  async getElectionResults(electionId: string): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/admin/elections/${electionId}/results`);
    return response.data;
  }

  async getAuditTrail(electionId: string, page = 1, limit = 50): Promise<ApiResponse<any>> {
    const response = await this.api.get<ApiResponse<any>>(`/admin/elections/${electionId}/audit`, {
      params: { page, limit },
    });
    return response.data;
  }

  // Utility methods
  getAuthToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  isAdmin(): boolean {
    const user = localStorage.getItem('authToken');
    return user ? true : false;
  }

  // WebSocket
  getWebSocketUrl(): string {
    return this.wsUrl;
  }

  // Health checks
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  async checkBlockchainHealth(): Promise<boolean> {
    try {
      const response = await this.blockchainApi.get('/health');
      return response.data.status === 'healthy';
    } catch {
      return false;
    }
  }

  // Direct axios methods for compatibility
  get(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.api.get(url, config);
  }

  post(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.api.post(url, data, config);
  }

  put(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.api.put(url, data, config);
  }

  delete(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse> {
    return this.api.delete(url, config);
  }
}

// Singleton instance
export const api = new ApiService();
export default api;