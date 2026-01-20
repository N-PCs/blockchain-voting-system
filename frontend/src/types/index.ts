/**
 * Type definitions for Blockchain Voting System
 */

// User types
export interface User {
  id: string;
  uuid: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  governmentId: string;
  userType: 'voter' | 'admin';
  registrationStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistration {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  governmentId: string;
}

export interface AuthUser {
  user: User;
  token: string;
  expiresAt: string;
}

// Election types
export interface Election {
  id: string;
  uuid: string;
  title: string;
  description: string;
  electionType: 'national' | 'state' | 'local' | 'referendum';
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  uuid: string;
  electionId: string;
  userId: string;
  name: string;
  partyAffiliation: string;
  biography: string;
  position: string;
  photoUrl: string;
  isActive: boolean;
}

// Vote types
export interface Vote {
  id: string;
  uuid: string;
  electionId: string;
  voterId: string;
  candidateId: string;
  voteHash: string;
  transactionId: string;
  blockIndex?: number;
  castedAt: string;
  status: 'pending' | 'confirmed' | 'invalid';
}

export interface VoteSubmission {
  electionId: string;
  candidateId: string;
}

// Blockchain types
export interface Block {
  index: number;
  timestamp: number;
  formattedTime: string;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  minedBy: string;
  transactionCount: number;
}

export interface Transaction {
  type: 'vote' | 'coinbase';
  transactionId: string;
  electionId?: string;
  voterId?: string;
  candidateId?: string;
  timestamp: number;
  formattedTime: string;
  voteHash?: string;
  signature?: string;
  metadata?: Record<string, any>;
}

export interface BlockchainStats {
  chainLength: number;
  difficulty: number;
  pendingTransactions: number;
  totalTransactions: number;
  voteTransactions: number;
  latestBlockIndex: number;
  latestBlockHash: string;
  miningReward: number;
  isValid: boolean;
}

// WebSocket types
export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string | number;
  [key: string]: any; // Allow additional properties
}

export interface VoteNotification {
  type: 'vote_cast';
  voteId: string;
  electionId: string;
  voterId: string;
  candidateId: string;
  timestamp: string;
  transactionId?: string;
}

export interface BlockNotification {
  type: 'block_mined';
  index: number;
  hash: string;
  transactionCount: number;
  miner: string;
  timestamp: string;
}

export interface ElectionResultsNotification {
  type: 'election_results';
  electionId: string;
  title: string;
  results: CandidateResult[];
  totalVotes: number;
  updatedAt: string;
}

export interface CandidateResult {
  candidateId: string;
  candidateName: string;
  partyAffiliation: string;
  voteCount: number;
  percentage: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  governmentId: string;
  agreeToTerms: boolean;
}

// Store types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ElectionState {
  elections: Election[];
  activeElections: Election[];
  selectedElection: Election | null;
  candidates: Candidate[];
  isLoading: boolean;
  error: string | null;
}

export interface BlockchainState {
  stats: BlockchainStats | null;
  blocks: Block[];
  pendingTransactions: Transaction[];
  isLoading: boolean;
  error: string | null;
}

export interface WebSocketState {
  isConnected: boolean;
  clientId: string | null;
  notifications: WebSocketMessage[];
  lastNotification: WebSocketMessage | null;
  error: string | null;
}

// Component props
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}