import { App } from '@capacitor/app';
import { supabase } from '../lib/supabase';

/**
 * Parse OAuth tokens from URL — handles both hash fragment (#) and query params (?)
 * Supabase typically returns tokens in the hash: #access_token=...&refresh_token=...
 */
function parseTokensFromUrl(urlString: string): { accessToken: string | null; refreshToken: string | null } {
  try {
    // Try hash fragment first (Supabase default)
    const hashIndex = urlString.indexOf('#');
    if (hashIndex !== -1) {
      const hash = urlString.substring(hashIndex + 1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken) return { accessToken, refreshToken };
    }

    // Fallback to query params
    const url = new URL(urlString);
    return {
      accessToken: url.searchParams.get('access_token'),
      refreshToken: url.searchParams.get('refresh_token'),
    };
  } catch {
    return { accessToken: null, refreshToken: null };
  }
}

/**
 * Initialize deep-link listener.
 *
 * Supabase login will redirect to:
 *   id.verdanist.app://login-callback#access_token=XYZ&refresh_token=ABC
 *
 * This listener reads the tokens and sets the Supabase session
 * so the user is logged in inside the app.
 */
export function initDeepLink(): void {
  try {
    App.addListener('appUrlOpen', async (event) => {
      console.log('[DeepLink] appUrlOpen event:', event.url);
      const { accessToken, refreshToken } = parseTokensFromUrl(event.url);

      if (accessToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });
        if (error) {
          console.error('[DeepLink] Session error:', error);
        } else {
          console.log('[DeepLink] Supabase session set from deep-link');
        }
      }
    });
  } catch (e) {
    // Not running on Capacitor native platform
    console.log('[DeepLink] Not on native platform, skipping appUrlOpen listener');
  }
}

/**
 * Helper to parse a redirect URL manually (e.g. from WebView).
 */
export async function handleLoginRedirect(urlString: string) {
  const { accessToken, refreshToken } = parseTokensFromUrl(urlString);
  if (!accessToken) return;
  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken || '',
  });
  if (error) console.error('Redirect session error:', error);
}
