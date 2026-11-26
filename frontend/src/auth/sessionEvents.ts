// Événement émis quand le serveur répond 401 alors qu'on se croyait connecté
// (session expirée, compte supprimé) : AuthProvider repasse en "déconnecté".
export const SESSION_EXPIRED_EVENT = "famtrees:session-expired";

export function notifySessionExpired(): void {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
