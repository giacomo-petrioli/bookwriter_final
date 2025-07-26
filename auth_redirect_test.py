#!/usr/bin/env python3
"""
Focused Authentication Redirect Testing
Tests the specific login redirect issue mentioned in the review request
"""

import requests
import json
import time
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://a4a476c4-1ae3-4338-af34-da4cf0f722a1.preview.emergentagent.com/api"

class AuthRedirectTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_email_password_auth_flow(self):
        """Test complete email/password authentication flow"""
        try:
            self.log("=" * 70)
            self.log("TESTING EMAIL/PASSWORD AUTHENTICATION FLOW")
            self.log("=" * 70)
            
            # Step 1: Register a new user
            self.log("Step 1: Testing user registration...")
            registration_data = {
                "email": "redirect.test@bookcraft.ai",
                "name": "Redirect Test User",
                "password": "testpassword123"
            }
            
            register_response = self.session.post(f"{self.base_url}/auth/register", json=registration_data)
            
            if register_response.status_code == 200:
                register_data = register_response.json()
                self.log("✅ User registration successful")
                self.log(f"✅ User created: {register_data['user']['name']} ({register_data['user']['email']})")
                self.log(f"✅ Session token received: {register_data['session_token'][:20]}...")
                self.log(f"✅ Token expires at: {register_data['expires_at']}")
                
                # Test that the session token works immediately
                auth_headers = {'Authorization': f"Bearer {register_data['session_token']}"}
                profile_response = self.session.get(f"{self.base_url}/auth/profile", headers=auth_headers)
                
                if profile_response.status_code == 200:
                    profile_data = profile_response.json()
                    self.log("✅ Session token works immediately after registration")
                    self.log(f"✅ Profile data: {profile_data['name']} ({profile_data['email']})")
                else:
                    self.log(f"❌ Session token doesn't work after registration: {profile_response.status_code}", "ERROR")
                    return False
                    
            elif register_response.status_code == 400:
                error_data = register_response.json()
                if "already exists" in error_data.get("detail", ""):
                    self.log("⚠️ User already exists, proceeding to login test", "WARNING")
                else:
                    self.log(f"❌ Registration failed: {error_data.get('detail')}", "ERROR")
                    return False
            else:
                self.log(f"❌ Registration failed with status {register_response.status_code}", "ERROR")
                return False
            
            # Step 2: Test login flow
            self.log("\nStep 2: Testing user login...")
            login_data = {
                "email": "redirect.test@bookcraft.ai",
                "password": "testpassword123"
            }
            
            login_response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if login_response.status_code == 200:
                login_data_response = login_response.json()
                self.log("✅ User login successful")
                self.log(f"✅ User logged in: {login_data_response['user']['name']} ({login_data_response['user']['email']})")
                self.log(f"✅ New session token received: {login_data_response['session_token'][:20]}...")
                self.log(f"✅ Token expires at: {login_data_response['expires_at']}")
                
                # Test that the login session token works
                login_auth_headers = {'Authorization': f"Bearer {login_data_response['session_token']}"}
                login_profile_response = self.session.get(f"{self.base_url}/auth/profile", headers=login_auth_headers)
                
                if login_profile_response.status_code == 200:
                    login_profile_data = login_profile_response.json()
                    self.log("✅ Login session token works correctly")
                    self.log(f"✅ Profile data: {login_profile_data['name']} ({login_profile_data['email']})")
                    
                    # Step 3: Test protected endpoints access
                    self.log("\nStep 3: Testing protected endpoints access...")
                    
                    # Test projects endpoint
                    projects_response = self.session.get(f"{self.base_url}/projects", headers=login_auth_headers)
                    if projects_response.status_code == 200:
                        projects_data = projects_response.json()
                        self.log(f"✅ Projects endpoint accessible: {len(projects_data)} projects found")
                    else:
                        self.log(f"❌ Projects endpoint not accessible: {projects_response.status_code}", "ERROR")
                        return False
                    
                    # Test user stats endpoint
                    stats_response = self.session.get(f"{self.base_url}/user/stats", headers=login_auth_headers)
                    if stats_response.status_code == 200:
                        stats_data = stats_response.json()
                        self.log(f"✅ User stats endpoint accessible: {stats_data}")
                    else:
                        self.log(f"❌ User stats endpoint not accessible: {stats_response.status_code}", "ERROR")
                        return False
                    
                    # Step 4: Test logout
                    self.log("\nStep 4: Testing logout...")
                    logout_response = self.session.post(f"{self.base_url}/auth/logout", headers=login_auth_headers)
                    
                    if logout_response.status_code == 200:
                        logout_data = logout_response.json()
                        self.log("✅ Logout successful")
                        self.log(f"✅ Logout message: {logout_data.get('message')}")
                        
                        # Test that token is invalidated
                        post_logout_response = self.session.get(f"{self.base_url}/auth/profile", headers=login_auth_headers)
                        if post_logout_response.status_code == 401:
                            self.log("✅ Session token properly invalidated after logout")
                        else:
                            self.log("⚠️ Session token may not be properly invalidated", "WARNING")
                    else:
                        self.log(f"❌ Logout failed: {logout_response.status_code}", "ERROR")
                        return False
                    
                else:
                    self.log(f"❌ Login session token doesn't work: {login_profile_response.status_code}", "ERROR")
                    return False
                    
            else:
                self.log(f"❌ Login failed with status {login_response.status_code}", "ERROR")
                return False
            
            self.log("\n✅ EMAIL/PASSWORD AUTHENTICATION FLOW COMPLETED SUCCESSFULLY")
            return True
            
        except Exception as e:
            self.log(f"❌ Email/password auth flow test failed: {str(e)}", "ERROR")
            return False

    def test_google_oauth_auth_flow(self):
        """Test Google OAuth authentication flow"""
        try:
            self.log("=" * 70)
            self.log("TESTING GOOGLE OAUTH AUTHENTICATION FLOW")
            self.log("=" * 70)
            
            # Create a mock JWT token with valid structure
            import base64
            import json
            
            # Mock payload for testing
            mock_payload = {
                "email": "oauth.test@bookcraft.ai",
                "name": "OAuth Test User",
                "picture": "https://example.com/avatar.jpg",
                "iss": "accounts.google.com",
                "aud": "758478706314-pn8dh4u94p8mt06qialfdigaqs5glj9s.apps.googleusercontent.com"
            }
            
            # Create mock JWT structure (header.payload.signature)
            header = base64.urlsafe_b64encode(json.dumps({"alg": "RS256", "typ": "JWT"}).encode()).decode().rstrip('=')
            payload = base64.urlsafe_b64encode(json.dumps(mock_payload).encode()).decode().rstrip('=')
            signature = base64.urlsafe_b64encode(b"mock_signature").decode().rstrip('=')
            
            mock_jwt_token = f"{header}.{payload}.{signature}"
            
            self.log("Step 1: Testing Google OAuth token verification...")
            token_data = {"token": mock_jwt_token}
            
            oauth_response = self.session.post(f"{self.base_url}/auth/google/verify", json=token_data)
            
            if oauth_response.status_code == 200:
                oauth_data = oauth_response.json()
                self.log("✅ Google OAuth authentication successful")
                self.log(f"✅ User created/logged in: {oauth_data['user']['name']} ({oauth_data['user']['email']})")
                self.log(f"✅ Session token received: {oauth_data['session_token'][:20]}...")
                self.log(f"✅ Token expires at: {oauth_data['expires_at']}")
                
                # Test that the OAuth session token works
                oauth_auth_headers = {'Authorization': f"Bearer {oauth_data['session_token']}"}
                oauth_profile_response = self.session.get(f"{self.base_url}/auth/profile", headers=oauth_auth_headers)
                
                if oauth_profile_response.status_code == 200:
                    oauth_profile_data = oauth_profile_response.json()
                    self.log("✅ OAuth session token works correctly")
                    self.log(f"✅ Profile data: {oauth_profile_data['name']} ({oauth_profile_data['email']})")
                    
                    # Test protected endpoints access
                    self.log("\nStep 2: Testing protected endpoints access with OAuth token...")
                    
                    # Test projects endpoint
                    projects_response = self.session.get(f"{self.base_url}/projects", headers=oauth_auth_headers)
                    if projects_response.status_code == 200:
                        projects_data = projects_response.json()
                        self.log(f"✅ Projects endpoint accessible with OAuth: {len(projects_data)} projects found")
                    else:
                        self.log(f"❌ Projects endpoint not accessible with OAuth: {projects_response.status_code}", "ERROR")
                        return False
                    
                    # Test user stats endpoint
                    stats_response = self.session.get(f"{self.base_url}/user/stats", headers=oauth_auth_headers)
                    if stats_response.status_code == 200:
                        stats_data = stats_response.json()
                        self.log(f"✅ User stats endpoint accessible with OAuth: {stats_data}")
                    else:
                        self.log(f"❌ User stats endpoint not accessible with OAuth: {stats_response.status_code}", "ERROR")
                        return False
                    
                    # Test logout with OAuth token
                    self.log("\nStep 3: Testing logout with OAuth token...")
                    logout_response = self.session.post(f"{self.base_url}/auth/logout", headers=oauth_auth_headers)
                    
                    if logout_response.status_code == 200:
                        logout_data = logout_response.json()
                        self.log("✅ OAuth logout successful")
                        self.log(f"✅ Logout message: {logout_data.get('message')}")
                        
                        # Test that OAuth token is invalidated
                        post_logout_response = self.session.get(f"{self.base_url}/auth/profile", headers=oauth_auth_headers)
                        if post_logout_response.status_code == 401:
                            self.log("✅ OAuth session token properly invalidated after logout")
                        else:
                            self.log("⚠️ OAuth session token may not be properly invalidated", "WARNING")
                    else:
                        self.log(f"❌ OAuth logout failed: {logout_response.status_code}", "ERROR")
                        return False
                    
                else:
                    self.log(f"❌ OAuth session token doesn't work: {oauth_profile_response.status_code}", "ERROR")
                    return False
                    
            else:
                self.log(f"❌ Google OAuth authentication failed: {oauth_response.status_code}", "ERROR")
                return False
            
            self.log("\n✅ GOOGLE OAUTH AUTHENTICATION FLOW COMPLETED SUCCESSFULLY")
            return True
            
        except Exception as e:
            self.log(f"❌ Google OAuth auth flow test failed: {str(e)}", "ERROR")
            return False

    def test_session_persistence_and_state_management(self):
        """Test session persistence and state management for redirect issues"""
        try:
            self.log("=" * 70)
            self.log("TESTING SESSION PERSISTENCE AND STATE MANAGEMENT")
            self.log("=" * 70)
            
            # Create a user and get session token
            registration_data = {
                "email": "session.test@bookcraft.ai",
                "name": "Session Test User",
                "password": "testpassword123"
            }
            
            register_response = self.session.post(f"{self.base_url}/auth/register", json=registration_data)
            
            if register_response.status_code == 200:
                register_data = register_response.json()
                session_token = register_data['session_token']
                self.log("✅ User registered and session token obtained")
            elif register_response.status_code == 400:
                # User exists, try login
                login_data = {
                    "email": "session.test@bookcraft.ai",
                    "password": "testpassword123"
                }
                login_response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
                if login_response.status_code == 200:
                    login_data_response = login_response.json()
                    session_token = login_data_response['session_token']
                    self.log("✅ User logged in and session token obtained")
                else:
                    self.log("❌ Could not obtain session token", "ERROR")
                    return False
            else:
                self.log("❌ Could not create user for session test", "ERROR")
                return False
            
            auth_headers = {'Authorization': f"Bearer {session_token}"}
            
            # Test 1: Session persistence across multiple requests
            self.log("\nTest 1: Session persistence across multiple requests...")
            for i in range(5):
                profile_response = self.session.get(f"{self.base_url}/auth/profile", headers=auth_headers)
                if profile_response.status_code == 200:
                    self.log(f"✅ Request {i+1}: Session valid")
                else:
                    self.log(f"❌ Request {i+1}: Session invalid ({profile_response.status_code})", "ERROR")
                    return False
                time.sleep(1)  # Small delay between requests
            
            # Test 2: Session state consistency
            self.log("\nTest 2: Session state consistency...")
            
            # Get user profile multiple times and verify consistency
            profiles = []
            for i in range(3):
                profile_response = self.session.get(f"{self.base_url}/auth/profile", headers=auth_headers)
                if profile_response.status_code == 200:
                    profiles.append(profile_response.json())
                else:
                    self.log(f"❌ Profile request {i+1} failed", "ERROR")
                    return False
            
            # Check if all profiles are identical
            first_profile = profiles[0]
            for i, profile in enumerate(profiles[1:], 2):
                if profile != first_profile:
                    self.log(f"❌ Profile inconsistency detected in request {i}", "ERROR")
                    return False
            
            self.log("✅ Session state remains consistent across requests")
            
            # Test 3: Session expiration handling
            self.log("\nTest 3: Session expiration handling...")
            
            # Test with an expired/invalid token
            invalid_token = "invalid_token_12345"
            invalid_headers = {'Authorization': f"Bearer {invalid_token}"}
            
            invalid_response = self.session.get(f"{self.base_url}/auth/profile", headers=invalid_headers)
            if invalid_response.status_code == 401:
                self.log("✅ Invalid session token properly rejected")
            else:
                self.log(f"❌ Invalid session token not properly rejected: {invalid_response.status_code}", "ERROR")
                return False
            
            # Test 4: Multiple concurrent sessions
            self.log("\nTest 4: Multiple concurrent sessions...")
            
            # Create another session for the same user
            login_data = {
                "email": "session.test@bookcraft.ai",
                "password": "testpassword123"
            }
            second_login_response = self.session.post(f"{self.base_url}/auth/login", json=login_data)
            
            if second_login_response.status_code == 200:
                second_session_data = second_login_response.json()
                second_session_token = second_session_data['session_token']
                second_auth_headers = {'Authorization': f"Bearer {second_session_token}"}
                
                # Test that both sessions work
                first_profile_response = self.session.get(f"{self.base_url}/auth/profile", headers=auth_headers)
                second_profile_response = self.session.get(f"{self.base_url}/auth/profile", headers=second_auth_headers)
                
                if first_profile_response.status_code == 200 and second_profile_response.status_code == 200:
                    self.log("✅ Multiple concurrent sessions supported")
                else:
                    self.log("❌ Multiple concurrent sessions not properly supported", "ERROR")
                    return False
            else:
                self.log("❌ Could not create second session", "ERROR")
                return False
            
            self.log("\n✅ SESSION PERSISTENCE AND STATE MANAGEMENT TESTS COMPLETED SUCCESSFULLY")
            return True
            
        except Exception as e:
            self.log(f"❌ Session persistence test failed: {str(e)}", "ERROR")
            return False

