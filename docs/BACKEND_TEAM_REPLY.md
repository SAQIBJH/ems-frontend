# Reply to the Backend Team — Fixes Verified, 2 Items Open (BE-1 partial, BE-12 new)

> **From:** Frontend team · **Date:** 2026-06-10
> **Re:** your fix report for the 11 contract issues + analytics filters.
> We re-verified **every** item against the **live** backend (mocks OFF) as the real
> roles. **Thank you — 11 of 12 are confirmed fixed.** Two items need attention:
> **BE-1** is only **partially** fixed, and **BE-12** (logout doesn't fully end the
> session) is a **new** issue we found during logout QA. Details below; this note is
> self-contained.

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

## 🆕 New issue: BE-12 — logout does not fully end the session (access token survives)

Found during logout QA. **`POST /auth/logout` only deletes the `refreshToken`; the
`accessToken` is neither cleared from the browser nor revoked server-side**, so the user
stays authenticated for up to the access-token TTL (~15 min) after "logging out."

### Exact live results

```
LOGIN  → Set-Cookie: refreshToken=…  (Max-Age 604800)
         Set-Cookie: accessToken=…   (Max-Age 900; stateless JWT)

POST /auth/logout (200)
       → Set-Cookie: refreshToken=; Expires=1970     ← clears refresh ONLY
       → (NO Set-Cookie for accessToken)             ← access cookie NOT cleared

GET /auth/me  reusing the original cookies AFTER logout      -> 200  ❌ still authenticated
GET /auth/me  with accessToken ONLY (refreshToken deleted)   -> 200  ❌ still valid
```

### User-visible symptom

Click **Logout** → redirected to `/login` → press the **browser Back button** → a
protected route loads **still logged in**. Two compounding effects: the browser restores
the page from **bfcache**, and even on refetch `GET /auth/me` returns **200** because the
access cookie is still live and the JWT is still accepted.

### Root cause (two gaps, both backend)

1. **The `accessToken` cookie is never cleared on logout** — logout sends a clearing
   `Set-Cookie` for `refreshToken` but **none** for `accessToken`, so the browser keeps
   sending a valid access cookie. (We confirmed our BFF forwards every `Set-Cookie` you
   send unchanged — you're simply not sending one for `accessToken`.)
2. **The access token isn't revoked server-side** — it's a **stateless JWT** validated by
   signature + `exp` only, not checked against a session denylist. Deleting the refresh
   token stops _renewal_ but the existing access token stays valid until `exp`. The JWT
   already carries a `sessionId`, but logout doesn't invalidate that session.

### The ask 🛠️

1. **Clear the access cookie on logout** — also send
   `Set-Cookie: accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`
   (same attributes as when it's set), alongside the existing `refreshToken` clear.
2. **Revoke the session server-side** — on logout, mark the token's `sessionId` revoked,
   and have `authenticate` reject any access token whose session is revoked. (Your session
   infra already exists — `logout-all` + `/auth/sessions` — logout should revoke the
   _current_ session and `authenticate` should check it.)

**Both are needed:** clearing the cookie fixes the normal-browser case; server-side
revocation is the actual security guarantee (a stateless JWT stays cryptographically valid
until `exp` regardless of the cookie — a copied token would still work for ~15 min).

### Severity

**Medium (security).** A "logged-out" user remains authenticated for up to the access-TTL,
and Back-button restores a live session. The frontend already calls logout, clears its
cache, and hard-redirects — but it **cannot** clear httpOnly cookies or revoke a JWT; that
must be backend-side. (We can add a bfcache UX guard, but it won't close the hole.)

---

## Quick reference

| Item              | Status (live-verified)                                                                                                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BE-1              | ⚠️ Partial — no-cookie / garbage token still `400 INVALID_TENANT` (fix the absent-token path → `401`)                                                                                       |
| BE-2              | ✅ Fixed                                                                                                                                                                                    |
| BE-3              | ✅ Fixed                                                                                                                                                                                    |
| BE-4              | ✅ Fixed                                                                                                                                                                                    |
| BE-5              | ✅ Fixed                                                                                                                                                                                    |
| BE-6              | ✅ Fixed                                                                                                                                                                                    |
| BE-7              | ✅ Fixed                                                                                                                                                                                    |
| BE-8              | ✅ Fixed                                                                                                                                                                                    |
| BE-9              | ✅ Fixed                                                                                                                                                                                    |
| BE-10             | ✅ Fixed                                                                                                                                                                                    |
| BE-11             | ✅ Fixed                                                                                                                                                                                    |
| Analytics filters | ✅ Fixed (department filter live on headcount / attendance / recent-activity / leave-summary; the trend endpoints accept-but-ignore by design — fine)                                       |
| **BE-12**         | 🆕 **NEW** — logout clears only `refreshToken`; `accessToken` is neither cleared nor revoked → user stays authenticated ~15 min after logout (clear the access cookie + revoke the session) |

---

_PS — minor housekeeping: a leftover custom role **"Evidence Role"** (`evidence-role-…`)
from your verification is still in the shared test tenant. Harmless, but it shows up as an
extra custom role in the Permissions matrix — feel free to delete it when convenient._
