import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import Razorpay from "razorpay"
import { STORE_SETTINGS_MODULE } from "../../../../modules/store-settings"
import type StoreSettingsModuleService from "../../../../modules/store-settings/service"

/**
 * grafiq's "COD advance" feature (Settings.jsx → Cash on Delivery →
 * codAdvancePercent) doesn't map onto Medusa's payment module, which
 * expects one payment collection covering the FULL order amount. Rather
 * than fighting that abstraction, this is a small, separate, explicit
 * flow — the same shape as grafiq-api/razorpay_create_order.php, minus
 * the PHP:
 *
 *   1. Storefront calls this route with a cart_id once the customer has
 *      picked "Cash on Delivery" and cod_advance_percent > 0.
 *   2. We compute the advance amount server-side from the cart's real
 *      total (NEVER trust a client-supplied amount — see
 *      compute_order_totals() in the old grafiq-api/config.php for why).
 *   3. We create a Razorpay order for just that advance amount and hand
 *      back what the storefront's Razorpay Checkout widget needs.
 *
 * Verifying the resulting payment (signature check) and recording it
 * against the order is intentionally left as a follow-up piece to wire
 * into your order-completion workflow — see razorpay_verify.php in the
 * old grafiq-api for the verification logic to port.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id } = (req.body ?? {}) as { cart_id?: string }
  if (!cart_id) {
    res.status(400).json({ error: "cart_id is required" })
    return
  }

  const cartModule = req.scope.resolve(Modules.CART)
  const settingsService = req.scope.resolve<StoreSettingsModuleService>(STORE_SETTINGS_MODULE)

  const cart = await cartModule.retrieveCart(cart_id, { relations: ["items"] })
  if (!cart) {
    res.status(404).json({ error: "Cart not found" })
    return
  }

  const settings = await settingsService.getSingleton()
  const percent = Number(settings.cod_advance_percent) || 0
  if (percent <= 0) {
    res.status(400).json({ error: "COD advance is not enabled — this cart should pay fully on delivery." })
    return
  }

  const total = Number(cart.total ?? 0)
  const advanceAmount = Math.round(total * (percent / 100))

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    res.status(503).json({ error: "Razorpay is not configured on the server." })
    return
  }

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })

  try {
    const order = await razorpay.orders.create({
      amount: advanceAmount * 100, // paise
      currency: "INR",
      receipt: `cod-advance-${cart_id}`,
      notes: { cart_id, kind: "cod_advance", percent: String(percent) },
    })

    res.json({
      razorpayOrderId: order.id,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      amount: advanceAmount,
      currency: "INR",
    })
  } catch (err) {
    res.status(502).json({ error: "Could not reach Razorpay to create the advance order." })
  }
}
