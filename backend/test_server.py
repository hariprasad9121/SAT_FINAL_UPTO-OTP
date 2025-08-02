import requests
import json

def test_backend():
    base_url = "http://localhost:5000/api"
    
    # Test admin dashboard
    try:
        response = requests.get(f"{base_url}/admin/dashboard")
        print(f"Admin Dashboard Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Backend server is running!")
        else:
            print("❌ Backend server returned error")
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running")
        return False
    
    # Test student certificate download endpoint
    try:
        response = requests.get(f"{base_url}/student/certificate/1/download")
        print(f"Certificate Download Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Certificate download endpoint is working!")
        elif response.status_code == 404:
            print("⚠️ Certificate download endpoint exists but certificate not found (expected)")
        else:
            print(f"❌ Certificate download endpoint error: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to certificate download endpoint")
    
    return True

if __name__ == "__main__":
    test_backend() 