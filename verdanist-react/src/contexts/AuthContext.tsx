import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  role: 'admin' | 'farmer' | 'guest';
}

export interface Farm {
  id: string;
  name: string;
  location: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (provider: 'google' | 'email', email?: string, password?: string, isRegister?: boolean, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  currentFarm: Farm | null;
  setFarmAccess: (farm: Farm) => void;
  clearFarmAccess: () => void;
  validateFarmToken: (farmId: string, token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentFarm, setCurrentFarm] = useState<Farm | null>(() => {
    const savedFarm = localStorage.getItem('current_farm');
    return savedFarm ? JSON.parse(savedFarm) : null;
  });

  // Supabase stores its auth session in localStorage with this key
  const STORAGE_KEY = `sb-pzktyggopmvyrkwcnwfo-auth-token`;
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const fetchProfile = async (userId: string, accessToken?: string): Promise<string> => {
    try {
      // If we have an access token, use native fetch to bypass Supabase JS client entirely.
      // This prevents hanging if the JS client is stuck waiting for internal session initialization.
      if (accessToken) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=role`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`,
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0 && data[0].role) {
            localStorage.setItem('verdanist_role', data[0].role);
            return data[0].role;
          }
        } else {
          console.warn('[AuthContext] fetchProfile HTTP error:', response.status, await response.text());
        }
      } else {
        // Fallback to Supabase client if no token provided (e.g. public access or testing)
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();
          
        if (error) {
          console.warn('[AuthContext] Error fetching profile:', error);
        } else if (data && data.role) {
          localStorage.setItem('verdanist_role', data.role);
          return data.role;
        }
      }
    } catch (err) {
      console.warn('[AuthContext] Exception in fetchProfile:', err);
    }
    // Fallback to cached role if available, otherwise 'guest'
    const cached = localStorage.getItem('verdanist_role');
    return cached || 'guest';
  };

  // Build a User object from raw session data
  const buildUser = (sessionUser: any, role: string): User => ({
    id: sessionUser.id,
    email: sessionUser.email || '',
    displayName: sessionUser.user_metadata?.full_name || sessionUser.email?.split('@')[0] || 'User',
    avatarUrl: sessionUser.user_metadata?.custom_avatar_url || sessionUser.user_metadata?.avatar_url,
    role: role as 'admin' | 'farmer' | 'guest',
  });

  // Handle OAuth deep link callback when app opens via id.verdanist.app://login-callback
  const handleDeepLink = async (url: string) => {
    if (!url) return;
    console.log('[AuthContext] Deep link received:', url);

    // Extract hash fragment containing OAuth tokens
    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const hash = url.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && refreshToken) {
        console.log('[AuthContext] Setting session from deep link tokens');
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('[AuthContext] Error setting session from deep link:', error);
        } else if (data?.user) {
          console.log('[AuthContext] Session established from deep link for:', data.user.email);
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.close(); // Close the custom tab if it's open
          } catch (e) {
            console.warn('[AuthContext] Could not close browser', e);
          }
        }
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      try {
        // Check for deep link URL (OAuth callback from native app)
        const currentUrl = window.location.href;
        if (currentUrl.startsWith('id.verdanist.app://') || currentUrl.includes('login-callback')) {
          console.log('[AuthContext] App opened via deep link');
          await handleDeepLink(currentUrl);
        }

        // Also check Capacitor App plugin for launch URL (when app was in background)
        try {
          const { App: CapApp } = await import('@capacitor/app');
          const launchUrl = await CapApp.getLaunchUrl();
          if (launchUrl?.url) {
            console.log('[AuthContext] Capacitor launch URL:', launchUrl.url);
            await handleDeepLink(launchUrl.url);
          }

          // Listen for future deep link activations while app is running
          CapApp.addListener('appStateChange', async ({ isActive }) => {
            if (isActive) {
              const resumedUrl = await CapApp.getLaunchUrl();
              if (resumedUrl?.url) {
                console.log('[AuthContext] App resumed with URL:', resumedUrl.url);
                await handleDeepLink(resumedUrl.url);
              }
            }
          });
        } catch (e) {
          // Not running on Capacitor or plugin not available
        }

        // 1. Read session directly from localStorage (bypasses Supabase JS client)
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          const sessionUser = session?.user;
          const accessToken = session?.access_token;
          const cachedRole = localStorage.getItem('verdanist_role') || 'guest';

          if (sessionUser?.id) {
            console.log('[AuthContext] Restored session from localStorage for:', sessionUser.email, 'cachedRole:', cachedRole);

            // Set user immediately with cached role so loading stops without redirecting to welcome-guest
            setUser(buildUser(sessionUser, cachedRole));
            setLoading(false);

            // Fetch real role in background using the user's access token
            const role = await fetchProfile(sessionUser.id, accessToken);
            if (!cancelled) {
              setUser(buildUser(sessionUser, role));
              console.log('[AuthContext] Profile loaded, role:', role);
            }
            return;
          }
        }

        // No stored session — user is not logged in
        console.log('[AuthContext] No stored session found.');
        setUser(null);
        setLoading(false);
      } catch (err) {
        console.error('[AuthContext] Error restoring session:', err);
        setUser(null);
        setLoading(false);
      }
    };

    restoreSession();

    // Still listen for auth changes (login, logout, token refresh)
    // This handles NEW logins/logouts after the app is already loaded
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (cancelled) return;
        console.log('[AuthContext] onAuthStateChange event:', _event);

        if (session?.user) {
          const role = await fetchProfile(session.user.id, session.access_token);
          if (!cancelled) {
            setUser(buildUser(session.user, role));
            setLoading(false);
          }
        } else if (_event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Detect if running inside Capacitor native app
  const isNative = (): boolean => {
    return !!(window as any).Capacitor && (window as any).Capacitor.isNativePlatform();
  };

  const getRedirectUrl = (path: string = '/dashboard'): string => {
    if (isNative()) {
      return 'id.verdanist.app://login-callback';
    }
    return `${window.location.origin}${path}`;
  };

  const login = async (provider: 'google' | 'email', email?: string, password?: string, isRegister?: boolean, name?: string) => {
    if (provider === 'google') {
      if (isNative()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getRedirectUrl('/dashboard'),
            skipBrowserRedirect: true,
          }
        });
        if (error) throw error;
        if (data?.url) {
          const { Browser } = await import('@capacitor/browser');
          await Browser.open({ url: data.url });
        }
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: getRedirectUrl('/dashboard')
          }
        });
        if (error) throw error;
      }
    }
    
    if (provider === 'email' && email && password) {
      if (isRegister) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during signOut:', error);
    } finally {
      setUser(null);
      clearFarmAccess();
      localStorage.removeItem('verdanist_role');
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl('/reset-password'),
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const setFarmAccess = (farm: Farm) => {
    setCurrentFarm(farm);
    localStorage.setItem('current_farm', JSON.stringify(farm));
  };

  const clearFarmAccess = () => {
    setCurrentFarm(null);
    localStorage.removeItem('current_farm');
  };

  const validateFarmToken = async (farmId: string, token: string): Promise<boolean> => {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Use AbortController for a reliable timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds

    try {
      // Strategy 1: Direct fetch to RPC endpoint (bypasses Supabase JS client entirely)
      console.log('[validateFarmToken] Trying RPC via direct fetch...');
      const rpcResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_farm_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ p_farm_id: farmId, p_token: token }),
        signal: controller.signal,
      });

      if (rpcResponse.ok) {
        const result = await rpcResponse.json();
        console.log('[validateFarmToken] RPC result:', result);
        clearTimeout(timeoutId);
        return !!result;
      }

      console.warn('[validateFarmToken] RPC failed, status:', rpcResponse.status, 'trying direct query...');

      // Strategy 2: Direct fetch to REST query endpoint
      const queryUrl = `${SUPABASE_URL}/rest/v1/farms?id=eq.${farmId}&api_key=eq.${encodeURIComponent(token)}&select=id&limit=1`;
      console.log('[validateFarmToken] Trying direct query via fetch...');
      const queryResponse = await fetch(queryUrl, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        signal: controller.signal,
      });

      if (queryResponse.ok) {
        const rows = await queryResponse.json();
        console.log('[validateFarmToken] Direct query result:', rows);
        clearTimeout(timeoutId);
        return Array.isArray(rows) && rows.length > 0;
      }

      console.error('[validateFarmToken] Direct query failed, status:', queryResponse.status);
      clearTimeout(timeoutId);
      return false;
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('Koneksi timeout. Silakan periksa jaringan internet Anda dan coba lagi.');
      }
      console.error('[validateFarmToken] Error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, resetPassword, updatePassword, currentFarm, setFarmAccess, clearFarmAccess, validateFarmToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
