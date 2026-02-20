// Configuration de l'API
// Remplace cette URL par celle de ton backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Configuration des headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  // Ajoute ici ton token d'authentification si nécessaire
  // 'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

// Fonction utilitaire pour gérer les erreurs
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erreur serveur' }));
    throw new Error(error.message || `Erreur HTTP: ${response.status}`);
  }
  return response.json();
};

// ==================== PERSONNES ====================
export const personnesAPI = {
  // Récupérer toutes les personnes
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/personnes`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Récupérer une personne par ID
  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/personnes/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Créer une nouvelle personne
  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/personnes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Mettre à jour une personne
  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/personnes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Supprimer une personne
  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/personnes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== FAMILLES ====================
export const famillesAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/familles`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/familles/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/familles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/familles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/familles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== UNIONS ====================
export const unionsAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/unions`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/unions/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/unions`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/unions/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/unions/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== ARBRES ====================
export const arbresAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/arbres`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  getById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/arbres/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  create: async (data) => {
    const response = await fetch(`${API_BASE_URL}/arbres`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  update: async (id, data) => {
    const response = await fetch(`${API_BASE_URL}/arbres/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  delete: async (id) => {
    const response = await fetch(`${API_BASE_URL}/arbres/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// ==================== STATISTIQUES ====================
export const statsAPI = {
  getDashboard: async () => {
    const response = await fetch(`${API_BASE_URL}/stats/dashboard`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};
