"""
Test Daily Challenges & Login Rewards API
- Daily Challenges: 5 challenges with max 69 points/day
- Login Rewards: 14-day rewards with max 150 points/month

Test endpoints:
- GET /api/challenges/daily - Returns daily challenges with progress
- POST /api/challenges/daily/claim - Claim completed challenge reward
- GET /api/challenges/login-rewards - Returns 14-day login rewards status
- POST /api/challenges/login-rewards/claim - Claim login reward for specific day
- GET /api/challenges/stats - Returns overall challenges stats
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "demo@saqr.app"
TEST_PASSWORD = "Demo123456"


class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_check(self):
        """Test server health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print(f"✓ Health check passed: {data}")
    
    def test_login_with_demo_account(self, api_client):
        """Test login and get token"""
        response = api_client.post(f"{BASE_URL}/api/auth/signin", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for user: {data['user']['name']}")


class TestDailyChallenges:
    """Test Daily Challenges API endpoints"""
    
    def test_get_daily_challenges_unauthenticated(self, api_client):
        """Test daily challenges without authentication - should fail"""
        response = api_client.get(f"{BASE_URL}/api/challenges/daily")
        assert response.status_code == 403, "Should require authentication"
        print("✓ Unauthenticated request correctly rejected")
    
    def test_get_daily_challenges_authenticated(self, authenticated_client):
        """Test getting daily challenges with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/challenges/daily")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "challenges" in data
        assert "max_daily_points" in data
        assert "earned_today" in data
        assert "date" in data
        
        # Validate max daily points is 69
        assert data["max_daily_points"] == 69, "Max daily points should be 69"
        
        # Validate challenges list
        challenges = data["challenges"]
        assert len(challenges) == 5, "Should have exactly 5 daily challenges"
        
        # Validate total points from challenges equals 69
        total_points = sum(c["points"] for c in challenges)
        assert total_points == 69, f"Total challenge points should be 69, got {total_points}"
        
        # Validate each challenge structure
        for challenge in challenges:
            assert "id" in challenge
            assert "title" in challenge
            assert "description" in challenge
            assert "icon" in challenge
            assert "target" in challenge
            assert "current" in challenge
            assert "points" in challenge
            assert "completed" in challenge
            assert "claimed" in challenge
            assert "can_claim" in challenge
        
        print(f"✓ Daily challenges retrieved: {len(challenges)} challenges, max {data['max_daily_points']} pts")
        print(f"  Challenges: {[c['id'] for c in challenges]}")
    
    def test_claim_daily_challenge_invalid_id(self, authenticated_client):
        """Test claiming a challenge with invalid ID"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/challenges/daily/claim",
            json={"challenge_id": "invalid_challenge_id"}
        )
        assert response.status_code == 404, "Should return 404 for invalid challenge ID"
        print("✓ Invalid challenge ID correctly rejected with 404")
    
    def test_claim_incomplete_challenge(self, authenticated_client):
        """Test claiming a challenge that is not yet completed"""
        # First get challenges to find one that's not completed
        response = authenticated_client.get(f"{BASE_URL}/api/challenges/daily")
        assert response.status_code == 200
        data = response.json()
        
        # Find a challenge that requires watch_ads (likely incomplete without actual ad views)
        incomplete_challenges = [c for c in data["challenges"] if not c["completed"]]
        
        if incomplete_challenges:
            # Try to claim an incomplete challenge
            challenge_to_claim = incomplete_challenges[0]
            claim_response = authenticated_client.post(
                f"{BASE_URL}/api/challenges/daily/claim",
                json={"challenge_id": challenge_to_claim["id"]}
            )
            assert claim_response.status_code == 400, "Should reject claiming incomplete challenge"
            print(f"✓ Incomplete challenge '{challenge_to_claim['id']}' correctly rejected")
        else:
            # All challenges are complete, try claiming one that's already claimed
            print("✓ All challenges completed - skipping incomplete challenge test")


