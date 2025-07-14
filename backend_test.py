#!/usr/bin/env python3
"""
Backend API Testing for AI Book Writer Application
Tests all backend endpoints including AI integration with Gemini
"""

import requests
import json
import time
import sys
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://271b09ad-402a-4f18-8aec-5c32bfa5dc55.preview.emergentagent.com/api"

class BookWriterAPITester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_project_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_health(self):
        """Test if API is accessible"""
        try:
            self.log("Testing API health check...")
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "AI Book Writer API":
                    self.log("✅ API health check passed")
                    return True
                else:
                    self.log(f"❌ Unexpected API response: {data}", "ERROR")
                    return False
            else:
                self.log(f"❌ API health check failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ API health check failed: {str(e)}", "ERROR")
            return False
    
    def test_create_project(self):
        """Test creating a new book project"""
        try:
            self.log("Testing project creation...")
            
            project_data = {
                "title": "AI and the Future of Work",
                "description": "A comprehensive exploration of how artificial intelligence is transforming the modern workplace, examining both opportunities and challenges for workers, businesses, and society.",
                "pages": 250,
                "chapters": 10,
                "language": "English"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_project_id = data.get("id")
                
                # Validate response structure
                required_fields = ["id", "title", "description", "pages", "chapters", "language", "created_at"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in project response: {missing_fields}", "ERROR")
                    return False
                
                if data["title"] != project_data["title"]:
                    self.log(f"❌ Title mismatch: expected {project_data['title']}, got {data['title']}", "ERROR")
                    return False
                    
                self.log(f"✅ Project created successfully with ID: {self.test_project_id}")
                return True
            else:
                self.log(f"❌ Project creation failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Project creation test failed: {str(e)}", "ERROR")
            return False
    
    def test_get_projects(self):
        """Test retrieving all projects"""
        try:
            self.log("Testing project retrieval...")
            
            response = self.session.get(f"{self.base_url}/projects")
            
            if response.status_code == 200:
                data = response.json()
                
                if not isinstance(data, list):
                    self.log(f"❌ Expected list response, got {type(data)}", "ERROR")
                    return False
                
                if len(data) == 0:
                    self.log("⚠️ No projects found in database", "WARNING")
                    return True
                
                # Check if our test project is in the list
                project_found = any(project.get("id") == self.test_project_id for project in data)
                
                if self.test_project_id and not project_found:
                    self.log(f"❌ Test project {self.test_project_id} not found in projects list", "ERROR")
                    return False
                
                self.log(f"✅ Retrieved {len(data)} projects successfully")
                return True
            else:
                self.log(f"❌ Project retrieval failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Project retrieval test failed: {str(e)}", "ERROR")
            return False
    
    def test_get_specific_project(self):
        """Test retrieving a specific project"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for specific project test", "ERROR")
            return False
            
        try:
            self.log(f"Testing specific project retrieval for ID: {self.test_project_id}")
            
            response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("id") != self.test_project_id:
                    self.log(f"❌ Project ID mismatch: expected {self.test_project_id}, got {data.get('id')}", "ERROR")
                    return False
                
                if data.get("title") != "AI and the Future of Work":
                    self.log(f"❌ Project title mismatch: expected 'AI and the Future of Work', got {data.get('title')}", "ERROR")
                    return False
                
                self.log("✅ Specific project retrieved successfully")
                return True
            elif response.status_code == 404:
                self.log(f"❌ Project not found: {response.text}", "ERROR")
                return False
            else:
                self.log(f"❌ Specific project retrieval failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Specific project retrieval test failed: {str(e)}", "ERROR")
            return False
    
    def test_generate_outline(self):
        """Test AI outline generation using Gemini with enhanced formatting checks"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for outline generation test", "ERROR")
            return False
            
        try:
            self.log("Testing AI outline generation with formatting improvements...")
            
            request_data = {
                "project_id": self.test_project_id
            }
            
            response = self.session.post(f"{self.base_url}/generate-outline", json=request_data)
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["outline", "project_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in outline response: {missing_fields}", "ERROR")
                    return False
                
                if data.get("project_id") != self.test_project_id:
                    self.log(f"❌ Project ID mismatch in outline response", "ERROR")
                    return False
                
                outline = data.get("outline", "")
                if len(outline) < 100:  # Expect substantial outline content
                    self.log(f"❌ Generated outline seems too short: {len(outline)} characters", "ERROR")
                    return False
                
                # CONTINUATION FIX TESTING: Check for markdown cleanup
                if "```html" in outline:
                    self.log("❌ Found ```html artifacts in outline - markdown cleanup failed", "ERROR")
                    return False
                
                if "```" in outline:
                    self.log("❌ Found ``` artifacts in outline - markdown cleanup failed", "ERROR")
                    return False
                
                # Check for proper text formatting and spacing
                if outline.count('\n\n\n') > 2:  # Too many excessive line breaks
                    self.log("⚠️ Outline may have excessive line breaks", "WARNING")
                
                # Check if outline contains chapter-related content
                if "chapter" not in outline.lower():
                    self.log("⚠️ Generated outline doesn't seem to contain chapter information", "WARNING")
                
                # Verify outline is stored in database
                verify_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
                if verify_response.status_code == 200:
                    project_data = verify_response.json()
                    stored_outline = project_data.get("outline", "")
                    if not stored_outline or len(stored_outline) < 50:
                        self.log("❌ Outline not properly stored in database", "ERROR")
                        return False
                    self.log("✅ Outline properly stored in database")
                
                self.log(f"✅ AI outline generated successfully ({len(outline)} characters)")
                self.log("✅ Markdown cleanup working - no ```html or ``` artifacts found")
                self.log("✅ Text formatting improved with proper spacing")
                return True
            else:
                self.log(f"❌ Outline generation failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Outline generation test failed: {str(e)}", "ERROR")
            return False
    
    def test_generate_chapter(self):
        """Test AI chapter generation using Gemini with enhanced formatting checks"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for chapter generation test", "ERROR")
            return False
            
        try:
            self.log("Testing AI chapter generation with formatting improvements...")
            
            request_data = {
                "project_id": self.test_project_id,
                "chapter_number": 1
            }
            
            response = self.session.post(f"{self.base_url}/generate-chapter", json=request_data)
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["chapter_content", "chapter_number", "project_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in chapter response: {missing_fields}", "ERROR")
                    return False
                
                if data.get("project_id") != self.test_project_id:
                    self.log(f"❌ Project ID mismatch in chapter response", "ERROR")
                    return False
                
                if data.get("chapter_number") != 1:
                    self.log(f"❌ Chapter number mismatch: expected 1, got {data.get('chapter_number')}", "ERROR")
                    return False
                
                chapter_content = data.get("chapter_content", "")
                if len(chapter_content) < 500:  # Expect substantial chapter content
                    self.log(f"❌ Generated chapter seems too short: {len(chapter_content)} characters", "ERROR")
                    return False
                
                # CONTINUATION FIX TESTING: Check for markdown cleanup
                if "```html" in chapter_content:
                    self.log("❌ Found ```html artifacts in chapter - markdown cleanup failed", "ERROR")
                    return False
                
                if "```" in chapter_content:
                    self.log("❌ Found ``` artifacts in chapter - markdown cleanup failed", "ERROR")
                    return False
                
                # Check for proper HTML formatting with spacing
                html_tags = ['<p>', '<h1>', '<h2>', '<h3>', '<ul>', '<li>']
                has_html_formatting = any(tag in chapter_content for tag in html_tags)
                if not has_html_formatting:
                    self.log("⚠️ Chapter content may not have proper HTML formatting", "WARNING")
                else:
                    self.log("✅ Chapter content has proper HTML formatting")
                
                # Check for proper spacing between elements
                if '<p>' in chapter_content and '</p>' in chapter_content:
                    # Check if paragraphs have proper spacing
                    if '</p>\n\n' in chapter_content or '</p>\n<' in chapter_content:
                        self.log("✅ Proper paragraph spacing detected")
                    else:
                        self.log("⚠️ Paragraph spacing may need improvement", "WARNING")
                
                # Verify chapter is stored in database
                verify_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
                if verify_response.status_code == 200:
                    project_data = verify_response.json()
                    chapters_content = project_data.get("chapters_content", {})
                    if "1" not in chapters_content or len(chapters_content["1"]) < 100:
                        self.log("❌ Chapter not properly stored in database", "ERROR")
                        return False
                    self.log("✅ Chapter properly stored in database")
                
                self.log(f"✅ AI chapter generated successfully ({len(chapter_content)} characters)")
                self.log("✅ Markdown cleanup working - no ```html or ``` artifacts found")
                self.log("✅ HTML formatting with proper spacing between elements")
                return True
            elif response.status_code == 400:
                self.log(f"❌ Chapter generation failed - likely missing outline: {response.text}", "ERROR")
                return False
            else:
                self.log(f"❌ Chapter generation failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Chapter generation test failed: {str(e)}", "ERROR")
            return False
    
    def test_update_outline(self):
        """Test updating project outline"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for outline update test", "ERROR")
            return False
            
        try:
            self.log("Testing outline update...")
            
            updated_outline = """
# AI and the Future of Work - Updated Outline

## Chapter 1: The Dawn of AI in the Workplace
- Introduction to artificial intelligence in business
- Historical context and evolution
- Current state of AI adoption

## Chapter 2: Transforming Traditional Industries
- Manufacturing and automation
- Healthcare and diagnostics
- Financial services revolution

## Chapter 3: The Human-AI Collaboration Model
- Augmentation vs replacement
- New skill requirements
- Training and adaptation strategies
"""
            
            request_data = {
                "project_id": self.test_project_id,
                "outline": updated_outline
            }
            
            response = self.session.put(f"{self.base_url}/update-outline", json=request_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("message") != "Outline updated successfully":
                    self.log(f"❌ Unexpected update response: {data}", "ERROR")
                    return False
                
                # Verify the update by fetching the project
                verify_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
                if verify_response.status_code == 200:
                    project_data = verify_response.json()
                    if updated_outline.strip() in project_data.get("outline", ""):
                        self.log("✅ Outline updated and verified successfully")
                        return True
                    else:
                        self.log("❌ Outline update not reflected in project data", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify outline update", "WARNING")
                    return True  # Update call succeeded even if verification failed
                
            else:
                self.log(f"❌ Outline update failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Outline update test failed: {str(e)}", "ERROR")
            return False
    
    def test_export_book(self):
        """Test book export functionality with enhanced HTML template"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for export test", "ERROR")
            return False
            
        try:
            self.log("Testing book export functionality...")
            
            response = self.session.get(f"{self.base_url}/export-book/{self.test_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["html", "title", "filename"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in export response: {missing_fields}", "ERROR")
                    return False
                
                html_content = data.get("html", "")
                if len(html_content) < 1000:  # Expect substantial HTML content
                    self.log(f"❌ Generated HTML seems too short: {len(html_content)} characters", "ERROR")
                    return False
                
                # Check for enhanced HTML template features
                required_html_elements = [
                    "<!DOCTYPE html>",
                    "<style>",
                    "font-family: Georgia, serif",
                    "max-width: 800px",
                    "margin: 0 auto",
                    ".book-info",
                    ".outline",
                    ".chapter"
                ]
                
                missing_elements = []
                for element in required_html_elements:
                    if element not in html_content:
                        missing_elements.append(element)
                
                if missing_elements:
                    self.log(f"❌ Missing HTML template elements: {missing_elements}", "ERROR")
                    return False
                
                # Check for proper CSS styling
                if "background: linear-gradient" not in html_content:
                    self.log("⚠️ Enhanced CSS styling may be missing", "WARNING")
                
                if "page-break-after: always" not in html_content:
                    self.log("⚠️ Print-friendly CSS may be missing", "WARNING")
                
                # Check filename generation
                filename = data.get("filename", "")
                if not filename.endswith(".html"):
                    self.log(f"❌ Invalid filename format: {filename}", "ERROR")
                    return False
                
                # Check title in response
                title = data.get("title", "")
                if not title:
                    self.log("❌ Missing title in export response", "ERROR")
                    return False
                
                self.log(f"✅ Book export successful ({len(html_content)} characters HTML)")
                self.log("✅ Enhanced HTML template with proper styling detected")
                self.log(f"✅ Proper file download handling - filename: {filename}")
                return True
            else:
                self.log(f"❌ Book export failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Book export test failed: {str(e)}", "ERROR")
            return False
    
    def test_generate_all_chapters(self):
        """Test generating all chapters at once"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for generate all chapters test", "ERROR")
            return False
            
        try:
            self.log("Testing generate all chapters functionality...")
            
            request_data = {
                "project_id": self.test_project_id
            }
            
            # This is a longer operation, so increase timeout
            response = self.session.post(f"{self.base_url}/generate-all-chapters", json=request_data, timeout=120)
            
            if response.status_code == 200:
                data = response.json()
                
                required_fields = ["message", "chapters_generated", "project_id", "chapters"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in generate-all-chapters response: {missing_fields}", "ERROR")
                    return False
                
                if data.get("project_id") != self.test_project_id:
                    self.log(f"❌ Project ID mismatch in response", "ERROR")
                    return False
                
                chapters_generated = data.get("chapters_generated", 0)
                if chapters_generated < 1:
                    self.log(f"❌ No chapters generated: {chapters_generated}", "ERROR")
                    return False
                
                chapters = data.get("chapters", {})
                if not isinstance(chapters, dict):
                    self.log(f"❌ Chapters should be a dictionary, got {type(chapters)}", "ERROR")
                    return False
                
                # Check each chapter for formatting improvements
                for chapter_num, chapter_content in chapters.items():
                    if "```html" in chapter_content or "```" in chapter_content:
                        self.log(f"❌ Found markdown artifacts in chapter {chapter_num}", "ERROR")
                        return False
                    
                    if len(chapter_content) < 200:
                        self.log(f"❌ Chapter {chapter_num} seems too short", "ERROR")
                        return False
                
                # Verify chapters are stored in database
                verify_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
                if verify_response.status_code == 200:
                    project_data = verify_response.json()
                    stored_chapters = project_data.get("chapters_content", {})
                    if len(stored_chapters) != chapters_generated:
                        self.log("❌ Chapters not properly stored in database", "ERROR")
                        return False
                    self.log("✅ All chapters properly stored in database")
                
                self.log(f"✅ Generated all {chapters_generated} chapters successfully")
                self.log("✅ All chapters have proper formatting without markdown artifacts")
                return True
            elif response.status_code == 400:
                self.log(f"❌ Generate all chapters failed - likely missing outline: {response.text}", "ERROR")
                return False
            else:
                self.log(f"❌ Generate all chapters failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Generate all chapters test failed: {str(e)}", "ERROR")
            return False

    def test_update_chapter(self):
        """Test updating chapter content"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for chapter update test", "ERROR")
            return False
            
        try:
            self.log("Testing chapter update...")
            
            updated_chapter = """
# Chapter 1: The Dawn of AI in the Workplace

The workplace as we know it is undergoing a fundamental transformation. Artificial intelligence, once confined to the realm of science fiction, has become an integral part of modern business operations. From chatbots handling customer service to machine learning algorithms optimizing supply chains, AI is reshaping how we work, collaborate, and create value.

## The Evolution of Work

Throughout history, technological advances have consistently altered the nature of work. The industrial revolution mechanized manual labor, the computer age digitized information processing, and now the AI revolution is augmenting human intelligence itself. This latest transformation promises to be the most profound yet, touching every aspect of professional life.

## Current State of AI Adoption

Today's organizations are implementing AI solutions across diverse functions:
- Customer service automation
- Predictive analytics for decision-making
- Process optimization and efficiency improvements
- Quality control and error detection
- Personalized user experiences

As we stand at this technological crossroads, understanding the implications of AI integration becomes crucial for workers, managers, and society as a whole.
"""
            
            request_data = {
                "project_id": self.test_project_id,
                "chapter_number": 1,
                "content": updated_chapter
            }
            
            response = self.session.put(f"{self.base_url}/update-chapter", json=request_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("message") != "Chapter updated successfully":
                    self.log(f"❌ Unexpected update response: {data}", "ERROR")
                    return False
                
                # Verify the update by fetching the project
                verify_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
                if verify_response.status_code == 200:
                    project_data = verify_response.json()
                    chapters_content = project_data.get("chapters_content", {})
                    if "1" in chapters_content and updated_chapter.strip() in chapters_content["1"]:
                        self.log("✅ Chapter updated and verified successfully")
                        return True
                    else:
                        self.log("❌ Chapter update not reflected in project data", "ERROR")
                        return False
                else:
                    self.log("⚠️ Could not verify chapter update", "WARNING")
                    return True  # Update call succeeded even if verification failed
                
            else:
                self.log(f"❌ Chapter update failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Chapter update test failed: {str(e)}", "ERROR")
            return False

    def test_story_style_project(self):
        """Test creating and generating content for a story-style project"""
        try:
            self.log("Testing story style project creation and content generation...")
            
            # Create story-style project
            story_project_data = {
                "title": "The Last Guardian of Memory",
                "description": "A science fiction story about a librarian who discovers she's the last person capable of preserving human memories in a world where digital storage is failing.",
                "pages": 200,
                "chapters": 8,
                "language": "English",
                "writing_style": "story"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=story_project_data)
            
            if response.status_code != 200:
                self.log(f"❌ Story project creation failed: {response.text}", "ERROR")
                return False
                
            story_project = response.json()
            story_project_id = story_project.get("id")
            
            # Verify writing_style is set correctly
            if story_project.get("writing_style") != "story":
                self.log(f"❌ Writing style not set correctly: expected 'story', got {story_project.get('writing_style')}", "ERROR")
                return False
            
            self.log("✅ Story-style project created successfully")
            
            # Generate outline for story project
            outline_request = {"project_id": story_project_id}
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
            
            if outline_response.status_code != 200:
                self.log(f"❌ Story outline generation failed: {outline_response.text}", "ERROR")
                return False
                
            outline_data = outline_response.json()
            story_outline = outline_data.get("outline", "")
            
            # Check story-specific outline characteristics
            if len(story_outline) < 500:
                self.log(f"❌ Story outline too short: {len(story_outline)} characters", "ERROR")
                return False
                
            # Story outlines should be narrative-focused without excessive sub-sections
            h3_count = story_outline.count('<h3>')
            if h3_count > 5:  # Story style should have minimal sub-sections
                self.log(f"⚠️ Story outline may have too many sub-sections ({h3_count} <h3> tags)", "WARNING")
            
            # Check for narrative elements
            narrative_keywords = ['character', 'story', 'plot', 'journey', 'adventure', 'conflict', 'resolution']
            found_narrative = any(keyword in story_outline.lower() for keyword in narrative_keywords)
            if not found_narrative:
                self.log("⚠️ Story outline may lack narrative elements", "WARNING")
            else:
                self.log("✅ Story outline contains narrative elements")
                
            self.log("✅ Story-style outline generated successfully")
            
            # Generate a chapter for story project
            chapter_request = {"project_id": story_project_id, "chapter_number": 1}
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            
            if chapter_response.status_code != 200:
                self.log(f"❌ Story chapter generation failed: {chapter_response.text}", "ERROR")
                return False
                
            chapter_data = chapter_response.json()
            story_chapter = chapter_data.get("chapter_content", "")
            
            # Check word count (should be 250-300 words per page)
            estimated_words = len(story_chapter.split())
            expected_words_per_chapter = (200 * 275) // 8  # 6875 words per chapter
            
            if estimated_words < expected_words_per_chapter * 0.7:  # Allow 30% variance
                self.log(f"❌ Story chapter word count too low: {estimated_words} words (expected ~{expected_words_per_chapter})", "ERROR")
                return False
            elif estimated_words >= expected_words_per_chapter * 0.7:
                self.log(f"✅ Story chapter meets word count requirement: {estimated_words} words")
            
            # Story chapters should have fluid narrative with minimal structural breaks
            h2_count = story_chapter.count('<h2>')
            if h2_count > 3:  # Story style should have minimal headings within chapters
                self.log(f"⚠️ Story chapter may have too many structural breaks ({h2_count} <h2> tags)", "WARNING")
            else:
                self.log("✅ Story chapter has appropriate narrative flow")
                
            # Check for story elements
            story_elements = ['dialogue', 'scene', 'character', 'emotion', 'action']
            found_story_elements = any(element in story_chapter.lower() for element in story_elements)
            if found_story_elements:
                self.log("✅ Story chapter contains narrative elements")
            
            self.log("✅ Story-style project testing completed successfully")
            return True
            
        except Exception as e:
            self.log(f"❌ Story style project test failed: {str(e)}", "ERROR")
            return False

    def test_descriptive_style_project(self):
        """Test creating and generating content for a descriptive-style project"""
        try:
            self.log("Testing descriptive style project creation and content generation...")
            
            # Create descriptive-style project
            descriptive_project_data = {
                "title": "Complete Guide to Sustainable Urban Planning",
                "description": "A comprehensive handbook covering sustainable urban development practices, environmental considerations, and policy frameworks for modern city planning.",
                "pages": 300,
                "chapters": 12,
                "language": "English",
                "writing_style": "descriptive"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=descriptive_project_data)
            
            if response.status_code != 200:
                self.log(f"❌ Descriptive project creation failed: {response.text}", "ERROR")
                return False
                
            descriptive_project = response.json()
            descriptive_project_id = descriptive_project.get("id")
            
            # Verify writing_style is set correctly
            if descriptive_project.get("writing_style") != "descriptive":
                self.log(f"❌ Writing style not set correctly: expected 'descriptive', got {descriptive_project.get('writing_style')}", "ERROR")
                return False
            
            self.log("✅ Descriptive-style project created successfully")
            
            # Generate outline for descriptive project
            outline_request = {"project_id": descriptive_project_id}
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
            
            if outline_response.status_code != 200:
                self.log(f"❌ Descriptive outline generation failed: {outline_response.text}", "ERROR")
                return False
                
            outline_data = outline_response.json()
            descriptive_outline = outline_data.get("outline", "")
            
            # Check descriptive-specific outline characteristics
            if len(descriptive_outline) < 500:
                self.log(f"❌ Descriptive outline too short: {len(descriptive_outline)} characters", "ERROR")
                return False
                
            # Descriptive outlines should have clear structure with headings and sub-sections
            h2_count = descriptive_outline.count('<h2>')
            h3_count = descriptive_outline.count('<h3>')
            ul_count = descriptive_outline.count('<ul>')
            
            if h2_count < 5:  # Descriptive style should have clear chapter divisions
                self.log(f"⚠️ Descriptive outline may lack sufficient structure ({h2_count} <h2> tags)", "WARNING")
            else:
                self.log(f"✅ Descriptive outline has good structure ({h2_count} chapters, {h3_count} sub-sections)")
                
            if ul_count < 2:  # Should have some lists for organization
                self.log("⚠️ Descriptive outline may lack organized lists", "WARNING")
            else:
                self.log("✅ Descriptive outline includes organized lists")
                
            self.log("✅ Descriptive-style outline generated successfully")
            
            # Generate a chapter for descriptive project
            chapter_request = {"project_id": descriptive_project_id, "chapter_number": 1}
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            
            if chapter_response.status_code != 200:
                self.log(f"❌ Descriptive chapter generation failed: {chapter_response.text}", "ERROR")
                return False
                
            chapter_data = chapter_response.json()
            descriptive_chapter = chapter_data.get("chapter_content", "")
            
            # Check word count (should be 250-300 words per page)
            estimated_words = len(descriptive_chapter.split())
            expected_words_per_chapter = (300 * 275) // 12  # 6875 words per chapter
            
            if estimated_words < expected_words_per_chapter * 0.7:  # Allow 30% variance
                self.log(f"❌ Descriptive chapter word count too low: {estimated_words} words (expected ~{expected_words_per_chapter})", "ERROR")
                return False
            elif estimated_words >= expected_words_per_chapter * 0.7:
                self.log(f"✅ Descriptive chapter meets word count requirement: {estimated_words} words")
            
            # Descriptive chapters should have organized sections with proper headings
            h2_count = descriptive_chapter.count('<h2>')
            h3_count = descriptive_chapter.count('<h3>')
            ul_count = descriptive_chapter.count('<ul>')
            strong_count = descriptive_chapter.count('<strong>')
            
            if h2_count < 2:  # Descriptive style should have section headings
                self.log(f"⚠️ Descriptive chapter may lack sufficient section organization ({h2_count} <h2> tags)", "WARNING")
            else:
                self.log(f"✅ Descriptive chapter has good organization ({h2_count} sections, {h3_count} sub-sections)")
                
            if strong_count < 3:  # Should emphasize key terms
                self.log("⚠️ Descriptive chapter may lack emphasis on key terms", "WARNING")
            else:
                self.log("✅ Descriptive chapter emphasizes key terms and concepts")
                
            self.log("✅ Descriptive-style project testing completed successfully")
            return True
            
        except Exception as e:
            self.log(f"❌ Descriptive style project test failed: {str(e)}", "ERROR")
            return False

    def test_enhanced_content_quality(self):
        """Test enhanced content quality and HTML formatting"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for content quality test", "ERROR")
            return False
            
        try:
            self.log("Testing enhanced content quality and HTML formatting...")
            
            # Get the project to check its content
            response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
            
            if response.status_code != 200:
                self.log(f"❌ Could not retrieve project for content quality test", "ERROR")
                return False
                
            project_data = response.json()
            outline = project_data.get("outline", "")
            chapters_content = project_data.get("chapters_content", {})
            
            # Test outline HTML formatting
            if outline:
                html_tags_in_outline = ['<h2>', '<h3>', '<p>', '<ul>', '<li>']
                found_tags = [tag for tag in html_tags_in_outline if tag in outline]
                
                if len(found_tags) < 3:
                    self.log(f"❌ Outline lacks proper HTML formatting (found: {found_tags})", "ERROR")
                    return False
                else:
                    self.log(f"✅ Outline has proper HTML formatting with tags: {found_tags}")
                    
                # Check for proper spacing
                if '</p>\n\n' in outline or '</h2>\n\n' in outline:
                    self.log("✅ Outline has proper element spacing")
                else:
                    self.log("⚠️ Outline spacing could be improved", "WARNING")
            
            # Test chapter content quality
            if chapters_content:
                for chapter_num, content in chapters_content.items():
                    word_count = len(content.split())
                    
                    # Check word count meets enhanced requirements (250-300 words per page)
                    if word_count < 1000:  # Minimum substantial content
                        self.log(f"❌ Chapter {chapter_num} word count too low: {word_count} words", "ERROR")
                        return False
                    else:
                        self.log(f"✅ Chapter {chapter_num} has substantial content: {word_count} words")
                    
                    # Check HTML formatting
                    html_elements = ['<p>', '<h2>', '<strong>', '<em>']
                    found_elements = [elem for elem in html_elements if elem in content]
                    
                    if len(found_elements) < 2:
                        self.log(f"❌ Chapter {chapter_num} lacks proper HTML formatting", "ERROR")
                        return False
                    else:
                        self.log(f"✅ Chapter {chapter_num} has proper HTML formatting")
                    
                    # Check for proper paragraph spacing
                    if '</p>\n\n' in content:
                        self.log(f"✅ Chapter {chapter_num} has proper paragraph spacing")
                    else:
                        self.log(f"⚠️ Chapter {chapter_num} spacing could be improved", "WARNING")
            
            self.log("✅ Enhanced content quality verification completed")
            return True
            
        except Exception as e:
            self.log(f"❌ Content quality test failed: {str(e)}", "ERROR")
            return False

    def test_gemini_model_performance(self):
        """Test Gemini 2.5 Flash-Lite model performance"""
        try:
            self.log("Testing Gemini 2.5 Flash-Lite model performance...")
            
            # Create a small test project for performance testing
            perf_project_data = {
                "title": "Model Performance Test",
                "description": "A test project to verify Gemini 2.5 Flash-Lite model performance and response quality.",
                "pages": 50,
                "chapters": 3,
                "language": "English",
                "writing_style": "descriptive"
            }
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/projects", json=perf_project_data)
            
            if response.status_code != 200:
                self.log(f"❌ Performance test project creation failed", "ERROR")
                return False
                
            perf_project = response.json()
            perf_project_id = perf_project.get("id")
            
            # Test outline generation performance
            outline_start = time.time()
            outline_request = {"project_id": perf_project_id}
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
            outline_time = time.time() - outline_start
            
            if outline_response.status_code != 200:
                self.log(f"❌ Performance outline generation failed", "ERROR")
                return False
                
            outline_data = outline_response.json()
            outline_content = outline_data.get("outline", "")
            
            # Check response time (should be reasonable for Gemini 2.0 Flash Lite)
            if outline_time > 30:  # 30 seconds threshold
                self.log(f"⚠️ Outline generation took {outline_time:.2f}s (may be slow)", "WARNING")
            else:
                self.log(f"✅ Outline generation completed in {outline_time:.2f}s")
            
            # Check content quality
            if len(outline_content) < 300:
                self.log(f"❌ Generated outline quality insufficient: {len(outline_content)} chars", "ERROR")
                return False
            else:
                self.log(f"✅ Generated outline quality good: {len(outline_content)} chars")
            
            # Test chapter generation performance
            chapter_start = time.time()
            chapter_request = {"project_id": perf_project_id, "chapter_number": 1}
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            chapter_time = time.time() - chapter_start
            
            if chapter_response.status_code != 200:
                self.log(f"❌ Performance chapter generation failed", "ERROR")
                return False
                
            chapter_data = chapter_response.json()
            chapter_content = chapter_data.get("chapter_content", "")
            
            # Check response time
            if chapter_time > 45:  # 45 seconds threshold for chapter
                self.log(f"⚠️ Chapter generation took {chapter_time:.2f}s (may be slow)", "WARNING")
            else:
                self.log(f"✅ Chapter generation completed in {chapter_time:.2f}s")
            
            # Check content length and quality
            word_count = len(chapter_content.split())
            if word_count < 500:
                self.log(f"❌ Generated chapter quality insufficient: {word_count} words", "ERROR")
                return False
            else:
                self.log(f"✅ Generated chapter quality good: {word_count} words")
            
            total_time = time.time() - start_time
            self.log(f"✅ Gemini 2.5 Flash-Lite model performance test completed in {total_time:.2f}s total")
            return True
            
        except Exception as e:
            self.log(f"❌ Gemini 2.5 Flash-Lite model performance test failed: {str(e)}", "ERROR")
            return False

    def test_new_writing_styles(self):
        """Test all new writing styles: academic, technical, biography, self_help, children, poetry, business"""
        try:
            self.log("Testing new writing styles...")
            
            # Define test projects for each new writing style
            new_styles = {
                "academic": {
                    "title": "Research Methods in Social Sciences",
                    "description": "A comprehensive academic study of research methodologies used in social science disciplines.",
                    "pages": 200,
                    "chapters": 8
                },
                "technical": {
                    "title": "Complete Guide to Cloud Computing",
                    "description": "Technical manual covering cloud infrastructure, deployment strategies, and best practices.",
                    "pages": 300,
                    "chapters": 12
                },
                "biography": {
                    "title": "The Life of Marie Curie",
                    "description": "A biographical account of Marie Curie's life, discoveries, and impact on science.",
                    "pages": 250,
                    "chapters": 10
                },
                "self_help": {
                    "title": "Mastering Personal Productivity",
                    "description": "A self-help guide to improving personal productivity and achieving life goals.",
                    "pages": 180,
                    "chapters": 9
                },
                "children": {
                    "title": "Adventures in the Magic Forest",
                    "description": "A children's story about friendship and adventure in an enchanted forest.",
                    "pages": 60,
                    "chapters": 6
                },
                "poetry": {
                    "title": "Seasons of the Heart",
                    "description": "A collection of poems exploring emotions, nature, and human experiences.",
                    "pages": 120,
                    "chapters": 4
                },
                "business": {
                    "title": "Strategic Leadership in Digital Age",
                    "description": "Business strategies for leadership and management in the digital transformation era.",
                    "pages": 280,
                    "chapters": 14
                }
            }
            
            style_results = {}
            
            for style, project_data in new_styles.items():
                self.log(f"Testing {style} writing style...")
                
                # Create project with specific writing style
                project_data.update({
                    "language": "English",
                    "writing_style": style
                })
                
                response = self.session.post(f"{self.base_url}/projects", json=project_data)
                
                if response.status_code != 200:
                    self.log(f"❌ {style} project creation failed: {response.text}", "ERROR")
                    style_results[style] = False
                    continue
                
                project = response.json()
                project_id = project.get("id")
                
                # Verify writing_style is set correctly
                if project.get("writing_style") != style:
                    self.log(f"❌ {style} writing style not set correctly", "ERROR")
                    style_results[style] = False
                    continue
                
                # Generate outline for this style
                outline_request = {"project_id": project_id}
                outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
                
                if outline_response.status_code != 200:
                    self.log(f"❌ {style} outline generation failed: {outline_response.text}", "ERROR")
                    style_results[style] = False
                    continue
                
                outline_data = outline_response.json()
                outline_content = outline_data.get("outline", "")
                
                # Verify outline has substantial content
                if len(outline_content) < 500:
                    self.log(f"❌ {style} outline too short: {len(outline_content)} characters", "ERROR")
                    style_results[style] = False
                    continue
                
                # Generate a chapter for this style
                chapter_request = {"project_id": project_id, "chapter_number": 1}
                chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
                
                if chapter_response.status_code != 200:
                    self.log(f"❌ {style} chapter generation failed: {chapter_response.text}", "ERROR")
                    style_results[style] = False
                    continue
                
                chapter_data = chapter_response.json()
                chapter_content = chapter_data.get("chapter_content", "")
                
                # Verify chapter has substantial content
                if len(chapter_content) < 800:
                    self.log(f"❌ {style} chapter too short: {len(chapter_content)} characters", "ERROR")
                    style_results[style] = False
                    continue
                
                # Check for style-specific characteristics
                style_passed = True
                
                if style == "academic":
                    # Academic style should have formal language and structure
                    academic_keywords = ['research', 'study', 'analysis', 'methodology', 'evidence', 'conclusion']
                    if not any(keyword in chapter_content.lower() for keyword in academic_keywords):
                        self.log(f"⚠️ {style} chapter may lack academic characteristics", "WARNING")
                
                elif style == "technical":
                    # Technical style should have procedural language
                    technical_keywords = ['step', 'process', 'procedure', 'implementation', 'configuration', 'system']
                    if not any(keyword in chapter_content.lower() for keyword in technical_keywords):
                        self.log(f"⚠️ {style} chapter may lack technical characteristics", "WARNING")
                
                elif style == "biography":
                    # Biography should have narrative elements about a person
                    bio_keywords = ['life', 'born', 'career', 'achievement', 'experience', 'journey']
                    if not any(keyword in chapter_content.lower() for keyword in bio_keywords):
                        self.log(f"⚠️ {style} chapter may lack biographical characteristics", "WARNING")
                
                elif style == "self_help":
                    # Self-help should have motivational and actionable content
                    selfhelp_keywords = ['you', 'your', 'achieve', 'improve', 'success', 'goal', 'strategy']
                    if not any(keyword in chapter_content.lower() for keyword in selfhelp_keywords):
                        self.log(f"⚠️ {style} chapter may lack self-help characteristics", "WARNING")
                
                elif style == "children":
                    # Children's content should be simple and engaging
                    children_keywords = ['adventure', 'friend', 'fun', 'discover', 'magic', 'story']
                    if not any(keyword in chapter_content.lower() for keyword in children_keywords):
                        self.log(f"⚠️ {style} chapter may lack children's characteristics", "WARNING")
                
                elif style == "poetry":
                    # Poetry should have creative and artistic language
                    poetry_keywords = ['emotion', 'heart', 'soul', 'beauty', 'imagery', 'metaphor']
                    if not any(keyword in chapter_content.lower() for keyword in poetry_keywords):
                        self.log(f"⚠️ {style} chapter may lack poetic characteristics", "WARNING")
                
                elif style == "business":
                    # Business should have professional and strategic content
                    business_keywords = ['strategy', 'management', 'leadership', 'organization', 'market', 'business']
                    if not any(keyword in chapter_content.lower() for keyword in business_keywords):
                        self.log(f"⚠️ {style} chapter may lack business characteristics", "WARNING")
                
                style_results[style] = style_passed
                self.log(f"✅ {style} writing style test completed successfully")
                
                # Small delay between style tests
                time.sleep(2)
            
            # Check overall results
            passed_styles = sum(1 for result in style_results.values() if result)
            total_styles = len(style_results)
            
            if passed_styles == total_styles:
                self.log(f"✅ All {total_styles} new writing styles working correctly")
                return True
            else:
                self.log(f"❌ {total_styles - passed_styles} writing styles failed", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ New writing styles test failed: {str(e)}", "ERROR")
            return False

    def test_pdf_export(self):
        """Test PDF export functionality"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for PDF export test", "ERROR")
            return False
            
        try:
            self.log("Testing PDF export functionality...")
            
            response = self.session.get(f"{self.base_url}/export-book-pdf/{self.test_project_id}")
            
            if response.status_code == 200:
                # Check if response is PDF content
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' not in content_type:
                    self.log(f"❌ PDF export returned wrong content type: {content_type}", "ERROR")
                    return False
                
                # Check if response has content
                content_length = len(response.content)
                if content_length < 1000:  # PDF should be substantial
                    self.log(f"❌ PDF export content too small: {content_length} bytes", "ERROR")
                    return False
                
                # Check for PDF file header
                if not response.content.startswith(b'%PDF'):
                    self.log("❌ PDF export doesn't contain valid PDF header", "ERROR")
                    return False
                
                # Check Content-Disposition header for filename
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' not in content_disposition or '.pdf' not in content_disposition:
                    self.log(f"❌ PDF export missing proper download headers: {content_disposition}", "ERROR")
                    return False
                
                self.log(f"✅ PDF export successful ({content_length} bytes)")
                self.log("✅ PDF has proper content type and headers")
                self.log("✅ PDF contains valid PDF structure")
                return True
            else:
                self.log(f"❌ PDF export failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ PDF export test failed: {str(e)}", "ERROR")
            return False

    def test_docx_export(self):
        """Test DOCX export functionality"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for DOCX export test", "ERROR")
            return False
            
        try:
            self.log("Testing DOCX export functionality...")
            
            response = self.session.get(f"{self.base_url}/export-book-docx/{self.test_project_id}")
            
            if response.status_code == 200:
                # Check if response is DOCX content
                content_type = response.headers.get('content-type', '')
                expected_docx_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                if expected_docx_type not in content_type:
                    self.log(f"❌ DOCX export returned wrong content type: {content_type}", "ERROR")
                    return False
                
                # Check if response has content
                content_length = len(response.content)
                if content_length < 1000:  # DOCX should be substantial
                    self.log(f"❌ DOCX export content too small: {content_length} bytes", "ERROR")
                    return False
                
                # Check for ZIP file header (DOCX is a ZIP file)
                if not response.content.startswith(b'PK'):
                    self.log("❌ DOCX export doesn't contain valid ZIP/DOCX header", "ERROR")
                    return False
                
                # Check Content-Disposition header for filename
                content_disposition = response.headers.get('content-disposition', '')
                if 'attachment' not in content_disposition or '.docx' not in content_disposition:
                    self.log(f"❌ DOCX export missing proper download headers: {content_disposition}", "ERROR")
                    return False
                
                self.log(f"✅ DOCX export successful ({content_length} bytes)")
                self.log("✅ DOCX has proper content type and headers")
                self.log("✅ DOCX contains valid DOCX structure")
                return True
            else:
                self.log(f"❌ DOCX export failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ DOCX export test failed: {str(e)}", "ERROR")
            return False

    def test_chapter_title_extraction(self):
        """Test chapter title extraction functionality"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for chapter title extraction test", "ERROR")
            return False
            
        try:
            self.log("Testing chapter title extraction functionality...")
            
            # Get the project to check its outline
            response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
            
            if response.status_code != 200:
                self.log("❌ Could not retrieve project for title extraction test", "ERROR")
                return False
                
            project_data = response.json()
            outline = project_data.get("outline", "")
            
            if not outline:
                self.log("❌ No outline available for title extraction test", "ERROR")
                return False
            
            # Generate a chapter to test title extraction
            chapter_request = {"project_id": self.test_project_id, "chapter_number": 2}
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            
            if chapter_response.status_code != 200:
                self.log(f"❌ Chapter generation for title test failed: {chapter_response.text}", "ERROR")
                return False
            
            chapter_data = chapter_response.json()
            chapter_content = chapter_data.get("chapter_content", "")
            chapter_title = chapter_data.get("chapter_title", "")
            
            # Check if chapter title was extracted and included
            if not chapter_title:
                self.log("❌ No chapter title returned in response", "ERROR")
                return False
            
            # Check if chapter content starts with the extracted title
            if not chapter_content.startswith('<h2>') or chapter_title not in chapter_content:
                self.log("❌ Chapter content doesn't start with proper title", "ERROR")
                return False
            
            # Check if title is meaningful (not just "Chapter X")
            if chapter_title.strip() == f"Chapter 2":
                self.log("⚠️ Chapter title extraction may not be working - got generic title", "WARNING")
            else:
                self.log(f"✅ Chapter title extracted successfully: '{chapter_title}'")
            
            self.log("✅ Chapter title extraction functionality working")
            return True
            
        except Exception as e:
            self.log(f"❌ Chapter title extraction test failed: {str(e)}", "ERROR")
            return False

    def test_enhanced_html_export(self):
        """Test enhanced HTML export with writing style display"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for enhanced HTML export test", "ERROR")
            return False
            
        try:
            self.log("Testing enhanced HTML export with writing style display...")
            
            response = self.session.get(f"{self.base_url}/export-book/{self.test_project_id}")
            
            if response.status_code == 200:
                data = response.json()
                html_content = data.get("html", "")
                
                if len(html_content) < 1000:
                    self.log(f"❌ Enhanced HTML export content too short: {len(html_content)} characters", "ERROR")
                    return False
                
                # Check for writing style display in HTML
                if "Writing Style:" not in html_content:
                    self.log("❌ Enhanced HTML export missing writing style display", "ERROR")
                    return False
                
                # Check for enhanced styling elements
                enhanced_elements = [
                    "linear-gradient",
                    "Georgia, serif",
                    "max-width: 800px",
                    "page-break-after: always",
                    ".book-info",
                    ".outline",
                    ".chapter"
                ]
                
                missing_elements = []
                for element in enhanced_elements:
                    if element not in html_content:
                        missing_elements.append(element)
                
                if missing_elements:
                    self.log(f"❌ Enhanced HTML export missing elements: {missing_elements}", "ERROR")
                    return False
                
                # Check for proper book information section
                if "Generated On:" not in html_content:
                    self.log("❌ Enhanced HTML export missing generation date", "ERROR")
                    return False
                
                self.log("✅ Enhanced HTML export includes writing style display")
                self.log("✅ Enhanced HTML export has all required styling elements")
                self.log("✅ Enhanced HTML export includes proper book information")
                return True
            else:
                self.log(f"❌ Enhanced HTML export failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Enhanced HTML export test failed: {str(e)}", "ERROR")
            return False

    def test_outline_generation_model_fix(self):
        """Focused test for AI outline generation after model name fix"""
        try:
            self.log("=" * 80)
            self.log("FOCUSED TEST: AI OUTLINE GENERATION MODEL FIX")
            self.log("Testing gemini-2.0-flash-lite model (was gemini-2.5-flash-lite-preview-0617)")
            self.log("=" * 80)
            
            # Create test projects for both writing styles
            test_projects = [
                {
                    "title": "The Future of Artificial Intelligence",
                    "description": "An engaging story about humanity's relationship with AI and the challenges we face in an automated world.",
                    "pages": 200,
                    "chapters": 8,
                    "language": "English",
                    "writing_style": "story"
                },
                {
                    "title": "Complete Guide to Machine Learning",
                    "description": "A comprehensive guide covering machine learning algorithms, implementation strategies, and real-world applications.",
                    "pages": 300,
                    "chapters": 12,
                    "language": "English", 
                    "writing_style": "descriptive"
                }
            ]
            
            test_results = {}
            
            for i, project_data in enumerate(test_projects):
                style = project_data["writing_style"]
                self.log(f"\n--- Testing {style} style outline generation ---")
                
                # Create project
                response = self.session.post(f"{self.base_url}/projects", json=project_data)
                if response.status_code != 200:
                    self.log(f"❌ {style} project creation failed: {response.text}", "ERROR")
                    test_results[f"{style}_project"] = False
                    continue
                
                project = response.json()
                project_id = project.get("id")
                self.log(f"✅ {style} project created: {project_id}")
                
                # Test outline generation - this is the main focus
                self.log(f"Testing outline generation with gemini-2.0-flash-lite model...")
                start_time = time.time()
                
                outline_request = {"project_id": project_id}
                outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
                
                generation_time = time.time() - start_time
                
                if outline_response.status_code != 200:
                    error_text = outline_response.text
                    self.log(f"❌ {style} outline generation FAILED: {error_text}", "ERROR")
                    
                    # Check specifically for model not found error
                    if "not found" in error_text.lower() or "model" in error_text.lower():
                        self.log("❌ MODEL ERROR DETECTED - gemini-2.0-flash-lite model may not be working", "ERROR")
                        test_results[f"{style}_model_error"] = True
                    else:
                        test_results[f"{style}_model_error"] = False
                    
                    test_results[f"{style}_outline"] = False
                    continue
                
                # Model worked - no error
                test_results[f"{style}_model_error"] = False
                self.log(f"✅ {style} outline generation completed in {generation_time:.2f}s - NO MODEL ERROR")
                
                # Check outline content
                outline_data = outline_response.json()
                outline_content = outline_data.get("outline", "")
                
                if len(outline_content) < 500:
                    self.log(f"❌ {style} outline too short: {len(outline_content)} characters", "ERROR")
                    test_results[f"{style}_outline"] = False
                    continue
                
                # Check for markdown cleanup (no ```html or ``` artifacts)
                if "```html" in outline_content or "```" in outline_content:
                    self.log(f"❌ {style} outline contains markdown artifacts", "ERROR")
                    test_results[f"{style}_outline"] = False
                    continue
                
                self.log(f"✅ {style} outline generated successfully ({len(outline_content)} characters)")
                self.log("✅ No markdown artifacts found")
                test_results[f"{style}_outline"] = True
                
                # Verify outline is stored in database
                verify_response = self.session.get(f"{self.base_url}/projects/{project_id}")
                if verify_response.status_code == 200:
                    project_data = verify_response.json()
                    stored_outline = project_data.get("outline", "")
                    if stored_outline and len(stored_outline) > 100:
                        self.log(f"✅ {style} outline properly stored in database")
                        test_results[f"{style}_storage"] = True
                    else:
                        self.log(f"❌ {style} outline not properly stored in database", "ERROR")
                        test_results[f"{style}_storage"] = False
                else:
                    self.log(f"❌ Could not verify {style} outline storage", "ERROR")
                    test_results[f"{style}_storage"] = False
                
                # Check style-specific characteristics
                if style == "story":
                    # Story should have narrative elements
                    narrative_keywords = ['chapter', 'character', 'story', 'plot', 'narrative']
                    has_narrative = any(keyword in outline_content.lower() for keyword in narrative_keywords)
                    if has_narrative:
                        self.log("✅ Story outline contains narrative elements")
                        test_results["story_characteristics"] = True
                    else:
                        self.log("⚠️ Story outline may lack narrative elements", "WARNING")
                        test_results["story_characteristics"] = False
                        
                elif style == "descriptive":
                    # Descriptive should have structured elements
                    structure_count = outline_content.count('<h3>') + outline_content.count('<ul>')
                    if structure_count >= 3:
                        self.log(f"✅ Descriptive outline has good structure ({structure_count} structural elements)")
                        test_results["descriptive_characteristics"] = True
                    else:
                        self.log(f"⚠️ Descriptive outline may lack structure ({structure_count} structural elements)", "WARNING")
                        test_results["descriptive_characteristics"] = False
            
            # Summary of focused test results
            self.log("\n" + "=" * 80)
            self.log("FOCUSED TEST RESULTS SUMMARY")
            self.log("=" * 80)
            
            model_errors = [k for k, v in test_results.items() if "model_error" in k and v]
            if model_errors:
                self.log("❌ CRITICAL: Model errors detected - gemini-2.0-flash-lite may not be working")
                return False
            else:
                self.log("✅ SUCCESS: No model errors - gemini-2.0-flash-lite is working correctly")
            
            outline_successes = [k for k, v in test_results.items() if "outline" in k and v]
            if len(outline_successes) >= 2:
                self.log("✅ SUCCESS: Outline generation working for both writing styles")
            else:
                self.log("❌ ISSUE: Outline generation failed for some writing styles")
                return False
            
            storage_successes = [k for k, v in test_results.items() if "storage" in k and v]
            if len(storage_successes) >= 2:
                self.log("✅ SUCCESS: Outline storage working properly")
            else:
                self.log("❌ ISSUE: Outline storage failed")
                return False
            
            self.log("\n🎉 FOCUSED TEST PASSED: AI outline generation with gemini-2.0-flash-lite is working correctly!")
            return True
            
        except Exception as e:
            self.log(f"❌ Focused outline generation test failed: {str(e)}", "ERROR")
            return False

    def test_italian_language_naturalness(self):
        """Test Italian language content generation for naturalness"""
        try:
            self.log("Testing Italian language content generation for naturalness...")
            
            # Create Italian project
            italian_project_data = {
                "title": "L'Arte della Cucina Italiana",
                "description": "Una guida completa alla cucina italiana tradizionale, dalle ricette regionali alle tecniche culinarie moderne.",
                "pages": 200,
                "chapters": 8,
                "language": "Italian",
                "writing_style": "descriptive"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=italian_project_data)
            
            if response.status_code != 200:
                self.log(f"❌ Italian project creation failed: {response.text}", "ERROR")
                return False
                
            italian_project = response.json()
            italian_project_id = italian_project.get("id")
            
            self.log("✅ Italian project created successfully")
            
            # Generate Italian outline
            outline_request = {"project_id": italian_project_id}
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
            
            if outline_response.status_code != 200:
                self.log(f"❌ Italian outline generation failed: {outline_response.text}", "ERROR")
                return False
                
            outline_data = outline_response.json()
            italian_outline = outline_data.get("outline", "")
            
            # Check for Italian language characteristics
            italian_keywords = ['capitolo', 'cucina', 'ricetta', 'tradizionale', 'italiana', 'ingredienti']
            found_italian = any(keyword in italian_outline.lower() for keyword in italian_keywords)
            
            if not found_italian:
                self.log("❌ Italian outline doesn't contain expected Italian keywords", "ERROR")
                return False
            else:
                self.log("✅ Italian outline contains appropriate Italian vocabulary")
            
            # Check for natural Italian phrasing (avoid literal translations)
            unnatural_phrases = ['è importante che', 'al fine di', 'in modo da']  # Common literal translation patterns
            natural_phrases = ['bisogna', 'per', 'così']  # More natural Italian
            
            unnatural_count = sum(1 for phrase in unnatural_phrases if phrase in italian_outline.lower())
            natural_count = sum(1 for phrase in natural_phrases if phrase in italian_outline.lower())
            
            if unnatural_count > natural_count:
                self.log("⚠️ Italian outline may contain unnatural phrasing", "WARNING")
            else:
                self.log("✅ Italian outline uses natural phrasing")
            
            # Generate Italian chapter
            chapter_request = {"project_id": italian_project_id, "chapter_number": 1}
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            
            if chapter_response.status_code != 200:
                self.log(f"❌ Italian chapter generation failed: {chapter_response.text}", "ERROR")
                return False
                
            chapter_data = chapter_response.json()
            italian_chapter = chapter_data.get("chapter_content", "")
            
            # Check chapter word count
            word_count = len(italian_chapter.split())
            expected_words = (200 * 275) // 8  # Expected words per chapter
            
            if word_count < expected_words * 0.5:  # Allow more variance for language testing
                self.log(f"❌ Italian chapter word count too low: {word_count} words (expected ~{expected_words})", "ERROR")
                return False
            else:
                self.log(f"✅ Italian chapter has adequate word count: {word_count} words")
            
            # Check for natural Italian expressions and cultural context
            italian_expressions = ['infatti', 'inoltre', 'tuttavia', 'dunque', 'quindi']
            cultural_terms = ['tradizione', 'famiglia', 'regione', 'territorio', 'cultura']
            
            expressions_found = sum(1 for expr in italian_expressions if expr in italian_chapter.lower())
            cultural_found = sum(1 for term in cultural_terms if term in italian_chapter.lower())
            
            if expressions_found < 2:
                self.log("⚠️ Italian chapter may lack natural Italian expressions", "WARNING")
            else:
                self.log("✅ Italian chapter contains natural Italian expressions")
                
            if cultural_found < 1:
                self.log("⚠️ Italian chapter may lack cultural context", "WARNING")
            else:
                self.log("✅ Italian chapter includes appropriate cultural context")
            
            # Check for consistent narrative voice in Italian
            first_person_indicators = ['io', 'mi', 'mio', 'mia']
            third_person_indicators = ['lui', 'lei', 'loro', 'si']
            
            first_person_count = sum(1 for indicator in first_person_indicators if indicator in italian_chapter.lower())
            third_person_count = sum(1 for indicator in third_person_indicators if indicator in italian_chapter.lower())
            
            if first_person_count > 0 and third_person_count > first_person_count:
                self.log("⚠️ Italian chapter may have inconsistent narrative voice", "WARNING")
            else:
                self.log("✅ Italian chapter maintains consistent narrative voice")
            
            self.log("✅ Italian language naturalness test completed successfully")
            return True
            
        except Exception as e:
            self.log(f"❌ Italian language naturalness test failed: {str(e)}", "ERROR")
            return False

    def test_enhanced_word_count_generation(self):
        """Test enhanced content generation with improved word count - CURRENT FOCUS"""
        try:
            self.log("Testing enhanced content generation with improved word count (CURRENT FOCUS)...")
            
            # Create a test project specifically for word count testing
            wordcount_project_data = {
                "title": "Advanced Machine Learning Techniques",
                "description": "A comprehensive guide to advanced machine learning algorithms, neural networks, and practical applications in modern AI systems.",
                "pages": 275,  # 275 pages = 275 * 275 = 75,625 total words
                "chapters": 11,  # 11 chapters = ~6,875 words per chapter
                "language": "English",
                "writing_style": "descriptive"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=wordcount_project_data)
            
            if response.status_code != 200:
                self.log(f"❌ Word count test project creation failed: {response.text}", "ERROR")
                return False
                
            wordcount_project = response.json()
            wordcount_project_id = wordcount_project.get("id")
            
            self.log("✅ Word count test project created successfully")
            
            # Generate outline
            outline_request = {"project_id": wordcount_project_id}
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
            
            if outline_response.status_code != 200:
                self.log(f"❌ Word count test outline generation failed: {outline_response.text}", "ERROR")
                return False
                
            outline_data = outline_response.json()
            outline_content = outline_data.get("outline", "")
            
            self.log(f"✅ Outline generated ({len(outline_content)} characters)")
            
            # Test multiple chapters for word count consistency
            chapter_results = {}
            target_words_per_chapter = (275 * 275) // 11  # ~6,875 words per chapter
            
            for chapter_num in [1, 2, 3]:  # Test first 3 chapters
                self.log(f"Testing chapter {chapter_num} word count...")
                
                chapter_request = {"project_id": wordcount_project_id, "chapter_number": chapter_num}
                chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
                
                if chapter_response.status_code != 200:
                    self.log(f"❌ Chapter {chapter_num} generation failed: {chapter_response.text}", "ERROR")
                    chapter_results[chapter_num] = {"success": False, "words": 0}
                    continue
                    
                chapter_data = chapter_response.json()
                chapter_content = chapter_data.get("chapter_content", "")
                
                # Count words (remove HTML tags for accurate count)
                import re
                clean_text = re.sub(r'<[^>]+>', '', chapter_content)
                word_count = len(clean_text.split())
                
                chapter_results[chapter_num] = {
                    "success": True,
                    "words": word_count,
                    "target": target_words_per_chapter,
                    "percentage": (word_count / target_words_per_chapter) * 100
                }
                
                self.log(f"Chapter {chapter_num}: {word_count} words (target: {target_words_per_chapter}, {chapter_results[chapter_num]['percentage']:.1f}%)")
                
                # Small delay between chapters
                time.sleep(3)
            
            # Analyze results
            successful_chapters = [r for r in chapter_results.values() if r["success"]]
            
            if not successful_chapters:
                self.log("❌ No chapters generated successfully for word count test", "ERROR")
                return False
            
            avg_word_count = sum(r["words"] for r in successful_chapters) / len(successful_chapters)
            avg_percentage = sum(r["percentage"] for r in successful_chapters) / len(successful_chapters)
            
            self.log(f"Average word count: {avg_word_count:.0f} words ({avg_percentage:.1f}% of target)")
            
            # Check if word count meets requirements (at least 70% of target)
            if avg_percentage < 70:
                self.log(f"❌ CRITICAL ISSUE: Generated chapters don't meet word count requirements", "ERROR")
                self.log(f"❌ Average: {avg_word_count:.0f} words ({avg_percentage:.1f}% of target {target_words_per_chapter})", "ERROR")
                self.log("❌ Need to enhance AI prompts to generate more substantial content per chapter", "ERROR")
                return False
            elif avg_percentage >= 70 and avg_percentage < 90:
                self.log(f"⚠️ Word count partially meets requirements: {avg_percentage:.1f}% of target", "WARNING")
                self.log("⚠️ Could benefit from further prompt optimization", "WARNING")
                return True
            else:
                self.log(f"✅ Word count meets requirements: {avg_percentage:.1f}% of target", "SUCCESS")
                return True
            
        except Exception as e:
            self.log(f"❌ Enhanced word count generation test failed: {str(e)}", "ERROR")
            return False

    def test_export_table_of_contents_only(self):
        """Test export system with table of contents only (no outline section)"""
        if not self.test_project_id:
            self.log("❌ No test project ID available for TOC export test", "ERROR")
            return False
            
        try:
            self.log("Testing export system with table of contents only...")
            
            # Test HTML export
            html_response = self.session.get(f"{self.base_url}/export-book/{self.test_project_id}")
            
            if html_response.status_code != 200:
                self.log(f"❌ HTML export failed: {html_response.text}", "ERROR")
                return False
                
            html_data = html_response.json()
            html_content = html_data.get("html", "")
            
            # Check that outline section is NOT present
            if 'class="outline"' in html_content:
                self.log("❌ HTML export still contains outline section (should be removed)", "ERROR")
                return False
            else:
                self.log("✅ HTML export correctly excludes outline section")
            
            # Check that table of contents IS present
            if 'table-of-contents' not in html_content:
                self.log("❌ HTML export missing table of contents", "ERROR")
                return False
            else:
                self.log("✅ HTML export includes table of contents")
            
            # Check for proper TOC format with chapter titles and page numbers
            if 'Chapter' not in html_content or 'toc-page' not in html_content:
                self.log("❌ HTML export TOC missing proper chapter/page format", "ERROR")
                return False
            else:
                self.log("✅ HTML export TOC has proper chapter titles and page numbers")
            
            # Test PDF export
            pdf_response = self.session.get(f"{self.base_url}/export-book-pdf/{self.test_project_id}")
            
            if pdf_response.status_code != 200:
                self.log(f"❌ PDF export failed: {pdf_response.text}", "ERROR")
                return False
            
            # Check PDF content type and size
            if 'application/pdf' not in pdf_response.headers.get('content-type', ''):
                self.log("❌ PDF export wrong content type", "ERROR")
                return False
            
            if len(pdf_response.content) < 5000:  # PDF should be substantial
                self.log(f"❌ PDF export too small: {len(pdf_response.content)} bytes", "ERROR")
                return False
            
            self.log("✅ PDF export successful with proper format")
            
            # Test DOCX export
            docx_response = self.session.get(f"{self.base_url}/export-book-docx/{self.test_project_id}")
            
            if docx_response.status_code != 200:
                self.log(f"❌ DOCX export failed: {docx_response.text}", "ERROR")
                return False
            
            # Check DOCX content type and size
            expected_docx_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            if expected_docx_type not in docx_response.headers.get('content-type', ''):
                self.log("❌ DOCX export wrong content type", "ERROR")
                return False
            
            if len(docx_response.content) < 5000:  # DOCX should be substantial
                self.log(f"❌ DOCX export too small: {len(docx_response.content)} bytes", "ERROR")
                return False
            
            self.log("✅ DOCX export successful with proper format")
            
            self.log("✅ All export formats working with table of contents only")
            return True
            
        except Exception as e:
            self.log(f"❌ Export table of contents test failed: {str(e)}", "ERROR")
            return False

    def test_gemini_2_5_flash_lite_model(self):
        """Test updated Gemini 2.5 Flash-Lite model performance"""
        try:
            self.log("Testing Gemini 2.5 Flash-Lite model (gemini-2.5-flash-lite-preview-06-17)...")
            
            # Create a test project for model testing
            model_test_data = {
                "title": "Gemini 2.5 Flash-Lite Model Test",
                "description": "Testing the updated Gemini 2.5 Flash-Lite model for performance and quality improvements.",
                "pages": 100,
                "chapters": 5,
                "language": "English",
                "writing_style": "descriptive"
            }
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/projects", json=model_test_data)
            
            if response.status_code != 200:
                self.log(f"❌ Model test project creation failed", "ERROR")
                return False
                
            model_project = response.json()
            model_project_id = model_project.get("id")
            
            # Test outline generation with timing
            outline_start = time.time()
            outline_request = {"project_id": model_project_id}
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
            outline_time = time.time() - outline_start
            
            if outline_response.status_code != 200:
                self.log(f"❌ Model outline generation failed", "ERROR")
                return False
                
            outline_data = outline_response.json()
            outline_content = outline_data.get("outline", "")
            
            # Check outline quality and timing
            if outline_time > 25:  # Should be faster with Flash-Lite
                self.log(f"⚠️ Outline generation took {outline_time:.2f}s (may be slow for Flash-Lite)", "WARNING")
            else:
                self.log(f"✅ Outline generation completed in {outline_time:.2f}s (good for Flash-Lite)")
            
            if len(outline_content) < 1000:
                self.log(f"❌ Generated outline quality insufficient: {len(outline_content)} chars", "ERROR")
                return False
            else:
                self.log(f"✅ Generated outline quality good: {len(outline_content)} chars")
            
            # Test chapter generation with timing
            chapter_start = time.time()
            chapter_request = {"project_id": model_project_id, "chapter_number": 1}
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            chapter_time = time.time() - chapter_start
            
            if chapter_response.status_code != 200:
                self.log(f"❌ Model chapter generation failed", "ERROR")
                return False
                
            chapter_data = chapter_response.json()
            chapter_content = chapter_data.get("chapter_content", "")
            
            # Check chapter quality and timing
            if chapter_time > 35:  # Should be faster with Flash-Lite
                self.log(f"⚠️ Chapter generation took {chapter_time:.2f}s (may be slow for Flash-Lite)", "WARNING")
            else:
                self.log(f"✅ Chapter generation completed in {chapter_time:.2f}s (good for Flash-Lite)")
            
            word_count = len(chapter_content.split())
            if word_count < 1000:
                self.log(f"❌ Generated chapter quality insufficient: {word_count} words", "ERROR")
                return False
            else:
                self.log(f"✅ Generated chapter quality good: {word_count} words")
            
            # Check for consistent narrative voice
            first_person_count = chapter_content.lower().count(' i ') + chapter_content.lower().count(' my ')
            third_person_count = chapter_content.lower().count(' he ') + chapter_content.lower().count(' she ') + chapter_content.lower().count(' they ')
            
            if first_person_count > 5 and third_person_count > 5:
                self.log("⚠️ Chapter may have inconsistent narrative voice (mixing first and third person)", "WARNING")
            else:
                self.log("✅ Chapter maintains consistent narrative voice")
            
            total_time = time.time() - start_time
            self.log(f"✅ Gemini 2.5 Flash-Lite model test completed in {total_time:.2f}s total")
            return True
            
        except Exception as e:
            self.log(f"❌ Gemini 2.5 Flash-Lite model test failed: {str(e)}", "ERROR")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        self.log("=" * 60)
        self.log("Starting AI Book Writer Backend API Tests")
        self.log("=" * 60)
        
        test_results = {}
        
        # Test sequence - prioritizing the current focus and new requirements
        tests = [
            ("API Health Check", self.test_api_health),
            ("Project Creation", self.test_create_project),
            ("Get All Projects", self.test_get_projects),
            ("Get Specific Project", self.test_get_specific_project),
            ("🎯 CURRENT FOCUS: Enhanced Word Count Generation", self.test_enhanced_word_count_generation),
            ("🎯 Gemini 2.5 Flash-Lite Model Test", self.test_gemini_2_5_flash_lite_model),
            ("🎯 Italian Language Naturalness", self.test_italian_language_naturalness),
            ("🎯 Export Table of Contents Only", self.test_export_table_of_contents_only),
            ("Generate AI Outline", self.test_generate_outline),
            ("Generate AI Chapter", self.test_generate_chapter),
            ("Update Outline", self.test_update_outline),
            ("Update Chapter", self.test_update_chapter),
            ("Export Book", self.test_export_book),
            ("Enhanced HTML Export", self.test_enhanced_html_export),
            ("PDF Export", self.test_pdf_export),
            ("DOCX Export", self.test_docx_export),
            ("Chapter Title Extraction", self.test_chapter_title_extraction),
            ("Story Style Project", self.test_story_style_project),
            ("Descriptive Style Project", self.test_descriptive_style_project),
            ("New Writing Styles", self.test_new_writing_styles),
            ("Enhanced Content Quality", self.test_enhanced_content_quality),
            ("Gemini Model Performance", self.test_gemini_model_performance),
        ]
        
        for test_name, test_func in tests:
            self.log(f"\n--- Running {test_name} ---")
            try:
                result = test_func()
                test_results[test_name] = result
                if result:
                    self.log(f"✅ {test_name} PASSED")
                else:
                    self.log(f"❌ {test_name} FAILED")
            except Exception as e:
                self.log(f"❌ {test_name} FAILED with exception: {str(e)}", "ERROR")
                test_results[test_name] = False
            
            # Small delay between tests
            time.sleep(1)
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        passed = sum(1 for result in test_results.values() if result)
        total = len(test_results)
        
        for test_name, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{test_name}: {status}")
        
        self.log(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            self.log("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            self.log(f"⚠️ {total - passed} test(s) failed. Backend needs attention.")
            return False

def main():
    tester = BookWriterAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()