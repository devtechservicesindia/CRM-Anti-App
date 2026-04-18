/**
 * AuthInitializer
 * Runs on every app mount to silently refresh the access token using the
 * httpOnly refresh token cookie. This keeps users logged in across browser
 * refreshes without re-entering credentials.
 */
import { useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAccessToken, logout, setInitializing } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // If we have stored auth state, try to silently refresh the token
    if (isAuthenticated) {
      setInitializing(true);
      axios
        .post('/api/auth/refresh', {}, { withCredentials: true })
        .then(({ data }) => {
          setAccessToken(data.accessToken);
        })
        .catch(() => {
          // Refresh token expired or not present — force logout
          logout();
        })
        .finally(() => {
          setInitializing(false);
        });
    } else {
      setInitializing(false);
    }
  }, []);

  return <>{children}</>;
}
