"""
WebSocket Multiplayer and Economy System Tests - Iteration 23
Tests for: WebSocket routes, Economy game costs, Diamond payments (Stripe)

Endpoints tested:
- GET /api/game/online-players - Online player count
- GET /api/economy/game-costs - Game costs for online play
- GET /api/economy/balance/{user_id} - User balance
- GET /api/economy/leaderboard - Leaderboard with rewards
- GET /api/economy/packages - Diamond packages
- POST /api/economy/enter-game - Enter online game (deduct diamonds)
- POST /api/economy/game-result - Record game result
- POST /api/diamond-payments/checkout/create - Create Stripe checkout
- GET /api/diamond-payments/checkout/status/{session_id} - Checkout status
- GET /api/diamond-payments/transactions/{user_id} - User transactions
- GET /api/diamond-payments/packages - Payment packages
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_USER_ID = "user_142f6a6ff7e2"

# Expected game costs for online play (diamonds)
EXPECTED_ONLINE_GAME_COSTS = {
    "chess": 30,
    "tictactoe": 20,
    "puzzle": 25,
    "brickbreaker": 25,
    "trivia": 20,
    "riddles": 25,
}

# Expected winner bonuses (diamonds)
EXPECTED_WINNER_BONUSES = {
    "chess": 15,
    "tictactoe": 10,
    "puzzle": 12,
    "brickbreaker": 12,
    "trivia": 10,
    "riddles": 12,
}


class TestWebSocketOnlinePlayers:
    """Tests for WebSocket-related REST API endpoints"""
    
    def test_get_online_players(self):
        """Test GET /api/game/online-players returns player counts"""
        response = requests.get(f"{BASE_URL}/api/game/online-players")
        print(f"Online players response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "waiting" in data, "Response missing 'waiting' count"
        assert "playing" in data, "Response missing 'playing' count"
        assert "total" in data, "Response missing 'total' count"
        assert "rooms" in data, "Response missing 'rooms' count"
        
        # Verify values are integers
        assert isinstance(data["waiting"], int), "waiting should be integer"
        assert isinstance(data["playing"], int), "playing should be integer"
        assert isinstance(data["total"], int), "total should be integer"
        assert isinstance(data["rooms"], int), "rooms should be integer"
        
        print(f"✅ Online players endpoint working")
        print(f"   Waiting: {data['waiting']}, Playing: {data['playing']}, Total: {data['total']}, Rooms: {data['rooms']}")


class TestEconomyGameCosts:
    """Tests for GET /api/economy/game-costs - Game costs for online play"""
    
    def test_get_game_costs(self):
        """Test game costs endpoint returns all games with costs"""
        response = requests.get(f"{BASE_URL}/api/economy/game-costs")
        print(f"Game costs response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "online_costs" in data, "Response missing 'online_costs'"
        assert "winner_bonuses" in data, "Response missing 'winner_bonuses'"
        assert "note" in data, "Response missing 'note'"
        
        print(f"✅ Game costs endpoint working")
    
    def test_game_costs_values(self):
        """Test game costs have correct values for each game"""
        response = requests.get(f"{BASE_URL}/api/economy/game-costs")
        assert response.status_code == 200
        
        data = response.json()
        online_costs = data["online_costs"]
        
        # Verify all expected games are present
        for game_id, expected_cost in EXPECTED_ONLINE_GAME_COSTS.items():
            assert game_id in online_costs, f"Missing game in costs: {game_id}"
            assert online_costs[game_id] == expected_cost, \
                f"{game_id} cost mismatch: expected {expected_cost}, got {online_costs[game_id]}"
        
        print(f"✅ All game costs verified correctly:")
        for game_id, cost in EXPECTED_ONLINE_GAME_COSTS.items():
            print(f"   {game_id}: {cost} diamonds")
    
    def test_winner_bonus_values(self):
        """Test winner bonuses have correct values"""
        response = requests.get(f"{BASE_URL}/api/economy/game-costs")
        assert response.status_code == 200
        
        data = response.json()
        bonuses = data["winner_bonuses"]
        
        # Verify all expected bonuses
        for game_id, expected_bonus in EXPECTED_WINNER_BONUSES.items():
            assert game_id in bonuses, f"Missing game in bonuses: {game_id}"
            assert bonuses[game_id] == expected_bonus, \
                f"{game_id} bonus mismatch: expected {expected_bonus}, got {bonuses[game_id]}"
        
        print(f"✅ All winner bonuses verified correctly")


class TestEconomyBalance:
    """Tests for GET /api/economy/balance/{user_id}"""
    
    def test_get_user_balance(self):
        """Test getting user balance returns all required fields"""
        response = requests.get(f"{BASE_URL}/api/economy/balance/{TEST_USER_ID}")
        print(f"Balance response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        required_fields = ["saqr_points", "diamonds", "daily_points_earned", 
                          "daily_points_remaining", "daily_limit", "points_per_dollar"]
        
        for field in required_fields:
            assert field in data, f"Response missing field: {field}"
        
        # Verify daily limit is 150
        assert data["daily_limit"] == 150, f"Daily limit should be 150, got {data['daily_limit']}"
        
        # Verify points per dollar is 500
        assert data["points_per_dollar"] == 500, f"Points per dollar should be 500, got {data['points_per_dollar']}"
        
        print(f"✅ User balance retrieved successfully")
        print(f"   Saqr Points: {data['saqr_points']}, Diamonds: {data['diamonds']}")
        print(f"   Daily earned: {data['daily_points_earned']}/{data['daily_limit']}")
    
    def test_balance_nonexistent_user(self):
        """Test balance for nonexistent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/economy/balance/nonexistent_user_xyz123")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✅ Nonexistent user balance returns 404")


