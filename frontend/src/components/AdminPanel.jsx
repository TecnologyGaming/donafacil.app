import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mockDb } from "../mock";
import { useToast } from "../hooks/use-toast";
import { Shield, Sparkles, CreditCard, ToggleLeft, ToggleRight, Check, X, AlertTriangle, ArrowUpRight, CheckCircle2, MessageSquare, TrendingUp, HelpCircle } from "lucide-react";

export default function AdminPanel() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [activeTab, setActiveTab] = useState("campanas");

  // Verification Modal States
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedCampaignForVerify, setSelectedCampaignForVerify] = useState(null);

  // Editable Baselines Settings States
  const [baseRaised, setBaseRaised] = useState("30050");
  const [baseCampaigns, setBaseCampaigns] = useState("5");
  const [baseDonations, setBaseDonations] = useState("860");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Admin Login States
  const [isAdminLogged, setIsAdminLogged] = useState(localStorage.getItem("df_admin_logged") === "true");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (loginUser === "DONATEX" && loginPass === "Venezuela257#") {
      localStorage.setItem("df_admin_logged", "true");
      setIsAdminLogged(true);
      setLoginError("");
      toast({
        title: "Sesión Iniciada",
        description: "Bienvenido de vuelta, Administrador.",
      });
    } else {
      setLoginError("Usuario o clave incorrecta. Inténtalo de nuevo.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("df_admin_logged");
    setIsAdminLogged(false);
    toast({
      title: "Sesión Cerrada",
      description: "Has salido del panel de administración.",
    });
  };

  const loadData = async () => {
    try {
      const data = await mockDb.getCampaigns();
      setCampaigns(data);
      
      const settings = await mockDb.getSiteSettings();
      if (settings) {
        setBaseRaised(settings.baseRaised.toString());
        setBaseCampaigns(settings.baseCampaigns.toString());
        setBaseDonations(settings.baseDonations.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const success = await mockDb.updateSiteSettings({
        baseRaised,
        baseCampaigns,
        baseDonations
      });
      setIsSavingSettings(false);
      if (success) {
        toast({
          title: "Configuración Guardada",
          description: "Los valores base del contador han sido actualizados en la portada.",
        });
      }
    } catch (err) {
      console.error(err);
      setIsSavingSettings(false);
      toast({
        title: "Error al guardar",
        description: "No se pudieron actualizar los valores.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadData();

    const handleRoleChange = () => {
      loadData();
    };
    window.addEventListener("df_role_changed", handleRoleChange);
    return () => window.removeEventListener("df_role_changed", handleRoleChange);
  }, []);

  // Actions
  const handleToggleActive = async (id, title) => {
    try {
      const updated = await mockDb.toggleCampaignActive(id);
      await loadData();
      if (updated) {
        toast({
          title: updated.isActive ? "Campaña Activada" : "Campaña Suspendida",
          description: `Se cambió el estado de: "${title}"`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStripe = async (id, title) => {
    try {
      const updated = await mockDb.toggleStripeEnabled(id);
      await loadData();
      if (updated) {
        toast({
          title: updated.stripeEnabled ? "Stripe Habilitado" : "Stripe Deshabilitado",
          description: `Pasarela Stripe para "${title}" ahora está ${updated.stripeEnabled ? "ENCENDIDA" : "APAGADA"}.`,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprovePayment = async (campaignId, methodId, methodName, approved) => {
    try {
      await mockDb.approveCustomPaymentMethod(campaignId, methodId, approved);
      await loadData();
      toast({
        title: approved ? "Método Aprobado" : "Método Rechazado/Inhabilitado",
        description: `El canal "${methodName}" ha sido actualizado con éxito.`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Stats calculation
  const totalRaised = campaigns.reduce((acc, c) => acc + c.current, 0);
  const activeCount = campaigns.filter(c => c.isActive).length;
  const inactiveCount = campaigns.filter(c => !c.isActive).length;
  
  // Pending methods count
  const pendingMethods = [];
  campaigns.forEach(c => {
    c.customPaymentMethods?.forEach(m => {
      if (!m.approved) {
        pendingMethods.push({
          campaignId: c.id,
          campaignTitle: c.title,
          method: m
        });
      }
    });
  });

  const allDonations = [];
  campaigns.forEach(c => {
    c.donations?.forEach(d => {
      allDonations.push({
        ...d,
        campaignTitle: c.title,
        campaignId: c.id
      });
    });
  });
  // Sort donations by date desc
  allDonations.sort((a, b) => new Date(b.date) - new Date(a.date));

  if (!isAdminLogged) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-20 text-left">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Acceso Administrativo</h2>
            <p className="text-xs text-gray-400">Ingresa las credenciales del portal para continuar</p>
          </div>

          {loginError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Usuario</label>
              <input
                type="text"
                required
                placeholder="Ingresa tu usuario de administrador"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input
                type="password"
                required
                placeholder="Ingresa tu clave de administrador"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8 text-left">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Banner admin */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full">
              <Shield className="h-4 w-4" />
              <span>Modo Panel de Administración</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">Control Centralizado Donafácil</h1>
            <p className="text-slate-400 text-sm">Gestiona solicitudes, habilita el Stripe global y aprueba métodos manuales de pago.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
            <div className="flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 p-4 rounded-xl text-emerald-400">
              <TrendingUp className="h-5 w-5" />
              <div className="text-left">
                <p className="text-xs uppercase font-extrabold text-emerald-300">Donaciones Totales</p>
                <p className="text-xl font-black">{totalRaised.toLocaleString("es-ES")} €</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 px-4 rounded-xl border border-slate-700 hover:border-slate-600 transition-all text-center shrink-0"
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -z-0"></div>
        </div>

        {/* Admin Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Campañas Activas</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>

          <div className="bg-white border p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Campañas Suspendidas</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{inactiveCount}</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-slate-300"></span>
          </div>

          <div className="bg-white border p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Pagos por Aprobar</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{pendingMethods.length}</p>
            </div>
            {pendingMethods.length > 0 && <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>}
          </div>

          <div className="bg-white border p-5 rounded-2xl shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Operaciones de Pago</p>
              <p className="text-2xl font-black text-blue-700 mt-1">{allDonations.length}</p>
            </div>
            <CreditCard className="h-5 w-5 text-blue-500" />
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("campanas")}
            className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 shrink-0 ${
              activeTab === "campanas" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Gestión de Solicitudes ({campaigns.length})
          </button>
          <button
            onClick={() => setActiveTab("pagos")}
            className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === "pagos" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Aprobación de Métodos Manuales
            {pendingMethods.length > 0 && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-extrabold animate-bounce">
                {pendingMethods.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("donaciones")}
            className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 shrink-0 ${
              activeTab === "donaciones" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Historial de Donaciones ({allDonations.length})
          </button>
          <button
            onClick={() => setActiveTab("configuracion")}
            className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === "configuracion" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Configuración de Portada
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "campanas" && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="font-extrabold text-gray-900 text-base">Solicitudes de Donación del Sistema</h2>
              <span className="text-xs text-gray-400 font-semibold">Toma de decisiones en tiempo real</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Campaña / Organizador</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4">Recaudado / Meta</th>
                    <th className="p-4 text-center">Stripe (Tarjeta Global)</th>
                    <th className="p-4 text-center">Estado Solicitud</th>
                    <th className="p-4 text-right">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {campaigns.map((c) => {
                    const percent = Math.min(100, Math.round((c.current / c.goal) * 100)) || 0;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-gray-900 max-w-xs truncate">{c.title}</div>
                          <div className="text-xs text-gray-400">{c.organizer.name} • {c.organizer.email} {c.organizer.phone && `• Cel: ${c.organizer.phone}`}</div>
                        </td>
                        <td className="p-4">
                          <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-md">
                            {c.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{c.current.toLocaleString("es-ES")} €</div>
                          <div className="text-xs text-gray-500">Meta: {c.goal.toLocaleString("es-ES")} € ({percent}%)</div>
                        </td>
                        
                        {/* Stripe Switch */}
                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleStripe(c.id, c.title)}
                              className={`flex items-center gap-1 text-xs font-bold rounded-full px-3 py-1.5 transition-all ${
                                c.stripeEnabled
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-slate-100 text-slate-500 border border-slate-200"
                              }`}
                              title={c.stripeEnabled ? "Haga clic para deshabilitar Stripe" : "Haga clic para habilitar Stripe"}
                            >
                              {c.stripeEnabled ? (
                                <>
                                  <ToggleRight className="h-5 w-5 text-emerald-600 fill-emerald-500" />
                                  <span>Activo</span>
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-5 w-5 text-slate-400" />
                                  <span>Inactivo</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Request Active/Inactive Toggle */}
                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleToggleActive(c.id, c.title)}
                              className={`text-xs font-bold rounded-full px-3.5 py-1.5 transition-all border ${
                                c.isActive
                                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm"
                                  : "bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100"
                              }`}
                            >
                              {c.isActive ? "Encendido (Visible)" : "Apagado (Oculto)"}
                            </button>
                          </div>
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                setSelectedCampaignForVerify(c);
                                setShowVerifyModal(true);
                              }}
                              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              Docs Verificación
                            </button>
                            <Link
                              to={`/campaigns/${c.id}`}
                              className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 hover:text-emerald-700"
                            >
                              Ver Causa <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "pagos" && (
          <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6 shadow-sm">
              <h2 className="font-extrabold text-gray-900 text-lg mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                Aprobación de Canales de Cobro Manuales (Personalizados)
              </h2>
              <p className="text-gray-500 text-sm">
                Los organizadores de campañas pueden dar de alta sus propios Bizum, cuentas bancarias u otros métodos de cobro directo. Como administrador, debes verificar si son legítimos antes de habilitarlos públicamente para los donantes.
              </p>
            </div>

            {/* List of pending approvals */}
            {pendingMethods.length === 0 ? (
              <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 space-y-3 shadow-sm">
                <Check className="h-10 w-10 text-emerald-500 mx-auto bg-emerald-50 p-2.5 rounded-full" />
                <h3 className="font-bold text-gray-900">¡Todo al día!</h3>
                <p className="text-sm text-gray-500">No hay canales de pago personalizados pendientes de aprobación en este momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingMethods.map(({ campaignId, campaignTitle, method }) => (
                  <div key={method.id} className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm space-y-4 text-left">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          Pendiente de Revisión
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2">{method.name}</h3>
                      </div>
                      <div className="text-xs text-gray-400 text-right">
                        Ref: {method.id}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border font-mono text-xs text-gray-800 font-bold break-all">
                      {method.details}
                    </div>

                    <div className="text-xs text-gray-500">
                      Causa asociada: <Link to={`/campaigns/${campaignId}`} className="underline text-emerald-600 font-bold">{campaignTitle}</Link>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-2 border-t">
                      <button
                        onClick={() => handleApprovePayment(campaignId, method.id, method.name, true)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <Check className="h-4 w-4" /> Aprobar Método
                      </button>
                      <button
                        onClick={() => handleApprovePayment(campaignId, method.id, method.name, false)}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1"
                      >
                        <X className="h-4 w-4" /> Denegar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Approved Methods for Reference */}
            <div className="bg-white border rounded-2xl p-5 shadow-sm text-left">
              <h3 className="font-extrabold text-gray-900 text-sm mb-4">Canales ya aprobados (Historial)</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {campaigns.flatMap(c => c.customPaymentMethods?.filter(m => m.approved).map(m => ({ campaign: c, method: m })) || []).map(({ campaign, method }, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 last:border-0 last:pb-0 gap-2">
                    <div>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">{method.name}</span>
                        <span className="text-xs text-gray-500">en {campaign.title}</span>
                      </div>
                      <p className="font-mono text-xs text-gray-600 mt-1 break-all">{method.details}</p>
                    </div>
                    <button
                      onClick={() => handleApprovePayment(campaign.id, method.id, method.name, false)}
                      className="border border-rose-100 hover:bg-rose-50 text-rose-600 text-xs font-bold py-1.5 px-3 rounded-lg transition-all self-start sm:self-center"
                    >
                      Inhabilitar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "donaciones" && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="font-extrabold text-gray-900 text-base">Registro General de Donaciones</h2>
              <span className="text-xs text-gray-400 font-semibold">Auditoría completa</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Donante</th>
                    <th className="p-4">Campaña Destino</th>
                    <th className="p-4">Importe</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Mensaje de Apoyo / Notas</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-left">
                  {allDonations.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{d.name}</td>
                      <td className="p-4">
                        <Link to={`/campaigns/${d.campaignId}`} className="hover:underline text-emerald-600 font-semibold">
                          {d.campaignTitle}
                        </Link>
                      </td>
                      <td className="p-4 text-emerald-700 font-extrabold">{d.amount.toLocaleString("es-ES")} €</td>
                      <td className="p-4 text-xs text-gray-400">
                        {new Date(d.date).toLocaleString("es-ES")}
                      </td>
                      <td className="p-4 text-xs text-gray-600 font-medium italic max-w-xs truncate" title={d.comment}>
                        {d.comment || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "configuracion" && (
          <div className="bg-white border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 max-w-xl text-left">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5 pb-2 border-b">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                Configurar Baselines Sociales (Portada)
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Modifica los valores base (social proof offsets) que se muestran en el contador principal de la página de inicio. El sistema les sumará las donaciones y campañas reales de forma automática.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  1. Recaudación Base Inicial (€)
                </label>
                <input
                  type="number"
                  required
                  placeholder="30050"
                  value={baseRaised}
                  onChange={(e) => setBaseRaised(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  2. Campañas Activas Base
                </label>
                <input
                  type="number"
                  required
                  placeholder="5"
                  value={baseCampaigns}
                  onChange={(e) => setBaseCampaigns(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  3. Donaciones Realizadas Base
                </label>
                <input
                  type="number"
                  required
                  placeholder="860"
                  value={baseDonations}
                  onChange={(e) => setBaseDonations(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {isSavingSettings ? "Guardando Valores..." : "Guardar Valores Base"}
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Modal de Verificacion de Identidad */}
      {showVerifyModal && selectedCampaignForVerify && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden border">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Auditoría de Identidad</span>
                <span className="font-extrabold text-base">{selectedCampaignForVerify.title}</span>
              </div>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedCampaignForVerify(null);
                }}
                className="text-white/80 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Organizer details */}
              <div className="bg-slate-50 p-4 border rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="font-bold text-gray-400 block uppercase">Nombre Organizador</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedCampaignForVerify.organizer.name}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 block uppercase">Correo</span>
                  <span className="font-semibold text-gray-900 text-sm break-all">{selectedCampaignForVerify.organizer.email}</span>
                </div>
                <div>
                  <span className="font-bold text-gray-400 block uppercase">Teléfono Celular</span>
                  <span className="font-bold text-gray-900 text-sm">{selectedCampaignForVerify.organizer.phone || "No registrado"}</span>
                </div>
              </div>

              {/* Images previews */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Cedula Box */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">
                    1. Cédula de Identidad / DNI
                  </span>
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border flex items-center justify-center relative group">
                    {selectedCampaignForVerify.cedulaImage && selectedCampaignForVerify.cedulaImage !== "N/A" ? (
                      <img 
                        src={selectedCampaignForVerify.cedulaImage} 
                        alt="Cédula" 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">No cargada en la creación</span>
                    )}
                  </div>
                </div>

                {/* Selfie Box */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block text-center">
                    2. Selfie con la Cédula
                  </span>
                  <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden border flex items-center justify-center relative group">
                    {selectedCampaignForVerify.selfieImage && selectedCampaignForVerify.selfieImage !== "N/A" ? (
                      <img 
                        src={selectedCampaignForVerify.selfieImage} 
                        alt="Selfie" 
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 italic">No cargada en la creación</span>
                    )}
                  </div>
                </div>

              </div>

              {/* Actions */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-center text-xs text-emerald-800 leading-relaxed">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <p>
                  <strong>¿Los datos coinciden?</strong> Como administrador, puedes validar estas fotos con el nombre del organizador. Si es legítimo, puedes mantener la campaña encendida en la tabla principal de solicitudes.
                </p>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="bg-slate-50 p-4 border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setSelectedCampaignForVerify(null);
                }}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
