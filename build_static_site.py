from __future__ import annotations

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

ROOT = Path(__file__).resolve().parent
TEMPLATE_DIR = ROOT / "templates"
OUTPUT_DIR = ROOT / "site"

CONFIG = {
    "SITE_NAME": "Eleições em Gensokyo",
    "SITE_DESCRIPTION": "Portal temático para uma eleição especial no universo de Touhou Project",
    "BLOG_NAME": "Crônicas de Gensokyo",
    "BLOG_DESCRIPTION": "Notícias, regras e informações sobre a eleição",
}

ROUTES = {
    "home": "index.html",
    "about": "about.html",
    "blog": "blog.html",
    "voting": "voting.html",
    "results": "results.html",
}


def url_for(endpoint: str, **kwargs):
    """Emula a API url_for() do Flask para gerar links estáticos."""
    if endpoint == "static":
        filename = kwargs.get("filename", "")
        return f"static/{filename.lstrip('/')}" if filename else "static"

    return ROUTES.get(endpoint, f"{endpoint}.html")


def build_site() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        autoescape=select_autoescape(["html", "xml"]),
        keep_trailing_newline=True,
    )
    env.globals["config"] = CONFIG
    env.globals["url_for"] = url_for

    for template_path in sorted(TEMPLATE_DIR.glob("*.html")):
        if template_path.name == "base.html":
            continue

        template = env.get_template(template_path.name)
        rendered = template.render(config=CONFIG, url_for=url_for)
        output_path = OUTPUT_DIR / template_path.name
        output_path.write_text(rendered, encoding="utf-8")
        print(f"Gerado: {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    build_site()
