#!/usr/bin/env python3
"""
Backend API Testing for Ai con Zio Gio Website
Tests all API endpoints and functionality
"""

import requests
import sys
import json
from datetime import datetime

class UncleGioAPITester:
    def __init__(self, base_url="http://localhost:8001"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def test_api_root(self):
        """Test API root endpoint"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            expected_message = "Ai con Zio Gio API"
            
            if success and data.get("message") == expected_message:
                self.log_test("API Root", True)
                return True
            else:
                self.log_test("API Root", False, f"Status: {response.status_code}, Data: {data}")
                return False
        except Exception as e:
            self.log_test("API Root", False, str(e))
            return False

    def test_seed_data(self):
        """Test seeding data"""
        try:
            response = requests.post(f"{self.api_url}/seed", timeout=15)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and data.get("status") == "success":
                self.log_test("Seed Data", True)
                return True
            else:
                self.log_test("Seed Data", False, f"Status: {response.status_code}, Data: {data}")
                return False
        except Exception as e:
            self.log_test("Seed Data", False, str(e))
            return False

    def test_get_projects(self):
        """Test getting projects"""
        try:
            response = requests.get(f"{self.api_url}/projects", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success and isinstance(data, list) and len(data) >= 3:
                # Check if projects have required fields
                required_fields = ['id', 'title', 'slug', 'description', 'image_url', 'category']
                first_project = data[0]
                has_required_fields = all(field in first_project for field in required_fields)
                
                if has_required_fields:
                    self.log_test("Get Projects", True, f"Found {len(data)} projects")
                    return True
                else:
                    self.log_test("Get Projects", False, "Missing required fields in project data")
                    return False
            else:
                self.log_test("Get Projects", False, f"Status: {response.status_code}, Projects count: {len(data) if isinstance(data, list) else 0}")
                return False
        except Exception as e:
            self.log_test("Get Projects", False, str(e))
            return False

    def test_get_gallery(self):
        """Test getting gallery items"""
        try:
            response = requests.get(f"{self.api_url}/gallery", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success and isinstance(data, list) and len(data) > 0:
                # Check if gallery items have required fields
                required_fields = ['id', 'title', 'image_url', 'category']
                first_item = data[0]
                has_required_fields = all(field in first_item for field in required_fields)
                
                # Check if we have both photo and ai_art categories
                categories = set(item.get('category') for item in data)
                has_both_categories = 'photo' in categories and 'ai_art' in categories
                
                if has_required_fields and has_both_categories:
                    self.log_test("Get Gallery", True, f"Found {len(data)} gallery items with both photo and AI art")
                    return True
                else:
                    self.log_test("Get Gallery", False, f"Missing fields or categories. Categories: {categories}")
                    return False
            else:
                self.log_test("Get Gallery", False, f"Status: {response.status_code}, Items count: {len(data) if isinstance(data, list) else 0}")
                return False
        except Exception as e:
            self.log_test("Get Gallery", False, str(e))
            return False

    def test_get_gallery_filtered(self):
        """Test getting filtered gallery items"""
        try:
            # Test photo filter
            response = requests.get(f"{self.api_url}/gallery?category=photo", timeout=10)
            success = response.status_code == 200
            photo_data = response.json() if success else []
            
            # Test ai_art filter
            response2 = requests.get(f"{self.api_url}/gallery?category=ai_art", timeout=10)
            success2 = response2.status_code == 200
            ai_data = response2.json() if success2 else []
            
            if success and success2:
                photo_categories = set(item.get('category') for item in photo_data)
                ai_categories = set(item.get('category') for item in ai_data)
                
                if photo_categories == {'photo'} and ai_categories == {'ai_art'}:
                    self.log_test("Gallery Filtering", True, f"Photo: {len(photo_data)}, AI Art: {len(ai_data)}")
                    return True
                else:
                    self.log_test("Gallery Filtering", False, f"Filter not working properly")
                    return False
            else:
                self.log_test("Gallery Filtering", False, "Failed to fetch filtered data")
                return False
        except Exception as e:
            self.log_test("Gallery Filtering", False, str(e))
            return False

    def test_get_blog_posts(self):
        """Test getting blog posts"""
        try:
            response = requests.get(f"{self.api_url}/blog", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success and isinstance(data, list) and len(data) >= 3:
                # Check if blog posts have required fields
                required_fields = ['id', 'title', 'slug', 'excerpt', 'content', 'category']
                first_post = data[0]
                has_required_fields = all(field in first_post for field in required_fields)
                
                # Check if posts have prompt_text (AI prompts)
                has_prompts = any(post.get('prompt_text') for post in data)
                
                if has_required_fields and has_prompts:
                    self.log_test("Get Blog Posts", True, f"Found {len(data)} blog posts with AI prompts")
                    return True
                else:
                    self.log_test("Get Blog Posts", False, "Missing required fields or AI prompts")
                    return False
            else:
                self.log_test("Get Blog Posts", False, f"Status: {response.status_code}, Posts count: {len(data) if isinstance(data, list) else 0}")
                return False
        except Exception as e:
            self.log_test("Get Blog Posts", False, str(e))
            return False

    def test_get_single_blog_post(self):
        """Test getting a single blog post by slug"""
        try:
            # First get all posts to find a slug
            response = requests.get(f"{self.api_url}/blog", timeout=10)
            if response.status_code == 200:
                posts = response.json()
                if posts:
                    test_slug = posts[0].get('slug')
                    if test_slug:
                        # Test getting single post
                        response2 = requests.get(f"{self.api_url}/blog/{test_slug}", timeout=10)
                        success = response2.status_code == 200
                        data = response2.json() if success else {}
                        
                        if success and data.get('slug') == test_slug:
                            self.log_test("Get Single Blog Post", True, f"Retrieved post: {test_slug}")
                            return True
                        else:
                            self.log_test("Get Single Blog Post", False, f"Status: {response2.status_code}")
                            return False
                    else:
                        self.log_test("Get Single Blog Post", False, "No slug found in blog posts")
                        return False
                else:
                    self.log_test("Get Single Blog Post", False, "No blog posts available")
                    return False
            else:
                self.log_test("Get Single Blog Post", False, "Failed to fetch blog posts list")
                return False
        except Exception as e:
            self.log_test("Get Single Blog Post", False, str(e))
            return False

    def test_contact_form_submission(self):
        """Test contact form submission (mocked email)"""
        try:
            test_data = {
                "name": "Test User",
                "email": "test@example.com",
                "message": "This is a test message from the automated testing suite."
            }
            
            response = requests.post(f"{self.api_url}/contact", json=test_data, timeout=10)
            success = response.status_code == 200
            data = response.json() if success else {}
            
            if success and data.get("status") == "success" and data.get("email_status") == "mocked":
                self.log_test("Contact Form Submission", True, "Message saved and email mocked")
                return True
            else:
                self.log_test("Contact Form Submission", False, f"Status: {response.status_code}, Data: {data}")
                return False
        except Exception as e:
            self.log_test("Contact Form Submission", False, str(e))
            return False

    def test_contact_form_validation(self):
        """Test contact form validation"""
        try:
            # Test with invalid email
            invalid_data = {
                "name": "Test User",
                "email": "invalid-email",
                "message": "Test message"
            }
            
            response = requests.post(f"{self.api_url}/contact", json=invalid_data, timeout=10)
            
            # Should return 422 for validation error
            if response.status_code == 422:
                self.log_test("Contact Form Validation", True, "Properly validates email format")
                return True
            else:
                self.log_test("Contact Form Validation", False, f"Expected 422, got {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Contact Form Validation", False, str(e))
            return False

    def test_get_contact_messages(self):
        """Test getting contact messages (admin endpoint)"""
        try:
            response = requests.get(f"{self.api_url}/contact", timeout=10)
            success = response.status_code == 200
            data = response.json() if success else []
            
            if success and isinstance(data, list):
                self.log_test("Get Contact Messages", True, f"Retrieved {len(data)} contact messages")
                return True
            else:
                self.log_test("Get Contact Messages", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get Contact Messages", False, str(e))
            return False

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Uncle Gio API Tests...")
        print(f"Testing API at: {self.api_url}")
        print("-" * 50)
        
        # Test API availability first
        if not self.test_api_root():
            print("❌ API is not accessible. Stopping tests.")
            return False
        
        # Seed data first
        self.test_seed_data()
        
        # Test all endpoints
        self.test_get_projects()
        self.test_get_gallery()
        self.test_get_gallery_filtered()
        self.test_get_blog_posts()
        self.test_get_single_blog_post()
        self.test_contact_form_submission()
        self.test_contact_form_validation()
        self.test_get_contact_messages()
        
        # Print summary
        print("-" * 50)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check the details above.")
            return False

def main():
    tester = UncleGioAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())