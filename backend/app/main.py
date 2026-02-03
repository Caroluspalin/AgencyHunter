# backend/app/main.py
from fastapi import FastAPI
from app.core.config import settings

app = FastAPI(title=settings.PROJECT_NAME)

@app.get("/")
def read_root():
    return {"status": "Agency Hunter API is running", "version": "0.1.0"}

@app.get("/api/v1/health")
def health_check():
    return {"status": "healthy"}