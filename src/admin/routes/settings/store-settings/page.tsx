import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Cog6Tooth } from "@medusajs/icons"
import "./grafiq-theme.css"

type Feature = { id: string; title: string; desc: string }

type StoreSettingsForm = {
  store_name: string
  tagline: string
  ticker_text: string
  contact_email: string
  contact_phone: string
  instagram: string
  facebook: string
  twitter: string
  delivery_fee: number
  free_delivery_above: number
  cod_advance_percent: number
  features: Feature[]
}

type Integrations = { razorpayConfigured: boolean; shiprocketConfigured: boolean }

const empty: StoreSettingsForm = {
  store_name: "",
  tagline: "",
  ticker_text: "",
  contact_email: "",
  contact_phone: "",
  instagram: "",
  facebook: "",
  twitter: "",
  delivery_fee: 0,
  free_delivery_above: 0,
  cod_advance_percent: 0,
  features: [],
}

/**
 * Ported from grafiq's src/pages/admin/Settings.jsx — same fields, same
 * grouping (Store Info / Contact & Social / Delivery / Cash on Delivery /
 * Feature Strip), same ink+volt visual language. Left out on purpose:
 * the "Your Account" password-change section (Medusa has its own admin
 * user auth) and any Razorpay/Shiprocket *credential* fields (those stay
 * in .env — this page only shows whether they're configured).
 */
