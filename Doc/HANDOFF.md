# Hairdresser Booking Platform: Handoff for the Next Model

As of 2026-10-24. The app branch is `hairdresser-main`; the code described below is committed and pushed there.

**Read this first.** It is a multi-shop barbershop booking site in Persian (RTL). It runs on **Cloudflare Workers + D1**, and the code lives on GitHub. The owner is a single developer, Mohsen Iziy (GitHub `moh3niziy`). They write in Persian and expect Persian replies. They commit and push **themselves**: you must never run `git commit` or `git push`. Hand them a one-line commit message and the command after each finished task (see section 10).

---

## 1. What the product is

A booking and schedule tool that replaces a barbershop's paper appointment book.

- **Customers** open a shop's page and see the free time slots for each barber per day. They cannot book online; they **call** the barber to book.
- **Barbers / owners** use an admin panel to record appointments. They pick predefined services (name + duration) with one click, and the end time is computed automatically.
- **Site admin (the user, "Moh3n")** manages many shops: create, disable, delete, subscriptions, and leads.
- **Business model:** paid monthly subscriptions per shop. A public "join" page collects leads from shops that want their own site.

Pricing shown on the join page (Toman) — these are the **defaults** in `DEFAULT_PLANS`; the super can change every price and crossed-out "before" price from the home panel, and the live values are stored in `meta.plans`:

| Plan | Default price | Notes |
|---|---|---|
| Monthly | 1,000,000 | «پرداخت ماه‌به‌ماه», no long-term commitment |
| 3 months | 2,000,000 | shown against 3,000,000, ≈667k/month |
| 6 months | 3,000,000 | shown against 6,000,000, marked «به‌صرفه‌ترین» |

«به‌صرفه‌ترین» is computed, not hardcoded: `best` in `renderJoin` picks the plan with the highest discount percentage, so changing the tariffs in the panel can move the badge.

There is **no purchasable 12-month plan** — the user confirmed on 2026-10-24 («۱۲ ماهه نداریم فعلا»). `PLAN_MONTHS = [1, 3, 6]` is what the join form and the renewal dialog offer. There is also **no Instagram gift offer any more**: «+1 month free» was removed from the join page at the user's request («all plans are paid»), and the words `هدیه`/`gift` no longer appear anywhere in `public/`.

Note that `FREE_DAYS = 30` still grants a month automatically at shop creation — decided against, not yet changed (see §7 and section 12).

---

## 2. Infrastructure

| Thing | Value |
|---|---|
| Local path | `/Users/moh3niziy/Desktop/Sites/Hairdresser` |
| GitHub | `https://github.com/moh3niziy/Hairdresser` |
| **App branch** | `hairdresser-main` — this is where all the Worker code lives and where you work |
| `main` | **unrelated orphan branch**: the old GitHub Pages resume site (`CNAME`, `index.html`, `build-pdf.sh`, two resume PDFs). It has no `worker.js`, no common ancestor with `hairdresser-main`, and Pages is unpublished. Never merge the two, and never judge the app from `main` |
| Hosting | Cloudflare Workers, worker name `hairdresser`, account `Moh3niziy@gmail.com` |
| Main URL | `https://hairdresser.moh3niziy.workers.dev` |
| Deploy | Cloudflare Workers Builds is connected to the repo and deploys **`hairdresser-main`** (command `npx wrangler deploy`). Verified 2026-10-24: production answers `GET /api/plans`, code that exists only on that branch |
| Database | Cloudflare D1, name `hairdresser-db`, id `9056ff39-043b-4252-8f00-5e2a8847fb00`, binding `DB` |
| Secrets (Cloudflare dashboard → Worker → Settings → Variables and Secrets, type **Secret**) | `ADMIN_USERNAME` = `Moh3n`, `ADMIN_PASSWORD` = known to the user (never write it into code or the repo) |
| Custom domain | `moghadamsbz.ir` + `www.moghadamsbz.ir` (zone on Cloudflare, nameservers `burt.ns.cloudflare.com` / `julissa.ns.cloudflare.com`, registered at IRNIC). It maps to shop `74260cf61a` («پیرایش مقدم») |
| Support contact (shown to shops for renewals and sales) | phone `09399515814`, Telegram `@moh3nIziy` (constant `SUPPORT` in `worker.js`) |
| Payment | card-to-card only: `PAYMENT = { card, holder }` in `worker.js:32`, served by `GET /api/support`. The user confirmed the card number being public in the repo is **intentional**; the wish is to make it editable from the panel, not to hide it |

GitHub Pages was used early on and is now **unpublished**; the orphan `main` branch is all that remains of it. Do not reintroduce Pages.

