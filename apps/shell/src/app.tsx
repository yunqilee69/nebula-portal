import { AppContextProvider, bootstrapRegisteredModules, buildModuleRoutes, buildRoutesFromMenus, eventBus } from "@platform/core";
import { restoreSessionOnStartup } from "@nebula/auth";
import type { AppContextValue, ModuleLoadResult } from "@platform/core";
import { Spin } from "antd";
import { Alert, Typography } from "antd";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, useNavigate, useRoutes } from "react-router-dom";
import { AppErrorBoundary } from "./components/app-error-boundary";
import { fetchCurrentUser, refreshSession } from "./api/auth-api";
import { AuthGuard } from "./modules/auth/auth-guard";
import { LoginPage } from "./modules/auth/login-page";
import { useAuthStore } from "./modules/auth/auth-store";
import { resolveRefreshDelay } from "./modules/auth/session-utils";
import { BasicLayout } from "./layout/basic-layout";
import { UnauthorizedPage } from "./pages/401";
import { NotFoundPage } from "./pages/404";
import { DashboardPage } from "./pages/dashboard";
import { IframePage } from "./pages/iframe";
import { UnavailablePage } from "./pages/unavailable";
import { loadRemoteModules } from "./modules/runtime/remote-modules";
import { buildAppContext, preloadShellData } from "./modules/runtime/bootstrap";
import { registerShellComponents } from "./modules/runtime/shell-component-registry";
import { useDictStore } from "./modules/dict/dict-store";
import { hydrateFrontendPublicData } from "./modules/frontend/frontend-bootstrap";
import { useFrontendStore } from "./modules/frontend/frontend-store";
import { useMenuStore } from "./modules/menu/menu-store";
import { useNotifyStore } from "./modules/notify/notify-store";
import { useResourceStore } from "./modules/runtime/resource-store";
import { reportPlatformValidation, validatePlatformConsistency } from "./modules/runtime/platform-validator";
import { NeExceptionResult } from "@platform/ui";
import { useI18nStore, translateShellMessage } from "@nebula/i18n";

registerShellComponents();

function AppLoadingFallback() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Spin size="large" />
    </div>
  );
}

