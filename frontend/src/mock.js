// Mock database for donafacil.app using localStorage for persistent session state

const INITIAL_CAMPAIGNS = [
  {
    id: "1",
    title: "Tratamiento Médico para Sofía",
    organizer: {
      name: "Laura Martínez",
      email: "laura@example.com"
    },
    category: "Salud",
    goal: 25000,
    current: 18500,
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
      { id: "p1", name: "Bizum", details: "+34 600 123 456", approved: true },
      { id: "p2", name: "Transferencia Bancaria", details: "ES21 1234 5678 9012 3456 (Banco Santander)", approved: true }
    ],
    donations: [
      { name: "Juan Pérez", amount: 150, comment: "Mucho ánimo a Sofía y toda la familia.", date: "2025-06-15T12:30:00Z" },
      { name: "Anónimo", amount: 50, comment: "¡Fuerza Sofía!", date: "2025-06-15T14:45:00Z" },
      { name: "María Gómez", amount: 500, comment: "Espero que logren viajar pronto.", date: "2025-06-16T09:15:00Z" }
    ]
  },
  {
    id: "2",
    title: "Ayuda Urgente por Inundaciones",
    organizer: {
      name: "Carlos Ruiz (Bomberos Voluntarios)",
      email: "carlos@example.com"
    },
    category: "Emergencias",
    goal: 10000,
    current: 7200,
    description: "Debido a las recientes e intensas lluvias, muchas familias locales han perdido todo. Estamos recolectando fondos directamente para la compra de alimentos no perecederos, mantas, colchones y medicamentos básicos. Todo lo recaudado será entregado y documentado con total transparencia.",
    images: [
      "https://images.unsplash.com/photo-1599700403969-f77b3aa74837?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxlbWVyZ2VuY3klMjByZXNwb25zZXxlbnwwfHx8fDE3ODQ4MTkwMTV8MA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1546975490-a79abdd54533?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    isActive: true,
    stripeEnabled: true,
    createdAt: "2025-06-16T08:00:00Z",
    customPaymentMethods: [
      { id: "p3", name: "Bizum de Asociación", details: "+34 611 987 654", approved: true }
    ],
    donations: [
      { name: "Vecinos Solidarios", amount: 1000, comment: "Unidos por nuestro pueblo.", date: "2025-06-16T10:00:00Z" },
      { name: "Ana Torres", amount: 100, comment: "Mucha fuerza, estamos con ustedes.", date: "2025-06-16T11:20:00Z" }
    ]
  },
  {
    id: "3",
    title: "Becas Escolares y Material Didáctico",
    organizer: {
      name: "Asociación Educar Es Crecer",
      email: "asoc_educar@example.com"
    },
    category: "Educación",
    goal: 5000,
    current: 1250,
    description: "Nuestra meta es garantizar que 50 niños del sector rural tengan acceso completo a útiles escolares, mochilas, libros de texto y calzado escolar para el próximo año lectivo. Con solo 100 euros podemos apadrinar la educación completa de un niño este año.",
    images: [
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBlZHVjYXRpb258ZW58MHx8fHwxNzg0ODE5MDE2fDA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    isActive: true,
    stripeEnabled: false,
    createdAt: "2025-06-14T09:00:00Z",
    customPaymentMethods: [
      { id: "p4", name: "PayPal", details: "pagos@educarescrecer.org", approved: true }
    ],
    donations: [
      { name: "Roberto Gil", amount: 250, comment: "La educación es la clave del futuro.", date: "2025-06-14T15:00:00Z" }
    ]
  },
  {
    id: "4",
    title: "Operaciones Quirúrgicas de Rescate Animal",
    organizer: {
      name: "Refugio Patitas Felices",
      email: "patitas@example.com"
    },
    category: "Mascotas",
    goal: 3500,
    current: 3100,
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
      { id: "p5", name: "Bizum Refugio", details: "+34 622 333 444", approved: true },
      { id: "p6", name: "PayPal Refugio", details: "donaciones@patitasfelices.org", approved: false } // pending
    ],
    donations: [
      { name: "Marta S.", amount: 500, comment: "Gracias por la hermosa labor que hacen.", date: "2025-06-17T09:00:00Z" },
      { name: "Sonia Ruiz", amount: 15, comment: "Mi granito de arena para Toby.", date: "2025-06-17T11:00:00Z" }
    ]
  }
];

const getStoredCampaigns = () => {
  const campaigns = localStorage.getItem("df_campaigns");
  if (!campaigns) {
    localStorage.setItem("df_campaigns", JSON.stringify(INITIAL_CAMPAIGNS));
    return INITIAL_CAMPAIGNS;
  }
  return JSON.parse(campaigns);
};

