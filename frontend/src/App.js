import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import CampaignDetail from "./components/CampaignDetail";
import CreateCampaign from "./components/CreateCampaign";
import AdminPanel from "./components/AdminPanel";
import UserDashboard from "./components/UserDashboard";
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
        <footer className="border-t bg-white py-8 text-center text-sm text-slate-500 mt-auto">
          <div className="container mx-auto px-4 space-y-3">
            <p className="font-semibold text-emerald-700">donafacil.app</p>
            <p className="max-w-md mx-auto text-xs text-slate-400">
              Copia pixel-perfect de GoFundMe en español. Diseñado para recaudar de forma transparente con Stripe y transferencias verificadas. Todo el contenido es simulado para demostración técnica.
            </p>
            <p className="text-[11px] text-slate-300">© 2025 donafacil.app. Todos los derechos reservados.</p>
          </div>
        </footer>

        <Toaster />
      </BrowserRouter>
    </div>
  );
}

export default App;
