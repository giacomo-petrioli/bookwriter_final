#!/usr/bin/env python3
"""
Focused Authentication Connectivity Test
Tests specific scenarios that could cause "Connecting to server" issues
"""

import requests
import json
import time

BACKEND_URL = "https://8397a57c-856b-4a47-b53d-1db799ede760.preview.emergentagent.com/api"

def test_backend_response_times():
    """Test backend response times for key endpoints"""
    print("🕐 TESTING BACKEND RESPONSE TIMES")
    print("-" * 40)
    
    endpoints = [
        ("/", "GET"),
        ("/auth/register", "POST"),
        ("/auth/login", "POST"),
        ("/projects", "GET"),
        ("/user/stats", "GET")
    ]
    
    for endpoint, method in endpoints:
        start_time = time.time()
        try:
            url = f"{BACKEND_URL}{endpoint}"
            if method == "GET":
                response = requests.get(url, timeout=30)
            else:
                # Use dummy data for POST requests
                data = {"email": "test@test.com", "password": "test123", "name": "Test"}
                response = requests.post(url, json=data, timeout=30)
            
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            print(f"✅ {method} {endpoint}: {response_time:.0f}ms (Status: {response.status_code})")
            
        except requests.exceptions.Timeout:
            print(f"❌ {method} {endpoint}: TIMEOUT (>30s)")
        except Exception as e:
            print(f"❌ {method} {endpoint}: ERROR - {str(e)}")

def test_cors_headers():
    """Test CORS headers that might cause frontend connection issues"""
    print("\n🌐 TESTING CORS HEADERS")
    print("-" * 40)
    
    try:
        response = requests.options(f"{BACKEND_URL}/", headers={
            "Origin": "https://8397a57c-856b-4a47-b53d-1db799ede760.preview.emergentagent.com",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type,Authorization"
        })
        
        cors_headers = {
            "Access-Control-Allow-Origin": response.headers.get("Access-Control-Allow-Origin"),
            "Access-Control-Allow-Methods": response.headers.get("Access-Control-Allow-Methods"),
            "Access-Control-Allow-Headers": response.headers.get("Access-Control-Allow-Headers"),
            "Access-Control-Allow-Credentials": response.headers.get("Access-Control-Allow-Credentials")
        }
        
        print(f"Status: {response.status_code}")
        for header, value in cors_headers.items():
            if value:
                print(f"✅ {header}: {value}")
            else:
                print(f"❌ {header}: Missing")
                
    except Exception as e:
        print(f"❌ CORS test failed: {str(e)}")

def test_authentication_session_persistence():
    """Test if authentication sessions persist properly"""
    print("\n🔐 TESTING SESSION PERSISTENCE")
    print("-" * 40)
    
    try:
        # Register a user
        register_data = {
            "email": f"session_test_{int(time.time())}@test.com",
            "name": "Session Test User",
            "password": "testpass123"
        }
        
        register_response = requests.post(f"{BACKEND_URL}/auth/register", json=register_data, timeout=30)
        
        if register_response.status_code == 200:
            result = register_response.json()
            session_token = result["session_token"]
            print(f"✅ User registered, session token: {session_token[:20]}...")
            
            # Test multiple requests with the same session token
            headers = {"Authorization": f"Bearer {session_token}"}
            
            for i in range(3):
                profile_response = requests.get(f"{BACKEND_URL}/auth/profile", headers=headers, timeout=30)
                if profile_response.status_code == 200:
                    print(f"✅ Request {i+1}: Session token still valid")
                else:
                    print(f"❌ Request {i+1}: Session token invalid (Status: {profile_response.status_code})")
                    break
                time.sleep(1)  # Wait 1 second between requests
                
        else:
            print(f"❌ Registration failed: {register_response.status_code}")
            
    except Exception as e:
        print(f"❌ Session persistence test failed: {str(e)}")

def main():
    print("=" * 60)
    print("🔍 AUTHENTICATION CONNECTIVITY DIAGNOSTIC TEST")
    print("=" * 60)
    print(f"Backend URL: {BACKEND_URL}")
    print()
    
    test_backend_response_times()
    test_cors_headers()
    test_authentication_session_persistence()
    
    print("\n" + "=" * 60)
    print("✅ DIAGNOSTIC TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()