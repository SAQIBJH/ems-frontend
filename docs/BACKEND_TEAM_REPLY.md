# Reply to the Backend Team — Fixes Verified, One Item Still Open (BE-1)

> **From:** Frontend team · **Date:** 2026-06-10
> **Re:** your fix report for the 11 contract issues + analytics filters.
> We re-verified **every** item against the **live** backend (mocks OFF) as the real
> roles. **Thank you — 11 of 12 are confirmed fixed.** One item, **BE-1**, is only
> **partially** fixed. Details below; this note is self-contained.

---

## ✅ Confirmed fixed (verified live)

**BE-2, BE-3, BE-4, BE-5, BE-6, BE-7, BE-8, BE-9, BE-10, BE-11, and the analytics
filters** all check out against the live API. Highlights:

- **BE-9 (reports export)** now works **end-to-end**: `POST /reports/export` → `202`
  with `jobId` → `GET /reports/export/:jobId` → `200 SUCCESS` → `GET
/reports/export/:jobId/download` → `200` with `Content-Type: text/csv`. 🎉
- **BE-10 / BE-11 (custom roles)** now fully work: `POST /settings/roles` persists the
  `permissions[]`, and `GET /settings/roles-permissions` returns `customRoles[]`.

No further action needed on those. 🙏

---

## ⚠️ Still open: BE-1 — only the "decodable JWT" case is fixed

Your change correctly handles a **readable** token whose tenant doesn't resolve — that
now returns `401`. But the **no-token** and **unreadable-token** cases still return
`400 INVALID_TENANT`, which should also be `401`.

### Exact live results — `GET /auth/me`

```
GET /auth/me   (no cookie at all)            -> 400 INVALID_TENANT   ❌ expected 401
GET /auth/me   (garbage / unparseable token) -> 400 INVALID_TENANT   ❌ expected 401
GET /auth/me   (well-formed JWT, tenant not found, expired) -> 401 INVALID_TOKEN   ✅ fixed
```

### Why the "no cookie" case is the one that actually matters

The access token is an **httpOnly cookie with an expiry**. When it expires, **the
browser deletes it and stops sending it** — so a returning user with an expired session
hits `GET /auth/me` with **no cookie at all**. That is exactly the case still returning
`400`. So the practical "session expired on a returning user" scenario is **not yet
resolved**.

### Root-cause (matches your own analysis)

`resolveTenant` runs before `authenticate`. Your fix passes through when a **decoded
`tenantId`** fails to resolve. But when there is **no usable tenant identifier at all**
(no cookie, or a token that can't be decoded to a `tenantId`), `resolveTenant` still
throws `400 INVALID_TENANT` itself, so `authenticate` never gets to return `401`.

### The ask 🛠️

In `resolveTenant`, also **pass through** (let `authenticate` return `401`) when there
is **no tenant identifier at all** — i.e. **no cookie / unparseable token** — not only
when a decoded `tenantId` fails to resolve. In short: _absence of a valid token →
`401`, never `400 INVALID_TENANT`._

### Severity / impact

**Low, non-blocking.** Our frontend has a safety net that treats `400 INVALID_TENANT`
like `401`, so the app behaves correctly today. The only effects are (1) a stray `400`
console error on a logged-out/expired page load, and (2) we can't remove that workaround
until `/auth/me` returns a proper `401`. Please fold this into the next pass — no rush.

---

## Quick reference

| Item              | Status (live-verified)                                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-1              | ⚠️ Partial — no-cookie / garbage token still `400 INVALID_TENANT` (fix the absent-token path → `401`)                                                 |
| BE-2              | ✅ Fixed                                                                                                                                              |
| BE-3              | ✅ Fixed                                                                                                                                              |
| BE-4              | ✅ Fixed                                                                                                                                              |
| BE-5              | ✅ Fixed                                                                                                                                              |
| BE-6              | ✅ Fixed                                                                                                                                              |
| BE-7              | ✅ Fixed                                                                                                                                              |
| BE-8              | ✅ Fixed                                                                                                                                              |
| BE-9              | ✅ Fixed                                                                                                                                              |
| BE-10             | ✅ Fixed                                                                                                                                              |
| BE-11             | ✅ Fixed                                                                                                                                              |
| Analytics filters | ✅ Fixed (department filter live on headcount / attendance / recent-activity / leave-summary; the trend endpoints accept-but-ignore by design — fine) |

---

_PS — minor housekeeping: a leftover custom role **"Evidence Role"** (`evidence-role-…`)
from your verification is still in the shared test tenant. Harmless, but it shows up as an
extra custom role in the Permissions matrix — feel free to delete it when convenient._
