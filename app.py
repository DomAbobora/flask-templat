from collections import Counter
from threading import Lock

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
app.config["SITE_NAME"] = "Eleições de Gensokyo 2026"
app.config["BLOG_NAME"] = "O sabio de Gensokyo: Mesário eremita"
app.config["SITE_DESCRIPTION"] = (
    "Votação temática inspirada em Touhou Project. Vote nas suas candidatas e que vença a melhor!"
)
app.config["BLOG_DESCRIPTION"] = "votações eremitas"

vote_lock = Lock()
votes_by_office = {
    "presidencia": Counter(),
    "governador": Counter(),
}
voted_ips = set()
allowed_test_ips = {"127.0.0.1", "::1"}
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
                jsonify(
                    {
                        "error": "O Sábio Eremita diz:\n\nEsse endereço de IP já fez uma votação."
                    }
                ),
                409,
            )
        votes_by_office["presidencia"][presidencia] += 1
        votes_by_office["governador"][governador] += 1
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
