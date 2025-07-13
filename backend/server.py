from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, StreamingResponse
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
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor
from docx import Document
from docx.shared import Inches
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.shared import OxmlElement, qn
import re
from html import unescape

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
    writing_style: str = "story"  # "story" or "descriptive"
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
    writing_style: str = "story"  # "story" or "descriptive"

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
        
        # Create detailed prompt for outline generation based on writing style
        if project_obj.writing_style == "story":
            style_instructions = """Create a story-focused outline that:
- Focuses on narrative flow and character development
- Avoids excessive sub-chapters or technical divisions
- Emphasizes plot progression and story arcs
- Uses engaging, fluid chapter transitions
- Maintains narrative continuity throughout"""
        else:  # descriptive
            style_instructions = """Create a descriptive/informational outline that:
- Uses clear chapter divisions and sub-sections
- Focuses on detailed explanations and analysis
- Includes structured information hierarchy
- Uses informative headings and subheadings
- Organizes content logically for reference"""

        prompt = f"""Create a detailed book outline for the following book:

Title: {project_obj.title}
Description: {project_obj.description}
Target Pages: {project_obj.pages} pages
Number of Chapters: {project_obj.chapters} chapters
Language: {project_obj.language}
Writing Style: {project_obj.writing_style}

{style_instructions}

Please create a comprehensive outline that includes:
1. Chapter titles that fit the {project_obj.writing_style} style
2. Brief chapter summaries (3-4 sentences each)
3. Key points or plot elements for each chapter
4. Estimated word count: {(project_obj.pages * 275) // project_obj.chapters} words per chapter

IMPORTANT: Return the outline in clean, well-formatted HTML with proper spacing:
- Use <h2> for chapter titles
- Use <h3> for any sub-sections (only if descriptive style)
- Use <p> for descriptions and summaries
- Use <ul> and <li> for key points
- Ensure proper spacing between elements

Format the response as structured HTML that's easy to read and edit."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Clean up the response - remove markdown code blocks and improve formatting
        cleaned_response = response.strip()
        
        # Remove various markdown code block patterns
        if cleaned_response.startswith('```html'):
            cleaned_response = cleaned_response[7:]
        elif cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        
        # Remove any remaining markdown artifacts
        cleaned_response = cleaned_response.replace('```html', '').replace('```', '')
        cleaned_response = cleaned_response.strip()
        
        # Ensure proper line spacing for readability
        cleaned_response = cleaned_response.replace('\n\n\n', '\n\n')  # Remove excessive line breaks
        cleaned_response = cleaned_response.replace('\n', '\n\n')  # Add proper paragraph spacing
        
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



@api_router.post("/generate-chapter")
async def generate_chapter(request: ChapterRequest):
    """Generate a specific chapter using Gemini AI"""
    try:
        # Get project details
        project = await db.book_projects.find_one({"id": request.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        if not project_obj.outline:
            raise HTTPException(status_code=400, detail="Project must have an outline before generating chapters")
        
        # Initialize Gemini chat for this chapter
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=f"chapter_{project_obj.id}_{request.chapter_number}",
            system_message="You are an expert book writer. You write engaging, well-structured chapters based on outlines. Use HTML formatting for headings, bold text, and structure."
        ).with_model("gemini", "gemini-2.0-flash-lite")
        
        # Calculate estimated words per chapter (250-300 words per page)
        estimated_words_per_chapter = (project_obj.pages * 275) // project_obj.chapters
        
        # Create style-specific prompt for chapter generation
        if project_obj.writing_style == "story":
            style_instructions = """Write in a fluid, narrative style that:
- Focuses on storytelling and character development
- Uses natural dialogue and descriptive prose
- Maintains narrative flow without excessive sub-headings
- Creates immersive scenes and situations
- Keeps the reader engaged with the story progression
- Uses minimal structural breaks within chapters"""
            
            formatting_instructions = """Use minimal HTML formatting for story flow:
- <p> for paragraphs (the main content)
- <em> for emphasis or thoughts
- <strong> for important dialogue or key moments
- Avoid excessive <h2> or <h3> tags within chapters
- Focus on smooth paragraph transitions"""
        else:  # descriptive
            style_instructions = """Write in a descriptive, informational style that:
- Provides detailed explanations and analysis
- Uses clear structure and organization
- Includes examples and case studies when relevant
- Maintains an informative and engaging tone
- Breaks down complex topics into digestible sections"""
            
            formatting_instructions = """Use structured HTML formatting:
- <h2> for main section headings within chapters
- <h3> for subsection headings
- <p> for paragraphs
- <ul> and <li> for bullet points and lists
- <strong> for key terms and concepts
- <em> for emphasis"""

        # Create prompt for chapter generation
        prompt = f"""Write Chapter {request.chapter_number} for the following book:

