import { useCallback, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/authService";
import type { LoginPayload, RegisterPayload, User } from "../types";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import { SESSION_EXPIRED_EVENT } from "./sessionEvents";

const ME_KEY = ["auth", "me"] as const;

/**
 * Session utilisateur. Le jeton vit uniquement dans le cookie HttpOnly posé par
 * Flask : on sait si on est connecté en demandant /api/auth/me.
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const me = useQuery({
    queryKey: ME_KEY,
    queryFn: authService.me,
    retry: false,
    staleTime: Infinity,
  });

  // Termine la session côté front : vide le cache (données d'un autre compte)
  // et marque l'utilisateur comme déconnecté.
  const endSession = useCallback(() => {
    queryClient.removeQueries({ predicate: q => q.queryKey[0] !== ME_KEY[0] });
    queryClient.setQueryData<User | null>(ME_KEY, null);
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, endSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, endSession);
  }, [endSession]);

  const login = useCallback(async (payload: LoginPayload) => {
    const user = await authService.login(payload);
    queryClient.removeQueries({ predicate: q => q.queryKey[0] !== ME_KEY[0] });
    queryClient.setQueryData(ME_KEY, user);
  }, [queryClient]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const user = await authService.register(payload);
    queryClient.removeQueries({ predicate: q => q.queryKey[0] !== ME_KEY[0] });
    queryClient.setQueryData(ME_KEY, user);
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      endSession();
    }
  }, [endSession]);

  const value = useMemo<AuthContextValue>(() => {
    const status = me.isPending ? "loading" : me.data ? "authenticated" : "anonymous";
    return { status, user: me.data ?? null, login, register, logout, endSession };
  }, [me.isPending, me.data, login, register, logout, endSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
