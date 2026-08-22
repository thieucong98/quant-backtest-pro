import { create } from 'zustand';
import { AuthState, SSOProvider, UserProfile } from '../types/auth';

const STORAGE_KEY = 'quant_backtest_auth_user';

const loadPersistedUser = (): UserProfile | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.error('Error loading persisted user', e);
  }
  return null;
};

const savePersistedUser = (user: UserProfile | null) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving user', e);
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  const initialUser = loadPersistedUser() || {
    id: 'usr_demo_trader',
    email: 'pro.trader@quantbacktest.com',
    name: 'Alex Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    tier: 'PRO',
    createdAt: Date.now() - 86400000 * 30,
    tradingBalance: 50000,
    savedStrategiesCount: 8,
    completedBacktests: 42
  };

  return {
    user: initialUser,
    isAuthenticated: true,
    isAuthModalOpen: false,
    authMode: 'login',
    isLoading: false,
    error: null,

    setAuthModalOpen: (open, mode = 'login') => {
      set({ isAuthModalOpen: open, authMode: mode, error: null });
    },

    loginWithEmail: async (email, password) => {
      set({ isLoading: true, error: null });
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API latency

      if (!email || !password) {
        set({ isLoading: false, error: 'Vui lòng nhập đầy đủ Email và Mật khẩu' });
        return false;
      }

      const name = email.split('@')[0].replace('.', ' ');
      const user: UserProfile = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        tier: 'PRO',
        createdAt: Date.now(),
        tradingBalance: 25000,
        savedStrategiesCount: 3,
        completedBacktests: 12
      };

      savePersistedUser(user);
      set({ user, isAuthenticated: true, isAuthModalOpen: false, isLoading: false });
      return true;
    },

    registerWithEmail: async (name, email, password) => {
      set({ isLoading: true, error: null });
      await new Promise(resolve => setTimeout(resolve, 800));

      if (!email || !password || !name) {
        set({ isLoading: false, error: 'Vui lòng điền đầy đủ các thông tin' });
        return false;
      }

      const user: UserProfile = {
        id: 'usr_' + Math.random().toString(36).substring(2, 9),
        email,
        name,
        tier: 'PRO',
        createdAt: Date.now(),
        tradingBalance: 10000,
        savedStrategiesCount: 1,
        completedBacktests: 0
      };

      savePersistedUser(user);
      set({ user, isAuthenticated: true, isAuthModalOpen: false, isLoading: false });
      return true;
    },

    loginWithSSO: async (provider: SSOProvider) => {
      set({ isLoading: true, error: null });
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockSSOUsers: Record<SSOProvider, Partial<UserProfile>> = {
        google: {
          name: 'Trader Google',
          email: 'google.trader@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
        },
        github: {
          name: 'Quant Developer',
          email: 'quant.dev@github.com',
          avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80'
        },
        apple: {
          name: 'Apple Institutional',
          email: 'apple.investor@icloud.com',
          avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80'
        }
      };

      const mock = mockSSOUsers[provider];
      const user: UserProfile = {
        id: 'usr_sso_' + Math.random().toString(36).substring(2, 9),
        email: mock.email!,
        name: mock.name!,
        avatarUrl: mock.avatarUrl,
        tier: 'INSTITUTIONAL',
        createdAt: Date.now(),
        ssoProvider: provider,
        tradingBalance: 100000,
        savedStrategiesCount: 15,
        completedBacktests: 88
      };

      savePersistedUser(user);
      set({ user, isAuthenticated: true, isAuthModalOpen: false, isLoading: false });
      return true;
    },

    logout: () => {
      savePersistedUser(null);
      set({ user: null, isAuthenticated: false, isAuthModalOpen: false });
    },

    updateProfile: (data) => {
      const current = get().user;
      if (!current) return;
      const updated = { ...current, ...data };
      savePersistedUser(updated);
      set({ user: updated });
    }
  };
});
