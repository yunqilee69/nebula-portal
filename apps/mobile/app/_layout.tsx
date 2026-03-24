import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { MobileRootProvider } from "@/providers/mobile-root-provider";

export default function RootLayout() {
  return (
    <MobileRootProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </MobileRootProvider>
  );
}
