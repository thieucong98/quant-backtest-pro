export type SubscriptionTier = 'FREE' | 'PRO' | 'INSTITUTIONAL';

export type SSOProvider = 'google' | 'github' | 'apple';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  createdAt: number;
  ssoProvider?: SSOProvider;
  tradingBalance: number;
  savedStrategiesCount: number;
  completedBacktests: number;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authMode: 'login' | 'register';
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setAuthModalOpen: (open: boolean, mode?: 'login' | 'register') => void;
  loginWithEmail: (email: string, pass: string) => Promise<boolean>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<boolean>;
  loginWithSSO: (provider: SSOProvider) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
}
