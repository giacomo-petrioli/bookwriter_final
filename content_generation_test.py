#!/usr/bin/env python3
"""
Content Generation Testing for AI Book Writer Application
Focuses on testing the enhanced content generation with improved word count
"""

import requests
import json
import time
import sys
import re
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://a4a476c4-1ae3-4338-af34-da4cf0f722a1.preview.emergentagent.com/api"

class ContentGenerationTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.test_project_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.auth_token = None
        self.test_user_data = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test_api_health(self):
        """Test basic API health check"""
        try:
            self.log("Testing API health check...")
            response = self.session.get(f"{self.base_url}/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "AI Book Writer API":
                    self.log("✅ API health check passed - backend is running")
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

    def authenticate_user(self):
        """Authenticate user for testing"""
        try:
            self.log("Authenticating test user...")
            
            # Try to register a test user
            registration_data = {
                "email": "contenttest@bookcraft.ai",
                "name": "Content Test User",
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=registration_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("session_token")
                self.test_user_data = data.get("user")
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log("✅ User registered and authenticated successfully")
                return True
            elif response.status_code == 400:
                # User already exists, try to login
                login_data = {
                    "email": registration_data["email"],
                    "password": registration_data["password"]
                }
                login_response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    login_result = login_response.json()
                    self.auth_token = login_result.get("session_token")
                    self.test_user_data = login_result.get("user")
                    self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                    self.log("✅ User logged in successfully")
                    return True
                else:
                    self.log(f"❌ Login failed: {login_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ Authentication failed: {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication failed: {str(e)}", "ERROR")
            return False

    def create_test_project(self, writing_style="story"):
        """Create a test project for content generation"""
        try:
            self.log(f"Creating test project with {writing_style} style...")
            
            project_data = {
                "title": f"Content Generation Test - {writing_style.title()} Style",
                "description": "A test project to evaluate AI content generation quality and word count for different writing styles.",
                "pages": 275,  # Target 275 pages
                "chapters": 10,  # 10 chapters
                "language": "English",
                "writing_style": writing_style
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_project_id = data.get("id")
                self.log(f"✅ Test project created successfully with ID: {self.test_project_id}")
                self.log(f"✅ Project details: {project_data['pages']} pages, {project_data['chapters']} chapters")
                self.log(f"✅ Expected words per chapter: {(project_data['pages'] * 275) // project_data['chapters']} words")
                return True
            else:
                self.log(f"❌ Project creation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Project creation failed: {str(e)}", "ERROR")
            return False

    def test_outline_generation(self):
        """Test outline generation with enhanced formatting"""
        try:
            self.log("Testing outline generation...")
            
            request_data = {
                "project_id": self.test_project_id
            }
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/generate-outline", json=request_data)
            generation_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                outline = data.get("outline", "")
                
                self.log(f"✅ Outline generated successfully in {generation_time:.2f}s")
                self.log(f"✅ Outline length: {len(outline)} characters")
                
                # Check for markdown cleanup
                if "```html" in outline or "```" in outline:
                    self.log("❌ Found markdown artifacts in outline", "ERROR")
                    return False
                else:
                    self.log("✅ Markdown cleanup working - no artifacts found")
                
                # Check for HTML formatting
                html_tags = ['<h2>', '<h3>', '<p>', '<ul>', '<li>']
                has_html = any(tag in outline for tag in html_tags)
                if has_html:
                    self.log("✅ Outline has proper HTML formatting")
                else:
                    self.log("⚠️ Outline may lack proper HTML formatting", "WARNING")
                
                # Check for chapter structure
                chapter_count = outline.lower().count('chapter')
                if chapter_count >= 8:  # Should have at least 8 chapter references for 10 chapters
                    self.log(f"✅ Outline contains proper chapter structure ({chapter_count} chapter references)")
                else:
                    self.log(f"⚠️ Outline may lack proper chapter structure ({chapter_count} chapter references)", "WARNING")
                
                return True
            else:
                self.log(f"❌ Outline generation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Outline generation test failed: {str(e)}", "ERROR")
            return False

    def test_chapter_generation_word_count(self, chapter_number=1):
        """Test chapter generation with focus on word count"""
        try:
            self.log(f"Testing chapter {chapter_number} generation with word count analysis...")
            
            request_data = {
                "project_id": self.test_project_id,
                "chapter_number": chapter_number
            }
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/generate-chapter", json=request_data)
            generation_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                chapter_content = data.get("chapter_content", "")
                chapter_title = data.get("chapter_title", f"Chapter {chapter_number}")
                
                self.log(f"✅ Chapter {chapter_number} generated successfully in {generation_time:.2f}s")
                self.log(f"✅ Chapter title: {chapter_title}")
                self.log(f"✅ Chapter content length: {len(chapter_content)} characters")
                
                # Word count analysis
                clean_text = re.sub(r'<[^>]+>', '', chapter_content)  # Remove HTML tags
                word_count = len(clean_text.split())
                
                # Expected word count calculation (275 words per page, 275 pages / 10 chapters = 27.5 pages per chapter)
                expected_words_per_chapter = (275 * 275) // 10  # 7562 words per chapter
                word_count_percentage = (word_count / expected_words_per_chapter) * 100
                
                self.log(f"✅ Chapter word count: {word_count} words")
                self.log(f"✅ Expected word count: {expected_words_per_chapter} words")
                self.log(f"✅ Word count achievement: {word_count_percentage:.1f}%")
                
                # Check if word count meets requirements (at least 80% of target)
                if word_count >= expected_words_per_chapter * 0.8:
                    self.log("✅ Chapter meets word count requirements")
                    word_count_status = True
                elif word_count >= expected_words_per_chapter * 0.6:
                    self.log("⚠️ Chapter word count is below target but acceptable", "WARNING")
                    word_count_status = True
                else:
                    self.log("❌ Chapter word count is significantly below target", "ERROR")
                    word_count_status = False
                
                # Check for markdown cleanup
                if "```html" in chapter_content or "```" in chapter_content:
                    self.log("❌ Found markdown artifacts in chapter", "ERROR")
                    return False
                else:
                    self.log("✅ Markdown cleanup working - no artifacts found")
                
                # Check for HTML formatting
                html_tags = ['<h2>', '<p>']
                has_html = any(tag in chapter_content for tag in html_tags)
                if has_html:
                    self.log("✅ Chapter has proper HTML formatting")
                else:
                    self.log("⚠️ Chapter may lack proper HTML formatting", "WARNING")
                
                # Check paragraph structure
                paragraph_count = chapter_content.count('<p>')
                if paragraph_count >= 5:
                    self.log(f"✅ Chapter has good paragraph structure ({paragraph_count} paragraphs)")
                else:
                    self.log(f"⚠️ Chapter may need more paragraph breaks ({paragraph_count} paragraphs)", "WARNING")
                
                return word_count_status
            else:
                self.log(f"❌ Chapter generation failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Chapter generation test failed: {str(e)}", "ERROR")
            return False

    def test_multiple_writing_styles(self):
        """Test content generation for different writing styles"""
        try:
            self.log("Testing content generation for multiple writing styles...")
            
            styles_to_test = ["story", "descriptive"]
            results = {}
            
            for style in styles_to_test:
                self.log(f"\n--- Testing {style} writing style ---")
                
                # Create project for this style
                if not self.create_test_project(style):
                    results[style] = False
                    continue
                
                # Generate outline
                if not self.test_outline_generation():
                    results[style] = False
                    continue
                
                # Generate first chapter and test word count
                word_count_result = self.test_chapter_generation_word_count(1)
                results[style] = word_count_result
                
                time.sleep(2)  # Brief pause between styles
            
            # Summary of results
            self.log("\n" + "="*60)
            self.log("WRITING STYLE CONTENT GENERATION RESULTS")
            self.log("="*60)
            
            passed_styles = 0
            for style, result in results.items():
                if result:
                    self.log(f"✅ {style.title()} style: PASSED")
                    passed_styles += 1
                else:
                    self.log(f"❌ {style.title()} style: FAILED")
            
            self.log(f"\nOverall result: {passed_styles}/{len(styles_to_test)} writing styles passed")
            
            return passed_styles == len(styles_to_test)
                
        except Exception as e:
            self.log(f"❌ Multiple writing styles test failed: {str(e)}", "ERROR")
            return False

    def run_comprehensive_content_generation_test(self):
        """Run comprehensive content generation tests"""
        try:
            self.log("="*70)
            self.log("COMPREHENSIVE CONTENT GENERATION TESTING")
            self.log("="*70)
            
            tests = [
                ("API Health Check", self.test_api_health),
                ("User Authentication", self.authenticate_user),
                ("Multiple Writing Styles", self.test_multiple_writing_styles),
            ]
            
            passed_tests = 0
            total_tests = len(tests)
            
            for test_name, test_func in tests:
                self.log(f"\n--- Running {test_name} ---")
                try:
                    if test_func():
                        passed_tests += 1
                        self.log(f"✅ {test_name} PASSED")
                    else:
                        self.log(f"❌ {test_name} FAILED")
                except Exception as e:
                    self.log(f"❌ {test_name} FAILED with exception: {str(e)}")
                
                time.sleep(1)
            
            self.log("\n" + "="*70)
            self.log(f"CONTENT GENERATION TEST RESULTS: {passed_tests}/{total_tests} PASSED")
            self.log("="*70)
            
            if passed_tests == total_tests:
                self.log("🎉 ALL CONTENT GENERATION TESTS PASSED!")
                return True
            else:
                self.log(f"⚠️ {total_tests - passed_tests} CONTENT GENERATION TESTS FAILED")
                return False
                
        except Exception as e:
            self.log(f"❌ Comprehensive content generation test failed: {str(e)}", "ERROR")
            return False

if __name__ == "__main__":
    print("🚀 Starting Content Generation Testing...")
    print(f"Backend URL: {BACKEND_URL}")
    print("="*80)
    
    tester = ContentGenerationTester()
    success = tester.run_comprehensive_content_generation_test()
    
    if success:
        print("\n🎉 ALL CONTENT GENERATION TESTS PASSED!")
        sys.exit(0)
    else:
        print("\n❌ SOME CONTENT GENERATION TESTS FAILED!")
        sys.exit(1)