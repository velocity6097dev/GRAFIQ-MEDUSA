# grafiq-medusa

Your grafiq store's Razorpay + Shiprocket integrations, rebuilt on Medusa v2
instead of the original PHP backend, with a custom Store Settings page
carried over from `Settings.jsx` and restyled to match grafiq.

This is a fresh Medusa project scaffold, not a running store — you need
your own Postgres + Redis to actually run it (see below).

## What this is

| grafiq had | This project has |
|---|---|
| `grafiq-api/razorpay_*.php` (hand-rolled cURL calls) | [`@devx-commerce/razorpay`](https://www.npmjs.com/package/@devx-commerce/razorpay) — a maintained Medusa payment provider plugin |
| `grafiq-api/shiprocket_*.php` (hand-rolled cURL + status sync) | [`medusa-shiprocket-fulfillment-sbl`](https://www.npmjs.com/package/medusa-shiprocket-fulfillment-sbl) — a maintained Medusa fulfillment provider plugin, with its own admin UI for shipment status/labels |
| `src/pages/admin/Settings.jsx` | `src/admin/routes/settings/store-settings/page.tsx` — same fields, same ink+volt look, now backed by a real Medusa module (`src/modules/store-settings`) instead of a MySQL `settings` table |
| COD advance % (partial online payment via Razorpay, rest on delivery) | `src/api/store/checkout/cod-advance/route.ts` — a small custom endpoint, since no plugin supports partial-amount payment collections |

## What was deliberately NOT ported

Medusa already has more capable native equivalents, so bringing these over
would just be dead weight:

- `ManageProducts.jsx`, `ManageCategories.jsx`, `ManageBanners.jsx` → Medusa Admin's built-in Products/Collections pages
- `ManageOrders.jsx`, `OrderDetail.jsx` → Medusa Admin's built-in Orders pages (now backed by the Shiprocket plugin's fulfillment UI for shipping)
- `ManageAdmins.jsx`, `AdminLogin.jsx` → Medusa's own admin user/auth system
- `ManageReplacements.jsx`, `ManagePickupLocations.jsx` → Shiprocket plugin's admin UI covers pickup locations; replacements/returns map to Medusa's native Returns flow
- The "Your Account" password-change section of `Settings.jsx` → Medusa's own admin user settings

## Design decision: only the Settings page is grafiq-styled

Medusa Admin's native pages (Products, Orders, Customers, etc.) run on
`@medusajs/ui`, a fixed design system. Re-skinning *all* of it to look like
grafiq means forking that package — a much bigger, riskier job than what
was asked for. Instead, `grafiq-theme.css` is scoped under `.grafiq-scope`
so only the new custom Store Settings page uses grafiq's `ink/panel/paper/
volt/slate/line` palette and Anton/Bebas Neue/Barlow fonts; the rest of
the admin stays standard Medusa. Say the word if you actually want a full
admin reskin — it's a separate, much larger project.

## Setup

1. **Prerequisites**: Node 20+, a Postgres database, a Redis instance.
2. `npm install`
3. `cp .env.example .env` and fill in:
   - `DATABASE_URL` / `REDIS_URL` for your Postgres/Redis
   - `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — same values as grafiq's old `.env`
   - `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` — same dedicated API user grafiq used (Shiprocket Panel → Settings → API → "Add New API User", not your normal login)
   - `SHIPROCKET_PICKUP_LOCATION` — must exactly match a pickup location "Nickname" already set up in your Shiprocket dashboard
4. Generate and run the migration for the new `store_settings` table:
   ```
   npx medusa db:generate store-settings
   npx medusa db:migrate
   ```
5. `npm run dev` — Medusa Admin runs at `http://localhost:9000/app`. The new page is under **Settings → Store Settings**.

## Things to double-check before going live

- **This is why versions are pinned exactly, not with `^`.** I checked both plugins directly against the npm registry rather than trusting search snippets: `medusa-shiprocket-fulfillment-plugin` (the more-downloaded, better-known name) was **unpublished from npm in March 2026** — it's gone. `medusa-shiprocket-fulfillment-sbl` is the actively-maintained continuation from the same author/repo, and both it and `@devx-commerce/razorpay` declare an **exact peer dependency on Medusa `2.4.0`** (not a range) — that's why `package.json` pins `@medusajs/*` to `2.4.0` too, rather than the newer `2.19.0` that's current as of this writing. Bumping Medusa's version later is reasonable, but re-verify both plugins still work against it first — this corner of the ecosystem (small India-specific plugins) churns fast and packages do get abandoned or renamed.
- **COD-advance verification**: `cod-advance/route.ts` creates the partial Razorpay order; verifying the signature after payment and marking the order accordingly still needs wiring into your order-completion flow — port the checks from grafiq's `razorpay_verify.php` (signature verification, never trusting client-reported success) into that flow.
- **Webhooks**: both plugins support webhooks (Razorpay payment events, Shiprocket shipment status) — point them at your deployed domain the same way grafiq's `RAZORPAY_WEBHOOK_SECRET` / `SHIPROCKET_WEBHOOK_TOKEN` setup did.
