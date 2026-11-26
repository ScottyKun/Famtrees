export type Sexe = "M" | "F";

export interface Personne {
  id: string;
  prenom: string;
  nom: string;
  sexe: Sexe;
  dateNaissance: string | null; // "yyyy-MM-dd"
  dateDeces: string | null;     // "yyyy-MM-dd"

  // Relations (ids)
  enfantsIds: string[];
  unionsIds: string[];
  familleId: string[];
  unionNaissId: string | null;
}

// Payload envoyé à Spring pour créer ou modifier une personne
export interface PersonnePayload {
  prenom: string;
  nom: string;
  sexe: Sexe;
  dateNaissance: string | null;
  dateDeces: string | null;
}