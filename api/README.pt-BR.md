# api

[🇺🇸 English](README.md) · 🇧🇷 Português (Brasil)

API REST em Python (FastAPI, SQLAlchemy 2, Alembic). Três camadas: router → service → repository.
Mensagens em inglês por padrão; em português do Brasil quando o cabeçalho `Accept-Language` pede `pt-BR`.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head                    # cria o banco SQLite
uvicorn app.main:app --reload --port 8000   # http://127.0.0.1:8000, documentação em /api/docs
pytest                                  # testes (SQLite em memória)
ruff check . && ruff format --check .   # lint e formatação
mypy app                                # tipos (strict)
```

Precisa de Python 3.12 ou mais novo.

## Estrutura

- `app/routers/`: endpoints HTTP, sem regra de negócio.
- `app/services/`: casos de uso e transações (`app/db.py: transaction`).
- `app/repositories/`: consultas ao banco.
- `app/schemas.py`: corpos das requisições e seus limites. `app/validation.py` converte erros de
  validação em `{"message", "errors": {campo: [texto]}}`.
- `app/resources.py`: formato do JSON devolvido (as respostas vêm dentro de `{"data": ...}`).
- `migrations/`: migrations do Alembic.

A autenticação usa um token bearer devolvido por `POST /api/auth/register` e `POST /api/auth/login`.
