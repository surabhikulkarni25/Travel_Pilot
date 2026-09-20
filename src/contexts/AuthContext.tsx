import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode
} from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { syncUserDocument, getUserProfile } from '../services/userService';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signingIn: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      try {
        const profile = await getUserProfile(auth.currentUser.uid);
        if (profile) {
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Failed to refresh user profile:', err);
      }
    }
  }, []);

  useEffect(() => {
    // Listen for authentication changes & persist state
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          // Sync or create user document in Firestore on sign in
          const profile = await syncUserDocument(currentUser);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error synchronizing user document:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const profile = await syncUserDocument(result.user);
        setUserProfile(profile);
      }
    } catch (error: any) {
      // Handle cancelled popups or network issues gracefully
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign in was cancelled.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else {
        console.error('Authentication error:', error);
        setAuthError(error.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      setAuthError('Failed to sign out. Please try again.');
    }
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        signingIn,
        authError,
        signInWithGoogle,
        signOutUser,
        clearAuthError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
