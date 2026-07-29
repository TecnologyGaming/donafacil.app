import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { mockDb } from "../mock";
import { useToast } from "../hooks/use-toast";
import { Heart, Share2, Shield, Calendar, Users, CheckCircle2, AlertCircle, CreditCard, ChevronLeft, ChevronRight, MessageSquare, Plus } from "lucide-react";

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
      className="flex items-center justify-between gap-2 bg-white hover:bg-slate-50 border px-3 py-2 rounded-lg cursor-pointer transition-all group mt-2"
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
  // Split by commas, slashes, semicolons, newlines, AND dashes (with surrounding spaces)
  const lines = details.split(/[,/;\n\r]|\s+-\s+/).map(l => l.trim()).filter(Boolean);
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

export default function CampaignDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  
  const [campaign, setCampaign] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  
  // Lightbox Modal state for full screen gallery
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState("50");
  const [donorName, setDonorName] = useState("");
  const [donorComment, setDonorComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  
  // Custom manual payment report
  const [showManualReportModal, setShowManualReportModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [manualAmount, setManualAmount] = useState("20");
  const [manualName, setManualName] = useState("");
  const [manualReference, setManualReference] = useState("");

  const [siteSettings, setSiteSettings] = useState({
    zelleEmail: "zelle@donafacil.app",
    binanceId: "123456789",
    stripeKey: "pk_live_donafacil_123",
    zelleActive: true,
    binanceActive: true,
    stripeActive: true
  });

  const refreshCampaign = async () => {
    setIsLoading(true);
    try {
      const c = await mockDb.getCampaignById(id);
      if (c) {
        const donations = await mockDb.getCampaignDonations(id);
        setCampaign({ ...c, donations });
      } else {
        setCampaign(null);
      }
      
      const settings = await mockDb.getSiteSettings();
      if (settings) {
        setSiteSettings(settings);
      }
    } catch (e) {
      console.error("Error refreshing campaign:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshCampaign();
    window.scrollTo(0, 0);

    const handleRoleChange = () => {
      refreshCampaign();
    };
    window.addEventListener("df_role_changed", handleRoleChange);
    return () => window.removeEventListener("df_role_changed", handleRoleChange);
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-semibold text-sm">Cargando causa en tiempo real...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Campaña no encontrada</h2>
        <p className="text-gray-500 mt-2">La campaña que buscas no existe o está inactiva.</p>
        <Link to="/" className="mt-4 inline-block text-emerald-600 hover:text-emerald-700 font-semibold">
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const percent = Math.min(100, Math.round((campaign.current / campaign.goal) * 100)) || 0;
  const approvedCustomMethods = campaign.customPaymentMethods?.filter(m => m.approved) || [];

  // Handle Stripe Mock Payment
  const handleStripeDonate = async (e) => {
    e.preventDefault();
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "Por favor, ingresa un monto válido de donación.",
        variant: "destructive"
      });
      return;
    }

    if (!cardNumber || cardNumber.length < 16) {
      toast({
        title: "Tarjeta inválida",
        description: "Por favor, introduce una tarjeta de crédito válida de prueba (16 dígitos).",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await mockDb.addDonation(campaign.id, {
        name: donorName.trim() || "Donante Anónimo",
        amount: parseFloat(donationAmount),
        comment: donorComment.trim(),
        paymentMethod: "Tarjeta de Crédito (Stripe)"
      });
      
      setIsSubmitting(false);
      setShowDonateModal(false);
      setDonorName("");
      setDonorComment("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvc("");
      await refreshCampaign();

      toast({
        title: "¡Donación Recibida!",
        description: `Muchas gracias por tu donativo de ${parseFloat(donationAmount).toLocaleString("es-ES")} € con tarjeta.`,
      });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      toast({
        title: "Error de pago",
        description: "Hubo un problema procesando tu donación simulada.",
        variant: "destructive"
      });
    }
  };

  // Handle reporting custom payment
  const handleManualReport = async (e) => {
    e.preventDefault();
    if (!manualAmount || parseFloat(manualAmount) <= 0) {
      toast({
        title: "Monto inválido",
        description: "Ingresa el monto transferido.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await mockDb.addDonation(campaign.id, {
        name: manualName.trim() || "Donante Anónimo",
        amount: parseFloat(manualAmount),
        comment: `[Donado vía ${selectedMethod.name}] - Ref: ${manualReference || "N/A"}. ${donorComment.trim()}`,
        paymentMethod: selectedMethod.name,
        reference: manualReference
      });

      setIsSubmitting(false);
      setShowManualReportModal(false);
      setManualName("");
      setManualAmount("20");
      setManualReference("");
      setDonorComment("");
      await refreshCampaign();

      toast({
        title: "¡Reporte de Donación Registrado!",
        description: `Registramos tu aporte manual de ${parseFloat(manualAmount).toLocaleString("es-ES")} € vía ${selectedMethod.name}.`,
      });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
      toast({
        title: "Error al registrar",
        description: "No se pudo registrar tu reporte de transferencia.",
        variant: "destructive"
      });
    }
  };

  const shareCampaign = () => {
    const shareUrl = `${window.location.origin}/share/campaign/${campaign.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Enlace de campaña copiado",
      description: "El enlace para compartir en WhatsApp o redes ha sido copiado.",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8 text-left">
      <div className="container mx-auto px-4 sm:px-6">
        
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-emerald-700 transition-colors mb-6">
          <ChevronLeft className="h-4 w-4" />
          Volver a campañas
        </Link>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight mb-4">
          {campaign.title}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Images, Organizer, Description */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Image Gallery */}
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm p-3">
              <div 
                onClick={() => setIsLightboxOpen(true)}
                className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 cursor-zoom-in group/gallery"
                title="Haga clic para ver fotos en grande"
              >
                <img
                  src={campaign.images[activeImageIdx] || "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80"}
                  alt={campaign.title}
                  className="object-cover w-full h-full transition-all duration-300 group-hover/gallery:scale-102"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800&q=80";
                  }}
                />
                
                {/* Expand overlay icon */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/gallery:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-black/70 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg">
                    🔍 Ampliar Imágenes
                  </span>
                </div>
                
                {campaign.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx(prev => (prev === 0 ? campaign.images.length - 1 : prev - 1));
                      }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white z-10"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveImageIdx(prev => (prev === campaign.images.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white z-10"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {campaign.images.length > 1 && (
                <div className="flex gap-2.5 mt-3 px-1">
                  {campaign.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIdx(idx)}
                      className={`relative w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        activeImageIdx === idx ? "border-emerald-600 scale-102" : "border-transparent hover:border-slate-300"
                      }`}
                    >
                      <img 
                        src={img} 
                        alt="Miniatura" 
                        className="object-cover w-full h-full" 
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=150&q=80";
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Organizer details */}
            <div className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                  {campaign.organizer.name[0]}
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400">Organizador(a)</p>
                  <p className="font-bold text-gray-900">{campaign.organizer.name}</p>
                  <p className="text-xs text-gray-500">{campaign.organizer.email}</p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Identidad Verificada</span>
              </div>
            </div>

            {/* Campaign Description */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-4 border-b">
                <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  {campaign.category}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Creado {new Date(campaign.createdAt).toLocaleDateString("es-ES")}
                </span>
              </div>

              <div className="prose prose-slate max-w-none text-gray-700 leading-relaxed text-base whitespace-pre-line">
                {campaign.description}
              </div>
            </div>

            {/* Custom Payment Methods for direct/personal support */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-5">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-3">
                Métodos de Pago Personalizados del Organizador
              </h2>
              <p className="text-sm text-gray-500">
                El organizador ha configurado los siguientes canales directos para recibir apoyo. Al usarlos, por favor envía un reporte abajo para agregarlo a la barra de progreso de la campaña.
              </p>

              {approvedCustomMethods.length === 0 ? (
                <div className="bg-slate-50 border p-4 rounded-xl text-center text-sm text-gray-500">
                  No se han registrado métodos de pago manuales o están pendientes de aprobación por el administrador.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {approvedCustomMethods.map((method) => (
                    <div key={method.id} className="border border-slate-200 p-4 rounded-xl flex flex-col justify-between space-y-3 bg-slate-50/50">
                      <div>
                        <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider bg-emerald-100/50 px-2.5 py-1 rounded-full">
                          {method.name}
                        </span>
                        {renderDetailsLines(method.details)}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMethod(method);
                          setShowManualReportModal(true);
                        }}
                        className="text-xs font-bold text-center text-white bg-slate-800 hover:bg-slate-950 py-2 px-3 rounded-lg transition-all"
                      >
                        Informar Donación por {method.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Donation comments list */}
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              <h3 className="font-extrabold text-lg text-gray-900 border-b pb-3 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                Mensajes de Apoyo ({campaign.donations?.filter(d => d.comment).length || 0})
              </h3>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {campaign.donations?.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">¡Sé el primero en dejar un mensaje de aliento!</p>
                ) : (
                  campaign.donations.map((d, idx) => (
                    <div key={idx} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-gray-900">{d.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(d.date).toLocaleDateString("es-ES")}
                        </span>
                      </div>
                      <div className="text-emerald-700 font-semibold text-xs mb-1.5">
                        Donó {d.amount.toLocaleString("es-ES")} €
                      </div>
                      {d.comment && (
                        <p className="text-sm text-gray-600 bg-slate-50 border p-3 rounded-xl italic">
                          "{d.comment}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Progress Card */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-6">
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-md space-y-6">
              
              {/* Progress visual */}
              <div className="space-y-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">
                    {campaign.current.toLocaleString("es-ES")} €
                  </span>
                  <span className="text-sm text-gray-500">
                    de {campaign.goal.toLocaleString("es-ES")} €
                  </span>
                </div>

                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs text-gray-500 font-semibold">
                  <span>{percent}% Completado</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {campaign.donations?.length || 0} donantes
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
                  Canales Oficiales del Portal
                </p>

                {/* 1. Zelle (Mandatory Global) */}
                {siteSettings.zelleActive ? (
                  <button
                    onClick={() => {
                      setSelectedMethod({ name: "Zelle", details: siteSettings.zelleEmail });
                      setShowManualReportModal(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 rounded-xl shadow transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                    Zelle: {siteSettings.zelleEmail} (Primero)
                  </button>
                ) : (
                  <div className="text-[10px] text-center text-slate-400 py-1 bg-slate-50 border rounded-lg border-dashed">
                    Zelle desactivado por administración
                  </div>
                )}

                {/* 2. Binance Pay (Mandatory Global) */}
                {siteSettings.binanceActive ? (
                  <button
                    onClick={() => {
                      setSelectedMethod({ name: "Binance Pay", details: `Binance Pay ID: ${siteSettings.binanceId}` });
                      setShowManualReportModal(true);
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-3 rounded-xl shadow transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                    Binance Pay: ID {siteSettings.binanceId} (Segundo)
                  </button>
                ) : (
                  <div className="text-[10px] text-center text-slate-400 py-1 bg-slate-50 border rounded-lg border-dashed">
                    Binance Pay desactivado por administración
                  </div>
                )}

                {/* 3. Tarjeta de Crédito (Mandatory Global - Third) */}
                {siteSettings.stripeActive && campaign.stripeEnabled ? (
                  <button
                    onClick={() => setShowDonateModal(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Tarjeta de Crédito (Stripe - Tercero)
                  </button>
                ) : (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-2 text-center text-[10px] text-amber-850">
                    Tarjeta de Crédito desactivada
                  </div>
                )}

                {/* Section 2: Creator specific channels */}
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-4 text-center">
                  Canales del Solicitante (Verificados)
                </p>

                {approvedCustomMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => {
                      setSelectedMethod(method);
                      setShowManualReportModal(true);
                    }}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs py-3 rounded-xl shadow transition-all flex items-center justify-center gap-1"
                  >
                    Donar vía {method.name}
                  </button>
                ))}

                {approvedCustomMethods.length === 0 && (
                  <p className="text-[10px] text-center text-gray-400 italic">
                    Sin canales directos de pago móvil o transferencia aprobados.
                  </p>
                )}

                <button
                  onClick={shareCampaign}
                  className="w-full border border-slate-200 hover:border-slate-300 bg-white text-gray-700 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm mt-3"
                >
                  <Share2 className="h-4 w-4" />
                  Compartir Campaña
                </button>
              </div>

              {/* Security Tag */}
              <div className="flex items-start gap-2.5 text-xs text-gray-500 border-t pt-4">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Garantía de donación de donafacil.app:</strong> Tus fondos están protegidos. El organizador ha verificado su cuenta bancaria o métodos de contacto.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Stripe Payment Modal */}
      {showDonateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border">
            
            {/* Header */}
            <div className="bg-emerald-600 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <span className="font-extrabold text-lg">Donar con Tarjeta de Crédito</span>
              </div>
              <button
                onClick={() => setShowDonateModal(false)}
                className="text-white/80 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleStripeDonate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Monto de Donación (€)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-lg font-bold text-gray-400">€</span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 font-bold text-lg text-gray-900 outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre del Donante (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez (dejar en blanco para Anónimo)"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mensaje de Apoyo (Opcional)</label>
                <textarea
                  placeholder="¡Escribe un lindo mensaje de aliento!"
                  value={donorComment}
                  onChange={(e) => setDonorComment(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm h-16 resize-none outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Stripe Card Elements Mockup */}
              <div className="border border-slate-100 p-4 rounded-xl bg-slate-50 space-y-3">
                <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Pasarela Segura de Tarjeta de Crédito (PRUEBA)
                </p>

                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Número de tarjeta</span>
                    <input
                      type="text"
                      maxLength="16"
                      required
                      placeholder="4242 4242 4242 4242 (Tarjeta demo)"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, ""))}
                      className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 font-mono text-sm outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Expira (MM/AA)</span>
                      <input
                        type="text"
                        maxLength="5"
                        required
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">CVC</span>
                      <input
                        type="password"
                        maxLength="3"
                        required
                        placeholder="123"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                        className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 font-mono text-xs outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Procesando Pago...
                  </span>
                ) : (
                  `Pagar ${parseFloat(donationAmount || 0).toLocaleString("es-ES")} €`
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Manual payment report modal */}
      {showManualReportModal && selectedMethod && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border">
            
            {/* Header */}
            <div className="bg-slate-850 bg-slate-800 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">INFORMAR DONACIÓN</span>
                <span className="font-extrabold text-base">Transferencia vía {selectedMethod.name}</span>
              </div>
              <button
                onClick={() => setShowManualReportModal(false)}
                className="text-white/80 hover:text-white font-bold text-xl"
              >
                ✕
              </button>
            </div>

            {/* Instruction Box */}
            <div className="bg-emerald-50 p-4 border-b border-emerald-100 text-sm text-emerald-800">
              <p className="font-semibold mb-1">Por favor realiza la transferencia primero a:</p>
              {renderDetailsLines(selectedMethod.details)}
              <p className="text-xs text-gray-500 mt-2">
                Una vez completado el pago por tu app de Banco o Proveedor, reporta los datos abajo para registrarlo en el sistema.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleManualReport} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Monto Enviado (€)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Anónimo"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Código de Referencia / Teléfono Origen</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Bizum #149845 o Concepto"
                  value={manualReference}
                  onChange={(e) => setManualReference(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mensaje de Apoyo (Opcional)</label>
                <textarea
                  placeholder="¡Escribe unas palabras de apoyo!"
                  value={donorComment}
                  onChange={(e) => setDonorComment(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm h-16 resize-none outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Registrando reporte...
                  </span>
                ) : (
                  `Informar Envío de ${parseFloat(manualAmount || 0).toLocaleString("es-ES")} €`
                )}
              </button>
            </form>

          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Viewer Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-[999999] flex flex-col items-center justify-between p-4 font-sans select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button top right */}
          <div className="w-full flex justify-between items-center text-white/80 p-2 shrink-0">
            <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
              Foto {activeImageIdx + 1} de {campaign.images.length}
            </span>
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="text-white hover:text-rose-500 font-extrabold text-2xl p-2 transition-colors focus:outline-none"
            >
              ✕
            </button>
          </div>

          {/* Main big image area with slider controls */}
          <div className="flex-1 w-full max-w-4xl flex items-center justify-between gap-4 relative">
            
            {campaign.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx(prev => (prev === 0 ? campaign.images.length - 1 : prev - 1));
                }}
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 focus:outline-none"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
            )}

            <div 
              className="flex-1 h-full max-h-[75vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
            >
              <img
                src={campaign.images[activeImageIdx]}
                alt="Causa Ampliada"
                className="object-contain max-w-full max-h-full rounded-lg shadow-2xl transition-all duration-300"
              />
            </div>

            {campaign.images.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIdx(prev => (prev === campaign.images.length - 1 ? 0 : prev + 1));
                }}
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all shadow-lg active:scale-95 focus:outline-none"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            )}
          </div>

          {/* Thumbnail preview slider bar */}
          {campaign.images.length > 1 && (
            <div className="flex gap-3 justify-center py-4 shrink-0 overflow-x-auto w-full max-w-md">
              {campaign.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIdx(idx);
                  }}
                  className={`relative w-16 aspect-video rounded-md overflow-hidden border-2 transition-all ${
                    activeImageIdx === idx ? "border-amber-400 scale-105" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="Thumb" className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
