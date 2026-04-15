import { Link, Redirect } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMobileRuntime } from "@/providers/mobile-root-provider";

export default function AppHomeScreen() {
  const { appContext, authBusy, hydrated, locale, session, signOut } = useMobileRuntime();

  if (!session?.token) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nebula mobile foundation</Text>
      <Text style={styles.subtitle}>
        Shared contracts and runtime services are active through @nebula/core.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Runtime state</Text>
        <Text style={styles.cardValue}>Hydrated: {hydrated ? "yes" : "no"}</Text>
        <Text style={styles.cardValue}>Locale: {locale}</Text>
        <Text style={styles.cardValue}>Token present: {session?.token ? "yes" : "no"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Planned modules</Text>
        <Text style={styles.listItem}>• Auth + refresh pipeline on secure storage</Text>
        <Text style={styles.listItem}>• Unified request client based on shared envelope rules</Text>
        <Text style={styles.listItem}>• Storage upload service aligned with Nebula backend flow</Text>
        <Text style={styles.listItem}>• Harmony adapter reserved behind runtime boundary</Text>
      </View>

      <Link href="/(app)/personal-center" asChild>
        <Pressable style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonLabel}>Open personal center</Text>
        </Pressable>
      </Link>

      <Pressable style={[styles.button, authBusy ? styles.buttonDisabled : null]} disabled={authBusy} onPress={() => void signOut()}>
        <Text style={styles.buttonLabel}>{authBusy ? "Signing out..." : "Sign out"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: "#f8fafc",
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    color: "#101828",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475467",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  cardValue: {
    fontSize: 14,
    color: "#344054",
  },
  listItem: {
    fontSize: 14,
    lineHeight: 21,
    color: "#344054",
  },
  secondaryButton: {
    backgroundColor: "#355dff",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