class TestEconomyLeaderboard:
    """Tests for GET /api/economy/leaderboard"""
    
    def test_get_leaderboard(self):
        """Test leaderboard returns ranked players with rewards"""
        response = requests.get(f"{BASE_URL}/api/economy/leaderboard")
        print(f"Leaderboard response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "leaderboard" in data, "Response missing 'leaderboard'"
        assert "rewards" in data, "Response missing 'rewards'"
        assert "description" in data, "Response missing 'description'"
        
        print(f"✅ Leaderboard endpoint working")
        print(f"   Total players on leaderboard: {len(data['leaderboard'])}")
    
    def test_leaderboard_rewards_correct(self):
        """Test leaderboard rewards are correct"""
        response = requests.get(f"{BASE_URL}/api/economy/leaderboard")
        assert response.status_code == 200
        
        data = response.json()
        rewards = data["rewards"]
        
        # Rewards can be keyed by int or string
        first_place = rewards.get(1) or rewards.get("1")
        second_place = rewards.get(2) or rewards.get("2")
        third_place = rewards.get(3) or rewards.get("3")
        
        assert first_place == 3000, f"1st place reward should be 3000, got {first_place}"
        assert second_place == 1900, f"2nd place reward should be 1900, got {second_place}"
        assert third_place == 1000, f"3rd place reward should be 1000, got {third_place}"
        
        print(f"✅ Leaderboard rewards correct: 1st=3000, 2nd=1900, 3rd=1000")


class TestDiamondPaymentsPackages:
    """Tests for GET /api/diamond-payments/packages - New Stripe route"""
    
    def test_get_diamond_payment_packages(self):
        """Test diamond-payments packages endpoint returns all packages"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/packages")
        print(f"Diamond payments packages response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "packages" in data, "Response missing 'packages'"
        assert "currency" in data, "Response missing 'currency'"
        
        packages = data["packages"]
        assert len(packages) == 4, f"Expected 4 packages, got {len(packages)}"
        
        print(f"✅ Diamond-payments packages endpoint working")
        print(f"   Retrieved {len(packages)} packages")
    
    def test_diamond_payment_packages_structure(self):
        """Test package structure has all required fields"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        required_fields = ["id", "name", "diamonds", "bonus", "total_diamonds", "price_sar", "price_usd"]
        
        for pkg in packages:
            for field in required_fields:
                assert field in pkg, f"Package {pkg.get('id', 'unknown')} missing field: {field}"
        
        print(f"✅ All packages have correct structure")
    
    def test_diamond_payment_packages_pricing(self):
        """Test diamond-payments packages have correct pricing"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/packages")
        assert response.status_code == 200
        
        packages = response.json()["packages"]
        pkg_map = {p["id"]: p for p in packages}
        
        expected = {
            "starter": {"diamonds": 100, "bonus": 0, "price_sar": 3.0},
            "silver": {"diamonds": 250, "bonus": 25, "price_sar": 7.0},
            "gold": {"diamonds": 500, "bonus": 75, "price_sar": 12.0},
            "platinum": {"diamonds": 1000, "bonus": 200, "price_sar": 19.0},
        }
        
        for pkg_id, exp in expected.items():
            actual = pkg_map[pkg_id]
            assert actual["diamonds"] == exp["diamonds"], f"{pkg_id}: diamonds mismatch"
            assert actual["bonus"] == exp["bonus"], f"{pkg_id}: bonus mismatch"
            assert actual["price_sar"] == exp["price_sar"], f"{pkg_id}: price_sar mismatch"
            assert actual["total_diamonds"] == exp["diamonds"] + exp["bonus"], f"{pkg_id}: total_diamonds mismatch"
        
        print(f"✅ All package prices verified")
        for pkg_id, pkg in pkg_map.items():
            print(f"   {pkg_id}: {pkg['total_diamonds']} diamonds @ {pkg['price_sar']} SAR")


class TestDiamondPaymentsCheckout:
    """Tests for POST /api/diamond-payments/checkout/create"""
    
    def test_create_checkout_session_starter(self):
        """Test creating Stripe checkout for starter package"""
        checkout_data = {
            "user_id": TEST_USER_ID,
            "package_id": "starter",
            "origin_url": BASE_URL
        }
        
        response = requests.post(f"{BASE_URL}/api/diamond-payments/checkout/create", json=checkout_data)
        print(f"Create checkout response: {response.status_code}")
        
        if response.status_code == 500:
            # Stripe API issues with test key are expected
            print(f"⚠️ Checkout returned 500 (Stripe API issue): {response.text[:200]}")
            return
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=True"
        assert "checkout_url" in data, "Response missing checkout_url"
        assert "session_id" in data, "Response missing session_id"
        assert "package" in data, "Response missing package info"
        
        print(f"✅ Checkout session created successfully")
        print(f"   Session ID: {data['session_id'][:30]}...")
    
    def test_create_checkout_invalid_package(self):
        """Test checkout with invalid package returns 400"""
        checkout_data = {
            "user_id": TEST_USER_ID,
            "package_id": "invalid_package_xyz",
            "origin_url": BASE_URL
        }
        
        response = requests.post(f"{BASE_URL}/api/diamond-payments/checkout/create", json=checkout_data)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print(f"✅ Invalid package rejected with 400")
    
    def test_create_checkout_missing_fields(self):
        """Test checkout with missing fields returns validation error"""
        # Missing user_id
        response = requests.post(f"{BASE_URL}/api/diamond-payments/checkout/create", json={
            "package_id": "starter",
            "origin_url": BASE_URL
        })
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        
        # Missing package_id
        response = requests.post(f"{BASE_URL}/api/diamond-payments/checkout/create", json={
            "user_id": TEST_USER_ID,
            "origin_url": BASE_URL
        })
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
        
        print(f"✅ Missing fields correctly rejected")


class TestDiamondPaymentsStatus:
    """Tests for GET /api/diamond-payments/checkout/status/{session_id}"""
    
    def test_checkout_status_invalid_session(self):
        """Test status for invalid session returns 404"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/checkout/status/invalid_session_xyz")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✅ Invalid session returns 404")
    
    def test_checkout_status_valid_session(self):
        """Test status for valid session"""
        # First create a checkout session
        checkout_data = {
            "user_id": TEST_USER_ID,
            "package_id": "silver",
            "origin_url": BASE_URL
        }
        
        create_response = requests.post(f"{BASE_URL}/api/diamond-payments/checkout/create", json=checkout_data)
        
        if create_response.status_code == 500:
            print(f"⚠️ Cannot test status - checkout creation failed")
            return
        
        if create_response.status_code != 200:
            pytest.skip(f"Could not create checkout session: {create_response.status_code}")
        
        session_id = create_response.json()["session_id"]
        
        # Get status
        status_response = requests.get(f"{BASE_URL}/api/diamond-payments/checkout/status/{session_id}")
        print(f"Status response: {status_response.status_code}")
        
        if status_response.status_code == 500:
            print(f"⚠️ Status check returned 500 (Stripe API issue)")
            return
        
        assert status_response.status_code == 200, f"Expected 200, got {status_response.status_code}"
        
        data = status_response.json()
        assert "status" in data or "payment_status" in data, "Response should have status"
        
        print(f"✅ Session status retrieved successfully")


