import os
import time
import math
import logging
import asyncio
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Optional, Dict, Set, Tuple
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from bs4 import BeautifulSoup

# --- CONFIGURATION & SAFETY LIMITS ---

# 1. API Key Setup
# Option A: Export in terminal (Best practice) -> export GOOGLE_MAPS_API_KEY="AIza..."
# Option B: Paste here for quick testing (Don't commit to GitHub!)
GOOGLE_API_KEY = "AIzaSy...SINUN_PITKÄ_AVAIMESI_TÄHÄN"
# GOOGLE_API_KEY = "PASTE_YOUR_KEY_HERE_IF_TESTING_LOCALLY"

# 2. HARD SAFETY LIMITS (DEV MODE)
# Keeps you within the $200 free tier easily.
MAX_GRID_POINTS_SAFETY = 9   # Max 3x3 grid. Prevents scanning huge areas.
MAX_RESULTS_SAFETY = 200      # Stop searching after finding this many unique leads.
GRID_RADIUS_METERS = 2000    # 2km radius per scan
MAX_WORKERS_WEBSITE = 5      # Low concurrency to be gentle on CPU/Net

# Google Places API Endpoints
BASE_URL = "https://maps.googleapis.com/maps/api/place"
TEXT_SEARCH_URL = f"{BASE_URL}/textsearch/json"
NEARBY_SEARCH_URL = f"{BASE_URL}/nearbysearch/json"
DETAILS_URL = f"{BASE_URL}/details/json"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"

# Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Google Maps Lead Miner (Safety Mode)", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MAPPINGS ---

TYPE_MAPPING = {
    "autokorjaamo": "car_repair",
    "autohuolto": "car_repair",
    "kampaamo": "hair_care",
    "parturi": "hair_care",
    "kauneushoitola": "beauty_salon",
    "hammaslääkäri": "dentist",
    "ravintola": "restaurant",
    "tilitoimisto": "accounting",
    "lakitoimisto": "lawyer",
    "kiinteistönvälitys": "real_estate_agency",
    "kuntosali": "gym",
    "apteekki": "pharmacy"
}

# --- DATA MODELS ---

class Lead(BaseModel):
    id: int
    name: str
    place_id: str
    types: List[str]
    address: str
    phone: Optional[str] = None
    website: Optional[str] = None
    status: str
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    discovery_method: str

# --- HELPER CLASSES ---

class GooglePlacesService:
    def __init__(self, api_key: str):
        self.key = api_key

    def _make_request(self, url: str, params: Dict) -> Dict:
        """Wrapper for API requests with basic error handling."""
        if not self.key:
            logger.error("No API Key provided.")
            return {}
            
        params["key"] = self.key
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Google API Error: {e}")
            return {}

    def get_city_bounds(self, city_name: str) -> Optional[Dict]:
        """Resolves a city name to a viewport (Bounding Box)."""
        data = self._make_request(GEOCODE_URL, {"address": f"{city_name}, Finland"})
        if not data.get("results"):
            return None
        
        geometry = data["results"][0]["geometry"]
        location = geometry["location"]
        
        viewport = geometry.get("viewport", {
            "northeast": {"lat": location["lat"] + 0.05, "lng": location["lng"] + 0.05},
            "southwest": {"lat": location["lat"] - 0.05, "lng": location["lng"] - 0.05}
        })
        return viewport

    def generate_grid(self, bounds: Dict) -> List[Dict]:
        """
        Generates a grid of points, heavily restricted by MAX_GRID_POINTS_SAFETY.
        """
        ne = bounds["northeast"]
        sw = bounds["southwest"]

        lat_min, lat_max = sw["lat"], ne["lat"]
        lng_min, lng_max = sw["lng"], ne["lng"]

        # Approximate degrees per meter (Finland)
        lat_step = (GRID_RADIUS_METERS * 1.5) / 111000
        lng_step = (GRID_RADIUS_METERS * 1.5) / 55000

        grid_points = []
        curr_lat = lat_min
        
        # Grid Generation Loop
        while curr_lat < lat_max:
            curr_lng = lng_min
            while curr_lng < lng_max:
                grid_points.append(f"{curr_lat},{curr_lng}")
                curr_lng += lng_step
            curr_lat += lat_step

        # --- SAFETY ENFORCEMENT ---
        total_points = len(grid_points)
        if total_points > MAX_GRID_POINTS_SAFETY:
            logger.warning(f"⚠️ SAFETY LIMIT: Reducing grid from {total_points} to {MAX_GRID_POINTS_SAFETY} points.")
            # Take the center points (usually most relevant) rather than just the first ones
            start = max(0, int(total_points/2) - int(MAX_GRID_POINTS_SAFETY/2))
            return grid_points[start : start + MAX_GRID_POINTS_SAFETY]
            
        return grid_points

    def search_place_pagination(self, url: str, params: Dict) -> List[Dict]:
        """
        Handles pagination (Next Page Token).
        Safety: Limit to 2 pages max in Dev mode.
        """
        all_results = []
        next_token = None
        
        # Max 2 pages per search in dev mode (40 results max per query)
        for _ in range(4): 
            if next_token:
                params["pagetoken"] = next_token
                time.sleep(2) # Mandatory Google delay

            data = self._make_request(url, params)
            results = data.get("results", [])
            all_results.extend(results)
            
            next_token = data.get("next_page_token")
            if not next_token:
                break
        
        return all_results

    def get_place_details(self, place_id: str) -> Dict:
        """Fetches details. Requesting only specific fields saves cost/data."""
        fields = "name,formatted_address,formatted_phone_number,website,url,types,rating,user_ratings_total"
        params = {"place_id": place_id, "fields": fields}
        data = self._make_request(DETAILS_URL, params)
        return data.get("result", {})

