from datetime import date, timedelta

def test_create_driver_duplicate_license(client, fleet_token):
    future_date = (date.today() + timedelta(days=365)).isoformat()
    payload = {
        "name": "John Doe",
        "license_number": "LIC-12345",
        "license_category": "A",
        "license_expiry": future_date,
        "contact_number": "1234567890",
    }
    
    # First creation should succeed
    response1 = client.post(
        "/api/v1/drivers",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json=payload
    )
    assert response1.status_code == 201

    # Second creation with same license_number should return 409
    response2 = client.post(
        "/api/v1/drivers",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json=payload
    )
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"]

def test_computed_fields(client, fleet_token):
    # Driver with valid license
    future_date = (date.today() + timedelta(days=10)).isoformat()
    resp1 = client.post(
        "/api/v1/drivers",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json={
            "name": "Valid Driver",
            "license_number": "VALID-001",
            "license_expiry": future_date,
            "contact_number": "1234567890"
        }
    )
    assert resp1.status_code == 201
    assert resp1.json()["is_license_valid"] is True
    assert resp1.json()["days_until_expiry"] == 10

    # Driver with expired license
    past_date = (date.today() - timedelta(days=5)).isoformat()
    resp2 = client.post(
        "/api/v1/drivers",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json={
            "name": "Expired Driver",
            "license_number": "EXPIRED-001",
            "license_expiry": past_date,
            "contact_number": "1234567890"
        }
    )
    assert resp2.status_code == 201
    assert resp2.json()["is_license_valid"] is False
    assert resp2.json()["days_until_expiry"] == -5

def test_search_filter_sort(client, fleet_token):
    future_date = (date.today() + timedelta(days=365)).isoformat()
    client.post(
        "/api/v1/drivers",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json={
            "name": "Alice Smith",
            "license_number": "ALICE-123",
            "license_category": "B",
            "license_expiry": future_date,
            "contact_number": "1234567890"
        }
    )
    client.post(
        "/api/v1/drivers",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json={
            "name": "Bob Jones",
            "license_number": "BOB-456",
            "license_category": "C",
            "license_expiry": future_date,
            "contact_number": "1234567890"
        }
    )

    # Search by name
    response = client.get("/api/v1/drivers?search=Alice", headers={"Authorization": f"Bearer {fleet_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Alice Smith"

    # Filter by category
    response = client.get("/api/v1/drivers?license_category=C", headers={"Authorization": f"Bearer {fleet_token}"})
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Bob Jones"
