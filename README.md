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

## Backend no Render

O serviço Flask usa `requirements.txt`, `Procfile` e `render.yaml`. No Render,
configure a variável secreta `ALLOWED_VOTE_IPS` com o IP público autorizado,
por exemplo `203.0.113.10`. Separe vários IPs por vírgulas.

O valor padrão mantém apenas os IPs locais usados nos testes. O endereço
`192.168.x.x` é privado e não identifica seu computador na internet, portanto
não deve ser usado como único IP no Render.
