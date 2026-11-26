// ─── Comptes utilisateurs (Flask /api/auth/*, /api/users — table users PostgreSQL) ───

export interface User {
  id: string;                  // uuid
  email: string;
  prenom: string;
  nom: string;
  personne_id: string | null;  // elementId Neo4j de "sa" fiche dans l'arbre (optionnel)
  created_at: string;
  updated_at: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  prenom: string;
  nom: string;
}

// Création / modification depuis la page Utilisateurs.
// En modification, password vide ou absent = mot de passe inchangé.
export interface UserPayload {
  email?: string;
  password?: string;
  prenom?: string;
  nom?: string;
  personne_id?: string | null;
}
