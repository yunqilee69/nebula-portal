import { UserOutlined, WechatOutlined } from "@ant-design/icons";
import { message } from "antd";
import { eventBus, prepareAppData, useAuthStore, useFrontendStore, useI18n } from "@nebula/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  createWechatWebQrCode,
  fetchWechatWebLoginStatus,
  loginWithPassword,
  loginWithWechatWebRedirectCallback,
  prepareWechatWebRedirectLogin,
} from "../../api/auth-api";
import { fetchCurrentMenus } from "../../api/menu-api";
import { fetchCurrentNotifications } from "../../api/notify-api";
import { LoginBadgeSwitch } from "./login-badge-switch";
import { LoginCard } from "./login-card";
import { UsernameForm, WechatForm } from "./login-forms";
import type { LoginFormValues, LoginMode, LoginModeOption, WechatQrStatus, WechatWebMode } from "./login-types";

const DEFAULT_WECHAT_POLL_INTERVAL_MS = 2000;

function resolveWechatQrStatusMessage(status: WechatQrStatus, t: ReturnType<typeof useI18n>["t"]) {
  switch (status) {
    case "SCANNED":
      return t("login.wechat.scanned");
    case "EXPIRED":
      return t("login.wechat.expired");
    case "SUCCESS":
      return t("login.wechat.callback.processing");
    case "WAITING":
    default:
      return t("login.wechat.pending");
  }
}

