# local-storefront

🇺🇸 English · [🇧🇷 Português (Brasil)](README.pt-BR.md)

One app that brings e-commerce to the small merchants of a single city, coordinates the
delivery, and offers a personal-shopping service for customers.

> **Status: MVP in progress.** Design started on 2026-08-24 (first diagram in [`docs/`](docs/)).
> Code is built following [`ROADMAP.md`](ROADMAP.md) and [`PLAN_MVP.md`](PLAN_MVP.md). Nothing is
> claimed as implemented until it is checked off there.

## The idea

Available as a **mobile app and on the web**, sharing the same backend and data.

Three services in a single app, focused on one city and on close local support:

1. **E-commerce for small merchants.** Each shop gets a catalog, stock control, order
   management and a shareable order link, without needing its own online store. Stock is
   maintained from the app or the web panel: entries, exits, adjustments and counts.
2. **Delivery coordinated by the app.** Orders are dispatched to local couriers, with
   assignment, status tracking and delivery confirmation.
3. **Shopping service for the customer.** The customer asks for items (from one or several
   shops) and a shopper buys and delivers them.

## Who it is for

- **Merchants** of the city: sell online, manage stock and orders.
- **Customers:** order from local shops, follow the delivery, or ask someone to shop for them.
- **Couriers / shoppers:** receive and complete deliveries and shopping requests.
- **Platform operator:** onboards merchants and gives them direct local support.

## Planned modules

Catalog · Stock · Orders · Delivery coordination · Shopping requests · Customers · Admin,
plus authentication, notifications, audit history and reports. Delivery order (MVP first,
then versions) is in [`ROADMAP.md`](ROADMAP.md).

## Tech stack

- `api/`: Python 3.12+, FastAPI, SQLAlchemy 2 and Alembic, bearer-token auth, SQLite in dev and tests,
  three layers (router → service → repository). pytest, Ruff and mypy.
- `web/`: React 19, Vite, TypeScript, Tailwind 4, TanStack Query, react-hook-form + zod,
  React Router, Vitest + Testing Library.
- Mobile: the web app will be wrapped with Capacitor after the MVP screens are done.

## How to run

API (needs Python 3.12 or newer):

```sh
cd api
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload --port 8000   # http://127.0.0.1:8000, docs at /api/docs
pytest
```

Web (needs Node 22+):

```sh
cd web
cp .env.example .env         # optional: VITE_API_URL is empty in dev, Vite proxies /api
npm install
npm run dev                  # http://localhost:8080
npm test                     # Vitest
```

Open `/register` to create a merchant and shop; the public storefront is at `/shop/<shop-slug>`.
Never commit real secrets: `.env` files are ignored.

## Languages

English is the default, for the app, the API messages and the documentation. Brazilian Portuguese
(pt-BR) is fully available: the app has a language switcher, the API follows the `Accept-Language`
header, and the docs have `*.pt-BR.md` versions.

## Data

Only made-up sample data is used in this repository. No real merchant, customer or courier data.

## License

[MIT](LICENSE) © 2026 Plínio Almeida
