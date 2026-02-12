import requests
import sys
from datetime import datetime
import json

class CabLibTester:
    def __init__(self, base_url="https://office-match-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_data = None
        self.test_listing_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error details: {error_detail}")
                except:
                    print(f"   Response text: {response.text}")

            return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register_user(self, user_type="locataire"):
        """Test user registration with RPPS validation"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test_{user_type}_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "Jean",
            "last_name": "Dupont",
            "rpps_number": "12345678901",  # 11 digits
            "profession": "Médecin généraliste",
            "user_type": user_type
        }
        
        success, response = self.run_test(
            f"Register {user_type}",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_data = response['user']
            print(f"   Registered user: {self.user_data['email']}")
            return True
        return False

    def test_register_invalid_rpps(self):
        """Test registration with invalid RPPS number"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"invalid_{timestamp}@test.com",
            "password": "TestPass123!",
            "first_name": "Jean",
            "last_name": "Dupont",
            "rpps_number": "123456789",  # Only 9 digits - should fail
            "profession": "Médecin généraliste",
            "user_type": "locataire"
        }
        
        success, response = self.run_test(
            "Register with invalid RPPS",
            "POST",
            "auth/register",
            400,  # Should fail with 400
            data=test_data
        )
        return success

    def test_login(self, email=None, password=None):
        """Test user login"""
        if not email and self.user_data:
            email = self.user_data['email']
        if not password:
            password = "TestPass123!"
            
        success, response = self.run_test(
            "Login",
            "POST",
            "auth/login",
            200,
            data={"email": email, "password": password}
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            return True
        return False

    def test_get_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get current user",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_listing(self):
        """Test creating a listing (proprietaire only)"""
        if not self.user_data or self.user_data['user_type'] != 'proprietaire':
            print("⚠️  Skipping create listing - user not proprietaire")
            return False
            
        test_data = {
            "title": "Test Cabinet Médical",
            "city": "Paris",
            "address": "15 rue de la Santé",
            "structure_type": "Cabinet",
            "size": 50,
            "monthly_rent": 1500,
            "description": "Beau cabinet médical en centre-ville",
            "photos": ["https://images.unsplash.com/photo-1497366216548-37526070297c?w=800"],
            "professionals_present": ["Médecin généraliste"],
            "profiles_searched": ["Kinésithérapeute"],
            "is_featured": False
        }
        
        success, response = self.run_test(
            "Create listing",
            "POST",
            "listings",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.test_listing_id = response['id']
            print(f"   Created listing with ID: {self.test_listing_id}")
            return True
        return False

    def test_get_listings(self):
        """Test getting listings with various filters"""
        # Test without filters
        success1, response1 = self.run_test(
            "Get all listings",
            "GET",
            "listings",
            200
        )
        
        # Test with city filter
        success2, response2 = self.run_test(
            "Get listings by city",
            "GET",
            "listings?city=Paris",
            200
        )
        
        # Test with structure type filter
        success3, response3 = self.run_test(
            "Get listings by structure type",
            "GET",
            "listings?structure_type=Cabinet",
            200
        )
        
        return success1 and success2 and success3

    def test_get_listing_detail(self):
        """Test getting a specific listing"""
        if not self.test_listing_id:
            print("⚠️  Skipping get listing detail - no test listing ID")
            return False
            
        success, response = self.run_test(
            "Get listing detail",
            "GET",
            f"listings/{self.test_listing_id}",
            200
        )
        return success

    def test_favorites(self):
        """Test favorites functionality"""
        if not self.test_listing_id:
            print("⚠️  Skipping favorites test - no test listing ID")
            return False
            
        # Add to favorites
        success1, response1 = self.run_test(
            "Add favorite",
            "POST",
            "favorites",
            200,
            data={"listing_id": self.test_listing_id}
        )
        
        # Get favorites
        success2, response2 = self.run_test(
            "Get favorites",
            "GET",
            "favorites",
            200
        )
        
        # Remove from favorites
        success3, response3 = self.run_test(
            "Remove favorite",
            "DELETE",
            f"favorites/{self.test_listing_id}",
            200
        )
        
        return success1 and success2 and success3

    def test_unauthorized_actions(self):
        """Test actions that should require authentication"""
        old_token = self.token
        self.token = None  # Remove token temporarily
        
        # Should fail without auth
        success1, _ = self.run_test(
            "Create listing without auth",
            "POST",
            "listings",
            401,  # Should get 401 Unauthorized
            data={"title": "Test", "city": "Test"}
        )
        
        # Should fail without auth
        success2, _ = self.run_test(
            "Get favorites without auth",
            "GET",
            "favorites",
            401  # Should get 401 Unauthorized
        )
        
        self.token = old_token  # Restore token
        return success1 and success2

def main():
    print("🏥 Starting CabLib API Testing...")
    tester = CabLibTester()
    
    # Test user registration and auth
    print("\n📋 Testing Authentication...")
    if not tester.test_register_user("proprietaire"):
        print("❌ Registration failed, stopping tests")
        return 1
    
    if not tester.test_register_invalid_rpps():
        print("❌ RPPS validation failed")
    
    if not tester.test_login():
        print("❌ Login failed")
        return 1
        
    if not tester.test_get_me():
        print("❌ Get current user failed")
    
    # Test listings functionality
    print("\n🏢 Testing Listings...")
    tester.test_create_listing()
    
    if not tester.test_get_listings():
        print("❌ Get listings failed")
    
    tester.test_get_listing_detail()
    
    # Test favorites (requires locataire user)
    print("\n❤️  Testing Favorites...")
    # Create a locataire user for favorites test
    original_token = tester.token
    original_user = tester.user_data
    
    if tester.test_register_user("locataire"):
        tester.test_favorites()
    
    # Restore proprietaire user
    tester.token = original_token
    tester.user_data = original_user
    
    # Test authorization
    print("\n🔒 Testing Authorization...")
    tester.test_unauthorized_actions()
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"   Tests run: {tester.tests_run}")
    print(f"   Tests passed: {tester.tests_passed}")
    print(f"   Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())