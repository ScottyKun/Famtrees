import axios from "axios";
import { attachAuth } from "../auth/attachAuth";

// Toutes les requêtes vers Spring Boot
const api = axios.create({
  baseURL: import.meta.env.VITE_SPRING_URL ?? "http://localhost:8070/api",
  headers: { "Content-Type": "application/json" },
});

// Cookie de session envoyé automatiquement + gestion des 401 (voir auth/attachAuth.ts)
attachAuth(api);

export default api;