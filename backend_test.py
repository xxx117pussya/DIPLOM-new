import requests
import sys
import json
from datetime import datetime

class MagicGardenAPITester:
    def __init__(self, base_url="https://quick-file-share-5.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.child_id = None
        self.psychologist_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test the root API endpoint"""
        return self.run_test(
            "Root API Endpoint",
            "GET",
            "api/",
            200
        )

    def test_child_registration(self):
        """Test child registration"""
        test_data = {
            "first_name": "Тестовый",
            "last_name": "Ребёнок",
            "middle_name": "Иванович"
        }
        
        success, response = self.run_test(
            "Child Registration",
            "POST",
            "api/child/register",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.child_id = response['id']
            print(f"   Child ID saved: {self.child_id}")
        
        return success

    def test_psychologist_registration(self):
        """Test psychologist registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        test_data = {
            "login": f"test_psych_{timestamp}",
            "password": "TestPassword123!",
            "name": "Тестовый Психолог"
        }
        
        success, response = self.run_test(
            "Psychologist Registration",
            "POST",
            "api/psychologist/register",
            200,
            data=test_data
        )
        
        if success:
            # Store credentials for login test
            self.psych_login = test_data["login"]
            self.psych_password = test_data["password"]
        
        return success

    def test_psychologist_login(self):
        """Test psychologist login"""
        if not hasattr(self, 'psych_login'):
            print("❌ Skipping login test - no registration credentials available")
            return False
            
        test_data = {
            "login": self.psych_login,
            "password": self.psych_password
        }
        
        success, response = self.run_test(
            "Psychologist Login",
            "POST",
            "api/psychologist/login",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token saved for authenticated requests")
        
        return success

    def test_game_result_saving(self):
        """Test game result saving"""
        if not self.child_id:
            print("❌ Skipping game result test - no child ID available")
            return False
            
        test_data = {
            "child_id": self.child_id,
            "game_type": "shapes",
            "score": 85,
            "max_score": 100,
            "level": "high",
            "details": {"time_taken": 120, "mistakes": 2}
        }
        
        return self.run_test(
            "Game Result Saving",
            "POST",
            "api/game/result",
            200,
            data=test_data
        )[0]

    def test_get_children(self):
        """Test getting children list"""
        return self.run_test(
            "Get Children List",
            "GET",
            "api/children",
            200
        )[0]

    def test_get_statistics(self):
        """Test getting statistics (requires auth)"""
        if not self.token:
            print("❌ Skipping statistics test - no auth token available")
            return False
            
        return self.run_test(
            "Get Statistics",
            "GET",
            "api/statistics",
            200
        )[0]

def main():
    print("🚀 Starting Magic Garden API Tests")
    print("=" * 50)
    
    # Setup
    tester = MagicGardenAPITester()
    
    # Run tests in order
    tests = [
        ("Root API Endpoint", tester.test_root_endpoint),
        ("Child Registration", tester.test_child_registration),
        ("Psychologist Registration", tester.test_psychologist_registration),
        ("Psychologist Login", tester.test_psychologist_login),
        ("Game Result Saving", tester.test_game_result_saving),
        ("Get Children List", tester.test_get_children),
        ("Get Statistics", tester.test_get_statistics),
    ]
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())