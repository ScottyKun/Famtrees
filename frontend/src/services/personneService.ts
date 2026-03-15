import api from "./api";
import type { Personne, PersonnePayload, UnionPayload, FamillePayload } from "../types";

const BASE = "/personnes";

export const personneService = {

  // ── CRUD ─────────────────────────────────────────────────────────────────

  getAll: () =>
    api.get<Personne[]>(BASE).then(r => r.data),

  getById: (id: string) =>
    api.get<Personne>(`${BASE}/${id}`).then(r => r.data),

  create: (payload: PersonnePayload) =>
    api.post<Personne>(BASE, payload).then(r => r.data),

  update: (id: string, payload: PersonnePayload) =>
    api.put<Personne>(`${BASE}/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/${id}`),

  // ── Enfants 
  // Spring vérifie : { id } → lie l'existant / payload sans id → crée puis lie

  linkEnfant: (parentId: string, enfantId: string) =>
    api.post<Personne>(`${BASE}/${parentId}/enfants`, { id: enfantId }).then(r => r.data),

  createAndLinkEnfant: (parentId: string, payload: PersonnePayload) =>
    api.post<Personne>(`${BASE}/${parentId}/enfants`, payload).then(r => r.data),

  removeEnfant: (parentId: string, enfantId: string) =>
    api.delete<Personne>(`${BASE}/${parentId}/enfants/${enfantId}`).then(r => r.data),

  // ── Unions 

  linkUnion: (personneId: string, unionId: string) =>
    api.post<Personne>(`${BASE}/${personneId}/unions`, { id: unionId }).then(r => r.data),

  createAndLinkUnion: (personneId: string, payload: UnionPayload) =>
    api.post<Personne>(`${BASE}/${personneId}/unions`, payload).then(r => r.data),

  removeUnion: (personneId: string, unionId: string) =>
    api.delete<Personne>(`${BASE}/${personneId}/unions/${unionId}`).then(r => r.data),

  // ── Famille 

  joinFamily: (personneId: string, familleId: string) =>
    api.post<Personne>(`${BASE}/${personneId}/familles`, { id: familleId }).then(r => r.data),

  linkAndJoinFamily: (personneId: string, payload: FamillePayload) =>
    api.post<Personne>(`${BASE}/${personneId}/familles`, payload).then(r => r.data),
};