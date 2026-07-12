def test_create_vehicle_duplicate_reg_number(client, fleet_token):
    payload = {
        "reg_number": "DUPE-123",
        "model_name": "Test Model",
        "type": "truck",
        "max_load_capacity": 5000.0,
        "acquisition_cost": 25000.0,
        "region": "East"
    }
    
    # First creation should succeed
    response1 = client.post(
        "/api/v1/vehicles",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json=payload
    )
    assert response1.status_code == 201

    # Second creation with same reg_number should return 409
    response2 = client.post(
        "/api/v1/vehicles",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json=payload
    )
    assert response2.status_code == 409
    assert "already exists" in response2.json()["detail"]

def test_negative_capacity_rejected(client, fleet_token):
    payload = {
        "reg_number": "BAD-CAP",
        "model_name": "Test Model",
        "type": "truck",
        "max_load_capacity": -100.0,  # Invalid
        "acquisition_cost": 25000.0,
        "region": "East"
    }
    response = client.post(
        "/api/v1/vehicles",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json=payload
    )
    assert response.status_code == 422
    assert "Input should be greater than 0" in response.text

def test_negative_cost_rejected(client, fleet_token):
    payload = {
        "reg_number": "BAD-COST",
        "model_name": "Test Model",
        "type": "truck",
        "max_load_capacity": 1000.0,
        "acquisition_cost": -25000.0,  # Invalid
        "region": "East"
    }
    response = client.post(
        "/api/v1/vehicles",
        headers={"Authorization": f"Bearer {fleet_token}"},
        json=payload
    )
    assert response.status_code == 422
    assert "Input should be greater than 0" in response.text

def test_search_filter_sort(client, fleet_token):
    # Create some extra vehicles
    client.post("/api/v1/vehicles", headers={"Authorization": f"Bearer {fleet_token}"}, json={
        "reg_number": "VAN-001", "model_name": "Transit", "type": "van", "max_load_capacity": 1000, "acquisition_cost": 20000, "region": "North"
    })
    client.post("/api/v1/vehicles", headers={"Authorization": f"Bearer {fleet_token}"}, json={
        "reg_number": "TRUCK-001", "model_name": "F150", "type": "truck", "max_load_capacity": 2000, "acquisition_cost": 30000, "region": "South"
    })

    # Test search by reg_number (partial)
    response = client.get("/api/v1/vehicles?search=VAN", headers={"Authorization": f"Bearer {fleet_token}"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["reg_number"] == "VAN-001"

    # Test filter by region
    response = client.get("/api/v1/vehicles?region=South", headers={"Authorization": f"Bearer {fleet_token}"})
    data = response.json()
    assert len(data) == 1
    assert data[0]["reg_number"] == "TRUCK-001"
