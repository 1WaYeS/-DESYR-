# DESYR — Price Drop Alerts

Implementation guide and manual test checklist. Reviewed against the project source on 16 November 2026.

## Purpose and deployment status

Customers can save a desired percentage discount for a garment and manage their price alerts without leaving DESYR. The feature is integrated into all three magazines and into Complete the Look pairing pages.

The public frontend currently runs a clearly labelled **browser preview**. It stores alerts on the device and can simulate a target being reached. It does not monitor brand websites or send email. A Django backend is implemented separately, but live operation requires hosting, an official price integration and email delivery configuration.

## Customer journey inside the magazine

1. Select a product and choose **Notify me of a price drop** beside its price on the right page.
2. Select a discount of 10%, 20%, 30%, 40% or 50%.
3. Review the reference price and calculated target, then save the alert.
4. Open the bell icon to access **My Price Alerts**.
5. Review alerts, change the discount, pause/resume or delete an alert, and inspect notification history.
6. In browser preview only, choose **Simulate target price** to demonstrate triggering without sending email.

The creation dialog uses the current magazine's brand theme. The manager uses a two-page presentation with responsive list/detail navigation. Its overlay blocks background magazine keyboard turns and manages dialog focus.

## Prices and alert rules

```text
Target price = reference price × (100 − chosen discount) / 100
Trigger condition = current selling price ≤ target price
```

For example, a reference price of ৳2,000 and a 20% threshold gives a target of ৳1,600. A selling price of ৳1,600 or less qualifies. Another customer's 30% alert has an independent target of ৳1,400.

The reference price is distinct from the current selling price. Changing a customer's threshold keeps that alert's reference snapshot fixed. An authorized catalog reference-price revision can update open alerts and recalculate their targets; it is audited and does not itself send notifications.

The frontend uses integer minor units rather than floating-point currency calculations. Backend prices use Decimal with half-up rounding, and responses expose minor-unit values. The API calculates trusted targets itself and ignores submitted reference or target prices.

| Alert state | Meaning |
| --- | --- |
| ACTIVE | Waiting for a qualifying selling price |
| PAUSED | Temporarily excluded from triggering |
| TRIGGERED | One notification event has been recorded |
| CANCELLED | Deleted from active use; audit/history retained |

Only one ACTIVE or PAUSED alert is allowed per customer and product. Triggered alerts do not automatically restart after another price drop or an edit. Another notification cycle requires an explicit new alert. Delivery status is separate from alert status: a triggered preview is not a sent email.

## Frontend implementation

| Source file | Responsibility |
| --- | --- |
| `src/features/price-alerts/model.ts` | Types, exact price parsing, targets, preview lifecycle and safe storage hydration |
| `src/features/price-alerts/PriceAlertsContext.tsx` | Shared state, mode selection, API requests, authentication and refresh |
| `src/features/price-alerts/PriceAlertsUI.tsx` | Product trigger, price display, bell, creation dialog, manager and history |
| `src/features/price-alerts/price-alerts.css` | Brand themes, two-page manager and responsive layout |
| `src/App.tsx` | Application-level provider and interface integration |
| `src/components/CategoryShopping.tsx` | Alert controls on ordinary shopping spreads |
| `src/components/CompleteLookSpread.tsx` | Alert controls for outfit pairings |
| `scripts/test-price-alerts.cjs` | Frontend model tests |

Without `VITE_PRICE_ALERT_API_URL`, the context uses localStorage key `desyr-price-alerts-preview-v1`. Preview notifications are always marked PREVIEW, never SENT. Storage is synchronized across tabs; malformed saved entries are filtered.

With an API URL configured at build time, the context loads the session and server-held products, then fetches the signed-in customer's alerts. It refreshes approximately every 30 seconds and when management is opened. Requests use session cookies and CSRF tokens. An expired session clears private alert state. API errors do not silently switch the customer to local preview mode. The `#/price-alerts` hash opens the manager directly.

## Backend implementation

| Source location | Responsibility |
| --- | --- |
| `backend/price_alerts/models.py` | Product mirror, verified email identity, alerts, price events and notifications |
| `backend/price_alerts/services.py` | Trusted price updates, lifecycle rules, transactions and notification processing |
| `backend/price_alerts/tasks.py` | Celery processing and recovery tasks |
| `backend/price_alerts/views.py` and `urls.py` | Session, customer-alert and authorized price-update API |
| `backend/price_alerts/templates/price_alerts/` | HTML and plain-text email templates |
| `backend/price_alerts/tests.py` | Backend correctness and access-control tests |
| `backend/compose.yaml` | Packaged database, queue, web, worker and scheduler services |
| `backend/README.md` | Full setup, API, deployment and operating instructions |

