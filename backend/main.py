from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Tipper API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ContactMessage(BaseModel):
    name: str
    email: str
    message: str


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/contact")
def contact(payload: ContactMessage):
    # In production this would send an email
    return {"success": True, "message": f"Thanks {payload.name}, we'll be in touch!"}
