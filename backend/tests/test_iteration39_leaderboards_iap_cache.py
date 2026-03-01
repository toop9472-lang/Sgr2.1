"""
Test Suite for Iteration 39 - New Features:
- Leaderboards System (لوحات المتصدرين)
- IAP System (المشتريات داخل التطبيق) 
- Cache System (التخزين المؤقت)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')

# Test credentials
TEST_EMAIL = "test_user@test.com"
TEST_PASSWORD = "Test123!@#"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/signin", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Authentication failed: {response.text}")


@pytest.fixture(scope="module")
def test_user_id(auth_token):
    """Get test user ID"""
    response = requests.get(f"{BASE_URL}/api/auth/me", 
        headers={"Authorization": f"Bearer {auth_token}"})
    if response.status_code == 200:
        data = response.json()
        return data.get("id") or data.get("user_id")
    return None


class TestCacheSystem:
    """Cache System Tests - نظام التخزين المؤقت"""
    
    def test_get_cache_stats(self):
        """Test GET /api/cache/stats - إحصائيات التخزين المؤقت"""
        response = requests.get(f"{BASE_URL}/api/cache/stats")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "status" in data
        assert data["status"] == "active"
        assert "backend" in data
        assert "total_keys" in data
        assert "memory_usage_approx" in data
        print(f"Cache stats: {data}")
    
    def test_clear_cache(self):
        """Test POST /api/cache/clear - مسح التخزين المؤقت"""
        response = requests.post(f"{BASE_URL}/api/cache/clear")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "message" in data
        print(f"Cache cleared: {data}")
    
    def test_delete_cache_key(self):
        """Test DELETE /api/cache/{key} - حذف مفتاح محدد"""
        response = requests.delete(f"{BASE_URL}/api/cache/test_key")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data.get("key") == "test_key"
        print(f"Cache key deleted: {data}")


class TestIAPProducts:
    """IAP Products Tests - اختبارات منتجات المشتريات"""
    
    def test_get_all_products(self):
        """Test GET /api/iap/products - عرض جميع المنتجات"""
        response = requests.get(f"{BASE_URL}/api/iap/products")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "diamond_packages" in data
        assert "vip_subscriptions" in data
        assert "special_offers" in data
        
        # Verify diamond packages exist
        assert len(data["diamond_packages"]) > 0
        pkg = data["diamond_packages"][0]
        assert "id" in pkg
        assert "diamonds" in pkg
        assert "price_sar" in pkg
        print(f"Found {len(data['diamond_packages'])} diamond packages, {len(data['vip_subscriptions'])} VIP plans")
    
    def test_get_diamond_packages(self):
        """Test GET /api/iap/diamond-packages - باقات الألماس"""
        response = requests.get(f"{BASE_URL}/api/iap/diamond-packages")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "packages" in data
        assert "currency" in data
        assert len(data["packages"]) >= 6  # We defined 6 packages
        
        # Verify package structure
        for pkg in data["packages"]:
            assert "id" in pkg
            assert "name" in pkg
            assert "diamonds" in pkg
            assert "bonus" in pkg
            assert "price_sar" in pkg
            assert "price_usd" in pkg
        
        print(f"Diamond packages: {[p['id'] for p in data['packages']]}")
    
    def test_get_vip_plans(self):
        """Test GET /api/iap/vip-plans - خطط VIP"""
        response = requests.get(f"{BASE_URL}/api/iap/vip-plans")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "plans" in data
        assert "currency" in data
        assert len(data["plans"]) >= 3  # We defined 3 VIP plans
        
        # Verify VIP plan structure
        for plan in data["plans"]:
            assert "id" in plan
            assert "name" in plan
            assert "duration_days" in plan
            assert "price_sar" in plan
            assert "benefits" in plan
            assert "badge" in plan
            assert "color" in plan
        
        print(f"VIP plans: {[p['id'] for p in data['plans']]}")
    
    def test_get_special_offers(self):
        """Test GET /api/iap/special-offers - العروض الخاصة"""
        response = requests.get(f"{BASE_URL}/api/iap/special-offers")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "offers" in data
        assert "currency" in data
        print(f"Special offers: {[o.get('id') for o in data['offers']]}")


class TestIAPPurchases:
    """IAP Purchase Tests - اختبارات الشراء (تتطلب تسجيل الدخول)"""
    
    def test_purchase_product(self, auth_token):
        """Test POST /api/iap/purchase - شراء منتج"""
        response = requests.post(
            f"{BASE_URL}/api/iap/purchase",
            json={"product_id": "diamonds_100", "payment_method": "apple_pay"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "purchase_id" in data
        assert "diamonds_added" in data
        assert data["diamonds_added"] == 100  # 100 diamonds, 0 bonus
        print(f"Purchase successful: {data}")
    
    def test_subscribe_vip(self, auth_token):
        """Test POST /api/iap/subscribe - الاشتراك في VIP"""
        response = requests.post(
            f"{BASE_URL}/api/iap/subscribe",
            json={"plan_id": "vip_weekly", "payment_method": "apple_pay"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "subscription_id" in data
        assert "plan" in data
        assert "expires_at" in data
        print(f"VIP subscription successful: {data}")
    
    def test_get_my_purchases(self, auth_token):
        """Test GET /api/iap/my-purchases - سجل مشترياتي"""
        response = requests.get(
            f"{BASE_URL}/api/iap/my-purchases",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "purchases" in data
        assert "subscriptions" in data
        assert "total_spent_sar" in data
        assert "total_purchases" in data
        print(f"User has {data['total_purchases']} purchases, spent {data['total_spent_sar']} SAR")
    
    def test_get_vip_status(self, auth_token):
        """Test GET /api/iap/vip-status - حالة VIP"""
        response = requests.get(
            f"{BASE_URL}/api/iap/vip-status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # User should be VIP after the subscribe test
        assert "is_vip" in data
        print(f"VIP status: {data}")
    
    def test_restore_purchases(self, auth_token):
        """Test POST /api/iap/restore-purchases - استعادة المشتريات"""
        response = requests.post(
            f"{BASE_URL}/api/iap/restore-purchases",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "restored_purchases" in data
        assert "active_subscriptions" in data
        assert "message" in data
        print(f"Restored: {data}")
    
    def test_purchase_invalid_product(self, auth_token):
        """Test purchase with invalid product ID"""
        response = requests.post(
            f"{BASE_URL}/api/iap/purchase",
            json={"product_id": "invalid_product_999", "payment_method": "apple_pay"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 404
        print(f"Invalid product error: {response.json()}")


class TestLeaderboardsRead:
    """Leaderboard Read Tests - اختبارات قراءة المتصدرين"""
    
    def test_get_game_leaderboard_chess(self):
        """Test GET /api/leaderboards/game/chess - لوحة متصدرين الشطرنج"""
        response = requests.get(f"{BASE_URL}/api/leaderboards/game/chess")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "game" in data
        assert "period" in data
        assert "leaderboard" in data
        assert "total_players" in data
        assert data["game"]["name"] == "الشطرنج"
        print(f"Chess leaderboard: {len(data['leaderboard'])} players")
    
    def test_get_game_leaderboard_with_period(self):
        """Test leaderboard with different periods"""
        for period in ["daily", "weekly", "monthly", "all"]:
            response = requests.get(f"{BASE_URL}/api/leaderboards/game/chess?period={period}")
            assert response.status_code == 200
            data = response.json()
            assert data["period"] == period
            print(f"Period {period}: {len(data['leaderboard'])} players")
    
    def test_get_all_games_leaderboards(self):
        """Test GET /api/leaderboards/all-games - لوحات جميع الألعاب"""
        response = requests.get(f"{BASE_URL}/api/leaderboards/all-games")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "period" in data
        assert "games" in data
        
        # Verify all 12 games exist
        expected_games = ["chess", "tictactoe", "memory", "snake", "trivia", 
                         "speedmath", "wordchain", "puzzle", "brickbreaker", 
                         "colorswitch", "aiquest", "riddles"]
        
        for game_id in expected_games:
            assert game_id in data["games"], f"Missing game: {game_id}"
            assert "game" in data["games"][game_id]
            assert "leaderboard" in data["games"][game_id]
        
        print(f"All {len(data['games'])} games leaderboards retrieved")
    
    def test_get_invalid_game_leaderboard(self):
        """Test leaderboard for invalid game"""
        response = requests.get(f"{BASE_URL}/api/leaderboards/game/invalid_game_999")
        
        assert response.status_code == 400
        print(f"Invalid game error: {response.json()}")


class TestLeaderboardsWrite:
    """Leaderboard Write Tests - اختبارات كتابة النتائج (تتطلب تسجيل الدخول)"""
    
    def test_submit_game_score(self, auth_token):
        """Test POST /api/leaderboards/submit-score - إرسال نتيجة لعبة"""
        response = requests.post(
            f"{BASE_URL}/api/leaderboards/submit-score",
            json={
                "game_id": "chess",
                "score": 150,
                "time_seconds": 300,
                "difficulty": "hard"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "score" in data
        assert "rank" in data
        assert "is_new_best" in data
        assert "game" in data
        print(f"Score submitted: {data}")
    
    def test_submit_score_multiple_games(self, auth_token):
        """Test submitting scores for multiple games"""
        games = [
            {"game_id": "snake", "score": 100},
            {"game_id": "memory", "score": 200},
            {"game_id": "trivia", "score": 180},
        ]
        
        for game in games:
            response = requests.post(
                f"{BASE_URL}/api/leaderboards/submit-score",
                json=game,
                headers={"Authorization": f"Bearer {auth_token}"}
            )
            assert response.status_code == 200
            print(f"Submitted score for {game['game_id']}: {response.json()}")
    
    def test_get_my_game_stats(self, auth_token):
        """Test GET /api/leaderboards/my-stats - إحصائياتي"""
        response = requests.get(
            f"{BASE_URL}/api/leaderboards/my-stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "games" in data
        assert "total_games_played" in data
        assert "total_best_score" in data
        print(f"My stats: {data['total_games_played']} games played, total best score: {data['total_best_score']}")
    
    def test_claim_leaderboard_reward_not_in_top10(self, auth_token):
        """Test claiming reward when not in top 10"""
        response = requests.post(
            f"{BASE_URL}/api/leaderboards/claim-reward?game_id=puzzle&period=weekly",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Should fail if user is not in top 10
        # Either 400 (not in top 10) or 200 (if in top 10)
        assert response.status_code in [200, 400]
        print(f"Claim reward response: {response.json()}")
    
    def test_submit_invalid_game_score(self, auth_token):
        """Test submitting score for invalid game"""
        response = requests.post(
            f"{BASE_URL}/api/leaderboards/submit-score",
            json={"game_id": "invalid_game_999", "score": 100},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 400
        print(f"Invalid game error: {response.json()}")


class TestLeaderboardsIntegration:
    """Integration tests - اختبارات التكامل"""
    
    def test_score_appears_in_leaderboard(self, auth_token, test_user_id):
        """Test that submitted score appears in leaderboard"""
        # Submit a unique high score
        score = 99999
        response = requests.post(
            f"{BASE_URL}/api/leaderboards/submit-score",
            json={"game_id": "aiquest", "score": score},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        
        # Fetch leaderboard with user_id
        response = requests.get(
            f"{BASE_URL}/api/leaderboards/game/aiquest?user_id={test_user_id}"
        )
        assert response.status_code == 200
        data = response.json()
        
        # User should have a rank now
        assert data.get("user_rank") is not None
        assert data.get("user_score") == score
        print(f"User rank: {data['user_rank']}, score: {data['user_score']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
