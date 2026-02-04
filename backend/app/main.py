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
    print("VIRHE: duckduckgo-search puuttuu. Aja: pip install duckduckgo-search")
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

BACKUP_DATA = [
    {"id": 1, "name": "Ei yhteyttä hakukoneeseen (Backup)", "url": "https://backup.fi", "status": "Needs Fix"},
]

def analyze_website(url: str):
    """Käy sivulla ja tarkistaa onko se mobiiliystävällinen"""
    try:
        # Teeskennellään aitoa selainta (User-Agent)
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code != 200:
            return "Needs Fix (Broken Link)"
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Etsitään viewport-tagia (mobiilioptimoinnin merkki)
        viewport = soup.find("meta", attrs={"name": "viewport"})
        
        if viewport:
            return "Mobile Friendly"
        else:
            return "Needs Fix (Not Mobile Optimized)"
            
    except Exception as e:
        return "Needs Fix (Error Loading)"

@app.get("/")
def read_root():
    return {"status": "Agency Hunter API is running", "mode": "DUCKDUCKGO HUNTER"}

@app.get("/leads")
def get_leads(search_term: str = ""):
    if not search_term:
        return []

    print(f"\n--- HAKU (DDG): '{search_term}' ---")
    
    if DDGS is None:
        return BACKUP_DATA

    real_leads = []
    
    try:
        # Käytetään DuckDuckGo:ta
        with DDGS() as ddgs:
            # Haetaan 10 tulosta
            ddg_results = list(ddgs.text(search_term, max_results=10))
            
        print(f"DuckDuckGo löysi {len(ddg_results)} tulosta.")

        count = 0
        for result in ddg_results:
            if count >= 5: # Otetaan max 5 parasta
                break
                
            url = result['href']
            title = result['title']
            
            # Suodatus (Facebookit yms pois)
            forbidden = ["fonecta", "finder", "facebook", "instagram", "kauppalehti", "asiakastieto", "google", "youtube", "tori.fi", "020202"]
            if any(bad_word in url.lower() for bad_word in forbidden):
                print(f" -> Ohitetaan hakemisto: {title}")
                continue

            print(f" -> Analysoidaan: {title} ({url})")
            
            status = analyze_website(url)
            
            real_leads.append({
                "id": count + 1,
                "name": title,
                "url": url,
                "status": status
            })
            count += 1
            
            # Pieni tauko on kohtelias
            time.sleep(1)
            
    except Exception as e:
        print(f"VIRHE HAUSSA: {e}")
        return BACKUP_DATA

    if not real_leads:
        print("Ei löytynyt sopivia yrityksiä.")
        return BACKUP_DATA
        
    return real_leads