const saveCampaigns = (campaigns) => {
  localStorage.setItem("df_campaigns", JSON.stringify(campaigns));
};

export const mockDb = {
  // Get all campaigns
  getCampaigns: () => {
    return getStoredCampaigns();
  },

  // Get active campaigns
  getActiveCampaigns: () => {
    return getStoredCampaigns().filter(c => c.isActive);
  },

  // Get a single campaign
  getCampaignById: (id) => {
    return getStoredCampaigns().find(c => c.id === id);
  },

  // Create campaign (limit 3 photos)
  createCampaign: (campaignData) => {
    const campaigns = getStoredCampaigns();
    const newCampaign = {
      id: (campaigns.length + 1).toString(),
      title: campaignData.title,
      organizer: {
        name: campaignData.organizerName || "Usuario Registrado",
        email: campaignData.organizerEmail || "user@example.com"
      },
      category: campaignData.category || "Comunidad",
      goal: parseFloat(campaignData.goal) || 1000,
      current: 0,
      description: campaignData.description,
      // Enforce max 3 photos
      images: (campaignData.images || []).slice(0, 3),
      isActive: false, // Starts inactive waiting for admin or user choice? Wait: let's make it true by default but pending approval, or wait: admin can toggle active/inactive. Let's start as active: true for easy demonstration, but with pending payment methods. Let's make it active: true so it shows up.
      stripeEnabled: true,
      createdAt: new Date().toISOString(),
      customPaymentMethods: (campaignData.customPaymentMethods || []).map(p => ({
        ...p,
        id: Math.random().toString(36).substr(2, 9),
        approved: false // Needs admin approval
      })),
      donations: []
    };
    campaigns.push(newCampaign);
    saveCampaigns(campaigns);
    return newCampaign;
  },

  // Update campaign
  updateCampaign: (id, updateData) => {
    const campaigns = getStoredCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns[index] = { ...campaigns[index], ...updateData };
      saveCampaigns(campaigns);
      return campaigns[index];
    }
    return null;
  },

  // Donate to campaign
  addDonation: (campaignId, donationData) => {
    const campaigns = getStoredCampaigns();
    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index !== -1) {
      const donation = {
        name: donationData.name || "Anónimo",
        amount: parseFloat(donationData.amount) || 0,
        comment: donationData.comment || "",
        date: new Date().toISOString()
      };
      campaigns[index].current += donation.amount;
      campaigns[index].donations.unshift(donation); // Add to top
      saveCampaigns(campaigns);
      return campaigns[index];
    }
    return null;
  },

  // Admin: Toggle campaign active/inactive
  toggleCampaignActive: (id) => {
    const campaigns = getStoredCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns[index].isActive = !campaigns[index].isActive;
      saveCampaigns(campaigns);
      return campaigns[index];
    }
    return null;
  },

  // Admin: Toggle Stripe on/off for campaign
  toggleStripeEnabled: (id) => {
    const campaigns = getStoredCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
      campaigns[index].stripeEnabled = !campaigns[index].stripeEnabled;
      saveCampaigns(campaigns);
      return campaigns[index];
    }
    return null;
  },

  // Admin: Approve/Reject custom payment method
  approveCustomPaymentMethod: (campaignId, methodId, approved) => {
    const campaigns = getStoredCampaigns();
    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index !== -1) {
      const methodIndex = campaigns[index].customPaymentMethods.findIndex(m => m.id === methodId);
      if (methodIndex !== -1) {
        if (approved) {
          campaigns[index].customPaymentMethods[methodIndex].approved = true;
        } else {
          // Remove if rejected, or set flag. Let's just remove or set false. Let's set approved: false
          campaigns[index].customPaymentMethods[methodIndex].approved = false;
        }
        saveCampaigns(campaigns);
        return campaigns[index];
      }
    }
    return null;
  },

  // Add custom payment method to a campaign
  addCustomPaymentMethod: (campaignId, paymentData) => {
    const campaigns = getStoredCampaigns();
    const index = campaigns.findIndex(c => c.id === campaignId);
    if (index !== -1) {
      const newMethod = {
        id: Math.random().toString(36).substr(2, 9),
        name: paymentData.name,
        details: paymentData.details,
        approved: false // Needs admin approval
      };
      campaigns[index].customPaymentMethods.push(newMethod);
      saveCampaigns(campaigns);
      return campaigns[index];
    }
    return null;
  }
};
