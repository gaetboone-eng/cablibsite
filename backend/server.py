from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import shutil
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import math
import aiofiles

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

# Upload directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# City coordinates for radius search (major French cities)
CITY_COORDINATES = {
    "paris": (48.8566, 2.3522),
    "lyon": (45.7640, 4.8357),
    "marseille": (43.2965, 5.3698),
    "toulouse": (43.6047, 1.4442),
    "nice": (43.7102, 7.2620),
    "nantes": (47.2184, -1.5536),
    "strasbourg": (48.5734, 7.7521),
    "montpellier": (43.6108, 3.8767),
    "bordeaux": (44.8378, -0.5792),
    "lille": (50.6292, 3.0573),
    "rennes": (48.1173, -1.6778),
    "reims": (49.2583, 4.0317),
    "saint-etienne": (45.4397, 4.3872),
    "toulon": (43.1242, 5.9280),
    "grenoble": (45.1885, 5.7245),
    "dijon": (47.3220, 5.0415),
    "angers": (47.4784, -0.5632),
    "nimes": (43.8367, 4.3601),
    "clermont-ferrand": (45.7772, 3.0870),
    "tours": (47.3941, 0.6848),
    "amiens": (49.8941, 2.2958),
    "limoges": (45.8336, 1.2611),
    "metz": (49.1193, 6.1757),
    "besancon": (47.2378, 6.0241),
    "perpignan": (42.6887, 2.8948),
    "orleans": (47.9029, 1.9093),
    "caen": (49.1829, -0.3707),
    "rouen": (49.4432, 1.0993),
    "nancy": (48.6921, 6.1844),
    "avignon": (43.9493, 4.8055),
}

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points on earth (in km)"""
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def get_city_coordinates(city_name: str) -> Optional[tuple]:
    """Get coordinates for a city name"""
    if not city_name:
        return None
    normalized = city_name.lower().strip().replace("-", " ").replace("saint", "st")
    # Try exact match first
    if normalized in CITY_COORDINATES:
        return CITY_COORDINATES[normalized]
    # Try partial match
    for city, coords in CITY_COORDINATES.items():
        if normalized in city or city in normalized:
            return coords
    return None

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

# Application (candidature) model
class ApplicationCreate(BaseModel):
    listing_id: str
    message: Optional[str] = None

class Application(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    user_email: str
    user_profession: str
    listing_id: str
    listing_title: str
    message: Optional[str]
    status: str  # "pending", "accepted", "rejected"
    documents: List[Document]
    created_at: str
    updated_at: str

# Message models for real-time messaging
class MessageCreate(BaseModel):
    receiver_id: str
    listing_id: Optional[str] = None
    content: str

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sender_id: str
    sender_name: str
    sender_email: str
    receiver_id: str
    receiver_name: str
    receiver_email: str
    listing_id: Optional[str]
    listing_title: Optional[str]
    content: str
    read: bool
    created_at: str

class Conversation(BaseModel):
    model_config = ConfigDict(extra="ignore")
    other_user_id: str
    other_user_name: str
    other_user_email: str
    listing_id: Optional[str]
    listing_title: Optional[str]
    last_message: str
    last_message_date: str
    unread_count: int

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
    profession: Optional[str] = None,
    radius: Optional[int] = None  # Radius in km
):
    query = {}
    
    # If radius search is requested
    if city and radius and radius > 0:
        center_coords = get_city_coordinates(city)
        if center_coords:
            # Get all listings and filter by distance
            all_listings = await db.listings.find({}, {"_id": 0}).to_list(500)
            filtered_listings = []
            
            for listing in all_listings:
                listing_coords = get_city_coordinates(listing.get("city", ""))
                if listing_coords:
                    distance = haversine_distance(
                        center_coords[0], center_coords[1],
                        listing_coords[0], listing_coords[1]
                    )
                    if distance <= radius:
                        # Apply other filters
                        if structure_type and listing.get("structure_type") != structure_type:
                            continue
                        if min_size and listing.get("size", 0) < min_size:
                            continue
                        if max_rent and listing.get("monthly_rent", 0) > max_rent:
                            continue
                        if profession:
                            profiles = listing.get("profiles_searched", [])
                            if not any(profession.lower() in p.lower() for p in profiles):
                                continue
                        listing["distance_km"] = round(distance, 1)
                        filtered_listings.append(listing)
            
            # Sort by distance
            filtered_listings.sort(key=lambda x: x.get("distance_km", 999))
            return [Listing(**listing) for listing in filtered_listings]
    
    # Standard search without radius
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

@api_router.post("/listings/{listing_id}/view")
async def track_listing_view(listing_id: str, user_id: Optional[str] = None):
    """Track a view on a listing for statistics"""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    view_doc = {
        "id": str(uuid.uuid4()),
        "listing_id": listing_id,
        "user_id": user_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.listing_views.insert_one(view_doc)
    return {"message": "View tracked"}

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

# ==================== OWNER STATISTICS ROUTES ====================

@api_router.get("/owner/stats")
async def get_owner_statistics(current_user: dict = Depends(get_current_user)):
    """Get overall statistics for a property owner"""
    if current_user.get("user_type") != "proprietaire":
        raise HTTPException(status_code=403, detail="Only owners can access statistics")
    
    owner_id = current_user["id"]
    
    # Get owner's listings
    listings = await db.listings.find({"owner_id": owner_id}, {"_id": 0}).to_list(50)
    listing_ids = [l["id"] for l in listings]
    
    # Calculate stats
    total_views = await db.listing_views.count_documents({"listing_id": {"$in": listing_ids}})
    
    # Messages received (as owner)
    total_contacts = await db.messages.count_documents({"receiver_id": owner_id})
    
    # Favorites on owner's listings
    total_favorites = await db.favorites.count_documents({"listing_id": {"$in": listing_ids}})
    
    # Applications received
    total_applications = await db.applications.count_documents({"listing_id": {"$in": listing_ids}})
    
    # Visits scheduled
    total_visits = await db.visits.count_documents({"listing_id": {"$in": listing_ids}})
    
    # Last 30 days stats
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    views_30d = await db.listing_views.count_documents({
        "listing_id": {"$in": listing_ids},
        "timestamp": {"$gte": thirty_days_ago}
    })
    contacts_30d = await db.messages.count_documents({
        "receiver_id": owner_id,
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # Per listing stats
    listings_stats = []
    for listing in listings:
        lid = listing["id"]
        listing_views = await db.listing_views.count_documents({"listing_id": lid})
        listing_favorites = await db.favorites.count_documents({"listing_id": lid})
        listing_contacts = await db.messages.count_documents({
            "receiver_id": owner_id,
            "listing_id": lid
        })
        listing_applications = await db.applications.count_documents({"listing_id": lid})
        listing_visits = await db.visits.count_documents({"listing_id": lid})
        
        # Views in last 7 days
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        views_7d = await db.listing_views.count_documents({
            "listing_id": lid,
            "timestamp": {"$gte": seven_days_ago}
        })
        
        listings_stats.append({
            "listing_id": lid,
            "title": listing.get("title", ""),
            "city": listing.get("city", ""),
            "monthly_rent": listing.get("monthly_rent", 0),
            "created_at": listing.get("created_at", ""),
            "stats": {
                "total_views": listing_views,
                "views_7d": views_7d,
                "favorites": listing_favorites,
                "contacts": listing_contacts,
                "applications": listing_applications,
                "visits_scheduled": listing_visits
            }
        })
    
    return {
        "summary": {
            "total_listings": len(listings),
            "total_views": total_views,
            "total_contacts": total_contacts,
            "total_favorites": total_favorites,
            "total_applications": total_applications,
            "total_visits": total_visits,
            "views_30d": views_30d,
            "contacts_30d": contacts_30d,
            "conversion_rate": round((total_contacts / total_views * 100), 1) if total_views > 0 else 0
        },
        "listings": listings_stats
    }

@api_router.get("/owner/stats/{listing_id}")
async def get_listing_statistics(listing_id: str, current_user: dict = Depends(get_current_user)):
    """Get detailed statistics for a specific listing"""
    if current_user.get("user_type") != "proprietaire":
        raise HTTPException(status_code=403, detail="Only owners can access statistics")
    
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not your listing")
    
    owner_id = current_user["id"]
    
    # Get all views for this listing
    views = await db.listing_views.find({"listing_id": listing_id}, {"_id": 0}).sort("timestamp", -1).to_list(1000)
    
    # Calculate daily views for last 30 days
    daily_views = {}
    for i in range(30):
        day = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        daily_views[day] = 0
    
    for view in views:
        day = view["timestamp"][:10]
        if day in daily_views:
            daily_views[day] += 1
    
    # Sort by date
    views_chart = [{"date": k, "views": v} for k, v in sorted(daily_views.items())]
    
    # Other stats
    total_views = len(views)
    favorites = await db.favorites.count_documents({"listing_id": listing_id})
    contacts = await db.messages.count_documents({"receiver_id": owner_id, "listing_id": listing_id})
    applications = await db.applications.count_documents({"listing_id": listing_id})
    visits = await db.visits.count_documents({"listing_id": listing_id})
    
    # Calculate averages in the area (simple estimation)
    city_listings = await db.listings.find({"city": listing["city"]}, {"_id": 0}).to_list(50)
    avg_rent = sum([l.get("monthly_rent", 0) for l in city_listings]) / len(city_listings) if city_listings else 0
    
    return {
        "listing": {
            "id": listing_id,
            "title": listing.get("title", ""),
            "city": listing.get("city", ""),
            "monthly_rent": listing.get("monthly_rent", 0)
        },
        "stats": {
            "total_views": total_views,
            "favorites": favorites,
            "contacts": contacts,
            "applications": applications,
            "visits_scheduled": visits,
            "conversion_rate": round((contacts / total_views * 100), 1) if total_views > 0 else 0
        },
        "views_chart": views_chart,
        "insights": {
            "avg_rent_in_city": round(avg_rent),
            "price_vs_average": "above" if listing.get("monthly_rent", 0) > avg_rent else "below"
        }
    }

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

# ==================== LISTING PHOTO UPLOAD ====================

# Create listing photos directory
LISTING_PHOTOS_DIR = ROOT_DIR / "listing_photos"
LISTING_PHOTOS_DIR.mkdir(exist_ok=True)

@api_router.post("/listings/upload-photo")
async def upload_listing_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a photo for a listing"""
    if current_user.get("user_type") != "proprietaire":
        raise HTTPException(status_code=403, detail="Only owners can upload listing photos")
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé. JPEG, PNG, WebP uniquement.")
    
    # Validate file size (max 5MB)
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5MB)")
    
    # Generate unique filename
    photo_id = str(uuid.uuid4())
    extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    new_filename = f"{photo_id}.{extension}"
    file_path = LISTING_PHOTOS_DIR / new_filename
    
    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    
    # Return the URL
    photo_url = f"/api/listing-photos/{new_filename}"
    
    return {
        "id": photo_id,
        "filename": new_filename,
        "url": photo_url,
        "size": len(content)
    }

