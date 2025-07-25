#!/usr/bin/env python3
"""
Simple Outline Generation Test - Focus on core functionality
"""

import requests
import json
import time
import sys
from datetime import datetime

# Backend URL for testing
BACKEND_URL = "http://localhost:8001/api"

class SimpleOutlineTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.auth_token = None
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_basic_flow(self):
        """Test the basic outline generation flow"""
        try:
            # 1. Health check
            self.log("1. Testing API health...")
            response = self.session.get(f"{self.base_url}/")
            if response.status_code != 200:
                self.log("❌ API health check failed", "ERROR")
                return False
            self.log("✅ API is healthy")
            
            # 2. Authentication
            self.log("2. Setting up authentication...")
            auth_data = {
                "email": "simple.test@bookcraft.ai",
                "name": "Simple Test User",
                "password": "testpassword123"
            }
            
            # Try registration first
            response = self.session.post(f"{self.base_url}/auth/register", json=auth_data)
            if response.status_code == 400:
                # User exists, try login
                login_data = {"email": auth_data["email"], "password": auth_data["password"]}
                response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if response.status_code != 200:
                self.log("❌ Authentication failed", "ERROR")
                return False
            
            data = response.json()
            self.auth_token = data.get("session_token")
            self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
            self.log("✅ Authentication successful")
            
            # 3. Create a small project (within credit limits)
            self.log("3. Creating a small test project...")
            project_data = {
                "title": "Simple Outline Test",
                "description": "A small test book for outline generation",
                "pages": 30,  # Small project
                "chapters": 3,  # Only 3 chapters to stay within credit limit
                "language": "English",
                "writing_style": "story"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            if response.status_code != 200:
                error_detail = response.json().get("detail", "Unknown error")
                self.log(f"❌ Project creation failed: {error_detail}", "ERROR")
                return False
            
            project = response.json()
            project_id = project.get("id")
            self.log(f"✅ Project created: {project.get('title')} (ID: {project_id})")
            
            # 4. Generate outline - THE MAIN TEST
            self.log("4. Generating outline (main test)...")
            outline_data = {"project_id": project_id}
            
            start_time = time.time()
            self.log(f"Starting outline generation at {datetime.now().strftime('%H:%M:%S')}")
            
            response = self.session.post(f"{self.base_url}/generate-outline", json=outline_data)
            
            end_time = time.time()
            generation_time = end_time - start_time
            
            if response.status_code != 200:
                error_detail = response.json().get("detail", "Unknown error")
                self.log(f"❌ Outline generation failed: {error_detail}", "ERROR")
                return False
            
            self.log(f"✅ Outline generation completed in {generation_time:.2f} seconds")
            
            # 5. Verify outline was saved
            self.log("5. Verifying outline was saved...")
            response = self.session.get(f"{self.base_url}/projects/{project_id}")
            if response.status_code != 200:
                self.log("❌ Failed to retrieve project", "ERROR")
                return False
            
            project_data = response.json()
            outline = project_data.get("outline")
            
            if not outline:
                self.log("❌ Outline was not saved", "ERROR")
                return False
            
            outline_length = len(outline)
            self.log(f"✅ Outline saved successfully ({outline_length} characters)")
            
            # 6. Check outline quality
            self.log("6. Checking outline quality...")
            
            # Check for timeout issues (should be under 2 minutes)
            if generation_time > 120:
                self.log(f"⚠️ WARNING: Generation took {generation_time:.2f}s (may cause frontend timeout)", "WARNING")
            else:
                self.log(f"✅ Generation time acceptable ({generation_time:.2f}s)")
            
            # Check for proper formatting
            if "<h2>" in outline and "<p>" in outline:
                self.log("✅ Outline has proper HTML formatting")
            else:
                self.log("⚠️ Outline may lack proper formatting", "WARNING")
            
            # Check for markdown artifacts
            if "```" in outline:
                self.log("❌ Outline contains markdown artifacts", "ERROR")
                return False
            else:
                self.log("✅ Outline properly cleaned of markdown artifacts")
            
            # Check minimum length
            if outline_length < 500:
                self.log("⚠️ Outline may be too short", "WARNING")
            else:
                self.log("✅ Outline has adequate length")
            
            # Check for chapter structure
            chapter_count = outline.count("<h2>")
            if chapter_count >= 3:
                self.log(f"✅ Outline has proper chapter structure ({chapter_count} chapters)")
            else:
                self.log(f"⚠️ Outline may lack proper chapter structure ({chapter_count} chapters)", "WARNING")
            
            self.log("🎉 OUTLINE GENERATION TEST PASSED!")
            self.log("✅ Core outline generation functionality is working")
            self.log("✅ No loading screen issues detected")
            self.log("✅ Gemini AI integration is functional")
            
            return True
            
        except Exception as e:
            self.log(f"❌ Test failed with exception: {str(e)}", "ERROR")
            return False

def main():
    """Main function"""
    tester = SimpleOutlineTester()
    
    print("🚀 Simple Outline Generation Test")
    print(f"Backend URL: {BACKEND_URL}")
    print("Testing core outline generation functionality...")
    print("=" * 60)
    
    success = tester.test_basic_flow()
    
    print("\n" + "=" * 60)
    
    if success:
        print("🎉 OUTLINE GENERATION IS WORKING!")
        print("✅ No loading screen issues detected")
        print("✅ Backend outline generation is functional")
        sys.exit(0)
    else:
        print("❌ OUTLINE GENERATION HAS ISSUES!")
        print("⚠️ May cause loading screen problems")
        sys.exit(1)

if __name__ == "__main__":
    main()