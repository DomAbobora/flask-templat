# Site Crônicas (Jekyll + GitHub Pages)

Setup inicial para executar localmente e publicar com GitHub Pages.

Requisitos
- Ruby (>= 2.7)
- Bundler

Instalação e execução local

```bash
gem install bundler
bundle install
bundle exec jekyll serve
```

Abra `http://127.0.0.1:4000` para ver o site localmente.

Quando fizer push para a branch `main` o GitHub Pages irá publicar o site automaticamente (ou use o workflow incluído).
