# Test Diamond Shop and Payment APIs
# Tests: /api/diamond-payments/packages, /api/diamond-payments/checkout/create, /api/game/online-players
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://saqr-build-final.preview.emergentagent.com')

class TestHealthCheck:
    """Health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print(f"PASS: API health check - status: {data.get('status')}")


class TestDiamondPackages:
    """Tests for diamond packages API"""
    
    def test_get_packages(self):
        """Test /api/diamond-payments/packages returns 4 packages"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/packages")
        assert response.status_code == 200
        data = response.json()
        
        # Verify packages exist
        assert 'packages' in data
        packages = data['packages']
        
        # Should have 4 packages
        assert len(packages) == 4, f"Expected 4 packages, got {len(packages)}"
        print(f"PASS: Found {len(packages)} diamond packages")
        
        # Verify package IDs
        package_ids = [p['id'] for p in packages]
        expected_ids = ['starter', 'silver', 'gold', 'platinum']
        for expected in expected_ids:
            assert expected in package_ids, f"Missing package: {expected}"
        print(f"PASS: All package IDs present: {package_ids}")
        
        # Verify diamonds amounts (100, 275, 575, 1200 total)
        total_diamonds = [p['total_diamonds'] for p in packages]
        assert 100 in total_diamonds, "100 diamond package missing"
        assert 275 in total_diamonds, "275 diamond package missing"
        assert 575 in total_diamonds, "575 diamond package missing"
        assert 1200 in total_diamonds, "1200 diamond package missing"
        print(f"PASS: Diamond amounts correct: {total_diamonds}")
        
    def test_package_structure(self):
        """Test each package has required fields"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/packages")
        data = response.json()
        
        required_fields = ['id', 'name', 'diamonds', 'bonus', 'total_diamonds', 'price_sar', 'price_usd']
        for package in data['packages']:
            for field in required_fields:
                assert field in package, f"Package {package.get('id')} missing field: {field}"
        print("PASS: All packages have required fields")


class TestCheckoutCreate:
    """Tests for checkout session creation"""
    
    def test_create_checkout_session(self):
        """Test /api/diamond-payments/checkout/create"""
        payload = {
            "user_id": "test_user_pytest",
            "package_id": "starter",
            "origin_url": BASE_URL
        }
        response = requests.post(
            f"{BASE_URL}/api/diamond-payments/checkout/create",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data.get('success') == True, "Checkout session creation failed"
        assert 'checkout_url' in data, "Missing checkout_url"
        assert 'session_id' in data, "Missing session_id"
        assert 'package' in data, "Missing package info"
        
        # Verify Stripe checkout URL
        assert 'stripe.com' in data['checkout_url'], "Invalid checkout URL"
        print(f"PASS: Checkout session created - session_id: {data['session_id'][:20]}...")
        
    def test_create_checkout_invalid_package(self):
        """Test checkout with invalid package ID"""
        payload = {
            "user_id": "test_user_pytest",
            "package_id": "invalid_package",
            "origin_url": BASE_URL
        }
        response = requests.post(
            f"{BASE_URL}/api/diamond-payments/checkout/create",
            json=payload
        )
        # Should return 400 for invalid package
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("PASS: Invalid package returns 400 error")


class TestWebSocketEndpoint:
    """Tests for WebSocket-related endpoints"""
    
    def test_online_players_endpoint(self):
        """Test /api/game/online-players returns valid data"""
        response = requests.get(f"{BASE_URL}/api/game/online-players")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert 'waiting' in data
        assert 'playing' in data
        assert 'total' in data
        assert 'rooms' in data
        
        # Values should be integers
        assert isinstance(data['waiting'], int)
        assert isinstance(data['playing'], int)
        assert isinstance(data['total'], int)
        assert isinstance(data['rooms'], int)
        
        print(f"PASS: Online players - waiting: {data['waiting']}, playing: {data['playing']}, total: {data['total']}")


class TestEconomyEndpoints:
    """Tests for economy system endpoints"""
    
    def test_leaderboard(self):
        """Test /api/economy/leaderboard"""
        response = requests.get(f"{BASE_URL}/api/economy/leaderboard")
        assert response.status_code == 200
        data = response.json()
        
        assert 'leaderboard' in data
        print(f"PASS: Leaderboard returned {len(data.get('leaderboard', []))} entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
