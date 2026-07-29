import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { mockDb } from "../mock";
import { useToast } from "../hooks/use-toast";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { Shield, Sparkles, CreditCard, ToggleLeft, ToggleRight, Check, X, AlertTriangle, ArrowUpRight, CheckCircle2, MessageSquare, TrendingUp, HelpCircle, Send } from "lucide-react";

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

  // Global Mandatory Payment Settings
  const [zelleEmail, setZelleEmail] = useState("zelle@donafacil.app");
  const [binanceId, setBinanceId] = useState("123456789");
  const [stripeKey, setStripeKey] = useState("pk_live_donafacil_123");
  const [zelleActive, setZelleActive] = useState(true);
  const [binanceActive, setBinanceActive] = useState(true);
  const [stripeActive, setStripeActive] = useState(true);

  // Admin Login States
  const [isAdminLogged, setIsAdminLogged] = useState(localStorage.getItem("df_admin_logged") === "true");
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  // Real-Time Chat Support States
  const [conversations, setConversations] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState("");
  const [adminChatInput, setAdminChatInput] = useState("");

  // Registered Users State
  const [usersList, setUsersList] = useState([]);

  // Create Campaign on Behalf of User States
  const [showCreateOnBehalfModal, setShowCreateOnBehalfModal] = useState(false);
  const [behalfSelectedUser, setBehalfSelectedUser] = useState("");
  const [behalfTitle, setBehalfTitle] = useState("");
  const [behalfCategory, setBehalfCategory] = useState("Salud");
  const [behalfGoal, setBehalfGoal] = useState("");
  const [behalfDescription, setBehalfDescription] = useState("");
  const [behalfImages, setBehalfImages] = useState([]);
  const [behalfCustomUrl, setBehalfCustomUrl] = useState("");
  const [behalfCedula, setBehalfCedula] = useState("");
  const [behalfSelfie, setBehalfSelfie] = useState("");
  const [behalfPrimaryIndex, setBehalfPrimaryIndex] = useState(0);
  const [isSubmittingBehalf, setIsSubmittingBehalf] = useState(false);

  // Admin Edit Campaign States
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [editCampaignId, setEditCampaignId] = useState("");
  const [editCampaignTitle, setEditCampaignTitle] = useState("");
  const [editCampaignDescription, setEditCampaignDescription] = useState("");
  const [editCampaignCategory, setEditCampaignCategory] = useState("Salud");
  const [editCampaignGoal, setEditCampaignGoal] = useState("");
  const [editCampaignImages, setEditCampaignImages] = useState([]);
  const [editCampaignCustomUrl, setEditCampaignCustomUrl] = useState("");
  const [editCampaignPrimaryIndex, setEditCampaignPrimaryIndex] = useState(0);
  const [isSavingEditAdmin, setIsSavingEditAdmin] = useState(false);

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

      const users = await mockDb.getUsers();
      setUsersList(users);
      
      const settings = await mockDb.getSiteSettings();
      if (settings) {
        setBaseRaised(settings.baseRaised.toString());
        setBaseCampaigns(settings.baseCampaigns.toString());
        setBaseDonations(settings.baseDonations.toString());
        setZelleEmail(settings.zelleEmail || "zelle@donafacil.app");
        setBinanceId(settings.binanceId || "123456789");
        setStripeKey(settings.stripeKey || "pk_live_donafacil_123");
        setZelleActive(settings.zelleActive !== undefined ? settings.zelleActive : true);
        setBinanceActive(settings.binanceActive !== undefined ? settings.binanceActive : true);
        setStripeActive(settings.stripeActive !== undefined ? settings.stripeActive : true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCampaignAdmin = async (id, title) => {
    if (window.confirm(`¿Estás absolutamente seguro de que quieres eliminar permanentemente la campaña "${title}"? Esta acción borrará todas sus donaciones y no se puede deshacer.`)) {
      try {
        await mockDb.deleteCampaign(id);
        await loadData();
        toast({
          title: "Campaña Eliminada",
          description: `Se eliminó con éxito la campaña "${title}".`,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteUserAdmin = async (email, name) => {
    if (window.confirm(`¿Estás absolutamente seguro de que quieres eliminar permanentemente la cuenta de "${name}" (${email})? Esta acción borrará su acceso del portal y no se puede deshacer.`)) {
      try {
        await mockDb.deleteUser(email);
        await loadData();
        toast({
          title: "Usuario Eliminado",
          description: `Se borró de forma definitiva la cuenta de "${name}".`,
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleResetUserPasswordAdmin = async (email, name) => {
    const newPass = window.prompt(`Introduce la nueva contraseña para el usuario "${name}" (${email}):`);
    if (newPass === null) return; // user cancelled
    if (newPass.trim().length < 4) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 4 caracteres.",
        variant: "destructive"
      });
      return;
    }

    try {
      await mockDb.resetUserPassword(email, newPass.trim());
      await loadData();
      toast({
        title: "Contraseña Restablecida",
        description: `Se actualizó la contraseña para "${name}" con éxito.`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const compressAndConvertToBase64Admin = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCreateOnBehalf = async (e) => {
    e.preventDefault();
    if (!behalfSelectedUser || !behalfTitle || !behalfDescription || !behalfGoal) {
      toast({
        title: "Campos vacíos",
        description: "Completa toda la información obligatoria.",
        variant: "destructive"
      });
      return;
    }

    if (behalfImages.length === 0) {
      toast({
        title: "Faltan fotos",
        description: "Agrega al menos una foto de campaña.",
        variant: "destructive"
      });
      return;
    }

    if (!behalfCedula || !behalfSelfie) {
      toast({
        title: "Falta Verificación",
        description: "Es obligatorio subir la cédula y la selfie del usuario para seguridad.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingBehalf(true);

    try {
      const selectedUserData = usersList.find(u => u.email === behalfSelectedUser);
      if (!selectedUserData) throw new Error("User not found");

      // Reorder images
      const reordered = [...behalfImages];
      if (behalfPrimaryIndex > 0 && behalfPrimaryIndex < reordered.length) {
        const pImg = reordered[behalfPrimaryIndex];
        reordered.splice(behalfPrimaryIndex, 1);
        reordered.unshift(pImg);
      }

      await mockDb.createCampaign({
        title: behalfTitle,
        category: behalfCategory,
        goal: parseFloat(behalfGoal),
        description: behalfDescription,
        images: reordered,
        primaryImage: reordered[0],
        cedulaImage: behalfCedula,
        selfieImage: behalfSelfie,
        organizerName: selectedUserData.name,
        organizerEmail: selectedUserData.email,
        organizerPhone: selectedUserData.phone || "N/A"
      });

      setIsSubmittingBehalf(false);
      setShowCreateOnBehalfModal(false);
      
      // Clean form
      setBehalfTitle("");
      setBehalfDescription("");
      setBehalfGoal("");
      setBehalfImages([]);
      setBehalfCedula("");
      setBehalfSelfie("");
      setBehalfPrimaryIndex(0);

      await loadData();

      toast({
        title: "¡Campaña Creada!",
        description: `Se registró con éxito la campaña bajo la cuenta de "${selectedUserData.name}".`,
      });
    } catch (err) {
      console.error(err);
      setIsSubmittingBehalf(false);
      toast({
        title: "Error al crear",
        description: "No se pudo registrar la campaña en el servidor.",
        variant: "destructive"
      });
    }
  };

  const handleStartEditAdmin = (c) => {
    setEditCampaignId(c.id);
    setEditCampaignTitle(c.title);
    setEditCampaignDescription(c.description);
    setEditCampaignCategory(c.category);
    setEditCampaignGoal(c.goal.toString());
    setEditCampaignImages(c.images || []);
    setEditCampaignPrimaryIndex(0);
    setShowEditCampaignModal(true);
  };

  const handleSaveEditAdmin = async (e) => {
    e.preventDefault();
    if (!editCampaignTitle || !editCampaignDescription || !editCampaignGoal) {
      toast({
        title: "Campos vacíos",
        description: "Rellena toda la información obligatoria.",
        variant: "destructive"
      });
      return;
    }

    if (editCampaignImages.length === 0) {
      toast({
        title: "Sin Fotos",
        description: "La campaña debe tener al menos 1 foto.",
        variant: "destructive"
      });
      return;
    }

    setIsSavingEditAdmin(true);
    try {
      const reordered = [...editCampaignImages];
      if (editCampaignPrimaryIndex > 0 && editCampaignPrimaryIndex < reordered.length) {
        const pImg = reordered[editCampaignPrimaryIndex];
        reordered.splice(editCampaignPrimaryIndex, 1);
        reordered.unshift(pImg);
      }

      // Update in Firestore
      const campaignRef = doc(db, "campaigns", editCampaignId);
      await updateDoc(campaignRef, {
        title: editCampaignTitle,
        description: editCampaignDescription,
        category: editCampaignCategory,
        goal: parseFloat(editCampaignGoal),
        images: reordered,
        primaryImage: reordered[0]
      });

      setIsSavingEditAdmin(false);
      setShowEditCampaignModal(false);
      await loadData();
      toast({
        title: "Campaña Editada",
        description: "Los cambios y las fotos han sido guardados con éxito por el administrador.",
      });
    } catch (err) {
      console.error(err);
      setIsSavingEditAdmin(false);
      toast({
        title: "Error al editar",
        description: "No se pudieron registrar tus cambios.",
        variant: "destructive"
      });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const success = await mockDb.updateSiteSettings({
        baseRaised,
        baseCampaigns,
        baseDonations,
        zelleEmail,
        binanceId,
        stripeKey,
        zelleActive,
        binanceActive,
        stripeActive
      });
      setIsSavingSettings(false);
      if (success) {
        toast({
          title: "Configuración Guardada",
          description: "Los valores base y canales de cobro obligatorios han sido actualizados.",
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

  useEffect(() => {
    if (!isAdminLogged) return;

    // Real-time listener for support conversations
    const unsubscribe = onSnapshot(collection(db, "conversations"), (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      // Sort by last message date descending
      list.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      setConversations(list);
    });

    return () => unsubscribe();
  }, [isAdminLogged]);

  const handleSendAdminMessage = async (e) => {
    e.preventDefault();
    if (!adminChatInput.trim() || !selectedChatId) return;

    const msgPayload = {
      sender: "admin",
      text: adminChatInput.trim(),
      timestamp: new Date().toISOString(),
      name: "Soporte (Admin)"
    };

    setAdminChatInput("");

    try {
      const docRef = doc(db, "conversations", selectedChatId);
      await updateDoc(docRef, {
        messages: arrayUnion(msgPayload),
        lastMessageAt: new Date().toISOString(),
        unreadByAdmin: false,
        unreadByUser: true
      });
    } catch (err) {
      console.error("Error sending admin chat reply:", err);
    }
  };

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
          title: updated.stripeEnabled ? "Tarjeta de Crédito Habilitada" : "Tarjeta de Crédito Deshabilitada",
          description: `Pasarela de Tarjeta de Crédito para "${title}" ahora está ${updated.stripeEnabled ? "ENCENDIDA" : "APAGADA"}.`,
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
          <button
            onClick={() => setActiveTab("soporte")}
            className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === "soporte" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Soporte por Chat
          </button>
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 shrink-0 flex items-center gap-1.5 ${
              activeTab === "usuarios" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            Gestión de Usuarios
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
                    <th className="p-4 text-center">Tarjeta de Crédito (Global)</th>
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
                          <div className="flex items-center justify-end gap-3 flex-wrap">
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
                            <button
                              onClick={() => handleStartEditAdmin(c)}
                              className="text-xs font-bold text-slate-100 hover:text-white bg-slate-800 hover:bg-slate-900 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteCampaignAdmin(c.id, c.title)}
                              className="text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-2.5 py-1.5 rounded-lg border border-rose-100 transition-all"
                            >
                              Borrar Causa
                            </button>
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Column */}
            <div className="lg:col-span-8 bg-white border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 text-left">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5 pb-2 border-b">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Configurar Baselines y Canales Obligatorios del Portal
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Gestiona los valores del contador de la portada y los datos de cobro oficiales (Zelle, Stripe, Binance) de la plataforma.
                </p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-6">
                
                {/* Section 1: Baselines */}
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 border-l-4 border-emerald-500 pl-2">
                    1. Estadísticas de Portada (Baselines)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Recaudado Base Inicial (€)</label>
                      <input
                        type="number"
                        required
                        value={baseRaised}
                        onChange={(e) => setBaseRaised(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none mt-1 focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Campañas Activas Base</label>
                      <input
                        type="number"
                        required
                        value={baseCampaigns}
                        onChange={(e) => setBaseCampaigns(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none mt-1 focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase">Donaciones Base</label>
                      <input
                        type="number"
                        required
                        value={baseDonations}
                        onChange={(e) => setBaseDonations(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold outline-none mt-1 focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Global Mandatory Payment Channels */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-extrabold text-slate-800 border-l-4 border-blue-500 pl-2">
                    2. Canales de Cobro Obligatorios Globales (Zelle, Stripe, Binance)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Introduce los datos oficiales de tu portal. Aparecerán en TODAS las campañas activas para captar donaciones globales.
                  </p>

                  <div className="space-y-4">
                    {/* Zelle */}
                    <div className="border p-4 rounded-xl bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-blue-700 uppercase">Zelle Global del Portal</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400">Habilitar</span>
                          <input 
                            type="checkbox" 
                            checked={zelleActive} 
                            onChange={(e) => setZelleActive(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 rounded"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Ej: correo@zelle.com"
                        value={zelleEmail}
                        onChange={(e) => setZelleEmail(e.target.value)}
                        className="w-full border bg-white rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    {/* Stripe Key */}
                    <div className="border p-4 rounded-xl bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-emerald-700 uppercase">Clave Pública de Tarjeta de Crédito</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400">Habilitar</span>
                          <input 
                            type="checkbox" 
                            checked={stripeActive} 
                            onChange={(e) => setStripeActive(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 rounded"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Ej: pk_live_..."
                        value={stripeKey}
                        onChange={(e) => setStripeKey(e.target.value)}
                        className="w-full border bg-white rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      />
                    </div>

                    {/* Binance ID */}
                    <div className="border p-4 rounded-xl bg-slate-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-yellow-700 uppercase">Binance Pay ID</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400">Habilitar</span>
                          <input 
                            type="checkbox" 
                            checked={binanceActive} 
                            onChange={(e) => setBinanceActive(e.target.checked)}
                            className="h-4 w-4 text-emerald-600 rounded"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Ej: 12345678"
                        value={binanceId}
                        onChange={(e) => setBinanceId(e.target.value)}
                        className="w-full border bg-white rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {isSavingSettings ? "Guardando Configuración..." : "Guardar Cambios de Configuración"}
                </button>
              </form>
            </div>

            {/* Helper Tips Column */}
            <div className="lg:col-span-4 bg-emerald-600 text-white p-6 rounded-2xl shadow-sm space-y-4 text-left">
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Control de Canales
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Tanto **Zelle, Tarjeta de Crédito como Binance** son procesados de forma centralizada bajo las cuentas del portal (editadas a la izquierda). 
              </p>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Los solicitantes solo pueden ingresar sus datos de **Pago Móvil** y **Transferencia Bancaria** locales en Venezuela, los cuales se mostrarán únicamente en su respectiva solicitud luego de que tú los audites y apruebes.
              </p>
            </div>
          </div>
        )}

        {activeTab === "soporte" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            
            {/* Conversations list column */}
            <div className="md:col-span-4 bg-white border rounded-2xl p-5 shadow-sm space-y-4 text-left">
              <h3 className="font-extrabold text-slate-800 text-sm pb-3 border-b">
                Chats Activos ({conversations.length})
              </h3>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {conversations.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-10">No hay chats de soporte activos en este momento.</p>
                ) : (
                  conversations.map((chat) => {
                    const lastMsg = chat.messages?.[chat.messages.length - 1];
                    const isSelected = selectedChatId === chat.id;
                    return (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedChatId(chat.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 ${
                          isSelected 
                            ? "bg-emerald-50 border-emerald-300 shadow-sm" 
                            : "bg-slate-50/50 hover:bg-slate-100 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs text-gray-900">{chat.userName || "Invitado"}</span>
                          {chat.unreadByAdmin && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate w-full">
                          {chat.userEmail}
                        </p>
                        {lastMsg && (
                          <p className="text-[11px] text-slate-700 italic truncate w-full mt-1">
                            "{lastMsg.text}"
                          </p>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat conversation details box */}
            <div className="md:col-span-8 bg-white border rounded-2xl p-5 shadow-sm h-[560px] flex flex-col justify-between text-left">
              {selectedChatId ? (
                <>
                  {/* Header info */}
                  {(() => {
                    const activeChat = conversations.find(c => c.id === selectedChatId);
                    if (!activeChat) return null;
                    return (
                      <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm">{activeChat.userName}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {activeChat.userEmail} • Cel: {activeChat.userPhone || "N/A"}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full uppercase">
                          Soporte Activo
                        </span>
                      </div>
                    );
                  })()}

                  {/* Messages Log */}
                  <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1 bg-slate-50/50 p-4 rounded-xl border">
                    {(() => {
                      const activeChat = conversations.find(c => c.id === selectedChatId);
                      if (!activeChat || !activeChat.messages) return null;
                      return activeChat.messages.map((m, idx) => {
                        const isAdmin = m.sender === "admin";
                        return (
                          <div 
                            key={idx} 
                            className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                          >
                            <span className="text-[9px] text-gray-400 font-semibold mb-0.5">
                              {isAdmin ? "Tú (Soporte Admin)" : m.name}
                            </span>
                            <div 
                              className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                                isAdmin 
                                  ? "bg-emerald-600 text-white rounded-tr-none" 
                                  : "bg-white text-slate-800 rounded-tl-none border"
                              }`}
                            >
                              {m.text}
                            </div>
                            <span className="text-[8px] text-gray-400 mt-0.5">
                              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Input response form */}
                  <form onSubmit={handleSendAdminMessage} className="flex gap-2 shrink-0 border-t pt-3">
                    <input
                      type="text"
                      placeholder="Escribe una respuesta para el usuario..."
                      value={adminChatInput}
                      onChange={(e) => setAdminChatInput(e.target.value)}
                      className="flex-1 text-xs border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1"
                    >
                      <Send className="h-4 w-4" /> Responder
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                  <MessageSquare className="h-10 w-10 text-slate-300" />
                  <p className="text-xs text-gray-400 max-w-sm">
                    Selecciona uno de los chats de la izquierda para responder en tiempo real a tus creadores o donantes directamente desde esta consola de soporte.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === "usuarios" && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h2 className="font-extrabold text-gray-900 text-base">Cuentas Registradas en el Portal</h2>
                <span className="text-xs text-gray-400 font-semibold">Gestión de usuarios en tiempo real</span>
              </div>
              <button
                onClick={() => {
                  if (usersList.length === 0) {
                    toast({
                      title: "Sin usuarios",
                      description: "No hay usuarios registrados a quienes crearles campañas.",
                      variant: "destructive"
                    });
                    return;
                  }
                  setBehalfSelectedUser(usersList[0].email);
                  setShowCreateOnBehalfModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm"
              >
                + Crear Campaña para Usuario
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Celular</th>
                    <th className="p-4">Clave Actual</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-left">
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-gray-400">
                        No hay usuarios registrados en este momento.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((u, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-gray-900">{u.name}</div>
                          <div className="text-xs text-gray-400">{u.email}</div>
                        </td>
                        <td className="p-4 font-semibold text-gray-700">{u.phone}</td>
                        <td className="p-4 font-mono text-xs text-slate-500">{u.password || "N/A"}</td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => handleResetUserPasswordAdmin(u.email, u.name)}
                              className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-all"
                            >
                              Restablecer Clave
                            </button>
                            <button
                              onClick={() => handleDeleteUserAdmin(u.email, u.name)}
                              className="text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-3 py-1.5 rounded-lg border border-rose-100 transition-all"
                            >
                              Borrar Cuenta
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
                      <a href={selectedCampaignForVerify.cedulaImage} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-zoom-in" title="Haga clic para ver en tamaño real">
                        <img 
                          src={selectedCampaignForVerify.cedulaImage} 
                          alt="Cédula" 
                          className="object-cover w-full h-full"
                        />
                      </a>
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
                      <a href={selectedCampaignForVerify.selfieImage} target="_blank" rel="noopener noreferrer" className="w-full h-full block cursor-zoom-in" title="Haga clic para ver en tamaño real">
                        <img 
                          src={selectedCampaignForVerify.selfieImage} 
                          alt="Selfie" 
                          className="object-cover w-full h-full"
                        />
                      </a>
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

          </div>
        </div>
      )}

      {/* Modal para Crear Campaña en Nombre de Usuario */}
      {showCreateOnBehalfModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] overflow-y-auto p-4 flex justify-center items-start text-left font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border p-6 sm:p-8 my-6 space-y-5 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Crear Campaña en Nombre de Usuario</h3>
                <p className="text-[10px] text-gray-400">Registra una causa directa vinculada a la cuenta de un usuario</p>
              </div>
              <button
                onClick={() => setShowCreateOnBehalfModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateOnBehalf} className="space-y-4">
              
              {/* User Selector */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Seleccionar Cuenta de Usuario</label>
                <select
                  value={behalfSelectedUser}
                  onChange={(e) => setBehalfSelectedUser(e.target.value)}
                  className="w-full border rounded-xl px-3 py-2 text-xs outline-none bg-white font-semibold mt-1"
                >
                  {usersList.map(u => (
                    <option key={u.email} value={u.email}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Título de la Campaña</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Apoyo médico para..."
                  value={behalfTitle}
                  onChange={(e) => setBehalfTitle(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs font-semibold outline-none mt-1 focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Category and Goal */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Categoría</label>
                  <select
                    value={behalfCategory}
                    onChange={(e) => setBehalfCategory(e.target.value)}
                    className="w-full border rounded-xl px-2.5 py-2 text-xs outline-none bg-white font-semibold mt-1"
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
                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Meta de Recaudación (€)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="5000"
                    value={behalfGoal}
                    onChange={(e) => setBehalfGoal(e.target.value)}
                    className="w-full border rounded-xl px-3.5 py-2 text-xs font-bold outline-none mt-1 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Descripción de la Historia</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Explica detalladamente la causa..."
                  value={behalfDescription}
                  onChange={(e) => setBehalfDescription(e.target.value)}
                  className="w-full border rounded-xl px-3.5 py-2 text-xs outline-none mt-1 focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Photos upload area with limit 3 */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-400 uppercase">Fotos de Campaña ({behalfImages.length} de máx 3)</label>
                
                {behalfImages.length < 3 && (
                  <div className="border border-dashed p-3 rounded-lg bg-slate-50 text-center space-y-1.5">
                    <label className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all inline-block">
                      Añadir Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files[0];
                          if (f) {
                            const b64 = await compressAndConvertToBase64Admin(f);
                            setBehalfImages([...behalfImages, b64]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[9px] text-gray-400 block">o introduce URL de prueba:</span>
                    <div className="flex gap-1 max-w-sm mx-auto">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={behalfCustomUrl}
                        onChange={(e) => setBehalfCustomUrl(e.target.value)}
                        className="w-full text-[10px] border px-2 py-1 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (behalfCustomUrl.trim()) {
                            setBehalfImages([...behalfImages, behalfCustomUrl.trim()]);
                            setBehalfCustomUrl("");
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] px-2.5 rounded"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}

                {/* Previews */}
                {behalfImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {behalfImages.map((img, idx) => {
                      const isPrimary = behalfPrimaryIndex === idx;
                      return (
                        <div key={idx} className={`relative aspect-video rounded-lg overflow-hidden border bg-slate-100 flex flex-col justify-between ${
                          isPrimary ? "border-amber-400 ring-1 ring-amber-400/30" : "border-slate-200"
                        }`}>
                          <img src={img} alt="Preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => {
                              setBehalfImages(behalfImages.filter((_, i) => i !== idx));
                              if (behalfPrimaryIndex === idx) setBehalfPrimaryIndex(0);
                            }}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full shadow"
                          >
                            ✕
                          </button>
                          {isPrimary ? (
                            <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[8px] px-1 rounded font-bold">
                              ★
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setBehalfPrimaryIndex(idx)}
                              className="absolute bottom-1 left-1 bg-black/60 text-white text-[7px] px-1 rounded"
                            >
                              Set ★
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Verification Cédula and Selfie (Mandatory) */}
              <div className="border-t pt-3 space-y-3">
                <label className="block text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  Verificación de Identidad (Obligatoria)
                </label>

                <div className="grid grid-cols-2 gap-3">
                  {/* Cedula */}
                  <div className="border p-3 rounded-lg bg-slate-50 text-center space-y-2">
                    <span className="text-[9px] font-bold text-gray-400 block">1. Cédula / ID</span>
                    {behalfCedula ? (
                      <div className="relative aspect-video rounded overflow-hidden border">
                        <img src={behalfCedula} alt="Cédula" className="object-cover w-full h-full" />
                        <button type="button" onClick={() => setBehalfCedula("")} className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full">✕</button>
                      </div>
                    ) : (
                      <label className="bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-all inline-block">
                        Subir Cédula
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files[0];
                            if (f) {
                              const b64 = await compressAndConvertToBase64Admin(f);
                              setBehalfCedula(b64);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Selfie */}
                  <div className="border p-3 rounded-lg bg-slate-50 text-center space-y-2">
                    <span className="text-[9px] font-bold text-gray-400 block">2. Selfie</span>
                    {behalfSelfie ? (
                      <div className="relative aspect-video rounded overflow-hidden border">
                        <img src={behalfSelfie} alt="Selfie" className="object-cover w-full h-full" />
                        <button type="button" onClick={() => setBehalfSelfie("")} className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full">✕</button>
                      </div>
                    ) : (
                      <label className="bg-slate-800 hover:bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded cursor-pointer transition-all inline-block">
                        Subir Selfie
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const f = e.target.files[0];
                            if (f) {
                              const b64 = await compressAndConvertToBase64Admin(f);
                              setBehalfSelfie(b64);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmittingBehalf}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {isSubmittingBehalf ? "Registrando en Firestore..." : "Crear y Lanzar Campaña"}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* Modal para Editar Campaña por el Administrador */}
      {showEditCampaignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] overflow-y-auto p-4 flex justify-center items-start text-left font-sans">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border p-6 sm:p-8 my-6 space-y-5 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-extrabold text-base">Editar Campaña (Administrador)</h3>
              <button
                onClick={() => setShowEditCampaignModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título de la Campaña</label>
                <input
                  type="text"
                  required
                  placeholder="Título..."
                  value={editCampaignTitle}
                  onChange={(e) => setEditCampaignTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Categoría</label>
                  <select
                    value={editCampaignCategory}
                    onChange={(e) => setEditCampaignCategory(e.target.value)}
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
                    value={editCampaignGoal}
                    onChange={(e) => setEditCampaignGoal(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Descripción de la Causa</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Descripción..."
                  value={editCampaignDescription}
                  onChange={(e) => setEditCampaignDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Photos management (limit 3) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Fotos de la Campaña ({editCampaignImages.length} de máx 3)
                </label>

                {editCampaignImages.length < 3 && (
                  <div className="border border-dashed p-3 rounded-lg bg-slate-50 text-center space-y-1.5">
                    <label className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all inline-block">
                      Añadir Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const f = e.target.files[0];
                          if (f) {
                            const b64 = await compressAndConvertToBase64Admin(f);
                            setEditCampaignImages([...editCampaignImages, b64]);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[9px] text-gray-400 block">o introduce URL de prueba:</span>
                    <div className="flex gap-1 max-w-sm mx-auto">
                      <input
                        type="text"
                        placeholder="https://..."
                        value={editCampaignCustomUrl}
                        onChange={(e) => setEditCampaignCustomUrl(e.target.value)}
                        className="w-full text-[10px] border px-2 py-1 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (editCampaignCustomUrl.trim()) {
                            setEditCampaignImages([...editCampaignImages, editCampaignCustomUrl.trim()]);
                            setEditCampaignCustomUrl("");
                          }
                        }}
                        className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] px-2.5 rounded"
                      >
                        OK
                      </button>
                    </div>
                  </div>
                )}

                {/* Previews */}
                {editCampaignImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {editCampaignImages.map((img, idx) => {
                      const isPrimary = editCampaignPrimaryIndex === idx;
                      return (
                        <div key={idx} className={`relative aspect-video rounded-lg overflow-hidden border bg-slate-100 flex flex-col justify-between ${
                          isPrimary ? "border-amber-400 ring-1 ring-amber-400/30" : "border-slate-200"
                        }`}>
                          <img src={img} alt="Preview" className="object-cover w-full h-full" />
                          <button
                            type="button"
                            onClick={() => {
                              setEditCampaignImages(editCampaignImages.filter((_, i) => i !== idx));
                              if (editCampaignPrimaryIndex === idx) setEditCampaignPrimaryIndex(0);
                            }}
                            className="absolute top-1 right-1 bg-rose-600 text-white p-0.5 rounded-full shadow"
                          >
                            ✕
                          </button>
                          {isPrimary ? (
                            <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[8px] px-1 rounded font-bold">
                              ★
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEditCampaignPrimaryIndex(idx)}
                              className="absolute bottom-1 left-1 bg-black/60 text-white text-[7px] px-1 rounded"
                            >
                              Set ★
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingEditAdmin}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                {isSavingEditAdmin ? "Guardando..." : "Guardar Cambios"}
              </button>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