const StoreSettingsPage = () => {
  const [form, setForm] = useState<StoreSettingsForm>(empty)
  const [integrations, setIntegrations] = useState<Integrations>({
    razorpayConfigured: false,
    shiprocketConfigured: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/admin/store-settings", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setForm({ ...empty, ...data.settings })
        setIntegrations(data.integrations)
      })
      .catch(() => setError("Could not load settings."))
      .finally(() => setLoading(false))
  }, [])

  const set = (key: keyof StoreSettingsForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const setFeature = (id: string, key: "title" | "desc", value: string) =>
    setForm({
      ...form,
      features: form.features.map((f) => (f.id === id ? { ...f, [key]: value } : f)),
    })

  const addFeature = () =>
    setForm({
      ...form,
      features: [...form.features, { id: `f-${Date.now()}`, title: "", desc: "" }],
    })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/admin/store-settings", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          delivery_fee: Number(form.delivery_fee),
          free_delivery_above: Number(form.free_delivery_above),
          cod_advance_percent: Number(form.cod_advance_percent) || 0,
        }),
      })
      if (!res.ok) throw new Error("Save failed")
      const data = await res.json()
      setForm({ ...empty, ...data.settings })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Could not save settings.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="grafiq-scope">
        <p className="gq-help">Loading store settings…</p>
      </div>
    )
  }

  return (
    <div className="grafiq-scope">
      <h1 className="gq-title">Store Settings</h1>

      <form onSubmit={handleSave}>
        <section className="gq-section">
          <p className="gq-eyebrow">Store Info</p>
          <div className="gq-grid">
            <div className="gq-field">
              <label>Store name</label>
              <input className="gq-input" value={form.store_name} onChange={set("store_name")} />
            </div>
            <div className="gq-field">
              <label>Currency</label>
              <input className="gq-input" value="₹ (fixed — India-only store)" disabled />
            </div>
          </div>
          <div className="gq-grid gq-grid-full" style={{ marginTop: 14 }}>
            <div className="gq-field">
              <label>Tagline</label>
              <input className="gq-input" value={form.tagline} onChange={set("tagline")} />
            </div>
            <div className="gq-field">
              <label>Footer ticker text</label>
              <input className="gq-input" value={form.ticker_text} onChange={set("ticker_text")} />
            </div>
          </div>
        </section>

        <section className="gq-section">
          <p className="gq-eyebrow">Contact &amp; Social</p>
          <div className="gq-grid">
            <div className="gq-field">
              <label>Contact email</label>
              <input className="gq-input" value={form.contact_email} onChange={set("contact_email")} />
            </div>
            <div className="gq-field">
              <label>Contact phone</label>
              <input className="gq-input" value={form.contact_phone} onChange={set("contact_phone")} />
            </div>
            <div className="gq-field">
              <label>Instagram URL</label>
              <input className="gq-input" value={form.instagram} onChange={set("instagram")} />
            </div>
            <div className="gq-field">
              <label>Facebook URL</label>
              <input className="gq-input" value={form.facebook} onChange={set("facebook")} />
            </div>
            <div className="gq-field">
              <label>Twitter/X URL</label>
              <input className="gq-input" value={form.twitter} onChange={set("twitter")} />
            </div>
          </div>
        </section>

        <section className="gq-section">
          <p className="gq-eyebrow">Delivery</p>
          <div className="gq-grid">
            <div className="gq-field">
              <label>Delivery fee (₹)</label>
              <input type="number" className="gq-input" value={form.delivery_fee} onChange={set("delivery_fee")} />
            </div>
            <div className="gq-field">
              <label>Free delivery above (₹)</label>
              <input
                type="number"
                className="gq-input"
                value={form.free_delivery_above}
                onChange={set("free_delivery_above")}
              />
            </div>
          </div>
        </section>

        <section className="gq-section">
          <p className="gq-eyebrow">Cash on Delivery</p>
          <div className="gq-grid">
            <div className="gq-field">
              <label>COD advance (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="gq-input"
                value={form.cod_advance_percent}
                onChange={set("cod_advance_percent")}
              />
            </div>
          </div>
          <p className="gq-help">
            If set above 0, a customer choosing Cash on Delivery pays this % of the order total online
            (via Razorpay) before it ships — the rest stays payable in cash on delivery. Leave at 0 for
            COD to work fully paid on delivery, as before.
          </p>
        </section>

        <section className="gq-section">
          <p className="gq-eyebrow">Feature Strip</p>
          {form.features.map((f) => (
            <div key={f.id} className="gq-feature-row">
              <input
                className="gq-input"
                placeholder="Title"
                value={f.title}
                onChange={(e) => setFeature(f.id, "title", e.target.value)}
              />
              <input
                className="gq-input"
                placeholder="Description"
                value={f.desc}
                onChange={(e) => setFeature(f.id, "desc", e.target.value)}
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addFeature}
            className="gq-save-btn"
            style={{ background: "transparent", color: "var(--gq-volt)", border: "1px solid var(--gq-volt)" }}
          >
            + Add Feature
          </button>
        </section>

        <section className="gq-section">
          <p className="gq-eyebrow">Payments &amp; Shipping</p>
          <div className="gq-integration-row">
            <span className="gq-int-name">Razorpay</span>
            <span className={`gq-badge ${integrations.razorpayConfigured ? "gq-ok" : "gq-missing"}`}>
              {integrations.razorpayConfigured ? "Connected" : "Not configured"}
            </span>
          </div>
          <div className="gq-integration-row">
            <span className="gq-int-name">Shiprocket</span>
            <span className={`gq-badge ${integrations.shiprocketConfigured ? "gq-ok" : "gq-missing"}`}>
              {integrations.shiprocketConfigured ? "Connected" : "Not configured"}
            </span>
          </div>
          <p className="gq-help">
            API keys are set as environment variables on the server (RAZORPAY_KEY_ID /
            RAZORPAY_KEY_SECRET, SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD) — never entered here, same as
            grafiq's original setup. See the plugin READMEs for exactly which variables each one reads.
          </p>
        </section>

        <div style={{ display: "flex", alignItems: "center" }}>
          <button type="submit" className="gq-save-btn" disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {saved && <span className="gq-saved">Saved ✓</span>}
          {error && <span className="gq-error">{error}</span>}
        </div>
      </form>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Store Settings",
  icon: Cog6Tooth,
})

export default StoreSettingsPage
