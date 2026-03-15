import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Home,
  Heart,
  GitBranch,
  Menu,
  X,
} from "lucide-react";

// ── Navigation items 
const NAV_ITEMS = [
  { to: "/dashboard", label: "Accueil",   icon: LayoutDashboard },
  { to: "/personnes", label: "Personnes", icon: Users           },
  { to: "/familles",  label: "Familles",  icon: Home            },
  { to: "/unions",    label: "Unions",    icon: Heart           },
  { to: "/arbres",    label: "Arbres",    icon: GitBranch       },
];

// ── Sidebar content (partagé desktop + mobile) 
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <span className="text-xl font-bold text-gray-900 tracking-tight">
          Généalogie
        </span>
        <p className="text-xs text-gray-400 mt-0.5">Gestion familiale</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")
            }
          >
            <Icon size={18} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

// ── Layout 
interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Ferme le drawer mobile à chaque changement de route
  // (NavLink onClick suffit, mais sécurité supplémentaire)
  const closeMobile = () => setMobileOpen(false);

  // Titre de la page courante pour le header mobile
  const currentPage =
    NAV_ITEMS.find((n) => location.pathname.startsWith(n.to))?.label ?? "";

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">

      {/* ── Sidebar desktop (fixe, visible md+) ───────────────────────────── */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* ── Drawer mobile (overlay) ────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 transition-opacity"
            onClick={closeMobile}
          />

          {/* Drawer panel */}
          <div className="relative z-50 flex flex-col w-72 bg-white shadow-xl">
            {/* Bouton fermeture */}
            <button
              onClick={closeMobile}
              className="absolute top-4 right-4 p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>

            <SidebarContent onNavigate={closeMobile} />
          </div>
        </div>
      )}

      {/* ── Zone principale ────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Header mobile uniquement */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
          <span className="text-base font-semibold text-gray-800">
            {currentPage}
          </span>
        </header>

        {/* Contenu de la page */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}