function PlatformValidationFallback({ issues }: { issues: ReturnType<typeof validatePlatformConsistency>["issues"] }) {
  const locale = useI18nStore.getState().locale;
  return (
    <div style={{ minHeight: "100vh", padding: 24, display: "grid", alignContent: "center", gap: 24 }}>
      <NeExceptionResult
        status="error"
        title={translateShellMessage(locale, "layout.platformValidationFailed", "Platform startup validation failed")}
        subtitle={translateShellMessage(locale, "layout.platformValidationSubtitle", "The shell found conflicting modules, routes, or menu component bindings. Review the console logs and fix the reported metadata before continuing.")}
        actionText={translateShellMessage(locale, "layout.platformValidationReload", "Reload")}
        onAction={() => window.location.reload()}
      />
      <Alert
        type="error"
        showIcon
        message={translateShellMessage(locale, "layout.platformValidationIssues", "Validation issues")}
        description={
          <div>
            {issues.map((issue) => (
              <div key={issue.code} style={{ marginBottom: 12 }}>
                <Typography.Text strong>{issue.summary}</Typography.Text>
                <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20 }}>
                  {issue.details.map((detail) => (
                    <li key={`${issue.code}-${detail}`}>
                      <Typography.Text>{detail}</Typography.Text>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        }
      />
    </div>
  );
}

function AppRouter() {
  const navigate = useNavigate();
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const patchSession = useAuthStore((state) => state.patchSession);
  const menus = useMenuStore((state) => state.menus);
  const menuResource = useResourceStore((state) => state.resources.menus);
  const dictRecords = useDictStore((state) => state.records);
  const [remoteStatuses, setRemoteStatuses] = useState<ModuleLoadResult[]>([]);
  const [remotesLoaded, setRemotesLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const frontendHydrated = useFrontendStore((state) => state.hydrated);
  const refreshTimerRef = useRef<number | null>(null);
  const lastValidationSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (frontendHydrated) {
      return;
    }
    hydrateFrontendPublicData().catch(() => undefined);
  }, [frontendHydrated]);

  useEffect(() => {
    if (!hydrated || authReady) {
      return;
    }

    let active = true;

    (async () => {
      const storedSession = useAuthStore.getState().session;

      try {
        const nextSession = await restoreSessionOnStartup({
          storedSession,
          fetchCurrentUser,
          refreshSession,
        });
        if (active) {
          if (nextSession) {
            setSession(nextSession);
          } else {
            clearSession();
          }
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setAuthReady(true);
        }
      }
    })().catch(() => {
      if (active) {
        clearSession();
        setAuthReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [authReady, clearSession, hydrated, setSession]);

  useEffect(() => {
    let active = true;
    loadRemoteModules().then((results) => {
      if (active) {
        setRemoteStatuses(results);
        setRemotesLoaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!authReady || !session?.token) {
      return;
    }
    preloadShellData().catch(() => undefined);
  }, [authReady, session?.token]);

  useEffect(() => {
    if (refreshTimerRef.current !== null) {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!authReady || !session?.refreshToken || !session.accessTokenExpiresIn) {
      return;
    }

    const timeoutMs = resolveRefreshDelay(session.accessTokenExpiresIn);
    if (timeoutMs === undefined) {
      return;
    }

    refreshTimerRef.current = window.setTimeout(async () => {
      try {
        const nextSession = await refreshSession(session.refreshToken!);
        patchSession(nextSession);
      } catch {
        clearSession();
        navigate("/login");
      }
    }, timeoutMs);

    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  }, [authReady, clearSession, navigate, patchSession, session?.accessTokenExpiresIn, session?.refreshToken]);

  const appContext = useMemo<AppContextValue>(
    () =>
      buildAppContext(
        () => navigate("/login"),
        () => {
          clearSession();
          eventBus.emit("auth:logout", {});
          navigate("/login");
        },
        () => useAuthStore.getState().session,
      ),
    [clearSession, dictRecords, navigate],
  );

  useEffect(() => {
    if (!authReady || !session?.token || !remotesLoaded) {
      return;
    }
    bootstrapRegisteredModules(appContext).then((results) => {
      if (results.some((result) => result.status === "failed")) {
        setRemoteStatuses((current) => [...current, ...results.filter((result) => result.status === "failed")]);
      }
    });
  }, [appContext, authReady, remotesLoaded, session?.token]);

  useEffect(() => {
    const unsubscribe = eventBus.on("notify:new", (payload) => {
      useNotifyStore.getState().addItem(payload);
    });
    return unsubscribe;
  }, []);

  const dynamicRoutes = useMemo(() => buildRoutesFromMenus(menus, UnavailablePage), [menus]);
  const moduleRoutes = useMemo(() => buildModuleRoutes(), [remotesLoaded]);
  const platformValidation = useMemo(
    () => (authReady && session?.token && remotesLoaded ? validatePlatformConsistency(menus) : { issues: [], hasErrors: false }),
    [authReady, menus, remotesLoaded, session?.token],
  );

  useEffect(() => {
    if (!platformValidation.hasErrors) {
      lastValidationSignatureRef.current = null;
      return;
    }

    const signature = JSON.stringify(platformValidation.issues);
    if (lastValidationSignatureRef.current === signature) {
      return;
    }

    reportPlatformValidation(platformValidation);
    lastValidationSignatureRef.current = signature;
  }, [platformValidation]);

  const routes = [
    { path: "/login", element: session?.token ? <Navigate to="/" replace /> : <LoginPage /> },
    { path: "/401", element: <UnauthorizedPage /> },
    { path: "/404", element: <NotFoundPage /> },
    {
      path: "/",
      element: (
        <AuthGuard>
          <BasicLayout remoteStatuses={remoteStatuses} />
        </AuthGuard>
      ),
      children: [
        { index: true, element: <DashboardPage /> },
        { path: "iframe", element: <IframePage /> },
        ...dynamicRoutes
          .filter((route) => route.path !== "/")
          .map((route) => ({ path: route.path.replace(/^\//, ""), element: route.element })),
        ...moduleRoutes.map((route) => ({ path: route.path.replace(/^\//, ""), element: route.element })),
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
    { path: "*", element: <Navigate to={session?.token ? "/" : "/login"} replace /> },
  ];
  const routedElement = useRoutes(routes);

  const waitingForProtectedRoutes = Boolean(
    authReady
      && session?.token
      && menus.length === 0
      && !menuResource.lastLoadedAt
      && !menuResource.error,
  );

  if (!hydrated || !authReady || !frontendHydrated || waitingForProtectedRoutes) {
    return <AppLoadingFallback />;
  }

  if (platformValidation.hasErrors && session?.token) {
    return <PlatformValidationFallback issues={platformValidation.issues} />;
  }

  return (
    <AppContextProvider value={appContext}>
      <Suspense fallback={<AppLoadingFallback />}>
        {routedElement}
      </Suspense>
    </AppContextProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <AppRouter />
      </AppErrorBoundary>
    </BrowserRouter>
  );
}
