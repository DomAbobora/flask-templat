import json

import pytest
import app as app_module
from app import app as flask_app


@pytest.fixture
def client():
    with flask_app.test_client() as client:
        yield client


def test_home(client):
    response = client.get("/")
    assert response.status_code == 200


def test_about(client):
    response = client.get("/about")
    assert response.status_code == 200


def test_vote_counts_are_persisted(client, tmp_path, monkeypatch):
    votes_file = tmp_path / "votes.json"
    monkeypatch.setattr(app_module, "VOTES_FILE", str(votes_file))
    app_module.votes_by_office["presidencia"].clear()
    app_module.votes_by_office["governador"].clear()
    app_module.voted_ips.clear()

    response = client.post(
        "/api/votes",
        json={"presidencia": "13", "governador": "1399"},
    )

    assert response.status_code == 201
    saved = json.loads(votes_file.read_text(encoding="utf-8"))
    assert saved["presidencia"]["13"] == 1
    assert saved["governador"]["1399"] == 1
