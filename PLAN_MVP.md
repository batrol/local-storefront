# Plan: MVP (v0.1), one merchant sells through a link

Goal: a merchant registers, creates products, keeps stock, shares a public catalog link; a
customer orders without an account; the merchant sees and updates orders. Stock drops
automatically on each order.

## Stack

- `api/`: Laravel 13 (PHP 8.5), Sanctum tokens, SQLite for dev/tests (MySQL-compatible
  migrations), PHPUnit, Pint, Larastan. Three layers: Controller → Service → Repository.
- `web/`: React 19, Vite, TypeScript, Tailwind 4, TanStack Query, react-hook-form + zod,
  react-router, Vitest. Capacitor wrapper for the mobile app comes after the MVP screens work.

## Contract (REST, JSON, prefix `/api`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | /auth/register | no | create merchant user + shop |
| POST | /auth/login | no | token |
| POST | /auth/logout | yes | revoke token |
| GET | /me | yes | user + shop |
| GET/POST | /categories | yes | list / create |
| PUT/DELETE | /categories/{id} | yes | update / delete |
| GET/POST | /products | yes | list / create |
| GET/PUT/DELETE | /products/{id} | yes | read / update / delete |
| POST | /products/{id}/stock | yes | adjust stock (delta + reason) |
| GET | /shops/{slug} | no | public shop info |
| GET | /shops/{slug}/products | no | public catalog (active products) |
| POST | /shops/{slug}/orders | no | customer creates order |
| GET | /orders | yes | merchant's orders |
| GET | /orders/{id} | yes | order detail |
| PATCH | /orders/{id}/status | yes | change status |

Order status (MVP): `pending → confirmed → ready → completed`, or `cancelled` (cancel returns
stock). Prices in integer cents.

## Tasks (check when merged and working)

### Backend
- [x] B1 Scaffold `api/`, SQLite, Sanctum, Pint, Larastan, architecture notes
- [x] B2 Auth: register (user + shop with slug), login, logout, me
- [ ] B3 Categories and products CRUD, scoped to the merchant's shop
- [ ] B4 Stock adjustment with movement log, low-stock flag
- [ ] B5 Public catalog by shop slug
- [ ] B6 Orders: create (transactional stock decrement, validation), list, detail, status, cancel returns stock
- [ ] B7 Feature tests for every endpoint, including cross-shop isolation

### Frontend
- [ ] F1 Scaffold `web/` (Vite, TS, Tailwind 4, router, query, Vitest), API client with token
- [ ] F2 Auth pages and guarded routes
- [ ] F3 Merchant: categories and products pages, stock adjust, low-stock badge
- [ ] F4 Public shop page, cart, checkout form
- [ ] F5 Merchant orders list/detail with status actions
- [ ] F6 Component tests for the main flows

### Closing
- [ ] D1 README run instructions, `.env.example` for api and web
- [ ] D2 End-to-end check by hand (register → product → public order → stock drops)

## Estado

See `local/ESTADO.md` (private working notes).