class WebsiteAnalyzer:
    @staticmethod
    def check_url(url: str) -> str:
        if not url: return "NO WEBSITE 🔴"
        
        domain = urlparse(url).netloc.lower()
        if any(social in domain for social in ["facebook", "instagram", "linkedin", "tori.fi"]):
            return "SOCIAL ONLY 🟡"

        if not url.startswith("http"): url = f"http://{url}"

        try:
            headers = {'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)'}
            response = requests.get(url, headers=headers, timeout=5)
            
            if response.status_code >= 400: return "BROKEN WEBSITE 🔴"

            soup = BeautifulSoup(response.text, 'html.parser')
            title = soup.title.string.lower() if soup.title else ""
            if "iis windows" in title or "under construction" in title: return "BROKEN WEBSITE 🔴"

            viewport = soup.find("meta", attrs={"name": "viewport"})
            if viewport: return "MOBILE FRIENDLY 🟢"
            
            return "NOT MOBILE OPTIMIZED 🟠"
        except Exception:
            return "BROKEN WEBSITE 🔴"

# --- CORE LOGIC ---

@app.get("/leads", response_model=List[Lead])
async def get_leads(
    business_type: str = Query(..., description="e.g. autokorjaamo"),
    city: str = Query(..., description="e.g. Tampere")
):
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfigured: No API Key")

    service = GooglePlacesService(GOOGLE_API_KEY)
    
    # 0. Setup
    google_type = TYPE_MAPPING.get(business_type.lower())
    search_query = f"{business_type} in {city}"
    logger.info(f"--- STARTING SAFETY SEARCH: {search_query} ---")
    
    unique_places: Dict[str, Dict] = {}
    
    # --- PHASE 1: TEXT SEARCH ---
    logger.info("PHASE 1: Text Search...")
    params = {"query": search_query}
    if google_type: params["type"] = google_type
    
    text_results = service.search_place_pagination(TEXT_SEARCH_URL, params)
    
    for p in text_results:
        unique_places[p["place_id"]] = p
        p["_discovery"] = "Text Search"
        
    logger.info(f"Phase 1 found {len(text_results)} results.")

    # --- SAFETY CHECK ---
    # If we already have enough results from Text Search, SKIP GRID SEARCH to save money
    if len(unique_places) >= MAX_RESULTS_SAFETY:
        logger.info(f"⚠️ SAFETY LIMIT REACHED ({len(unique_places)}). Skipping Grid Search.")
    else:
        # --- PHASE 2: GRID NEARBY SEARCH ---
        logger.info("PHASE 2: Grid Search...")
        bounds = service.get_city_bounds(city)
        
        if bounds:
            grid_points = service.generate_grid(bounds)
            logger.info(f"Grid generated: {len(grid_points)} points.")

            for i, point in enumerate(grid_points):
                # SAFETY EXIT
                if len(unique_places) >= MAX_RESULTS_SAFETY:
                    logger.info("⚠️ Max results reached during grid scan. Stopping early.")
                    break

                params = {
                    "location": point,
                    "radius": GRID_RADIUS_METERS,
                    "keyword": business_type
                }
                if google_type: params["type"] = google_type

                grid_results = service.search_place_pagination(NEARBY_SEARCH_URL, params)
                
                for p in grid_results:
                    if p["place_id"] not in unique_places:
                        p["_discovery"] = "Grid Search"
                        unique_places[p["place_id"]] = p
                
                logger.info(f"Grid {i+1}/{len(grid_points)} done. Total unique: {len(unique_places)}")

    # --- PHASE 3: ENRICHMENT ---
    final_leads_data = []
    
    def fetch_details_wrapper(pid):
        base_data = unique_places[pid]
        details = service.get_place_details(pid)
        base_data.update(details)
        return base_data

    logger.info("PHASE 3: Fetching Details...")
    # Reduce workers for safety
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(fetch_details_wrapper, pid) for pid in unique_places.keys()]
        for future in as_completed(futures):
            try:
                final_leads_data.append(future.result())
            except Exception: pass

    # --- PHASE 4: WEBSITE ANALYSIS ---
    logger.info("PHASE 4: Analyzing Websites...")
    output_leads = []
    
    with ThreadPoolExecutor(max_workers=MAX_WORKERS_WEBSITE) as executor:
        future_to_lead = {
            executor.submit(WebsiteAnalyzer.check_url, lead.get("website")): lead 
            for lead in final_leads_data
        }
        
        id_counter = 1
        for future in as_completed(future_to_lead):
            lead_data = future_to_lead[future]
            status = future.result()
            
            output_leads.append(Lead(
                id=id_counter,
                name=lead_data.get("name", "Unknown"),
                place_id=lead_data.get("place_id", ""),
                types=lead_data.get("types", []),
                address=lead_data.get("formatted_address") or lead_data.get("vicinity", ""),
                phone=lead_data.get("formatted_phone_number"),
                website=lead_data.get("website"),
                status=status,
                rating=lead_data.get("rating"),
                user_ratings_total=lead_data.get("user_ratings_total"),
                discovery_method=lead_data.get("_discovery", "Unknown")
            ))
            id_counter += 1

    # Sorting
    output_leads.sort(key=lambda x: 0 if "NO WEBSITE" in x.status else 1)
    
    return output_leads