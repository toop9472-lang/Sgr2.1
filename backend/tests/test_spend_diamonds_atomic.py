"""
Atomic spend-diamonds regression test.
Ensures two concurrent spend requests cannot both pass when balance is only enough for one.
"""
import os
import uuid
from concurrent.futures import ThreadPoolExecutor

import requests


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


def _create_user():
    email = f"atomic_{uuid.uuid4().hex[:10]}@example.com"
    password = "Pass1234!"
    payload = {"email": email, "password": password, "name": "Atomic User"}

    for endpoint in ("/api/auth/signup", "/api/auth/register"):
        try:
            res = requests.post(f"{BASE_URL}{endpoint}", json=payload, timeout=20)
            if res.ok:
                data = res.json()
                user = data.get("user") or {}
                user_id = user.get("id") or user.get("user_id")
                if user_id:
                    return user_id
        except Exception:
            continue
    raise AssertionError("Failed to create test user for atomic spend test")


def _spend_once(user_id: str, amount: int):
    return requests.post(
        f"{BASE_URL}/api/economy/spend-diamonds",
        json={
            "user_id": user_id,
            "amount": amount,
            "source": "atomic_test",
            "game_id": "atomic_case",
        },
        timeout=20,
    )


def test_spend_diamonds_is_atomic_under_concurrency():
    user_id = _create_user()

    init_res = requests.post(f"{BASE_URL}/api/economy/initialize-user/{user_id}", timeout=20)
    assert init_res.status_code in (200, 400), f"Unexpected init status: {init_res.status_code} {init_res.text}"

    balance_before_res = requests.get(f"{BASE_URL}/api/economy/balance/{user_id}", timeout=20)
    assert balance_before_res.ok, f"Failed to fetch initial balance: {balance_before_res.status_code}"
    initial_diamonds = balance_before_res.json().get("diamonds", 0)
    assert initial_diamonds >= 300, f"Expected at least 300 initial diamonds, got {initial_diamonds}"

    spend_amount = 300
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(_spend_once, user_id, spend_amount) for _ in range(2)]
        responses = [f.result() for f in futures]

    status_codes = sorted([r.status_code for r in responses])
    assert status_codes == [200, 400], (
        "Expected one success and one insufficient-balance rejection "
        f"for concurrent spend, got statuses: {status_codes}"
    )

    balance_after_res = requests.get(f"{BASE_URL}/api/economy/balance/{user_id}", timeout=20)
    assert balance_after_res.ok, f"Failed to fetch final balance: {balance_after_res.status_code}"
    final_diamonds = balance_after_res.json().get("diamonds", 0)

    assert final_diamonds == initial_diamonds - spend_amount, (
        f"Expected final diamonds {initial_diamonds - spend_amount}, got {final_diamonds}"
    )
    assert final_diamonds >= 0, f"Diamonds must never be negative, got {final_diamonds}"