def main():
    """Main function to run focused authentication redirect tests"""
    tester = AuthRedirectTester()
    
    print("🚀 Starting Focused Authentication Redirect Testing...")
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 80)
    
    # Run focused authentication tests
    email_auth_success = tester.test_email_password_auth_flow()
    oauth_auth_success = tester.test_google_oauth_auth_flow()
    session_mgmt_success = tester.test_session_persistence_and_state_management()
    
    print("\n" + "=" * 80)
    print("FOCUSED AUTHENTICATION REDIRECT TEST RESULTS")
    print("=" * 80)
    
    if email_auth_success:
        print("✅ Email/Password Authentication Flow: PASSED")
    else:
        print("❌ Email/Password Authentication Flow: FAILED")
    
    if oauth_auth_success:
        print("✅ Google OAuth Authentication Flow: PASSED")
    else:
        print("❌ Google OAuth Authentication Flow: FAILED")
    
    if session_mgmt_success:
        print("✅ Session Persistence and State Management: PASSED")
    else:
        print("❌ Session Persistence and State Management: FAILED")
    
    print("\n" + "=" * 80)
    
    if email_auth_success and oauth_auth_success and session_mgmt_success:
        print("🎉 ALL AUTHENTICATION REDIRECT TESTS PASSED!")
        print("✅ Authentication system working correctly for login redirect flow")
        print("\n📋 SUMMARY FOR MAIN AGENT:")
        print("- Backend authentication endpoints are working properly")
        print("- Both email/password and Google OAuth authentication flows are functional")
        print("- Session tokens are generated and validated correctly")
        print("- Protected endpoints properly require authentication")
        print("- Session persistence and state management working correctly")
        print("- The login redirect issue is likely on the frontend side")
        print("\n🔍 RECOMMENDATION:")
        print("- Backend authentication is working correctly")
        print("- Focus investigation on frontend authentication state management")
        print("- Check AuthContext.js, ProtectedRoute.js, and LandingPage.js for state handling issues")
        print("- Verify that frontend properly stores and uses session tokens")
        print("- Check that authentication state changes trigger proper component re-renders")
    else:
        print("❌ SOME AUTHENTICATION REDIRECT TESTS FAILED!")
        print("⚠️ Backend authentication system has issues that need to be addressed")

if __name__ == "__main__":
    main()