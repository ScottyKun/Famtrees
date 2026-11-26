import flaskApi from "./flaskApi";
import type { User, UserPayload } from "../types";

// Comptes utilisateurs — Flask /api/users (tout utilisateur connecté peut tout faire)
export const userService = {
  getAll: () =>
    flaskApi.get<User[]>("/users").then(r => r.data),

  create: (payload: UserPayload) =>
    flaskApi.post<User>("/users", payload).then(r => r.data),

  update: (id: string, payload: UserPayload) =>
    flaskApi.put<User>(`/users/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    flaskApi.delete<{ self: boolean }>(`/users/${id}`).then(r => r.data),
};