@api_router.get("/listing-photos/{filename}")
async def get_listing_photo(filename: str):
    """Serve a listing photo"""
    file_path = LISTING_PHOTOS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Photo non trouvée")
    
    # Determine content type
    extension = filename.split(".")[-1].lower()
    content_types = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "webp": "image/webp"
    }
    content_type = content_types.get(extension, "image/jpeg")
    
    return FileResponse(
        path=file_path,
        media_type=content_type
    )

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

# ==================== DOCUMENT UPLOAD ROUTES ====================

@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a document (CV, diplôme, attestation, etc.)"""
    # Validate file type
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Type de fichier non autorisé. PDF, JPEG, PNG uniquement.")
    
    # Validate file size (max 10MB)
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 10MB)")
    
    # Create user directory
    user_dir = UPLOAD_DIR / current_user["id"]
    user_dir.mkdir(exist_ok=True)
    
    # Generate unique filename
    doc_id = str(uuid.uuid4())
    extension = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    new_filename = f"{doc_id}.{extension}"
    file_path = user_dir / new_filename
    
    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)
    
    # Save document metadata
    doc = {
        "id": doc_id,
        "user_id": current_user["id"],
        "filename": new_filename,
        "original_filename": file.filename,
        "file_type": file.content_type,
        "file_size": len(content),
        "file_url": f"/api/documents/{doc_id}/download",
        "uploaded_at": datetime.now(timezone.utc).isoformat()
    }
    await db.documents.insert_one(doc)
    
    return Document(**doc)

@api_router.get("/documents", response_model=List[Document])
async def get_user_documents(current_user: dict = Depends(get_current_user)):
    """Get all documents uploaded by the current user"""
    docs = await db.documents.find({"user_id": current_user["id"]}, {"_id": 0}).sort("uploaded_at", -1).to_list(50)
    return [Document(**doc) for doc in docs]

@api_router.get("/documents/{doc_id}/download")
async def download_document(doc_id: str):
    """Download a document"""
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    file_path = UPLOAD_DIR / doc["user_id"] / doc["filename"]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    return FileResponse(
        path=file_path,
        filename=doc["original_filename"],
        media_type=doc["file_type"]
    )

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a document"""
    doc = await db.documents.find_one({"id": doc_id, "user_id": current_user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document non trouvé")
    
    # Delete file
    file_path = UPLOAD_DIR / current_user["id"] / doc["filename"]
    if file_path.exists():
        file_path.unlink()
    
    # Delete from DB
    await db.documents.delete_one({"id": doc_id})
    return {"message": "Document supprimé"}

# ==================== APPLICATION (CANDIDATURE) ROUTES ====================

@api_router.post("/applications")
async def create_application(
    app_data: ApplicationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new application for a listing"""
    if current_user.get("user_type") != "locataire":
        raise HTTPException(status_code=403, detail="Seuls les locataires peuvent postuler")
    
    # Check listing exists
    listing = await db.listings.find_one({"id": app_data.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Annonce non trouvée")
    
    # Check if already applied
    existing = await db.applications.find_one({
        "user_id": current_user["id"],
        "listing_id": app_data.listing_id
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà postulé à cette annonce")
    
    # Get user's documents
    user_docs = await db.documents.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(20)
    
    app_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    application = {
        "id": app_id,
        "user_id": current_user["id"],
        "user_name": f"{current_user['first_name']} {current_user['last_name']}",
        "user_email": current_user["email"],
        "user_profession": current_user["profession"],
        "listing_id": app_data.listing_id,
        "listing_title": listing["title"],
        "message": app_data.message,
        "status": "pending",
        "documents": [Document(**doc).model_dump() for doc in user_docs],
        "created_at": now,
        "updated_at": now
    }
    await db.applications.insert_one(application)
    
    return Application(**application)

@api_router.get("/applications/mine")
async def get_my_applications(current_user: dict = Depends(get_current_user)):
    """Get applications submitted by the current user"""
    apps = await db.applications.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [Application(**app) for app in apps]

@api_router.get("/applications/received")
async def get_received_applications(current_user: dict = Depends(get_current_user)):
    """Get applications received for owner's listings"""
    if current_user.get("user_type") != "proprietaire":
        raise HTTPException(status_code=403, detail="Seuls les propriétaires peuvent voir les candidatures")
    
    # Get owner's listings
    listings = await db.listings.find({"owner_id": current_user["id"]}, {"_id": 0}).to_list(100)
    listing_ids = [l["id"] for l in listings]
    
    # Get applications for these listings
    apps = await db.applications.find({"listing_id": {"$in": listing_ids}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [Application(**app) for app in apps]

@api_router.put("/applications/{app_id}/status")
async def update_application_status(
    app_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    """Update application status (accept/reject)"""
    if status not in ["accepted", "rejected", "pending"]:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    application = await db.applications.find_one({"id": app_id}, {"_id": 0})
    if not application:
        raise HTTPException(status_code=404, detail="Candidature non trouvée")
    
    # Check if user owns the listing
    listing = await db.listings.find_one({"id": application["listing_id"]}, {"_id": 0})
    if not listing or listing["owner_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.applications.update_one(
        {"id": app_id},
        {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    updated = await db.applications.find_one({"id": app_id}, {"_id": 0})
    return Application(**updated)

# ==================== MESSAGING ROUTES ====================

@api_router.post("/messages", response_model=Message)
async def send_message(msg_data: MessageCreate, current_user: dict = Depends(get_current_user)):
    """Send a message to another user"""
    # Get receiver info
    receiver = await db.users.find_one({"id": msg_data.receiver_id}, {"_id": 0})
    if not receiver:
        raise HTTPException(status_code=404, detail="Destinataire non trouvé")
    
    # Get listing info if provided
    listing_title = None
    if msg_data.listing_id:
        listing = await db.listings.find_one({"id": msg_data.listing_id}, {"_id": 0})
        if listing:
            listing_title = listing["title"]
    
    msg_id = str(uuid.uuid4())
    message = {
        "id": msg_id,
        "sender_id": current_user["id"],
        "sender_name": f"{current_user['first_name']} {current_user['last_name']}",
        "sender_email": current_user["email"],
        "receiver_id": msg_data.receiver_id,
        "receiver_name": f"{receiver['first_name']} {receiver['last_name']}",
        "receiver_email": receiver["email"],
        "listing_id": msg_data.listing_id,
        "listing_title": listing_title,
        "content": msg_data.content,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message)
    
    return Message(**message)

@api_router.get("/messages/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations for the current user"""
    user_id = current_user["id"]
    
    # Get all messages involving this user
    messages = await db.messages.find({
        "$or": [{"sender_id": user_id}, {"receiver_id": user_id}]
    }, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    # Group by conversation (other user + listing)
    conversations = {}
    for msg in messages:
        other_id = msg["receiver_id"] if msg["sender_id"] == user_id else msg["sender_id"]
        other_name = msg["receiver_name"] if msg["sender_id"] == user_id else msg["sender_name"]
        other_email = msg["receiver_email"] if msg["sender_id"] == user_id else msg["sender_email"]
        listing_id = msg.get("listing_id")
        
        conv_key = f"{other_id}_{listing_id or 'general'}"
        
        if conv_key not in conversations:
            conversations[conv_key] = {
                "other_user_id": other_id,
                "other_user_name": other_name,
                "other_user_email": other_email,
                "listing_id": listing_id,
                "listing_title": msg.get("listing_title"),
                "last_message": msg["content"],
                "last_message_date": msg["created_at"],
                "unread_count": 0
            }
        
        # Count unread messages
        if msg["receiver_id"] == user_id and not msg["read"]:
            conversations[conv_key]["unread_count"] += 1
    
    return [Conversation(**conv) for conv in conversations.values()]

@api_router.get("/messages/conversation/{other_user_id}")
async def get_conversation_messages(
    other_user_id: str,
    listing_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get messages in a specific conversation"""
    user_id = current_user["id"]
    
    query = {
        "$or": [
            {"sender_id": user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": user_id}
        ]
    }
    
    if listing_id:
        query["listing_id"] = listing_id
    
    messages = await db.messages.find(query, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    # Mark messages as read
    await db.messages.update_many(
        {"receiver_id": user_id, "sender_id": other_user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return [Message(**msg) for msg in messages]

@api_router.get("/messages/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get total unread message count"""
    count = await db.messages.count_documents({
        "receiver_id": current_user["id"],
        "read": False
    })
    return {"unread_count": count}

@api_router.put("/messages/{msg_id}/read")
async def mark_message_read(msg_id: str, current_user: dict = Depends(get_current_user)):
    """Mark a message as read"""
    result = await db.messages.update_one(
        {"id": msg_id, "receiver_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    return {"message": "Message marqué comme lu"}

# ==================== OWNER INFO ROUTE ====================

@api_router.get("/users/{user_id}/public")
async def get_user_public_info(user_id: str):
    """Get public info about a user (for messaging)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    return {
        "id": user["id"],
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "profession": user.get("profession", ""),
        "user_type": user["user_type"]
    }

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