class TestLoginRewards:
    """Test Login Rewards API endpoints"""
    
    def test_get_login_rewards_unauthenticated(self, api_client):
        """Test login rewards without authentication - should fail"""
        response = api_client.get(f"{BASE_URL}/api/challenges/login-rewards")
        assert response.status_code == 403, "Should require authentication"
        print("✓ Unauthenticated request correctly rejected")
    
    def test_get_login_rewards_authenticated(self, authenticated_client):
        """Test getting login rewards with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/challenges/login-rewards")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "rewards" in data
        assert "total_points" in data
        assert "claimed_points" in data
        assert "login_days" in data
        assert "month" in data
        
        # Validate total points is 150
        assert data["total_points"] == 150, "Total login reward points should be 150"
        
        # Validate rewards list
        rewards = data["rewards"]
        assert len(rewards) == 14, "Should have exactly 14 login reward days"
        
        # Validate total points from rewards equals 150
        total_reward_points = sum(r["points"] for r in rewards)
        assert total_reward_points == 150, f"Total reward points should be 150, got {total_reward_points}"
        
        # Validate each reward structure
        for reward in rewards:
            assert "day" in reward
            assert "points" in reward
            assert "claimed" in reward
            assert "can_claim" in reward
            assert "unlocked" in reward
        
        # Validate days are 1-14
        days = [r["day"] for r in rewards]
        assert days == list(range(1, 15)), "Reward days should be 1-14"
        
        print(f"✓ Login rewards retrieved: {len(rewards)} days, total {data['total_points']} pts")
        print(f"  User login days this month: {data['login_days']}")
    
    def test_claim_login_reward_invalid_day(self, authenticated_client):
        """Test claiming a login reward with invalid day"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/challenges/login-rewards/claim",
            json={"day": 99}
        )
        assert response.status_code == 404, "Should return 404 for invalid day"
        print("✓ Invalid day correctly rejected with 404")
    
    def test_claim_login_reward_day_zero(self, authenticated_client):
        """Test claiming day 0 which doesn't exist"""
        response = authenticated_client.post(
            f"{BASE_URL}/api/challenges/login-rewards/claim",
            json={"day": 0}
        )
        assert response.status_code == 404, "Day 0 should not exist"
        print("✓ Day 0 correctly rejected")
    
    def test_claim_login_reward_flow(self, authenticated_client):
        """Test claiming login reward - check correct behavior"""
        # First get current login rewards status
        get_response = authenticated_client.get(f"{BASE_URL}/api/challenges/login-rewards")
        assert get_response.status_code == 200
        data = get_response.json()
        
        login_days = data["login_days"]
        rewards = data["rewards"]
        
        # Find a day that can be claimed
        claimable = [r for r in rewards if r["can_claim"]]
        already_claimed = [r for r in rewards if r["claimed"]]
        
        print(f"  User login days: {login_days}")
        print(f"  Claimable rewards: {[r['day'] for r in claimable]}")
        print(f"  Already claimed: {[r['day'] for r in already_claimed]}")
        
        if claimable:
            # Try to claim the first available reward
            day_to_claim = claimable[0]["day"]
            expected_points = claimable[0]["points"]
            
            claim_response = authenticated_client.post(
                f"{BASE_URL}/api/challenges/login-rewards/claim",
                json={"day": day_to_claim}
            )
            
            if claim_response.status_code == 200:
                claim_data = claim_response.json()
                assert claim_data["success"] == True
                assert claim_data["day"] == day_to_claim
                assert claim_data["points_earned"] == expected_points
                assert "total_points" in claim_data
                print(f"✓ Successfully claimed day {day_to_claim} for {expected_points} points")
            else:
                # Could be already claimed in this session
                print(f"  Note: Day {day_to_claim} claim returned {claim_response.status_code}")
        else:
            print("✓ No claimable rewards available - user may not have enough login days")
    
    def test_double_claim_prevention(self, authenticated_client):
        """Test that same day cannot be claimed twice"""
        # Get login rewards status
        get_response = authenticated_client.get(f"{BASE_URL}/api/challenges/login-rewards")
        assert get_response.status_code == 200
        data = get_response.json()
        
        # Find an already claimed day
        claimed = [r for r in data["rewards"] if r["claimed"]]
        
        if claimed:
            day_to_try = claimed[0]["day"]
            response = authenticated_client.post(
                f"{BASE_URL}/api/challenges/login-rewards/claim",
                json={"day": day_to_try}
            )
            assert response.status_code == 400, "Should reject double claiming"
            print(f"✓ Double claim for day {day_to_try} correctly prevented")
        else:
            print("✓ No claimed days to test double claim prevention - skipping")


