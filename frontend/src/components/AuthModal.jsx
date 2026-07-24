import React, { useState } from "react";
import { useToast } from "../hooks/use-toast";
import { User, Mail, Phone, Lock, Heart, ShieldCheck } from "lucide-react";

export default function AuthModal({ onClose, onSuccess }) {
  const { toast } = useToast();
  const [isRegister, setIsRegister] = useState(true);
  
  // Registration States
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Campos vacíos",
        description: "El correo electrónico y la contraseña son obligatorios.",
        variant: "destructive"
      });
      return;
    }

    if (isRegister) {
      if (!name || !surname || !phone) {
        toast({
          title: "Campos vacíos",
          description: "Por favor, completa tu nombre, apellido y teléfono celular.",
          variant: "destructive"
        });
        return;
      }

      // Save user session details
      const userPayload = {
        name: `${name.trim()} ${surname.trim()}`,
        email: email.trim().toLowerCase(),
        phone: phone.trim()
      };

      localStorage.setItem("df_user", JSON.stringify(userPayload));
      localStorage.setItem("df_user_role", "organizer");
      window.dispatchEvent(new Event("df_user_login"));
      window.dispatchEvent(new Event("df_role_changed"));

      toast({
        title: "¡Registro Exitoso!",
        description: `Bienvenido(a) a donafacil.app, ${name}.`
      });
    } else {
      // Login simulation
      const userPayload = {
        name: name || "Laura Martínez",
        email: email.trim().toLowerCase(),
        phone: phone || "+34 600 123 456"
      };

      localStorage.setItem("df_user", JSON.stringify(userPayload));
      localStorage.setItem("df_user_role", "organizer");
      window.dispatchEvent(new Event("df_user_login"));
      window.dispatchEvent(new Event("df_role_changed"));

      toast({
        title: "Sesión Iniciada",
        description: `Hola de nuevo, ${userPayload.name}.`
      });
    }

    if (onSuccess) onSuccess();
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-left font-sans">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <Heart className="h-10 w-10 text-emerald-600 fill-emerald-500 mx-auto" />
          <h2 className="text-2xl font-black text-gray-900">
            {isRegister ? "Crear Cuenta en donafacil" : "Iniciar Sesión"}
          </h2>
          <p className="text-xs text-gray-400">
            {isRegister 
              ? "Regístrate de forma privada para iniciar recaudaciones de fondos." 
              : "Ingresa tus datos para gestionar tus campañas."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Nombre</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Juan"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase">Apellido</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      placeholder="Pérez"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Teléfono Celular (Privado)</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+34 600 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <p className="text-[9px] text-gray-400 mt-1">Obligatorio por decisión administrativa y no se mostrará de forma pública.</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Correo Electrónico</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="email"
                required
                placeholder="juan.perez@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase">Contraseña</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="h-4.5 w-4.5" />
            {isRegister ? "Registrar e Iniciar" : "Iniciar Sesión"}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center pt-2 border-t">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {isRegister ? "¿Ya tienes una cuenta? Inicia Sesión" : "¿No tienes una cuenta? Regístrate gratis"}
          </button>
        </div>

      </div>
    </div>
  );
}
