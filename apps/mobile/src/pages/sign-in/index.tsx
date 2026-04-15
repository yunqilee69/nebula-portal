import { Button, Input, Text, View } from "@tarojs/components"
import Taro from "@tarojs/taro"
import { useEffect, useState } from "react"
import { useMiniProgramRuntime } from "@/modules/runtime/mini-program-root-provider"
import "./index.css"

export default function SignInPage() {
  const { authBusy, locale, session, setLocale, signIn } = useMiniProgramRuntime()
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("123456")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session?.token) {
      void Taro.switchTab({ url: "/pages/index/index" })
    }
  }, [session])

  async function handleSignIn() {
    setError(null)
    try {
      await signIn({ username: username.trim(), password })
      await Taro.switchTab({ url: "/pages/index/index" })
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Sign in failed")
    }
  }

  return (
    <View className="sign-in-page">
      <Text className="sign-in-page__eyebrow">Nebula Mini Program</Text>
      <Text className="sign-in-page__title">Sign in to Nebula</Text>
      <Text className="sign-in-page__description">
        The mini-program shell reuses Nebula auth and runtime contracts while replacing Expo bindings with Taro adapters.
      </Text>

      <View className="sign-in-page__card">
        <Text className="sign-in-page__label">Username</Text>
        <Input className="sign-in-page__input" value={username} onInput={(event) => setUsername(event.detail.value)} placeholder="admin" />

        <Text className="sign-in-page__label">Password</Text>
        <Input className="sign-in-page__input" password value={password} onInput={(event) => setPassword(event.detail.value)} placeholder="123456" />

        {error ? <Text className="sign-in-page__error">{error}</Text> : null}

        <Button className="sign-in-page__button" loading={authBusy} onClick={() => void handleSignIn()}>
          {authBusy ? "Signing in..." : "Sign in"}
        </Button>
      </View>

      <Button className="sign-in-page__button sign-in-page__button--secondary" onClick={() => void setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}>
        Switch language: {locale}
      </Button>
    </View>
  )
}
