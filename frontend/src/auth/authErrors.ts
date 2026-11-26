import { isAxiosError } from "axios";

/** Message lisible pour une erreur de connexion / inscription / gestion des comptes. */
export function authErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    if (!err.response) return "Serveur injoignable. Réessayez dans un instant.";
    switch (err.response.status) {
      case 400: return "Vérifiez les champs du formulaire.";
      case 401: return "Email ou mot de passe incorrect.";
      case 409: return "Un compte existe déjà avec cet email.";
    }
  }
  return "Une erreur est survenue. Réessayez.";
}

/** Erreurs par champ renvoyées par Flask ({ fields: { email: "…" } }). */
export function fieldErrors(err: unknown): Record<string, string> {
  if (isAxiosError(err)) {
    const fields = (err.response?.data as { fields?: Record<string, string> } | undefined)?.fields;
    if (fields) return fields;
  }
  return {};
}
