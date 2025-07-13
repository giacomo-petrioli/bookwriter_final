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
            "outline": """Create a story-focused outline that:
- Develops compelling character arcs and relationships
- Crafts engaging plot points and narrative hooks
- Maintains consistent pacing and tension
- Builds immersive story worlds and settings
- Weaves subplots seamlessly into the main narrative
- Creates emotional resonance and character growth
- Uses natural scene and chapter transitions""",
            "chapter": """Write in a fluid, narrative style that:
- Focuses on storytelling and character development
- Uses natural dialogue and descriptive prose
- Maintains narrative flow without excessive sub-headings
- Creates immersive scenes and situations
- Keeps the reader engaged with story progression
- Uses minimal structural breaks within chapters
- Develops character emotions and relationships""",
            "formatting": """Use minimal HTML formatting for story flow:
- <h2> for chapter titles with chapter names
- <p> for paragraphs (the main content)
- <em> for emphasis, thoughts, or internal dialogue
- <strong> for important dialogue or key moments
- Avoid excessive <h3> tags within chapters
- Focus on smooth paragraph transitions"""
        },
        "descriptive": {
            "outline": """Create a structured informational outline that:
- Presents clear topic hierarchies and logical flow
- Breaks down complex concepts systematically
- Incorporates relevant examples and case studies
- Balances depth and accessibility of content
- Uses consistent terminology and definitions
- Provides clear learning objectives per section
- Includes practical applications and insights""",
            "chapter": """Write in a descriptive, informational style that:
- Provides detailed explanations and analysis
- Uses clear structure and organization
- Includes examples and case studies when relevant
- Maintains an informative and engaging tone
- Breaks down complex topics into digestible sections
- Uses logical progression from basic to advanced concepts""",
            "formatting": """Use structured HTML formatting:
- <h2> for chapter titles with chapter names
- <h3> for main section headings within chapters
- <h4> for subsection headings
- <p> for paragraphs
- <ul> and <li> for bullet points and lists
- <strong> for key terms and concepts
- <em> for emphasis"""
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
    
    return cleaned_response

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
    """Generate book outline using Gemini 2.5 Flash-Lite AI"""
    try:
        # Get project details
        project = await db.book_projects.find_one({"id": request.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Initialize Gemini chat with updated model
        chat = LlmChat(
            api_key=os.environ.get('GEMINI_API_KEY'),
            session_id=f"outline_{project_obj.id}",
            system_message="You are an expert book writing assistant. You create detailed, well-structured book outlines that serve as comprehensive guides for content generation."
        ).with_model("gemini", "gemini-2.5-flash-lite")
        
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
        
        # Improved prompt for better outline generation
        prompt = f"""Create a comprehensive and detailed book outline for the following project:

**BOOK DETAILS:**
- Title: {project_obj.title}
- Description: {project_obj.description}
- Target Pages: {project_obj.pages} pages
- Number of Chapters: {project_obj.chapters} chapters
- Language: {project_obj.language}
- Writing Style: {project_obj.writing_style}

**STYLE REQUIREMENTS:**
{style_instructions}

**OUTLINE REQUIREMENTS:**
1. Create exactly {project_obj.chapters} chapter titles that are compelling and relevant
2. Each chapter should have a clear, descriptive title that fits the {project_obj.writing_style} style
3. Include 3-5 sentences of detailed summary for each chapter
4. Add 3-5 key points, topics, or plot elements for each chapter
5. Ensure logical flow and progression between chapters
6. Target approximately {(project_obj.pages * 275) // project_obj.chapters} words per chapter

**FORMATTING REQUIREMENTS:**
- Use clean, well-structured HTML with proper spacing
- Chapter titles: <h2>Chapter [Number]: [Title]</h2>
- Chapter summaries: <p> tags with detailed descriptions
- Key points: <ul> and <li> tags for organized lists
- Use <h3> for sub-sections only when appropriate for the style
- Ensure proper spacing between all elements

**IMPORTANT GUIDELINES:**
- Make each chapter title specific and engaging
- Ensure chapter summaries provide clear direction for content generation
- Create substantial content guidelines that will result in {(project_obj.pages * 275) // project_obj.chapters} words per chapter
- Maintain consistency with the chosen writing style throughout
- Write in {project_obj.language}

Please generate a comprehensive outline that will guide the creation of substantial, high-quality content for each chapter."""

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
async def generate_chapter(request: ChapterRequest):
    """Generate a specific chapter using Gemini 2.5 Flash-Lite AI"""
    try:
        # Get project details
        project = await db.book_projects.find_one({"id": request.project_id})
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
        ).with_model("gemini", "gemini-2.5-flash-lite")
        
        # Calculate estimated words per chapter (275 words per page)
        estimated_words_per_chapter = (project_obj.pages * 275) // project_obj.chapters
        
        # Get style-specific instructions
        style_instructions = get_style_instructions(project_obj.writing_style, "chapter")
        formatting_instructions = get_style_instructions(project_obj.writing_style, "formatting")
        
        # Enhanced prompt for chapter generation
        prompt = f"""Write a complete and substantial Chapter {request.chapter_number} for the following book:

**BOOK DETAILS:**
- Title: {project_obj.title}
- Description: {project_obj.description}
- Language: {project_obj.language}
- Writing Style: {project_obj.writing_style}
- Chapter Title: {chapter_title}
- Target Length: {estimated_words_per_chapter} words (this is critical - write substantial content!)

**STYLE REQUIREMENTS:**
{style_instructions}

**BOOK OUTLINE:**
{project_obj.outline}

**CHAPTER REQUIREMENTS:**
1. **START WITH CHAPTER TITLE**: Begin with <h2>{chapter_title}</h2>
2. **Substantial Content**: Write approximately {estimated_words_per_chapter} words of engaging content
3. **Follow Outline**: Base content on the outline for Chapter {request.chapter_number}
4. **Maintain Style**: Keep consistent with the {project_obj.writing_style} writing style
5. **Language**: Write entirely in {project_obj.language}
6. **Engaging Content**: Create compelling, well-developed content that advances the book's purpose

**FORMATTING REQUIREMENTS:**
{formatting_instructions}

**CRITICAL INSTRUCTIONS:**
- Begin immediately with the chapter title: <h2>{chapter_title}</h2>
- Write substantial, detailed content that meets the word count requirement
- Focus specifically on Chapter {request.chapter_number} based on the outline
- Ensure the content is engaging, well-structured, and valuable to readers
- Use proper HTML formatting throughout
- Do not include any markdown code blocks

Please write a complete, substantial chapter that fulfills all these requirements."""

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


@api_router.post("/generate-all-chapters")
async def generate_all_chapters(request: OutlineRequest):
    """Generate all chapters for a book project using Gemini 2.5 Flash-Lite AI"""
    try:
        # Get project details
        project = await db.book_projects.find_one({"id": request.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        if not project_obj.outline:
            raise HTTPException(status_code=400, detail="Project must have an outline before generating chapters")
        
        # Extract chapter titles from outline
        chapter_titles = extract_chapter_titles(project_obj.outline)
        
        # Initialize storage for all chapters
        all_chapters = {}
        estimated_words_per_chapter = (project_obj.pages * 275) // project_obj.chapters
        
        # Get style-specific instructions
        style_instructions = get_style_instructions(project_obj.writing_style, "chapter")
        formatting_instructions = get_style_instructions(project_obj.writing_style, "formatting")
        
        # Generate each chapter sequentially
        for chapter_num in range(1, project_obj.chapters + 1):
            try:
                # Get chapter title
                chapter_title = chapter_titles.get(chapter_num, f"Chapter {chapter_num}")
                
                # Initialize Gemini chat for each chapter with updated model
                chat = LlmChat(
                    api_key=os.environ.get('GEMINI_API_KEY'),
                    session_id=f"batch_chapter_{project_obj.id}_{chapter_num}",
                    system_message="You are an expert book writer. You write engaging, well-structured chapters based on outlines. Use HTML formatting for headings, bold text, and structure. Always start each chapter with its proper title."
                ).with_model("gemini", "gemini-2.5-flash-lite")
                
                # Enhanced prompt for chapter generation
                prompt = f"""Write a complete and substantial Chapter {chapter_num} for the following book:

**BOOK DETAILS:**
- Title: {project_obj.title}
- Description: {project_obj.description}
- Language: {project_obj.language}
- Writing Style: {project_obj.writing_style}
- Chapter Title: {chapter_title}
- Target Length: {estimated_words_per_chapter} words (this is critical - write substantial content!)

**STYLE REQUIREMENTS:**
{style_instructions}

**BOOK OUTLINE:**
{project_obj.outline}

**CHAPTER REQUIREMENTS:**
1. **START WITH CHAPTER TITLE**: Begin with <h2>{chapter_title}</h2>
2. **Substantial Content**: Write approximately {estimated_words_per_chapter} words of engaging content
3. **Follow Outline**: Base content on the outline for Chapter {chapter_num}
4. **Maintain Style**: Keep consistent with the {project_obj.writing_style} writing style
5. **Language**: Write entirely in {project_obj.language}
6. **Engaging Content**: Create compelling, well-developed content that advances the book's purpose

**FORMATTING REQUIREMENTS:**
{formatting_instructions}

**CRITICAL INSTRUCTIONS:**
- Begin immediately with the chapter title: <h2>{chapter_title}</h2>
- Write substantial, detailed content that meets the word count requirement
- Focus specifically on Chapter {chapter_num} based on the outline
- Ensure the content is engaging, well-structured, and valuable to readers
- Use proper HTML formatting throughout
- Do not include any markdown code blocks

Please write a complete, substantial chapter that fulfills all these requirements."""

                user_message = UserMessage(text=prompt)
                response = await chat.send_message(user_message)
                
                # Clean up the response
                cleaned_response = clean_ai_response(response)
                
                # Ensure chapter starts with proper title if not already present
                if not cleaned_response.startswith(f'<h2>{chapter_title}</h2>') and not cleaned_response.startswith('<h2>'):
                    cleaned_response = f'<h2>{chapter_title}</h2>\n\n{cleaned_response}'
                
                # Store the chapter
                all_chapters[str(chapter_num)] = cleaned_response
                
                # Small delay to avoid overwhelming the API
                await asyncio.sleep(1)
                
            except Exception as e:
                # Log error but continue with other chapters
                all_chapters[str(chapter_num)] = f"<h2>{chapter_titles.get(chapter_num, f'Chapter {chapter_num}')}</h2>\n\n<p><em>Error generating this chapter: {str(e)}</em></p>"
                continue
        
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
            "message": f"Generated {len(all_chapters)} chapters",
            "chapters_content": all_chapters,
            "project_id": request.project_id
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
        <p><strong>Writing Style:</strong> {project_obj.writing_style.title()}</p>
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

@api_router.get("/export-book-pdf/{project_id}")
async def export_book_pdf(project_id: str):
    """Export book as PDF with proper formatting"""
    try:
        project = await db.book_projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Create PDF buffer
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=30,
            alignment=1  # Center alignment
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            textColor=HexColor('#2c3e50')
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=12,
            alignment=4,  # Justified
            firstLineIndent=20
        )
        
        # Build content
        content = []
        
        # Title page
        content.append(Paragraph(project_obj.title, title_style))
        content.append(Spacer(1, 12))
        content.append(Paragraph(f"<b>Description:</b> {project_obj.description}", body_style))
        content.append(Paragraph(f"<b>Language:</b> {project_obj.language}", body_style))
        content.append(Paragraph(f"<b>Writing Style:</b> {project_obj.writing_style.title()}", body_style))
        content.append(Paragraph(f"<b>Chapters:</b> {project_obj.chapters}", body_style))
        content.append(Paragraph(f"<b>Target Pages:</b> {project_obj.pages}", body_style))
        content.append(Paragraph(f"<b>Generated On:</b> {datetime.now().strftime('%B %d, %Y')}", body_style))
        content.append(PageBreak())
        
        # Outline
        if project_obj.outline:
            content.append(Paragraph("📖 Book Outline", heading_style))
            content.append(Spacer(1, 12))
            # Convert HTML to plain text for PDF
            outline_text = re.sub(r'<[^>]+>', '', project_obj.outline)
            outline_text = unescape(outline_text)
            content.append(Paragraph(outline_text, body_style))
            content.append(PageBreak())
        
        # Chapters
        content.append(Paragraph("📚 Chapters", heading_style))
        content.append(Spacer(1, 12))
        
        if project_obj.chapters_content:
            for i in range(1, project_obj.chapters + 1):
                chapter_content = project_obj.chapters_content.get(str(i), "")
                if chapter_content:
                    # Convert HTML to plain text for PDF
                    chapter_text = re.sub(r'<[^>]+>', '', chapter_content)
                    chapter_text = unescape(chapter_text)
                    content.append(Paragraph(chapter_text, body_style))
                else:
                    content.append(Paragraph(f"Chapter {i}", heading_style))
                    content.append(Paragraph("This chapter has not been generated yet.", body_style))
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

@api_router.get("/export-book-docx/{project_id}")
async def export_book_docx(project_id: str):
    """Export book as DOCX with proper formatting"""
    try:
        project = await db.book_projects.find_one({"id": project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        project_obj = BookProject(**project)
        
        # Create DOCX document
        doc = Document()
        
        # Title page
        title = doc.add_heading(project_obj.title, level=1)
        title.alignment = 1  # Center alignment
        
        doc.add_paragraph(f"Description: {project_obj.description}")
        doc.add_paragraph(f"Language: {project_obj.language}")
        doc.add_paragraph(f"Writing Style: {project_obj.writing_style.title()}")
        doc.add_paragraph(f"Chapters: {project_obj.chapters}")
        doc.add_paragraph(f"Target Pages: {project_obj.pages}")
        doc.add_paragraph(f"Generated On: {datetime.now().strftime('%B %d, %Y')}")
        
        # Page break
        doc.add_page_break()
        
        # Outline
        if project_obj.outline:
            doc.add_heading("📖 Book Outline", level=2)
            # Convert HTML to plain text for DOCX
            outline_text = re.sub(r'<[^>]+>', '', project_obj.outline)
            outline_text = unescape(outline_text)
            doc.add_paragraph(outline_text)
            doc.add_page_break()
        
        # Chapters
        doc.add_heading("📚 Chapters", level=2)
        
        if project_obj.chapters_content:
            for i in range(1, project_obj.chapters + 1):
                chapter_content = project_obj.chapters_content.get(str(i), "")
                if chapter_content:
                    # Convert HTML to plain text for DOCX
                    chapter_text = re.sub(r'<[^>]+>', '', chapter_content)
                    chapter_text = unescape(chapter_text)
                    doc.add_paragraph(chapter_text)
                else:
                    doc.add_heading(f"Chapter {i}", level=3)
                    doc.add_paragraph("This chapter has not been generated yet.")
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
            io.BytesIO(buffer.getvalue()),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={safe_filename}.docx"}
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting book as DOCX: {str(e)}")

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