import type { ArbreDTO } from "./arbre";

export interface Arbre {
  id:                string;
  nom:               string;
  racine_id:         string;
  depth:             number;   // legacy, conservé pour compat
  up_depth:          number;
  down_depth:        number;
  collateral_depth:  number;
  created_at:        string;
  updated_at:        string;
}

export interface ArbrePayload {
  nom:               string;
  racine_id:         string;
  depth?:            number;   // legacy
  up_depth?:         number;
  down_depth?:       number;
  collateral_depth?: number;
}

export interface ArbreGenerateResponse {
  arbre: Arbre;
  tree:  ArbreDTO;
}