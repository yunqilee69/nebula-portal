import { Redirect, Stack } from "expo-router";
import { useMobileRuntime } from "@/providers/mobile-root-provider";

export default function AppLayout() {
  const { hydrated, session } = useMobileRuntime();

  if (!hydrated) {
    return null;
  }

  if (!session?.token) {
    return <Redirect href="/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
