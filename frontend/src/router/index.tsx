import { createBrowserRouter, RouterProvider, Outlet, Navigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import RequireAuth from "../auth/RequireAuth";

// Pages — imports lazy pour ne charger que ce qui est affiché
import { lazy, Suspense } from "react";

const Dashboard   = lazy(() => import("../pages/Dashboard/DashboardPage"));
const Personnes   = lazy(() => import("../pages/Personnes/PersonnesPage"));
const Familles    = lazy(() => import("../pages/Familles/FamillesPages"));
const Unions      = lazy(() => import("../pages/Unions/UnionsPage"));
const ArbresList  = lazy(() => import("../pages/Arbres/ArbresListPage"));
const ArbreView   = lazy(() => import("../pages/Arbres/ArbreViewPage"));
const NotFound    = lazy(() => import("../pages/NotFound"));
const Login       = lazy(() => import("../pages/Auth/LoginPage"));
const Register    = lazy(() => import("../pages/Auth/RegisterPage"));
const Users       = lazy(() => import("../pages/Users/UsersPage"));

// Fallback affiché pendant le chargement d'une page
const PageLoader = () => (
  <div className="flex items-center justify-center h-full text-gray-400">
    Chargement…
  </div>
);

const router = createBrowserRouter([
  // Pages publiques (hors Layout)
  { path: "/login",    element: <Suspense fallback={<PageLoader />}><Login /></Suspense> },
  { path: "/register", element: <Suspense fallback={<PageLoader />}><Register /></Suspense> },
  {
    // Layout racine : sidebar + header communs à toutes les pages.
    // RequireAuth : tout ce qui est en dessous exige d'être connecté.
    path: "/",
    element: (
      <RequireAuth>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </Layout>
      </RequireAuth>
    ),
    children: [
      // Redirect / → /dashboard
      { index: true, element: <Navigate to="/dashboard" replace /> },

      { path: "dashboard",  element: <Dashboard  /> },
      { path: "personnes",  element: <Personnes  /> },
      { path: "familles",   element: <Familles   /> },
      { path: "unions",     element: <Unions     /> },
      { path: "utilisateurs", element: <Users    /> },

      // Liste des arbres sauvegardés (PostgreSQL)
      { path: "arbres",     element: <ArbresList /> },

      // Visualisation d'un arbre — :arbreId = uuid PostgreSQL
      // La page récupère la racine_id en PostgreSQL puis appelle Flask/Neo4j
      { path: "arbres/:arbreId", element: <ArbreView /> },
    ],
    errorElement: (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}