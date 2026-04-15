import {
  AppContextProvider,
  AuthGuard,
  bootstrapRegisteredModules,
  buildAppContext,
  buildModuleRoutes,
  buildRoutesFromMenus,
  eventBus,
  hydrateFrontendPublicData,
  registerShellComponents,
  reportPlatformValidation,
  useAuthStore,
  useDictStore,
  useFrontendStore,
  useMenuStore,
  useNotifyStore,
  useResourceStore,
  validatePlatformConsistency,
} from "@nebula/core";
import { resolveRefreshDelay, restoreSessionOnStartup } from "@nebula/auth";
import type { AppContextValue, ModuleLoadResult } from "@nebula/core";
import { Alert, Spin, Typography } from "antd";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, useNavigate, useRoutes } from "react-router-dom";
import { AppErrorBoundary } from "./components/app-error-boundary";
import { BasicLayout } from "./layout/basic-layout";
import {
  DashboardPage,
  fetchCurrentUser,
  fetchFrontendInit,
  fetchFrontendThemes,
  fetchCurrentMenus,
  fetchDictCodes,
  fetchDictByCode,
  fetchCurrentConfig,
  fetchCurrentNotifications,
  IframePage,
  LoginPage,
  NotFoundPage,
  refreshSession,
  UnauthorizedPage,
  UnavailablePage,
  apiClient,
  webEnv,
} from "@nebula/pages-web";
import { preloadShellData } from "@nebula/core";
import { NeExceptionResult } from "@nebula/ui-web";
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
  const [remotesLoaded] = useState(true);
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
    fetchFrontendInit()
      .then((initData) => {
        hydrateFrontendPublicData({
          frontendConfig: initData.frontendConfig,
          defaultPreference: initData.defaultPreference,
        });
      })
      .catch(() => {
        hydrateFrontendPublicData({
          frontendConfig: { projectName: "Nebula", defaultLocale: "zh-CN" },
          defaultPreference: { localeTag: "zh-CN", themeCode: "nebula-light" },
        });
      });
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
    if (!authReady || !session?.token) {
      return;
    }
    preloadShellData({
      fetchMenus: fetchCurrentMenus,
      fetchDictCodes: fetchDictCodes,
      fetchDictByCode: fetchDictByCode,
      fetchConfig: fetchCurrentConfig,
      fetchNotifications: fetchCurrentNotifications,
    }).catch(() => undefined);
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
        {
          requestGet: <T,>(url: string, params?: Record<string, unknown>) => apiClient.get<T>(url, { params }).then((r) => r.data),
          requestPost: <T,>(url: string, payload?: unknown) => apiClient.post<T>(url, payload).then((r) => r.data),
          requestPut: <T,>(url: string, payload?: unknown) => apiClient.put<T>(url, payload).then((r) => r.data),
          requestDelete: <T,>(url: string) => apiClient.delete<T>(url).then((r) => r.data),
          buildStoragePreviewUrl: (file) => {
            if (file.previewUrl) return file.previewUrl;
            if (file.id) return `${webEnv.apiBaseUrl}${webEnv.storageFileContentPathTemplate.replace("{id}", file.id)}`;
            if (file.fileUrl) return file.fileUrl;
            return "";
          },
          buildStorageDownloadUrl: (file) => {
            if (file.id) return `${webEnv.apiBaseUrl}${webEnv.storageFileDetailPathTemplate.replace("{id}", file.id)}`;
            if (file.fileUrl) return file.fileUrl;
            return "";
          },
        },
      ),
    [clearSession, navigate],
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
