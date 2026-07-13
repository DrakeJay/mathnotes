"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export type AuthState = "loading" | "authed" | "anon";

/** Session state backed by the httpOnly cookie. The token itself is never
 *  readable from JavaScript; /api/auth/me is the source of truth. */
export function useAuth() {
  const [state, setState] = useState<AuthState>("loading");

  const refresh = useCallback(async () => {
    try {
      const { authenticated } = await api.me();
      setState(authenticated ? "authed" : "anon");
    } catch {
      setState("anon");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    state,
    refresh,
    async login(password: string) {
      await api.login(password); // throws ApiError on wrong password
      setState("authed");
    },
    async logout() {
      try {
        await api.logout();
      } finally {
        setState("anon");
      }
    },
  };
}
