import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { mockDb } from "../mock";
import { Heart, Search, Award, ShieldCheck, Zap, ArrowRight, Activity, Sparkles } from "lucide-react";

const CATEGORIES = ["Todas", "Salud", "Emergencias", "Educación", "Deportes", "Mascotas", "Comunidad"];

export default function Home() {
  const [searchParams] = useSearchParams();
  const searchQ = searchParams.get("search") || "";
  
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [searchQuery, setSearchQuery] = useState(searchQ);
  
  const loadCampaigns = async () => {
    try {
      const activeCampaigns = await mockDb.getActiveCampaigns(selectedCategory, searchQuery);
      setCampaigns(activeCampaigns);
    } catch (e) {
      console.error("Error loading campaigns:", e);
    }
  };

  useEffect(() => {
    // Sync search query from URL search parameters if any
    setSearchQuery(searchQ);
  }, [searchQ]);

  useEffect(() => {
    loadCampaigns();
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    const handleRoleChange = () => {
      loadCampaigns();
    };
    window.addEventListener("df_role_changed", handleRoleChange);
    return () => window.removeEventListener("df_role_changed", handleRoleChange);
  }, []);

  const filteredCampaigns = campaigns;

  // Calculate totals for stats
  const totalRaised = campaigns.reduce((acc, c) => acc + c.current, 0);
  const totalGoal = campaigns.reduce((acc, c) => acc + c.goal, 0);
  const totalDonors = campaigns.reduce((acc, c) => acc + Math.round(c.current / 35), 0) || 15;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-transparent pt-16 pb-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left text column */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span>La plataforma de recaudación en español</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                Recauda fondos para lo que <span className="text-emerald-600 underline decoration-wavy decoration-emerald-500/40">más importa</span>
              </h1>
              
              <p className="text-lg text-gray-600 max-w-xl">
                Crea una campaña gratuita en minutos, comparte tu historia y recibe el apoyo directo de amigos, familiares y donantes solidarios con Stripe y métodos personalizados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Link
                  to="/create"
                  className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base px-8 py-4 rounded-full shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all transform hover:-translate-y-0.5"
                >
                  Inicia una Campaña Gratis
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href="#campanas"
                  className="flex items-center justify-center gap-2 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-gray-700 font-semibold px-8 py-4 rounded-full transition-all"
                >
                  Descubrir Causas
                </a>
              </div>

              {/* Live stats */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-100 max-w-lg">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                    {totalRaised.toLocaleString("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Recaudados</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                    {campaigns.length}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Campañas activas</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                    {totalDonors}
                  </p>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Donaciones realizadas</p>
                </div>
              </div>
            </div>

            {/* Right illustration/card column */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 space-y-6">
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-inner">
                  <img
                    src="https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxtZWRpY2FsJTIwY2FyZXxlbnwwfHx8fDE3ODQ4MTkwMTV8MA&ixlib=rb-4.1.0&q=85"
                    alt="Salud"
                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    Destacada
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Salud</span>
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-1">Tratamiento Médico para Sofía</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    Ayúdanos a financiar el viaje y tratamiento médico de Sofía, una pequeña guerrera de 5 años diagnosticada con una enfermedad rara.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-emerald-700">18.500 € recaudados</span>
                    <span className="text-gray-500">Meta: 25.000 €</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: "74%" }}></div>
                  </div>
                </div>

                <Link
                  to="/campaigns/1"
                  className="block text-center w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow shadow-emerald-600/10 hover:shadow-emerald-600/20"
                >
                  Apoyar esta causa
                </Link>
              </div>
              
              {/* Decorative background blurs */}
              <div className="absolute -top-12 -left-12 w-48 h-48 bg-emerald-200/40 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-200/30 rounded-full blur-3xl -z-10"></div>
            </div>

          </div>
        </div>
      </section>

      {/* Filter and Campaigns List */}
      <section id="campanas" className="container mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-left">
              Explorar causas activas
            </h2>
            <p className="text-gray-500 text-sm mt-1 text-left">
              Apoya de forma segura con Stripe o consulta métodos personalizados aprobados
            </p>
          </div>

          {/* Quick search input */}
          <div className="relative max-w-xs w-full md:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar campaña..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-4 px-4 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all shrink-0 border ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-gray-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Campaigns */}
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl p-8 max-w-lg mx-auto shadow-sm">
            <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4 stroke-[1.5]" />
            <h3 className="text-lg font-bold text-gray-900">No encontramos campañas</h3>
            <p className="text-gray-500 text-sm mt-1">
              Prueba cambiando la categoría o los términos de búsqueda.
            </p>
            <button
              onClick={() => { setSelectedCategory("Todas"); setSearchQuery(""); }}
              className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCampaigns.map((c) => {
              const percent = Math.min(100, Math.round((c.current / c.goal) * 100)) || 0;
              return (
                <article
                  key={c.id}
                  className="group flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex-1 text-left"
                >
                  <Link to={`/campaigns/${c.id}`} className="block relative aspect-video overflow-hidden bg-slate-100">
                    <img
                      src={c.images[0] || "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"}
                      alt={c.title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                      {c.category}
                    </div>
                  </Link>

                  <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-400">Por {c.organizer.name}</p>
                      <Link to={`/campaigns/${c.id}`}>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                          {c.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-500 line-clamp-2">{c.description}</p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-50">
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-extrabold text-gray-900">{c.current.toLocaleString("es-ES")} €</span>
                          <span className="text-xs text-gray-500 block">recaudados</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-600">{percent}%</span>
                          <span className="text-xs text-gray-500 block">meta {c.goal.toLocaleString("es-ES")} €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust and features */}
      <section className="container mx-auto px-4 sm:px-6 py-12 border-t border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left space-y-3 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Donaciones Seguras</h3>
            <p className="text-sm text-gray-500">
              Protegemos a donantes y recaudadores con altos estándares de seguridad cibernética a través de Stripe y verificación.
            </p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left space-y-3 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Métodos Flexibles</h3>
            <p className="text-sm text-gray-500">
              Paga directamente con tarjeta de crédito/débito o elige Bizum, PayPal o transferencias aprobadas para cada causa.
            </p>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl flex flex-col items-center md:items-start text-center md:text-left space-y-3 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">Cero Costos Ocultos</h3>
            <p className="text-sm text-gray-500">
              Registrarse e iniciar una campaña es totalmente gratis. Los donantes pueden dejar una propina opcional para el mantenimiento.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
