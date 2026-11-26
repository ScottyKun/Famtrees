import { isAxiosError } from "axios";
import flaskApi from "./flaskApi";
import type { LoginPayload, RegisterPayload, User } from "../types";

// Authentification — Flask /api/auth/* (le jeton est posé en cookie HttpOnly par le serveur)
export const authService = {
  login: (payload: LoginPayload) =>
    flaskApi.post<User>("/auth/login", payload).then(r => r.data),

  register: (payload: RegisterPayload) =>
    flaskApi.post<User>("/auth/register", payload).then(r => r.data),

  logout: () =>
    flaskApi.post("/auth/logout").then(() => undefined),

  /** Utilisateur connecté, ou null si aucune session valide. */
  me: () =>
    flaskApi.get<User>("/auth/me")
      .then(r => r.data)
      .catch(err => {
        if (isAxiosError(err) && err.response?.status === 401) return null;
        throw err;
      }),
};
