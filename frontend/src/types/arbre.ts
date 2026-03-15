// ─── Sortie Flask /api/tree/:rootId ───

export interface ArbrePersonne {
  id: string;
  prenom: string;
  nom: string;
  sexe: "M" | "F" | "U";
  generation: number;

  unions: string[];                // ids des unions
  children_out_of_union: string[]; // ids des enfants hors union
  families_formed: string[];       // ids des familles formées
  families_origin: string[];       // ids des familles d'origine
}

export interface ArbreUnion {
  id: string;
  conjoints: string[]; 
  children: string[];  
}

export interface ArbreFamille {
  id: string;
  members: string[]; 
}

export interface ArbreDTO {
  generations: Record<string, string[]>; // ex. { "-1": [id, id], "0": [...] }
  persons: Record<string, ArbrePersonne>;
  unions: Record<string, ArbreUnion>;
  families: Record<string, ArbreFamille>;
}