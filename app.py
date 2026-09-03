import json
from collections import Counter
from pathlib import Path
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


vote_lock = Lock()
loaded_votes = load_votes_from_disk()
votes_by_office = {
    "presidencia": Counter(loaded_votes["presidencia"]),
    "governador": Counter(loaded_votes["governador"]),
}
voted_ips = set()
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


@app.post("/api/votes")
def register_votes():
    data = request.get_json(silent=True) or {}
    presidencia = str(data.get("presidencia", "")).strip()
    governador = str(data.get("governador", "")).strip()
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
        votes_by_office["presidencia"][presidencia] += 1
        votes_by_office["governador"][governador] += 1
        save_votes_to_disk()
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
