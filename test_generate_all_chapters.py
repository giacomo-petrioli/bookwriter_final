#!/usr/bin/env python3
"""
Test the generate-all-chapters endpoint specifically
"""

import requests
import json
import time
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://6826ce60-43b4-4dcf-983b-e1a4a4074c3c.preview.emergentagent.com/api"

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {level}: {message}")

def test_generate_all_chapters():
    """Test generating all chapters at once"""
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    # First, get an existing project with outline
    log("Getting existing projects...")
    response = session.get(f"{BACKEND_URL}/projects")
    
    if response.status_code != 200:
        log(f"❌ Failed to get projects: {response.status_code}", "ERROR")
        return False
    
    projects = response.json()
    if not projects:
        log("❌ No projects found", "ERROR")
        return False
    
    # Find a project with an outline
    test_project = None
    for project in projects:
        if project.get("outline"):
            test_project = project
            break
    
    if not test_project:
        log("❌ No project with outline found", "ERROR")
        return False
    
    project_id = test_project["id"]
    log(f"Testing generate all chapters for project: {project_id}")
    
    try:
        request_data = {
            "project_id": project_id
        }
        
        # This is a longer operation, so increase timeout
        log("Starting generate all chapters (this may take a while)...")
        response = session.post(f"{BACKEND_URL}/generate-all-chapters", json=request_data, timeout=300)
        
        if response.status_code == 200:
            data = response.json()
            
            required_fields = ["message", "chapters_generated", "project_id", "chapters"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                log(f"❌ Missing fields in generate-all-chapters response: {missing_fields}", "ERROR")
                return False
            
            if data.get("project_id") != project_id:
                log(f"❌ Project ID mismatch in response", "ERROR")
                return False
            
            chapters_generated = data.get("chapters_generated", 0)
            if chapters_generated < 1:
                log(f"❌ No chapters generated: {chapters_generated}", "ERROR")
                return False
            
            chapters = data.get("chapters", {})
            if not isinstance(chapters, dict):
                log(f"❌ Chapters should be a dictionary, got {type(chapters)}", "ERROR")
                return False
            
            # Check each chapter for formatting improvements
            for chapter_num, chapter_content in chapters.items():
                if "```html" in chapter_content or "```" in chapter_content:
                    log(f"❌ Found markdown artifacts in chapter {chapter_num}", "ERROR")
                    return False
                
                if len(chapter_content) < 200:
                    log(f"❌ Chapter {chapter_num} seems too short", "ERROR")
                    return False
            
            # Verify chapters are stored in database
            verify_response = session.get(f"{BACKEND_URL}/projects/{project_id}")
            if verify_response.status_code == 200:
                project_data = verify_response.json()
                stored_chapters = project_data.get("chapters_content", {})
                if len(stored_chapters) != chapters_generated:
                    log("❌ Chapters not properly stored in database", "ERROR")
                    return False
                log("✅ All chapters properly stored in database")
            
            log(f"✅ Generated all {chapters_generated} chapters successfully")
            log("✅ All chapters have proper formatting without markdown artifacts")
            return True
        elif response.status_code == 400:
            log(f"❌ Generate all chapters failed - likely missing outline: {response.text}", "ERROR")
            return False
        else:
            log(f"❌ Generate all chapters failed with status {response.status_code}: {response.text}", "ERROR")
            return False
            
    except Exception as e:
        log(f"❌ Generate all chapters test failed: {str(e)}", "ERROR")
        return False

if __name__ == "__main__":
    log("Testing Generate All Chapters endpoint...")
    success = test_generate_all_chapters()
    if success:
        log("🎉 Generate All Chapters test passed!")
    else:
        log("❌ Generate All Chapters test failed!")