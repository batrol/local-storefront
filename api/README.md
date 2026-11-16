# api

🇺🇸 English · [🇧🇷 Português (Brasil)](README.pt-BR.md)

REST API in Python (FastAPI, SQLAlchemy 2, Alembic). Three layers: router → service → repository.
Messages are in English by default and in Brazilian Portuguese when `Accept-Language` asks for `pt-BR`.

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head                    # creates the SQLite database
uvicorn app.main:app --reload --port 8000   # http://127.0.0.1:8000, docs at /api/docs
pytest                                  # test suite (SQLite in memory)
ruff check . && ruff format --check .   # lint and formatting
mypy app                                # static types (strict)
```

Needs Python 3.12 or newer.

## Layout

- `app/routers/`: HTTP endpoints, no business rules.
- `app/services/`: use cases and transactions (`app/db.py: transaction`).
- `app/repositories/`: database queries.
- `app/schemas.py`: request bodies and their limits. `app/validation.py` turns validation errors
  into `{"message", "errors": {field: [text]}}`.
- `app/resources.py`: JSON shapes returned to clients (responses are wrapped in `{"data": ...}`).
- `migrations/`: Alembic migrations.

Authentication is a bearer token returned by `POST /api/auth/register` and `POST /api/auth/login`.