export function LoginPage() {
  const [activeMode, setActiveMode] = useState<LoginMode>("username");
  const [submitting, setSubmitting] = useState(false);
  const [wechatBusy, setWechatBusy] = useState(false);
  const [wechatQrStatus, setWechatQrStatus] = useState<WechatQrStatus | null>(null);
  const [wechatQrLoginId, setWechatQrLoginId] = useState<string | null>(null);
  const [wechatQrCodeUrl, setWechatQrCodeUrl] = useState<string | null>(null);
  const [wechatMode, setWechatMode] = useState<WechatWebMode>("qr");
  const { t } = useI18n();
  const setSession = useAuthStore((state) => state.setSession);
  const frontendConfig = useFrontendStore((state) => state.frontendConfig);
  const loginConfig = useFrontendStore((state) => state.loginConfig);
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  const pollTimerRef = useRef<number | null>(null);
  const activeLoginIdRef = useRef<string | null>(null);
  const handledRedirectCodeRef = useRef<string | null>(null);

  const wechatWebEnabled = loginConfig.wechatWebEnabled ?? loginConfig.wechatOauth2Enabled ?? false;
  const redirectEnabled = loginConfig.wechatWebRedirectEnabled ?? wechatWebEnabled;
  const qrEnabled = loginConfig.wechatWebQrEnabled ?? wechatWebEnabled;

  useEffect(() => {
    if (loginConfig.wechatWebMode === "redirect" || loginConfig.wechatWebMode === "qr") {
      setWechatMode(loginConfig.wechatWebMode);
      return;
    }

    if (qrEnabled) {
      setWechatMode("qr");
      return;
    }

    if (redirectEnabled) {
      setWechatMode("redirect");
    }
  }, [loginConfig.wechatWebMode, qrEnabled, redirectEnabled]);

  const availableWechatModes = useMemo<WechatWebMode[]>(() => {
    const modes: WechatWebMode[] = [];
    if (redirectEnabled) {
      modes.push("redirect");
    }
    if (qrEnabled) {
      modes.push("qr");
    }
    return modes;
  }, [qrEnabled, redirectEnabled]);

  const showWechatSection = wechatWebEnabled && availableWechatModes.length > 0;

  const loginModes = useMemo<LoginModeOption[]>(() => {
    const modes: LoginModeOption[] = [];

    if (loginConfig.usernameEnabled !== false) {
      modes.push({
        key: "username",
        label: t("login.username"),
        description: t("login.subtitle"),
        icon: <UserOutlined />,
      });
    }

    if (showWechatSection) {
      modes.push({
        key: "wechat",
        label: t("login.wechat.title"),
        description: t("login.wechat.description"),
        icon: <WechatOutlined />,
      });
    }

    return modes;
  }, [loginConfig.usernameEnabled, showWechatSection, t]);

  useEffect(() => {
    if (loginModes.some((mode) => mode.key === activeMode)) {
      return;
    }

    const fallbackMode = loginModes[0]?.key;
    if (fallbackMode) {
      setActiveMode(fallbackMode);
    }
  }, [activeMode, loginModes]);

  const activeModeOption = useMemo(() => loginModes.find((mode) => mode.key === activeMode) ?? loginModes[0], [activeMode, loginModes]);

  const clearWechatPoll = () => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleLoginSuccess = async (session: Awaited<ReturnType<typeof loginWithPassword>>) => {
    setSession(session);
    eventBus.emit("auth:login", session);

    await prepareAppData({
      sessionMenuList: session.menuList,
      fetchMenus: session.menuList ? undefined : fetchCurrentMenus,
      fetchNotifications: fetchCurrentNotifications,
    });

    const destination = from ?? "/";
    eventBus.emit("auth:navigate-after-login", { destination });
  };

  const scheduleWechatQrPoll = (loginId: string) => {
    clearWechatPoll();
    pollTimerRef.current = window.setTimeout(() => {
      void pollWechatQrStatus(loginId);
    }, DEFAULT_WECHAT_POLL_INTERVAL_MS);
  };

  const pollWechatQrStatus = async (loginId: string) => {
    if (activeLoginIdRef.current !== loginId) {
      return;
    }

    try {
      const result = await fetchWechatWebLoginStatus(loginId);
      if (activeLoginIdRef.current !== loginId) {
        return;
      }

      setWechatQrStatus(result.status);

      if (result.status === "SUCCESS" && "session" in result) {
        clearWechatPoll();
        setWechatBusy(false);
        await handleLoginSuccess(result.session);
        return;
      }

      if (result.status === "EXPIRED") {
        clearWechatPoll();
        setWechatBusy(false);
        message.warning(resolveWechatQrStatusMessage(result.status, t));
        return;
      }

      scheduleWechatQrPoll(loginId);
    } catch (caughtError) {
      clearWechatPoll();
      setWechatBusy(false);
      setWechatQrStatus(null);
      message.error(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    }
  };

  const startWechatRedirectLogin = async () => {
    setWechatBusy(true);
    try {
      const result = await prepareWechatWebRedirectLogin(`${window.location.origin}${window.location.pathname}`);
      if (!result.authorizeUrl) {
        throw new Error(t("login.wechat.unavailable"));
      }
      window.location.href = result.authorizeUrl;
    } catch (caughtError) {
      setWechatBusy(false);
      message.error(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    }
  };

  const startWechatQrLogin = async () => {
    setWechatBusy(true);
    setWechatQrStatus("WAITING");
    clearWechatPoll();

    try {
      const result = await createWechatWebQrCode(from);
      if (!result.loginId || !result.qrCodeUrl) {
        throw new Error(t("login.wechat.unavailable"));
      }

      activeLoginIdRef.current = result.loginId;
      setWechatQrLoginId(result.loginId);
      setWechatQrCodeUrl(result.qrCodeUrl);
      setWechatBusy(false);
      scheduleWechatQrPoll(result.loginId);
    } catch (caughtError) {
      activeLoginIdRef.current = null;
      setWechatBusy(false);
      setWechatQrStatus(null);
      setWechatQrLoginId(null);
      setWechatQrCodeUrl(null);
      message.error(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state || handledRedirectCodeRef.current === code) {
      return;
    }

    if (showWechatSection) {
      setActiveMode("wechat");
      if (redirectEnabled) {
        setWechatMode("redirect");
      }
    }

    handledRedirectCodeRef.current = code;
    setWechatBusy(true);
    setWechatQrStatus("SUCCESS");

    loginWithWechatWebRedirectCallback({ code, state })
      .then(async (session) => {
        await handleLoginSuccess(session);
      })
      .catch((caughtError) => {
        setWechatBusy(false);
        setWechatQrStatus(null);
        message.error(caughtError instanceof Error ? caughtError.message : t("login.failed"));
      });
  }, [location.search, redirectEnabled, showWechatSection, t]);

  useEffect(
    () => () => {
      clearWechatPoll();
      activeLoginIdRef.current = null;
    },
    [],
  );

  const handleUsernameSubmit = async (values: LoginFormValues) => {
    if (loginConfig.usernameEnabled === false) {
      message.warning(t("login.username.disabled"));
      return;
    }

    setSubmitting(true);
    try {
      const session = await loginWithPassword(values);
      await handleLoginSuccess(session);
    } catch (caughtError) {
      message.error(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <LoginCard
        title={frontendConfig.projectName || t("login.title")}
        description={activeModeOption?.description ?? t("login.subtitle")}
        badges={
          loginModes.length > 1 ? (
            <LoginBadgeSwitch label={t("login.badges.other")} modes={loginModes} activeMode={activeMode} onChange={setActiveMode} />
          ) : undefined
        }
      >
        {activeMode === "wechat" ? (
          <WechatForm
            availableModes={availableWechatModes}
            busy={wechatBusy}
            mode={wechatMode}
            qrCodeUrl={wechatQrCodeUrl}
            qrLoginId={wechatQrLoginId}
            qrStatus={wechatQrStatus}
            description={t("login.wechat.description")}
            redirectDescription={t("login.wechat.redirect.description")}
            qrDescription={t("login.wechat.qr.description")}
            redirectModeLabel={t("login.wechat.mode.redirect")}
            qrModeLabel={t("login.wechat.mode.qr")}
            startLabel={t("login.wechat.start")}
            refreshLabel={t("login.wechat.refresh")}
            qrAlt={t("login.wechat.qr.alt")}
            callbackProcessingLabel={t("login.wechat.callback.processing")}
            resolveQrStatusMessage={(status) => resolveWechatQrStatusMessage(status, t)}
            onModeChange={setWechatMode}
            onStartRedirect={() => void startWechatRedirectLogin()}
            onStartQr={() => void startWechatQrLogin()}
          />
        ) : (
          <UsernameForm
            disabled={loginConfig.usernameEnabled === false}
            loading={submitting}
            usernameLabel={t("login.username")}
            usernameRequiredMessage={t("login.username.required")}
            passwordLabel={t("login.password")}
            passwordRequiredMessage={t("login.password.required")}
            submitLabel={t("login.submit")}
            onSubmit={handleUsernameSubmit}
          />
        )}
      </LoginCard>
    </div>
  );
}
