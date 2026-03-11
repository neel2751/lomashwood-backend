"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";

/**
 * Syncs the authentication token from cookies to the auth store.
 * This ensures axios interceptors have access to the token for API calls.
 */
export function TokenSyncProvider() {
  const { accessToken, setAccessToken } = useAuthStore();

  useEffect(() => {
    // Only sync if token is missing from store
    if (!accessToken) {
      // Get token from cookie
      const cookies = document.cookie.split(';');
      const tokenCookie = cookies.find(c => c.trim().startsWith('lw_access_token='));
      
      if (tokenCookie) {
        const token = tokenCookie.split('=')[1];
        if (token) {
          console.log('🔄 Syncing token from cookie to auth store');
          setAccessToken(token);
        }
      }
    }
  }, [accessToken, setAccessToken]);

  return null;
}
