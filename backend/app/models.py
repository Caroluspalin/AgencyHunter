from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime

class Lead(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # Perustiedot
    name: str
    company_name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    
    # Google-data (jotta ei lisätä samaa duplikaattina)
    google_place_id: Optional[str] = Field(default=None, index=True)
    
    # CRM Statukset (Myyntiputki)
    # Vaihtoehdot: "new", "contacted", "meeting", "negotiation", "won", "lost"
    status: str = Field(default="new") 
    
    # Lisätiedot
    notes: Optional[str] = None
    source: str = Field(default="google") # "google", "manual"
    
    # Aikaleimat
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)