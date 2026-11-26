import { Link } from "react-router-dom";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-red-50">
            <AlertTriangle size={32} className="text-red-400" />
          </div>
        </div>
        <div>
          <h1 className="text-5xl font-bold text-gray-900">404</h1>
          <p className="text-base font-medium text-gray-700 mt-2">Page introuvable</p>
          <p className="text-sm text-gray-400 mt-1">
            La page que vous cherchez n'existe pas ou a été déplacée.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Home size={15} /> Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}