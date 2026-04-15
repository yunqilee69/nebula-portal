import { Button, Text, View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { useEffect } from "react"
import { useMiniProgramRuntime } from "@/modules/runtime/mini-program-root-provider"
import "./index.css"

export default function HomePage() {
  const { authBusy, hydrated, locale, session, signOut } = useMiniProgramRuntime()

  useEffect(() => {
    if (hydrated && !session?.token) {
      void Taro.navigateTo({ url: "/pages/sign-in/index" })
    }
  }, [hydrated, session])

  return (
    <View className="home-page">
      <Text className="home-page__title">Nebula mini program foundation</Text>
      <Text className="home-page__subtitle">
        Shared contracts stay inside @nebula/core, while this app owns Taro storage, navigation, and request bindings.
      </Text>

      <View className="home-page__card">
        <Text className="home-page__card-title">Runtime state</Text>
        <Text className="home-page__card-value">Hydrated: {hydrated ? "yes" : "no"}</Text>
        <Text className="home-page__card-value">Locale: {locale}</Text>
        <Text className="home-page__card-value">Token present: {session?.token ? "yes" : "no"}</Text>
      </View>

      <View className="home-page__card">
        <Text className="home-page__card-title">Migration direction</Text>
        <Text className="home-page__card-value">• Taro app shell replaces Expo router and native views</Text>
        <Text className="home-page__card-value">• Shared auth/session flow remains reusable</Text>
        <Text className="home-page__card-value">• pages-mobile stays transitional and should not grow further</Text>
      </View>

      <Button className="home-page__button" loading={authBusy} onClick={() => void signOut()}>
        {authBusy ? "Signing out..." : "Sign out"}
      </Button>
    </View>
  )
}
