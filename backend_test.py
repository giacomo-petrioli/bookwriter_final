#!/usr/bin/env python3
"""
Comprehensive Backend Testing for MyBookCrafter AI Application
Tests all API endpoints, authentication, AI content generation, export functionality, 
credit system, and database operations after branding update.
"""

import requests
import json
import time
import sys
import os
from typing import Dict, Any, Optional
import uuid

# Configuration
BACKEND_URL = "http://localhost:8001/api"
TEST_USER_EMAIL = "testuser@mybookcrafter.ai"
TEST_USER_NAME = "Test User"
TEST_USER_PASSWORD = "testpassword123"

class BackendTester:
    def __init__(self):
        self.session_token = None
        self.user_id = None
        self.test_project_id = None
        self.results = {
            "total_tests": 0,
            "passed_tests": 0,
            "failed_tests": 0,
            "test_details": []
        }
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.results["total_tests"] += 1
        if success:
            self.results["passed_tests"] += 1
            status = "✅ PASS"
        else:
            self.results["failed_tests"] += 1
            status = "❌ FAIL"
        
        result = f"{status}: {test_name}"
        if details:
            result += f" - {details}"
        
        self.results["test_details"].append(result)
        print(result)
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, headers: Dict = None) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{BACKEND_URL}{endpoint}"
        
        # Add authentication header if we have a session token
        if self.session_token and headers is None:
            headers = {"Authorization": f"Bearer {self.session_token}"}
        elif self.session_token and headers:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method.upper() == "DELETE":
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
    
    def test_health_check(self):
        """Test basic API health check"""
        try:
            response = self.make_request("GET", "/")
            if response and response.status_code == 200:
                self.log_test("API Health Check", True, f"Backend responding on {BACKEND_URL}")
                return True
            else:
                self.log_test("API Health Check", False, f"Backend not responding - Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Exception: {str(e)}")
            return False
    
    def test_user_registration(self):
        """Test user registration with email/password"""
        try:
            # First, try to clean up any existing user
            self.cleanup_test_user()
            
            data = {
                "email": TEST_USER_EMAIL,
                "name": TEST_USER_NAME,
                "password": TEST_USER_PASSWORD
            }
            
            response = self.make_request("POST", "/auth/register", data)
            
            if response and response.status_code == 200:
                result = response.json()
                if "session_token" in result and "user" in result:
                    self.session_token = result["session_token"]
                    self.user_id = result["user"]["id"]
                    self.log_test("User Registration", True, f"User registered with ID: {self.user_id}")
                    return True
                else:
                    self.log_test("User Registration", False, "Missing session_token or user in response")
                    return False
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_test("User Registration", False, f"Status: {response.status_code if response else 'No response'}, Error: {error_msg}")
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"Exception: {str(e)}")
            return False
    
    def test_user_login(self):
        """Test user login with email/password"""
        try:
            data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            response = self.make_request("POST", "/auth/login", data, headers={})
            
            if response and response.status_code == 200:
                result = response.json()
                if "session_token" in result:
                    self.session_token = result["session_token"]
                    self.user_id = result["user"]["id"]
                    self.log_test("User Login", True, f"Login successful, token received")
                    return True
                else:
                    self.log_test("User Login", False, "Missing session_token in response")
                    return False
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_test("User Login", False, f"Status: {response.status_code if response else 'No response'}, Error: {error_msg}")
                return False
        except Exception as e:
            self.log_test("User Login", False, f"Exception: {str(e)}")
            return False
    
    def test_user_profile(self):
        """Test getting user profile"""
        try:
            response = self.make_request("GET", "/auth/profile")
            
            if response and response.status_code == 200:
                profile = response.json()
                if "id" in profile and "email" in profile and "name" in profile:
                    self.log_test("User Profile", True, f"Profile retrieved for {profile['email']}")
                    return True
                else:
                    self.log_test("User Profile", False, "Missing required fields in profile")
                    return False
            else:
                self.log_test("User Profile", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("User Profile", False, f"Exception: {str(e)}")
            return False
    
    def test_user_stats(self):
        """Test user statistics endpoint"""
        try:
            response = self.make_request("GET", "/user/stats")
            
            if response and response.status_code == 200:
                stats = response.json()
                required_fields = ["total_books", "completed_books", "total_chapters", "total_words", "credit_balance"]
                if all(field in stats for field in required_fields):
                    self.log_test("User Statistics", True, f"Stats retrieved: {stats['total_books']} books, {stats['credit_balance']} credits")
                    return True
                else:
                    missing = [f for f in required_fields if f not in stats]
                    self.log_test("User Statistics", False, f"Missing fields: {missing}")
                    return False
            else:
                self.log_test("User Statistics", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("User Statistics", False, f"Exception: {str(e)}")
            return False
    
    def test_credit_balance(self):
        """Test credit balance endpoint"""
        try:
            response = self.make_request("GET", "/credits/balance")
            
            if response and response.status_code == 200:
                balance = response.json()
                if "credit_balance" in balance and "user_id" in balance:
                    self.log_test("Credit Balance", True, f"Balance: {balance['credit_balance']} credits")
                    return True
                else:
                    self.log_test("Credit Balance", False, "Missing required fields in balance response")
                    return False
            else:
                self.log_test("Credit Balance", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("Credit Balance", False, f"Exception: {str(e)}")
            return False
    
    def test_credit_packages(self):
        """Test credit packages endpoint"""
        try:
            response = self.make_request("GET", "/credits/packages", headers={})
            
            if response and response.status_code == 200:
                packages = response.json()
                if "packages" in packages and len(packages["packages"]) > 0:
                    package_count = len(packages["packages"])
                    self.log_test("Credit Packages", True, f"{package_count} packages available")
                    return True
                else:
                    self.log_test("Credit Packages", False, "No packages found")
                    return False
            else:
                self.log_test("Credit Packages", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("Credit Packages", False, f"Exception: {str(e)}")
            return False
    
    def test_book_project_creation(self):
        """Test creating a book project"""
        try:
            data = {
                "title": "MyBookCrafter AI Test Book",
                "description": "A comprehensive test book to verify all MyBookCrafter AI functionality after branding update",
                "pages": 50,
                "chapters": 5,
                "language": "English",
                "writing_style": "story"
            }
            
            response = self.make_request("POST", "/projects", data)
            
            if response and response.status_code == 200:
                project = response.json()
                if "id" in project and "title" in project:
                    self.test_project_id = project["id"]
                    self.log_test("Book Project Creation", True, f"Project created: {project['title']} (ID: {self.test_project_id})")
                    return True
                else:
                    self.log_test("Book Project Creation", False, "Missing required fields in project response")
                    return False
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_test("Book Project Creation", False, f"Status: {response.status_code if response else 'No response'}, Error: {error_msg}")
                return False
        except Exception as e:
            self.log_test("Book Project Creation", False, f"Exception: {str(e)}")
            return False
    
    def test_book_project_list(self):
        """Test listing book projects"""
        try:
            response = self.make_request("GET", "/projects")
            
            if response and response.status_code == 200:
                projects = response.json()
                if isinstance(projects, list):
                    self.log_test("Book Project List", True, f"Retrieved {len(projects)} projects")
                    return True
                else:
                    self.log_test("Book Project List", False, "Response is not a list")
                    return False
            else:
                self.log_test("Book Project List", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("Book Project List", False, f"Exception: {str(e)}")
            return False
    
    def test_book_project_get(self):
        """Test getting a specific book project"""
        if not self.test_project_id:
            self.log_test("Book Project Get", False, "No test project ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/projects/{self.test_project_id}")
            
            if response and response.status_code == 200:
                project = response.json()
                if "id" in project and project["id"] == self.test_project_id:
                    self.log_test("Book Project Get", True, f"Retrieved project: {project.get('title', 'Unknown')}")
                    return True
                else:
                    self.log_test("Book Project Get", False, "Project ID mismatch or missing")
                    return False
            else:
                self.log_test("Book Project Get", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("Book Project Get", False, f"Exception: {str(e)}")
            return False
    
    def test_ai_outline_generation(self):
        """Test AI outline generation with Gemini"""
        if not self.test_project_id:
            self.log_test("AI Outline Generation", False, "No test project ID available")
            return False
        
        try:
            data = {"project_id": self.test_project_id}
            
            print("Generating AI outline... (this may take 15-30 seconds)")
            response = self.make_request("POST", "/generate-outline", data)
            
            if response and response.status_code == 200:
                result = response.json()
                if "outline" in result and len(result["outline"]) > 100:
                    outline_length = len(result["outline"])
                    self.log_test("AI Outline Generation", True, f"Generated outline ({outline_length} characters)")
                    return True
                else:
                    self.log_test("AI Outline Generation", False, "Outline too short or missing")
                    return False
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_test("AI Outline Generation", False, f"Status: {response.status_code if response else 'No response'}, Error: {error_msg}")
                return False
        except Exception as e:
            self.log_test("AI Outline Generation", False, f"Exception: {str(e)}")
            return False
    
    def test_ai_chapter_generation(self):
        """Test AI chapter generation with Gemini"""
        if not self.test_project_id:
            self.log_test("AI Chapter Generation", False, "No test project ID available")
            return False
        
        try:
            data = {
                "project_id": self.test_project_id,
                "chapter_number": 1
            }
            
            print("Generating AI chapter... (this may take 20-45 seconds)")
            response = self.make_request("POST", "/generate-chapter", data)
            
            if response and response.status_code == 200:
                result = response.json()
                if "content" in result and len(result["content"]) > 500:
                    content_length = len(result["content"])
                    # Count words (rough estimate)
                    word_count = len(result["content"].split())
                    self.log_test("AI Chapter Generation", True, f"Generated chapter ({content_length} chars, ~{word_count} words)")
                    return True
                else:
                    self.log_test("AI Chapter Generation", False, "Chapter content too short or missing")
                    return False
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_test("AI Chapter Generation", False, f"Status: {response.status_code if response else 'No response'}, Error: {error_msg}")
                return False
        except Exception as e:
            self.log_test("AI Chapter Generation", False, f"Exception: {str(e)}")
            return False
    
    def test_content_editing(self):
        """Test outline and chapter content editing"""
        if not self.test_project_id:
            self.log_test("Content Editing", False, "No test project ID available")
            return False
        
        try:
            # Test outline update
            outline_data = {
                "project_id": self.test_project_id,
                "outline": "<h2>Updated Test Outline</h2><p>This is an updated outline for testing MyBookCrafter AI editing functionality.</p>"
            }
            
            response = self.make_request("PUT", "/update-outline", outline_data)
            
            if response and response.status_code == 200:
                # Test chapter update
                chapter_data = {
                    "project_id": self.test_project_id,
                    "chapter_number": 1,
                    "content": "<h2>Chapter 1: Updated Test Chapter</h2><p>This is updated chapter content for testing MyBookCrafter AI editing functionality.</p>"
                }
                
                chapter_response = self.make_request("PUT", "/update-chapter", chapter_data)
                
                if chapter_response and chapter_response.status_code == 200:
                    self.log_test("Content Editing", True, "Both outline and chapter updates successful")
                    return True
                else:
                    self.log_test("Content Editing", False, "Chapter update failed")
                    return False
            else:
                self.log_test("Content Editing", False, "Outline update failed")
                return False
        except Exception as e:
            self.log_test("Content Editing", False, f"Exception: {str(e)}")
            return False
    
    def test_book_export_html(self):
        """Test HTML book export"""
        if not self.test_project_id:
            self.log_test("HTML Export", False, "No test project ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/export-book/{self.test_project_id}")
            
            if response and response.status_code == 200:
                result = response.json()
                if "html_content" in result and len(result["html_content"]) > 100:
                    content_length = len(result["html_content"])
                    self.log_test("HTML Export", True, f"HTML export successful ({content_length} characters)")
                    return True
                else:
                    self.log_test("HTML Export", False, "HTML content too short or missing")
                    return False
            else:
                self.log_test("HTML Export", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("HTML Export", False, f"Exception: {str(e)}")
            return False
    
    def test_book_export_pdf(self):
        """Test PDF book export"""
        if not self.test_project_id:
            self.log_test("PDF Export", False, "No test project ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/export-book-pdf/{self.test_project_id}")
            
            if response and response.status_code == 200:
                # Check if response is binary PDF data
                content_type = response.headers.get('content-type', '')
                if 'application/pdf' in content_type and len(response.content) > 1000:
                    content_size = len(response.content)
                    self.log_test("PDF Export", True, f"PDF export successful ({content_size} bytes)")
                    return True
                else:
                    self.log_test("PDF Export", False, f"Invalid PDF response (content-type: {content_type}, size: {len(response.content)})")
                    return False
            else:
                self.log_test("PDF Export", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("PDF Export", False, f"Exception: {str(e)}")
            return False
    
    def test_book_export_docx(self):
        """Test DOCX book export"""
        if not self.test_project_id:
            self.log_test("DOCX Export", False, "No test project ID available")
            return False
        
        try:
            response = self.make_request("GET", f"/export-book-docx/{self.test_project_id}")
            
            if response and response.status_code == 200:
                # Check if response is binary DOCX data
                content_type = response.headers.get('content-type', '')
                if 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' in content_type and len(response.content) > 1000:
                    content_size = len(response.content)
                    self.log_test("DOCX Export", True, f"DOCX export successful ({content_size} bytes)")
                    return True
                else:
                    self.log_test("DOCX Export", False, f"Invalid DOCX response (content-type: {content_type}, size: {len(response.content)})")
                    return False
            else:
                self.log_test("DOCX Export", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("DOCX Export", False, f"Exception: {str(e)}")
            return False
    
    def test_stripe_payment_integration(self):
        """Test Stripe payment integration"""
        try:
            # Test creating a payment session
            data = {
                "package_id": "small",
                "origin_url": "http://localhost:3000"
            }
            
            response = self.make_request("POST", "/payments/create-session", data)
            
            if response and response.status_code == 200:
                result = response.json()
                if "checkout_url" in result and "session_id" in result:
                    self.log_test("Stripe Payment Integration", True, f"Payment session created: {result['session_id']}")
                    return True
                else:
                    self.log_test("Stripe Payment Integration", False, "Missing checkout_url or session_id")
                    return False
            else:
                error_msg = response.json().get("detail", "Unknown error") if response else "No response"
                self.log_test("Stripe Payment Integration", False, f"Status: {response.status_code if response else 'No response'}, Error: {error_msg}")
                return False
        except Exception as e:
            self.log_test("Stripe Payment Integration", False, f"Exception: {str(e)}")
            return False
    
    def test_logout(self):
        """Test user logout"""
        try:
            response = self.make_request("POST", "/auth/logout")
            
            if response and response.status_code == 200:
                self.log_test("User Logout", True, "Logout successful")
                self.session_token = None
                self.user_id = None
                return True
            else:
                self.log_test("User Logout", False, f"Status: {response.status_code if response else 'No response'}")
                return False
        except Exception as e:
            self.log_test("User Logout", False, f"Exception: {str(e)}")
            return False
    
    def cleanup_test_user(self):
        """Clean up test user if exists (best effort)"""
        try:
            # This is a cleanup operation, so we don't log failures
            pass
        except:
            pass
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 80)
        print("🚀 STARTING COMPREHENSIVE MYBOOKCRAFTER AI BACKEND TESTING")
        print("=" * 80)
        print(f"Testing backend at: {BACKEND_URL}")
        print(f"Test user: {TEST_USER_EMAIL}")
        print()
        
        # Core API Tests
        print("📡 TESTING CORE API FUNCTIONALITY")
        print("-" * 40)
        if not self.test_health_check():
            print("❌ Backend is not responding. Stopping tests.")
            return self.results
        
        # Authentication Tests
        print("\n🔐 TESTING AUTHENTICATION SYSTEM")
        print("-" * 40)
        self.test_user_registration()
        self.test_user_login()
        self.test_user_profile()
        self.test_user_stats()
        
        # Credit System Tests
        print("\n💳 TESTING CREDIT SYSTEM")
        print("-" * 40)
        self.test_credit_balance()
        self.test_credit_packages()
        self.test_stripe_payment_integration()
        
        # Book Project Tests
        print("\n📚 TESTING BOOK PROJECT MANAGEMENT")
        print("-" * 40)
        self.test_book_project_creation()
        self.test_book_project_list()
        self.test_book_project_get()
        
        # AI Content Generation Tests
        print("\n🤖 TESTING AI CONTENT GENERATION")
        print("-" * 40)
        self.test_ai_outline_generation()
        self.test_ai_chapter_generation()
        self.test_content_editing()
        
        # Export Functionality Tests
        print("\n📄 TESTING BOOK EXPORT FUNCTIONALITY")
        print("-" * 40)
        self.test_book_export_html()
        self.test_book_export_pdf()
        self.test_book_export_docx()
        
        # Cleanup
        print("\n🧹 CLEANUP")
        print("-" * 40)
        self.test_logout()
        
        return self.results
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("📊 MYBOOKCRAFTER AI BACKEND TEST SUMMARY")
        print("=" * 80)
        
        total = self.results["total_tests"]
        passed = self.results["passed_tests"]
        failed = self.results["failed_tests"]
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed} ✅")
        print(f"Failed: {failed} ❌")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            print("\n🎉 EXCELLENT: MyBookCrafter AI backend is working excellently!")
        elif success_rate >= 75:
            print("\n✅ GOOD: MyBookCrafter AI backend is working well with minor issues.")
        elif success_rate >= 50:
            print("\n⚠️ MODERATE: MyBookCrafter AI backend has some significant issues.")
        else:
            print("\n❌ CRITICAL: MyBookCrafter AI backend has major issues that need attention.")
        
        print("\n📋 DETAILED TEST RESULTS:")
        print("-" * 40)
        for detail in self.results["test_details"]:
            print(detail)
        
        print("\n" + "=" * 80)

def main():
    """Main test execution"""
    tester = BackendTester()
    
    try:
        results = tester.run_all_tests()
        tester.print_summary()
        
        # Exit with appropriate code
        if results["failed_tests"] == 0:
            sys.exit(0)  # All tests passed
        else:
            sys.exit(1)  # Some tests failed
            
    except KeyboardInterrupt:
        print("\n\n⚠️ Testing interrupted by user")
        tester.print_summary()
        sys.exit(2)
    except Exception as e:
        print(f"\n\n❌ Testing failed with exception: {str(e)}")
        tester.print_summary()
        sys.exit(3)

if __name__ == "__main__":
    main()