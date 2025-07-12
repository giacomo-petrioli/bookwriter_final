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
        
        # Clean up the response - remove markdown code blocks
        cleaned_response = response.strip()
        if cleaned_response.startswith('```html'):
            cleaned_response = cleaned_response[7:]  # Remove ```html
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]  # Remove ```
        cleaned_response = cleaned_response.strip()
        
        # Update project with generated outline
        await db.book_projects.update_one(
            {"id": request.project_id},
            {
                "$set": {
                    "outline": cleaned_response,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {"outline": cleaned_response, "project_id": request.project_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating outline: {str(e)}")



@api_router.post("/generate-all-chapters")
async def generate_all_chapters(request: OutlineRequest):
    """Generate all chapters for a book project using Gemini AI"""
    try:
        # Get project details
        project = await db.book_projects.find_one({"id": request.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        if not project_obj.outline:
            raise HTTPException(status_code=400, detail="Project must have an outline before generating chapters")
        
        # Initialize storage for all chapters
        all_chapters = {}
        estimated_words_per_chapter = (project_obj.pages * 250) // project_obj.chapters
        
        # Generate each chapter sequentially
        for chapter_num in range(1, project_obj.chapters + 1):
            try:
                # Initialize Gemini chat for each chapter
                chat = LlmChat(
                    api_key=os.environ.get('GEMINI_API_KEY'),
                    session_id=f"batch_chapter_{project_obj.id}_{chapter_num}",
                    system_message="You are an expert book writer. You write engaging, well-structured chapters based on outlines. Use HTML formatting for headings, bold text, and structure."
                ).with_model("gemini", "gemini-2.0-flash-lite")
                
                # Create prompt for chapter generation with HTML formatting
                prompt = f"""Write Chapter {chapter_num} for the following book:

Title: {project_obj.title}
Description: {project_obj.description}
Language: {project_obj.language}
Target Length: Approximately {estimated_words_per_chapter} words

Book Outline:
{project_obj.outline}

Please write a complete, engaging chapter using HTML formatting that:
1. Follows the outline structure for Chapter {chapter_num}
2. Is approximately {estimated_words_per_chapter} words
3. Uses HTML tags for formatting:
   - <h1> for chapter titles
   - <h2> for main section headings  
   - <h3> for subsection headings
   - <p> for paragraphs
   - <strong> for bold text
   - <em> for italic text
   - <ul> and <li> for bullet points when appropriate
4. Has a compelling introduction and conclusion
5. Maintains consistent tone and style
6. Is written in {project_obj.language}

Focus specifically on Chapter {chapter_num} content based on the outline. Return properly formatted HTML content."""

                user_message = UserMessage(text=prompt)
                response = await chat.send_message(user_message)
                
                # Clean up the response - remove markdown code blocks and improve formatting
                cleaned_response = response.strip()
                if cleaned_response.startswith('```html'):
                    cleaned_response = cleaned_response[7:]  # Remove ```html
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]  # Remove ```
                cleaned_response = cleaned_response.strip()
                
                # Ensure proper paragraph spacing
                cleaned_response = cleaned_response.replace('<p>', '\n<p>').replace('</p>', '</p>\n')
                cleaned_response = cleaned_response.replace('<h1>', '\n<h1>').replace('</h1>', '</h1>\n')
                cleaned_response = cleaned_response.replace('<h2>', '\n<h2>').replace('</h2>', '</h2>\n')
                cleaned_response = cleaned_response.replace('<h3>', '\n<h3>').replace('</h3>', '</h3>\n')
                
                # Store the chapter
                all_chapters[str(chapter_num)] = cleaned_response
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(1)
                
            except Exception as chapter_error:
                raise HTTPException(status_code=500, detail=f"Error generating chapter {chapter_num}: {str(chapter_error)}")
        
        # Update project with all generated chapters
        await db.book_projects.update_one(
            {"id": request.project_id},
            {
                "$set": {
                    "chapters_content": all_chapters,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "message": f"Successfully generated all {project_obj.chapters} chapters",
            "chapters_generated": len(all_chapters),
            "project_id": request.project_id,
            "chapters": all_chapters
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating all chapters: {str(e)}")

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

@api_router.get("/export-book/{project_id}")
async def export_book(project_id: str):
    """Export book as HTML"""
    try:
        project = await db.book_projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Create HTML content
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{project_obj.title}</title>
    <style>
        body {{
            font-family: Georgia, serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }}
        h1 {{
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }}
        h2 {{
            color: #555;
            margin-top: 30px;
        }}
        h3 {{
            color: #666;
        }}
        .book-info {{
            background: #f5f5f5;
            padding: 20px;
            border-radius: 5px;
            margin-bottom: 30px;
        }}
        .chapter {{
            margin-bottom: 40px;
            page-break-after: always;
        }}
    </style>
</head>
<body>
    <div class="book-info">
        <h1>{project_obj.title}</h1>
        <p><strong>Description:</strong> {project_obj.description}</p>
        <p><strong>Language:</strong> {project_obj.language}</p>
        <p><strong>Chapters:</strong> {project_obj.chapters}</p>
        <p><strong>Target Pages:</strong> {project_obj.pages}</p>
    </div>
    
    <div class="outline">
        <h2>Book Outline</h2>
        {project_obj.outline or "No outline available"}
    </div>
    
    <div class="chapters">
        <h2>Chapters</h2>
"""
        
        # Add chapters
        if project_obj.chapters_content:
            for i in range(1, project_obj.chapters + 1):
                chapter_content = project_obj.chapters_content.get(str(i), "")
                html_content += f"""
        <div class="chapter">
            <h2>Chapter {i}</h2>
            {chapter_content}
        </div>
"""
        else:
            html_content += "<p>No chapters generated yet.</p>"
        
        html_content += """
    </div>
</body>
</html>
"""
        
        return {
            "html": html_content,
            "title": project_obj.title,
            "filename": f"{project_obj.title.replace(' ', '_')}.html"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting book: {str(e)}")

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