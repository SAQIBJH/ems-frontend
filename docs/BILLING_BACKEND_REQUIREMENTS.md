# Billing API — Backend Requirements (handoff)

> **Author:** Frontend · **Date:** 2026-06-11 · **Status:** Billing is **NOT built**
> on the backend (verified below). Integrations are **DONE** (live).
>
> This document is the contract the frontend already expects. The backend should
> implement these endpoints to **exactly** this shape and casing. The canonical
> fixture lives at `src/mocks/handlers/billing.ts`; types at
> `src/modules/settings/types/settings.types.ts`. Original spec: `docs/phase2api.md`
> Domain 8.

---

## 1. Verification result (live sweep, 2026-06-11)

HR_ADMIN against production (`employee-management-system-2b9q.onrender.com/api/v1`):

| Area                        | Endpoint(s)                                                                  | Live status          |
| --------------------------- | ---------------------------------------------------------------------------- | -------------------- |
| **Integrations — Email**    | `GET/PATCH /settings/integrations/email`, `/email/stats`, `POST /email/test` | ✅ **LIVE — done**   |
| **Integrations — Storage**  | `GET/PATCH /settings/integrations/storage`, `POST /storage/test`             | ✅ **LIVE — done**   |
| **Integrations — Webhooks** | `GET/POST/PATCH/DELETE /settings/webhooks`, `/test`                          | ✅ **LIVE — done**   |
| **Billing — Subscription**  | `GET /billing/subscription`                                                  | ❌ **404 — missing** |
| **Billing — Plans**         | `GET /billing/plans`                                                         | ❌ **404 — missing** |
| **Billing — Invoices**      | `GET /billing/invoices`                                                      | ❌ **404 — missing** |

`/settings/billing/*` was also probed — also 404. So **Billing is the only Settings
gap.** Integrations need no backend work.

> **FE-side note (separate bug):** the billing MSW handler exists but is **not
> registered** in `src/mocks/handlers/index.ts`, so the Billing screens 404 in both
> mock and live mode today. The FE will wire/remove the mock once these ship — no
> backend action needed for that.

---

## 2. Conventions (apply to all three endpoints)

