import type { AxiosInstance } from "axios";
import { notifySessionExpired } from "./sessionEvents";

/**
 * Session par cookie HttpOnly : le navigateur envoie lui-même le cookie
 * "famtrees_token" à Flask et à Spring (withCredentials). Le JavaScript ne
 * voit ni ne stocke jamais le jeton.
 *
 * Si un appel revient en 401 (hors routes de connexion), la session est finie :
 * on prévient AuthProvider, qui renvoie vers /login.
 */
export function attachAuth(client: AxiosInstance): AxiosInstance {
  client.defaults.withCredentials = true;
  client.interceptors.response.use(
    res => res,
    error => {
      const url: string = error?.config?.url ?? "";
      if (error?.response?.status === 401 && !url.startsWith("/auth/")) notifySessionExpired();
      return Promise.reject(error);
    },
  );
  return client;
}
