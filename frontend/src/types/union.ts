export type UnionType = "MARIAGE" | "DIVORCE" | "RELIGIEUX";

export interface Union {
  id: string;
  type: UnionType;
  libelle: string;
  dateDebut: string | null; // "yyyy-MM-dd"
  dateFin: string | null;   // "yyyy-MM-dd"

  // Relations (ids)
  conjointsIds: string[];
  familleId: string | null;
  enfantsIds: string[];
}

export interface UnionPayload {
  type: UnionType;
  libelle: string;
  dateDebut: string | null;
  dateFin: string | null;
}