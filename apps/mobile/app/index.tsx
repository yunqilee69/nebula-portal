import { Redirect } from "expo-router";
import { useMobileRuntime } from "@/providers/mobile-root-provider";

export default function IndexScreen() {
  const { authBusy, hydrated, session } = useMobileRuntime();

  if (!hydrated || authBusy) {
    return null;
  }

  return <Redirect href={session ? "/(app)" : "/sign-in"} />;
}
