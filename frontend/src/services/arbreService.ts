import flaskApi from "./flaskApi";
import type { Arbre, ArbrePayload, ArbreGenerateResponse } from "../types";

export const arbreService = {

  // ── CRUD PostgreSQL ───────────────────────────────────────────────────────

  getAll: () =>
    flaskApi.get<Arbre[]>("/arbres").then(r => r.data),

  getById: (id: string) =>
    flaskApi.get<Arbre>(`/arbres/${id}`).then(r => r.data),

  create: (payload: ArbrePayload) =>
    flaskApi.post<Arbre>("/arbres", payload).then(r => r.data),

  update: (id: string, payload: Partial<ArbrePayload>) =>
    flaskApi.put<Arbre>(`/arbres/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    flaskApi.delete(`/arbres/${id}`),

  // ── Génération Neo4j ──────────────────────────────────────────────────────

  generate: (id: string, depth?: number) => {
    const params = depth !== undefined ? { depth } : {};
    return flaskApi
      .get<ArbreGenerateResponse>(`/arbres/${id}/generate`, { params })
      .then(r => r.data);
  },

  // Visualisation directe depuis un elementId Neo4j sans sauvegarde
  getTree: (rootId: string, depth?: number) => {
    const params = depth !== undefined ? { depth } : {};
    return flaskApi.get(`/tree/${rootId}`, { params }).then(r => r.data);
  },
};