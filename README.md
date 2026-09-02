# Eleicoes de Gensokyo

Site Flask demonstrativo de votação temática.

## Executar localmente

No terminal, dentro desta pasta:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
flask --app app run --debug
```

Abra `http://127.0.0.1:5000`.

## Publicar

Envie esta pasta para um repositório GitHub. O arquivo `requirements.txt` instala o Flask
e o comando de inicialização é:

```text
gunicorn app:app
```

Em hospedagens que usam a variável `PORT`, use:

```text
gunicorn --bind 0.0.0.0:$PORT app:app
```

Durante os testes, a votação aceita apenas `127.0.0.1` e `::1`. Os votos e IPs ficam
em memória e são apagados quando o processo é reiniciado.
