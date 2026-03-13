import { AppContextProvider, bootstrapRegisteredModules, buildModuleRoutes, buildRoutesFromMenus, eventBus } from "@platform/core";
import type { AppContextValue, ModuleLoadResult } from "@platform/core";
import { Spin } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, useNavigate, useRoutes } from "react-router-dom";
import { AppErrorBoundary } from "./components/app-error-boundary";
import { refreshSession } from "./api/auth-api";
import { AuthGuard } from "./modules/auth/auth-guard";
import { LoginPage } from "./modules/auth/login-page";
import { useAuthStore } from "./modules/auth/auth-store";
import { resolveRefreshDelay, shouldRefreshSession } from "./modules/auth/session-utils";
import { BasicLayout } from "./layout/basic-layout";
import { DashboardPage } from "./pages/dashboard-page";
import { ButtonPermissionPage } from "./pages/button-permission-page";
import { DictManagementPage } from "./pages/dict-management-page";
import { IframePage } from "./pages/iframe-page";
import { MenuManagementPage } from "./pages/menu-management-page";
import { MenuPermissionPage } from "./pages/menu-permission-page";
import { NotifyRecordPage } from "./pages/notify-record-page";
import { NotifyTemplateManagementPage } from "./pages/notify-template-management-page";
import { NotificationsPage } from "./pages/notifications-page";
import { NotFoundPage } from "./pages/not-found-page";
import { OAuth2AccountManagementPage } from "./pages/oauth2-account-management-page";
import { OAuth2ClientManagementPage } from "./pages/oauth2-client-management-page";
import { OrganizationManagementPage } from "./pages/organization-management-page";
import { OrgPermissionPage } from "./pages/org-permission-page";
import { RoleAccessPage } from "./pages/role-access-page";
import { StorageCenterPage } from "./pages/storage-center-page";
import { SystemParamsPage } from "./pages/system-params-page";
import { UnavailablePage } from "./pages/unavailable-page";
import { UserManagementPage } from "./pages/user-management-page";
import { loadRemoteModules } from "./modules/runtime/remote-modules";
import { buildAppContext, preloadShellData } from "./modules/runtime/bootstrap";
import { useDictStore } from "./modules/dict/dict-store";
import { useMenuStore } from "./modules/menu/menu-store";
import { useNotifyStore } from "./modules/notify/notify-store";

function AppRouter() {
  const navigate = useNavigate();
  const hydrate = useAuthStore((state) => state.hydrate);
  const hydrated = useAuthStore((state) => state.hydrated);
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const patchSession = useAuthStore((state) => state.patchSession);
  const menus = useMenuStore((state) => state.menus);
  const dictRecords = useDictStore((state) => state.records);
  const [remoteStatuses, setRemoteStatuses] = useState<ModuleLoadResult[]>([]);
  const [remotesLoaded, setRemotesLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated || authReady) {
      return;
    }

    let active = true;

    (async () => {
      const storedSession = useAuthStore.getState().session;

      if (!storedSession?.token) {
        if (active) {
          setAuthReady(true);
        }
        return;
      }

      if (!shouldRefreshSession(storedSession)) {
        if (active) {
          setAuthReady(true);
        }
        return;
      }

      if (!storedSession.refreshToken) {
        if (active) {
          setAuthReady(true);
        }
        return;
      }

      try {
        const nextSession = await refreshSession(storedSession.refreshToken);
        if (active) {
          setSession(nextSession);
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

  const dynamicRoutes = useMemo(
    () => buildRoutesFromMenus(menus, UnavailablePage),
    [menus],
  );
  const moduleRoutes = useMemo(() => buildModuleRoutes(), [remotesLoaded]);

  const routes = [
    { path: "/login", element: session?.token ? <Navigate to="/" replace /> : <LoginPage /> },
    {
      path: "/",
      element: (
        <AuthGuard>
          <BasicLayout remoteStatuses={remoteStatuses} />
        </AuthGuard>
      ),
      children: [
        { index: true, element: <DashboardPage /> },
        { path: "platform/menus", element: <MenuManagementPage /> },
        { path: "platform/organizations", element: <OrganizationManagementPage /> },
        { path: "platform/users", element: <UserManagementPage /> },
        { path: "platform/dicts", element: <DictManagementPage /> },
        { path: "platform/oauth2-clients", element: <OAuth2ClientManagementPage /> },
        { path: "platform/oauth2-accounts", element: <OAuth2AccountManagementPage /> },
        { path: "platform/org-permissions", element: <OrgPermissionPage /> },
        { path: "platform/menu-permissions", element: <MenuPermissionPage /> },
        { path: "platform/button-permissions", element: <ButtonPermissionPage /> },
        { path: "platform/params", element: <SystemParamsPage /> },
        { path: "platform/notify-templates", element: <NotifyTemplateManagementPage /> },
        { path: "platform/notify-records", element: <NotifyRecordPage /> },
        { path: "platform/notifications", element: <NotificationsPage /> },
        { path: "platform/access", element: <RoleAccessPage /> },
        { path: "platform/storage", element: <StorageCenterPage /> },
        { path: "iframe", element: <IframePage /> },
        ...dynamicRoutes.map((route) => ({ path: route.path.replace(/^\//, ""), element: route.element })),
        ...moduleRoutes.map((route) => ({ path: route.path.replace(/^\//, ""), element: route.element })),
        { path: "*", element: <NotFoundPage /> },
      ],
    },
    { path: "*", element: <Navigate to={session?.token ? "/" : "/login"} replace /> },
  ];

  if (!hydrated || !authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return <AppContextProvider value={appContext}>{useRoutes(routes)}</AppContextProvider>;
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
