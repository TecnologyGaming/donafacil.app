from fastapi import FastAPI, APIRouter, HTTPException, Path, Body, Query
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse
import base64
import re
import io
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path as FilePath
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

ROOT_DIR = FilePath(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models
class Organizer(BaseModel):
    name: str
    email: str
    phone: Optional[str] = "N/A"

class CustomPaymentMethod(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    details: str
    approved: bool = False

class CustomPaymentMethodCreate(BaseModel):
    name: str
    details: str

class CampaignCreate(BaseModel):
    title: str
    category: str
    goal: float
    description: str
    images: List[str]
    organizerName: str
    organizerEmail: str
    organizerPhone: Optional[str] = "N/A"
    customPaymentMethods: List[CustomPaymentMethodCreate] = []

class CampaignResponse(BaseModel):
    id: str
    title: str
    category: str
    goal: float
    current: float
    description: str
    images: List[str]
    isActive: bool
    stripeEnabled: bool
    organizer: Organizer
    customPaymentMethods: List[CustomPaymentMethod]
    createdAt: str

class DonationCreate(BaseModel):
    name: Optional[str] = "Anónimo"
    amount: float
    comment: Optional[str] = ""
    paymentMethod: str
    reference: Optional[str] = "N/A"

class DonationResponse(BaseModel):
    id: str
    campaignId: str
    name: str
    amount: float
    comment: str
    date: str
    paymentMethod: str

class ApprovePaymentRequest(BaseModel):
    approved: bool

# Seed initial campaigns if db is empty
INITIAL_CAMPAIGNS = [
  {
    "id": "1",
    "title": "Tratamiento Médico para Sofía",
    "organizer": {
      "name": "Laura Martínez",
      "email": "laura@example.com"
    },
    "category": "Salud",
    "goal": 25000.0,
    "current": 18500.0,
    "description": "Sofía tiene 5 años y ha sido diagnosticada con una enfermedad rara que requiere un tratamiento especializado disponible únicamente en el extranjero. Cada pequeña donación nos acerca más a la posibilidad de viajar y salvar su vida. Agradecemos enormemente cualquier aporte y difusión de nuestra campaña.",
    "images": [
      "https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxtZWRpY2FsJTIwY2FyZXxlbnwwfHx8fDE3ODQ4MTkwMTV8MA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1579684389782-64d84b5e9827?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    "isActive": True,
    "stripeEnabled": True,
    "createdAt": "2025-06-15T10:00:00Z",
    "customPaymentMethods": [
      { "id": "p1", "name": "Zelle", "details": "laura.med@zelle.com", "approved": True },
      { "id": "p2", "name": "Pago Móvil", "details": "Banesco (0102) - 0414-1234567 - V-12345678", "approved": True }
    ]
  },
  {
    "id": "2",
    "title": "Ayuda Urgente por Inundaciones",
    "organizer": {
      "name": "Carlos Ruiz (Bomberos Voluntarios)",
      "email": "carlos@example.com"
    },
    "category": "Emergencias",
    "goal": 10000.0,
    "current": 7200.0,
    "description": "Debido a las recientes e intensas lluvias, muchas familias locales han perdido todo. Estamos recolectando fondos directamente para la compra de alimentos no perecederos, mantas, colchones y medicamentos básicos. Todo lo recaudado será entregado y documentado con total transparencia.",
    "images": [
      "https://images.unsplash.com/photo-1599700403969-f77b3aa74837?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxlbWVyZ2VuY3klMjByZXNwb25zZXxlbnwwfHx8fDE3ODQ4MTkwMTV8MA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1546975490-a79abdd54533?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    "isActive": True,
    "stripeEnabled": True,
    "createdAt": "2025-06-16T08:00:00Z",
    "customPaymentMethods": [
      { "id": "p3", "name": "Pago Móvil", "details": "Mercantil (0105) - 0424-9876543 - J-98765432-1", "approved": True }
    ]
  },
  {
    "id": "3",
    "title": "Becas Escolares y Material Didáctico",
    "organizer": {
      "name": "Asociación Educar Es Crecer",
      "email": "asoc_educar@example.com"
    },
    "category": "Educación",
    "goal": 5000.0,
    "current": 1250.0,
    "description": "Nuestra meta es garantizar que 50 niños del sector rural tengan acceso completo a útiles escolares, mochilas, libros de texto y calzado escolar para el próximo año lectivo. Con solo 100 euros podemos apadrinar la educación completa de un niño este año.",
    "images": [
      "https://images.unsplash.com/photo-1577896851231-70ef18881754?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHw0fHxzY2hvb2wlMjBlZHVjYXRpb258ZW58MHx8fHwxNzg0ODE5MDE2fDA&ixlib=rb-4.1.0&q=85",
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    "isActive": True,
    "stripeEnabled": False,
    "createdAt": "2025-06-14T09:00:00Z",
    "customPaymentMethods": [
      { "id": "p4", "name": "Zelle", "details": "donaciones@educarescrecer.org", "approved": True }
    ]
  },
  {
    "id": "4",
    "title": "Operaciones Quirúrgicas de Rescate Animal",
    "organizer": {
      "name": "Refugio Patitas Felices",
      "email": "patitas@example.com"
    },
    "category": "Mascotas",
    "goal": 3500.0,
    "current": 3100.0,
    "description": "En nuestro refugio actualmente albergamos a más de 80 perritos y gatitos rescatados de la calle. Tres de ellos necesitan cirugías veterinarias urgentes por fracturas graves. Esta campaña es exclusivamente para financiar las intervenciones clínicas de Toby, Max y Luna.",
    "images": [
      "https://images.pexels.com/photos/15005200/pexels-photo-15005200.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?crop=entropy&cs=srgb&fm=jpg&w=800&q=80",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?crop=entropy&cs=srgb&fm=jpg&w=800&q=80"
    ],
    "isActive": True,
    "stripeEnabled": True,
    "createdAt": "2025-06-17T07:30:00Z",
    "customPaymentMethods": [
      { "id": "p5", "name": "Pago Móvil", "details": "BOD (0116) - 0412-5556677 - V-99887766", "approved": True },
      { "id": "p6", "name": "Zelle", "details": "zelle@patitasfelices.org", "approved": False }
    ]
  }
]

INITIAL_DONATIONS = [
  {
    "id": "d1",
    "campaignId": "1",
    "name": "Juan Pérez",
    "amount": 150.0,
    "comment": "Mucho ánimo a Sofía y toda la familia.",
    "date": "2025-06-15T12:30:00Z",
    "paymentMethod": "Zelle"
  },
  {
    "id": "d2",
    "campaignId": "1",
    "name": "Anónimo",
    "amount": 50.0,
    "comment": "¡Fuerza Sofía!",
    "date": "2025-06-15T14:45:00Z",
    "paymentMethod": "Tarjeta de Crédito (Stripe)"
  },
  {
    "id": "d3",
    "campaignId": "1",
    "name": "María Gómez",
    "amount": 500.0,
    "comment": "Espero que logren viajar pronto.",
    "date": "2025-06-16T09:15:00Z",
    "paymentMethod": "Pago Móvil"
  },
  {
    "id": "d4",
    "campaignId": "2",
    "name": "Vecinos Solidarios",
    "amount": 1000.0,
    "comment": "Unidos por nuestro pueblo.",
    "date": "2025-06-16T10:00:00Z",
    "paymentMethod": "Pago Móvil"
  },
  {
    "id": "d5",
    "campaignId": "2",
    "name": "Ana Torres",
    "amount": 100.0,
    "comment": "Mucha fuerza, estamos con ustedes.",
    "date": "2025-06-16T11:20:00Z",
    "paymentMethod": "Tarjeta de Crédito (Stripe)"
  },
  {
    "id": "d6",
    "campaignId": "3",
    "name": "Roberto Gil",
    "amount": 250.0,
    "comment": "La educación es la clave del futuro.",
    "date": "2025-06-14T15:00:00Z",
    "paymentMethod": "Zelle"
  },
  {
    "id": "d7",
    "campaignId": "4",
    "name": "Marta S.",
    "amount": 500.0,
    "comment": "Gracias por la hermosa labor que hacen.",
    "date": "2025-06-17T09:00:00Z",
    "paymentMethod": "Pago Móvil"
  },
  {
    "id": "d8",
    "campaignId": "4",
    "name": "Sonia Ruiz",
    "amount": 15.0,
    "comment": "Mi granito de arena para Toby.",
    "date": "2025-06-17T11:00:00Z",
    "paymentMethod": "Zelle"
  }
]

@app.on_event("startup")
async def seed_db():
    logger.info("Verifying database collections for donafacil.app...")
    campaigns_count = await db.campaigns.count_documents({})
    if campaigns_count == 0:
        logger.info("Seeding initial campaigns...")
        await db.campaigns.insert_many(INITIAL_CAMPAIGNS)
    
    donations_count = await db.donations.count_documents({})
    if donations_count == 0:
        logger.info("Seeding initial donations...")
        await db.donations.insert_many(INITIAL_DONATIONS)

# Base Hello Route
@api_router.get("/")
async def root():
    return {"message": "¡Servidor de donafacil.app funcionando!"}

# Get active campaigns
@api_router.get("/campaigns", response_model=List[CampaignResponse])
async def get_active_campaigns(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    query = {"isActive": True}
    if category and category != "Todas":
        query["category"] = category
    
    cursor = db.campaigns.find(query)
    campaigns = await cursor.to_list(1000)
    
    result = []
    for c in campaigns:
        # Filter matching search title or description or organizer
        if search:
            search_lower = search.lower()
            if (search_lower not in c["title"].lower() and 
                search_lower not in c["description"].lower() and 
                search_lower not in c["organizer"]["name"].lower()):
                continue
        
        # Clean _id to id mapping
        c_id = c.get("id") or str(c.get("_id"))
        c["id"] = c_id
        result.append(CampaignResponse(**c))
    
    return result

# Get single campaign
@api_router.get("/campaigns/{id}", response_model=CampaignResponse)
async def get_campaign(id: str):
    c = await db.campaigns.find_one({"id": id})
    if not c:
        # fallback to _id
        try:
            from bson import ObjectId
            c = await db.campaigns.find_one({"_id": ObjectId(id)})
        except Exception:
            pass
    
    if not c:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    c["id"] = c.get("id") or str(c.get("_id"))
    return CampaignResponse(**c)

# Create campaign (limit 3 photos)
@api_router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(payload: CampaignCreate):
    if len(payload.images) > 3:
        raise HTTPException(status_code=400, detail="No puedes subir más de 3 fotos por solicitud.")
    
    new_id = str(uuid.uuid4())
    custom_methods = []
    for m in payload.customPaymentMethods:
        custom_methods.append(CustomPaymentMethod(
            id=str(uuid.uuid4()),
            name=m.name,
            details=m.details,
            approved=False # Creator methods start pending approval
        ))

    campaign_dict = {
        "id": new_id,
        "title": payload.title,
        "category": payload.category,
        "goal": payload.goal,
        "current": 0.0,
        "description": payload.description,
        "images": payload.images[:3],
        "isActive": True, # Creator campaigns are on by default on our mockup, wait, let's keep it visible
        "stripeEnabled": True,
        "organizer": {
            "name": payload.organizerName,
            "email": payload.organizerEmail,
            "phone": payload.organizerPhone
        },
        "customPaymentMethods": [m.dict() for m in custom_methods],
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }

    await db.campaigns.insert_one(campaign_dict)
    return CampaignResponse(**campaign_dict)

# Add custom payment method to a campaign
@api_router.post("/campaigns/{id}/payment-methods", response_model=CampaignResponse)
async def add_payment_method(id: str, payload: CustomPaymentMethodCreate):
    c = await db.campaigns.find_one({"id": id})
    if not c:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    new_method = CustomPaymentMethod(
        id=str(uuid.uuid4()),
        name=payload.name,
        details=payload.details,
        approved=False
    )

    await db.campaigns.update_one(
        {"id": id},
        {"$push": {"customPaymentMethods": new_method.dict()}}
    )

    updated_c = await db.campaigns.find_one({"id": id})
    updated_c["id"] = updated_c.get("id") or str(updated_c.get("_id"))
    return CampaignResponse(**updated_c)

# Donate to a campaign
@api_router.post("/campaigns/{id}/donations", response_model=DonationResponse)
async def create_donation(id: str, payload: DonationCreate):
    c = await db.campaigns.find_one({"id": id})
    if not c:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")

    donation_id = str(uuid.uuid4())
    donation_dict = {
        "id": donation_id,
        "campaignId": id,
        "name": payload.name or "Anónimo",
        "amount": payload.amount,
        "comment": payload.comment or "",
        "date": datetime.utcnow().isoformat() + "Z",
        "paymentMethod": payload.paymentMethod
    }

    # Insert donation
    await db.donations.insert_one(donation_dict)

    # Increment campaign current amount
    await db.campaigns.update_one(
        {"id": id},
        {"$inc": {"current": payload.amount}}
    )

    return DonationResponse(**donation_dict)

# Get donations for a single campaign
@api_router.get("/campaigns/{id}/donations", response_model=List[DonationResponse])
async def get_campaign_donations(id: str):
    cursor = db.donations.find({"campaignId": id}).sort("date", -1)
    donations = await cursor.to_list(1000)
    return [DonationResponse(**d) for d in donations]

# ================= ADMIN ROUTES =================

# Get all campaigns (active or inactive)
@api_router.get("/admin/campaigns", response_model=List[CampaignResponse])
async def admin_get_all_campaigns():
    cursor = db.campaigns.find()
    campaigns = await cursor.to_list(1000)
    result = []
    for c in campaigns:
        c["id"] = c.get("id") or str(c.get("_id"))
        result.append(CampaignResponse(**c))
    return result

# Toggle active status of a campaign
@api_router.patch("/admin/campaigns/{id}/toggle-active", response_model=CampaignResponse)
async def admin_toggle_active(id: str):
    c = await db.campaigns.find_one({"id": id})
    if not c:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    new_status = not c.get("isActive", True)
    await db.campaigns.update_one(
        {"id": id},
        {"$set": {"isActive": new_status}}
    )
    
    updated_c = await db.campaigns.find_one({"id": id})
    updated_c["id"] = updated_c.get("id") or str(updated_c.get("_id"))
    return CampaignResponse(**updated_c)

# Toggle Stripe status of a campaign
@api_router.patch("/admin/campaigns/{id}/toggle-stripe", response_model=CampaignResponse)
async def admin_toggle_stripe(id: str):
    c = await db.campaigns.find_one({"id": id})
    if not c:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    new_status = not c.get("stripeEnabled", True)
    await db.campaigns.update_one(
        {"id": id},
        {"$set": {"stripeEnabled": new_status}}
    )
    
    updated_c = await db.campaigns.find_one({"id": id})
    updated_c["id"] = updated_c.get("id") or str(updated_c.get("_id"))
    return CampaignResponse(**updated_c)

# Approve or Reject custom payment method
@api_router.post("/admin/campaigns/{campaign_id}/approve-payment/{method_id}", response_model=CampaignResponse)
async def admin_approve_payment(campaign_id: str, method_id: str, payload: ApprovePaymentRequest):
    c = await db.campaigns.find_one({"id": campaign_id})
    if not c:
        raise HTTPException(status_code=404, detail="Campaña no encontrada")
    
    custom_methods = c.get("customPaymentMethods", [])
    found = False
    for m in custom_methods:
        if m["id"] == method_id:
            m["approved"] = payload.approved
            found = True
            break
    
    if not found:
        raise HTTPException(status_code=404, detail="Método de pago no encontrado")

    await db.campaigns.update_one(
        {"id": campaign_id},
        {"$set": {"customPaymentMethods": custom_methods}}
    )

    updated_c = await db.campaigns.find_one({"id": campaign_id})
    updated_c["id"] = updated_c.get("id") or str(updated_c.get("_id"))
    return CampaignResponse(**updated_c)

# Admin: get stats
@api_router.get("/admin/stats")
async def admin_get_stats():
    cursor = db.campaigns.find()
    campaigns = await cursor.to_list(1000)
    
    total_raised = sum(c.get("current", 0.0) for c in campaigns)
    active_count = sum(1 for c in campaigns if c.get("isActive", True))
    
    pending_count = 0
    for c in campaigns:
        for m in c.get("customPaymentMethods", []):
            if not m.get("approved", False):
                pending_count += 1
                
    donations_count = await db.donations.count_documents({})

    return {
        "totalRaised": total_raised,
        "activeCount": active_count,
        "pendingApprovalsCount": pending_count,
        "donationsCount": donations_count
    }

# Admin: get all donations
@api_router.get("/admin/donations", response_model=List[DonationResponse])
async def admin_get_all_donations():
    cursor = db.donations.find().sort("date", -1)
    donations = await cursor.to_list(1000)
    return [DonationResponse(**d) for d in donations]


# FastAPI-level direct /share endpoint for WhatsApp crawlers when Nginx proxies /share to port 8005!
@app.get("/share/campaign/{campaign_id}", response_class=HTMLResponse)
async def share_campaign_html(campaign_id: str):
    c = await db.campaigns.find_one({"id": campaign_id})
    
    title = "donafacil.app | Recaudación de Fondos"
    description = "Crea una campaña gratuita en minutos, comparte tu historia y recibe el apoyo directo de amigos, familiares y donantes con Zelle y Pago Móvil."
    imageUrl = f"https://donafacil.app/api/campaign-image/{campaign_id}.jpg"
    
    if c:
        title = f"Dona a: {c.get('title')}"
        desc_val = c.get('description', '')
        if len(desc_val) > 150:
            desc_val = desc_val[:150] + "..."
        description = f"{desc_val} Organizado por {c.get('organizer', {}).get('name', 'Vecino Solidario')}. Apóyanos con Zelle y Pago Móvil."
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>{title}</title>
    <meta name="description" content="{description}" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:image" content="{imageUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://donafacil.app/share/campaign/{campaign_id}" />
    <meta property="og:site_name" content="donafacil.app" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="{imageUrl}" />
    <script type="text/javascript">
        // Redirigir de inmediato al navegador a la SPA
        window.location.replace("/campaigns/{campaign_id}");
    </script>
</head>
<body>
    <p>Redirigiendo a la campaña...</p>
</body>
</html>"""
    return HTMLResponse(content=html_content, status_code=200)


# FastAPI-level direct /api/campaign-image/{id}.jpg endpoint for WhatsApp crawler image fetching!
@app.get("/api/campaign-image/{campaign_id}.jpg")
async def share_campaign_image_binary(campaign_id: str):
    c = await db.campaigns.find_one({"id": campaign_id})
    
    if c:
        img_str = c.get("primaryImage") or (c.get("images") and c.get("images")[0])
        if img_str and img_str.startswith("data:image"):
            try:
                # Match and extract base64 data
                matches = re.match(r"^data:([A-Za-z-+\/]+);base64,(.+)$", img_str)
                if matches:
                    content_type = matches.group(1)
                    base64_data = matches.group(2)
                    image_bytes = base64.b64decode(base64_data)
                    return StreamingResponse(io.BytesIO(image_bytes), media_type=content_type)
            except Exception as e:
                logger.error(f"Error decoding base64 image in python: {e}")
        
        # If it is an external URL, redirect to it
        if img_str and img_str.startswith("http"):
            return RedirectResponse(url=img_str)
            
    # Default fallback
    return RedirectResponse(url="https://img.icons8.com/color/120/000000/hearts.png")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
