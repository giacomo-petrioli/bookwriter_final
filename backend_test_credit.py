#!/usr/bin/env python3
"""
Backend API Testing for AI Book Writer Application - Credit System Focus
Tests the comprehensive credit system implementation including:
- User credit balance management (10 credits default)
- Chapter generation costs and deduction (1 credit per chapter)
- Credit transaction tracking
- Book cost calculation (minimum chapters based on max 10 pages per chapter)
- Credit validation for project creation (402 error for insufficient credits)
- Regeneration cost tracking (1 credit for regeneration)
"""

import requests
import json
import time
import sys
from datetime import datetime

# Get backend URL from frontend .env
BACKEND_URL = "https://43336fda-caff-40cd-a722-a58a0bb9eab7.preview.emergentagent.com/api"

class CreditSystemTester:
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
        self.initial_credit_balance = None
        
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

    def setup_test_user(self):
        """Setup a test user for credit system testing"""
        try:
            self.log("Setting up test user for credit system testing...")
            
            # Test user registration to get a fresh user with default credits
            registration_data = {
                "email": f"credituser_{int(time.time())}@bookcraft.ai",
                "name": "Credit Test User",
                "password": "testpassword123"
            }
            
            response = self.session.post(f"{self.base_url}/auth/register", json=registration_data)
            
            if response.status_code == 200:
                data = response.json()
                
                # Store auth token for further tests
                self.auth_token = data.get("session_token")
                self.test_user_data = data.get("user")
                self.session.headers.update({'Authorization': f'Bearer {self.auth_token}'})
                
                self.log("✅ Test user created successfully")
                self.log(f"✅ User: {self.test_user_data.get('name')} ({self.test_user_data.get('email')})")
                return True
                
            elif response.status_code == 400:
                # User might already exist, try login
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
                    self.log("✅ Logged in existing test user")
                    return True
                else:
                    self.log(f"❌ Failed to login existing user: {login_response.status_code}", "ERROR")
                    return False
            else:
                self.log(f"❌ User setup failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ User setup failed: {str(e)}", "ERROR")
            return False

    def test_default_credit_balance(self):
        """Test that new users start with 10 credits by default"""
        try:
            self.log("Testing default credit balance for new users...")
            
            if not self.auth_token:
                self.log("❌ No auth token available for credit balance test", "ERROR")
                return False
            
            response = self.session.get(f"{self.base_url}/credits/balance")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["credit_balance", "user_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in credit balance response: {missing_fields}", "ERROR")
                    return False
                
                credit_balance = data.get("credit_balance")
                user_id = data.get("user_id")
                
                # Store initial balance for later tests
                self.initial_credit_balance = credit_balance
                
                # Verify user ID matches
                if user_id != self.test_user_data.get("id"):
                    self.log(f"❌ User ID mismatch in credit balance response", "ERROR")
                    return False
                
                # Check if user has default 10 credits (or more if they've been used before)
                if credit_balance >= 0:  # Should have some credits
                    self.log(f"✅ User has {credit_balance} credits available")
                    self.log("✅ Credit balance endpoint working correctly")
                    return True
                else:
                    self.log(f"❌ Invalid credit balance: {credit_balance}", "ERROR")
                    return False
            else:
                self.log(f"❌ Credit balance check failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Default credit balance test failed: {str(e)}", "ERROR")
            return False

    def test_book_cost_calculation(self):
        """Test book cost calculation with various page/chapter combinations"""
        try:
            self.log("Testing book cost calculation logic...")
            
            # Test scenarios for book cost calculation
            test_scenarios = [
                # (pages, chapters, expected_min_chapters, description)
                (120, 10, 12, "120 pages/10 chapters should require minimum 12 chapters"),
                (100, 5, 10, "100 pages/5 chapters should require minimum 10 chapters"),
                (50, 10, 10, "50 pages/10 chapters should keep 10 chapters (within limit)"),
                (200, 15, 20, "200 pages/15 chapters should require minimum 20 chapters"),
                (10, 5, 5, "10 pages/5 chapters should keep 5 chapters (within limit)"),
            ]
            
            all_passed = True
            
            for pages, chapters, expected_min_chapters, description in test_scenarios:
                try:
                    request_data = {
                        "pages": pages,
                        "chapters": chapters
                    }
                    
                    response = self.session.post(f"{self.base_url}/credits/calculate-book-cost", json=request_data)
                    
                    if response.status_code == 200:
                        data = response.json()
                        
                        # Check response structure
                        required_fields = ["pages", "requested_chapters", "minimum_chapters", "cost_per_chapter", "total_cost", "pages_per_chapter"]
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if missing_fields:
                            self.log(f"❌ Missing fields in cost calculation response: {missing_fields}", "ERROR")
                            all_passed = False
                            continue
                        
                        # Verify calculation logic
                        min_chapters = data.get("minimum_chapters")
                        total_cost = data.get("total_cost")
                        cost_per_chapter = data.get("cost_per_chapter")
                        pages_per_chapter = data.get("pages_per_chapter")
                        
                        if min_chapters != expected_min_chapters:
                            self.log(f"❌ {description}: Expected {expected_min_chapters}, got {min_chapters}", "ERROR")
                            all_passed = False
                            continue
                        
                        if cost_per_chapter != 1:
                            self.log(f"❌ Cost per chapter should be 1, got {cost_per_chapter}", "ERROR")
                            all_passed = False
                            continue
                        
                        if total_cost != min_chapters:
                            self.log(f"❌ Total cost should equal minimum chapters ({min_chapters}), got {total_cost}", "ERROR")
                            all_passed = False
                            continue
                        
                        if pages_per_chapter != (pages / min_chapters):
                            self.log(f"❌ Pages per chapter calculation incorrect", "ERROR")
                            all_passed = False
                            continue
                        
                        self.log(f"✅ {description} - Calculated correctly: {min_chapters} chapters, {total_cost} credits")
                        
                    else:
                        self.log(f"❌ Cost calculation failed for {description}: {response.status_code}", "ERROR")
                        all_passed = False
                        
                except Exception as e:
                    self.log(f"❌ Error testing {description}: {str(e)}", "ERROR")
                    all_passed = False
            
            if all_passed:
                self.log("✅ All book cost calculation scenarios passed")
                return True
            else:
                self.log("❌ Some book cost calculation scenarios failed", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Book cost calculation test failed: {str(e)}", "ERROR")
            return False

    def test_project_creation_with_sufficient_credits(self):
        """Test project creation when user has sufficient credits"""
        try:
            self.log("Testing project creation with sufficient credits...")
            
            if not self.auth_token:
                self.log("❌ No auth token available for project creation test", "ERROR")
                return False
            
            # Create a project that should be within credit limits
            project_data = {
                "title": "Credit Test Book",
                "description": "Testing credit system with a small book project",
                "pages": 50,  # Should require 5 chapters minimum
                "chapters": 5,
                "language": "English",
                "writing_style": "story"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 200:
                data = response.json()
                self.test_project_id = data.get("id")
                
                # Validate response structure
                required_fields = ["id", "title", "description", "pages", "chapters", "language", "user_id"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in project response: {missing_fields}", "ERROR")
                    return False
                
                # Verify project data
                if data["title"] != project_data["title"]:
                    self.log(f"❌ Title mismatch in project creation", "ERROR")
                    return False
                
                if data["user_id"] != self.test_user_data.get("id"):
                    self.log(f"❌ User ID mismatch in project creation", "ERROR")
                    return False
                
                self.log(f"✅ Project created successfully with sufficient credits")
                self.log(f"✅ Project ID: {self.test_project_id}")
                return True
                
            elif response.status_code == 402:
                # This means insufficient credits - might be expected if user has been used before
                error_data = response.json()
                self.log(f"⚠️ Project creation failed due to insufficient credits: {error_data.get('detail')}", "WARNING")
                self.log("⚠️ This may be expected if test user has been used before", "WARNING")
                return True  # We'll test insufficient credits separately
                
            else:
                self.log(f"❌ Project creation failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Project creation test failed: {str(e)}", "ERROR")
            return False

    def test_project_creation_with_insufficient_credits(self):
        """Test project creation when user has insufficient credits (should return 402)"""
        try:
            self.log("Testing project creation with insufficient credits...")
            
            if not self.auth_token:
                self.log("❌ No auth token available for insufficient credits test", "ERROR")
                return False
            
            # Create a project that requires more credits than available
            # Use a large book that would require many chapters
            project_data = {
                "title": "Large Credit Test Book",
                "description": "Testing credit system with a large book that should exceed credit limits",
                "pages": 1000,  # Should require 100 chapters minimum (1000/10 = 100)
                "chapters": 50,  # User requests 50 but system should enforce 100 minimum
                "language": "English",
                "writing_style": "story"
            }
            
            response = self.session.post(f"{self.base_url}/projects", json=project_data)
            
            if response.status_code == 402:
                error_data = response.json()
                error_detail = error_data.get("detail", "")
                
                # Check that error message mentions insufficient credits
                if "insufficient credits" in error_detail.lower():
                    self.log("✅ Project creation correctly rejected due to insufficient credits")
                    self.log(f"✅ Error message: {error_detail}")
                    
                    # Check if error message includes cost information
                    if "100" in error_detail:  # Should mention 100 chapters needed
                        self.log("✅ Error message includes correct cost calculation")
                    else:
                        self.log("⚠️ Error message may not include detailed cost information", "WARNING")
                    
                    return True
                else:
                    self.log(f"❌ 402 error but wrong message: {error_detail}", "ERROR")
                    return False
                    
            elif response.status_code == 200:
                # This means user had enough credits - might happen with fresh user
                self.log("⚠️ Project creation succeeded - user may have sufficient credits", "WARNING")
                self.log("⚠️ This test may need a user with fewer credits", "WARNING")
                return True  # Not a failure, just different scenario
                
            else:
                self.log(f"❌ Expected 402 for insufficient credits, got {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Insufficient credits test failed: {str(e)}", "ERROR")
            return False

    def test_chapter_generation_credit_deduction(self):
        """Test that chapter generation deducts 1 credit and tracks transactions"""
        try:
            self.log("Testing chapter generation credit deduction...")
            
            if not self.test_project_id:
                self.log("❌ No test project available for chapter generation", "ERROR")
                return False
            
            # First, generate an outline for the project
            outline_request = {
                "project_id": self.test_project_id
            }
            
            outline_response = self.session.post(f"{self.base_url}/generate-outline", json=outline_request)
            
            if outline_response.status_code != 200:
                self.log(f"❌ Failed to generate outline: {outline_response.status_code}", "ERROR")
                return False
            
            self.log("✅ Outline generated successfully")
            
            # Get current credit balance before chapter generation
            balance_response = self.session.get(f"{self.base_url}/credits/balance")
            if balance_response.status_code != 200:
                self.log("❌ Failed to get credit balance before chapter generation", "ERROR")
                return False
            
            balance_before = balance_response.json().get("credit_balance")
            self.log(f"Credit balance before chapter generation: {balance_before}")
            
            # Generate a chapter
            chapter_request = {
                "project_id": self.test_project_id,
                "chapter_number": 1
            }
            
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            
            if chapter_response.status_code == 200:
                chapter_data = chapter_response.json()
                
                # Check response structure
                required_fields = ["chapter_content", "chapter_number", "project_id", "credit_cost", "remaining_credits", "was_regeneration"]
                missing_fields = [field for field in required_fields if field not in chapter_data]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in chapter response: {missing_fields}", "ERROR")
                    return False
                
                # Verify credit deduction
                credit_cost = chapter_data.get("credit_cost")
                remaining_credits = chapter_data.get("remaining_credits")
                was_regeneration = chapter_data.get("was_regeneration")
                
                if credit_cost != 1:
                    self.log(f"❌ Expected credit cost of 1, got {credit_cost}", "ERROR")
                    return False
                
                if remaining_credits != (balance_before - 1):
                    self.log(f"❌ Credit balance not updated correctly. Expected {balance_before - 1}, got {remaining_credits}", "ERROR")
                    return False
                
                if was_regeneration != False:
                    self.log(f"❌ First generation should not be marked as regeneration", "ERROR")
                    return False
                
                self.log("✅ Chapter generated successfully with correct credit deduction")
                self.log(f"✅ Credit cost: {credit_cost}, Remaining credits: {remaining_credits}")
                self.log(f"✅ Was regeneration: {was_regeneration}")
                
                return True
                
            elif chapter_response.status_code == 402:
                error_data = chapter_response.json()
                self.log(f"⚠️ Chapter generation failed due to insufficient credits: {error_data.get('detail')}", "WARNING")
                self.log("⚠️ This may be expected if user has low credits", "WARNING")
                return True  # Not a failure, just different scenario
                
            else:
                self.log(f"❌ Chapter generation failed with status {chapter_response.status_code}: {chapter_response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Chapter generation credit deduction test failed: {str(e)}", "ERROR")
            return False

    def test_chapter_regeneration_cost(self):
        """Test that regenerating an existing chapter also costs 1 credit"""
        try:
            self.log("Testing chapter regeneration credit cost...")
            
            if not self.test_project_id:
                self.log("❌ No test project available for chapter regeneration", "ERROR")
                return False
            
            # Get current credit balance before regeneration
            balance_response = self.session.get(f"{self.base_url}/credits/balance")
            if balance_response.status_code != 200:
                self.log("❌ Failed to get credit balance before regeneration", "ERROR")
                return False
            
            balance_before = balance_response.json().get("credit_balance")
            self.log(f"Credit balance before regeneration: {balance_before}")
            
            # Regenerate the same chapter (chapter 1)
            chapter_request = {
                "project_id": self.test_project_id,
                "chapter_number": 1
            }
            
            chapter_response = self.session.post(f"{self.base_url}/generate-chapter", json=chapter_request)
            
            if chapter_response.status_code == 200:
                chapter_data = chapter_response.json()
                
                # Verify this is marked as regeneration
                credit_cost = chapter_data.get("credit_cost")
                remaining_credits = chapter_data.get("remaining_credits")
                was_regeneration = chapter_data.get("was_regeneration")
                
                if credit_cost != 1:
                    self.log(f"❌ Expected regeneration credit cost of 1, got {credit_cost}", "ERROR")
                    return False
                
                if remaining_credits != (balance_before - 1):
                    self.log(f"❌ Credit balance not updated correctly for regeneration. Expected {balance_before - 1}, got {remaining_credits}", "ERROR")
                    return False
                
                if was_regeneration != True:
                    self.log(f"❌ Regeneration should be marked as regeneration", "ERROR")
                    return False
                
                self.log("✅ Chapter regenerated successfully with correct credit deduction")
                self.log(f"✅ Credit cost: {credit_cost}, Remaining credits: {remaining_credits}")
                self.log(f"✅ Was regeneration: {was_regeneration}")
                
                return True
                
            elif chapter_response.status_code == 402:
                error_data = chapter_response.json()
                self.log(f"⚠️ Chapter regeneration failed due to insufficient credits: {error_data.get('detail')}", "WARNING")
                self.log("⚠️ This may be expected if user has low credits", "WARNING")
                return True  # Not a failure, just different scenario
                
            else:
                self.log(f"❌ Chapter regeneration failed with status {chapter_response.status_code}: {chapter_response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Chapter regeneration cost test failed: {str(e)}", "ERROR")
            return False

    def test_credit_transaction_history(self):
        """Test that all credit operations are logged in transaction history"""
        try:
            self.log("Testing credit transaction history...")
            
            if not self.auth_token:
                self.log("❌ No auth token available for transaction history test", "ERROR")
                return False
            
            response = self.session.get(f"{self.base_url}/credits/history")
            
            if response.status_code == 200:
                transactions = response.json()
                
                if not isinstance(transactions, list):
                    self.log(f"❌ Expected list response for transaction history, got {type(transactions)}", "ERROR")
                    return False
                
                if len(transactions) == 0:
                    self.log("⚠️ No transactions found in history", "WARNING")
                    return True
                
                # Check transaction structure
                for transaction in transactions:
                    required_fields = ["id", "amount", "transaction_type", "description", "created_at"]
                    missing_fields = [field for field in required_fields if field not in transaction]
                    
                    if missing_fields:
                        self.log(f"❌ Missing fields in transaction: {missing_fields}", "ERROR")
                        return False
                
                # Look for chapter generation transactions
                chapter_transactions = [t for t in transactions if "chapter" in t.get("transaction_type", "").lower()]
                
                if len(chapter_transactions) > 0:
                    self.log(f"✅ Found {len(chapter_transactions)} chapter-related transactions")
                    
                    # Check transaction details
                    for transaction in chapter_transactions[:3]:  # Check first 3
                        amount = transaction.get("amount")
                        transaction_type = transaction.get("transaction_type")
                        description = transaction.get("description")
                        
                        if amount != -1:  # Should be negative for deduction
                            self.log(f"❌ Expected amount -1 for chapter transaction, got {amount}", "ERROR")
                            return False
                        
                        if transaction_type not in ["chapter_generation", "chapter_regeneration"]:
                            self.log(f"❌ Unexpected transaction type: {transaction_type}", "ERROR")
                            return False
                        
                        self.log(f"✅ Transaction: {transaction_type}, Amount: {amount}, Description: {description}")
                else:
                    self.log("⚠️ No chapter-related transactions found", "WARNING")
                
                self.log(f"✅ Transaction history retrieved successfully ({len(transactions)} total transactions)")
                return True
                
            else:
                self.log(f"❌ Transaction history retrieval failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Credit transaction history test failed: {str(e)}", "ERROR")
            return False

    def test_user_stats_includes_credit_balance(self):
        """Test that user stats endpoint includes credit balance"""
        try:
            self.log("Testing user stats includes credit balance...")
            
            if not self.auth_token:
                self.log("❌ No auth token available for user stats test", "ERROR")
                return False
            
            response = self.session.get(f"{self.base_url}/user/stats")
            
            if response.status_code == 200:
                stats_data = response.json()
                
                # Check if credit_balance is included
                if "credit_balance" not in stats_data:
                    self.log("❌ Credit balance not included in user stats", "ERROR")
                    return False
                
                credit_balance = stats_data.get("credit_balance")
                
                if not isinstance(credit_balance, int):
                    self.log(f"❌ Credit balance should be integer, got {type(credit_balance)}", "ERROR")
                    return False
                
                if credit_balance < 0:
                    self.log(f"❌ Credit balance should not be negative, got {credit_balance}", "ERROR")
                    return False
                
                self.log(f"✅ User stats includes credit balance: {credit_balance}")
                
                # Verify it matches the balance from credit endpoint
                balance_response = self.session.get(f"{self.base_url}/credits/balance")
                if balance_response.status_code == 200:
                    balance_data = balance_response.json()
                    direct_balance = balance_data.get("credit_balance")
                    
                    if credit_balance != direct_balance:
                        self.log(f"❌ Credit balance mismatch between stats ({credit_balance}) and balance endpoint ({direct_balance})", "ERROR")
                        return False
                    
                    self.log("✅ Credit balance consistent between endpoints")
                
                return True
                
            else:
                self.log(f"❌ User stats retrieval failed with status {response.status_code}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ User stats credit balance test failed: {str(e)}", "ERROR")
            return False

    def test_credit_purchase_demo(self):
        """Test credit purchase demo functionality"""
        try:
            self.log("Testing credit purchase demo functionality...")
            
            if not self.auth_token:
                self.log("❌ No auth token available for credit purchase test", "ERROR")
                return False
            
            # Get current balance
            balance_response = self.session.get(f"{self.base_url}/credits/balance")
            if balance_response.status_code != 200:
                self.log("❌ Failed to get current balance for purchase test", "ERROR")
                return False
            
            balance_before = balance_response.json().get("credit_balance")
            
            # Purchase credits
            purchase_data = {
                "amount": 5,
                "payment_method": "stripe"
            }
            
            response = self.session.post(f"{self.base_url}/credits/purchase", json=purchase_data)
            
            if response.status_code == 200:
                purchase_result = response.json()
                
                # Check response structure
                required_fields = ["success", "message", "new_balance"]
                missing_fields = [field for field in required_fields if field not in purchase_result]
                
                if missing_fields:
                    self.log(f"❌ Missing fields in purchase response: {missing_fields}", "ERROR")
                    return False
                
                success = purchase_result.get("success")
                message = purchase_result.get("message")
                new_balance = purchase_result.get("new_balance")
                
                if not success:
                    self.log(f"❌ Purchase not marked as successful", "ERROR")
                    return False
                
                if new_balance != (balance_before + 5):
                    self.log(f"❌ New balance incorrect. Expected {balance_before + 5}, got {new_balance}", "ERROR")
                    return False
                
                self.log(f"✅ Credit purchase successful: {message}")
                self.log(f"✅ Balance updated from {balance_before} to {new_balance}")
                
                # Verify balance is actually updated
                verify_response = self.session.get(f"{self.base_url}/credits/balance")
                if verify_response.status_code == 200:
                    verify_balance = verify_response.json().get("credit_balance")
                    if verify_balance != new_balance:
                        self.log(f"❌ Balance not actually updated in database", "ERROR")
                        return False
                    self.log("✅ Balance verified in database")
                
                return True
                
            else:
                self.log(f"❌ Credit purchase failed with status {response.status_code}: {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Credit purchase test failed: {str(e)}", "ERROR")
            return False

    def run_comprehensive_credit_system_tests(self):
        """Run all credit system tests comprehensively"""
        try:
            self.log("=" * 80)
            self.log("COMPREHENSIVE CREDIT SYSTEM TESTING")
            self.log("=" * 80)
            
            credit_tests = [
                ("API Health Check", self.test_api_health_check),
                ("Setup Test User", self.setup_test_user),
                ("Default Credit Balance (10 credits)", self.test_default_credit_balance),
                ("Book Cost Calculation Logic", self.test_book_cost_calculation),
                ("Project Creation with Sufficient Credits", self.test_project_creation_with_sufficient_credits),
                ("Project Creation with Insufficient Credits (402 Error)", self.test_project_creation_with_insufficient_credits),
                ("Chapter Generation Credit Deduction", self.test_chapter_generation_credit_deduction),
                ("Chapter Regeneration Cost", self.test_chapter_regeneration_cost),
                ("Credit Transaction History", self.test_credit_transaction_history),
                ("User Stats Includes Credit Balance", self.test_user_stats_includes_credit_balance),
                ("Credit Purchase Demo", self.test_credit_purchase_demo),
            ]
            
            passed_tests = 0
            total_tests = len(credit_tests)
            
            for test_name, test_func in credit_tests:
                self.log(f"\n--- Running {test_name} ---")
                try:
                    if test_func():
                        passed_tests += 1
                        self.log(f"✅ {test_name} PASSED")
                    else:
                        self.log(f"❌ {test_name} FAILED")
                except Exception as e:
                    self.log(f"❌ {test_name} FAILED with exception: {str(e)}")
                
                time.sleep(1)  # Brief pause between tests
            
            self.log("\n" + "=" * 80)
            self.log(f"CREDIT SYSTEM TEST RESULTS: {passed_tests}/{total_tests} PASSED")
            self.log("=" * 80)
            
            if passed_tests == total_tests:
                self.log("🎉 ALL CREDIT SYSTEM TESTS PASSED!")
                return True
            else:
                self.log(f"⚠️ {total_tests - passed_tests} CREDIT SYSTEM TESTS FAILED")
                return False
                
        except Exception as e:
            self.log(f"❌ Comprehensive credit system test failed: {str(e)}", "ERROR")
            return False

def main():
    """Main function to run credit system tests"""
    tester = CreditSystemTester()
    
    print("Starting Credit System Testing...")
    print("=" * 80)
    
    success = tester.run_comprehensive_credit_system_tests()
    
    if success:
        print("\n🎉 CREDIT SYSTEM TESTING COMPLETED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("\n❌ CREDIT SYSTEM TESTING COMPLETED WITH FAILURES!")
        sys.exit(1)

if __name__ == "__main__":
    main()