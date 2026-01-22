import { useState, useEffect, createContext, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '@/services/api';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: any) => Promise<void>;
  setNavigationCallback: (callback: (path: string) => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let navigationCallback: ((path: string) => void) | null = null;

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

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        // Verify token with backend
        const response = await api.get('/auth/verify');
        setUser(response.data.user);
      }
    } catch (error) {
      // Token is invalid, remove it
      localStorage.removeItem('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const setNavigationCallback = (callback: (path: string) => void) => {
    navigationCallback = callback;
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        const { user: userData, token } = response.data.data;

        // Store token
        localStorage.setItem('authToken', token);

        // Set user
        setUser(userData);

        toast.success('Login successful!');

        // Redirect based on user type
        if (navigationCallback) {
          if (userData.userType === 'admin') {
            navigationCallback('/admin');
          } else {
            navigationCallback('/');
          }
        }
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    toast.info('Logged out successfully');
    if (navigationCallback) {
      navigationCallback('/login');
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        toast.success('Registration submitted! Please wait for admin approval.');
        if (navigationCallback) {
          navigationCallback('/login');
        }
      } else {
        throw new Error(response.data.error || 'Registration failed');
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
    setNavigationCallback,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};