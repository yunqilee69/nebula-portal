import { Redirect } from "expo-router";
import { PersonalCenterPage } from "@nebula/pages-mobile";
import { useMobileRuntime } from "@/providers/mobile-root-provider";
import { createMobileAuthApi, toCoreSession } from "@/api/auth-api";

export default function PersonalCenterScreen() {
  const { appContext, authBusy, locale, session, setSession, signOut } = useMobileRuntime();

  if (!session?.token) {
    return <Redirect href="/sign-in" />;
  }

  async function handleRefreshProfile() {
    if (!session) {
      return;
    }

    const authApi = createMobileAuthApi(locale);
    const currentUser = await authApi.fetchCurrentUser(session.token);

    await setSession(
      toCoreSession({
        ...session,
        user: currentUser.user,
        permissions: currentUser.permissions,
        menuList: currentUser.menuList,
      }),
    );
  }

  return (
    <PersonalCenterPage
      appContext={appContext}
      authBusy={authBusy}
      session={session}
      onLogout={signOut}
      onRefreshProfile={handleRefreshProfile}
    />
  );
}
