def test_login_invalid_email_format(client):
    response = client.post("/api/v1/auth/login", data={"username": "not-an-email", "password": "password123"})
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]

def test_login_wrong_password(client):
    response = client.post("/api/v1/auth/login", data={"username": "fleet@test.com", "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"

def test_login_success(client, fleet_token):
    assert fleet_token is not None

def test_invalid_jwt_rejected(client):
    response = client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid_token_here"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"

def test_require_role_blocks_wrong_user(client, driver_token):
    # driver_token belongs to a user with RoleEnum.driver
    # POST /api/v1/vehicles requires fleet_manager
    response = client.post(
        "/api/v1/vehicles",
        headers={"Authorization": f"Bearer {driver_token}"},
        json={
            "reg_number": "BLOCK-123",
            "model_name": "Test",
            "type": "van",
            "max_load_capacity": 1000,
            "acquisition_cost": 5000,
            "region": "North"
        }
    )
    assert response.status_code == 403
    assert response.json()["detail"] == "Role 'driver' is not authorized for this action"
