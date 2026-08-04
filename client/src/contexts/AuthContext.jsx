import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user: clerkUser, isLoaded: userLoaded, isSignedIn } = useUser();
  const { getToken, isLoaded: authLoaded } = useClerkAuth();
  
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // We override our custom API client's getToken function 
    // to dynamically fetch the Clerk JWT token!
    api.setTokenGetter(async () => {
      if (isSignedIn) {
        return await getToken();
      }
      return null;
    });
  }, [getToken, isSignedIn]);

  useEffect(() => {
    // When the user logs in via Clerk, we must sync them with our backend
    // so a row exists in our SQLite database for foreign keys.
    const syncUser = async () => {
      if (isSignedIn && clerkUser && !synced) {
        try {
          const email = clerkUser.primaryEmailAddress?.emailAddress;
          const name = clerkUser.fullName || clerkUser.firstName || 'User';
          
          await api.post('/auth/sync', { email, name });
          setSynced(true);
        } catch (error) {
          console.error('Failed to sync user to backend', error);
        }
      }
    };
    
    syncUser();
  }, [isSignedIn, clerkUser, synced]);

  const value = { 
    // We map Clerk's user object to match what our app expects
    user: clerkUser ? { 
      id: clerkUser.id, 
      name: clerkUser.fullName || clerkUser.firstName, 
      email: clerkUser.primaryEmailAddress?.emailAddress,
      imageUrl: clerkUser.imageUrl
    } : null, 
    loading: !userLoaded || !authLoaded, 
    isAuthenticated: isSignedIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
