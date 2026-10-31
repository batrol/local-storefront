# publicidade-local

One app that brings e-commerce to the small merchants of a single city, coordinates the
delivery, and offers a personal-shopping service for customers.

> **Status: planning.** Design started on 2026-08-24 (first diagram in [`docs/`](docs/)).
> Code is built following [`ROADMAP.md`](ROADMAP.md). Nothing is claimed as implemented
> until it is checked off there.

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

To be decided and recorded here with the first commit that adds code. Planned shape: one
backend/API shared by a mobile app and a web app.

## How to run

Not available yet. Configuration uses environment variables: copy `.env.example` to `.env`
and fill in placeholders. Never commit real secrets.

## Data

Only made-up sample data is used in this repository. No real merchant, customer or courier data.

## License

[MIT](LICENSE) © 2026 Plínio Almeida
