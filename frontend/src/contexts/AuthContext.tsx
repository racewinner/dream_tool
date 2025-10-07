import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AuthService, { RegisterResponse } from '../services/authService';
import { User, UserRole, UserPermissions, getUserPermissions, hasPermission } from '../types/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  selectedSystemId: number | null;
  login: (email: string, password: string, otp?: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  selectSystem: (systemId: number) => void;
  updateUserProfile: (firstName: string, lastName: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  sendEmailVerification: (email: string) => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  refreshToken: () => Promise<void>;
  loading: boolean;
  error: string | null;
  // Role-based access control helpers
  userPermissions: UserPermissions;
  hasPermission: (permission: keyof UserPermissions) => boolean;
  isAdmin: boolean;
  isTechnicalExpert: boolean;
  isTechnicalJunior: boolean;
  isNonTechnical: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedSystemId, setSelectedSystemId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔍 AuthContext: Initializing authentication...');
        const savedToken = localStorage.getItem('token');
        console.log('🔍 AuthContext: Saved token exists:', !!savedToken);
        
        if (!savedToken) {
          console.log('✅ AuthContext: No saved token, user not logged in');
          setLoading(false);
          return;
        }

        console.log('🔄 AuthContext: Found saved token, validating...');
        setToken(savedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
        
        try {
          // Verify token is still valid by fetching user profile
          const userData = await AuthService.getCurrentUser(savedToken);
          console.log('✅ AuthContext: Token valid, user authenticated:', userData.email);
          setUser({...userData, role: userData.role as UserRole});
        } catch (err) {
          console.warn('❌ AuthContext: Token validation failed:', err);
          // Token is invalid, clear it
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('❌ AuthContext: Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
        console.log('🏁 AuthContext: Authentication initialization complete');
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string, otp?: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await AuthService.login({ email, password, otp });
      
      if (response.success) {
        localStorage.setItem('token', response.token);
        setToken(response.token);
        setUser({...response.user, role: response.user.role as UserRole});
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, role: string): Promise<RegisterResponse> => {
    try {
      setError(null);
      setLoading(true);
      
      console.log('🚀 Starting registration for:', email, 'with role:', role);
      const response = await AuthService.register({ email, password, firstName, lastName, role });
      console.log('📥 Registration response received:', response);
      
      if (response.success) {
        // Do NOT automatically log the user in after registration
        // Let them complete the registration flow and login manually
        console.log('✅ Registration successful - NOT auto-logging in');
        console.log('🔍 Checking localStorage after registration...');
        const tokenAfterRegistration = localStorage.getItem('token');
        console.log('Token in localStorage after registration:', tokenAfterRegistration ? 'EXISTS' : 'NOT FOUND');
        
        return response; // Return response for registration page to handle
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await AuthService.logout();
      }
    } catch (err) {
      console.warn('Logout API call failed:', err);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
      setToken(null);
      setSelectedSystemId(null);
    }
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await AuthService.requestPasswordReset(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to request password reset');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (resetToken: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await AuthService.resetPassword(resetToken, password);
      
      if (!response.success) {
        throw new Error(response.message || 'Password reset failed');
      }
    } catch (err: any) {
      setError(err.message || 'Password reset failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (firstName: string, lastName: string) => {
    try {
      setError(null);
      setLoading(true);
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      const userData = await AuthService.getCurrentUser(token);
      setUser({...userData, role: userData.role as UserRole});
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerification = async (email: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await AuthService.sendEmailVerification(email);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send verification email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (verificationToken: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await AuthService.verifyEmail(verificationToken);
      
      if (response.success && token) {
        // Refresh user data after email verification
        const userData = await AuthService.getCurrentUser(token);
        setUser(userData as User);
      } else if (!response.success) {
        throw new Error(response.message || 'Email verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Email verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      if (!token) {
        throw new Error('No token to refresh');
      }
      
      const response = await AuthService.refreshToken(token);
      
      localStorage.setItem('token', response.token);
      setToken(response.token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.token}`;
    } catch (err: any) {
      // If refresh fails, logout user
      await logout();
      throw err;
    }
  };

  const selectSystem = (systemId: number) => {
    setSelectedSystemId(systemId);
  };

  // Role-based access control helpers
  const userPermissions = user ? getUserPermissions(user.role) : getUserPermissions('non_technical');
  const checkPermission = (permission: keyof UserPermissions): boolean => {
    return user ? hasPermission(user.role, permission) : false;
  };

  const isAdmin = user?.role === 'admin';
  const isTechnicalExpert = user?.role === 'technical_expert';
  const isTechnicalJunior = user?.role === 'technical_junior';
  const isNonTechnical = user?.role === 'non_technical';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        selectedSystemId,
        login,
        register,
        logout,
        updateUserProfile,
        requestPasswordReset,
        resetPassword,
        sendEmailVerification,
        verifyEmail,
        refreshToken,
        selectSystem,
        loading,
        error,
        // Role-based access control
        userPermissions,
        hasPermission: checkPermission,
        isAdmin,
        isTechnicalExpert,
        isTechnicalJunior,
        isNonTechnical,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