- **Base URL:** `/api/v1` (browser calls `/api/*`; the BFF forwards to the backend).
- **Method:** all **GET**, read-only. **No write endpoints required** — every plan
  action in the UI (Upgrade / Manage plan / Add seats / Unlock modules / Contact
  sales) is intentionally a no-op toast ("Contact your account manager to change
  your plan"). Do **not** build checkout/seat-change endpoints for this milestone.
- **Auth:** cookie-based JWT (same as the rest of the app). **Role: `SUPER_ADMIN`**
  (these screens are SUPER_ADMIN-only per the product spec). Return `403` for other
  roles.
- **Casing:** **camelCase** everywhere (e.g. `nextRenewalDate`, `usedBytes`,
  `seatsIncluded`, `dueDate`, `downloadUrl`). Do **not** use snake_case here.
- **Envelope:** standard success envelope — `{ "success": true, "data": <payload> }`.
  Errors use the standard error envelope (`{ success:false, error:{ code, message, … } }`).
- **Money:** `price` / `amount` are **plain numbers in major currency units** (e.g.
  `999` = ₹999, not paise/minor units). The UI formats with `Intl.NumberFormat` and
  `maximumFractionDigits: 0`. `currency` is an ISO 4217 code string (e.g. `"INR"`).
  `price` / `seatsIncluded` may be **`null`** for the Enterprise (“Custom”) plan.
- **Storage sizes:** **bytes** (`usedBytes`, `limitBytes`) — the UI converts to KB/MB/GB.
- **Dates:** full **ISO 8601** strings on read (e.g. `"2026-06-01T00:00:00.000Z"`).
  The UI parses with `parseISO`. `trialEndsAt` is nullable.
- **Tenant:** scope all data to the caller's tenant (from JWT). No tenant header.

---

## 3. `GET /billing/subscription`

The current tenant's active subscription. Single object.

**Response `data`** (`BillingSubscription`):

```json
{
  "plan": {
    "code": "professional",
    "name": "Professional",
    "price": 999,
    "currency": "INR",
    "interval": "monthly"
  },
  "status": "active",
  "seats": { "total": 50, "used": 25, "available": 25 },
  "usage": {
    "apiCalls": { "used": 12450, "limit": 50000 },
    "storage": { "usedBytes": 4509715456, "limitBytes": 21474836480 }
  },
  "modules": { "payroll": true, "recruitment": false, "performance": false },
  "currentPeriod": {
    "start": "2026-05-01T00:00:00.000Z",
    "end": "2026-05-31T23:59:59.000Z"
  },
  "nextRenewalDate": "2026-06-01T00:00:00.000Z",
  "trialEndsAt": null
}
```

| Field             | Type                                                  | Notes                                                            |
| ----------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| `plan.code`       | `"starter" \| "professional" \| "enterprise"`         | matches a plan `code` from `/billing/plans`                      |
| `plan.name`       | string                                                | display name                                                     |
| `plan.price`      | number                                                | major units; current plan always has a concrete price            |
| `plan.currency`   | string                                                | ISO 4217                                                         |
| `plan.interval`   | `"monthly" \| "annual"`                               |                                                                  |
| `status`          | `"active" \| "trialing" \| "cancelled" \| "past_due"` | drives the status badge                                          |
| `seats`           | `{ total, used, available }` (all number)             | `available = total − used`                                       |
| `usage.apiCalls`  | `{ used, limit }` (number)                            | progress bar                                                     |
| `usage.storage`   | `{ usedBytes, limitBytes }` (number, **bytes**)       | progress bar                                                     |
| `modules`         | `{ payroll, recruitment, performance }` (boolean)     | which modules the plan unlocks                                   |
| `currentPeriod`   | `{ start, end }` (ISO)                                | billing cycle window                                             |
| `nextRenewalDate` | ISO string                                            |                                                                  |
| `trialEndsAt`     | ISO string **or `null`**                              | non-null only when `status = "trialing"`; shows the trial banner |

---

## 4. `GET /billing/plans`

All purchasable plans for the comparison grid. **Array** (not paginated).

**Response `data`** (`BillingPlan[]`):

```json
[
  {
    "code": "starter",
    "name": "Starter",
    "price": 499,
    "currency": "INR",
    "interval": "monthly",
    "seatsIncluded": 10,
    "recommended": false,
    "features": [
      "Core HR modules",
      "Employee directory",
      "Attendance & Leave",
      "Holidays management",
      "10 seats included",
      "Email support"
    ],
    "modules": { "payroll": false, "recruitment": false, "performance": false }
  },
  {
    "code": "professional",
    "name": "Professional",
    "price": 999,
    "currency": "INR",
    "interval": "monthly",
    "seatsIncluded": 50,
    "recommended": true,
    "features": [
      "Everything in Starter",
      "Payroll module",
      "Reports & Analytics",
      "Webhooks & Integrations",
      "50 seats included",
      "Priority support"
    ],
    "modules": { "payroll": true, "recruitment": false, "performance": false }
  },
  {
    "code": "enterprise",
    "name": "Enterprise",
    "price": null,
    "currency": "INR",
    "interval": "monthly",
    "seatsIncluded": null,
    "recommended": false,
    "features": [
      "Everything in Professional",
      "Recruitment module",
      "Performance management",
      "Unlimited seats",
      "Dedicated CSM",
      "Custom integrations",
      "SLA guarantee"
    ],
    "modules": { "payroll": true, "recruitment": true, "performance": true }
  }
]
```

| Field           | Type                                              | Notes                                                                                             |
| --------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `code`          | `"starter" \| "professional" \| "enterprise"`     | the plan whose `code` equals `subscription.plan.code` renders as “Current plan” (button disabled) |
| `price`         | number **or `null`**                              | `null` → UI shows “Custom” + a “Contact sales” button                                             |
| `seatsIncluded` | number **or `null`**                              | `null` → not displayed (Enterprise = unlimited)                                                   |
| `recommended`   | boolean                                           | exactly one plan should be `true` (highlighted, “Recommended” pill)                               |
| `features`      | string[]                                          | rendered as a checklist, in order                                                                 |
| `modules`       | `{ payroll, recruitment, performance }` (boolean) |                                                                                                   |

---

## 5. `GET /billing/invoices`

Paginated invoice history.

**Query params:** `page` (default `1`), `limit` (default `20`).

**Response `data`** (`InvoicesResponse`):

```json
{
  "invoices": [
    {
      "id": "inv_01JA2B3C4D",
      "number": "INV-2026-005",
      "description": "Professional Plan — May 2026",
      "date": "2026-05-01T00:00:00.000Z",
      "dueDate": "2026-05-07T00:00:00.000Z",
      "period": { "start": "2026-05-01T00:00:00.000Z", "end": "2026-05-31T23:59:59.000Z" },
      "amount": 999,
      "currency": "INR",
      "status": "paid",
      "downloadUrl": "https://billing.example.com/invoices/inv_01JA2B3C4D.pdf"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
}
```

| Field         | Type                                        | Notes                                                                                                                                                                                                                       |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`          | string                                      | invoice id                                                                                                                                                                                                                  |
| `number`      | string                                      | human invoice no. (e.g. `INV-2026-005`)                                                                                                                                                                                     |
| `description` | string                                      | line description                                                                                                                                                                                                            |
| `date`        | ISO string                                  | issue date                                                                                                                                                                                                                  |
| `dueDate`     | ISO string                                  |                                                                                                                                                                                                                             |
| `period`      | `{ start, end }` (ISO)                      | service period covered                                                                                                                                                                                                      |
| `amount`      | number                                      | major units                                                                                                                                                                                                                 |
| `currency`    | string                                      | ISO 4217                                                                                                                                                                                                                    |
| `status`      | `"paid" \| "pending" \| "failed" \| "void"` | drives the status badge                                                                                                                                                                                                     |
| `downloadUrl` | string (URL)                                | **must be a real, openable URL to the invoice PDF** — the UI opens it in a new tab (`<a href={downloadUrl} target="_blank">`). A signed/expiring URL is fine. If a PDF isn't ready, return a URL that resolves (not `"#"`). |

> `pagination` shape is **`{ page, limit, total, totalPages }`** (note `totalPages`,
> not `pages`). The “Export CSV” button in the UI is built client-side from the
> loaded rows — **no CSV endpoint needed.**

---

## 6. Error / empty behavior

- **Empty invoices:** return `{ invoices: [], pagination: { page, limit, total: 0, totalPages: 0 } }` (200). The UI renders its own empty state.
- **No subscription for tenant:** prefer returning a valid `subscription` object (e.g. a free/trial default) over 404, so the screen doesn't error. If truly none, `404 NOT_FOUND` is acceptable — the UI shows an error state with retry.
- **Wrong role:** `403`.
- **Unauthenticated:** `401` (standard).

---

## 7. Definition of done (backend)

- [ ] `GET /billing/subscription` → `200 { success, data: BillingSubscription }`, camelCase, SUPER_ADMIN-scoped, tenant-scoped.
- [ ] `GET /billing/plans` → `200 { success, data: BillingPlan[] }` (array), with exactly one `recommended: true`.
- [ ] `GET /billing/invoices?page&limit` → `200 { success, data: { invoices, pagination } }`, `pagination` = `{ page, limit, total, totalPages }`.
- [ ] `downloadUrl` on each invoice resolves to a real PDF (openable in a new tab).
- [ ] Money in **major units**, storage in **bytes**, dates **ISO**, `price`/`seatsIncluded` nullable for Enterprise.
- [ ] Other roles → `403`; unauthenticated → `401`.

Once live, the FE flips off / removes the `billing.ts` mock — **no FE code change**
beyond that (same pattern as the rest of the live transition).
