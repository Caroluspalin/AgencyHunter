from sqlmodel import SQLModel, create_engine, Session

# Tämä luo agency.db -tiedoston samaan kansioon
SQLITE_FILE_NAME = "agency.db"
sqlite_url = f"sqlite:///{SQLITE_FILE_NAME}"

# Luodaan yhteysmoottori
engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    """Luo tietokantataulut (ajetaan käynnistyksessä)"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Tätä käytetään endpointuissa tietokantayhteyden saamiseksi"""
    with Session(engine) as session:
        yield session