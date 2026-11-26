import axios from "axios";

// Toutes les requêtes vers Flask
const flaskApi = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

export default flaskApi;