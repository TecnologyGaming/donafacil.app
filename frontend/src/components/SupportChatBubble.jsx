import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  getDoc 
} from "firebase/firestore";
import { MessageSquare, Send, X, User, Heart } from "lucide-react";

export default function SupportChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sessionUser, setSessionUser] = useState(null);
  
  // Create a unique session ID for guest chat if not logged in
  const [chatId, setChatId] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in
    const checkUser = () => {
      const stored = localStorage.getItem("df_user");
      if (stored) {
        const u = JSON.parse(stored);
        setSessionUser(u);
        setChatId(u.email.replace(/[.@]/g, "_")); // sanitize for Firestore doc ID
      } else {
        // Guest session
        let guestId = localStorage.getItem("df_chat_guest_id");
        if (!guestId) {
          guestId = "invitado_" + Math.random().toString(36).substring(2, 9);
          localStorage.setItem("df_chat_guest_id", guestId);
        }
        setChatId(guestId);
        setSessionUser({ name: "Invitado Anónimo", email: guestId + "@invitado.com", phone: "N/A" });
      }
    };

    checkUser();
    window.addEventListener("df_user_login", checkUser);
    window.addEventListener("df_role_changed", checkUser);
    return () => {
      window.removeEventListener("df_user_login", checkUser);
      window.removeEventListener("df_role_changed", checkUser);
    };
  }, []);

  useEffect(() => {
    if (!chatId) return;

    // Listen to real-time chat messages from Firestore
    const docRef = doc(db, "conversations", chatId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setMessages(docSnap.data().messages || []);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    // Auto scroll to bottom
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !chatId) return;

    const messagePayload = {
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      name: sessionUser?.name || "Invitado"
    };

    setInputText("");

    try {
      const docRef = doc(db, "conversations", chatId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        await updateDoc(docRef, {
          messages: arrayUnion(messagePayload),
          lastMessageAt: new Date().toISOString(),
          unreadByAdmin: true,
          unreadByUser: false
        });
      } else {
        await setDoc(docRef, {
          chatId,
          userName: sessionUser?.name || "Invitado Anónimo",
          userEmail: sessionUser?.email || "guest@donafacil.app",
          userPhone: sessionUser?.phone || "N/A",
          messages: [messagePayload],
          lastMessageAt: new Date().toISOString(),
          unreadByAdmin: true,
          unreadByUser: false
        });
      }
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-left">
      
      {/* Chat window */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 h-[450px] border flex flex-col overflow-hidden mb-4 transition-all duration-300">
          
          {/* Header */}
          <div className="bg-emerald-600 text-white p-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse"></div>
              <div>
                <h4 className="font-extrabold text-sm">Soporte donafacil.app</h4>
                <p className="text-[10px] text-emerald-100">Atención en línea • 100% interna</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-emerald-100 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="text-center py-10 space-y-3">
                <Heart className="h-8 w-8 text-emerald-500 fill-emerald-100 mx-auto" />
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                  ¿Tienes alguna duda sobre donaciones, métodos de pago o creación de campañas? ¡Escríbenos aquí!
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isAdmin = m.sender === "admin";
                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col ${isAdmin ? "items-start" : "items-end"}`}
                  >
                    <span className="text-[9px] text-gray-400 font-semibold mb-0.5">
                      {isAdmin ? "Soporte (Admin)" : m.name}
                    </span>
                    <div 
                      className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                        isAdmin 
                          ? "bg-white text-slate-800 rounded-tl-none border" 
                          : "bg-emerald-600 text-white rounded-tr-none"
                      }`}
                    >
                      {m.text}
                    </div>
                    <span className="text-[8px] text-gray-400 mt-0.5">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex gap-2">
            <input
              type="text"
              placeholder="Escribe tu mensaje..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 text-xs border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}

      {/* Bubble button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-1.5"
        title="Chat de Soporte Interno"
      >
        <MessageSquare className="h-6 w-6" />
        {!isOpen && <span className="text-xs font-bold hidden sm:inline-block pr-1">¿Ayuda? Chat</span>}
      </button>

    </div>
  );
}
