import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("Starting Magic Garden Backend")

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import asyncio
import time

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME')

if not MONGO_URL or not DB_NAME:
    logger.error("MONGO_URL and DB_NAME environment variables are required")
    raise ValueError("MONGO_URL and DB_NAME environment variables are required")

logger.info("Connecting to MongoDB at %s", MONGO_URL)
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# JWT settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'magic-garden-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

security = HTTPBearer()

# Psychologist registration code
PSYCHOLOGIST_CODE = "1100-3245-8888-9012"
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== MODELS ==============

class ChildCreate(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""

    @field_validator('first_name', 'last_name', 'middle_name', mode='before')
    @classmethod
    def truncate_name(cls, v):
        if v and len(v) > 100:
            return v[:100]
        return v

class Child(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    first_name: str
    last_name: str
    middle_name: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PsychologistCreate(BaseModel):
    login: str
    password: str
    name: str
    code: str

class PsychologistLogin(BaseModel):
    login: str
    password: str

class Psychologist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    login: str
    password_hash: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameResultCreate(BaseModel):
    child_id: str
    game_type: str  # shapes, colors, puzzles, matryoshka, odd_one_out, find_pair, memory, absurdity
    score: int = Field(ge=0)
    max_score: int = Field(ge=1)
    level: str  # high, medium, low
    details: Optional[dict] = {}

    @field_validator('score')
    @classmethod
    def score_not_exceed_max(cls, v, info):
        max_s = info.data.get('max_score')
        if max_s is not None and v > max_s:
            return max_s
        return v

class GameResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    child_id: str
    game_type: str
    score: int
    max_score: int
    level: str
    details: Optional[dict] = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    psychologist_name: str

# ============== HELPERS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_psychologist(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        psychologist_id = payload.get("sub")
        if psychologist_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return psychologist_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============== ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Magic Garden Diagnostics API"}

# ----- CHILD ROUTES -----

@api_router.post("/child/register", response_model=Child)
async def register_child(input: ChildCreate):
    # Check if child already exists
    existing = await db.children.find_one({
        "first_name": input.first_name,
        "last_name": input.last_name,
        "middle_name": input.middle_name or ""
    }, {"_id": 0})
    
    if existing:
        return Child(**existing)
    
    child = Child(
        first_name=input.first_name,
        last_name=input.last_name,
        middle_name=input.middle_name or ""
    )
    
    doc = child.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.children.insert_one(doc)
    
    return child

@api_router.get("/children", response_model=List[Child])
async def get_children():
    children = await db.children.find({}, {"_id": 0}).to_list(1000)
    for child in children:
        if isinstance(child.get('created_at'), str):
            child['created_at'] = datetime.fromisoformat(child['created_at'])
    return children

# ----- PSYCHOLOGIST ROUTES -----

@api_router.post("/psychologist/register", response_model=dict)
async def register_psychologist(input: PsychologistCreate):
    if input.code != PSYCHOLOGIST_CODE:
        raise HTTPException(status_code=403, detail="Неверный код психолога")
    
    existing = await db.psychologists.find_one({"login": input.login}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Login already exists")
    
    psychologist = Psychologist(
        login=input.login,
        password_hash=hash_password(input.password),
        name=input.name
    )
    
    doc = psychologist.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.psychologists.insert_one(doc)
    
    return {"message": "Psychologist registered successfully"}

@api_router.post("/psychologist/login", response_model=TokenResponse)
async def login_psychologist(input: PsychologistLogin):
    psychologist = await db.psychologists.find_one({"login": input.login}, {"_id": 0})
    if not psychologist:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(input.password, psychologist['password_hash']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"sub": psychologist['id']})
    
    return TokenResponse(
        access_token=access_token,
        psychologist_name=psychologist['name']
    )

# ----- GAME RESULTS ROUTES -----

@api_router.post("/game/result", response_model=GameResult)
async def save_game_result(input: GameResultCreate):
    # Проверка существования ребёнка
    child = await db.children.find_one({"id": input.child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=400, detail="Ребёнок не найден")

    result = GameResult(
        child_id=input.child_id,
        game_type=input.game_type,
        score=input.score,
        max_score=input.max_score,
        level=input.level,
        details=input.details or {}
    )
    
    doc = result.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.game_results.insert_one(doc)
    
    return result

@api_router.get("/game/results")
async def get_all_results(
    child_id: Optional[str] = None,
    game_type: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    _: str = Depends(get_current_psychologist)
):
    query = {}
    
    if child_id:
        query["child_id"] = child_id
    
    if game_type:
        query["game_type"] = game_type
    
    if date_from or date_to:
        query["created_at"] = {}
        if date_from:
            query["created_at"]["$gte"] = date_from
        if date_to:
            query["created_at"]["$lte"] = date_to + "T23:59:59"
    
    results = await db.game_results.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich with child names
    child_ids = list(set([r['child_id'] for r in results]))
    children = await db.children.find({"id": {"$in": child_ids}}, {"_id": 0}).to_list(1000)
    children_map = {c['id']: c for c in children}
    
    for result in results:
        child = children_map.get(result['child_id'], {})
        result['child_name'] = f"{child.get('last_name', '')} {child.get('first_name', '')} {child.get('middle_name', '')}".strip()
    
    return results

@api_router.get("/game/results/{child_id}")
async def get_child_results(child_id: str):
    results = await db.game_results.find({"child_id": child_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return results

# ----- DELETE ROUTES -----

@api_router.delete("/game/results/all")
async def delete_all_results(_: str = Depends(get_current_psychologist)):
    result = await db.game_results.delete_many({})
    return {"deleted_count": result.deleted_count, "message": "Все результаты удалены"}

@api_router.delete("/game/results/child/{child_id}")
async def delete_child_results(child_id: str, _: str = Depends(get_current_psychologist)):
    result = await db.game_results.delete_many({"child_id": child_id})
    return {"deleted_count": result.deleted_count, "message": f"Результаты ребёнка удалены"}

@api_router.delete("/child/{child_id}")
async def delete_child(child_id: str, _: str = Depends(get_current_psychologist)):
    """Каскадное удаление ребёнка и всех его результатов"""
    child = await db.children.find_one({"id": child_id}, {"_id": 0})
    if not child:
        raise HTTPException(status_code=404, detail="Ребёнок не найден")
    game_del = await db.game_results.delete_many({"child_id": child_id})
    await db.children.delete_one({"id": child_id})
    return {"message": "Ребёнок и все его результаты удалены", "deleted_results": game_del.deleted_count}

@api_router.delete("/game/results/game/{game_type}")
async def delete_game_results(game_type: str, _: str = Depends(get_current_psychologist)):
    result = await db.game_results.delete_many({"game_type": game_type})
    return {"deleted_count": result.deleted_count, "message": f"Результаты игры удалены"}

@api_router.delete("/game/result/{result_id}")
async def delete_single_result(result_id: str, _: str = Depends(get_current_psychologist)):
    result = await db.game_results.delete_one({"id": result_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Result not found")
    return {"message": "Результат удалён"}

@api_router.get("/statistics")
async def get_statistics(_: str = Depends(get_current_psychologist)):
    total_children = await db.children.count_documents({})
    total_sessions = await db.game_results.count_documents({})
    
    # Count by level
    high_count = await db.game_results.count_documents({"level": "high"})
    medium_count = await db.game_results.count_documents({"level": "medium"})
    low_count = await db.game_results.count_documents({"level": "low"})
    
    return {
        "total_children": total_children,
        "total_sessions": total_sessions,
        "by_level": {
            "high": high_count,
            "medium": medium_count,
            "low": low_count
        }
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = time.time() - start
    logger.info("%s %s %s %.3fs", request.method, request.url.path, response.status_code, duration)
    return response

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.on_event("startup")
async def startup():
    for attempt in range(30):
        try:
            await client.admin.command('ping')
            logger.info("MongoDB is ready")
            break
        except Exception:
            logger.warning("Waiting for MongoDB... attempt %d/30", attempt + 1)
            await asyncio.sleep(2)
    else:
        logger.error("MongoDB not available after 30 attempts")
        raise RuntimeError("MongoDB not available")

    logger.info("Creating database indexes...")
    await db.game_results.create_index("child_id")
    await db.game_results.create_index("created_at")
    await db.game_results.create_index("game_type")
    await db.game_results.create_index([("child_id", 1), ("created_at", -1)])
    await db.children.create_index(
        [("last_name", 1), ("first_name", 1), ("middle_name", 1)],
        unique=True
    )
    await db.psychologists.create_index("login", unique=True)
    logger.info("Database indexes created")
