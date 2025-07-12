from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
import asyncio
import base64
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class BookProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    pages: int
    chapters: int
    language: str
    outline: Optional[str] = None
    chapters_content: Optional[dict] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class BookProjectCreate(BaseModel):
    title: str
    description: str
    pages: int
    chapters: int
    language: str

class OutlineRequest(BaseModel):
    project_id: str

class ChapterRequest(BaseModel):
    project_id: str
    chapter_number: int

class ChapterUpdate(BaseModel):
    project_id: str
    chapter_number: int
    content: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "AI Book Writer API"}

@api_router.post("/projects", response_model=BookProject)
async def create_project(project_data: BookProjectCreate):
    """Create a new book project"""
    try:
        project_dict = project_data.dict()
        project_obj = BookProject(**project_dict)
        await db.book_projects.insert_one(project_obj.dict())
        return project_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@api_router.get("/projects", response_model=List[BookProject])
async def get_projects():
    """Get all book projects"""
    try:
        projects = await db.book_projects.find().to_list(1000)
        return [BookProject(**project) for project in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

@api_router.get("/projects/{project_id}", response_model=BookProject)
async def get_project(project_id: str):
    """Get a specific book project"""
    try:
        project = await db.book_projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return BookProject(**project)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching project: {str(e)}")

@api_router.post("/generate-outline")
async def generate_outline(request: OutlineRequest):
    """Generate book outline using Gemini AI"""
    try:
        # Get project details
        project = await db.book_projects.find_one({"id": request.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Initialize Gemini chat
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=f"outline_{project_obj.id}",
            system_message="You are an expert book writing assistant. You create detailed, well-structured book outlines."
        ).with_model("gemini", "gemini-2.0-flash-lite")
        
        # Create detailed prompt for outline generation
        prompt = f"""Create a detailed book outline for the following book:

Title: {project_obj.title}
Description: {project_obj.description}
Target Pages: {project_obj.pages}
Number of Chapters: {project_obj.chapters}
Language: {project_obj.language}

Please create a comprehensive outline that includes:
1. Chapter titles
2. Brief chapter summaries (2-3 sentences each)
3. Key points to cover in each chapter
4. Estimated page distribution

Format the response as a structured outline that's easy to read and edit."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Update project with generated outline
        await db.book_projects.update_one(
            {"id": request.project_id},
            {
                "$set": {
                    "outline": response,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"outline": response, "project_id": request.project_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating outline: {str(e)}")



@api_router.put("/update-chapter")
async def update_chapter(request: ChapterUpdate):
    """Update chapter content"""
    try:
        project = await db.book_projects.find_one({"id": request.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        current_chapters = project.get("chapters_content", {})
        current_chapters[str(request.chapter_number)] = request.content
        
        await db.book_projects.update_one(
            {"id": request.project_id},
            {
                "$set": {
                    "chapters_content": current_chapters,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Chapter updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating chapter: {str(e)}")

@api_router.put("/update-outline")
async def update_outline(request: dict):
    """Update project outline"""
    try:
        project_id = request.get("project_id")
        outline = request.get("outline")
        
        if not project_id or not outline:
            raise HTTPException(status_code=400, detail="Project ID and outline are required")
        
        await db.book_projects.update_one(
            {"id": project_id},
            {
                "$set": {
                    "outline": outline,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Outline updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating outline: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()