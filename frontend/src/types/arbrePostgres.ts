import type { ArbreDTO } from "./arbre";

export interface Arbre {
  id:         string;
  nom:        string;
  racine_id:  string;
  depth:      number;
  created_at: string;
  updated_at: string;
}

export interface ArbrePayload {
  nom:       string;
  racine_id: string;
  depth?:    number;
}

export interface ArbreGenerateResponse {
  arbre: Arbre;
  tree:  ArbreDTO;
}