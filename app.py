import json
import re
from collections import Counter
from datetime import date
from pathlib import Path
import secrets
from threading import Lock

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["SITE_NAME"] = "Eleições de Gensokyo 2026"
app.config["BLOG_NAME"] = "O sabio de Gensokyo: Mesário eremita"
app.config["SITE_DESCRIPTION"] = (
    "Votação temática inspirada em Touhou Project. Vote nas suas candidatas e que vença a melhor!"
)
app.config["BLOG_DESCRIPTION"] = "votações eremitas"

VOTES_FILE = Path(__file__).resolve().parent / "votes.json"
TOKENS_FILE = Path(__file__).resolve().parent / "tokens.json"
TOKEN_PATTERN = re.compile(r"^[A-Za-z0-9!@#$%&*]{8,32}$")


def load_votes_from_disk():
    votes_path = Path(VOTES_FILE)
    if not votes_path.exists():
        return {"presidencia": {}, "governador": {}}

    try:
        with votes_path.open("r", encoding="utf-8") as file:
            stored_votes = json.load(file)
    except (json.JSONDecodeError, OSError):
        return {"presidencia": {}, "governador": {}}

    normalized_votes = {"presidencia": {}, "governador": {}}
    for office in normalized_votes:
        values = stored_votes.get(office, {}) or {}
        normalized_votes[office] = {
            str(candidate): int(total) for candidate, total in values.items()
        }
    return normalized_votes


def save_votes_to_disk():
    votes_path = Path(VOTES_FILE)
    payload = {
        office: {candidate: int(total) for candidate, total in counts.items()}
        for office, counts in votes_by_office.items()
    }
    votes_path.parent.mkdir(parents=True, exist_ok=True)
    with votes_path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)


def load_tokens_from_disk():
    tokens_path = Path(TOKENS_FILE)
    if not tokens_path.exists():
        return {}

    try:
        with tokens_path.open("r", encoding="utf-8") as file:
            stored_tokens = json.load(file)
    except (json.JSONDecodeError, OSError):
        return {}

    if isinstance(stored_tokens, dict):
        return {
            str(token): str(created_date)
            for token, created_date in stored_tokens.items()
            if isinstance(token, str) and isinstance(created_date, str)
        }
    return {
        str(token): date.today().isoformat()
        for token in stored_tokens
        if isinstance(token, str)
    }


def save_tokens_to_disk():
    tokens_path = Path(TOKENS_FILE)
    tokens_path.parent.mkdir(parents=True, exist_ok=True)
    with tokens_path.open("w", encoding="utf-8") as file:
        json.dump(issued_tokens, file, ensure_ascii=False, indent=2)


vote_lock = Lock()
loaded_votes = load_votes_from_disk()
votes_by_office = {
    "presidencia": Counter(loaded_votes["presidencia"]),
    "governador": Counter(loaded_votes["governador"]),
}
voted_ips = set()
issued_tokens = load_tokens_from_disk()
allowed_test_ips = {"127.0.0.1", "::1", "192.168.5.112"}
allowed_votes = {
    "presidencia": {"13", "14", "22"},
    "governador": {"1399", "1400", "2222"},
}


@app.route("/")
def home():
    return render_template("home.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/blog")
def blog():
    return render_template("blog.html")


@app.route("/voting")
def voting():
    return render_template("voting.html")


@app.route("/results")
def results():
    return render_template("results.html")


@app.post("/api/tokens")
def issue_token():
    data = request.get_json(silent=True) or {}
    try:
        length = int(data.get("length", 18))
    except (TypeError, ValueError):
        length = 0

    if not 8 <= length <= 32:
        return jsonify({"error": "O tamanho do token deve estar entre 8 e 32."}), 400

    character_groups = {
        "upper": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "lower": "abcdefghijklmnopqrstuvwxyz",
        "numbers": "0123456789",
        "symbols": "!@#$%&*",
    }
    enabled_groups = [
        characters
        for option, characters in character_groups.items()
        if data.get(option, False)
    ]
    if not enabled_groups:
        return jsonify({"error": "Selecione pelo menos um tipo de caractere."}), 400

    character_pool = "".join(enabled_groups)
    token = "".join(secrets.choice(character_pool) for _ in range(length))
    with vote_lock:
        issued_tokens[token] = date.today().isoformat()
        save_tokens_to_disk()
    return jsonify({"token": token}), 201


@app.post("/api/tokens/validate")
def validate_token():
    data = request.get_json(silent=True) or {}
    token = str(data.get("token", "")).strip()
    with vote_lock:
        token_date = issued_tokens.get(token)
    if not TOKEN_PATTERN.fullmatch(token) or token_date != date.today().isoformat():
        return jsonify({"error": "O sábio eremita diz: coloque um token válido criado hoje."}), 400
    return jsonify({"valid": True})


@app.post("/api/votes")
def register_votes():
    data = request.get_json(silent=True) or {}
    token = str(data.get("token", "")).strip()
    presidencia = str(data.get("presidencia", "")).strip()
    governador = str(data.get("governador", "")).strip()
    if not TOKEN_PATTERN.fullmatch(token):
        return jsonify({"error": "O sábio eremita diz: coloque um token válido"}), 400
    if (
        presidencia not in allowed_votes["presidencia"]
        or governador not in allowed_votes["governador"]
    ):
        return jsonify({"error": "Informe os dois votos."}), 400

    voter_ip = request.remote_addr or "unknown"
    with vote_lock:
        if voter_ip not in allowed_test_ips:
            return (
                jsonify(
                    {
                        "error": "A votação está disponível apenas para o IP autorizado durante os testes."
                    }
                ),
                403,
            )
        if voter_ip in voted_ips:
            return (
                jsonify({"error": "O Sábio Eremita diz:\n\nvocê já fez uma votação."}),
                409,
            )
        if issued_tokens.get(token) != date.today().isoformat():
            return jsonify({"error": "O sábio eremita diz: coloque um token válido criado hoje."}), 400
        votes_by_office["presidencia"][presidencia] += 1
        votes_by_office["governador"][governador] += 1
        del issued_tokens[token]
        save_votes_to_disk()
        save_tokens_to_disk()
        voted_ips.add(voter_ip)
    return jsonify({"message": "Voto registrado."}), 201


@app.get("/api/results")
def vote_results():
    with vote_lock:
        results_data = {
            office: dict(counts) for office, counts in votes_by_office.items()
        }
    return jsonify(results_data)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
