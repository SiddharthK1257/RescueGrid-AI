import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        # Initialize flagship simulation scenario
        res = c.post("/api/simulation/start")
        assert res.status_code == 200
        yield c

def test_health_endpoint(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert "services" in data
    assert "geminiAiReasoning" in data["services"]
    assert "mossSharedContext" in data["services"]
    assert "livekitCollaboration" in data["services"]
    assert "safetyNotice" in data

def test_list_incidents(client):
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert isinstance(incidents, list)
    assert len(incidents) >= 1
    assert any(i["incidentId"] == "RG-2026-0001" for i in incidents)

def test_get_incident_details(client):
    response = client.get("/api/incidents/RG-2026-0001")
    assert response.status_code == 200
    inc = response.json()
    assert inc["incidentId"] == "RG-2026-0001"
    assert inc["severity"] == "CRITICAL"
    assert inc["affectedPeople"] == 6

def test_moss_context(client):
    response = client.get("/api/incidents/RG-2026-0001/context")
    assert response.status_code == 200
    ctx = response.json()
    assert isinstance(ctx, list)
    assert len(ctx) >= 1

def test_response_plan(client):
    response = client.get("/api/incidents/RG-2026-0001/response-plan")
    assert response.status_code == 200
    data = response.json()
    assert data["latestPlan"] is not None
    assert len(data["latestPlan"]["actions"]) > 0

def test_livekit_token_generation(client):
    payload = {
        "roomName": "incident-rg-2026-0001",
        "participantName": "Commander Shepard",
        "participantIdentity": "op_shepard"
    }
    response = client.post("/api/incidents/RG-2026-0001/livekit-token", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert len(data["token"]) > 20
    assert data["participantName"] == "Commander Shepard"

def test_human_approval_workflow(client):
    payload = {
        "approved": True,
        "notes": "Verified safe staging area with local dispatch.",
        "operatorId": "Operator_Alpha"
    }
    response = client.post("/api/incidents/RG-2026-0001/approve", json=payload)
    assert response.status_code == 200
    plan = response.json()
    assert plan["status"] == "APPROVED"
    assert plan["approvedBy"] == "Operator_Alpha"

def test_simulation_inject_update(client):
    payload = {
        "content": "Fire is now reported in one vehicle, and the primary access lane is blocked.",
        "source": "SIMULATED",
        "verificationStatus": "SIMULATED",
        "isSimulated": True
    }
    response = client.post("/api/simulation/RG-2026-0001/inject-update", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UPDATE_PROCESSED"
    assert data["revisedPlan"]["version"] >= 2

def test_auth_workflow(client):
    # Test seed users endpoint
    seed_res = client.get("/api/auth/seed-users")
    assert seed_res.status_code == 200
    seed_data = seed_res.json()
    assert seed_data["success"] is True
    assert len(seed_data["users"]) >= 4

    # Test login with demo credentials
    login_payload = {
        "email": "commander@rescuegrid.ai",
        "password": "Commander2026!"
    }
    login_res = client.post("/api/auth/login", json=login_payload)
    assert login_res.status_code == 200
    login_data = login_res.json()
    assert login_data["success"] is True
    assert "token" in login_data
    token = login_data["token"]
    assert login_data["user"]["name"] == "Chief Sarah Jenkins"

    # Test me endpoint with bearer token
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["success"] is True
    assert me_data["user"]["email"] == "commander@rescuegrid.ai"

    # Test custom registration with unique test email
    import uuid
    unique_email = f"test.operator.{uuid.uuid4().hex[:6]}@rescuegrid.ai"
    reg_payload = {
        "name": "Lt. Test Operator",
        "email": unique_email,
        "password": "TestPassword123!",
        "role": "DISPATCHER",
        "department": "Emergency Communications Division"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    reg_data = reg_res.json()
    assert reg_data["success"] is True
    assert reg_data["user"]["name"] == "Lt. Test Operator"
    assert reg_data["user"]["email"] == unique_email
    assert "token" in reg_data

