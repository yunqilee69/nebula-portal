import { Redirect } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useMobileRuntime } from "@/providers/mobile-root-provider";

export default function SignInScreen() {
  const { authBusy, locale, session, setLocale, signIn } = useMobileRuntime();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);

  if (session?.token) {
    return <Redirect href="/(app)" />;
  }

  async function handleSignIn() {
    setError(null);

    try {
      await signIn({ username: username.trim(), password });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Sign in failed");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>Nebula Mobile</Text>
      <Text style={styles.title}>Sign in to Nebula Mobile</Text>
      <Text style={styles.description}>
        The mobile shell now shares request and auth flow orchestration with the web platform while keeping Expo-native
        runtime bindings.
      </Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Username</Text>
        <TextInput autoCapitalize="none" autoCorrect={false} editable={!authBusy} onChangeText={setUsername} placeholder="admin" style={styles.input} value={username} />

        <Text style={styles.label}>Password</Text>
        <TextInput editable={!authBusy} onChangeText={setPassword} placeholder="123456" secureTextEntry style={styles.input} value={password} />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={[styles.primaryButton, authBusy ? styles.primaryButtonDisabled : null]} disabled={authBusy} onPress={() => void handleSignIn()}>
          {authBusy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryButtonLabel}>Sign in</Text>}
        </Pressable>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => void setLocale(locale === "zh-CN" ? "en-US" : "zh-CN")}>
        <Text style={styles.primaryButtonLabel}>Switch language: {locale}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fb",
    paddingHorizontal: 24,
    justifyContent: "center",
    gap: 16,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "#355dff",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "800",
    color: "#101828",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#475467",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#344054",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d0d5dd",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#101828",
    backgroundColor: "#ffffff",
  },
  errorText: {
    color: "#d92d20",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: "#355dff",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
