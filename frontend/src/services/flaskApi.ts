import axios from "axios";
import { attachAuth } from "../auth/attachAuth";

// Toutes les requêtes vers Flask
const flaskApi = axios.create({
  baseURL: import.meta.env.VITE_FLASK_URL ?? "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Cookie de session envoyé automatiquement + gestion des 401 (voir auth/attachAuth.ts)
attachAuth(flaskApi);

export default flaskApi;