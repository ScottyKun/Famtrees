import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/** Garde de route : redirige vers /login (puis revient ici) si personne n'est connecté. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="flex items-center justify-center h-screen text-sm text-gray-400">Chargement…</div>;
  }
  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
