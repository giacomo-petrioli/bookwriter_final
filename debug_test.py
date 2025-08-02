#!/usr/bin/env python3
"""
Detailed investigation of failing backend tests
"""

import requests
import json

BACKEND_URL = "http://localhost:8001/api"
TEST_USER_EMAIL = "debug@mybookcrafter.ai"
TEST_USER_PASSWORD = "debugpassword123"

def register_and_login():
    """Register and login to get session token"""
    # Register
    reg_data = {
        "email": TEST_USER_EMAIL,
        "name": "Debug User",
        "password": TEST_USER_PASSWORD
    }
    
    reg_response = requests.post(f"{BACKEND_URL}/auth/register", json=reg_data)
    if reg_response.status_code != 200:
        # Try login instead
        login_data = {"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        if login_response.status_code == 200:
            return login_response.json()["session_token"]
        else:
            print(f"Login failed: {login_response.text}")
            return None
    
    return reg_response.json()["session_token"]

def create_test_project(token):
    """Create a test project"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {
        "title": "Debug Test Book",
        "description": "Debug test",
        "pages": 20,
        "chapters": 2,
        "language": "English",
        "writing_style": "story"
    }
    
    response = requests.post(f"{BACKEND_URL}/projects", json=data, headers=headers)
    if response.status_code == 200:
        return response.json()["id"]
    else:
        print(f"Project creation failed: {response.text}")
        return None

def test_chapter_generation(token, project_id):
    """Test chapter generation in detail"""
    headers = {"Authorization": f"Bearer {token}"}
    data = {"project_id": project_id, "chapter_number": 1}
    
    print("Testing chapter generation...")
    response = requests.post(f"{BACKEND_URL}/generate-chapter", json=data, headers=headers, timeout=60)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response keys: {list(result.keys())}")
        if "content" in result:
            content = result["content"]
            print(f"Content length: {len(content)}")
            print(f"Content preview: {content[:200]}...")
        else:
            print("No 'content' key in response")
            print(f"Full response: {result}")
    else:
        print(f"Error response: {response.text}")

def test_html_export(token, project_id):
    """Test HTML export in detail"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing HTML export...")
    response = requests.get(f"{BACKEND_URL}/export-book/{project_id}", headers=headers, timeout=30)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"Response keys: {list(result.keys())}")
        if "html_content" in result:
            content = result["html_content"]
            print(f"HTML content length: {len(content)}")
            print(f"HTML content preview: {content[:300]}...")
        else:
            print("No 'html_content' key in response")
            print(f"Full response: {result}")
    else:
        print(f"Error response: {response.text}")

def main():
    print("=== DEBUGGING FAILED BACKEND TESTS ===")
    
    # Get session token
    token = register_and_login()
    if not token:
        print("Failed to get session token")
        return
    
    print(f"Got session token: {token[:20]}...")
    
    # Create project
    project_id = create_test_project(token)
    if not project_id:
        print("Failed to create project")
        return
    
    print(f"Created project: {project_id}")
    
    # Generate outline first
    print("Generating outline...")
    headers = {"Authorization": f"Bearer {token}"}
    outline_data = {"project_id": project_id}
    outline_response = requests.post(f"{BACKEND_URL}/generate-outline", json=outline_data, headers=headers, timeout=60)
    
    if outline_response.status_code == 200:
        print("Outline generated successfully")
    else:
        print(f"Outline generation failed: {outline_response.text}")
        return
    
    # Test chapter generation
    test_chapter_generation(token, project_id)
    
    print("\n" + "="*50 + "\n")
    
    # Test HTML export
    test_html_export(token, project_id)

if __name__ == "__main__":
    main()