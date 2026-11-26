import flaskApi from "./flaskApi";
import type { Arbre, ArbrePayload, ArbreGenerateResponse, TreeAxes } from "../types";

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
  // axes = { up, down, collateral } — voir tree-flask/lineage.py.
  // Un axe omis retombe sur la valeur enregistrée sur l'arbre (ou 1 par défaut).

  generate: (id: string, axes?: TreeAxes) =>
    flaskApi
      .get<ArbreGenerateResponse>(`/arbres/${id}/generate`, { params: axes ?? {} })
      .then(r => r.data),

  // Visualisation directe depuis un elementId Neo4j sans sauvegarde
  getTree: (rootId: string, axes?: TreeAxes) =>
    flaskApi.get(`/tree/${rootId}`, { params: axes ?? {} }).then(r => r.data),
};