Title: {project_obj.title}
Description: {project_obj.description}
Language: {project_obj.language}
Writing Style: {project_obj.writing_style}
Target Length: {estimated_words_per_chapter} words (this is important - write substantial content!)

{style_instructions}

Book Outline:
{project_obj.outline}

Please write a complete, engaging chapter that:
1. Follows the outline for Chapter {request.chapter_number}
2. Contains approximately {estimated_words_per_chapter} words (aim for 250-300 words per page)
3. Maintains the {project_obj.writing_style} style throughout
4. Is written in {project_obj.language}
5. Has compelling content that advances the book's purpose

{formatting_instructions}

Focus specifically on Chapter {request.chapter_number} content. Write substantial, engaging content that meets the word count requirement."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Clean up the response - remove markdown code blocks and improve formatting
        cleaned_response = response.strip()
        
        # Remove various markdown code block patterns
        if cleaned_response.startswith('```html'):
            cleaned_response = cleaned_response[7:]
        elif cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        
        # Remove any remaining markdown artifacts
        cleaned_response = cleaned_response.replace('```html', '').replace('```', '')
        cleaned_response = cleaned_response.strip()
        
        # Ensure proper HTML formatting with better spacing
        cleaned_response = cleaned_response.replace('<p>', '\n<p>').replace('</p>', '</p>\n\n')
        cleaned_response = cleaned_response.replace('<h1>', '\n\n<h1>').replace('</h1>', '</h1>\n\n')
        cleaned_response = cleaned_response.replace('<h2>', '\n\n<h2>').replace('</h2>', '</h2>\n\n')
        cleaned_response = cleaned_response.replace('<h3>', '\n\n<h3>').replace('</h3>', '</h3>\n\n')
        cleaned_response = cleaned_response.replace('<ul>', '\n<ul>').replace('</ul>', '</ul>\n\n')
        cleaned_response = cleaned_response.replace('<li>', '\n  <li>').replace('</li>', '</li>')
        
        # Clean up excessive line breaks
        cleaned_response = cleaned_response.replace('\n\n\n\n', '\n\n\n')
        cleaned_response = cleaned_response.replace('\n\n\n\n', '\n\n')
        cleaned_response = cleaned_response.strip()
        
        # Update project with the generated chapter
        current_chapters = project.get("chapters_content", {})
        current_chapters[str(request.chapter_number)] = cleaned_response
        
        await db.book_projects.update_one(
            {"id": request.project_id},
            {
                "$set": {
                    "chapters_content": current_chapters,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "chapter_content": cleaned_response,
            "chapter_number": request.chapter_number,
            "project_id": request.project_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating chapter: {str(e)}")


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
        estimated_words_per_chapter = (project_obj.pages * 275) // project_obj.chapters
        
        # Create style-specific instructions
        if project_obj.writing_style == "story":
            style_instructions = """Write in a fluid, narrative style that:
- Focuses on storytelling and character development
- Uses natural dialogue and descriptive prose
- Maintains narrative flow without excessive sub-headings
- Creates immersive scenes and situations
- Keeps the reader engaged with the story progression
- Uses minimal structural breaks within chapters"""
            
            formatting_instructions = """Use minimal HTML formatting for story flow:
- <p> for paragraphs (the main content)
- <em> for emphasis or thoughts
- <strong> for important dialogue or key moments
- Avoid excessive <h2> or <h3> tags within chapters
- Focus on smooth paragraph transitions"""
        else:  # descriptive
            style_instructions = """Write in a descriptive, informational style that:
- Provides detailed explanations and analysis
- Uses clear structure and organization
- Includes examples and case studies when relevant
- Maintains an informative and engaging tone
- Breaks down complex topics into digestible sections"""
            
            formatting_instructions = """Use structured HTML formatting:
- <h2> for main section headings within chapters
- <h3> for subsection headings
- <p> for paragraphs
- <ul> and <li> for bullet points and lists
- <strong> for key terms and concepts
- <em> for emphasis"""
        
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
Writing Style: {project_obj.writing_style}
Target Length: {estimated_words_per_chapter} words (this is important - write substantial content!)

{style_instructions}

Book Outline:
{project_obj.outline}

Please write a complete, engaging chapter that:
1. Follows the outline for Chapter {chapter_num}
2. Contains approximately {estimated_words_per_chapter} words (aim for 250-300 words per page)
3. Maintains the {project_obj.writing_style} style throughout
4. Is written in {project_obj.language}
5. Has compelling content that advances the book's purpose

{formatting_instructions}

Focus specifically on Chapter {chapter_num} content. Write substantial, engaging content that meets the word count requirement."""

                user_message = UserMessage(text=prompt)
                response = await chat.send_message(user_message)
                
                # Clean up the response - remove markdown code blocks and improve formatting
                cleaned_response = response.strip()
                
                # Remove various markdown code block patterns
                if cleaned_response.startswith('```html'):
                    cleaned_response = cleaned_response[7:]
                elif cleaned_response.startswith('```'):
                    cleaned_response = cleaned_response[3:]
                
                if cleaned_response.endswith('```'):
                    cleaned_response = cleaned_response[:-3]
                
                # Remove any remaining markdown artifacts
                cleaned_response = cleaned_response.replace('```html', '').replace('```', '')
                cleaned_response = cleaned_response.strip()
                
                # Ensure proper HTML formatting with better spacing
                cleaned_response = cleaned_response.replace('<p>', '\n<p>').replace('</p>', '</p>\n\n')
                cleaned_response = cleaned_response.replace('<h1>', '\n\n<h1>').replace('</h1>', '</h1>\n\n')
                cleaned_response = cleaned_response.replace('<h2>', '\n\n<h2>').replace('</h2>', '</h2>\n\n')
                cleaned_response = cleaned_response.replace('<h3>', '\n\n<h3>').replace('</h3>', '</h3>\n\n')
                cleaned_response = cleaned_response.replace('<ul>', '\n<ul>').replace('</ul>', '</ul>\n\n')
                cleaned_response = cleaned_response.replace('<li>', '\n  <li>').replace('</li>', '</li>')
                
                # Clean up excessive line breaks
                cleaned_response = cleaned_response.replace('\n\n\n\n', '\n\n\n')
                cleaned_response = cleaned_response.replace('\n\n\n\n', '\n\n')
                cleaned_response = cleaned_response.strip()
                
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
    """Export book as HTML with proper formatting"""
    try:
        project = await db.book_projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Create well-formatted HTML content
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{project_obj.title}</title>
    <style>
        body {{
            font-family: Georgia, serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.8;
            color: #333;
            background-color: #fff;
        }}
        
        h1 {{
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 15px;
            margin-bottom: 30px;
            font-size: 2.5em;
        }}
        
        h2 {{
            color: #34495e;
            margin-top: 40px;
            margin-bottom: 20px;
            font-size: 1.8em;
        }}
        
        h3 {{
            color: #7f8c8d;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 1.4em;
        }}
        
        p {{
            margin-bottom: 20px;
            text-align: justify;
            text-indent: 30px;
        }}
        
        .book-info {{
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 40px;
            border-left: 5px solid #3498db;
        }}
        
        .book-info h1 {{
            border-bottom: none;
            margin-bottom: 20px;
            color: #2c3e50;
        }}
        
        .book-info p {{
            margin-bottom: 10px;
            text-indent: 0;
        }}
        
        .outline {{
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            border-left: 5px solid #28a745;
        }}
        
        .chapter {{
            margin-bottom: 60px;
            padding: 20px 0;
            border-bottom: 1px solid #e9ecef;
            page-break-after: always;
        }}
        
        .chapter:last-child {{
            border-bottom: none;
        }}
        
        .chapter h2 {{
            color: #2c3e50;
            font-size: 2em;
            margin-bottom: 25px;
        }}
        
        ul {{
            margin-bottom: 20px;
            padding-left: 40px;
        }}
        
        li {{
            margin-bottom: 8px;
            line-height: 1.6;
        }}
        
        strong {{
            color: #2c3e50;
        }}
        
        em {{
            color: #7f8c8d;
        }}
        
        @media print {{
            body {{
                padding: 20px;
            }}
            .chapter {{
                page-break-after: always;
            }}
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
        <p><strong>Generated On:</strong> {datetime.now().strftime("%B %d, %Y")}</p>
    </div>
    
    <div class="outline">
        <h2>📖 Book Outline</h2>
        <div>{project_obj.outline or "No outline available"}</div>
    </div>
    
    <div class="chapters">
        <h2>📚 Chapters</h2>"""
        
        # Add chapters with proper formatting
        if project_obj.chapters_content:
            for i in range(1, project_obj.chapters + 1):
                chapter_content = project_obj.chapters_content.get(str(i), "")
                if chapter_content:
                    html_content += f"""
        <div class="chapter">
            <h2>Chapter {i}</h2>
            {chapter_content}
        </div>"""
                else:
                    html_content += f"""
        <div class="chapter">
            <h2>Chapter {i}</h2>
            <p><em>This chapter has not been generated yet.</em></p>
        </div>"""
        else:
            html_content += "<p><em>No chapters have been generated yet.</em></p>"
        
        html_content += """
    </div>
    
    <div style="text-align: center; margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <p><em>Generated with AI Book Writer</em></p>
    </div>
</body>
</html>"""
        
        # Create safe filename
        safe_filename = "".join(c for c in project_obj.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_filename = safe_filename.replace(' ', '_')
        if not safe_filename:
            safe_filename = f"book_{project_obj.id}"
        
        return {
            "html": html_content,
            "title": project_obj.title,
            "filename": f"{safe_filename}.html"
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