import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { STORE_SETTINGS_MODULE } from "../../../modules/store-settings"
import type StoreSettingsModuleService from "../../../modules/store-settings/service"

// Same fields Settings.jsx let an admin edit — kept as an explicit
// allow-list so a POST body can never write anything else onto the row
// (e.g. accidentally hitting Medusa's own `id`).
const EDITABLE_FIELDS = [
  "store_name",
  "tagline",
  "ticker_text",
  "contact_email",
  "contact_phone",
  "instagram",
  "facebook",
  "twitter",
  "delivery_fee",
  "free_delivery_above",
  "cod_advance_percent",
  "features",
] as const

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<StoreSettingsModuleService>(STORE_SETTINGS_MODULE)
  const settings = await service.getSingleton()

  res.json({
    settings,
    // Mirrors grafiq-api/config.php's razorpay_configured() /
    // shiprocket_configured() — lets the admin UI show "connected" status
    // without ever sending the actual secret values to the browser.
    integrations: {
      razorpayConfigured: Boolean(
        process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
      ),
      shiprocketConfigured: Boolean(
        process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD
      ),
    },
  })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve<StoreSettingsModuleService>(STORE_SETTINGS_MODULE)
  const current = await service.getSingleton()

  const body = (req.body ?? {}) as Record<string, unknown>
  const patch: Record<string, unknown> = {}
  for (const field of EDITABLE_FIELDS) {
    if (field in body) patch[field] = body[field]
  }

  if (typeof patch.delivery_fee === "string") patch.delivery_fee = Number(patch.delivery_fee)
  if (typeof patch.free_delivery_above === "string") patch.free_delivery_above = Number(patch.free_delivery_above)
  if (typeof patch.cod_advance_percent === "string") patch.cod_advance_percent = Number(patch.cod_advance_percent) || 0

  const updated = await service.updateStoreSettings({ id: current.id, ...patch })
  res.json({ settings: updated })
}
