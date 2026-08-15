import { MedusaService } from "@medusajs/framework/utils"
import StoreSettings from "./models/store-settings"

/**
 * MedusaService() auto-generates listStoreSettings/createStoreSettings/
 * updateStoreSettings/etc. from the StoreSettings model above. The only
 * thing this table needs beyond that generated CRUD is "give me the one
 * settings row, creating it with defaults if this is a fresh install" —
 * that's getSingleton() below.
 */
class StoreSettingsModuleService extends MedusaService({
  StoreSettings,
}) {
  async getSingleton() {
    const [existing] = await this.listStoreSettings({}, { take: 1 })
    if (existing) return existing
    return await this.createStoreSettings({})
  }
}

export default StoreSettingsModuleService
