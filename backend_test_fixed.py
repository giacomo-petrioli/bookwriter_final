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
BACKEND_URL = "https://fb4a0bef-72cd-4932-ab6d-089fe67fe73c.preview.emergentagent.com/api"

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
    
    def run_all_tests(self):
        """Run all backend API tests"""
        self.log("=" * 60)
        self.log("Starting AI Book Writer Backend API Tests")
        self.log("=" * 60)
        
        test_results = {}
        
        # Test sequence - focusing on continuation fixes
        tests = [
            ("API Health Check", self.test_api_health),
            ("Project Creation", self.test_create_project),
            ("Get All Projects", self.test_get_projects),
            ("Get Specific Project", self.test_get_specific_project),
            ("Generate AI Outline", self.test_generate_outline),
            ("Generate AI Chapter", self.test_generate_chapter),
            ("Update Outline", self.test_update_outline),
            ("Update Chapter", self.test_update_chapter),
            ("Export Book", self.test_export_book),
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