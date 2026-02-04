# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import requests
from bs4 import BeautifulSoup
import time
import random

# Tuodaan DuckDuckGo
try:
    from duckduckgo_search import DDGS
except ImportError:
    print("VIRHE: duckduckgo-search puuttuu.")
    DDGS = None

app = FastAPI(title=settings.PROJECT_NAME)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def analyze_website(url: str):
    """Analysoi onko sivu mobiiliystävällinen."""
    try:
        if "facebook.com" in url or "instagram.com" in url:
            return "NO WEBSITE (Social Only) 🔴"

        if not url.startswith("http"):
            url = "http://" + url

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        # Lyhyt timeout
        response = requests.get(url, headers=headers, timeout=4)
        
        if response.status_code != 200:
            return "Broken Website 🔴"
        
        soup = BeautifulSoup(response.text, 'html.parser')
        viewport = soup.find("meta", attrs={"name": "viewport"})
        
        if viewport:
            return "Mobile Friendly 🟢"
        else:
            return "Not Mobile Optimized 🟡"
            
    except Exception:
        return "Error Loading Site 🟠"

@app.get("/")
def read_root():
    return {"status": "Agency Hunter API is running", "mode": "DEEP FILTER HUNTER"}

@app.get("/leads")
def get_leads(search_term: str = ""):
    if not search_term:
        return []

    print(f"\n--- SYVÄHAKU: '{search_term}' ---")
    
    # Erotellaan kaupunki hakusanasta (oletetaan että se on viimeinen sana, esim "Hammaslääkäri Tampere")
    parts = search_term.split()
    city_filter = parts[-1].lower() if len(parts) > 1 else "" # Esim "tampere"
    
    if DDGS is None:
        return []

    real_leads = []
    
    try:
        with DDGS() as ddgs:
            # Haetaan PALJON tuloksia (50), jotta päästään "hyvien" ohi huonoihin
            print(f"Haetaan 50 tulosta DuckDuckGo:sta (fi-fi)...")
            
            # region="fi-fi" pakottaa Suomen
            ddg_results = ddgs.text(search_term, region="fi-fi", max_results=50)
            
            results_list = list(ddg_results)
            print(f" -> Löytyi {len(results_list)} raakatulosta. Aloitetaan suodatus...")

            count = 0
            for result in results_list:
                # Lopetetaan kun meillä on 15 hyvää liidiä (eikä vain 5)
                if count >= 15: 
                    break
                    
                title = result.get('title', 'Tuntematon')
                url = result.get('href', '')
                body = result.get('body', '') # Hakutuloksen kuvausteksti
                
                # --- SUODATIN 1: KAUPUNKI ---
                # Jos hait "Tampere", sanan Tampere on löydyttävä otsikosta tai tekstistä.
                # Tämä estää Helsingin tulokset.
                full_text = (title + " " + body).lower()
                if city_filter and len(city_filter) > 3: # Ei suodateta lyhyitä sanoja
                    if city_filter not in full_text:
                        # print(f"Skipped (Väärä kaupunki): {title}")
                        continue

                # --- SUODATIN 2: KIELLETYT SIVUT ---
                # Nyt sallimme Facebookin, koska se on hyvä liidi!
                forbidden = [
                    "fonecta", "finder", "tori.fi", "020202", 
                    "autojerry", "asiakastieto", "kauppalehti", "yritysopas", 
                    "google", "youtube", "wikipedia", "suomi.fi", "vauva.fi", "terveystalo", "mehilainen"
                ]
                
                # Estetään myös isot ketjut (Terveystalo, Mehiläinen), koska ne eivät ole asiakkaitasi
                if any(bad in (url or "").lower() for bad in forbidden):
                    continue

                # Analysoidaan
                print(f"Analysoidaan: {title} ({url})")
                status = analyze_website(url)
                
                # Jos status on "Mobile Friendly", se on tylsä. 
                # Mutta näytetään silti, jotta lista ei jää tyhjäksi.
                
                real_leads.append({
                    "id": count + 1,
                    "name": title,
                    "url": url,
                    "status": status,
                    "address": "Verkkohaku"
                })
                count += 1
                
                # Pieni tauko (tärkeä kun haetaan paljon)
                time.sleep(0.2)

    except Exception as e:
        print(f"KRIITTINEN VIRHE: {e}")
        return []
    
    if not real_leads:
        print("Ei löytynyt sopivia yrityksiä suodatuksen jälkeen.")
        
    return real_leads