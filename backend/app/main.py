import os
import time
import math
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional, Dict
from urllib.parse import urlparse
from datetime import datetime

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup
import requests
from sqlmodel import Session, select

# --- TUODAAN UUDET TIEDOSTOT ---
from .database import create_db_and_tables, get_session
from .models import Lead as DBLead  # Nimetään uudelleen erottamaan Pydantic-mallista

# --- CONFIGURATION ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "") # Muista asettaa tämä!

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Agency Hunter CRM", version="2.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE STARTUP ---
@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    logger.info("Database initialized.")

# --- DATA MODELS (API) ---
# Tämä on se malli, jota käytetään, kun Frontend lähettää liidin tallennettavaksi
class LeadCreate(BaseModel):
    name: str
    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    google_place_id: Optional[str] = None
    status: str = "new"
    source: str = "manual"

# --- GOOGLE SEARCH HELPERS (Säilytetään vanhat) ---
# (Lyhennetty GooglePlacesService ja WebsiteAnalyzer luettavuuden vuoksi, 
#  mutta nämä ovat samat logiikat kuin aiemmin)
class GooglePlacesService:
    def __init__(self, api_key: str):
        self.key = api_key
        self.base_url = "https://maps.googleapis.com/maps/api/place"

    def search(self, query: str, type_str: str) -> List[Dict]:
        if not self.key: return []
        url = f"{self.base_url}/textsearch/json"
        params = {"query": f"{query} {type_str}", "key": self.key}
        try:
            res = requests.get(url, params=params)
            return res.json().get("results", [])
        except Exception as e:
            logger.error(f"Google API Error: {e}")
            return []

# --- ENDPOINTS ---

# 1. GOOGLE HAKU (Vanha toiminnallisuus)
@app.get("/leads/search")
async def search_leads(
    business_type: str = Query(..., description="e.g. autokorjaamo"),
    city: str = Query(..., description="e.g. Tampere")
):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfigured: No API Key")

    service = GooglePlacesService(GOOGLE_API_KEY)
    results = service.search(city, business_type)
    
    # Muutetaan tulokset yksinkertaiseen muotoon
    leads = []
    for r in results:
        leads.append({
            "name": r.get("name"),
            "address": r.get("formatted_address"),
            "place_id": r.get("place_id"),
            "rating": r.get("rating"),
            "types": r.get("types")
        })
    return leads

# 2. TALLENNA LIIDI (Uusi ominaisuus!)
@app.post("/leads/", response_model=DBLead)
async def create_lead(lead: LeadCreate, session: Session = Depends(get_session)):
    # Tarkistetaan, onko liidi jo olemassa (google_place_id perusteella)
    if lead.google_place_id:
        existing_lead = session.exec(select(DBLead).where(DBLead.google_place_id == lead.google_place_id)).first()
        if existing_lead:
            raise HTTPException(status_code=400, detail="Lead already exists")

    db_lead = DBLead.from_orm(lead)
    session.add(db_lead)
    session.commit()
    session.refresh(db_lead)
    return db_lead

# 3. HAE OMAT LIIDIT (CRM)
@app.get("/leads/", response_model=List[DBLead])
async def read_leads(session: Session = Depends(get_session)):
    leads = session.exec(select(DBLead)).all()
    return leads

# 4. PÄIVITÄ LIIDIN TILA (Esim. "new" -> "contacted")
@app.patch("/leads/{lead_id}")
async def update_lead(lead_id: int, lead_update: Dict, session: Session = Depends(get_session)):
    db_lead = session.get(DBLead, lead_id)
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Päivitetään kentät
    for key, value in lead_update.items():
        setattr(db_lead, key, value)
    
    db_lead.updated_at = datetime.utcnow()
    session.add(db_lead)
    session.commit()
    session.refresh(db_lead)
    return db_lead

# 5. POISTA LIIDI
@app.delete("/leads/{lead_id}")
async def delete_lead(lead_id: int, session: Session = Depends(get_session)):
    lead = session.get(DBLead, lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    session.delete(lead)
    session.commit()
    return {"ok": True}