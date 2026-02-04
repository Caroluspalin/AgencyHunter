# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
import requests
from bs4 import BeautifulSoup
import time
import logging

# Asetetaan lokitus
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# --- SANAKIRJA: Suomi -> OpenStreetMap Tagit ---
# Tämä muuttaa hakusanasi tietokantahauksi
KEYWORD_MAPPING = {
    "autokorjaamo": ['["shop"="car_repair"]', '["craft"="car_repair"]', '["service"="vehicle:repair"]'],
    "autohuolto": ['["shop"="car_repair"]'],
    "kampaamo": ['["shop"="hairdresser"]'],
    "parturi": ['["shop"="hairdresser"]'],
    "hammaslääkäri": ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
    "ravintola": ['["amenity"="restaurant"]'],
    "pizzeria": ['["cuisine"="pizza"]'],
    "kahvila": ['["amenity"="cafe"]'],
    "kuntosali": ['["leisure"="fitness_centre"]', '["sport"="fitness"]'],
    "tilitoimisto": ['["office"="accountant"]'],
    "lakitoimisto": ['["office"="lawyer"]'],
    "apteekki": ['["amenity"="pharmacy"]'],
    "kukkakauppa": ['["shop"="florist"]'],
    "kiinteistönvälitys": ['["office"="estate_agent"]']
}

def analyze_website(url: str):
    """Crawler: Tarkistaa nettisivun tilan."""
    try:
        if not url: return "NO WEBSITE 🔴"
            
        # Some-sivut
        if any(x in url.lower() for x in ["facebook.com", "instagram.com", "linkedin.com", "tori.fi", "020202", "finder", "fonecta"]):
            return "NO WEBSITE (Social Only) 🔴"

        if not url.startswith("http"): url = "http://" + url

        headers = {'User-Agent': 'AgencyHunterBot/1.0'}
        # Lyhyt timeout, koska tuloksia on nyt paljon
        response = requests.get(url, headers=headers, timeout=4)
        
        if response.status_code != 200: return "Broken Website 🔴"
        
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.title.string if soup.title else ""
        
        if "IIS Windows" in title or "Under Construction" in title: return "Broken Website 🔴"
        
        viewport = soup.find("meta", attrs={"name": "viewport"})
        return "Mobile Friendly 🟢" if viewport else "Not Mobile Optimized 🟡"
            
    except Exception:
        return "Error Loading Site 🟠"

def fetch_mass_data_from_overpass(query):
    """
    Käyttää Overpass API:a massahakuun.
    Tämä löytää KAIKKI kohteet, ei vain muutamaa.
    """
    print(f"📡 Massahaku Overpass API:lla: {query}...")
    
    # 1. Yritetään arvata kaupunki ja toimiala
    parts = query.split()
    city = parts[-1] # Oletetaan että viimeinen sana on kaupunki (esim. "Tampere")
    keyword = parts[0].lower() # Ensimmäinen sana on ala (esim. "Autokorjaamo")
    
    # Etsitään oikea tägi sanakirjasta
    tags = []
    for key, val in KEYWORD_MAPPING.items():
        if key in query.lower():
            tags = val
            break
            
    # Jos ei löydy sanakirjasta, käytetään yleistä nimihakua (vähemmän tarkka)
    if not tags:
        print(f"⚠️ Hakusana '{keyword}' ei ole sanakirjassa, käytetään nimihakua.")
        tags = [f'["name"~"{keyword}",i]'] # i = case insensitive

    # 2. Rakennetaan Overpass QL -kysely
    # "Hae alueelta X kaikki nodet/wayt joilla on tämä tägi"
    tag_query = ""
    for tag in tags:
        tag_query += f"""
          node{tag}(area.searchArea);
          way{tag}(area.searchArea);
          relation{tag}(area.searchArea);
        """

    overpass_query = f"""
    [out:json][timeout:25];
    area["name"="{city}"]->.searchArea;
    (
      {tag_query}
    );
    out center;
    """
    
    url = "https://overpass-api.de/api/interpreter"
    
    try:
        response = requests.post(url, data=overpass_query)
        if response.status_code == 200:
            data = response.json()
            elements = data.get('elements', [])
            print(f"✅ Overpass vastasi: {len(elements)} kohdetta löydetty!")
            return elements
        else:
            print(f"❌ Overpass Virhe: {response.status_code}")
            return []
    except Exception as e:
        print(f"❌ Yhteysvirhe: {e}")
        return []

@app.get("/")
def read_root():
    return {"status": "Agency Hunter API", "version": "OVERPASS MASS MINER"}

@app.get("/leads")
def get_leads(search_term: str = ""):
    if not search_term: return []

    print(f"\n--- MASSALOUHINTA: '{search_term}' ---")
    real_leads = []
    
    # 1. HAE DATA (Overpass)
    raw_results = fetch_mass_data_from_overpass(search_term)

    count = 0
    seen_names = set()

    for place in raw_results:
        # Rajoita analyysi esim. 100:aan ettei kestä ikuisuutta
        if count >= 100: break
        
        # Overpass data on joko 'tags' (node) tai 'tags' (way/center)
        tags = place.get('tags', {})
        name = tags.get('name')
        
        if not name: continue
        if name in seen_names: continue # Estä tuplat
        seen_names.add(name)
        
        # Suodata isot ketjut pois (ei maksa vaivaa)
        forbidden = ["katsastus", "a-katsastus", "r-kioski", "s-market", "k-market", "lidl", "abc", "neste", "shell", "teboil", "veho", "metroauto", "hedin", "autokeskus"]
        if any(bad in name.lower() for bad in forbidden): continue

        # Hae tiedot
        website = tags.get('website') or tags.get('url') or tags.get('contact:website')
        phone = tags.get('phone') or tags.get('contact:phone') or tags.get('contact:mobile')
        
        # Osoite (katu + numero)
        street = tags.get('addr:street', '')
        housenumber = tags.get('addr:housenumber', '')
        address = f"{street} {housenumber}".strip() or "Osoite puuttuu"

        print(f"Analysoidaan [{count+1}]: {name}...")

        # 2. RIKASTUS
        if not website:
            status = "NO WEBSITE 🔴"
            display_url = "Ei verkkosivua"
            if phone:
                name = f"{name} 📞 {phone}" # Näytä numero heti otsikossa
        else:
            status = analyze_website(website)
            display_url = website

        real_leads.append({
            "id": count + 1,
            "name": name,
            "url": display_url,
            "status": status,
            "address": address
        })
        count += 1
        
        # Pieni viive on tärkeä kun käydään sadoilla sivuilla
        if website: time.sleep(0.05)

    # Lajittelu: NO WEBSITE ensin
    real_leads.sort(key=lambda x: "NO WEBSITE" not in x['status'])
    
    if not real_leads:
        print("Ei löytynyt tuloksia. Tarkista että kaupungin nimi on oikein (esim. Tampere).")
        
    return real_leads