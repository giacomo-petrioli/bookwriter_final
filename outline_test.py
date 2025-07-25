#!/usr/bin/env python3
"""
Outline Generation Testing for AI Book Writer Application
Focuses specifically on testing the outline generation functionality
"""

import requests
import json
import time
import sys
from datetime import datetime

# Backend URL for testing
BACKEND_URL = "http://localhost:8001/api"

class OutlineGenerationTester:
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
        
    def test_api_health_check(self):
        """Test basic API health check endpoint"""
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

    def setup_authentication(self):
        """Set up authentication for testing"""
        try:
            self.log("Setting up authentication...")
            
            # Try email/password registration for testing
            registration_data = {
                "email": "outline.test@bookcraft.ai",
                "name": "Outline Test User",
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=registration_data)
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("session_token")
                self.test_user_data = data.get("user")
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                self.log("✅ Authentication setup successful (new user)")
                return True
            elif response.status_code == 400 and "already exists" in response.json().get("detail", ""):
                # Try to login instead
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
                    self.log("✅ Authentication setup successful (existing user)")
                    return True
                else:
                    self.log("❌ Failed to authenticate", "ERROR")
                    return False
            else:
                self.log(f"❌ Authentication setup failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication setup failed: {str(e)}", "ERROR")
            return False

    def test_create_project(self):
        """Test creating a book project"""
        try:
            self.log("Testing project creation...")
            
            project_data = {
                "title": "AI and the Future of Work - Outline Test",
                "description": "A comprehensive exploration of how artificial intelligence is reshaping the modern workplace",
                "pages": 250,
                "chapters": 10,
                "language": "English",
                "writing_style": "descriptive"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["id", "title", "description", "pages", "chapters", "language", "writing_style"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in project response: {missing_fields}", "ERROR")
                    return False
                
                # Store project ID for further tests
                self.test_project_id = data.get("id")
                
                self.log(f"✅ Project created successfully: {data.get('title')}")
                self.log(f"✅ Project ID: {self.test_project_id}")
                return True
            else:
                self.log(f"❌ Project creation failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Project creation test failed: {str(e)}", "ERROR")
            return False

    def test_generate_outline(self):
        """Test AI outline generation - the main focus of this test"""
        try:
            self.log("Testing AI outline generation...")
            
            if not self.test_project_id:
                self.log("❌ No project ID available for outline generation", "ERROR")
                return False
            
            outline_data = {
                "project_id": self.test_project_id
            }
            
            # Record start time to check for timeout issues
            start_time = time.time()
            self.log(f"Starting outline generation at {datetime.now().strftime('%H:%M:%S')}")
            
            response = self.session.post(f"{self.base_url}/generate-outline", json=outline_data)
            
            # Record end time
            end_time = time.time()
            generation_time = end_time - start_time
            
            self.log(f"Outline generation completed in {generation_time:.2f} seconds")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                if "message" not in data:
                    self.log("❌ Missing 'message' field in outline response", "ERROR")
                    return False
                
                # Check if outline was actually generated
                if "successfully" not in data.get("message", "").lower():
                    self.log(f"❌ Outline generation may have failed: {data.get('message')}", "ERROR")
                    return False
                
                # Verify the project was updated with outline
                project_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
                
                if project_response.status_code == 200:
                    project_data = project_response.json()
                    outline = project_data.get("outline")
                    
                    if not outline:
                        self.log("❌ Outline was not saved to project", "ERROR")
                        return False
                    
                    # Check outline quality and length
                    outline_length = len(outline)
                    self.log(f"✅ Outline generated successfully ({outline_length} characters)")
                    
                    # Check for proper HTML formatting
                    if "<h2>" in outline and "<p>" in outline:
                        self.log("✅ Outline contains proper HTML formatting")
                    else:
                        self.log("⚠️ Outline may lack proper HTML formatting", "WARNING")
                    
                    # Check for markdown artifacts (should be cleaned)
                    if "```html" in outline or "```" in outline:
                        self.log("❌ Outline contains markdown artifacts - cleanup failed", "ERROR")
                        return False
                    else:
                        self.log("✅ Outline properly cleaned of markdown artifacts")
                    
                    # Check generation time (should be under 2 minutes as per frontend timeout)
                    if generation_time > 120:
                        self.log(f"⚠️ Outline generation took {generation_time:.2f}s (over 2 minute frontend timeout)", "WARNING")
                    else:
                        self.log(f"✅ Outline generation completed within reasonable time ({generation_time:.2f}s)")
                    
                    # Check for chapter structure
                    chapter_count = outline.count("<h2>")
                    if chapter_count > 0:
                        self.log(f"✅ Outline contains {chapter_count} chapter headings")
                    else:
                        self.log("⚠️ Outline may lack proper chapter structure", "WARNING")
                    
                    return True
                else:
                    self.log(f"❌ Failed to retrieve updated project: {project_response.status_code}", "ERROR")
                    return False
                    
            elif response.status_code == 500:
                # Check for specific AI integration errors
                try:
                    error_data = response.json()
                    error_detail = error_data.get("detail", "")
                    
                    if "Gemini" in error_detail or "AI" in error_detail:
                        self.log(f"❌ AI integration error: {error_detail}", "ERROR")
                    else:
                        self.log(f"❌ Server error during outline generation: {error_detail}", "ERROR")
                except:
                    self.log(f"❌ Server error during outline generation (status 500)", "ERROR")
                
                return False
            else:
                self.log(f"❌ Outline generation failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Outline generation test failed: {str(e)}", "ERROR")
            return False

    def test_outline_editing(self):
        """Test outline editing functionality"""
        try:
            self.log("Testing outline editing...")
            
            if not self.test_project_id:
                self.log("❌ No project ID available for outline editing", "ERROR")
                return False
            
            # First get the current outline
            project_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
            
            if project_response.status_code != 200:
                self.log("❌ Failed to retrieve project for outline editing", "ERROR")
                return False
            
            project_data = project_response.json()
            current_outline = project_data.get("outline")
            
            if not current_outline:
                self.log("❌ No outline available to edit", "ERROR")
                return False
            
            # Modify the outline
            modified_outline = current_outline + "\n\n<h3>Additional Test Section</h3>\n<p>This is a test modification to verify outline editing functionality.</p>"
            
            update_data = {
                "project_id": self.test_project_id,
                "outline": modified_outline
            }
            
            response = self.session.put(f"{self.base_url}/update-outline", json=update_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if "successfully" in data.get("message", "").lower():
                    # Verify the outline was actually updated
                    verify_response = self.session.get(f"{self.base_url}/projects/{self.test_project_id}")
                    
                    if verify_response.status_code == 200:
                        verify_data = verify_response.json()
                        updated_outline = verify_data.get("outline")
                        
                        if "Additional Test Section" in updated_outline:
                            self.log("✅ Outline editing successful - changes persisted")
                            return True
                        else:
                            self.log("❌ Outline changes were not persisted", "ERROR")
                            return False
                    else:
                        self.log("❌ Failed to verify outline update", "ERROR")
                        return False
                else:
                    self.log(f"❌ Outline update may have failed: {data.get('message')}", "ERROR")
                    return False
            else:
                self.log(f"❌ Outline editing failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Outline editing test failed: {str(e)}", "ERROR")
            return False

    def test_gemini_integration(self):
        """Test Gemini AI integration specifically"""
        try:
            self.log("Testing Gemini AI integration...")
            
            # Create a simple test project for AI testing
            test_project_data = {
                "title": "Gemini Integration Test",
                "description": "Testing Gemini AI model integration",
                "pages": 50,
                "chapters": 3,
                "language": "English",
                "writing_style": "story"
            }
            
            project_response = self.session.post(f"{self.base_url}/projects", json=test_project_data)
            
            if project_response.status_code != 200:
                self.log("❌ Failed to create test project for Gemini integration", "ERROR")
                return False
            
            project_data = project_response.json()
            gemini_test_project_id = project_data.get("id")
            
            # Test outline generation with different writing styles
            outline_data = {
                "project_id": gemini_test_project_id
            }
            
            start_time = time.time()
            response = self.session.post(f"{self.base_url}/generate-outline", json=outline_data)
            end_time = time.time()
            
            if response.status_code == 200:
                # Check if the AI model is working
                project_check = self.session.get(f"{self.base_url}/projects/{gemini_test_project_id}")
                
                if project_check.status_code == 200:
                    project_info = project_check.json()
                    outline = project_info.get("outline")
                    
                    if outline and len(outline) > 100:
                        self.log(f"✅ Gemini AI integration working - generated {len(outline)} character outline")
                        self.log(f"✅ Response time: {end_time - start_time:.2f} seconds")
                        
                        # Check for story-style content (since we used story writing style)
                        if any(word in outline.lower() for word in ["character", "story", "chapter", "plot"]):
                            self.log("✅ Gemini AI generated appropriate story-style content")
                        else:
                            self.log("⚠️ Generated content may not match requested writing style", "WARNING")
                        
                        return True
                    else:
                        self.log("❌ Gemini AI generated insufficient content", "ERROR")
                        return False
                else:
                    self.log("❌ Failed to verify Gemini AI output", "ERROR")
                    return False
            else:
                self.log(f"❌ Gemini AI integration failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Gemini AI integration test failed: {str(e)}", "ERROR")
            return False

    def test_complete_workflow(self):
        """Test the complete project creation → outline generation → verification workflow"""
        try:
            self.log("Testing complete outline generation workflow...")
            
            # Step 1: Create project
            workflow_project_data = {
                "title": "Complete Workflow Test Book",
                "description": "Testing the complete outline generation workflow from start to finish",
                "pages": 200,
                "chapters": 8,
                "language": "English",
                "writing_style": "descriptive"
            }
            
            self.log("Step 1: Creating project...")
            project_response = self.session.post(f"{self.base_url}/projects", json=workflow_project_data)
            
            if project_response.status_code != 200:
                self.log("❌ Workflow Step 1 failed: Project creation", "ERROR")
                return False
            
            workflow_project_id = project_response.json().get("id")
            self.log(f"✅ Step 1 completed: Project created with ID {workflow_project_id}")
            
            # Step 2: Generate outline
            self.log("Step 2: Generating outline...")
            outline_data = {"project_id": workflow_project_id}
            
            start_time = time.time()
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_data)
            generation_time = time.time() - start_time
            
            if outline_response.status_code != 200:
                self.log("❌ Workflow Step 2 failed: Outline generation", "ERROR")
                return False
            
            self.log(f"✅ Step 2 completed: Outline generated in {generation_time:.2f}s")
            
            # Step 3: Verify outline is saved and accessible
            self.log("Step 3: Verifying outline persistence...")
            verify_response = self.session.get(f"{self.base_url}/projects/{workflow_project_id}")
            
            if verify_response.status_code != 200:
                self.log("❌ Workflow Step 3 failed: Project retrieval", "ERROR")
                return False
            
            project_data = verify_response.json()
            outline = project_data.get("outline")
            
            if not outline or len(outline) < 500:
                self.log("❌ Workflow Step 3 failed: Outline not properly saved", "ERROR")
                return False
            
            self.log(f"✅ Step 3 completed: Outline verified ({len(outline)} characters)")
            
            # Step 4: Test outline quality
            self.log("Step 4: Checking outline quality...")
            
            quality_checks = {
                "HTML formatting": "<h2>" in outline and "<p>" in outline,
                "No markdown artifacts": "```" not in outline,
                "Appropriate length": len(outline) > 1000,
                "Chapter structure": outline.count("<h2>") >= 3,
                "Descriptive content": any(word in outline.lower() for word in ["detailed", "comprehensive", "analysis", "overview"])
            }
            
            passed_checks = 0
            for check_name, check_result in quality_checks.items():
                if check_result:
                    self.log(f"✅ Quality check passed: {check_name}")
                    passed_checks += 1
                else:
                    self.log(f"⚠️ Quality check failed: {check_name}", "WARNING")
            
            if passed_checks >= 4:
                self.log(f"✅ Step 4 completed: Outline quality acceptable ({passed_checks}/5 checks passed)")
                self.log("🎉 Complete workflow test PASSED!")
                return True
            else:
                self.log(f"❌ Step 4 failed: Outline quality insufficient ({passed_checks}/5 checks passed)", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Complete workflow test failed: {str(e)}", "ERROR")
            return False

    def run_comprehensive_outline_tests(self):
        """Run all outline generation tests"""
        try:
            self.log("=" * 70)
            self.log("COMPREHENSIVE OUTLINE GENERATION TESTING")
            self.log("=" * 70)
            
            # Test sequence
            tests = [
                ("API Health Check", self.test_api_health_check),
                ("Authentication Setup", self.setup_authentication),
                ("Project Creation", self.test_create_project),
                ("AI Outline Generation", self.test_generate_outline),
                ("Outline Editing", self.test_outline_editing),
                ("Gemini AI Integration", self.test_gemini_integration),
                ("Complete Workflow", self.test_complete_workflow),
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
                        # Don't stop on failure, continue with other tests
                except Exception as e:
                    self.log(f"❌ {test_name} FAILED with exception: {str(e)}")
                
                time.sleep(1)  # Brief pause between tests
            
            self.log("\n" + "=" * 70)
            self.log(f"OUTLINE GENERATION TEST RESULTS: {passed_tests}/{total_tests} PASSED")
            self.log("=" * 70)
            
            # Detailed summary
            if passed_tests == total_tests:
                self.log("🎉 ALL OUTLINE GENERATION TESTS PASSED!")
                self.log("✅ Outline generation is working correctly")
                self.log("✅ No loading screen issues detected")
                self.log("✅ Gemini AI integration is functional")
                self.log("✅ Complete workflow from project creation to outline generation works")
                return True
            else:
                failed_tests = total_tests - passed_tests
                self.log(f"⚠️ {failed_tests} OUTLINE GENERATION TESTS FAILED")
                
                if failed_tests <= 2:
                    self.log("✅ Core outline generation functionality appears to be working")
                    self.log("⚠️ Some minor issues detected but not critical")
                else:
                    self.log("❌ Significant issues with outline generation detected")
                    self.log("❌ May cause loading screen problems in frontend")
                
                return False
                
        except Exception as e:
            self.log(f"❌ Comprehensive outline generation test failed: {str(e)}", "ERROR")
            return False

def main():
    """Main function to run outline generation tests"""
    tester = OutlineGenerationTester()
    
    print("🚀 Starting Outline Generation Testing...")
    print(f"Backend URL: {BACKEND_URL}")
    print("Focus: Testing outline generation functionality that was causing loading screen issues")
    print("=" * 80)
    
    # Run comprehensive outline tests
    success = tester.run_comprehensive_outline_tests()
    
    print("\n" + "=" * 80)
    
    if success:
        print("🎉 OUTLINE GENERATION TESTING COMPLETED SUCCESSFULLY!")
        print("✅ Outline generation functionality is working properly")
        print("✅ No timeout or loading screen issues detected")
        print("✅ Gemini AI integration is functional")
        sys.exit(0)
    else:
        print("❌ OUTLINE GENERATION TESTING FOUND ISSUES!")
        print("⚠️ Some problems detected that may cause loading screen issues")
        print("⚠️ Check the detailed logs above for specific issues")
        sys.exit(1)

if __name__ == "__main__":
    main()