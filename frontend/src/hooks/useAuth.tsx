import { useState, useEffect, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { User } from '@/types';
import { AUTH_TOKEN_KEY, USER_STORAGE_KEY } from '@/constants/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) {
        return;
      }

      const response = await api.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.data));
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (error) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.login({ email, password });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Login failed');
      }

      const { user: userData } = response.data;
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      toast.success('Login successful!');

      if (userData.userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await api.register(userData);

      if (response.success) {
        toast.success('Registration submitted! Please wait for admin approval.');
        navigate('/login');
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};