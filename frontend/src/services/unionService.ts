import api from "./api";
import type { Union, UnionPayload, Personne } from "../types";

const BASE = "/unions";

export const unionService = {

  // ── CRUD ─

  getAll: () =>
    api.get<Union[]>(BASE).then(r => r.data),

  getById: (id: string) =>
    api.get<Union>(`${BASE}/${id}`).then(r => r.data),

  create: (payload: UnionPayload) =>
    api.post<Union>(BASE, payload).then(r => r.data),

  update: (id: string, payload: UnionPayload) =>
    api.put<Union>(`${BASE}/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/${id}`),

  getEnfants: (id: string) =>
    api.get<Personne[]>(`${BASE}/${id}/enfants`).then(r => r.data),

  // ── Conjoints 

  addConjoint: (unionId: string, personneId: string) =>
    api.post<Union>(`${BASE}/${unionId}/conjoints/${personneId}`).then(r => r.data),

  removeConjoint: (unionId: string, personneId: string) =>
    api.delete<Union>(`${BASE}/${unionId}/conjoints/${personneId}`).then(r => r.data),

  // ── Famille 

  linkFamily: (unionId: string, familleId: string) =>
    api.post<Union>(`${BASE}/${unionId}/famille/${familleId}`).then(r => r.data),

  unlinkFamily: (unionId: string) =>
    api.delete<Union>(`${BASE}/${unionId}/famille`).then(r => r.data),

  // ── Enfants 

  addEnfant: (unionId: string, enfantId: string) =>
    api.post<Union>(`${BASE}/${unionId}/enfants/${enfantId}`).then(r => r.data),

  removeEnfant: (unionId: string, enfantId: string) =>
    api.delete<Union>(`${BASE}/${unionId}/enfants/${enfantId}`).then(r => r.data),
};