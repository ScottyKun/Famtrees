export interface Famille {
  id: string;
  nom: string;

  // Relations (ids)
  membresIds: string[];
}

export interface FamillePayload {
  nom: string;
}