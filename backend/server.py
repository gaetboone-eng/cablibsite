from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.environ.get('SECRET_KEY', 'cablib-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    rpps_number: str
    profession: str
    user_type: str  # "locataire", "proprietaire", or "admin"
    # Optional matching preferences
    preferred_city: Optional[str] = None
    max_budget: Optional[int] = None
    min_size: Optional[int] = None
    preferred_structure_type: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    first_name: str
    last_name: str
    rpps_number: str
    profession: str
    user_type: str
    created_at: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class ListingCreate(BaseModel):
    title: str
    city: str
    address: str
    structure_type: str  # "MSP" or "Cabinet"
    size: int  # in m²
    monthly_rent: int
    description: str
    photos: List[str] = []
    professionals_present: List[str] = []
    profiles_searched: List[str] = []
    is_featured: bool = False

class Listing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    title: str
    city: str
    address: str
    structure_type: str
    size: int
    monthly_rent: int
    description: str
    photos: List[str]
    professionals_present: List[str]
    profiles_searched: List[str]
    owner_id: str
    is_featured: bool
    created_at: str

class FavoriteCreate(BaseModel):
    listing_id: str

class Favorite(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    listing_id: str
    created_at: str

class AlertCreate(BaseModel):
    name: str
    city: Optional[str] = None
    radius: Optional[int] = None
    structure_type: Optional[str] = None
    profession: Optional[str] = None
    max_rent: Optional[int] = None
    min_size: Optional[int] = None

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    name: str
    city: Optional[str]
    radius: Optional[int]
    structure_type: Optional[str]
    profession: Optional[str]
    max_rent: Optional[int]
    min_size: Optional[int]
    active: bool
    created_at: str
    last_checked: Optional[str]

class VisitCreate(BaseModel):
    listing_id: str
    date: str
    time: str
    message: Optional[str] = None

class Visit(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    listing_id: str
    practitioner_id: str
    practitioner_name: str
    practitioner_email: str
    practitioner_profession: str
    owner_id: str
    date: str
    time: str
    message: Optional[str]
    status: str  # "pending", "confirmed", "cancelled"
    created_at: str

class DocumentUpload(BaseModel):
    filename: str
    file_type: str
    file_size: int

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    file_url: str
    uploaded_at: str

class MatchResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    listing: Listing
    score: int
    reasons: List[str]

# Matching Algorithm
def calculate_match_score(user: dict, listing: dict) -> tuple[int, List[str]]:
    """
    Calculate compatibility score between a practitioner and a listing
    Returns: (score out of 100, list of matching reasons)
    """
    score = 0
    reasons = []
    
    # 1. Geographic match (30 points)
    # For now, exact city match. Could be enhanced with distance calculation
    if listing.get("city", "").lower() == user.get("preferred_city", "").lower():
        score += 30
        reasons.append(f"Localisation : {listing['city']}")
    
    # 2. Budget match (25 points)
    user_budget = user.get("max_budget", 0)
    listing_rent = listing.get("monthly_rent", 0)
    if user_budget > 0 and listing_rent > 0:
        if listing_rent <= user_budget:
            budget_diff = abs(listing_rent - user_budget) / user_budget
            if budget_diff <= 0.2:  # Within 20%
                score += 25
                reasons.append(f"Budget adapté : {listing_rent}€/mois")
            elif budget_diff <= 0.5:
                score += 15
                reasons.append(f"Budget acceptable : {listing_rent}€/mois")
    
    # 3. Profession match (20 points)
    user_profession = user.get("profession", "").lower()
    profiles_searched = [p.lower() for p in listing.get("profiles_searched", [])]
    if user_profession and any(user_profession in prof or prof in user_profession for prof in profiles_searched):
        score += 20
        reasons.append(f"Profil recherché : {user.get('profession')}")
    
    # 4. Structure type match (15 points)
    user_pref_structure = user.get("preferred_structure_type", "")
    listing_structure = listing.get("structure_type", "")
    if user_pref_structure and user_pref_structure == listing_structure:
        score += 15
        reasons.append(f"Type de structure : {listing_structure}")
    elif not user_pref_structure:
        score += 10  # Partial points if no preference
    
    # 5. Size match (10 points)
    user_min_size = user.get("min_size", 0)
    listing_size = listing.get("size", 0)
    if user_min_size > 0 and listing_size >= user_min_size:
        score += 10
        reasons.append(f"Surface suffisante : {listing_size}m²")
    
    return score, reasons

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Auth routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate RPPS (simple 11 digit validation)
    if not user_data.rpps_number.isdigit() or len(user_data.rpps_number) != 11:
        raise HTTPException(status_code=400, detail="Invalid RPPS number (must be 11 digits)")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "first_name": user_data.first_name,
        "last_name": user_data.last_name,
        "rpps_number": user_data.rpps_number,
        "profession": user_data.profession,
        "user_type": user_data.user_type,
        "preferred_city": user_data.preferred_city,
        "max_budget": user_data.max_budget,
        "min_size": user_data.min_size,
        "preferred_structure_type": user_data.preferred_structure_type,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create token
    access_token = create_access_token(data={"sub": user_id})
    
    user_response = User(
        id=user_id,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        rpps_number=user_data.rpps_number,
        profession=user_data.profession,
        user_type=user_data.user_type,
        created_at=user_doc["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    
    user_response = User(
        id=user["id"],
        email=user["email"],
        first_name=user["first_name"],
        last_name=user["last_name"],
        rpps_number=user["rpps_number"],
        profession=user["profession"],
        user_type=user["user_type"],
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: dict = Depends(get_current_user)):
    return User(**current_user)

# Listings routes
@api_router.post("/listings", response_model=Listing)
async def create_listing(listing_data: ListingCreate, current_user: dict = Depends(get_current_user)):
    if current_user["user_type"] != "proprietaire":
        raise HTTPException(status_code=403, detail="Only proprietaires can create listings")
    
    listing_id = str(uuid.uuid4())
    listing_doc = {
        "id": listing_id,
        "owner_id": current_user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        **listing_data.model_dump()
    }
    await db.listings.insert_one(listing_doc)
    
    return Listing(**listing_doc)

@api_router.get("/listings", response_model=List[Listing])
async def get_listings(
    city: Optional[str] = None,
    structure_type: Optional[str] = None,
    min_size: Optional[int] = None,
    max_rent: Optional[int] = None,
    profession: Optional[str] = None
):
    query = {}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if structure_type:
        query["structure_type"] = structure_type
    if min_size:
        query["size"] = {"$gte": min_size}
    if max_rent:
        query["monthly_rent"] = {"$lte": max_rent}
    if profession:
        query["profiles_searched"] = {"$regex": profession, "$options": "i"}
    
    listings = await db.listings.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Listing(**listing) for listing in listings]

@api_router.get("/listings/{listing_id}", response_model=Listing)
async def get_listing(listing_id: str):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return Listing(**listing)

@api_router.put("/listings/{listing_id}", response_model=Listing)
async def update_listing(
    listing_id: str,
    listing_data: ListingCreate,
    current_user: dict = Depends(get_current_user)
):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = listing_data.model_dump()
    await db.listings.update_one({"id": listing_id}, {"$set": update_data})
    
    updated_listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    return Listing(**updated_listing)

@api_router.delete("/listings/{listing_id}")
async def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.listings.delete_one({"id": listing_id})
    return {"message": "Listing deleted"}

# Favorites routes
@api_router.post("/favorites", response_model=Favorite)
async def add_favorite(favorite_data: FavoriteCreate, current_user: dict = Depends(get_current_user)):
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": current_user["id"],
        "listing_id": favorite_data.listing_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already in favorites")
    
    favorite_id = str(uuid.uuid4())
    favorite_doc = {
        "id": favorite_id,
        "user_id": current_user["id"],
        "listing_id": favorite_data.listing_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.favorites.insert_one(favorite_doc)
    
    return Favorite(**favorite_doc)

@api_router.get("/favorites", response_model=List[Favorite])
async def get_favorites(current_user: dict = Depends(get_current_user)):
    favorites = await db.favorites.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    return [Favorite(**fav) for fav in favorites]

@api_router.delete("/favorites/{listing_id}")
async def remove_favorite(listing_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.favorites.delete_one({
        "user_id": current_user["id"],
        "listing_id": listing_id
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"message": "Favorite removed"}

# Matching routes
@api_router.get("/matches", response_model=List[MatchResult])
async def get_matches(current_user: dict = Depends(get_current_user)):
    """Get recommended listings based on user profile with compatibility scores"""
    if current_user.get("user_type") != "locataire":
        raise HTTPException(status_code=403, detail="Only practitioners can access matches")
    
    # Get all active listings
    listings = await db.listings.find({}, {"_id": 0}).to_list(100)
    
    # Calculate scores for each listing
    matches = []
    for listing in listings:
        score, reasons = calculate_match_score(current_user, listing)
        if score > 0:  # Only include listings with some match
            matches.append({
                "listing": Listing(**listing),
                "score": score,
                "reasons": reasons
            })
    
    # Sort by score descending
    matches.sort(key=lambda x: x["score"], reverse=True)
    
    return [MatchResult(**match) for match in matches]

@api_router.get("/matches/top")
async def get_top_matches(limit: int = 3, current_user: dict = Depends(get_current_user)):
    """Get top N matched listings for dashboard"""
    if current_user.get("user_type") != "locataire":
        raise HTTPException(status_code=403, detail="Only practitioners can access matches")
    
    listings = await db.listings.find({}, {"_id": 0}).to_list(100)
    
    matches = []
    for listing in listings:
        score, reasons = calculate_match_score(current_user, listing)
        if score > 0:
            matches.append({
                "listing": Listing(**listing),
                "score": score,
                "reasons": reasons
            })
    
    matches.sort(key=lambda x: x["score"], reverse=True)
    
    return [MatchResult(**match) for match in matches[:limit]]

# Alert routes
@api_router.post("/alerts", response_model=Alert)
async def create_alert(alert_data: AlertCreate, current_user: dict = Depends(get_current_user)):
    """Create a new search alert"""
    if current_user.get("user_type") != "locataire":
        raise HTTPException(status_code=403, detail="Only practitioners can create alerts")
    
    alert_id = str(uuid.uuid4())
    alert_doc = {
        "id": alert_id,
        "user_id": current_user["id"],
        "name": alert_data.name,
        "city": alert_data.city,
        "radius": alert_data.radius,
        "structure_type": alert_data.structure_type,
        "profession": alert_data.profession,
        "max_rent": alert_data.max_rent,
        "min_size": alert_data.min_size,
        "active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_checked": None
    }
    await db.alerts.insert_one(alert_doc)
    
    return Alert(**alert_doc)

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(current_user: dict = Depends(get_current_user)):
    """Get user's alerts"""
    if current_user.get("user_type") != "locataire":
        raise HTTPException(status_code=403, detail="Only practitioners can access alerts")
    
    alerts = await db.alerts.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [Alert(**alert) for alert in alerts]

@api_router.get("/alerts/{alert_id}/matches")
async def get_alert_matches(alert_id: str, current_user: dict = Depends(get_current_user)):
    """Get new listings matching this alert"""
    alert = await db.alerts.find_one({"id": alert_id, "user_id": current_user["id"]}, {"_id": 0})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Get listings created after alert creation
    alert_created = datetime.fromisoformat(alert["created_at"])
    
    # Build query from alert criteria
    query = {}
    if alert.get("city"):
        query["city"] = {"$regex": alert["city"], "$options": "i"}
    if alert.get("structure_type"):
        query["structure_type"] = alert["structure_type"]
    if alert.get("max_rent"):
        query["monthly_rent"] = {"$lte": alert["max_rent"]}
    if alert.get("min_size"):
        query["size"] = {"$gte": alert["min_size"]}
    if alert.get("profession"):
        query["profiles_searched"] = {"$regex": alert["profession"], "$options": "i"}
    
    listings = await db.listings.find(query, {"_id": 0}).to_list(100)
    
    # Filter listings created after alert
    new_listings = []
    for listing in listings:
        listing_created = datetime.fromisoformat(listing.get("created_at", alert_created.isoformat()))
        if listing_created > alert_created:
            new_listings.append(listing)
    
    return {
        "alert": Alert(**alert),
        "new_listings_count": len(new_listings),
        "listings": [Listing(**l) for l in new_listings]
    }

@api_router.put("/alerts/{alert_id}")
async def update_alert(alert_id: str, active: bool, current_user: dict = Depends(get_current_user)):
    """Toggle alert active status"""
    result = await db.alerts.update_one(
        {"id": alert_id, "user_id": current_user["id"]},
        {"$set": {"active": active}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    return Alert(**alert)

@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, current_user: dict = Depends(get_current_user)):
    """Delete an alert"""
    result = await db.alerts.delete_one({"id": alert_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert deleted"}

# Visit routes
@api_router.post("/visits", response_model=Visit)
async def create_visit(visit_data: VisitCreate, current_user: dict = Depends(get_current_user)):
    """Request a visit for a listing"""
    if current_user.get("user_type") != "locataire":
        raise HTTPException(status_code=403, detail="Only practitioners can request visits")
    
    # Get listing to find owner
    listing = await db.listings.find_one({"id": visit_data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    visit_id = str(uuid.uuid4())
    visit_doc = {
        "id": visit_id,
        "listing_id": visit_data.listing_id,
        "practitioner_id": current_user["id"],
        "practitioner_name": f"{current_user['first_name']} {current_user['last_name']}",
        "practitioner_email": current_user["email"],
        "practitioner_profession": current_user["profession"],
        "owner_id": listing["owner_id"],
        "date": visit_data.date,
        "time": visit_data.time,
        "message": visit_data.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.visits.insert_one(visit_doc)
    
    return Visit(**visit_doc)

@api_router.get("/visits/practitioner")
async def get_practitioner_visits(current_user: dict = Depends(get_current_user)):
    """Get visits requested by practitioner"""
    visits = await db.visits.find({"practitioner_id": current_user["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return [Visit(**visit) for visit in visits]

@api_router.get("/visits/owner")
async def get_owner_visits(current_user: dict = Depends(get_current_user)):
    """Get visit requests for owner's listings"""
    if current_user.get("user_type") != "proprietaire":
        raise HTTPException(status_code=403, detail="Only owners can access this")
    
    visits = await db.visits.find({"owner_id": current_user["id"]}, {"_id": 0}).sort("date", 1).to_list(100)
    return [Visit(**visit) for visit in visits]

@api_router.put("/visits/{visit_id}/status")
async def update_visit_status(visit_id: str, status: str, current_user: dict = Depends(get_current_user)):
    """Update visit status (confirm/cancel)"""
    visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    
    # Only owner can confirm, both can cancel
    if status == "confirmed" and visit["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Only owner can confirm visits")
    
    await db.visits.update_one({"id": visit_id}, {"$set": {"status": status}})
    updated_visit = await db.visits.find_one({"id": visit_id}, {"_id": 0})
    return Visit(**updated_visit)

@api_router.delete("/visits/{visit_id}")
async def delete_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    """Cancel/delete a visit"""
    result = await db.visits.delete_one({
        "id": visit_id,
        "$or": [
            {"practitioner_id": current_user["id"]},
            {"owner_id": current_user["id"]}
        ]
    })
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Visit not found")
    return {"message": "Visit cancelled"}

# Search Log Models
class SearchLogCreate(BaseModel):
    city: Optional[str] = None
    radius: Optional[int] = None
    structure_type: Optional[str] = None
    profession: Optional[str] = None

class SearchLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_email: str
    user_name: str
    user_profession: str
    city: Optional[str]
    radius: Optional[int]
    structure_type: Optional[str]
    profession: Optional[str]
    timestamp: str

class SearchStats(BaseModel):
    total_searches: int
    searches_by_city: dict
    recent_searches: List[SearchLog]

# Search Log routes
@api_router.post("/search-logs", response_model=SearchLog)
async def log_search(search_data: SearchLogCreate, current_user: dict = Depends(get_current_user)):
    log_id = str(uuid.uuid4())
    log_doc = {
        "id": log_id,
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "user_name": f"{current_user['first_name']} {current_user['last_name']}",
        "user_profession": current_user["profession"],
        "city": search_data.city,
        "radius": search_data.radius,
        "structure_type": search_data.structure_type,
        "profession": search_data.profession,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.search_logs.insert_one(log_doc)
    return SearchLog(**log_doc)

@api_router.get("/analytics/searches", response_model=SearchStats)
async def get_search_stats(current_user: dict = Depends(get_current_user)):
    # Only admin can access
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all search logs
    logs = await db.search_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    # Count by city
    searches_by_city = {}
    for log in logs:
        city = log.get("city", "Toutes")
        searches_by_city[city] = searches_by_city.get(city, 0) + 1
    
    return SearchStats(
        total_searches=len(logs),
        searches_by_city=searches_by_city,
        recent_searches=[SearchLog(**log) for log in logs[:50]]
    )

@api_router.get("/analytics/searches-by-city/{city}")
async def get_searches_by_city(city: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("user_type") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = await db.search_logs.find({"city": {"$regex": city, "$options": "i"}}, {"_id": 0}).sort("timestamp", -1).to_list(100)
    return {"city": city, "count": len(logs), "searches": [SearchLog(**log) for log in logs]}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()