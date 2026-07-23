# API Contracts - donafacil.app

## 1. Data Models (MongoDB & Frontend JSON Mapping)

### Campaign Schema
```json
{
  "_id": "string (UUID)",
  "title": "string",
  "category": "string",
  "goal": "double",
  "current": "double",
  "description": "string",
  "images": ["string"], // Enforced max 3 images
  "isActive": "boolean", // Admin or creator toggle to show/hide campaign
  "stripeEnabled": "boolean", // Admin toggle to enable/disable Stripe for this campaign
  "organizer": {
    "name": "string",
    "email": "string"
  },
  "customPaymentMethods": [
    {
      "id": "string",
      "name": "string", // "Zelle", "Pago Móvil", "Transferencia Bancaria", "PayPal"
      "details": "string", // e.g., email or phone + ID
      "approved": "boolean" // Only approved custom methods are visible to donors
    }
  ],
  "createdAt": "string (ISO Date)"
}
```

### Donation Schema
```json
{
  "_id": "string (UUID)",
  "campaignId": "string",
  "name": "string", // Donor name or "Anónimo"
  "amount": "double",
  "comment": "string",
  "date": "string (ISO Date)",
  "paymentMethod": "string" // "Zelle", "Pago Móvil", "Tarjeta de Crédito (Stripe)"
}
```

---

## 2. REST API Endpoints

### Public Campaign Endpoints
- **GET** `/api/campaigns`
  - Returns all active campaigns (`isActive == true`).
  - Supports query parameter `category` and `search`.
- **GET** `/api/campaigns/{id}`
  - Returns a single campaign by ID.

### Creation & Creator Endpoints
- **POST** `/api/campaigns`
  - Body: `{ title, category, goal, description, images, organizerName, organizerEmail, customPaymentMethods }`
  - Validates that `images` list is $\le 3$.
  - Generates custom payment methods with `approved = false`.
- **POST** `/api/campaigns/{id}/payment-methods`
  - Creator adds a new custom payment method.
  - Body: `{ name, details }`. Generates with `approved = false`.
- **POST** `/api/campaigns/{id}/donations`
  - Submits a new donation.
  - Body: `{ name, amount, comment, paymentMethod, reference }`
  - Updates campaign `current` amount and inserts donation record.

### Admin Endpoints
- **GET** `/api/admin/campaigns`
  - Returns all campaigns (active & inactive) for administration.
- **PATCH** `/api/admin/campaigns/{id}/toggle-active`
  - Admin toggles the campaign visiblity (`isActive`).
- **PATCH** `/api/admin/campaigns/{id}/toggle-stripe`
  - Admin toggles credit card availability (`stripeEnabled`).
- **POST** `/api/admin/campaigns/{id}/approve-payment/{methodId}`
  - Admin approves or rejects a personalized payment method.
  - Body: `{ approved: boolean }`
- **GET** `/api/admin/stats`
  - Returns dashboard stats: total raised, active campaigns count, pending payment approvals count.
- **GET** `/api/admin/donations`
  - Returns all donations across all campaigns.

---

## 3. Integration Plan

1. **Backend Implementation**: Implement full CRUD with FastAPI and MongoDB inside `/app/backend/server.py`.
2. **Frontend Connection**: Modify `/app/frontend/src/mock.js` to perform fetch calls to `/api/...` instead of using `localStorage`, keeping a seamless layer so no frontend pages break.
3. **Validation**: Test backend endpoints, then verify the frontend UI with a screenshot tool.
