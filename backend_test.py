#!/usr/bin/env python3
"""
CabLib Backend API Testing
Testing the medical office rental platform API endpoints
"""

import requests
import json
import time
import os
from pathlib import Path

# Test Configuration
BASE_URL = "https://office-match-hub.preview.emergentagent.com/api"

# Test accounts
TEST_ACCOUNTS = {
    "proprietaire": {
        "email": "proprietaire@test.fr",
        "password": "test123"
    },
    "locataire": {
        "email": "locataire@test.fr", 
        "password": "test123"
    }
}

class CabLibTester:
    def __init__(self):
        self.session = requests.Session()
        self.tokens = {}
        self.test_results = {}
        
    def log_result(self, test_name, success, message):
        """Log test result"""
        status = "PASS" if success else "FAIL"
        print(f"[{status}] {test_name}: {message}")
        self.test_results[test_name] = {"success": success, "message": message}
    
    def authenticate_user(self, user_type):
        """Authenticate and get token for user type"""
        try:
            login_data = TEST_ACCOUNTS[user_type]
            response = self.session.post(f"{BASE_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                token = data["access_token"]
                self.tokens[user_type] = token
                self.log_result(f"Auth_{user_type}", True, f"Login successful")
                return True
            else:
                self.log_result(f"Auth_{user_type}", False, f"Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log_result(f"Auth_{user_type}", False, f"Login exception: {str(e)}")
            return False
    
    def get_auth_headers(self, user_type):
        """Get authorization headers for user type"""
        token = self.tokens.get(user_type)
        if not token:
            return {}
        return {"Authorization": f"Bearer {token}"}
    
    def test_radius_search(self):
        """Test radius search functionality"""
        print("\n=== Testing Radius Search ===")
        
        try:
            # Test 1: Paris with 500km radius - should return Paris and Lyon
            response = self.session.get(f"{BASE_URL}/listings?city=Paris&radius=500")
            if response.status_code == 200:
                listings_500km = response.json()
                cities_found = [listing.get("city", "").lower() for listing in listings_500km]
                
                if "paris" in cities_found and "lyon" in cities_found:
                    self.log_result("Radius_Search_500km", True, f"Found {len(listings_500km)} listings including Paris and Lyon")
                else:
                    self.log_result("Radius_Search_500km", False, f"Expected Paris and Lyon, found cities: {cities_found}")
            else:
                self.log_result("Radius_Search_500km", False, f"API error: {response.status_code}")
            
            # Test 2: Paris with 100km radius - should return only Paris
            response = self.session.get(f"{BASE_URL}/listings?city=Paris&radius=100")
            if response.status_code == 200:
                listings_100km = response.json()
                cities_found = [listing.get("city", "").lower() for listing in listings_100km]
                
                if "paris" in cities_found and "lyon" not in cities_found:
                    self.log_result("Radius_Search_100km", True, f"Found {len(listings_100km)} listings, only Paris (no Lyon)")
                else:
                    self.log_result("Radius_Search_100km", False, f"Expected only Paris, found cities: {cities_found}")
            else:
                self.log_result("Radius_Search_100km", False, f"API error: {response.status_code}")
                
        except Exception as e:
            self.log_result("Radius_Search", False, f"Exception: {str(e)}")
    
    def test_document_upload(self):
        """Test document upload functionality"""
        print("\n=== Testing Document Upload ===")
        
        if not self.authenticate_user("locataire"):
            return
        
        headers = self.get_auth_headers("locataire")
        
        try:
            # Create a test PDF file
            test_file_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n253\n%%EOF"
            
            # Test document upload
            files = {
                'file': ('test_cv.pdf', test_file_content, 'application/pdf')
            }
            
            response = self.session.post(f"{BASE_URL}/documents/upload", files=files, headers=headers)
            
            if response.status_code == 200:
                doc_data = response.json()
                doc_id = doc_data.get("id")
                self.log_result("Document_Upload", True, f"Document uploaded successfully, ID: {doc_id}")
                
                # Test get documents list
                response = self.session.get(f"{BASE_URL}/documents", headers=headers)
                if response.status_code == 200:
                    docs = response.json()
                    if len(docs) > 0:
                        self.log_result("Document_List", True, f"Retrieved {len(docs)} documents")
                        
                        # Test document deletion
                        if doc_id:
                            response = self.session.delete(f"{BASE_URL}/documents/{doc_id}", headers=headers)
                            if response.status_code == 200:
                                self.log_result("Document_Delete", True, "Document deleted successfully")
                            else:
                                self.log_result("Document_Delete", False, f"Delete failed: {response.status_code}")
                    else:
                        self.log_result("Document_List", False, "No documents found")
                else:
                    self.log_result("Document_List", False, f"List failed: {response.status_code}")
            else:
                self.log_result("Document_Upload", False, f"Upload failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_result("Document_Upload", False, f"Exception: {str(e)}")
    
    def test_application_system(self):
        """Test application/candidature system"""
        print("\n=== Testing Application System ===")
        
        # Authenticate both users
        if not self.authenticate_user("locataire") or not self.authenticate_user("proprietaire"):
            return
        
        tenant_headers = self.get_auth_headers("locataire")
        owner_headers = self.get_auth_headers("proprietaire")
        
        try:
            # First, get available listings to apply to
            response = self.session.get(f"{BASE_URL}/listings")
            if response.status_code != 200:
                self.log_result("Application_GetListings", False, f"Cannot get listings: {response.status_code}")
                return
            
            listings = response.json()
            if not listings:
                self.log_result("Application_System", False, "No listings available to apply to")
                return
            
            target_listing = listings[0]
            listing_id = target_listing.get("id")
            
            # Test: Create application
            app_data = {
                "listing_id": listing_id,
                "message": "Je suis très intéressé par cette opportunité. Mon profil correspond parfaitement à vos recherches."
            }
            
            response = self.session.post(f"{BASE_URL}/applications", json=app_data, headers=tenant_headers)
            
            if response.status_code == 200:
                app_info = response.json()
                app_id = app_info.get("id")
                self.log_result("Application_Create", True, f"Application created successfully, ID: {app_id}")
                
                # Test: Get tenant's applications
                response = self.session.get(f"{BASE_URL}/applications/mine", headers=tenant_headers)
                if response.status_code == 200:
                    my_apps = response.json()
                    if len(my_apps) > 0:
                        self.log_result("Application_GetMine", True, f"Retrieved {len(my_apps)} applications")
                    else:
                        self.log_result("Application_GetMine", False, "No applications found for tenant")
                else:
                    self.log_result("Application_GetMine", False, f"Failed to get applications: {response.status_code}")
                
                # Test: Get owner's received applications
                response = self.session.get(f"{BASE_URL}/applications/received", headers=owner_headers)
                if response.status_code == 200:
                    received_apps = response.json()
                    if len(received_apps) > 0:
                        self.log_result("Application_GetReceived", True, f"Owner received {len(received_apps)} applications")
                        
                        # Test: Update application status (accept)
                        if app_id:
                            response = self.session.put(f"{BASE_URL}/applications/{app_id}/status?status=accepted", headers=owner_headers)
                            if response.status_code == 200:
                                self.log_result("Application_Accept", True, "Application accepted successfully")
                            else:
                                self.log_result("Application_Accept", False, f"Accept failed: {response.status_code} - {response.text}")
                    else:
                        self.log_result("Application_GetReceived", False, "No applications received by owner")
                else:
                    self.log_result("Application_GetReceived", False, f"Failed to get received applications: {response.status_code}")
                    
            else:
                self.log_result("Application_Create", False, f"Create failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_result("Application_System", False, f"Exception: {str(e)}")
    
    def test_messaging_system(self):
        """Test messaging system"""
        print("\n=== Testing Messaging System ===")
        
        # Authenticate both users
        if not self.authenticate_user("locataire") or not self.authenticate_user("proprietaire"):
            return
        
        tenant_headers = self.get_auth_headers("locataire")
        owner_headers = self.get_auth_headers("proprietaire")
        
        try:
            # Get user IDs first
            tenant_response = self.session.get(f"{BASE_URL}/auth/me", headers=tenant_headers)
            owner_response = self.session.get(f"{BASE_URL}/auth/me", headers=owner_headers)
            
            if tenant_response.status_code != 200 or owner_response.status_code != 200:
                self.log_result("Messaging_GetUserInfo", False, "Cannot get user information")
                return
            
            tenant_info = tenant_response.json()
            owner_info = owner_response.json()
            
            tenant_id = tenant_info.get("id")
            owner_id = owner_info.get("id")
            
            # Test: Send message from tenant to owner
            message_data = {
                "receiver_id": owner_id,
                "content": "Bonjour, je suis intéressé par votre cabinet médical. Pouvez-vous me donner plus d'informations ?",
                "listing_id": None
            }
            
            response = self.session.post(f"{BASE_URL}/messages", json=message_data, headers=tenant_headers)
            
            if response.status_code == 200:
                msg_info = response.json()
                self.log_result("Message_Send", True, f"Message sent successfully")
                
                # Test: Get conversations for owner
                response = self.session.get(f"{BASE_URL}/messages/conversations", headers=owner_headers)
                if response.status_code == 200:
                    conversations = response.json()
                    if len(conversations) > 0:
                        self.log_result("Message_GetConversations", True, f"Retrieved {len(conversations)} conversations")
                        
                        # Test: Get specific conversation messages
                        response = self.session.get(f"{BASE_URL}/messages/conversation/{tenant_id}", headers=owner_headers)
                        if response.status_code == 200:
                            messages = response.json()
                            if len(messages) > 0:
                                self.log_result("Message_GetConversation", True, f"Retrieved {len(messages)} messages in conversation")
                            else:
                                self.log_result("Message_GetConversation", False, "No messages in conversation")
                        else:
                            self.log_result("Message_GetConversation", False, f"Failed to get conversation: {response.status_code}")
                    else:
                        self.log_result("Message_GetConversations", False, "No conversations found")
                else:
                    self.log_result("Message_GetConversations", False, f"Failed to get conversations: {response.status_code}")
                
                # Test: Get unread count
                response = self.session.get(f"{BASE_URL}/messages/unread-count", headers=owner_headers)
                if response.status_code == 200:
                    unread_data = response.json()
                    unread_count = unread_data.get("unread_count", 0)
                    self.log_result("Message_UnreadCount", True, f"Unread count: {unread_count}")
                else:
                    self.log_result("Message_UnreadCount", False, f"Failed to get unread count: {response.status_code}")
                    
            else:
                self.log_result("Message_Send", False, f"Send failed: {response.status_code} - {response.text}")
                
        except Exception as e:
            self.log_result("Messaging_System", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print(f"Starting CabLib Backend API Tests")
        print(f"Base URL: {BASE_URL}")
        print("="*50)
        
        # Test authentication first
        self.authenticate_user("proprietaire")
        self.authenticate_user("locataire")
        
        # Run all test suites
        self.test_radius_search()
        self.test_document_upload()
        self.test_application_system()
        self.test_messaging_system()
        
        # Summary
        print("\n" + "="*50)
        print("TEST SUMMARY")
        print("="*50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result["success"])
        failed_tests = total_tests - passed_tests
        
        for test_name, result in self.test_results.items():
            status = "PASS" if result["success"] else "FAIL"
            print(f"[{status}] {test_name}")
        
        print(f"\nTotal: {total_tests}, Passed: {passed_tests}, Failed: {failed_tests}")
        
        if failed_tests > 0:
            print("\nFAILED TESTS DETAILS:")
            for test_name, result in self.test_results.items():
                if not result["success"]:
                    print(f"- {test_name}: {result['message']}")
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = CabLibTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)