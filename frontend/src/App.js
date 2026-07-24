import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import CampaignDetail from "./components/CampaignDetail";
import CreateCampaign from "./components/CreateCampaign";
import AdminPanel from "./components/AdminPanel";
import UserDashboard from "./components/UserDashboard";
import SupportChatBubble from "./components/SupportChatBubble";
import { Toaster } from "./components/ui/toaster";

function App() {
  return (
    <div className="App flex flex-col min-h-screen text-slate-800 bg-slate-50/20 antialiased font-sans">
      <BrowserRouter>
        <Navbar />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/campaigns/:id" element={<CampaignDetail />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/dashboard" element={<UserDashboard />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t bg-white py-10 text-center text-sm text-slate-500 mt-auto">
          <div className="container mx-auto px-4 max-w-2xl space-y-4">
            <p className="font-extrabold text-lg text-emerald-700">donafacil.app</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              La plataforma de recaudación de fondos y solidaridad para la comunidad hispana. Recauda de manera directa, transparente y segura con tarjeta de crédito (Stripe) y transferencias verificadas.
            </p>
            <div className="bg-slate-50 border p-4 rounded-xl text-[11px] text-slate-400 text-left space-y-1.5 leading-relaxed">
              <p className="font-bold uppercase text-slate-500">Términos y Condiciones (Resumen de Seguridad):</p>
              <p>
                donafacil.app se reserva el derecho exclusivo de realizar **bloqueos preventivos de cuentas y fondos** de manera inmediata en caso de detectar anomalías, sospechas de fraude o denuncias de la comunidad. Asimismo, todos los métodos de pago y cobro registrados (como Zelle, Pago Móvil o Cuentas Bancarias) están sujetos a un **proceso estricto de auditoría y aprobación manual** por parte de la administración del portal antes de ser mostrados públicamente a los donantes para resguardar la seguridad del ecosistema.
              </p>
            </div>
            <p className="text-[11px] text-slate-300">© 2025 donafacil.app. Todos los derechos reservados.</p>
          </div>
        </footer>

        <SupportChatBubble />
        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
