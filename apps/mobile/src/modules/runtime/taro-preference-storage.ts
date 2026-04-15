import type { KeyValueStorageDriver } from "@nebula/core"
import Taro from "@tarojs/taro"

export const taroPreferenceStorage: KeyValueStorageDriver = {
  async getItem(key) {
    try {
      const result = await Taro.getStorage<string>({ key })
      return typeof result.data === "string" ? result.data : null
    } catch {
      return null
    }
  },
  async setItem(key, value) {
    await Taro.setStorage({ key, data: value })
  },
  async removeItem(key) {
    await Taro.removeStorage({ key })
  },
}
