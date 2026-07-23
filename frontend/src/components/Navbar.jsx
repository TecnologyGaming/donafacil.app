import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, User, Shield, Compass, PlusCircle, Search, LayoutDashboard, LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem("df_user_role") || "donor");
  const [searchQuery, setSearchQuery] = useState("");

  const handleRoleChange = (newRole) => {
    localStorage.setItem("df_user_role", newRole);
    setRole(newRole);
    // Dispatch custom event to let other components know the role changed
    window.dispatchEvent(new Event("df_role_changed"));
    if (newRole === "admin") {
      navigate("/admin");
    } else if (newRole === "organizer") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        
        {/* Logo and Main Nav */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-emerald-600 fill-emerald-500 animate-pulse" />
            <span className="hidden font-bold text-xl sm:inline-block tracking-tight text-emerald-700">
              donafacil<span className="text-gray-500 text-sm font-normal">.app</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/" className="transition-colors hover:text-emerald-600 flex items-center gap-1 text-foreground/80 hover:text-foreground">
              <Compass className="h-4 w-4" />
              Descubrir
            </Link>
            <Link to="/create" className="transition-colors hover:text-emerald-600 flex items-center gap-1 text-foreground/80 hover:text-foreground">
              <PlusCircle className="h-4 w-4" />
              Iniciar Recaudación
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="hidden sm:flex items-center relative max-w-xs w-full mx-4">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar causas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 focus:bg-white transition-all border-none"
          />
        </form>

        {/* User Role Switcher & Nav Actions */}
        <div className="flex items-center gap-4">
          {/* Quick Demo Switcher */}
          <div className="flex items-center bg-muted rounded-full p-1 text-xs">
            <button
              onClick={() => handleRoleChange("donor")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                role === "donor" ? "bg-white text-emerald-700 font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Ver como Donante / Visitante"
            >
              Donante
            </button>
            <button
              onClick={() => handleRoleChange("organizer")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                role === "organizer" ? "bg-white text-emerald-700 font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Ver como Organizador de Campañas"
            >
              Creador
            </button>
            <button
              onClick={() => handleRoleChange("admin")}
              className={`px-2.5 py-1 rounded-full transition-all ${
                role === "admin" ? "bg-white text-emerald-700 font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
              title="Ver como Administrador"
            >
              Admin
            </button>
          </div>

          {/* Conditional Navigation Link */}
          {role === "admin" ? (
            <Link
              to="/admin"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full transition-all"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden md:inline">Panel Admin</span>
            </Link>
          ) : role === "organizer" ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full transition-all"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden md:inline">Mi Panel</span>
            </Link>
          ) : (
            <Link
              to="/create"
              className="hidden lg:flex items-center gap-1 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-full shadow-sm hover:shadow transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              Recaudar Fondos
            </Link>
          )}

          {/* Quick Avatar Mock */}
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200">
            {role === "admin" ? "AD" : role === "organizer" ? "LM" : "DN"}
          </div>
        </div>

      </div>
    </header>
  );
}
