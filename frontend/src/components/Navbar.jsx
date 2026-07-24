import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthModal from "./AuthModal";
import { Heart, User, Shield, Compass, PlusCircle, Search, LayoutDashboard, LogOut } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem("df_user_role") || "donor");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Real session state
  const [user, setUser] = useState(localStorage.getItem("df_user") ? JSON.parse(localStorage.getItem("df_user")) : null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const handleLogin = () => {
      const u = localStorage.getItem("df_user") ? JSON.parse(localStorage.getItem("df_user")) : null;
      setUser(u);
      setRole(localStorage.getItem("df_user_role") || "donor");
    };
    window.addEventListener("df_user_login", handleLogin);
    window.addEventListener("df_role_changed", handleLogin);
    return () => {
      window.removeEventListener("df_user_login", handleLogin);
      window.removeEventListener("df_role_changed", handleLogin);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("df_user");
    localStorage.removeItem("df_user_role");
    setUser(null);
    setRole("donor");
    window.dispatchEvent(new Event("df_user_login"));
    window.dispatchEvent(new Event("df_role_changed"));
    navigate("/");
  };

  const handleRoleChange = (newRole) => {
    localStorage.setItem("df_user_role", newRole);
    setRole(newRole);
    if (newRole === "donor") {
      localStorage.removeItem("df_user");
      setUser(null);
    } else if (newRole === "organizer" && !user) {
      // Force Login if switching to creator and not logged in
      setShowAuthModal(true);
    }
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
            <span className="font-bold text-xl inline-block tracking-tight text-emerald-700">
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
          {user ? (
            <div className="flex items-center gap-4">
              {role === "admin" ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full transition-all"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden md:inline">Panel Admin</span>
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden md:inline">Mi Panel</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
              >
                Cerrar Sesión
              </button>

              {/* Real Initials Avatar matching screenshot */}
              <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold border border-emerald-200 text-xs shadow-sm cursor-pointer" title={user.name}>
                {user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2)}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full border border-emerald-100 transition-all"
              >
                Ingresar / Registrarse
              </button>
            </div>
          )}
        </div>

      </div>

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => {
            const u = JSON.parse(localStorage.getItem("df_user"));
            setUser(u);
            setRole("organizer");
            navigate("/dashboard");
          }}
        />
      )}
    </header>
  );
}
