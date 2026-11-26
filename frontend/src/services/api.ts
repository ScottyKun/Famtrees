import axios from "axios";

// Toutes les requêtes vers Spring Boot
const api = axios.create({
  baseURL: import.meta.env.VITE_SPRING_URL ?? "http://localhost:8070/api",
  headers: { "Content-Type": "application/json" },
});

export default api;