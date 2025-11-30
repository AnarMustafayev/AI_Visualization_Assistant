from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import endpoints
from app.api.chat_endpoints import router as chat_router

app = FastAPI(
    title="Data Analizi API",
    description="Azərbaycan dilində sorğuları SQL-ə çevirən və nəticələri qaytaran API",
    version="1.0.0"
)

# CORS enviroinment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Frontend URL-i
    allow_methods=["*"],
    allow_headers=["*"],
)

# API endpoints
app.include_router(endpoints.router, prefix="/api")
app.include_router(chat_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Data Analizi API-nə xoş gəlmisiniz!"}