The main data relationships are:

```text
User → AlertIdentity (confirmed email)
User + CatalogProduct → PriceAlert
CatalogProduct → PriceEvent → PriceNotification
PriceAlert → at most one PriceNotification
```

An authorized selling-price update creates an immutable event inside a transaction. After commit, a Celery worker evaluates eligible alerts against that event's saved price. A short discount is therefore not lost if the catalog price rebounds before the worker runs.

Unique keys, request UUIDs, row locking and notification ownership prevent duplicate open alerts and repeated notification records. Customers can access only their own alerts. Price writes require catalog-change permission; customer creation requires a confirmed email address bound to the account.

The persisted event queue can recover after broker failure. A scheduled reconciliation task runs every five minutes to recover queued work and safe retries. This schedule does not scrape or poll the brands' websites.

## API summary

All paths below are relative to `/api/price-alerts/`.

| Method and path | Purpose |
| --- | --- |
| GET `session/` | Session, CSRF token and operating mode |
| POST `login/`, POST `logout/` | Sign in/out using existing accounts |
| GET `products/` | Server-held product prices |
| GET `alerts/` | Customer's alerts and history |
| POST `alerts/` | Create using product ID, discount and retry-safe request UUID |
| POST `alerts/<uuid>/` | Edit, pause, resume or delete |
| POST `products/<external-id>/price/` | Authorized operator's audited selling/reference price update |

## Email delivery and production requirements

Backend preview mode records PREVIEW and never calls SMTP. Real delivery requires SMTP mode, a verified recipient and an officially integrated product marked live. HTML and plain-text emails include the product link and relevant price snapshots.

Delivery states include PENDING, SENDING, RETRY, SENT, PREVIEW, FAILED and UNKNOWN. Known temporary rejections can retry up to five attempts. Ambiguous SMTP outcomes become UNKNOWN for operator reconciliation rather than blind resending. SENT means SMTP acceptance, not guaranteed inbox delivery; plain SMTP cannot guarantee exactly-once delivery across every crash scenario.

GitHub Pages hosts the React frontend only. Production needs a Python host, MySQL, Redis, Celery worker/scheduler, HTTPS, a configured email provider and a trusted official product-price source. There is no active official brand-price feed in the current project. Credentials belong in backend environment variables, never frontend Vite variables. Cross-domain session-cookie restrictions must also be addressed when connecting the hosted frontend to the API.

## Running and verification

Frontend preview from the project root:

```powershell
npm.cmd ci
npm.cmd run test:alerts
npm.cmd run build
npm.cmd run dev
```

For backend setup, follow [the backend guide](../backend/README.md). Once its environment and dependencies exist:

```powershell
backend/.venv/Scripts/python.exe backend/manage.py test price_alerts --settings=desyr_backend.test_settings
```

The backend suite currently contains 24 tests; the local run passed 23 and skipped the MySQL-specific concurrency test. A SQLite development run does not validate production MySQL concurrency. SMTP, Redis workers and Docker services still need environment-specific verification before live delivery.

| Manual check | Expected result | Tester result / evidence |
| --- | --- | --- |
| Create an alert from each magazine | Correct product and magazine theme | Not recorded |
| Test all five discounts | Target matches the reference and selected percentage | Not recorded |
| Try a duplicate ACTIVE or PAUSED alert | Existing alert is managed rather than duplicated | Not recorded |
| Edit the threshold | Reference remains fixed; target changes | Not recorded |
| Pause and simulate, then resume | Paused alert does not trigger; eligible resumed alert can trigger | Not recorded |
| Simulate an active target repeatedly | One PREVIEW event; no email claimed or sent | Not recorded |
| Delete and inspect history | Alert is cancelled; existing history remains | Not recorded |
| Reload browser preview | Saved alerts remain on that device | Not recorded |
| Test API sessions and another customer's alert ID | Authentication/ownership restrictions are enforced | Not recorded |
| Disconnect the configured API | Clear error; no silent browser-preview fallback | Not recorded |

## Contributor review record

This guide was prepared with AI assistance from the existing source. It does not establish who originally implemented the feature. Complete these fields and test results after performing the review; never record real passwords or private customer data.

- Reviewer / GitHub username: _To be completed_
- Review date and tested commit: _To be completed_
- Documentation corrections or code changes made: _To be completed_
- Remaining issues: _To be completed_