`wrangler.jsonc` (complete):

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "hairdresser",
  "main": "worker.js",
  "compatibility_date": "2025-09-01",
  "assets": { "directory": "./public", "binding": "ASSETS" },
  "d1_databases": [{ "binding": "DB", "database_name": "hairdresser-db", "database_id": "9056ff39-043b-4252-8f00-5e2a8847fb00" }]
}
```

There is no `vars` block on purpose. Admin credentials are secrets, and a `vars` entry with the same name would conflict.

---

## 3. Repository layout

```
worker.js          (1086 lines) Cloudflare Worker: all /api routes, auth, D1 schema + migrations
wrangler.jsonc     Worker config (assets + D1 binding)
public/index.html  (58 lines) Shell page: topbar, #app, #modalRoot, theme bootstrap, on-screen crash reporter
public/app.js      (2523 lines) whole front end (vanilla JS, no build step, no framework)
public/styles.css  (769 lines) design tokens (light/dark), components, RTL, responsive
Doc/HANDOFF.md     this file
Doc/HANDOFF.pdf    a rendered snapshot from 2026-10-17 — **stale**, not regenerated on purpose
test/smoke.mjs     API smoke test (777 lines) — run with `node test/smoke.mjs` (see §9)
test/mock-d1.mjs   dependency-free D1 mock over node:sqlite (50 lines)
README.md          empty (the user cleared it on GitHub; leave it unless asked)
.gitignore
```

There used to be stale copies of `app.js`, `styles.css` and `worker.mjs` in the repository root. They were never served (wrangler only reads `worker.js` and `./public`) and have been deleted; nothing imported them.

There are no npm dependencies and no build. Static files are served by Workers static assets. The Worker only runs for paths that do not match a file, which means `/api/*` and `/admin`.

`public/index.html` references assets with **absolute** paths (`/app.js`, `/styles.css`) so that `/admin/` also works.

---

## 4. Data model (D1)

The schema is created and migrated automatically on the first request (`migrate()` in `worker.js`, lines 125-179). There are no migration files.

```sql
shops(id TEXT PK, name, location, data TEXT /*JSON*/, version INTEGER, created_at INTEGER,
      active INTEGER DEFAULT 1, telegram TEXT DEFAULT '', instagram TEXT DEFAULT '',
      expires_at TEXT DEFAULT '' /* 'YYYY-MM-DD', last active day, Tehran date */,
      owner_name TEXT DEFAULT '', owner_phone TEXT DEFAULT '' /* super-only contact, never shown to customers */)
accounts(shop_id, username, pass /* 'salt$sha256' */, role /* owner|barber */, barber_id, PK(shop_id, username))
meta(key PK, value)   -- 'secret' = random HMAC key for tokens · 'plans' = JSON tariff edited by the super · 'schema' = schema version marker (see below)
leads(id PK, name, phone, note, source_shop, status /* new|contacted|paid|done|rejected */, ip, created_at,
      shop_name, city, plan INTEGER, amount INTEGER, token /* order cookie */, shop_id /* set when the shop was built from it */)
receipts(id PK, lead_id, shop_id, plan INTEGER, amount INTEGER, image TEXT /* data URL, emptied after 30 days */,
         status /* new|done|rejected */, created_at)   -- shop_id set = renewal receipt, lead_id set = join-order receipt
auth_log(key PK /* 'super|ip' or '<shopId>|ip' */, tries INTEGER, blocked_until INTEGER /* epoch ms */,
         updated_at INTEGER /* epoch ms, also the prune marker */)   -- failed-login counter for the two login routes
```

- **`shops.data` JSON:** `{ barbers: [...], appointments: [...] }`.
  - **barber:** `{ id, name, phone, owner?: true, hours: { "0".."6": {on, start:"HH:MM", end} }, services: [{id, name, minutes}] }`. The hours keys follow `Date.getDay()`: 0 = Sunday … 6 = Saturday. The UI shows the Iranian week starting Saturday.
  - **appointment:** `{ id, barberId, date:"YYYY-MM-DD", start, end, customerName, customerPhone, services:[{id,name,minutes}], createdAt }`.
- **Optimistic concurrency:** the client sends `version`. The server does `UPDATE … WHERE version = ?`, and a mismatch returns 409. The client `mutate()` reloads, reapplies the change and retries up to 3 times.
- **Columns added later:** ten of the columns above (and the whole `receipts.status`/`amount`) were added with `ALTER TABLE … ADD COLUMN` inside try/catch. That loop, the `sqlite_master` probe and the `expires_at` backfill are now guarded by a **schema version marker**: `SCHEMA_VERSION = 1` (`worker.js:115`) is compared with `meta.schema` right after the `CREATE`s, and an up-to-date database returns from `migrate()` without touching a single `ALTER` (`worker.js:147-148`). The version is written as the **last** statement (`worker.js:178`), so a migration that fails halfway leaves the marker unset and the next request retries it. **Adding a column means appending it to the 14-pair list *and* bumping `SCHEMA_VERSION`** — otherwise current databases exit early and never get the new column.
- **Legacy migration:** an old single-shop table `store` is migrated into shop id `main`. Shops with an empty `expires_at` get `today + 30 days` (line 176), which is one of the two places the automatic free month comes from. Both steps now sit behind the `meta.schema` gate, so they run once per database instead of once per cold start.
- **Pruning:** appointments older than 180 days are dropped on save, but only **in the browser** (`saveAdmin` in `app.js:215`). The server never prunes, so an unused device can rewrite old rows back.
- **Receipt images are archival data:** `receipts.image` holds a base64 data URL, and `purgeOldReceiptImages()` (`worker.js:317-321`) empties it (the row itself stays with its amount, plan and status) once a receipt is older than `RECEIPT_IMAGE_DAYS = 30` days **and** nothing more is pending on it — a renewal receipt already `done`/`rejected`, or a join order that reached `done`/`rejected`. `GET /api/admin/receipts/:id` then answers 410 with a Persian explanation, and both admin lists show a lock instead of the eye button. The purge runs on `GET /api/admin/renewals`, i.e. only when the super actually opens that tab.

---

## 5. Roles, auth and permissions

| Role | Logs in where | Can do |
|---|---|---|
| **super** (site admin) | Home page (`#/` or `/admin` on the main domain) with username + password checked against the `ADMIN_USERNAME`/`ADMIN_PASSWORD` secrets. A shop login form also accepts the super credentials | Everything: create, edit, disable, delete shops; set owner credentials; set subscriptions; read leads; approve or reject renewal receipts; edit tariffs; enter any shop panel even if disabled or expired |
| **owner** | Shop page, username + password from `accounts` | Add, edit and delete barbers (including barber usernames/passwords); edit shop name, location, Instagram and Telegram, and their own credentials; manage all appointments; add themselves as a barber (`owner: true` barber, no separate account); upload a renewal receipt |
| **barber** | Shop page, own account | Only their **own** appointments. The server ignores any other changes: it merges the barber's own appointments into the server copy and keeps the barbers list unchanged. An incoming appointment whose id already belongs to another barber is dropped too, so a barber cannot take over a colleague's booking or create a duplicate id |

