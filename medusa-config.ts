import { loadEnv, defineConfig, Modules } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },

  admin: {
    // Our custom Store Settings page lives under src/admin/routes and is
    // picked up automatically — nothing extra to register here.
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },

  modules: [
    // ---------- Custom settings module (this project) ----------
    {
      resolve: "./src/modules/store-settings",
    },

    // ---------- Razorpay payment provider ----------
    // https://www.npmjs.com/package/@devx-commerce/razorpay
    // NOTE: this is a small, community-maintained plugin (~90 weekly
    // downloads at time of writing) — pin an exact version and read its
    // README on npm before going live; option names below match its
    // documented example but double-check against whatever version you
    // actually install.
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@devx-commerce/razorpay/providers/payment-razorpay",
            id: "razorpay",
            options: {
              key_id: process.env.RAZORPAY_KEY_ID,
              key_secret: process.env.RAZORPAY_KEY_SECRET,
              razorpay_account: process.env.RAZORPAY_ACCOUNT,
              webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
              // auto-capture matches grafiq's flow (capture happens at
              // verification, not left pending) — flip to false if you'd
              // rather capture manually from the admin.
              auto_capture: true,
              refund_speed: "normal",
            },
          },
        ],
      },
    },

    // ---------- Shiprocket fulfillment provider ----------
    // https://www.npmjs.com/package/medusa-shiprocket-fulfillment-sbl
    // (NOTE: an earlier, more-downloaded package with a near-identical
    // name — medusa-shiprocket-fulfillment-plugin — was unpublished from
    // npm in March 2026. This is the actively-maintained continuation
    // from the same author/repo — verify it's still current before you
    // deploy, since community plugins in this space churn fast.)
    {
      resolve: "@medusajs/medusa/fulfillment",
      options: {
        providers: [
          {
            resolve: "medusa-shiprocket-fulfillment-sbl",
            id: "shiprocket",
            options: {
              email: process.env.SHIPROCKET_EMAIL,
              password: process.env.SHIPROCKET_PASSWORD,
              pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
              cod: "true", // grafiq supports COD orders, so this stays enabled
              apiTimeoutMs: 30000,
            },
          },
        ],
      },
    },
  ],

  // Registers the Shiprocket plugin's own admin UI (shipment documents,
  // tracking events) and its carrier-tracking webhook endpoint — mirrors
  // grafiq-api/shiprocket_webhook.php's SHIPROCKET_WEBHOOK_TOKEN.
  plugins: [
    {
      resolve: "medusa-shiprocket-fulfillment-sbl",
      options: {
        webhookSecret: process.env.SHIPROCKET_WEBHOOK_TOKEN,
        apiTimeoutMs: 30000,
      },
    },
  ],
})
