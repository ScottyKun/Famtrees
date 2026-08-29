// ─── Sortie Flask /api/tree/:rootId ───

// Voir tree-flask/lineage.py : classification par rapport à la racine.
export type ArbreAxis = "ROOT" | "ANCESTOR" | "DESCENDANT" | "COLLATERAL" | "SPOUSE";

export interface ArbrePersonne {
  id: string;
  prenom: string;
  nom: string;
  sexe: "M" | "F" | "U";
  generation: number;

  // Classification V2 (ajoutée par lineage.py). Optionnels pour rester
  // compatibles avec un back non encore à jour.
  axis?: ArbreAxis;
  baseAxis?: Exclude<ArbreAxis, "SPOUSE">;
  up?: number;               // ANCESTOR : nb de générations au-dessus de la racine
  down?: number;             // DESCENDANT : nb de générations en dessous
  anchorUp?: number;         // COLLATERAL : ancêtre commun à cette distance de la racine
  collateralOrder?: number;  // COLLATERAL : 1 = fratrie/oncles-tantes, 2 = cousins/neveux, ...

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

// Les 3 axes indépendants du modèle d'affichage V2 (voir lineage.py).
// Tous optionnels : un axe omis retombe sur le défaut backend (1).
export interface TreeAxes {
  up?: number;
  down?: number;
  collateral?: number;
}