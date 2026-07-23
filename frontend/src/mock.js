import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "https://campanaya.preview.emergentagent.com";
const API = `${BACKEND_URL}/api`;

export const mockDb = {
  // Get all campaigns
  getCampaigns: async () => {
    try {
      const response = await axios.get(`${API}/admin/campaigns`);
      return response.data;
    } catch (e) {
      console.error("Error getting all campaigns:", e);
      return [];
    }
  },

  // Get active campaigns
  getActiveCampaigns: async (category = "Todas", search = "") => {
    try {
      const response = await axios.get(`${API}/campaigns`, {
        params: { category, search }
      });
      return response.data;
    } catch (e) {
      console.error("Error getting active campaigns:", e);
      return [];
    }
  },

  // Get a single campaign
  getCampaignById: async (id) => {
    try {
      const response = await axios.get(`${API}/campaigns/${id}`);
      return response.data;
    } catch (e) {
      console.error("Error getting campaign by id:", e);
      return null;
    }
  },

  // Create campaign (limit 3 photos)
  createCampaign: async (campaignData) => {
    try {
      const payload = {
        title: campaignData.title,
        category: campaignData.category,
        goal: parseFloat(campaignData.goal),
        description: campaignData.description,
        images: (campaignData.images || []).slice(0, 3),
        organizerName: campaignData.organizerName,
        organizerEmail: campaignData.organizerEmail,
        organizerPhone: campaignData.organizerPhone,
        customPaymentMethods: (campaignData.customPaymentMethods || []).map(p => ({
          name: p.name,
          details: p.details
        }))
      };
      const response = await axios.post(`${API}/campaigns`, payload);
      return response.data;
    } catch (e) {
      console.error("Error creating campaign:", e);
      throw e;
    }
  },

  // Donate to campaign
  addDonation: async (campaignId, donationData) => {
    try {
      const payload = {
        name: donationData.name || "Anónimo",
        amount: parseFloat(donationData.amount),
        comment: donationData.comment || "",
        paymentMethod: donationData.paymentMethod || "Tarjeta de Crédito (Stripe)",
        reference: donationData.reference || "N/A"
      };
      const response = await axios.post(`${API}/campaigns/${campaignId}/donations`, payload);
      return response.data;
    } catch (e) {
      console.error("Error adding donation:", e);
      throw e;
    }
  },

  // Get donations for a single campaign
  getCampaignDonations: async (campaignId) => {
    try {
      const response = await axios.get(`${API}/campaigns/${campaignId}/donations`);
      return response.data;
    } catch (e) {
      console.error("Error getting campaign donations:", e);
      return [];
    }
  },

  // Admin: Toggle campaign active/inactive
  toggleCampaignActive: async (id) => {
    try {
      const response = await axios.patch(`${API}/admin/campaigns/${id}/toggle-active`);
      return response.data;
    } catch (e) {
      console.error("Error toggling campaign active:", e);
      return null;
    }
  },

  // Admin: Toggle Stripe on/off for campaign
  toggleStripeEnabled: async (id) => {
    try {
      const response = await axios.patch(`${API}/admin/campaigns/${id}/toggle-stripe`);
      return response.data;
    } catch (e) {
      console.error("Error toggling stripe enabled:", e);
      return null;
    }
  },

  // Admin: Approve/Reject custom payment method
  approveCustomPaymentMethod: async (campaignId, methodId, approved) => {
    try {
      const response = await axios.post(
        `${API}/admin/campaigns/${campaignId}/approve-payment/${methodId}`,
        { approved }
      );
      return response.data;
    } catch (e) {
      console.error("Error approving custom payment method:", e);
      return null;
    }
  },

  // Add custom payment method to a campaign
  addCustomPaymentMethod: async (campaignId, paymentData) => {
    try {
      const payload = {
        name: paymentData.name,
        details: paymentData.details
      };
      const response = await axios.post(`${API}/campaigns/${campaignId}/payment-methods`, payload);
      return response.data;
    } catch (e) {
      console.error("Error adding custom payment method:", e);
      throw e;
    }
  }
};