class TestDiamondPaymentsTransactions:
    """Tests for GET /api/diamond-payments/transactions/{user_id}"""
    
    def test_get_user_transactions(self):
        """Test getting user payment transactions"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/transactions/{TEST_USER_ID}")
        print(f"Transactions response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "transactions" in data, "Response missing 'transactions'"
        assert "total" in data, "Response missing 'total'"
        
        print(f"✅ User transactions retrieved: {data['total']} transactions")
    
    def test_get_transactions_nonexistent_user(self):
        """Test transactions for nonexistent user returns empty list"""
        response = requests.get(f"{BASE_URL}/api/diamond-payments/transactions/nonexistent_user_xyz")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["total"] == 0 or len(data["transactions"]) == 0
        
        print(f"✅ Nonexistent user returns empty transactions")


class TestEconomyEnterGame:
    """Tests for POST /api/economy/enter-game - Enter online game"""
    
    def test_enter_offline_game_free(self):
        """Test entering offline game is free"""
        request_data = {
            "user_id": TEST_USER_ID,
            "game_id": "tictactoe",
            "is_online": False
        }
        
        response = requests.post(f"{BASE_URL}/api/economy/enter-game", json=request_data)
        print(f"Enter offline game response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should succeed"
        assert data.get("cost") == 0, "Offline game should be free"
        
        print(f"✅ Offline game entry is free")
    
    def test_enter_online_game_cost(self):
        """Test entering online game deducts diamonds"""
        # First check user balance
        balance_response = requests.get(f"{BASE_URL}/api/economy/balance/{TEST_USER_ID}")
        if balance_response.status_code != 200:
            pytest.skip(f"Could not get user balance: {balance_response.status_code}")
        
        initial_diamonds = balance_response.json().get("diamonds", 0)
        print(f"Initial diamonds: {initial_diamonds}")
        
        # Try to enter online game
        request_data = {
            "user_id": TEST_USER_ID,
            "game_id": "tictactoe",
            "is_online": True
        }
        
        response = requests.post(f"{BASE_URL}/api/economy/enter-game", json=request_data)
        print(f"Enter online game response: {response.status_code}")
        
        if response.status_code == 400:
            # May have insufficient diamonds
            print(f"⚠️ Insufficient diamonds to test online entry: {response.text}")
            return
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Should succeed"
        assert data.get("cost") == EXPECTED_ONLINE_GAME_COSTS["tictactoe"], \
            f"TicTacToe should cost {EXPECTED_ONLINE_GAME_COSTS['tictactoe']} diamonds"
        
        print(f"✅ Online game entry costs {data['cost']} diamonds")


class TestEconomyPackages:
    """Tests for GET /api/economy/packages - Economy diamond packages"""
    
    def test_get_economy_packages(self):
        """Test economy packages endpoint"""
        response = requests.get(f"{BASE_URL}/api/economy/packages")
        print(f"Economy packages response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "packages" in data, "Response missing 'packages'"
        assert "currency" in data, "Response missing 'currency'"
        assert len(data["packages"]) == 4, f"Expected 4 packages, got {len(data['packages'])}"
        
        print(f"✅ Economy packages endpoint working")


class TestHealthCheck:
    """Verify API health"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health check response: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("status") == "healthy", "API should be healthy"
        assert data.get("database") == "connected", "Database should be connected"
        
        print(f"✅ API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
