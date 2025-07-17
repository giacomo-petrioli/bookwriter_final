from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends, Header, Request
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContentWithMimeType
import httpx
import secrets
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
from docx.shared import Inches, RGBColor
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.shared import OxmlElement, qn
import re
from html import unescape
from authlib.integrations.starlette_client import OAuth
from authlib.integrations.starlette_client import StarletteOAuth2App
import jwt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Add session middleware for OAuth
app.add_middleware(SessionMiddleware, secret_key=secrets.token_urlsafe(32))

# Setup OAuth
oauth = OAuth()
oauth.register(
    name='google',
    client_id=os.environ['GOOGLE_CLIENT_ID'],
    client_secret=os.environ['GOOGLE_CLIENT_SECRET'],
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class BookProject(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Added user association
    title: str
    description: str
    pages: int
    chapters: int
    language: str
    writing_style: str = "story"  # "story", "descriptive", "academic", "technical", "biography", "self_help", "children", "poetry", "business"
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
    writing_style: str = "story"  # "story", "descriptive", "academic", "technical", "biography", "self_help", "children", "poetry", "business"

class AuthSessionRequest(BaseModel):
    session_id: str

class GoogleTokenRequest(BaseModel):
    token: str

class UserProfile(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None

class OutlineRequest(BaseModel):
    project_id: str

class ChapterRequest(BaseModel):
    project_id: str
    chapter_number: int

class ChapterUpdate(BaseModel):
    project_id: str
    chapter_number: int
    content: str

# Helper function for style-specific instructions
def get_style_instructions(writing_style: str, content_type: str = "outline"):
    """Get style-specific instructions for different writing styles"""
    
    styles = {
        "story": {
            "outline": """Create a story outline that:
- Develops compelling characters with distinct personalities and voices
- Crafts engaging plot points with emotional depth and conflict
- Maintains consistent pacing with varied scene types (dialogue, action, reflection)
- Builds immersive story worlds with vivid settings and atmosphere
- Weaves subplots seamlessly into the main narrative
- Creates emotional resonance through character relationships and growth
- Uses natural scene transitions and chapter hooks
- Balances showing vs. telling throughout the narrative
- Includes opportunities for authentic dialogue and character interaction""",
            "chapter": """Write in a story style that:
- Creates compelling characters with unique voices and speech patterns
- Uses natural, authentic dialogue that reveals character personality
- Balances narrative description with action and conversation
- Shows character emotions through actions and dialogue, not just description
- Includes varied sentence structures and paragraph lengths for natural flow
- Uses specific, sensory details to create vivid scenes
- Alternates between intimate character moments and broader plot advancement
- Incorporates subtext and emotional depth in character interactions
- Uses dialogue to advance plot and reveal character development
- Avoids having characters speak in the same formal register as the narrator
- Includes natural speech patterns, contractions, and conversational rhythms
- Breaks up exposition with engaging dialogue and action sequences""",
            "formatting": """Use story HTML formatting:
- <h2> for chapter titles with evocative, atmospheric names
- <h3> for scene breaks or major story sections
- <p> for narrative paragraphs with varied lengths
- Use frequent paragraph breaks for dialogue and action
- Format dialogue clearly with proper speaker attribution
- <strong> for emphasis and important moments
- <em> for internal thoughts and emphasis
- Structure content with natural scene transitions and pacing"""
        },
        "descriptive": {
            "outline": """Create a structured informational outline that:
- Presents clear topic hierarchies and logical flow
- Breaks down complex concepts systematically
- Incorporates relevant examples and case studies
- Balances depth and accessibility of content
- Uses consistent terminology and definitions
- Provides clear learning objectives per section
- Includes practical applications and insights
- Maintains engaging narrative elements where appropriate
- Balances informative content with readability""",
            "chapter": """Write in a descriptive style that:
- Uses clear, informative language with engaging examples
- Balances detailed explanations with accessible prose
- Includes relevant case studies and real-world applications
- Maintains reader engagement through varied content structure
- Uses natural transitions between concepts and ideas
- Incorporates storytelling elements to illustrate points
- Avoids overly technical jargon without sacrificing accuracy
- Includes dialogue or character examples where relevant
- Structures content for optimal comprehension and retention""",
            "formatting": """Use descriptive HTML formatting:
- <h2> for chapter titles with descriptive, engaging names
- <h3> for major topics or concepts
- <h4> for sub-topics and detailed explanations
- <p> for explanatory paragraphs with varied lengths
- <ul> and <li> for organized lists and key points
- <strong> for important terms and concepts
- <em> for emphasis and examples
- Use clear section breaks and logical content flow"""
        },
        "academic": {
            "outline": """Create an academic/research outline that:
- Follows scholarly structure and methodology
- Includes literature review and theoretical framework
- Presents arguments with supporting evidence
- Uses formal academic language and citations
- Organizes content by research questions or hypotheses
- Includes methodology and analysis sections
- Provides clear research conclusions""",
            "chapter": """Write in an academic style that:
- Uses formal, scholarly language and tone
- Supports arguments with evidence and citations
- Follows academic structure and conventions
- Includes theoretical background and context
- Presents balanced analysis and critical thinking
- Uses appropriate academic terminology
- Maintains objectivity and rigor""",
            "formatting": """Use academic HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for main sections (Introduction, Literature Review, etc.)
- <h4> for subsections
- <p> for paragraphs with academic prose
- <ul> and <li> for structured lists
- <strong> for key concepts and terms
- <em> for emphasis and foreign terms"""
        },
        "technical": {
            "outline": """Create a technical/manual outline that:
- Follows step-by-step instructional structure
- Includes prerequisites and requirements
- Organizes content by procedures or processes
- Uses clear, concise technical language
- Includes troubleshooting and best practices
- Provides practical examples and use cases
- Follows logical workflow sequences""",
            "chapter": """Write in a technical style that:
- Uses clear, precise technical language
- Provides step-by-step instructions
- Includes practical examples and code snippets
- Follows logical procedural flow
- Addresses common issues and solutions
- Uses consistent technical terminology
- Focuses on actionable information""",
            "formatting": """Use technical HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for major procedures or sections
- <h4> for sub-procedures
- <p> for instructions and explanations
- <ul> and <li> for step-by-step lists
- <strong> for important warnings or key points
- <em> for technical terms or variables"""
        },
        "biography": {
            "outline": """Create a biographical outline that:
- Follows chronological or thematic structure
- Focuses on key life events and milestones
- Includes personal background and influences
- Explores character development and growth
- Incorporates historical and cultural context
- Balances personal and professional aspects
- Shows cause-and-effect relationships""",
            "chapter": """Write in a biographical style that:
- Narrates life events with personal insight
- Balances factual information with story elements
- Includes dialogue and personal anecdotes
- Provides historical and cultural context
- Shows character development over time
- Uses engaging narrative techniques
- Maintains respect for the subject""",
            "formatting": """Use biographical HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for major life periods or themes
- <p> for narrative paragraphs
- <ul> and <li> for key achievements or events
- <strong> for important dates and names
- <em> for quotes and personal thoughts"""
        },
        "self_help": {
            "outline": """Create a self-help outline that:
- Focuses on practical advice and actionable steps
- Includes motivational and inspirational content
- Organizes content by problems and solutions
- Uses encouraging and empowering language
- Includes real-life examples and case studies
- Provides exercises and practical applications
- Builds progressive skill development""",
            "chapter": """Write in a self-help style that:
- Uses encouraging, motivational language
- Provides practical, actionable advice
- Includes personal stories and examples
- Addresses common challenges and solutions
- Engages readers with exercises and activities
- Maintains an optimistic, empowering tone
- Focuses on personal growth and development""",
            "formatting": """Use self-help HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for main concepts or strategies
- <p> for explanations and advice
- <ul> and <li> for action steps and tips
- <strong> for key takeaways and important points
- <em> for motivational quotes and emphasis"""
        },
        "children": {
            "outline": """Create a children's book outline that:
- Uses age-appropriate language and concepts
- Includes engaging characters and situations
- Focuses on learning and entertainment
- Incorporates moral lessons or educational content
- Uses repetition and rhythm for engagement
- Includes opportunities for interaction
- Balances fun with educational value""",
            "chapter": """Write in a children's style that:
- Uses simple, clear language appropriate for the age group
- Creates engaging characters and situations
- Includes dialogue and action
- Incorporates learning opportunities naturally
- Uses repetition and rhythm for memorability
- Maintains a fun, engaging tone
- Includes moral lessons or educational content""",
            "formatting": """Use children's book HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for story sections or activities
- <p> for story text and explanations
- <ul> and <li> for lists and activities
- <strong> for important words or concepts
- <em> for sound effects or emphasis"""
        },
        "poetry": {
            "outline": """Create a poetry/creative outline that:
- Organizes by themes, forms, or emotional progression
- Includes various poetic forms and styles
- Focuses on imagery, metaphor, and literary devices
- Explores emotions and human experiences
- Uses creative structure and organization
- Incorporates rhythm and sound patterns
- Balances different poetic techniques""",
            "chapter": """Write in a poetic/creative style that:
- Uses rich imagery and metaphorical language
- Incorporates various poetic forms and techniques
- Focuses on emotional expression and artistic beauty
- Uses rhythm, meter, and sound patterns
- Employs creative language and wordplay
- Explores themes through artistic expression
- Maintains creative and innovative approach""",
            "formatting": """Use poetry HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for poem titles or sections
- <p> for poem stanzas and creative prose
- <ul> and <li> for structured creative elements
- <strong> for emphasis and key imagery
- <em> for titles and artistic emphasis"""
        },
        "business": {
            "outline": """Create a business/professional outline that:
- Focuses on practical business applications
- Includes case studies and real-world examples
- Organizes content by business functions or processes
- Uses professional terminology and concepts
- Provides actionable strategies and solutions
- Includes metrics, data, and analysis
- Addresses current business challenges""",
            "chapter": """Write in a business/professional style that:
- Uses professional, authoritative language
- Provides practical business insights and strategies
- Includes relevant case studies and examples
- Focuses on actionable business solutions
- Uses data and metrics to support points
- Addresses current business trends and challenges
- Maintains a professional, informative tone""",
            "formatting": """Use business HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for major business concepts or strategies
- <h4> for sub-topics and detailed points
- <p> for explanations and analysis
- <ul> and <li> for strategies and action items
- <strong> for key business terms and metrics
- <em> for emphasis and important concepts"""
        }
    }
    
    # Default to story style if unknown
    if writing_style not in styles:
        writing_style = "story"
    
    return styles[writing_style].get(content_type, styles["story"][content_type])

# Helper function for cleaning AI responses
def clean_ai_response(response: str) -> str:
    """Clean and format AI response with proper HTML structure"""
    cleaned_response = response.strip()
    
    # Remove markdown code block patterns
    if cleaned_response.startswith('```html'):
        cleaned_response = cleaned_response[7:]
    elif cleaned_response.startswith('```'):
        cleaned_response = cleaned_response[3:]
    
    if cleaned_response.endswith('```'):
        cleaned_response = cleaned_response[:-3]
    
    # Remove markdown artifacts and improve formatting
    cleaned_response = cleaned_response.replace('```html', '').replace('```', '')
    cleaned_response = cleaned_response.strip()
    
    # Remove common AI preamble patterns in multiple languages
    preamble_patterns = [
        r'^.*?(Here is|Ecco|Voici|Aquí está|Hier ist).*?(?=<h2>|Chapter|Capitolo|Chapitre|Capítulo|Kapitel)',
        r'^.*?(detailed outline|bozza dettagliata|plan détaillé|esquema detallado).*?(?=<h2>|Chapter|Capitolo|Chapitre|Capítulo|Kapitel)',
        r'^.*?(following your specifications|secondo le tue specifiche|selon vos spécifications|siguiendo sus especificaciones).*?(?=<h2>|Chapter|Capitolo|Chapitre|Capítulo|Kapitel)',
        r'^.*?(\*\*\*|---|\*\*.*?\*\*).*?(?=<h2>|Chapter|Capitolo|Chapitre|Capítulo|Kapitel)',
        r'^.*?(Book Description|Descrizione del libro|Description du livre|Descripción del libro).*?(?=<h2>|Chapter|Capitolo|Chapitre|Capítulo|Kapitel)',
        r'^.*?(Outline|Schema|Plan|Esquema|Gliederung).*?(?=<h2>|Chapter|Capitolo|Chapitre|Capítulo|Kapitel)',
        r'^.*?(?:Certainly|Certamente|Certainement|Ciertamente|Sicherlich).*?(?=<h2>|Chapter|Capitolo|Chapitre|Capítulo|Kapitel)',
        r'^[^<]*(?=<h2>)',  # Remove any text before first h2 tag
        r'^.*?(?=<h2>Chapter|<h2>Capitolo|<h2>Chapitre|<h2>Capítulo|<h2>Kapitel)',  # Remove text before chapter headers
    ]
    
    for pattern in preamble_patterns:
        cleaned_response = re.sub(pattern, '', cleaned_response, flags=re.DOTALL | re.IGNORECASE)
    
    cleaned_response = cleaned_response.strip()
    
    # Clean up chapter title formatting issues
    # Fix duplicated chapter titles
    cleaned_response = re.sub(r'<h2>([^<]+)</h2>\s*#+\s*\1', r'<h2>\1</h2>', cleaned_response, flags=re.IGNORECASE)
    
    # Remove standalone markdown headers that might duplicate HTML headers
    cleaned_response = re.sub(r'\n#+\s*([^\n]+)\n(?=\s*<h2>)', '', cleaned_response)
    
    # Enhance HTML formatting with proper spacing
    cleaned_response = cleaned_response.replace('<h1>', '\n\n<h1>').replace('</h1>', '</h1>\n\n')
    cleaned_response = cleaned_response.replace('<h2>', '\n\n<h2>').replace('</h2>', '</h2>\n\n')
    cleaned_response = cleaned_response.replace('<h3>', '\n<h3>').replace('</h3>', '</h3>\n')
    cleaned_response = cleaned_response.replace('<h4>', '\n<h4>').replace('</h4>', '</h4>\n')
    cleaned_response = cleaned_response.replace('<p>', '\n<p>').replace('</p>', '</p>\n\n')
    cleaned_response = cleaned_response.replace('<ul>', '\n<ul>').replace('</ul>', '</ul>\n\n')
    cleaned_response = cleaned_response.replace('<li>', '\n  <li>').replace('</li>', '</li>')
    
    # Clean up excessive spacing
    cleaned_response = re.sub(r'\n{3,}', '\n\n', cleaned_response)
    cleaned_response = cleaned_response.strip()
    
    # Final cleanup of any remaining unwanted text patterns
    cleaned_response = re.sub(r'^[^<]*?(?=<h2>)', '', cleaned_response, flags=re.DOTALL)
    
    return cleaned_response

# Authentication helper functions
async def get_current_user(authorization: str = Header(None)):
    """Get current user from session token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Extract token from Bearer header
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
        else:
            token = authorization
        
        # Find session in database
        session = await db.user_sessions.find_one({"session_token": token})
        if not session:
            raise HTTPException(status_code=401, detail="Invalid session token")
        
        # Check if session is expired
        if datetime.utcnow() > session["expires_at"]:
            await db.user_sessions.delete_one({"session_token": token})
            raise HTTPException(status_code=401, detail="Session expired")
        
        # Get user data
        user = await db.users.find_one({"id": session["user_id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return User(**user)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid session token")

async def create_user_session(user_id: str, session_token: str) -> UserSession:
    """Create a new user session"""
    expires_at = datetime.utcnow() + timedelta(days=7)
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=expires_at
    )
    await db.user_sessions.insert_one(session.dict())
    return session

# Authentication endpoints
@api_router.post("/auth/session")
async def authenticate_session(request: AuthSessionRequest):
    """Authenticate user session with Emergent auth"""
    try:
        # Call Emergent auth API
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": request.session_id}
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid session ID")
            
            auth_data = response.json()
            
            # Check if user exists
            existing_user = await db.users.find_one({"email": auth_data["email"]})
            
            if existing_user:
                user = User(**existing_user)
            else:
                # Create new user
                user = User(
                    email=auth_data["email"],
                    name=auth_data["name"],
                    picture=auth_data.get("picture")
                )
                await db.users.insert_one(user.dict())
            
            # Create user session
            session = await create_user_session(user.id, auth_data["session_token"])
            
            return {
                "user": UserProfile(
                    id=user.id,
                    email=user.email,
                    name=user.name,
                    picture=user.picture
                ),
                "session_token": auth_data["session_token"],
                "expires_at": session.expires_at.isoformat()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Authentication failed: {str(e)}")

@api_router.get("/auth/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return UserProfile(
        id=current_user.id,
        email=current_user.email,
        name=current_user.name,
        picture=current_user.picture
    )

@api_router.post("/auth/logout")
async def logout(authorization: str = Header(None)):
    """Logout user by invalidating session"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    try:
        # Extract token from Bearer header
        if authorization.startswith("Bearer "):
            token = authorization.split(" ")[1]
        else:
            token = authorization
        
        # Delete session from database
        await db.user_sessions.delete_one({"session_token": token})
        
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout failed: {str(e)}")

# Helper function to extract chapter titles from outline
def extract_chapter_titles(outline: str) -> dict:
    """Extract chapter titles from the outline HTML"""
    chapter_titles = {}
    
    # Look for chapter titles in various formats
    patterns = [
        r'<h2[^>]*>Chapter\s+(\d+):?\s*([^<]+)</h2>',
        r'<h2[^>]*>(\d+)\.\s*([^<]+)</h2>',
        r'<h2[^>]*>([^<]*Chapter\s+\d+[^<]*)</h2>'
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, outline, re.IGNORECASE)
        for match in matches:
            if len(match) == 2:
                chapter_num = int(match[0])
                chapter_title = match[1].strip()
                chapter_titles[chapter_num] = chapter_title
    
    return chapter_titles

def generate_table_of_contents(project_obj: BookProject) -> str:
    """Generate a table of contents with chapter titles and page numbers"""
    toc_html = '<div class="table-of-contents">\n<h2>📚 Table of Contents</h2>\n<div class="toc-entries">\n'
    
    # Extract chapter titles from outline
    chapter_titles = extract_chapter_titles(project_obj.outline or "")
    
    # Calculate approximate page numbers (assuming 275 words per page)
    current_page = 1
    words_per_page = 275
    
    for i in range(1, project_obj.chapters + 1):
        # Get chapter title
        chapter_title = chapter_titles.get(i, f"Chapter {i}")
        
        # Calculate page number for this chapter
        page_number = current_page
        
        # Add TOC entry
        toc_html += f'<div class="toc-entry">\n'
        toc_html += f'  <span class="toc-chapter">Chapter {i}: {chapter_title}</span>\n'
        toc_html += f'  <span class="toc-dots">{"." * 50}</span>\n'
        toc_html += f'  <span class="toc-page">{page_number}</span>\n'
        toc_html += f'</div>\n'
        
        # Calculate next chapter's starting page
        if project_obj.chapters_content and str(i) in project_obj.chapters_content:
            chapter_content = project_obj.chapters_content[str(i)]
            # Count words in chapter (rough estimate)
            word_count = len(chapter_content.split())
            pages_in_chapter = max(1, word_count // words_per_page)
            current_page += pages_in_chapter
        else:
            # Default pages per chapter if content not available
            estimated_pages = max(1, (project_obj.pages // project_obj.chapters))
            current_page += estimated_pages
    
    toc_html += '</div>\n</div>'
    return toc_html
@api_router.get("/")
async def root():
    return {"message": "AI Book Writer API"}

@api_router.post("/projects", response_model=BookProject)
async def create_project(project_data: BookProjectCreate, current_user: User = Depends(get_current_user)):
    """Create a new book project"""
    try:
        project_dict = project_data.dict()
        project_dict["user_id"] = current_user.id  # Associate with current user
        project_obj = BookProject(**project_dict)
        await db.book_projects.insert_one(project_obj.dict())
        return project_obj
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@api_router.get("/projects", response_model=List[BookProject])
async def get_projects(current_user: User = Depends(get_current_user)):
    """Get all book projects for the current user"""
    try:
        projects = await db.book_projects.find({"user_id": current_user.id}).to_list(1000)
        return [BookProject(**project) for project in projects]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching projects: {str(e)}")

@api_router.get("/projects/{project_id}", response_model=BookProject)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific book project"""
    try:
        project = await db.book_projects.find_one({"id": project_id, "user_id": current_user.id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        return BookProject(**project)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching project: {str(e)}")

@api_router.post("/generate-outline")
async def generate_outline(request: OutlineRequest, current_user: User = Depends(get_current_user)):
    """Generate book outline using Gemini 2.5 Flash-Lite AI"""
    try:
        # Get project details and verify ownership
        project = await db.book_projects.find_one({"id": request.project_id, "user_id": current_user.id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Initialize Gemini chat with updated model
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=f"outline_{project_obj.id}",
            system_message="You are an expert book writing assistant. You create detailed, well-structured book outlines that serve as comprehensive guides for content generation."
        ).with_model("gemini", "gemini-2.5-flash-lite-preview-06-17")
        
        # Enhanced style-specific instructions based on writing style
        if project_obj.writing_style == "story":
            style_instructions = """Create a story-focused outline that:
- Develops compelling character arcs and relationships
- Crafts engaging plot points and narrative hooks
- Maintains consistent pacing and tension
- Builds immersive story worlds and settings
- Weaves subplots seamlessly into the main narrative
- Creates emotional resonance and character growth
- Uses natural scene and chapter transitions"""
        else:  # descriptive
            style_instructions = """Create a structured informational outline that:
- Presents clear topic hierarchies and logical flow
- Breaks down complex concepts systematically
- Incorporates relevant examples and case studies
- Balances depth and accessibility of content
- Uses consistent terminology and definitions
- Provides clear learning objectives per section
- Includes practical applications and insights"""
        
        # Enhanced outline generation prompt for consistency and naturalness
        language_instructions = ""
        if project_obj.language.lower() != "english":
            language_instructions = f"""
**Language Requirements for {project_obj.language}:**
- Use natural, fluent {project_obj.language} that feels authentic to native speakers
- Employ idiomatic expressions and natural phrasing typical of {project_obj.language} literature
- Avoid literal translations or awkward constructions
- Use appropriate cultural references and context for {project_obj.language} readers
- Maintain consistent tone and style throughout all content"""

        prompt = f"""Create a detailed book outline for "{project_obj.title}":

**Book Details:**
- {project_obj.chapters} chapters, {project_obj.pages} pages
- Style: {project_obj.writing_style}
- Language: {project_obj.language}

**CRITICAL: Response Format Requirements:**
- Start IMMEDIATELY with the first chapter title in HTML format
- Do NOT include any preamble, explanations, or introductory text
- Do NOT include phrases like "Here is", "Ecco", "Voici", etc.
- Do NOT include "Book Description" or "Outline" headers
- Do NOT include any text before the first <h2> tag
- Response must begin directly with: <h2>Chapter 1: [Creative Title]</h2>

**Requirements:**
1. Create exactly {project_obj.chapters} expressive, thematic chapter titles that capture the essence of each chapter
2. Each chapter: 3-5 sentences summary + 3-5 key points
3. Target {(project_obj.pages * 275) // project_obj.chapters} words per chapter
4. HTML format: <h2>Chapter [Number]: [Creative Title]</h2> for titles
5. Use <p> for summaries, <ul><li> for key points

**Creative Chapter Titles:**
- Make each chapter title evocative and atmospheric
- Reflect the emotional tone or key theme of the chapter
- Avoid generic titles like "Chapter 1" or "Introduction"
- Use metaphors, imagery, or compelling phrases that draw readers in
- Examples: "The Weight of Silence", "Dancing with Shadows", "Where Rivers Meet the Sea"

**Style Guide:**
{style_instructions}

**Narrative Voice Consistency:**
- Choose a consistent narrative voice (first-person "I" or third-person "he/she/they") and maintain it throughout
- Ensure the chosen voice fits the writing style and subject matter
- Never switch between narrative voices within the same context

**Content Balance & Structure:**
- Plan chapters with varied pacing and emotional rhythm
- Balance descriptive passages with action and dialogue scenes
- Include character development and interaction opportunities
- Ensure each chapter has a clear narrative arc and purpose

{language_instructions}

**Book Description:**
{project_obj.description}

Begin your response immediately with the first chapter title. Do not include any explanatory text, preambles, or introductions."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Enhanced response cleanup
        cleaned_response = response.strip()
        
        # Remove markdown code block patterns
        if cleaned_response.startswith('```html'):
            cleaned_response = cleaned_response[7:]
        elif cleaned_response.startswith('```'):
            cleaned_response = cleaned_response[3:]
        
        if cleaned_response.endswith('```'):
            cleaned_response = cleaned_response[:-3]
        
        # Remove markdown artifacts and improve formatting
        cleaned_response = cleaned_response.replace('```html', '').replace('```', '')
        cleaned_response = cleaned_response.strip()
        
        # Enhance HTML formatting
        cleaned_response = cleaned_response.replace('<h2>', '\n\n<h2>').replace('</h2>', '</h2>\n\n')
        cleaned_response = cleaned_response.replace('<h3>', '\n<h3>').replace('</h3>', '</h3>\n')
        cleaned_response = cleaned_response.replace('<p>', '\n<p>').replace('</p>', '</p>\n\n')
        cleaned_response = cleaned_response.replace('<ul>', '\n<ul>').replace('</ul>', '</ul>\n\n')
        cleaned_response = cleaned_response.replace('<li>', '\n  <li>').replace('</li>', '</li>')
        
        # Clean up spacing
        cleaned_response = re.sub(r'\n{3,}', '\n\n', cleaned_response)
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



@api_router.post("/generate-chapter")
async def generate_chapter(request: ChapterRequest, current_user: User = Depends(get_current_user)):
    """Generate a specific chapter using Gemini 2.5 Flash-Lite AI"""
    try:
        # Get project details and verify ownership
        project = await db.book_projects.find_one({"id": request.project_id, "user_id": current_user.id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        if not project_obj.outline:
            raise HTTPException(status_code=400, detail="Project must have an outline before generating chapters")
        
        # Extract chapter titles from outline
        chapter_titles = extract_chapter_titles(project_obj.outline)
        chapter_title = chapter_titles.get(request.chapter_number, f"Chapter {request.chapter_number}")
        
        # Initialize Gemini chat for this chapter with updated model
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=f"chapter_{project_obj.id}_{request.chapter_number}",
            system_message="You are an expert book writer. You write engaging, well-structured chapters based on outlines. Use HTML formatting for headings, bold text, and structure. Always start each chapter with its proper title."
        ).with_model("gemini", "gemini-2.5-flash-lite-preview-06-17")
        
        # Calculate estimated words per chapter (275 words per page)
        estimated_words_per_chapter = (project_obj.pages * 275) // project_obj.chapters
        
        # Get style-specific instructions
        style_instructions = get_style_instructions(project_obj.writing_style, "chapter")
        formatting_instructions = get_style_instructions(project_obj.writing_style, "formatting")
        
        # Enhanced language-specific instructions for natural content generation
        language_instructions = ""
        if project_obj.language.lower() != "english":
            language_instructions = f"""
**Language Requirements for {project_obj.language}:**
- Write in natural, fluent {project_obj.language} that feels authentic to native speakers
- Use idiomatic expressions and natural phrasing typical of {project_obj.language} literature
- Avoid literal translations or awkward constructions
- Employ appropriate cultural references and context for {project_obj.language} readers
- Use natural sentence structures and vocabulary that native speakers would use
- Maintain consistent tone and style throughout the chapter"""

        # Optimized prompt for faster generation with voice consistency and literary quality
        prompt = f"""Write Chapter {request.chapter_number} for "{project_obj.title}":

**Chapter Title:** {chapter_title}
**Target Length:** {estimated_words_per_chapter} words
**Writing Style:** {project_obj.writing_style}

**CRITICAL: Response Format Requirements:**
- Start IMMEDIATELY with the chapter title in HTML format
- Do NOT include any preamble, explanations, or introductory text
- Do NOT include phrases like "Here is", "Ecco", "Voici", "Certainly", etc.
- Do NOT include any text before the chapter title
- Response must begin directly with: <h2>{chapter_title}</h2>

**Key Requirements:**
1. Start with: <h2>{chapter_title}</h2>
2. Write {estimated_words_per_chapter} words of engaging content
3. Follow the outline for Chapter {request.chapter_number}
4. Use HTML formatting (headings, paragraphs, lists)
5. Write in {project_obj.language}

**Narrative Voice Consistency:**
- Maintain consistent narrative voice throughout this chapter
- If using first-person ("I"), keep it consistent - never switch to third-person
- If using third-person ("he/she/they"), maintain it throughout
- Choose the voice that best fits the content and maintain it completely
- Ensure smooth transitions between sentences and paragraphs

**Dialogue & Character Development:**
- Give each character a distinct voice and speech pattern
- Use natural, conversational dialogue that sounds like real people talking
- Avoid having characters speak in the same formal register as the narrator
- Include interruptions, hesitations, and natural speech patterns
- Show character personality through their word choices and speaking style
- Use contractions and colloquialisms where appropriate
- Break up long speeches with action beats and internal thoughts

**Content Balance & Structure:**
- Alternate between descriptive passages and action/dialogue scenes
- Use varied sentence lengths and structures for natural rhythm
- Include both concrete, grounded scenes and poetic, atmospheric moments
- Break up large blocks of text with dialogue and shorter paragraphs
- Show character emotions through actions and dialogue, not just description

**Emotional Authenticity:**
- Write with genuine emotional depth and human imperfection
- Include subtle internal conflicts and character contradictions
- Allow for moments of vulnerability, uncertainty, and authentic emotion
- Use specific, sensory details rather than abstract concepts
- Show characters' emotions through their actions and reactions
- Include subtle imperfections in thought patterns and speech

**Visual Structure & Formatting:**
- Use frequent paragraph breaks for better readability
- Separate different speakers with clear line breaks
- Use shorter paragraphs for dialogue and action sequences
- Include proper scene transitions and time shifts
- Format dialogue clearly with proper punctuation and spacing

**Content Quality Guidelines:**
- Use natural, flowing language that feels authentic and engaging
- Avoid repetitive phrases or awkward constructions
- Create smooth transitions between ideas and paragraphs
- Use varied sentence structures for natural rhythm
- Include specific details and examples to make content vivid and relatable
- Balance showing vs. telling - demonstrate through action and dialogue

{language_instructions}

**Book Outline:**
{project_obj.outline}

**Style Instructions:**
{style_instructions}

Begin your response immediately with the chapter title. Do not include any explanatory text, preambles, or introductions."""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Clean up the response
        cleaned_response = clean_ai_response(response)
        
        # Ensure chapter starts with proper title if not already present
        if not cleaned_response.startswith(f'<h2>{chapter_title}</h2>') and not cleaned_response.startswith('<h2>'):
            cleaned_response = f'<h2>{chapter_title}</h2>\n\n{cleaned_response}'
        
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
            "chapter_title": chapter_title,
            "project_id": request.project_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating chapter: {str(e)}")


@api_router.put("/update-chapter")
async def update_chapter(request: ChapterUpdate, current_user: User = Depends(get_current_user)):
    """Update chapter content"""
    try:
        project = await db.book_projects.find_one({"id": request.project_id, "user_id": current_user.id})
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
async def export_book(project_id: str, current_user: User = Depends(get_current_user)):
    """Export book as HTML with table of contents only"""
    try:
        # Get project and verify ownership
        project = await db.book_projects.find_one({"id": project_id, "user_id": current_user.id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Generate table of contents
        toc_html = generate_table_of_contents(project_obj)
        
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
            text-align: center;
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
            text-align: center;
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
        
        .table-of-contents {{
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 40px;
            border-left: 5px solid #28a745;
        }}
        
        .table-of-contents h2 {{
            color: #2c3e50;
            margin-bottom: 25px;
            font-size: 1.8em;
        }}
        
        .toc-entries {{
            max-width: 100%;
        }}
        
        .toc-entry {{
            display: flex;
            align-items: baseline;
            margin-bottom: 12px;
            font-size: 14px;
        }}
        
        .toc-chapter {{
            font-weight: 500;
            color: #2c3e50;
            white-space: nowrap;
        }}
        
        .toc-dots {{
            flex: 1;
            color: #bdc3c7;
            font-size: 12px;
            overflow: hidden;
            margin: 0 8px;
        }}
        
        .toc-page {{
            font-weight: 500;
            color: #3498db;
            white-space: nowrap;
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
        
        .footer {{
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
            color: #7f8c8d;
        }}
        
        @media print {{
            body {{
                padding: 20px;
            }}
            .chapter {{
                page-break-after: always;
            }}
            .toc-entry {{
                page-break-inside: avoid;
            }}
        }}
    </style>
</head>
<body>
    <div class="book-info">
        <h1>{project_obj.title}</h1>
        <p><strong>Generated On:</strong> {datetime.now().strftime("%B %d, %Y")}</p>
    </div>
    
    {toc_html}
    
    <div class="chapters">"""
        
        # Add chapters with proper formatting
        if project_obj.chapters_content:
            for i in range(1, project_obj.chapters + 1):
                chapter_content = project_obj.chapters_content.get(str(i), "")
                if chapter_content:
                    html_content += f"""
        <div class="chapter">
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
    
    <div class="footer">
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

@api_router.get("/export-book-pdf/{project_id}")
async def export_book_pdf(project_id: str, current_user: User = Depends(get_current_user)):
    """Export book as PDF with professional book formatting"""
    try:
        # Get project and verify ownership
        project = await db.book_projects.find_one({"id": project_id, "user_id": current_user.id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=72)
        
        # Professional book styles - standardized to match DOCX
        styles = getSampleStyleSheet()
        
        # Title page styles
        title_style = ParagraphStyle(
            'BookTitle',
            parent=styles['Title'],
            fontSize=24,  # Standardized size
            spaceAfter=30,
            alignment=1,  # Center alignment
            textColor=HexColor('#1a1a1a'),
            fontName='Times-Bold'  # Standardized to Times family
        )
        
        author_style = ParagraphStyle(
            'Author',
            parent=styles['Normal'],
            fontSize=14,  # Standardized size
            spaceAfter=20,
            alignment=1,  # Center alignment
            textColor=HexColor('#666666'),
            fontName='Times-Roman'  # Standardized to Times family
        )
        
        # Table of Contents styles
        toc_title_style = ParagraphStyle(
            'TOCTitle',
            parent=styles['Heading1'],
            fontSize=20,  # Standardized size
            spaceAfter=30,
            textColor=HexColor('#2c3e50'),
            alignment=1,  # Center alignment
            fontName='Times-Bold'  # Standardized to Times family
        )
        
        toc_entry_style = ParagraphStyle(
            'TOCEntry',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=8,
            leftIndent=0,
            rightIndent=0,
            fontName='Times-Roman'  # Standardized to Times family
        )
        
        # Chapter styles
        chapter_title_style = ParagraphStyle(
            'ChapterTitle',
            parent=styles['Heading1'],
            fontSize=16,  # Standardized size
            spaceAfter=24,
            spaceBefore=36,
            textColor=HexColor('#2c3e50'),
            alignment=1,  # Center alignment
            fontName='Times-Bold'  # Standardized to Times family
        )
        
        chapter_body_style = ParagraphStyle(
            'ChapterBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=12,
            alignment=4,  # Justified
            firstLineIndent=18,  # Standardized to ~0.25 inches
            fontName='Times-Roman',
            leading=16
        )
        
        dialogue_style = ParagraphStyle(
            'Dialogue',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            spaceBefore=8,
            alignment=4,  # Justified
            leftIndent=28,  # Standardized to ~0.4 inches
            rightIndent=10,
            fontName='Times-Roman',
            leading=16
        )
        
        # Build content
        content = []
        
        # Title page
        content.append(Spacer(1, 100))  # Top margin
        content.append(Paragraph(project_obj.title, title_style))
        content.append(Spacer(1, 40))
        content.append(Paragraph("Generated with BookCraft AI", author_style))
        content.append(Spacer(1, 20))
        content.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y')}", author_style))
        content.append(PageBreak())
        
        # Table of Contents
        content.append(Spacer(1, 50))
        content.append(Paragraph("Table of Contents", toc_title_style))
        content.append(Spacer(1, 30))
        
        # Extract chapter titles and create TOC
        chapter_titles = extract_chapter_titles(project_obj.outline or "")
        current_page = 3  # Start after title and TOC pages
        words_per_page = 275
        
        for i in range(1, project_obj.chapters + 1):
            chapter_title = chapter_titles.get(i, f"Chapter {i}")
            
            # Create professional TOC entry with standardized formatting
            toc_text = f"Chapter {i}: {chapter_title}"
            dots = "." * max(5, 65 - len(toc_text) - len(str(current_page)))  # Standardized spacing
            toc_entry = f"{toc_text} {dots} {current_page}"
            content.append(Paragraph(toc_entry, toc_entry_style))
            
            # Calculate next chapter's page
            if project_obj.chapters_content and str(i) in project_obj.chapters_content:
                chapter_content = project_obj.chapters_content[str(i)]
                word_count = len(re.sub(r'<[^>]+>', '', chapter_content).split())
                pages_in_chapter = max(1, word_count // words_per_page)
                current_page += pages_in_chapter
            else:
                estimated_pages = max(1, (project_obj.pages // project_obj.chapters))
                current_page += estimated_pages
        
        content.append(PageBreak())
        
        # Chapters with improved formatting
        if project_obj.chapters_content:
            for i in range(1, project_obj.chapters + 1):
                chapter_content = project_obj.chapters_content.get(str(i), "")
                if chapter_content:
                    # Get chapter title
                    chapter_title = chapter_titles.get(i, f"Chapter {i}")
                    content.append(Paragraph(f"Chapter {i}: {chapter_title}", chapter_title_style))  # Standardized format
                    content.append(Spacer(1, 20))
                    
                    # Process HTML content for better formatting
                    processed_content = process_html_for_pdf(chapter_content, chapter_body_style, dialogue_style)
                    content.extend(processed_content)
                else:
                    content.append(Paragraph(f"Chapter {i}", chapter_title_style))
                    content.append(Spacer(1, 20))
                    content.append(Paragraph("This chapter has not been generated yet.", chapter_body_style))
                
                if i < project_obj.chapters:  # Don't add page break after last chapter
                    content.append(PageBreak())
        
        # Build PDF
        doc.build(content)
        buffer.seek(0)
        
        # Create safe filename
        safe_filename = "".join(c for c in project_obj.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_filename = safe_filename.replace(' ', '_')
        if not safe_filename:
            safe_filename = f"book_{project_obj.id}"
        
        return StreamingResponse(
            io.BytesIO(buffer.getvalue()),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={safe_filename}.pdf"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting book as PDF: {str(e)}")

def process_html_for_pdf(html_content, body_style, dialogue_style):
    """Process HTML content for better PDF formatting"""
    content = []
    
    # Clean and split content
    cleaned_content = re.sub(r'<h2[^>]*>.*?</h2>', '', html_content)  # Remove h2 tags (already handled)
    paragraphs = re.split(r'<p>|</p>', cleaned_content)
    
    for paragraph in paragraphs:
        if paragraph.strip():
            # Remove HTML tags
            clean_text = re.sub(r'<[^>]+>', '', paragraph).strip()
            clean_text = unescape(clean_text)
            
            if clean_text:
                # Check if it's dialogue (contains quotation marks)
                if '"' in clean_text or '"' in clean_text or '"' in clean_text:
                    content.append(Paragraph(clean_text, dialogue_style))
                else:
                    content.append(Paragraph(clean_text, body_style))
                
                content.append(Spacer(1, 6))
    
    return content

@api_router.get("/export-book-docx/{project_id}")
async def export_book_docx(project_id: str, current_user: User = Depends(get_current_user)):
    """Export book as DOCX with professional book formatting"""
    try:
        # Get project and verify ownership
        project = await db.book_projects.find_one({"id": project_id, "user_id": current_user.id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Create DOCX document
        doc = Document()
        
        # Configure professional book styles - standardized to match PDF
        styles = doc.styles
        
        # Title page styling
        title_style = styles.add_style('BookTitle', WD_STYLE_TYPE.PARAGRAPH)
        title_style.font.name = 'Times New Roman'  # Standardized to Times family
        title_style.font.size = Inches(0.33)  # Standardized size (24pt)
        title_style.font.bold = True
        title_style.paragraph_format.alignment = 1  # Center
        title_style.paragraph_format.space_after = Inches(0.42)  # Standardized spacing
        
        # Author style
        author_style = styles.add_style('AuthorStyle', WD_STYLE_TYPE.PARAGRAPH)
        author_style.font.name = 'Times New Roman'  # Standardized to Times family
        author_style.font.size = Inches(0.19)  # Standardized size (14pt)
        author_style.font.color.rgb = RGBColor(102, 102, 102)
        author_style.paragraph_format.alignment = 1  # Center
        author_style.paragraph_format.space_after = Inches(0.28)  # Standardized spacing
        
        # Chapter title style
        chapter_title_style = styles.add_style('ChapterTitle', WD_STYLE_TYPE.PARAGRAPH)
        chapter_title_style.font.name = 'Times New Roman'  # Standardized to Times family
        chapter_title_style.font.size = Inches(0.22)  # Standardized size (16pt)
        chapter_title_style.font.bold = True
        chapter_title_style.font.color.rgb = RGBColor(44, 62, 80)
        chapter_title_style.paragraph_format.alignment = 1  # Center
        chapter_title_style.paragraph_format.space_before = Inches(0.5)
        chapter_title_style.paragraph_format.space_after = Inches(0.33)  # Standardized spacing
        
        # Body text style
        body_style = styles.add_style('BookBody', WD_STYLE_TYPE.PARAGRAPH)
        body_style.font.name = 'Times New Roman'  # Standardized to Times family
        body_style.font.size = Inches(0.15)  # Standardized size (11pt)
        body_style.paragraph_format.alignment = 4  # Justified
        body_style.paragraph_format.first_line_indent = Inches(0.25)  # Standardized to match PDF
        body_style.paragraph_format.space_after = Inches(0.17)  # Standardized spacing
        body_style.paragraph_format.line_spacing = 1.2
        
        # Dialogue style
        dialogue_style = styles.add_style('DialogueStyle', WD_STYLE_TYPE.PARAGRAPH)
        dialogue_style.font.name = 'Times New Roman'  # Standardized to Times family
        dialogue_style.font.size = Inches(0.15)  # Standardized size (11pt)
        dialogue_style.paragraph_format.alignment = 4  # Justified
        dialogue_style.paragraph_format.left_indent = Inches(0.39)  # Standardized to match PDF
        dialogue_style.paragraph_format.space_after = Inches(0.11)  # Standardized spacing
        dialogue_style.paragraph_format.line_spacing = 1.2
        
        # Title page
        title_paragraph = doc.add_paragraph()
        title_paragraph.style = title_style
        title_run = title_paragraph.add_run(project_obj.title)
        
        # Add some space
        doc.add_paragraph()
        doc.add_paragraph()
        
        # Author information
        author_paragraph = doc.add_paragraph()
        author_paragraph.style = author_style
        author_run = author_paragraph.add_run("Generated with BookCraft AI")  # Standardized branding
        
        # Date
        date_paragraph = doc.add_paragraph()
        date_paragraph.style = author_style
        date_run = date_paragraph.add_run(f"Generated on {datetime.now().strftime('%B %d, %Y')}")
        
        doc.add_page_break()
        
        # Table of Contents
        toc_heading = doc.add_heading("Table of Contents", level=1)
        toc_heading.alignment = 1  # Center alignment
        toc_heading.runs[0].font.name = 'Times New Roman'  # Standardized font
        toc_heading.runs[0].font.size = Inches(0.28)  # Standardized size (20pt)
        toc_heading.runs[0].font.bold = True
        
        # Extract chapter titles and create TOC
        chapter_titles = extract_chapter_titles(project_obj.outline or "")
        current_page = 3  # Start after title and TOC pages
        words_per_page = 275
        
        for i in range(1, project_obj.chapters + 1):
            chapter_title = chapter_titles.get(i, f"Chapter {i}")
            
            # Create professional TOC entry with standardized formatting
            toc_paragraph = doc.add_paragraph()
            toc_paragraph.paragraph_format.space_after = Inches(0.11)  # Standardized spacing
            
            # Chapter info
            chapter_run = toc_paragraph.add_run(f"Chapter {i}: {chapter_title}")
            chapter_run.font.name = 'Times New Roman'  # Standardized font
            chapter_run.font.size = Inches(0.17)  # Standardized size (12pt)
            
            # Add dots with standardized spacing
            dots_text = "." * max(5, 65 - len(f"Chapter {i}: {chapter_title}") - len(str(current_page)))
            dots_run = toc_paragraph.add_run(dots_text)
            dots_run.font.color.rgb = RGBColor(189, 195, 199)  # Light gray
            dots_run.font.name = 'Times New Roman'  # Standardized font
            
            # Add page number
            page_run = toc_paragraph.add_run(str(current_page))
            page_run.bold = True
            page_run.font.color.rgb = RGBColor(52, 152, 219)  # Blue
            page_run.font.name = 'Times New Roman'  # Standardized font
            
            # Calculate next chapter's page
            if project_obj.chapters_content and str(i) in project_obj.chapters_content:
                chapter_content = project_obj.chapters_content[str(i)]
                word_count = len(re.sub(r'<[^>]+>', '', chapter_content).split())
                pages_in_chapter = max(1, word_count // words_per_page)
                current_page += pages_in_chapter
            else:
                estimated_pages = max(1, (project_obj.pages // project_obj.chapters))
                current_page += estimated_pages
        
        doc.add_page_break()
        
        # Chapters with professional formatting
        if project_obj.chapters_content:
            for i in range(1, project_obj.chapters + 1):
                chapter_content = project_obj.chapters_content.get(str(i), "")
                if chapter_content:
                    # Add chapter title with standardized format
                    chapter_title = chapter_titles.get(i, f"Chapter {i}")
                    chapter_heading = doc.add_paragraph()
                    chapter_heading.style = chapter_title_style
                    chapter_heading.add_run(f"Chapter {i}: {chapter_title}")  # Standardized format
                    
                    # Process and add chapter content
                    process_html_for_docx(chapter_content, doc, body_style, dialogue_style)
                else:
                    chapter_heading = doc.add_paragraph()
                    chapter_heading.style = chapter_title_style
                    chapter_heading.add_run(f"Chapter {i}")
                    
                    empty_paragraph = doc.add_paragraph()
                    empty_paragraph.style = body_style
                    empty_paragraph.add_run("This chapter has not been generated yet.")
                
                if i < project_obj.chapters:  # Don't add page break after last chapter
                    doc.add_page_break()
        
        # Save to buffer
        buffer = io.BytesIO()
        doc.save(buffer)
        buffer.seek(0)
        
        # Create safe filename
        safe_filename = "".join(c for c in project_obj.title if c.isalnum() or c in (' ', '-', '_')).rstrip()
        safe_filename = safe_filename.replace(' ', '_')
        if not safe_filename:
            safe_filename = f"book_{project_obj.id}"
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={safe_filename}.docx"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting book as DOCX: {str(e)}")

def process_html_for_docx(html_content, doc, body_style, dialogue_style):
    """Process HTML content for better DOCX formatting"""
    # Clean and split content
    cleaned_content = re.sub(r'<h2[^>]*>.*?</h2>', '', html_content)  # Remove h2 tags (already handled)
    paragraphs = re.split(r'<p>|</p>', cleaned_content)
    
    for paragraph in paragraphs:
        if paragraph.strip():
            # Remove HTML tags
            clean_text = re.sub(r'<[^>]+>', '', paragraph).strip()
            clean_text = unescape(clean_text)
            
            if clean_text:
                # Create paragraph
                doc_paragraph = doc.add_paragraph()
                
                # Check if it's dialogue (contains quotation marks)
                if '"' in clean_text or '"' in clean_text or '"' in clean_text:
                    doc_paragraph.style = dialogue_style
                else:
                    doc_paragraph.style = body_style
                
                # Add text
                doc_paragraph.add_run(clean_text)

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