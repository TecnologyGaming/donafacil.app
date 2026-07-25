import { db } from "./firebase";
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  setDoc,
  increment,
  deleteDoc
} from "firebase/firestore";

// Seed initial campaigns to Cloud Firestore if empty
const INITIAL_CAMPAIGNS = [
  {
    id: "1",
    title: "Tratamiento Médico para Sofía",
    organizer: {
      name: "Laura Martínez",
      email: "laura@example.com",
      phone: "+34 600 123 456"
    },
    category: "Salud",
    goal: 25000.0,
    current: 18500.0,
    description: "Sofía tiene 5 años y ha sido diagnosticada con una enfermedad rara que requiere un tratamiento especializado disponible únicamente en el extranjero. Cada pequeña donación nos acerca más a la posibilidad de viajar y salvar su vida. Agradecemos enormemente cualquier aporte y difusión de nuestra campaña.",
    images: [
      "https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxtZWRpY2FsJTIwY2FyZXxlbnwwfHx8fDE3ODQ4MTkwMTV8MA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1579684389782-64d84b5e9827?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    isActive: true,
    stripeEnabled: true,
    createdAt: "2025-06-15T10:00:00Z",
    customPaymentMethods: [
      { id: "p1", name: "Zelle", details: "laura.med@zelle.com", approved: true },
      { id: "p2", name: "Pago Móvil", details: "Banesco (0102) - 0414-1234567 - V-12345678", approved: true }
    ]
  },
  {
    id: "2",
    title: "Ayuda Urgente por Inundaciones",
    organizer: {
      name: "Carlos Ruiz (Bomberos Voluntarios)",
      email: "carlos@example.com",
      phone: "+34 611 987 654"
    },
    category: "Emergencias",
    goal: 10000.0,
    current: 7200.0,
    description: "Debido a las recientes e intensas lluvias, muchas familias locales han perdido todo. Estamos recolectando fondos directamente para la compra de alimentos no perecederos, mantas, colchones y medicamentos básicos. Todo lo recaudado será entregado y documentado con total transparencia.",
    images: [
      "https://images.unsplash.com/photo-1599700403969-f77b3aa74837?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxlbWVyZ2VuY3klMjByZXNwb25zZXxlbnwwfHx8fDE3ODQ4MTkwMTV8MA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1546975490-a79abdd54533?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    isActive: true,
    stripeEnabled: true,
    createdAt: "2025-06-16T08:00:00Z",
    customPaymentMethods: [
      { id: "p3", name: "Pago Móvil", details: "Mercantil (0105) - 0424-9876543 - J-98765432-1", approved: true }
    ]
  },
  {
    id: "3",
    title: "Becas Escolares y Material Didáctico",
    organizer: {
      name: "Asociación Educar Es Crecer",
      email: "asoc_educar@example.com",
      phone: "N/A"
    },
    category: "Educación",
    goal: 5000.0,
    current: 1250.0,
    description: "Nuestra meta es garantizar que 50 niños del sector rural tengan acceso completo a útiles escolares, mochilas, libros de texto y calzado escolar para el próximo año lectivo. Con solo 100 euros podemos apadrinar la educación completa de un niño este año.",
    images: [
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBlZHVjYXRpb258ZW58MHx8fHwxNzg0ODE5MDE2fDA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?crop=entropy&cs=tinysrgb&w=800&q=80"
    ],
    isActive: true,
    stripeEnabled: false,
    createdAt: "2025-06-14T09:00:00Z",
    customPaymentMethods: [
      { id: "p4", name: "Zelle", details: "donaciones@educarescrecer.org", approved: true }
    ]
  },
  {
    id: "4",
    title: "Operaciones Quirúrgicas de Rescate Animal",
    organizer: {
      name: "Refugio Patitas Felices",
      email: "patitas@example.com",
      phone: "+34 622 333 444"
    },
    category: "Mascotas",
    goal: 3500.0,
    current: 3100.0,
    description: "En nuestro refugio actualmente albergamos a más de 80 perritos y gatitos rescatados de la calle. Tres de ellos necesitan cirugías veterinarias urgentes por fracturas graves. Esta campaña es exclusivamente para financiar las intervenciones clínicas de Toby, Max y Luna.",
    images: [
      "https://images.pexels.com/photos/15005200/pexels-photo-15005200.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    isActive: true,
    stripeEnabled: true,
    createdAt: "2025-06-17T07:30:00Z",
    customPaymentMethods: [
      { id: "p5", name: "Pago Móvil", details: "BOD (0116) - 0412-5556677 - V-99887766", approved: true },
      { id: "p6", name: "Zelle", "details": "zelle@patitasfelices.org", approved: false }
    ]
  }
];

const INITIAL_DONATIONS = [
  {
    id: "d1",
    campaignId: "1",
    name: "Juan Pérez",
    amount: 150.0,
    comment: "Mucho ánimo a Sofía y toda la familia.",
    date: "2025-06-15T12:30:00Z",
    paymentMethod: "Zelle"
  },
  {
    id: "d2",
    campaignId: "1",
    name: "Anónimo",
    amount: 50.0,
    comment: "¡Fuerza Sofía!",
    date: "2025-06-15T14:45:00Z",
    paymentMethod: "Tarjeta de Crédito (Stripe)"
  },
  {
    id: "d3",
    campaignId: "1",
    name: "María Gómez",
    amount: 500.0,
    comment: "Espero que logren viajar pronto.",
    date: "2025-06-16T09:15:00Z",
    paymentMethod: "Pago Móvil"
  },
  {
    id: "d4",
    campaignId: "2",
    name: "Vecinos Solidarios",
    amount: 1000.0,
    comment: "Unidos por nuestro pueblo.",
    date: "2025-06-16T10:00:00Z",
    paymentMethod: "Pago Móvil"
  },
  {
    id: "d5",
    campaignId: "2",
    name: "Ana Torres",
    amount: 100.0,
    comment: "Mucha fuerza, estamos con ustedes.",
    date: "2025-06-16T11:20:00Z",
    paymentMethod: "Tarjeta de Crédito (Stripe)"
  },
  {
    id: "d6",
    campaignId: "3",
    name: "Roberto Gil",
    amount: 250.0,
    comment: "La educación es la clave del futuro.",
    date: "2025-06-14T15:00:00Z",
    paymentMethod: "Zelle"
  },
  {
    id: "d7",
    campaignId: "4",
    name: "Marta S.",
    amount: 500.0,
    comment: "Gracias por la hermosa labor que hacen.",
    date: "2025-06-17T09:00:00Z",
    paymentMethod: "Pago Móvil"
  },
  {
    id: "d8",
    campaignId: "4",
    name: "Sonia Ruiz",
    amount: 15.0,
    comment: "Mi granito de arena para Toby.",
    date: "2025-06-17T11:00:00Z",
    paymentMethod: "Zelle"
  }
];

// Helper to seed Firestore if empty
const verifyAndSeedFirestore = async () => {
  try {
    const campaignsCol = collection(db, "campaigns");
    const snapshot = await getDocs(campaignsCol);
    if (snapshot.empty) {
      console.log("Firestore empty. Seeding INITIAL_CAMPAIGNS...");
      for (const campaign of INITIAL_CAMPAIGNS) {
        await setDoc(doc(db, "campaigns", campaign.id), campaign);
      }
      
      const donationsCol = collection(db, "donations");
      for (const donation of INITIAL_DONATIONS) {
        await setDoc(doc(db, "donations", donation.id), donation);
      }
      console.log("Firestore seeding completed!");
    }
  } catch (err) {
    console.warn("Firestore seed verification skipped/failed (possibly due to Firestore Security Rules):", err);
  }
};

// Auto run check on import
verifyAndSeedFirestore();

export const mockDb = {
  // Get all campaigns
  getCampaigns: async () => {
    await verifyAndSeedFirestore();
    try {
      const snapshot = await getDocs(collection(db, "campaigns"));
      const list = [];
      snapshot.forEach(doc => {
        list.push({ ...doc.data(), id: doc.id });
      });
      return list;
    } catch (e) {
      console.error("Error getting all campaigns:", e);
      return INITIAL_CAMPAIGNS; // Safe fallback
    }
  },

  // Get active campaigns
  getActiveCampaigns: async (category = "Todas", search = "") => {
    await verifyAndSeedFirestore();
    try {
      let q = collection(db, "campaigns");
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        // Manual filter to work perfectly on any Firestore setup index-free
        const matchesCategory = category === "Todas" || data.category === category;
        const matchesSearch = !search || (
          data.title.toLowerCase().includes(search.toLowerCase()) ||
          data.description.toLowerCase().includes(search.toLowerCase()) ||
          data.organizer.name.toLowerCase().includes(search.toLowerCase())
        );
        if (data.isActive && matchesCategory && matchesSearch) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      return list;
    } catch (e) {
      console.error("Error getting active campaigns:", e);
      return INITIAL_CAMPAIGNS.filter(c => c.isActive); // Fallback
    }
  },

  // Get a single campaign
  getCampaignById: async (id) => {
    await verifyAndSeedFirestore();
    try {
      const docRef = doc(db, "campaigns", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id };
      }
      return null;
    } catch (e) {
      console.error("Error getting campaign by id:", e);
      return INITIAL_CAMPAIGNS.find(c => c.id === id); // Fallback
    }
  },

  // Create campaign (limit 3 photos)
  createCampaign: async (campaignData) => {
    try {
      const newId = Math.random().toString(36).substring(2, 11);
      const custom_methods = (campaignData.customPaymentMethods || []).map(p => ({
        id: Math.random().toString(36).substring(2, 9),
        name: p.name,
        details: p.details,
        approved: false // Creator methods start pending approval
      }));

      const payload = {
        id: newId,
        title: campaignData.title,
        category: campaignData.category,
        goal: parseFloat(campaignData.goal),
        current: 0.0,
        description: campaignData.description,
        images: (campaignData.images || []).slice(0, 3),
        isActive: false,
        stripeEnabled: true,
        cedulaImage: campaignData.cedulaImage || "N/A",
        selfieImage: campaignData.selfieImage || "N/A",
        organizer: {
          name: campaignData.organizerName,
          email: campaignData.organizerEmail,
          phone: campaignData.organizerPhone || "N/A"
        },
        customPaymentMethods: custom_methods,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "campaigns", newId), payload);
      return payload;
    } catch (e) {
      console.error("Error creating campaign:", e);
      throw e;
    }
  },

  // Donate to campaign
  addDonation: async (campaignId, donationData) => {
    try {
      const donationId = Math.random().toString(36).substring(2, 11);
      const payload = {
        id: donationId,
        campaignId: campaignId,
        name: donationData.name || "Anónimo",
        amount: parseFloat(donationData.amount),
        comment: donationData.comment || "",
        date: new Date().toISOString(),
        paymentMethod: donationData.paymentMethod || "Tarjeta de Crédito (Stripe)"
      };

      // 1. Add donation record
      await setDoc(doc(db, "donations", donationId), payload);

      // 2. Increment campaign current amount
      const campaignRef = doc(db, "campaigns", campaignId);
      await updateDoc(campaignRef, {
        current: increment(payload.amount)
      });

      return payload;
    } catch (e) {
      console.error("Error adding donation:", e);
      throw e;
    }
  },

  // Get donations for a single campaign
  getCampaignDonations: async (campaignId) => {
    try {
      const q = collection(db, "donations");
      const snapshot = await getDocs(q);
      const list = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (d.campaignId === campaignId) {
          list.push({ ...d, id: docSnap.id });
        }
      });
      // Sort by date desc
      list.sort((a, b) => new Date(b.date) - new Date(a.date));
      return list;
    } catch (e) {
      console.error("Error getting campaign donations:", e);
      return INITIAL_DONATIONS.filter(d => d.campaignId === campaignId);
    }
  },

  // Admin: Toggle campaign active/inactive
  toggleCampaignActive: async (id) => {
    try {
      const campaignRef = doc(db, "campaigns", id);
      const campaignSnap = await getDoc(campaignRef);
      if (campaignSnap.exists()) {
        const currentStatus = campaignSnap.data().isActive;
        const newStatus = !currentStatus;
        await updateDoc(campaignRef, { isActive: newStatus });
        return { ...campaignSnap.data(), isActive: newStatus, id };
      }
      return null;
    } catch (e) {
      console.error("Error toggling campaign active:", e);
      return null;
    }
  },

  // Admin: Toggle Stripe on/off for campaign
  toggleStripeEnabled: async (id) => {
    try {
      const campaignRef = doc(db, "campaigns", id);
      const campaignSnap = await getDoc(campaignRef);
      if (campaignSnap.exists()) {
        const currentStatus = campaignSnap.data().stripeEnabled;
        const newStatus = !currentStatus;
        await updateDoc(campaignRef, { stripeEnabled: newStatus });
        return { ...campaignSnap.data(), stripeEnabled: newStatus, id };
      }
      return null;
    } catch (e) {
      console.error("Error toggling stripe enabled:", e);
      return null;
    }
  },

  // Admin: Approve/Reject custom payment method
  approveCustomPaymentMethod: async (campaignId, methodId, approved) => {
    try {
      const campaignRef = doc(db, "campaigns", campaignId);
      const campaignSnap = await getDoc(campaignRef);
      if (campaignSnap.exists()) {
        const customPaymentMethods = campaignSnap.data().customPaymentMethods || [];
        const updatedMethods = customPaymentMethods.map(m => {
          if (m.id === methodId) {
            return { ...m, approved };
          }
          return m;
        });
        await updateDoc(campaignRef, { customPaymentMethods: updatedMethods });
        return { ...campaignSnap.data(), customPaymentMethods: updatedMethods, id: campaignId };
      }
      return null;
    } catch (e) {
      console.error("Error approving custom payment method:", e);
      return null;
    }
  },

  // Add custom payment method to a campaign
  addCustomPaymentMethod: async (campaignId, paymentData) => {
    try {
      const campaignRef = doc(db, "campaigns", campaignId);
      const campaignSnap = await getDoc(campaignRef);
      if (campaignSnap.exists()) {
        const currentMethods = campaignSnap.data().customPaymentMethods || [];
        const newMethod = {
          id: Math.random().toString(36).substring(2, 9),
          name: paymentData.name,
          details: paymentData.details,
          approved: false // Needs admin approval
        };
        const updatedMethods = [...currentMethods, newMethod];
        await updateDoc(campaignRef, { customPaymentMethods: updatedMethods });
        return { ...campaignSnap.data(), customPaymentMethods: updatedMethods, id: campaignId };
      }
      return null;
    } catch (e) {
      console.error("Error adding custom payment method:", e);
      throw e;
    }
  },

  // Update campaign
  updateCampaign: async (id, updateData) => {
    try {
      const campaignRef = doc(db, "campaigns", id);
      await updateDoc(campaignRef, {
        title: updateData.title,
        description: updateData.description,
        category: updateData.category,
        goal: parseFloat(updateData.goal)
      });
      return true;
    } catch (e) {
      console.error("Error updating campaign:", e);
      return false;
    }
  },

  // Delete campaign
  deleteCampaign: async (id) => {
    try {
      const campaignRef = doc(db, "campaigns", id);
      await deleteDoc(campaignRef);
      return true;
    } catch (e) {
      console.error("Error deleting campaign:", e);
      return false;
    }
  },

  // Get Site Settings (Counters baseline)
  getSiteSettings: async () => {
    try {
      const docRef = doc(db, "settings", "global");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data();
      } else {
        const defaults = {
          baseRaised: 30050.0,
          baseCampaigns: 5,
          baseDonations: 860,
          zelleEmail: "zelle@donafacil.app",
          binanceId: "123456789",
          stripeKey: "pk_live_donafacil_123",
          zelleActive: true,
          binanceActive: true,
          stripeActive: true
        };
        await setDoc(docRef, defaults);
        return defaults;
      }
    } catch (e) {
      console.error("Error getting site settings:", e);
      return {
        baseRaised: 30050.0,
        baseCampaigns: 5,
        baseDonations: 860,
        zelleEmail: "zelle@donafacil.app",
        binanceId: "123456789",
        stripeKey: "pk_live_donafacil_123",
        zelleActive: true,
        binanceActive: true,
        stripeActive: true
      };
    }
  },

  // Update Site Settings
  updateSiteSettings: async (settingsData) => {
    try {
      const docRef = doc(db, "settings", "global");
      const dataToSave = {
        baseRaised: parseFloat(settingsData.baseRaised),
        baseCampaigns: parseInt(settingsData.baseCampaigns),
        baseDonations: parseInt(settingsData.baseDonations),
        zelleEmail: settingsData.zelleEmail || "zelle@donafacil.app",
        binanceId: settingsData.binanceId || "123456789",
        stripeKey: settingsData.stripeKey || "pk_live_donafacil_123",
        zelleActive: settingsData.zelleActive !== undefined ? settingsData.zelleActive : true,
        binanceActive: settingsData.binanceActive !== undefined ? settingsData.binanceActive : true,
        stripeActive: settingsData.stripeActive !== undefined ? settingsData.stripeActive : true
      };
      await setDoc(docRef, dataToSave);
      return true;
    } catch (e) {
      console.error("Error updating site settings:", e);
      return false;
    }
  },

  // Get all registered users
  getUsers: async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ ...docSnap.data(), id: docSnap.id });
      });
      return list;
    } catch (e) {
      console.error("Error getting users:", e);
      return [];
    }
  },

  // Delete a user
  deleteUser: async (email) => {
    try {
      const userRef = doc(db, "users", email);
      await deleteDoc(userRef);
      return true;
    } catch (e) {
      console.error("Error deleting user:", e);
      return false;
    }
  },

  // Reset a user's password
  resetUserPassword: async (email, newPassword) => {
    try {
      const userRef = doc(db, "users", email);
      await updateDoc(userRef, {
        password: newPassword
      });
      return true;
    } catch (e) {
      console.error("Error resetting password:", e);
      return false;
    }
  }
};
