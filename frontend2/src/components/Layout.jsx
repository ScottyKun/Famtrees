import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Home, Users, GitBranch, Heart, Network } from "lucide-react";

const navigation = [
  { name: "Accueil", path: "/", icon: Home },
  { name: "Personnes", path: "/personnes", icon: Users },
  { name: "Familles", path: "/familles", icon: GitBranch },
  { name: "Unions", path: "/unions", icon: Heart },
  { name: "Arbres", path: "/arbres", icon: Network },
];

export function Layout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const NavLinks = () => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition font-medium
              ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            <Icon size={18} />
            {item.name}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      
      {/* ================= DESKTOP SIDEBAR ================= */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-lg font-bold">GénéaApp</h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          <NavLinks />
        </nav>
      </aside>

      {/* ================= MOBILE DRAWER ================= */}
      <div className={`fixed inset-0 z-40 md:hidden pointer-events-none transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`}>
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
        {/* Drawer */}
        <aside
          className={`absolute inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          } flex flex-col`}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b">
            <h1 className="font-semibold">GénéaApp</h1>
            <button onClick={() => setMobileOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            <NavLinks />
          </nav>
        </aside>
      </div>

      {/* ================= MAIN AREA ================= */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h2 className="font-semibold text-gray-800">Gestion généalogique</h2>
          <div />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}