"""
Backend tests for the Gifts system (Phase 1).

Covers:
- GET /api/gifts/catalog        (12 tiers + gems_reward formula 20% * 166.6667)
- POST /api/gifts/send          (credit gems, reject self-gift, invalid gift, missing receiver)
- GET /api/gifts/pending/{id}   (returns undelivered, marks delivered, idempotent)
- GET /api/gifts/pending uses since_seconds window
- GET /api/gifts/inbox/{id}     (desc sort, full history)
- GET /api/gifts/sent/{id}      (sender history)
- POST /api/gifts/verify-receipt (Phase 2 placeholder, stores receipt)
- Multiple gifts accumulate gem balance correctly
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend/.env if not in env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

API = f"{BASE_URL}/api"

# Expected gem rewards (round(price_sar * 0.20 * 500/3))
EXPECTED_GEMS = {
    "rose": 100,
    "bouquet": 333,
    "chocolate": 833,
    "teddy": 1667,
    "gem": 2500,
    "crown": 3333,
    "cake": 4333,
    "car": 5333,
    "ring": 6333,
    "castle": 7333,
    "yacht": 8667,
    "trophy": 9967,
}
EXPECTED_PRICES = {
    "rose": 3, "bouquet": 10, "chocolate": 25, "teddy": 50, "gem": 75,
    "crown": 100, "cake": 130, "car": 160, "ring": 190, "castle": 220,
    "yacht": 260, "trophy": 299,
}


# ---------------------- fixtures ----------------------
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _register(session, label):
    suffix = uuid.uuid4().hex[:10]
    payload = {
        "email": f"TEST_gift_{label}_{suffix}@example.com",
        "password": "TestPass!23",
        "name": f"TEST Gift {label}",
    }
    r = session.post(f"{API}/auth/register", json=payload, timeout=30)
    assert r.status_code == 200, f"register failed: {r.status_code} {r.text}"
    data = r.json()
    user = data.get("user") or data
    uid = user.get("id") or user.get("user_id")
    assert uid, f"no user id in response: {data}"
    return uid, user


@pytest.fixture(scope="module")
def two_users(session):
    sender_id, sender = _register(session, "sender")
    receiver_id, receiver = _register(session, "receiver")
    return {"sender": sender_id, "receiver": receiver_id, "sender_obj": sender, "receiver_obj": receiver}


@pytest.fixture(scope="module")
def catalog(session):
    r = session.get(f"{API}/gifts/catalog", timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------- catalog ----------------------
class TestCatalog:
    def test_catalog_has_exactly_12_gifts(self, catalog):
        assert "gifts" in catalog
        assert isinstance(catalog["gifts"], list)
        assert len(catalog["gifts"]) == 12, f"expected 12 gifts, got {len(catalog['gifts'])}"

    def test_catalog_required_fields(self, catalog):
        required = {"gift_id", "name_ar", "name_en", "price_sar", "tier",
                    "icon_url", "animation", "particle_count", "accent_color",
                    "ios_product_id", "android_product_id", "gems_reward"}
        for g in catalog["gifts"]:
            missing = required - set(g.keys())
            assert not missing, f"gift {g.get('gift_id')} missing fields: {missing}"

    def test_catalog_gems_reward_formula(self, catalog):
        for g in catalog["gifts"]:
            gid = g["gift_id"]
            assert gid in EXPECTED_GEMS, f"unexpected gift id {gid}"
            assert g["price_sar"] == EXPECTED_PRICES[gid], \
                f"price mismatch for {gid}: {g['price_sar']} vs {EXPECTED_PRICES[gid]}"
            assert g["gems_reward"] == EXPECTED_GEMS[gid], \
                f"gems mismatch for {gid}: got {g['gems_reward']}, expected {EXPECTED_GEMS[gid]}"

    def test_catalog_tiers_and_meta(self, catalog):
        tiers = [g["tier"] for g in catalog["gifts"]]
        assert sorted(tiers) == list(range(1, 13))
        assert catalog.get("receiver_share_percent") == 20
        assert "exchange_rate" in catalog


# ---------------------- send ----------------------
class TestSendGift:
    def test_send_rose_credits_gems(self, session, two_users):
        body = {
            "sender_id": two_users["sender"],
            "receiver_id": two_users["receiver"],
            "gift_id": "rose",
            "context_type": "profile",
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert data["gems_awarded"] == 100
        assert "tx_id" in data and isinstance(data["tx_id"], str)
        assert data["receiver_new_balance"] >= 100

    def test_send_rejects_self_gift(self, session, two_users):
        body = {
            "sender_id": two_users["sender"],
            "receiver_id": two_users["sender"],
            "gift_id": "rose",
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=20)
        assert r.status_code == 400, r.text

    def test_send_rejects_invalid_gift_id(self, session, two_users):
        body = {
            "sender_id": two_users["sender"],
            "receiver_id": two_users["receiver"],
            "gift_id": "nonexistent_gift_xyz",
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=20)
        assert r.status_code == 404, r.text

    def test_send_rejects_missing_receiver(self, session, two_users):
        body = {
            "sender_id": two_users["sender"],
            "receiver_id": "no_such_user_" + uuid.uuid4().hex,
            "gift_id": "rose",
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=20)
        assert r.status_code == 404, r.text

    def test_send_rejects_missing_sender(self, session, two_users):
        body = {
            "sender_id": "no_such_sender_" + uuid.uuid4().hex,
            "receiver_id": two_users["receiver"],
            "gift_id": "rose",
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=20)
        assert r.status_code == 404, r.text

    def test_send_ios_without_receipt_returns_400(self, session, two_users):
        """iOS platform without a receipt should be rejected with 400."""
        body = {
            "sender_id": two_users["sender"],
            "receiver_id": two_users["receiver"],
            "gift_id": "rose",
            "context_type": "profile",
            "platform": "ios",
            # receipt intentionally omitted
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=20)
        assert r.status_code == 400, r.text
        assert "receipt" in r.text.lower() or "إيصال" in r.text or "receipt مطلوب" in r.text

    def test_send_rejects_invalid_context_type(self, session, two_users):
        """context_type must be one of the whitelist (chat, private_chat, reel, reel_comment, profile)."""
        body = {
            "sender_id": two_users["sender"],
            "receiver_id": two_users["receiver"],
            "gift_id": "rose",
            "context_type": "foo_bar_invalid",
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=20)
        # Pydantic Literal violation -> 422
        assert r.status_code == 422, r.text

    def test_send_sandbox_chocolate_25_sar(self, session, two_users):
        """Sandbox platform should be accepted; receiver earns ~833 gems for 25 SAR chocolate."""
        # Use a fresh receiver to assert exact balance delta
        receiver_id, _ = _register(session, "sandbox_recv")
        body = {
            "sender_id": two_users["sender"],
            "receiver_id": receiver_id,
            "gift_id": "chocolate",
            "context_type": "profile",
            "platform": "sandbox",
            "transaction_id": "sandbox_tx_" + uuid.uuid4().hex,
        }
        r = session.post(f"{API}/gifts/send", json=body, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["success"] is True
        assert "tx_id" in data and isinstance(data["tx_id"], str)
        assert data["gems_awarded"] == 833
        # Verify inbox immediately
        inbox = session.get(f"{API}/gifts/inbox/{receiver_id}", timeout=20)
        assert inbox.status_code == 200
        items = inbox.json()["gifts"]
        assert len(items) >= 1
        tx = items[0]
        assert tx["gift_id"] == "chocolate"
        assert tx["price_sar"] == 25
        assert tx["gems_awarded"] == 833
        assert tx["sender_id"] == two_users["sender"]
        assert tx["receiver_id"] == receiver_id
        assert tx["platform"] == "sandbox"

    def test_send_multiple_accumulates_balance(self, session, two_users):
        # send a crown (3333) then a bouquet (333) and verify balance grows
        r1 = session.post(f"{API}/gifts/send", json={
            "sender_id": two_users["sender"], "receiver_id": two_users["receiver"],
            "gift_id": "crown", "context_type": "reel_comment", "context_id": "clip-xyz",
        }, timeout=30)
        assert r1.status_code == 200, r1.text
        bal1 = r1.json()["receiver_new_balance"]
        assert r1.json()["gems_awarded"] == 3333

        r2 = session.post(f"{API}/gifts/send", json={
            "sender_id": two_users["sender"], "receiver_id": two_users["receiver"],
            "gift_id": "bouquet", "context_type": "private_chat",
        }, timeout=30)
        assert r2.status_code == 200, r2.text
        bal2 = r2.json()["receiver_new_balance"]
        assert r2.json()["gems_awarded"] == 333
        assert bal2 >= bal1 + 333, f"expected bal2 >= {bal1+333}, got {bal2}"


# ---------------------- pending / inbox / sent ----------------------
class TestHistoryEndpoints:
    def test_pending_returns_then_marks_delivered(self, session, two_users):
        # send a fresh gift then poll pending
        r = session.post(f"{API}/gifts/send", json={
            "sender_id": two_users["sender"], "receiver_id": two_users["receiver"],
            "gift_id": "gem", "context_type": "chat",
        }, timeout=30)
        assert r.status_code == 200
        tx_id = r.json()["tx_id"]

        p1 = session.get(f"{API}/gifts/pending/{two_users['receiver']}", timeout=20)
        assert p1.status_code == 200, p1.text
        d1 = p1.json()
        assert any(g["tx_id"] == tx_id for g in d1["gifts"]), \
            f"expected tx {tx_id} in pending, got {[g.get('tx_id') for g in d1['gifts']]}"

        # second call should NOT return the same tx (marked delivered)
        p2 = session.get(f"{API}/gifts/pending/{two_users['receiver']}", timeout=20)
        assert p2.status_code == 200
        d2 = p2.json()
        assert not any(g["tx_id"] == tx_id for g in d2["gifts"]), \
            "pending should be idempotent — same tx returned twice"

    def test_pending_respects_since_seconds_window(self, session, two_users):
        # since_seconds=10 should still capture a fresh gift (timestamp now)
        r = session.post(f"{API}/gifts/send", json={
            "sender_id": two_users["sender"], "receiver_id": two_users["receiver"],
            "gift_id": "rose", "context_type": "profile",
        }, timeout=30)
        assert r.status_code == 200
        tx_id = r.json()["tx_id"]

        p = session.get(f"{API}/gifts/pending/{two_users['receiver']}?since_seconds=15", timeout=20)
        assert p.status_code == 200
        assert any(g["tx_id"] == tx_id for g in p.json()["gifts"])

    def test_inbox_returns_full_history_desc(self, session, two_users):
        r = session.get(f"{API}/gifts/inbox/{two_users['receiver']}", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["count"] >= 4, f"expected several gifts in inbox, got {data['count']}"
        # check desc sort by created_at
        timestamps = [g["created_at"] for g in data["gifts"]]
        assert timestamps == sorted(timestamps, reverse=True), "inbox not sorted desc by created_at"

    def test_sent_returns_sender_history(self, session, two_users):
        r = session.get(f"{API}/gifts/sent/{two_users['sender']}", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["count"] >= 4
        for g in data["gifts"]:
            assert g["sender_id"] == two_users["sender"]


# ---------------------- leaderboard ----------------------
class TestLeaderboard:
    def test_leaderboard_received_all(self, session, two_users):
        """Top users by total received gifts. Receiver (multiple gifts) must appear."""
        r = session.get(f"{API}/gifts/leaderboard?scope=received&period=all", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["scope"] == "received"
        assert data["period"] == "all"
        assert "leaderboard" in data
        assert isinstance(data["leaderboard"], list)
        assert data["count"] == len(data["leaderboard"])
        assert data["count"] >= 1

        # Validate row shape
        row = data["leaderboard"][0]
        for k in ("rank", "user_id", "name", "avatar", "is_verified",
                  "total_sar", "total_gifts", "total_gems"):
            assert k in row, f"missing key {k} in leaderboard row"
        assert row["rank"] == 1
        assert isinstance(row["total_sar"], (int, float))
        assert isinstance(row["total_gifts"], int)
        assert isinstance(row["total_gems"], int)
        assert isinstance(row["is_verified"], bool)

        # Receiver in this run must be in leaderboard
        recv = two_users["receiver"]
        user_ids = [r["user_id"] for r in data["leaderboard"]]
        assert recv in user_ids, f"expected test receiver {recv} in leaderboard, got {user_ids[:5]}"

        # Sort check
        sars = [r["total_sar"] for r in data["leaderboard"]]
        assert sars == sorted(sars, reverse=True), "leaderboard not sorted desc by total_sar"

    def test_leaderboard_sent_month(self, session, two_users):
        """scope=sent + period=month should include the test sender."""
        r = session.get(f"{API}/gifts/leaderboard?scope=sent&period=month", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["scope"] == "sent"
        assert data["period"] == "month"
        user_ids = [row["user_id"] for row in data["leaderboard"]]
        # Our sender has sent multiple gifts moments ago — must be present in 30-day window
        assert two_users["sender"] in user_ids, \
            f"expected test sender in 30-day sent leaderboard, got {user_ids[:5]}"

        # Verify hydrated fields for our sender row
        my_row = next(r for r in data["leaderboard"] if r["user_id"] == two_users["sender"])
        assert my_row["total_gifts"] >= 1
        assert my_row["total_sar"] >= 3  # at least one rose

    def test_leaderboard_invalid_scope_returns_422(self, session):
        r = session.get(f"{API}/gifts/leaderboard?scope=invalid_xyz", timeout=20)
        assert r.status_code == 422, r.text

    def test_leaderboard_invalid_period_returns_422(self, session):
        r = session.get(f"{API}/gifts/leaderboard?scope=received&period=eon", timeout=20)
        assert r.status_code == 422, r.text

    def test_leaderboard_limit_respected(self, session):
        r = session.get(f"{API}/gifts/leaderboard?scope=received&limit=1", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert len(data["leaderboard"]) <= 1


# ---------------------- verify-receipt ----------------------
class TestVerifyReceipt:
    def test_verify_receipt_ios_fake_returns_400(self, session, two_users):
        """iOS path now performs real Apple JWS verification — fake receipt must fail with 400."""
        body = {
            "user_id": two_users["sender"],
            "platform": "ios",
            "product_id": "com.saqr.gift.rose",
            "transaction_id": "test_tx_" + uuid.uuid4().hex,
            "receipt": "FAKE_BASE64_RECEIPT_PAYLOAD",
        }
        r = session.post(f"{API}/gifts/verify-receipt", json=body, timeout=30)
        assert r.status_code == 400, r.text

    def test_verify_receipt_android_placeholder(self, session, two_users):
        """Android branch still records the receipt and returns verified=False."""
        body = {
            "user_id": two_users["sender"],
            "platform": "android",
            "product_id": "saqr_gift_rose",
            "transaction_id": "android_tx_" + uuid.uuid4().hex,
            "receipt": "fake_android_token",
        }
        r = session.post(f"{API}/gifts/verify-receipt", json=body, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("success") is True
        assert data.get("verified") is False