- **Tokens:** HMAC-signed `base64url(payload).sig` with a 30-day expiry. The payload carries the role, shop and username plus a fragment of the password hash, so **changing a password invalidates old tokens**. Tokens are stored in `localStorage` key `hd_auth`.
- **Passwords:** salted SHA-256 (PBKDF2 was avoided because of the free plan's CPU limit). Usernames are `^[a-z0-9_.-]{3,32}$` and stored lowercase.
- **Persian digits:** input in Persian digits is normalised everywhere (`toEn`).
- **Expired shops:** the **owner** may still log in (read-only) to read the panel and upload a renewal receipt; **barbers** are locked out entirely, and customers see the expiry page. `readAuth` (`worker.js:241-261`) joins `shops.name` into the auth object as `shopName`, so every shop-scoped 403 the panel can hit — `requireShop` (`worker.js:267-273`) expiry or disabling — names the shop the same way the customer page already did.
- **Barbers cannot touch accounts:** `DELETE …/accounts/:barberId` is `requireShop(auth, id, ['owner'])`, so a barber gets 403 even for their own account. Only the owner or super provisions and removes barber logins.
- **Login rate limit (`worker.js:197-234`).** Wrong passwords are counted in `auth_log` under the key `scope|ip`, where `scope` is the shop id — except when the *admin username* is typed into a shop login form, which is charged to the `super` scope (`loginScope`), so the admin ceiling cannot be multiplied across shops. `MAX_LOGIN_FAILS = 10` failures inside `LOGIN_LOCK_MS` (15 minutes) sets `blocked_until` and every later attempt from that IP+scope — **even with the right password** — returns 429 with `LOGIN_MSG`. A successful login deletes the row, so typos do not accumulate across the day; rows untouched for 24 hours are pruned by the same batch. The counter lives in D1, not memory, so it survives across isolates. With no `cf-connecting-ip` header (`wrangler dev` locally) nothing is counted, which is also why the smoke suite only rate-limits requests that pass the header.

---

## 6. API (worker.js)

All bodies are JSON, capped at 1 MiB (`MAX_BODY`). Errors are `{error, …extras}` with the HTTP status. `413` when a body is too large, `400` for validation, `401` no/invalid token, `403` wrong role or blocked shop, `409` conflict, `429` too many failed logins from this IP.

**Public:**
- `GET /api/shops`: the list, with a `barbers` count. For anyone but super, `sub`, `ownerName` and `ownerPhone` are stripped and disabled/expired shops are hidden.
- `GET /api/shops/:id`: the customer view. Customer names and phones are stripped and only busy ranges (`{barberId,date,start,end}`) are sent; `sub` is stripped. An expired shop returns 403 `{expired, support, shopName}` **even for super**. A disabled shop returns 403 except for super; its message names the shop only when the caller is that shop's own owner or barber with a live token, so an anonymous visitor learns no more than before.
- `POST /api/shops/:id/login`: owner/barber login (super credentials also accepted). 403 if the shop is disabled; if expired, only the **owner** may log in (for renewal) and barbers get 403.
- `POST /api/login`: super login. 503 if the secrets are missing.
- `GET /api/support`: `{support, payment}` — support contacts **and the card number** for card-to-card payment.
- `GET /api/plans`: the live tariff (`{plans:[{months,price,compare}]}`), read from `meta.plans` over the `DEFAULT_PLANS` fallback.
- `POST /api/leads`: the join-page form. Honeypot field `website`, 5 requests per IP per hour (`429`), Iranian phone validation, and **upsert by phone number** — a repeat submission updates the same order and returns its `token`.
- `GET|PUT /api/leads/me` and `POST /api/leads/me/receipt`: the order belongs to whoever holds the `x-lead-token` header. `PUT` changes the plan before payment (and recomputes `amount`); `POST …/receipt` stores a receipt image and moves the lead to `paid`. Max 5 receipts per order.

**Super only:**
- `PUT /api/admin/plans {plans}` — prices are editable from the home panel; each plan needs an integer price between 10,000 and 1e9, and `compare` (the crossed-out price) must exceed `price` or be 0.
- `POST /api/admin/shops`: create a shop with owner credentials. Optional `ownerName`/`ownerPhone` (super-only contact info), `leadId` (marks the order `done` and links it), and `plan` — which **overrides** the order's plan. `expires_at = today + plan*30`, or `today + FREE_DAYS` when no plan applies.
- `GET /api/admin/leads` — **paginated** (`?before=<created_at>&beforeId=<id>&limit=`), default `ADMIN_PAGE = 300` rows, hard-capped at `ADMIN_PAGE_MAX = 500`; returns `{leads, total, open, more}` where `total` counts every row, `open` counts `new`/`paid` across the whole table (so the tab badge cannot be page-limited) and `more` says an older page exists. Keyset on `(created_at, id)` — never `OFFSET` — so rows inserted in the same millisecond neither skip nor repeat, and new submissions do not shift the pages already open. Junk or injected `before`/`beforeId` simply yields page one. `PUT /api/admin/leads/:id {status}`, `DELETE /api/admin/leads/:id` (also deletes its receipts).
- `GET /api/admin/renewals` — same pagination, joined with the shop name, live `sub` and `hasImage`; also runs `purgeOldReceiptImages()` first (§4). `PUT /api/admin/renewals/:id {action:'approve'|'reject'}`. Approving extends `expires_at` by `plan × 30` days **from the current end date, or from today if already past**, and only a receipt still in `new` can be reviewed (else 409).
- `GET /api/admin/receipts/:id`: the stored data URL of one receipt image. `410` (Persian message) once the image has been archived away; the row still appears in the list with its amount.
- `DELETE /api/admin/shops/:id`, `PUT /api/admin/shops/:id/status {active}`, `PUT /api/admin/shops/:id/subscription {expiresAt}` (ISO date only).

**Shop scoped (owner or super unless noted):**
- `PUT /api/admin/shops/:id`: name, location, telegram, instagram, owner credentials. `ownerName`/`ownerPhone` are applied **only** when super sends them.
- `PUT|DELETE /api/admin/shops/:id/accounts/:barberId`: barber login. Deleting another barber's account as a barber is 403.
- `GET|PUT /api/admin/shops/:id/data`: `barber` may also use this, with the merge rules in §5. A barber's GET returns only their own profile and appointments.
- `POST /api/admin/shops/:id/renewal {plan, image}`: **owner only** (super is rejected here), allowed even while the shop is expired — this is the renewal path from the read-only panel. Max 5 pending receipts.

**Not an API route:**
- `GET /admin` and `/admin/`: the Worker serves `index.html` through the `ASSETS` binding.

**Server-side rules worth knowing:**
- **No bookings in the past.** A new or moved appointment must not be on a past date or start earlier than now − 5 minutes. The reference is **Asia/Tehran** time. Renaming or deleting past appointments is allowed.
- **Disabled or expired shops** accept **no new appointments**, not even from super. Edits and deletes are allowed.
- **Grace period.** During the 7 days after the subscription ends, owner and barber writes are rejected (403 `readonly`); super writes are allowed.
- **Login attempts are rate limited per IP.** Ten wrong passwords in a 15-minute window lock that IP out of that login scope for 15 minutes (HTTP 429). See §5.
- **`PUT …/data` is validated and rebuilt server-side** (`cleanData` and its helpers, `worker.js:370-457`). Barbers ≤ 40, appointments ≤ 2000, services ≤ 40 per barber and ≤ 20 per appointment, names ≤ 40, customer name ≤ 60, phones ≤ 20 (the barber phone must pass `cleanPhone`; the customer phone is only length-capped), ids `^[A-Za-z0-9_-]{1,24}$` and unique, `hours` needs all seven keys `0`–`6` with `HH:MM`, `end > start` for every appointment, `date` must exist on the calendar, and an appointment’s `barberId`/service ids must belong to that barber. Only for **new** rows though — an appointment whose id is already stored keeps its orphaned `barberId` or its since-deleted service, so legacy junk can never lock the owner out of saving. The stored object is the *output* of the cleaner, so unknown extra fields (a honeypot `evil` key, an `admin: true`) never reach `shops.data`. `24:00` is accepted as an appointment end (a booking that ends at midnight).

---

## 7. Subscription logic

`subStatus(expires_at)`, using the Tehran date. `FREE_DAYS = 30`, `WARN_DAYS = 7`, `GRACE_DAYS = 7` (`worker.js:27-29`).

| State | Condition | Effect |
|---|---|---|
| `active` | more than 7 days left | normal |
| `warning` | 0–6 days left (day 0 = last day) | yellow banner in the owner panel with support contacts |
| `grace` | 1–7 days **after** expiry | owner and barbers can log in but **read-only** (UI hides edit buttons, server rejects writes). Red banner with countdown. The customer page still works |
| `expired` | more than 7 days after expiry | exactly like a manual disable: hidden from the list, barber logins blocked, owner login allowed for renewal, customer page shows a centred message («اشتراک این آرایشگاه به پایان رسیده است») with Telegram, call and SMS buttons |

**How a renewal actually happens:** there is no online payment. The owner (or a lead on the join page) pays card-to-card with `PAYMENT.card`, uploads a photo of the receipt — compressed to a data URL of at most 900 KB in the browser — and the super approves or rejects it in the «تمدیدها» tab. Approval is the only thing that moves `expires_at`.

- **Subscription dialog (home, super):** the calendar button on a shop card. Presets are **+30 / +90 / +180 / +365 days**, a custom number of days, or an exact **Jalali** date. (The 12-month preset is a manual grant by super; it is not a purchasable plan — `PLAN_MONTHS = [1, 3, 6]`.) Extensions start from the current end date, or from today if already expired. Jalali conversion is `toJalali`/`fromJalali` in `app.js`, using Intl with a day-by-day correction; it was tested over 2,000 days.
- **Badges on cards:** «X روز مانده», «مهلت تمدید · X روز» or «منقضی از …».

**Decided on 2026-10-24, not yet implemented** (tracked as the task «سیاست جدید اشتراک» — until the code changes, the table above is the real behaviour):
- **No automatic free days.** A new shop should not silently get 30 days; the super grants a period explicitly at creation.
- **No grace period.** `GRACE_DAYS` becomes 0: the day after the last day, the shop is simply expired. The 7-day advance warning stays and must be shown to the owner.
- **Old appointments are pruned server-side after 30 days**, instead of the current client-side 180-day prune in `saveAdmin`.

---

## 8. Front-end behaviour (public/app.js)

**Routing** (hash based, plus pathname for `/admin`):
- `#/`: the shop list (home).
- `#/s/<shopId>`: the customer page.
- `#/s/<shopId>/admin`: the shop panel.
- `#/join[/<sourceShopId>]`: the lead and pricing page.
- `/admin` on the main domain opens the super login. On a custom domain it opens that shop's panel.

**Custom domains:** the `DOMAIN_SHOPS` map near the router (`'moghadamsbz.ir': '74260cf61a'`). On such a domain `#/` shows that shop, and the shop list is not reachable. Add new domains there and connect them in Cloudflare → Worker → Domains & Routes → Custom domain.

**Hidden admin entry:** there is **no admin button** anywhere. You **long-press the scissors logo for 2 seconds** (a ring fills up). On home this opens the super login; on a shop page it opens the shop login or panel. The user explicitly asked that shop pages have **no way back** to the shop list (no home icon).

**Customer page:**
- Top bar: icons for location (Google Maps search or the saved map URL), Telegram and Instagram, each only if set, plus the theme toggle.
- Date strip: next 21 days, in Persian.
- Timeline widget: a status sentence such as «الان خالی است تا ساعت …», a «الان» pill, an hour ruler with start/end labels, free/booked/past segments, and past time hatched.
- Free-slot list, a call card, and services with durations.
- The barber picker is **hidden when the shop has only one barber**.
- The bottom promo link «تو هم می‌خوای یک سایت مثل «نام آرایشگاه» داشته باشی؟ کلیک کن» opens `#/join/<shopId>`.
- The tab title is just the shop name.

**Admin panel:**
- Tabs «نوبت‌ها» and «اطلاعات آرایشگاه» (barbers, the owner-as-barber section, shop info with social links and owner credentials, backup and restore).
- Schedule: agenda of appointments plus free-gap buttons and a floating «نوبت جدید» button. Past days and past hours are locked, and the admin timeline hatches past time but keeps past bookings visible as faded red.
- Appointment dialog: one-click service chips, start-time picker, suggested starts, live end time, conflict and past-time checks.
- **Renewal from the panel:** the subscription banner (`subBannerHTML`) offers a «تمدید اشتراک» button — which becomes «ارسال رسید دیگر» once a receipt is pending — opening `openRenewModal()` against `POST /api/admin/shops/:id/renewal`. The super approves («تأیید و تمدید») or rejects («رد») in the «تمدیدها» tab, whose header reads «رسیدهای تمدید».

**Home (super):** three tabs — «آرایشگاه‌ها», «درخواست‌ها» (leads) and «تمدیدها» (renewal receipts). Both request tabs show a red count of unreviewed items, taken from the server's `open` (whole table), not from the rows currently loaded. Shop cards have subscription, edit, enable/disable and delete buttons; a «ویرایش تعرفه‌ها» button on the shops tab opens the price editor (`openPlansModal`, `PUT /api/admin/plans`).

**Paginated lists (leads + renewals):** `loadAdminList(kind, older)` (`app.js:188-199`) keeps the accumulated rows in `state.leads` / `state.renewals` plus `…Total`, `…Open` and `…More`. Each list ends with `.list-foot`: «۳۰۰ درخواست از ۳۴۰ نشان داده شده است» and, while `more` is true, a «نمایش مورد‌های قدیمی‌تر» button (`data-action="more-leads|more-renewals"`) that asks for the next page with `before`/`beforeId` of the last visible row and appends it. The button disables itself while loading and re-enables on error. Opening a tab does **not** forget the pages already read: a refresh asks for `limit = min(500, max(300, rows loaded))` so the auto-refresh timer cannot drop rows the admin had just opened (beyond 500 loaded rows the list does shrink back and the button reappears). Changing a lead's status or deleting one adjusts `state.leadsOpen` locally, since those paths re-render without a round-trip; approving or rejecting a receipt reloads through `render()`. A receipt whose image was archived shows «تصویر این رسید بایگانی شده است» with a lock instead of the «مشاهدهٔ رسید» button (`receiptViewBtn`, `app.js:1178-1180`).

**Join page (`#/join`)** — a four-stage order flow, all keyed on the phone number:
1. Lead form → `POST /api/leads`, and the returned `token` is kept in `localStorage` `hd_lead` so the same browser can continue the order later.
2. **pay**: card-to-card instructions from `payment` (`PAYMENT.card`, holder name) plus a receipt upload. The image is shrunk on a canvas before upload (≤900 KB data URL) and sent to `POST /api/leads/me/receipt`, which flips the lead to `paid`.
3. **sent**: «رسید شما ثبت شد» while the super reviews it.
4. **done / closed**: the site was built, or the order was rejected.

`orderStage()` (`public/app.js:1022`) maps lead status + receipt count to those stages, and `showOrder()` renders the matching box in `#joinBox`. Submitting the same phone again **updates** the existing order rather than creating a duplicate, so a plan change is possible before paying.

Alongside the order box the page still carries the hero, contact buttons at top and bottom, the pricing cards, 4 feature cards, a 4-step «how it works» list and an FAQ. **Watch the FAQ copy:** one answer tells customers they have «۷ روز مهلت» after the subscription ends, which stops being true the moment `GRACE_DAYS` becomes 0 (see §7).

Auto-refresh is disabled on the join page (`route().view !== 'join'`, `app.js:2519`) so typing is not lost.

**General:**
- **One clock: Asia/Tehran.** `tehranNow()` (`app.js:53-65`, an `Intl.DateTimeFormat('en-CA', …)` formatter) is the single source for «today» and «now», and `todayISO()`/`nowMin()` read from it. This is the same reference the server uses for the past-booking rule (§7), so slot suggestions cannot disagree with what the API accepts — a device in Tokyo used to think Saturday had already begun and would offer a booked-out morning. `isoOf()`/`dateOf()` stay deliberately device-neutral: they only round-trip a `Date` into a `YYYY-MM-DD`, and the renewal-receipt timestamps are shown in the admin's own local time on purpose.
- Auto-refresh every **3 minutes** when no modal is open and the tab is visible.
- Light/dark theme stored in `localStorage` `hd_theme`. The Vazirmatn font comes from jsDelivr. Everything is RTL and in Persian, with Persian digits.
- **Mobile-compatibility rules** learned the hard way:
  - No numeric separators (`1_000_000`), no `.at()`, no `structuredClone`.
  - Never position elements far off-screen (`left:-9999px` made the RTL page 10,000 px wide, and phones zoomed out to a blank-looking page).
  - `html { overflow-x: clip }` is a safety net.
  - `index.html` has an on-screen crash reporter that replaces a blank page with the error and user agent.

---

## 9. How things were tested (reproduce this)

**API: `node test/smoke.mjs`** — committed, no dependencies, no network, no Cloudflare. It imports `worker.js` directly, wraps calls in `Request` objects against `https://hairdresser.test` and passes a fake D1 (`test/mock-d1.mjs`, built on `node:sqlite`) plus a stub `ASSETS`. 186 assertions cover login, the per-IP login rate limit, shop creation, the server-side `PUT …/data` validation, owner/barber permissions, the past-appointment rules, `version` conflicts, customer-view redaction, disabling, the whole subscription cycle, renewal receipts, dynamic plans, leads, the paginated admin lists, the receipt-image archive rule and the cold-start schema gate. Exit code 0 means green; a failure prints its Persian name plus the response body.

Three constraints when extending it:
- `ready` and `secret` in `worker.js` are **module-level**, so `migrate()` only runs for the first database. The suite therefore shares **one** database — do not build a second `MockD1` mid-run. The single exception is the cold-start section (§9 below), which deliberately wants a *fresh module*: it gets one with a cache-busted `import('../worker.js?cold=N')`, each `N` a new isolate, and pairs every isolate with its own database and env.
- Read the live `version` with `curVersion(shopId)` before every `PUT …/data`, so a rejected 400/403 cannot desynchronise the concurrency expectations. An already-past appointment is planted with `seedAppointment()`, because the API refuses to create one.
- Build slots with `appointment(id, futureTime(n))` and never a hand-written today: `futureTime` caps at 23:29 and `apptDate()` rolls to tomorrow, so the suite stays green at any Tehran hour (a hand-made `end` would otherwise collide with the new `end > start` rule late at night). Rate-limit tests need an explicit `cf-connecting-ip` header; without one nothing is counted.

Section «صفحه‌بندی لیست مدیر سایت و بایگانی تصویر رسید» deliberately bulk-inserts **610 leads that all share one `created_at` millisecond** (`OLD_MS`) before walking the pages with `before`/`beforeId`: that is the case an `OFFSET`-style or date-only cursor breaks, so a regression there shows up as a missing/duplicated row instead of a silent skip. It also seeds four receipts around the `RECEIPT_IMAGE_DAYS` boundary (old `done`, old `new`, fresh `done`, and a join-order receipt whose lead is `done` while its own status stays `new`) so both branches of the archive rule are pinned. The seeded rows are inserted straight into the mock DB — they never go through the API.

The admin password in the test is synthetic (`test-super-pass`); the real one never enters the repo.

Section «migrate روی طرحوارهٔ به‌روز از ALTERهای تکراری رد می‌شود» is the cold-start gate test. It subclasses `MockD1` to count every statement matching `ALTER TABLE`, then drives **four fresh worker instances** (`?cold=1`…`?cold=4`) against one shared database: the first must fire the 14 ALTERs and write `meta.schema`, the next two must fire none while still logging in the super, creating a shop with a correct 90-day subscription, logging in its owner and validating tokens across isolates, and the fourth must reject a token signed with the old key after `meta.secret` is rotated in place. If you change `SCHEMA_VERSION`, the ALTER list or the gate, update the expected `14` and the expected `'1'` there — a suite that still passes after a column was appended without bumping the version means the count assertion was edited instead of earned.

**UI: a local preview server** is the cheap way to click through the panels — no Cloudflare, no wrangler:
- In a scratch folder (outside the repo), build a `node:http` server that imports `worker.js` and a `MockD1`, and pass `{ DB, ASSETS, ADMIN_USERNAME, ADMIN_PASSWORD }` to `worker.fetch(request, env)`; `ASSETS.fetch` reads `public/*` from disk and maps `/` and `/admin` to `index.html`. A `Request` needs the body as a buffer and the incoming headers, and the `Response` is written back with `Object.fromEntries(res.headers)`.
- Fire one throwaway API request first: that runs `migrate()`, after which you can seed shops/leads/receipts directly with `db.prepare(...).bind(...)`.
- Then open the URL in a browser and log in. Passwords used there are throwaway values for that process only — never commit them.
- Older alternative, still useful for screenshots at phone width: headless Chrome (`/Applications/Google Chrome.app`) with `public/*` + `worker.js` copied into a scratch folder, sql.js 1.10.3 from cdnjs as a fake D1 injected into `index.html`, `window.fetch` overridden for `/api/*`, served with `python3 -m http.server` and driven through an iframe. `--dump-dom` for logs, `--screenshot` for visuals; minimum headless window width is 500, so wrap pages in a 375 px iframe for phone width.

Node v26 is now installed: `node --check public/app.js` and `node -e "import('./worker.js')"` are quick syntax checks. Wrangler is not installed locally.

The user cannot see your scratchpad. It gets wiped between sessions, so rebuild the **UI** harness when needed; `test/smoke.mjs` is committed and needs no rebuilding.

---

## 10. Working agreements with the user (important)

1. **Reply in Persian.** UI text is Persian. Keep code comments in Persian, matching the existing style.
2. **Never commit or push.** After each change, give a short English commit message and the one-line command, for example:
   ```bash
   git add -A && git commit -m "Short imperative message" && git push
   ```
   **One commit message per finished task**, short and on a single line — the user asked for this explicitly on 2026-10-24 and works task by task. Stage precisely: if a task only removes files, hand over `git add -u <those files>` rather than `-A`, so unrelated work does not ride along.
   Saved memory notes: *user-commits-themselves*, *no-commit-attribution*.
3. **No AI attribution anywhere.** No `Co-Authored-By`, no "Generated with" lines. The first commit was rewritten to remove one.
4. **For large requests, split the work into tasks** and do them one by one. The user said this explicitly for the subscription feature.
5. **The user asks questions before deciding.** When they say they will ask first, answer only; do not implement.
6. **Explain Cloudflare dashboard steps concretely.** The user follows them step by step and sends screenshots; earlier they put a secret's value in the name field.
7. **Do not put secrets in the repo.** The repo may be public; the old password `1234` is still in git history but no longer works. The admin *username* (`Moh3n`) and the payment card number are written in this file and in `worker.js` on purpose — the user treats only the password as a secret. Test credentials in `test/smoke.mjs` are synthetic.

---

## 11. History (what was tried and why it changed)

1. A Python server plus a static site was rejected: the user wanted no server.
2. A pure static site on GitHub Pages with `data.json` came next. Writes via the GitHub API with a token were built and then **removed** at the user's request ("don't connect to GitHub"). It then used `localStorage` plus manual `data.json` export, which could not sync between devices.
3. **Move to Cloudflare Workers + D1** (current). Builds come from GitHub.
4. Multi-shop list and per-shop pages, then owner/barber accounts with role-based access, then site-admin credentials as secrets and shop disabling.
5. UX work: long-press admin entry, no back link from shop pages, a redesigned timeline, social links in the top bar, the barber picker hidden for single-barber shops, and no bookings in the past.
6. The custom domain `moghadamsbz.ir` and the `/admin` path.
7. Subscriptions (30 free days, warning, 7-day read-only grace, auto-expiry), then the admin subscription UI with Jalali dates, then the centred expired page.
8. The join/lead page with pricing, a promo link on every shop page, and a leads inbox in the super admin. Then mobile fixes (the blank page was caused by the off-screen honeypot).
9. Card-to-card payments: an order flow on the join page (lead → pay → receipt → built), renewal receipts uploaded from the owner's read-only panel, and a «تمدیدها» review tab for the super. Then dynamic tariffs (prices editable in the panel, `compare` shown as an offer), owner name/phone on shops, and the `/api/*` routes listed in §6.
10. 2026-10-24: stale root copies of `app.js`, `styles.css` and `worker.mjs` deleted, and `test/smoke.mjs` added as the first committed, dependency-free API test (§9).
11. 2026-10-24 (hardening pass): per-IP login rate limit in `auth_log` (§5), server-side validation and size caps for `PUT …/data` (§6), the front end switched to a single Asia/Tehran clock for «today»/«now» (§8), and the shop-scoped 403s now name the shop (§5). Each came with smoke assertions.
12. 2026-10-24: the super's lead and renewal lists became keyset-paginated with a «نمایش مورد‌های قدیمی‌تر» button and a visible «X از Y» count (§6, §8), the tab badges moved to the server's whole-table `open` count, and receipt images older than 30 days are archived out of `receipts.image` while the row itself stays (§4). Covered by new smoke assertions.
13. 2026-10-24: `migrate()` learned a schema version (`meta.schema`), so a current database now returns before the 14 `ALTER TABLE` attempts, the `sqlite_master` probe and the `expires_at` backfill instead of repeating them on every cold start (§4). The version is written last, so an interrupted migration still retries; the smoke suite pins it with cache-busted worker imports and an ALTER-counting D1 mock.

The messy commits `09ba356` and `0822f18` have a whole shell command as their message. The user chose not to rewrite them.

---

## 12. Open items and caveats

**Decided, not yet built** (each was confirmed by the user on 2026-10-24; the code still does the old thing):

1. **New subscription policy.** No automatic 30 free days at creation or in the legacy migration, `GRACE_DAYS = 0` (warn 7 days ahead, then simply expired), and prune appointments older than 30 days **on the server**. Today: `FREE_DAYS = 30`, `GRACE_DAYS = 7`, and only a client-side 180-day prune. When this lands, the join-page FAQ that promises «۷ روز مهلت» must be rewritten too, and `test/smoke.mjs` sections 2, 8 and 9 encode the old policy and will need updating.
2. **`SUPPORT`, `PAYMENT` and the tariffs belong in `meta` with panel editing.** Prices already moved; the support contacts and the card number are still compile-time constants. The card being readable from `/api/support` is intentional — the ask is editability, not concealment.

**Known gaps, no decision needed:**

3. **The barber phone is format-checked on the server but not in the form.** `cleanBarber` requires `cleanPhone`, while `applyBarber` (`app.js:274`) only requires it to be non-empty, so a shop whose stored barber phone is something like «تماس بگیرید» now gets a Persian 400 toast on every save. If a real shop hits it: either add the same check to the form, or relax `cleanBarber` to a length cap like the customer phone.
4. **No security headers on API responses** — only `content-type` and `cache-control: no-store`. Decided: `X-Content-Type-Options: nosniff`, `Referrer-Policy` and `X-Frame-Options` now; **no CSP yet** (it would break the inline bootstrap script in `index.html` and the CDN font).
5. **Auto-refresh (every 3 minutes) re-renders the panel**, which wipes the two inline forms that live outside a modal — the owner-as-barber form and the shop-settings form. There is also dead code in `setAuth` (`store.set('hd_pass', null)`, `app.js:144`).

**Environment / process:**

6. Two Cloudflare builds failed earlier (`ccbf101`, `d7abf7b`) for an unknown reason; later builds succeeded. If a deploy does not appear, ask the user for the build log («Copy build log»).
7. Whether the GitHub repo is private is unknown. If it is made private, the Cloudflare GitHub app needs access to the repo.
8. Shop owner credentials are set by the super when creating or editing a shop. Shops created before accounts existed have no owner until the super sets one.
9. `Doc/HANDOFF.pdf` is a 2026-10-17 render and is **not** kept in sync with this file. Trust the Markdown.
10. **`node test/smoke.mjs` is the regression gate** — run it before handing over any change to `worker.js`, and add an assertion when you fix one of the gaps above. There is still no CI; nothing runs it automatically.