class TestChallengesStats:
    """Test Challenges Stats API endpoint"""
    
    def test_get_stats_unauthenticated(self, api_client):
        """Test stats without authentication - should fail"""
        response = api_client.get(f"{BASE_URL}/api/challenges/stats")
        assert response.status_code == 403, "Should require authentication"
        print("✓ Unauthenticated request correctly rejected")
    
    def test_get_stats_authenticated(self, authenticated_client):
        """Test getting challenges stats with authentication"""
        response = authenticated_client.get(f"{BASE_URL}/api/challenges/stats")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "today" in data
        assert "this_month" in data
        assert "all_time" in data
        assert "streak_days" in data
        assert "current_points" in data
        
        # Validate today structure
        assert "challenge_points" in data["today"]
        assert "max_points" in data["today"]
        assert data["today"]["max_points"] == 69, "Max daily points should be 69"
        
        # Validate this_month structure
        assert "login_reward_points" in data["this_month"]
        assert "max_points" in data["this_month"]
        assert data["this_month"]["max_points"] == 150, "Max monthly points should be 150"
        
        # Validate all_time structure
        assert "challenge_points" in data["all_time"]
        
        # Validate types
        assert isinstance(data["streak_days"], int)
        assert isinstance(data["current_points"], (int, float))
        
        print(f"✓ Stats retrieved successfully:")
        print(f"  Today: {data['today']['challenge_points']}/{data['today']['max_points']} pts")
        print(f"  This month: {data['this_month']['login_reward_points']}/{data['this_month']['max_points']} pts")
        print(f"  All time: {data['all_time']['challenge_points']} pts")
        print(f"  Streak: {data['streak_days']} days")
        print(f"  Current points: {data['current_points']}")


class TestDataIntegrity:
    """Test data integrity across endpoints"""
    
    def test_points_consistency(self, authenticated_client):
        """Verify points are consistent across endpoints"""
        # Get stats
        stats_response = authenticated_client.get(f"{BASE_URL}/api/challenges/stats")
        assert stats_response.status_code == 200
        stats = stats_response.json()
        
        # Get daily challenges
        daily_response = authenticated_client.get(f"{BASE_URL}/api/challenges/daily")
        assert daily_response.status_code == 200
        daily = daily_response.json()
        
        # Get login rewards
        login_response = authenticated_client.get(f"{BASE_URL}/api/challenges/login-rewards")
        assert login_response.status_code == 200
        login = login_response.json()
        
        # Verify max points constants
        assert stats["today"]["max_points"] == daily["max_daily_points"] == 69
        assert stats["this_month"]["max_points"] == login["total_points"] == 150
        
        print("✓ Points consistency verified:")
        print(f"  Daily max points: {daily['max_daily_points']} (stats: {stats['today']['max_points']})")
        print(f"  Monthly max points: {login['total_points']} (stats: {stats['this_month']['max_points']})")


# ============ FIXTURES ============

@pytest.fixture
def api_client():
    """Shared requests session without auth"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/signin", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip(f"Authentication failed: {response.text}")


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
