// Utilitaires de sécurité pour prévenir les attaques XSS

/**
 * Échappe les caractères HTML dangereux pour prévenir les attaques XSS
 * @param {string} text - Texte à sécuriser
 * @returns {string} Texte échappé
 */
export function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Nettoie une chaîne de caractères en supprimant les balises HTML
 * @param {string} text - Texte à nettoyer
 * @returns {string} Texte nettoyé
 */
export function stripHtml(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean} True si valide
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un numéro de téléphone français
 * @param {string} phone - Numéro à valider
 * @returns {boolean} True si valide
 */
export function isValidPhone(phone) {
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  return phoneRegex.test(phone);
}

/**
 * Sanitize les données d'un formulaire
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Données nettoyées
 */
export function sanitizeFormData(formData) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitized[key] = stripHtml(value.trim());
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Valide une date au format ISO ou DD/MM/YYYY
 * @param {string} dateStr - Date à valider
 * @returns {boolean} True si valide
 */
export function isValidDate(dateStr) {
  if (!dateStr) return true; // Date optionnelle
  
  // Format ISO (YYYY-MM-DD)
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  // Format français (DD/MM/YYYY)
  const frRegex = /^\d{2}\/\d{2}\/\d{4}$/;
  
  if (!isoRegex.test(dateStr) && !frRegex.test(dateStr)) {
    return false;
  }
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date);
}

/**
 * Limite la longueur d'une chaîne
 * @param {string} text - Texte à limiter
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte limité
 */
export function limitLength(text, maxLength = 255) {
  if (typeof text !== 'string') return text;
  return text.substring(0, maxLength);
}
