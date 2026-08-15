import { model } from "@medusajs/framework/utils"

/**
 * Singleton-style row holding the store-wide settings that used to live in
 * grafiq's `settings` table and were edited from src/pages/admin/Settings.jsx.
 *
 * Deliberately NOT included here (unlike grafiq's admin, which also didn't
 * put these in this table): Razorpay/Shiprocket API credentials. Those stay
 * server-side only, in .env — see src/api/admin/store-settings/route.ts,
 * which reports whether they're configured without ever exposing them.
 *
 * `features` mirrors grafiq's `features: [{ id, title, desc }]` feature-strip
 * array — stored as JSON since it's a small, admin-edited list, not a
 * relation anything else needs to query into.
 */
const StoreSettings = model.define("store_settings", {
  id: model.id().primaryKey(),

  // ---------- Store Info ----------
  store_name: model.text().default("GRAFIQ"),
  tagline: model.text().nullable(),
  ticker_text: model.text().nullable(),

  // ---------- Contact & Social ----------
  contact_email: model.text().nullable(),
  contact_phone: model.text().nullable(),
  instagram: model.text().nullable(),
  facebook: model.text().nullable(),
  twitter: model.text().nullable(),

  // ---------- Delivery ----------
  delivery_fee: model.number().default(0),
  free_delivery_above: model.number().default(0),

  // ---------- Cash on Delivery ----------
  // If > 0, a customer choosing COD must pay this % of the order total
  // online (via Razorpay) before it ships — see
  // src/api/store/checkout/cod-advance/route.ts for where this is used.
  cod_advance_percent: model.number().default(0),

  // ---------- Feature strip ----------
  // [{ id: string, title: string, desc: string }, ...]
  features: model.json().default([]),
})

export default StoreSettings
