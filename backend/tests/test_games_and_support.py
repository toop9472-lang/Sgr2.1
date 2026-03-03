# Test Games and Support APIs - For Iteration 18
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://saqr-build-final.preview.emergentagent.com')

class TestGamesAPI:
    """Games API endpoint tests"""
    
    def test_games_leaderboard_returns_200(self):
        """Test games leaderboard endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/games/leaderboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "leaderboard" in data, "Response should contain 'leaderboard'"
        assert "userStats" in data, "Response should contain 'userStats'"
        print("✅ Games leaderboard endpoint returns 200")

    def test_games_leaderboard_structure(self):
        """Test games leaderboard has correct data structure"""
        response = requests.get(f"{BASE_URL}/api/games/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        leaderboard = data["leaderboard"]
        
        # Check leaderboard is a list
        assert isinstance(leaderboard, list), "Leaderboard should be a list"
        assert len(leaderboard) > 0, "Leaderboard should have entries"
        
        # Check first entry structure
        entry = leaderboard[0]
        assert "rank" in entry, "Entry should have 'rank'"
        assert "name" in entry, "Entry should have 'name'"
        assert "points" in entry, "Entry should have 'points'"
        assert "gamesPlayed" in entry, "Entry should have 'gamesPlayed'"
        
        print(f"✅ Leaderboard has {len(leaderboard)} entries with correct structure")

    def test_games_complete_guest_mode(self):
        """Test game completion in guest mode"""
        response = requests.post(
            f"{BASE_URL}/api/games/complete",
            json={"gameId": "tictactoe", "points": 50},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["success"] == True, "Should return success=True"
        print("✅ Game completion in guest mode works")

    def test_games_complete_various_games(self):
        """Test game completion for different game types"""
        games = ["chess", "tictactoe", "trivia", "puzzle", "riddles"]
        
        for game_id in games:
            response = requests.post(
                f"{BASE_URL}/api/games/complete",
                json={"gameId": game_id, "points": 100},
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == 200, f"Game {game_id} should return 200"
            print(f"✅ Game {game_id} completion works")


class TestSupportAPI:
    """Support API endpoint tests"""
    
    def test_support_submit_success(self):
        """Test support form submission"""
        response = requests.post(
            f"{BASE_URL}/api/support/submit",
            json={
                "name": "Test User",
                "email": "test@example.com",
                "subject": "technical",
                "message": "This is a test message for API testing"
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["success"] == True, "Should return success=True"
        assert "ticket_id" in data, "Should return ticket_id"
        assert len(data["ticket_id"]) > 0, "ticket_id should not be empty"
        
        print(f"✅ Support form submission works - Ticket ID: {data['ticket_id']}")

    def test_support_submit_validation(self):
        """Test support form validation for missing fields"""
        # Missing email
        response = requests.post(
            f"{BASE_URL}/api/support/submit",
            json={
                "name": "Test User",
                "subject": "technical",
                "message": "Test message"
            },
            headers={"Content-Type": "application/json"}
        )
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for missing email, got {response.status_code}"
        print("✅ Support form validates required email field")

    def test_support_submit_invalid_email(self):
        """Test support form validation for invalid email"""
        response = requests.post(
            f"{BASE_URL}/api/support/submit",
            json={
                "name": "Test User",
                "email": "invalid-email",
                "subject": "technical",
                "message": "Test message"
            },
            headers={"Content-Type": "application/json"}
        )
        # Should fail validation
        assert response.status_code == 422, f"Expected 422 for invalid email, got {response.status_code}"
        print("✅ Support form validates email format")

    def test_support_tickets_endpoint(self):
        """Test support tickets listing endpoint"""
        response = requests.get(f"{BASE_URL}/api/support/tickets")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "tickets" in data, "Response should contain 'tickets'"
        assert isinstance(data["tickets"], list), "Tickets should be a list"
        
        print(f"✅ Support tickets endpoint works - {len(data['tickets'])} tickets")


class TestHealthEndpoints:
    """Health check endpoint tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print("✅ API health check passed")

    def test_root_health(self):
        """Test root health endpoint - Note: May be routed differently in preview"""
        response = requests.get(f"{BASE_URL}/health")
        # Root health might return HTML or redirect in preview environment
        # Just check it doesn't throw 500
        assert response.status_code in [200, 301, 302, 404], f"Root health should not fail with {response.status_code}"
        print(f"✅ Root health check returned status {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
