import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockDb } from "../mock";
import { useToast } from "../hooks/use-toast";
import { Camera, Plus, Trash2, ArrowRight, ArrowLeft, Heart, Sparkles, CheckCircle2, ShieldAlert } from "lucide-react";

const CATEGORIES = ["Salud", "Emergencias", "Educación", "Deportes", "Mascotas", "Comunidad"];

// Beautiful preset images for easy choosing if user doesn't have an image URL
const PRESET_IMAGES = [
  "https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
  "https://images.unsplash.com/photo-1599700403969-f77b3aa74837?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
  "https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=srgb&fm=jpg&w=600&q=80",
  "https://images.pexels.com/photos/15005200/pexels-photo-15005200.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?crop=entropy&cs=tinysrgb&w=600&q=80",
  "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?crop=entropy&cs=tinysrgb&w=600&q=80"
];

export default function CreateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Salud");
  const [goal, setGoal] = useState("5000");
  const [description, setDescription] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");

  // Photos management - enforce maximum of 3
  const [images, setImages] = useState([]);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom payment methods management
  const [paymentMethods, setPaymentMethods] = useState([
    { name: "Bizum", details: "" }
  ]);

  const handleAddPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { name: "Bizum", details: "" }]);
  };

  const handleRemovePaymentMethod = (index) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handlePaymentMethodChange = (index, field, value) => {
    const updated = [...paymentMethods];
    updated[index][field] = value;
    setPaymentMethods(updated);
  };

  // Add Photo URL (simulated upload or direct URL)
  const handleAddImage = (url) => {
    if (images.length >= 3) {
      toast({
        title: "Límite de fotos alcanzado",
        description: "Solo puedes agregar un máximo de 3 fotos para tu solicitud de donativo.",
        variant: "destructive"
      });
      return;
    }
    if (!url) return;
    setImages([...images, url]);
    setCustomImageUrl("");
    toast({
      title: "Foto agregada",
      description: `Se agregó la foto con éxito (${images.length + 1} de 3).`
    });
  };

  // Simulated File Upload
  const handleSimulatedFileUpload = (e) => {
    if (images.length >= 3) {
      toast({
        title: "Límite de fotos alcanzado",
        description: "Solo puedes subir un máximo de 3 fotos por donativo.",
        variant: "destructive"
      });
      return;
    }
    
    const file = e.target.files[0];
    if (file) {
      // Convert to mock object/local object URL
      const fakeUrl = URL.createObjectURL(file);
      // Wait, in real web we will upload it. Here we use preset image or createObjectURL
      // Let's use createObjectURL for local session showcase!
      handleAddImage(fakeUrl);
    }
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title || !description || !goal || !organizerName || !organizerEmail) {
      toast({
        title: "Campos vacíos",
        description: "Por favor, completa toda la información requerida.",
        variant: "destructive"
      });
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Sube al menos una foto",
        description: "Tu campaña necesita al menos una imagen para captar la atención de los donantes.",
        variant: "destructive"
      });
      return;
    }

    // Prepare campaign data
    const campaignData = {
      title,
      category,
      goal: parseFloat(goal),
      description,
      organizerName,
      organizerEmail,
      images,
      customPaymentMethods: paymentMethods.filter(p => p.details.trim() !== "")
    };

    setIsSubmitting(true);
    mockDb.createCampaign(campaignData)
      .then((newCampaign) => {
        setIsSubmitting(false);
        // Set organizer role in session so they can see it in dashboard
        localStorage.setItem("df_user_role", "organizer");
        window.dispatchEvent(new Event("df_role_changed"));

        toast({
          title: "¡Campaña Creada con Éxito!",
          description: "Tu campaña ha sido publicada. Los métodos de pago personalizados están pendientes de aprobación del administrador.",
        });

        navigate(`/campaigns/${newCampaign.id}`);
      })
      .catch((err) => {
        console.error(err);
        setIsSubmitting(false);
        toast({
          title: "Error al crear",
          description: "No se pudo registrar la campaña en el servidor.",
          variant: "destructive"
        });
      });
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-8 text-left">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Header indicator */}
        <div className="text-center mb-8 space-y-2">
          <Heart className="h-8 w-8 text-emerald-600 fill-emerald-500 mx-auto" />
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Inicia tu recaudación de fondos</h1>
          <p className="text-sm text-gray-500">Completa los pasos en español para lanzar tu solicitud</p>
        </div>

        {/* Steps navigation bar */}
        <div className="grid grid-cols-3 gap-2 mb-8 text-center text-xs font-bold uppercase tracking-wider text-gray-400">
          <div className={`pb-2 border-b-2 transition-all ${step >= 1 ? "border-emerald-600 text-emerald-700" : "border-slate-200"}`}>
            1. Concepto
          </div>
          <div className={`pb-2 border-b-2 transition-all ${step >= 2 ? "border-emerald-600 text-emerald-700" : "border-slate-200"}`}>
            2. Historia y Fotos
          </div>
          <div className={`pb-2 border-b-2 transition-all ${step >= 3 ? "border-emerald-600 text-emerald-700" : "border-slate-200"}`}>
            3. Métodos de Pago
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* STEP 1: Basic Concept */}
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-1.5 pb-2 border-b">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                ¿De qué trata tu campaña?
              </h2>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Tu Nombre / Organización</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Asociación de Vecinos San Miguel"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Correo Electrónico de Contacto</label>
                <input
                  type="email"
                  required
                  placeholder="Ej: contacto@organizacion.es"
                  value={organizerEmail}
                  onChange={(e) => setOrganizerEmail(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Título de la Campaña</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ayuda para reconstruir la biblioteca escolar"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <p className="text-xs text-gray-400 mt-1">Escribe un título claro, honesto y corto.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Meta de Recaudación (€)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-base font-bold text-gray-400">€</span>
                    <input
                      type="number"
                      required
                      min="100"
                      placeholder="5000"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow flex items-center gap-1.5"
                >
                  Siguiente paso
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Story and Images (With Limit 3) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 pb-2 border-b mb-1">
                  Escribe tu historia y sube fotos
                </h2>
                <p className="text-xs text-gray-400">Los donantes conectan emocionalmente con campañas que tienen buenas fotos e historias honestas.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Escribe la Descripción</label>
                <textarea
                  required
                  rows="6"
                  placeholder="Explica detalladamente para qué se usará el dinero, quién se beneficia y por qué es urgente el aporte..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Photos upload area with limit 3 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Fotos de la Campaña ({images.length} de máximo 3)
                  </label>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Límite: 3 fotos
                  </span>
                </div>

                {images.length < 3 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 bg-slate-50/50 text-center space-y-4">
                    <div className="flex flex-col items-center justify-center">
                      <Camera className="h-8 w-8 text-slate-400 mb-2 stroke-[1.5]" />
                      <p className="text-xs text-slate-500">Sube tus fotos o elige presets para la demo</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 max-w-md mx-auto">
                      {/* Real local reader upload simulation */}
                      <label className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all">
                        Examinar Archivo
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSimulatedFileUpload}
                          className="hidden"
                        />
                      </label>
                      
                      <span className="text-xs text-gray-400">o pega enlace web:</span>

                      <div className="flex w-full sm:flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={customImageUrl}
                          onChange={(e) => setCustomImageUrl(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 outline-none border-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddImage(customImageUrl)}
                          className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-1.5"
                        >
                          Añadir
                        </button>
                      </div>
                    </div>

                    {/* Presets Grid */}
                    <div className="pt-2">
                      <p className="text-[11px] font-bold text-gray-400 uppercase mb-2">Presintonías de prueba (Haz clic para agregar):</p>
                      <div className="flex gap-2.5 justify-center overflow-x-auto pb-1">
                        {PRESET_IMAGES.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleAddImage(img)}
                            className="relative w-14 aspect-video rounded-md overflow-hidden hover:scale-105 border border-slate-200 shrink-0"
                          >
                            <img src={img} alt="Preset" className="object-cover w-full h-full" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Images Previews */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border bg-slate-100 group">
                        <img src={img} alt="Vista previa" className="object-cover w-full h-full" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white p-1 rounded-full shadow transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                        <div className="absolute bottom-1 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                          Foto {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {images.length === 3 && (
                  <p className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Has alcanzado el límite de 3 fotos permitido por solicitud.
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="border border-slate-200 hover:bg-slate-50 text-gray-600 font-semibold px-5 py-3 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow flex items-center gap-1.5"
                >
                  Siguiente paso
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Methods Approval System */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 pb-2 border-b mb-1">
                  Métodos de Pago Personalizados
                </h2>
                <p className="text-xs text-gray-400">
                  Agrega tus canales personales (Bizum, PayPal, etc.). El administrador de la web los revisará y aprobará. La opción de pago con tarjeta Stripe ya se incluye de forma general por defecto.
                </p>
              </div>

              <div className="space-y-4">
                {paymentMethods.map((pm, idx) => (
                  <div key={idx} className="border border-slate-100 p-4 rounded-xl bg-slate-50 relative space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500 uppercase">Canal #{idx + 1}</span>
                      {paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePaymentMethod(idx)}
                          className="text-rose-600 hover:text-rose-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Quitar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nombre del Método</label>
                        <select
                          value={pm.name}
                          onChange={(e) => handlePaymentMethodChange(idx, "name", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none bg-white font-semibold"
                        >
                          <option value="Bizum">Bizum</option>
                          <option value="PayPal">PayPal</option>
                          <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                          <option value="Crypto">Criptomonedas</option>
                          <option value="Efectivo/Punto Físico">Efectivo / Entrega Física</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Detalles de Cobro</label>
                        <input
                          type="text"
                          required
                          placeholder={pm.name === "Bizum" ? "+34 600 000 000" : pm.name === "PayPal" ? "mi_correo@paypal.com" : "IBAN ES21..."}
                          value={pm.details}
                          onChange={(e) => handlePaymentMethodChange(idx, "details", e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-2 text-xs outline-none font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddPaymentMethod}
                  className="w-full border border-dashed border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 text-emerald-700 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-4 w-4" /> Agregar Otro Método de Pago
                </button>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3 text-xs text-amber-800 leading-relaxed">
                <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Proceso de Aprobación:</strong> Tus métodos de pago personalizados se mostrarán como "Pendientes de revisión" y no serán visibles para donantes hasta que un Administrador de donafacil.app verifique la veracidad de los datos suministrados. Stripe (tarjeta) estará disponible de forma inmediata.
                </p>
              </div>

              <div className="flex justify-between pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="border border-slate-200 hover:bg-slate-50 text-gray-600 font-semibold px-5 py-3 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-3 rounded-xl transition-all shadow-lg flex items-center gap-1.5 hover:shadow-emerald-600/20"
                >
                  Crear y Lanzar Campaña
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
