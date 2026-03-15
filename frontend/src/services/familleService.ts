import api from "./api";
import type { Famille, FamillePayload, PersonnePayload } from "../types";

const BASE = "/familles";

export const familleService = {

  // ── CRUD 

  getAll: () =>
    api.get<Famille[]>(BASE).then(r => r.data),

  getById: (id: string) =>
    api.get<Famille>(`${BASE}/${id}`).then(r => r.data),

  create: (payload: FamillePayload) =>
    api.post<Famille>(BASE, payload).then(r => r.data),

  update: (id: string, payload: FamillePayload) =>
    api.put<Famille>(`${BASE}/${id}`, payload).then(r => r.data),

  delete: (id: string) =>
    api.delete(`${BASE}/${id}`),

  // ── Membres 

  addMember: (familleId: string, payload: PersonnePayload) =>
    api.post<Famille>(`${BASE}/${familleId}/membres`, payload).then(r => r.data),

  linkMember: (familleId: string, personneId: string) =>
    api.post<Famille>(`${BASE}/${familleId}/membres`, { id: personneId }).then(r => r.data),

  removeMember: (familleId: string, personneId: string) =>
    api.delete<Famille>(`${BASE}/${familleId}/membres/${personneId}`).then(r => r.data),
};