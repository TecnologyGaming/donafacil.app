import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mockDb } from "../mock";
import { useToast } from "../hooks/use-toast";
import { LayoutDashboard, CheckCircle2, AlertCircle, Plus, Users, Landmark, FileText, ToggleLeft, ToggleRight, ArrowUpRight, ShieldCheck } from "lucide-react";

const CopyableValue = ({ value, label }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      onClick={handleCopy}
      className="flex items-center justify-between gap-2 bg-white hover:bg-slate-50 border px-3 py-2 rounded-lg cursor-pointer transition-all group mt-2 w-full"
      title="Haga clic para copiar al portapapeles"
    >
      <div className="overflow-hidden">
        {label && <span className="block text-[8px] text-gray-400 uppercase font-bold">{label}</span>}
        <p className="font-mono text-xs text-gray-800 font-bold break-all">{value}</p>
      </div>
      <div className="shrink-0 p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 group-hover:text-emerald-600 transition-colors">
        {copied ? (
          <span className="text-[9px] text-emerald-600 font-extrabold px-1">¡Copiado!</span>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        )}
      </div>
    </div>
  );
};

const renderDetailsLines = (details) => {
  const lines = details.split(/[,/;\n\r]+/).map(l => l.trim()).filter(Boolean);
  return (
    <div className="space-y-1.5 mt-2 w-full text-left">
      {lines.map((line, idx) => {
        let label = "Dato de Pago";
        if (line.match(/04\d{2}[-.\s]?\d{3}[-.\s]?\d{4}/) || line.match(/\+?\d{10,13}/)) {
          label = "Número Celular";
        } else if (line.match(/[vVeEjJgG][-.\s]?\d{5,10}/) || line.match(/^\d{7,9}$/)) {
          label = "Cédula de Identidad";
        } else if (line.length > 2) {
          label = "Banco";
        }
        return (
          <CopyableValue 
            key={idx} 
            value={line} 
            label={label} 
          />
        );
      })}
    </div>
  );
};

