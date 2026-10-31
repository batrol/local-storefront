# Roadmap

🇺🇸 English · [🇧🇷 Português (Brasil)](ROADMAP.pt-BR.md)

Check an item only when it is merged and working. We start with the smallest slice that
works end to end and add one of the three services per version.

## MVP (v0.1): one merchant sells through a link
- [x] Choose and document the tech stack; API and web skeletons, lint, tests, CI (mobile wrapper still to do)
- [x] Merchant login (single role)
- [ ] Products and categories (name, price, photo, description)
- [x] Public catalog page per merchant on the web (shareable link)
- [ ] Merchant web panel and mobile app, both on the same API
- [x] Cart and order creation (customer name + phone, pickup or delivery)
- [x] Order list for the merchant with status changes
- [x] Basic stock maintained in the app: set/adjust quantity per product, automatic decrement on order, low-stock flag

## v0.2: stock and order reliability
- [ ] Stock reservation on order, release on cancel, movement history
- [ ] Full order state machine and status tracking page for the customer
- [ ] In-store sales with stock write-off
- [ ] Stock maintenance from the phone: quick entry/exit, adjustment with reason, inventory count
- [ ] Barcode scan to find a product or add stock
- [ ] Low-stock alerts to the merchant
- [ ] Order notification to the merchant

## v0.3: delivery coordinated by the app
- [ ] Courier role and registration (mobile app first)
- [ ] Delivery request created from an order (pickup address, destination, fee)
- [ ] Assignment to a courier (manual first, then automatic)
- [ ] Delivery status flow: assigned, picked up, on the way, delivered
- [ ] Delivery confirmation (code or photo) and courier history

## v0.4: multi-merchant platform
- [ ] Several merchants on one installation, isolated data
- [ ] Operator panel to onboard and support merchants
- [ ] Delivery areas, fees and deadlines
- [ ] Audit history of actions

## v0.5: shopping service
- [ ] Customer creates a shopping request (list of items, shops, budget)
- [ ] Shopper accepts, buys, reports price changes or missing items
- [ ] Customer approval of substitutions and final total
- [ ] Delivery of the purchase reusing the v0.3 flow

## Later
- [ ] Online payment (PIX) and payouts
- [ ] Ratings for merchants, couriers and shoppers
- [ ] Customer accounts and order history
- [ ] Reports (sales, stock, deliveries)
- [ ] Backups and security review