export default function UserDashboard() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  
  // Custom Payment Method Input
  const [newMethodName, setNewMethodName] = useState("Pago Móvil");
  const [newMethodDetails, setNewMethodDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Campaign States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("Salud");
  const [editGoal, setEditGoal] = useState("");

  const loadData = async () => {
    try {
      const all = await mockDb.getCampaigns();
      const userCamp = all.filter(c => c.organizer.email === "laura@example.com" || parseInt(c.id) > 4 || isNaN(parseInt(c.id)));
      
      // Let's also fetch donations for each campaign to make sure we combine them!
      const userCampWithDonations = [];
      for (const uc of userCamp) {
        const donations = await mockDb.getCampaignDonations(uc.id);
        userCampWithDonations.push({ ...uc, donations });
      }

      setCampaigns(userCampWithDonations);
      if (userCampWithDonations.length > 0 && !selectedCampaign) {
        setSelectedCampaign(userCampWithDonations[0]);
      } else if (userCampWithDonations.length > 0) {
        // Keep selected sync
        const updatedSelect = userCampWithDonations.find(c => c.id === selectedCampaign.id);
        setSelectedCampaign(updatedSelect || userCampWithDonations[0]);
      }
    } catch (e) {
      console.error("Error loading user dashboard:", e);
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

  const handleToggleActive = async (id) => {
    try {
      await mockDb.toggleCampaignActive(id);
      await loadData();
      toast({
        title: "Estado Actualizado",
        description: "Has cambiado la visibilidad de tu campaña.",
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEdit = () => {
    if (!selectedCampaign) return;
    setEditTitle(selectedCampaign.title);
    setEditDescription(selectedCampaign.description);
    setEditCategory(selectedCampaign.category);
    setEditGoal(selectedCampaign.goal.toString());
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle || !editDescription || !editGoal) {
      toast({
        title: "Campos vacíos",
        description: "Completa todos los campos obligatorios.",
        variant: "destructive"
      });
      return;
    }

    try {
      await mockDb.updateCampaign(selectedCampaign.id, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        goal: parseFloat(editGoal)
      });
      setIsEditing(false);
      await loadData();
      toast({
        title: "Campaña Editada",
        description: "Tus cambios han sido guardados en el servidor con éxito.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error al actualizar",
        description: "Hubo un problema guardando tus cambios.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCampaign) return;
    if (window.confirm("¿Estás absolutamente seguro de que quieres eliminar esta campaña de forma permanente? Esta acción borrará todas tus donaciones y registros y no se puede deshacer.")) {
      try {
        await mockDb.deleteCampaign(selectedCampaign.id);
        toast({
          title: "Campaña Eliminada",
          description: "Tu solicitud de donativo ha sido borrada permanentemente del portal.",
        });
        setSelectedCampaign(null);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!newMethodDetails.trim()) {
      toast({
        title: "Completa los datos",
        description: "Ingresa la dirección o número de cuenta correspondiente.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await mockDb.addCustomPaymentMethod(selectedCampaign.id, {
        name: newMethodName,
        details: newMethodDetails.trim()
      });
      setNewMethodDetails("");
      setIsSubmitting(false);
      await loadData();
      toast({
        title: "¡Método de Pago Agregado!",
        description: "Tu canal de cobro ha sido enviado para verificación del Administrador.",
      });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      toast({
        title: "Error al agregar",
        description: "No se pudo registrar el canal de cobro.",
        variant: "destructive"
      });
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <LayoutDashboard className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Aún no tienes campañas registradas</h2>
        <p className="text-gray-500 mt-2">Puedes iniciar tu primera recaudación de fondos hoy mismo de forma gratuita.</p>
        <Link
          to="/create"
          className="mt-5 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-full transition-all shadow"
        >
          <Plus className="h-5 w-5" /> Iniciar Recaudación
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8 text-left">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Dashboard Intro */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2">
              <LayoutDashboard className="h-7 w-7 text-emerald-600" />
              Mi Panel de Control
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Gestiona tus solicitudes de donativos, configura canales de cobro y revisa el apoyo de la comunidad.
            </p>
          </div>
          <Link
            to="/create"
            className="self-start md:self-center inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow"
          >
            <Plus className="h-4 w-4" /> Nueva Recaudación
          </Link>
        </div>

        {/* Campaign Selector if more than one */}
        {campaigns.length > 1 && (
          <div className="bg-white border p-4 rounded-xl mb-6 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Causa activa:</span>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {campaigns.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCampaign(c)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                    selectedCampaign?.id === c.id
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                      : "bg-slate-50 hover:bg-slate-100 border-transparent text-gray-600"
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedCampaign && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Stats & Settings */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Campaign Quick Status and Preview */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full">
                      {selectedCampaign.category}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-2.5">{selectedCampaign.title}</h2>
                  </div>

                  {/* Visibility Switch */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Visibilidad pública:</span>
                    <button
                      onClick={() => handleToggleActive(selectedCampaign.id)}
                      className="flex items-center"
                      title="Activar/Desactivar campaña"
                    >
                      {selectedCampaign.isActive ? (
                        <ToggleRight className="h-8 w-8 text-emerald-600 fill-emerald-500 cursor-pointer" />
                      ) : (
                        <ToggleLeft className="h-8 w-8 text-slate-300 cursor-pointer" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
                  <div className="bg-slate-50/50 p-4 rounded-xl border">
                    <p className="text-xs font-bold text-gray-400 uppercase">Recaudado</p>
                    <p className="text-xl font-extrabold text-emerald-700 mt-1">
                      {selectedCampaign.current.toLocaleString("es-ES")} €
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border">
                    <p className="text-xs font-bold text-gray-400 uppercase">Meta total</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {selectedCampaign.goal.toLocaleString("es-ES")} €
                    </p>
                  </div>
                  <div className="bg-slate-50/50 p-4 rounded-xl border">
                    <p className="text-xs font-bold text-gray-400 uppercase">Donantes</p>
                    <p className="text-xl font-bold text-gray-800 mt-1">
                      {selectedCampaign.donations?.length || 0} personas
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t">
                  <button
                    onClick={handleDeleteCampaign}
                    className="bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-700 text-xs font-bold px-4 py-2 rounded-xl transition-all"
                  >
                    Eliminar Campaña
                  </button>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={handleStartEdit}
                      className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
                    >
                      Editar Historia
                    </button>
                    <Link
                      to={`/campaigns/${selectedCampaign.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl transition-all"
                    >
                      Ver campaña pública
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Manage Payments Section (Pending Approval Info) */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Landmark className="h-5 w-5 text-emerald-600" />
                    Tus Canales de Cobro Personalizados
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Puedes añadir múltiples formas de pago para que la gente te transfiera de forma directa. Requieren aprobación de seguridad del administrador.
                  </p>
                </div>

                {/* Grid of current custom payment methods */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedCampaign.customPaymentMethods?.map((pm) => (
                    <div key={pm.id} className="border rounded-xl p-4 flex flex-col justify-between space-y-3 bg-slate-50/50">
                      <div className="flex items-start justify-between">
                        <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{pm.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          pm.approved
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                          {pm.approved ? "Aprobado (Visible)" : "Pendiente de aprobación"}
                        </span>
                      </div>
                      {renderDetailsLines(pm.details)}
                    </div>
                  ))}

                  {(!selectedCampaign.customPaymentMethods || selectedCampaign.customPaymentMethods.length === 0) && (
                    <div className="col-span-2 text-center py-6 text-sm text-gray-500 border border-dashed rounded-xl bg-slate-50/50">
                      No has añadido canales de cobro personalizados. Los donantes solo podrán pagar con tarjeta de crédito global.
                    </div>
                  )}
                </div>

                {/* Add new payment method form */}
                <form onSubmit={handleAddPayment} className="border-t pt-5 space-y-4">
                  <h4 className="text-sm font-bold text-gray-800">Añadir Nuevo Canal de Pago Directo</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo de Método</label>
                      <select
                        value={newMethodName}
                        onChange={(e) => setNewMethodName(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-2 text-xs outline-none bg-white font-semibold"
                      >
                        <option value="Pago Móvil">Pago Móvil (Venezuela)</option>
                        <option value="Transferencia Bancaria">Transferencia Bancaria (Venezuela)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Detalles / Cuenta / Teléfono</label>
                      <input
                        type="text"
                        required
                        placeholder={newMethodName === "Pago Móvil" ? "Banesco, 0414-1234567, V-12345678" : "Provincial, Cuenta Corriente: 0108-..."}
                        value={newMethodDetails}
                        onChange={(e) => setNewMethodDetails(e.target.value)}
                        className="w-full border rounded-lg px-2.5 py-2 text-xs outline-none font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-all"
                  >
                    {isSubmitting ? "Enviando..." : "Enviar a Aprobación"}
                  </button>
                </form>

              </div>
            </div>

            {/* Right Column: Recent Activity / Donor Messages */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card listing donations */}
              <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    Donaciones Recibidas ({selectedCampaign.donations?.length || 0})
                  </h3>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {selectedCampaign.donations?.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      Aún no hay donativos. Comparte el enlace de tu campaña para captar tus primeras donaciones.
                    </div>
                  ) : (
                    selectedCampaign.donations.map((d, idx) => (
                      <div key={idx} className="border-b last:border-0 pb-3 last:pb-0 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-gray-900">{d.name}</span>
                          <span className="text-gray-400 text-[10px]">
                            {new Date(d.date).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                        <p className="text-emerald-700 font-bold mb-1.5">Donó {d.amount.toLocaleString("es-ES")} €</p>
                        {d.comment && (
                          <p className="bg-slate-50 p-2 border rounded text-gray-500 italic">
                            "{d.comment}"
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Tips for campaign success */}
              <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-sm space-y-3">
                <h4 className="font-bold text-sm flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" />
                  Consejo para el Éxito
                </h4>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Las campañas que añaden una cuenta bancaria y un número Bizum aprobados reciben en promedio un <strong>40% más de aportaciones</strong> de donantes locales en España, ya que prefieren transferir directamente sin usar tarjeta.
                </p>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-extrabold text-base">Editar Historia de la Campaña</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-white/80 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título de la Campaña</label>
                <input
                  type="text"
                  required
                  placeholder="Título..."
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Categoría</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs outline-none bg-white font-semibold"
                  >
                    <option value="Salud">Salud</option>
                    <option value="Emergencias">Emergencias</option>
                    <option value="Educación">Educación</option>
                    <option value="Deportes">Deportes</option>
                    <option value="Mascotas">Mascotas</option>
                    <option value="Comunidad">Comunidad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Meta de Recaudación (€)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="5000"
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descripción de la Causa</label>
                <textarea
                  required
                  rows="5"
                  placeholder="Descripción..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                Guardar Cambios
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
