import { LockOutlined, QrcodeOutlined, UserOutlined, WechatOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Divider, Form, Input, Segmented, Space, Typography } from "antd";
import { eventBus, preloadNebulaData, useAuthStore, useFrontendStore, useI18n } from "@nebula/core";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createWechatWebQrCode,
  fetchWechatWebLoginStatus,
  loginWithPassword,
  loginWithWechatWebRedirectCallback,
  prepareWechatWebRedirectLogin,
} from "../../api/auth-api";
import { fetchCurrentMenus } from "../../api/menu-api";
import { fetchDictCodes, fetchDictByCode } from "../../api/dict-api";
import { fetchCurrentConfig } from "../../api/config-api";
import { fetchCurrentNotifications } from "../../api/notify-api";

interface LoginFormValues {
  username: string;
  password: string;
}

type WechatWebMode = "redirect" | "qr";
type WechatQrStatus = "WAITING" | "SCANNED" | "SUCCESS" | "EXPIRED";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wechatBusy, setWechatBusy] = useState(false);
  const [wechatError, setWechatError] = useState<string | null>(null);
  const [wechatQrStatus, setWechatQrStatus] = useState<WechatQrStatus | null>(null);
  const [wechatQrLoginId, setWechatQrLoginId] = useState<string | null>(null);
  const [wechatQrCodeUrl, setWechatQrCodeUrl] = useState<string | null>(null);
  const [wechatMode, setWechatMode] = useState<WechatWebMode>("qr");
  const { t } = useI18n();
  const setSession = useAuthStore((state) => state.setSession);
  const frontendConfig = useFrontendStore((state) => state.frontendConfig);
  const loginConfig = useFrontendStore((state) => state.loginConfig);
  const navigate = useNavigate();
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

  const availableWechatModes = useMemo(() => {
    const modes: WechatWebMode[] = [];
    if (redirectEnabled) {
      modes.push("redirect");
    }
    if (qrEnabled) {
      modes.push("qr");
    }
    return modes;
  }, [qrEnabled, redirectEnabled]);

  const clearWechatPoll = () => {
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const handleLoginSuccess = async (session: Awaited<ReturnType<typeof loginWithPassword>>) => {
    setSession(session);
    eventBus.emit("auth:login", session);
    await preloadNebulaData({
      fetchMenus: fetchCurrentMenus,
      fetchDictCodes: fetchDictCodes,
      fetchDictByCode: fetchDictByCode,
      fetchConfig: fetchCurrentConfig,
      fetchNotifications: fetchCurrentNotifications,
    });
    navigate(from, { replace: true });
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
        setWechatError(null);
        await handleLoginSuccess(result.session);
        return;
      }

      if (result.status === "EXPIRED") {
        clearWechatPoll();
        setWechatBusy(false);
        return;
      }

      scheduleWechatQrPoll(loginId);
    } catch (caughtError) {
      clearWechatPoll();
      setWechatBusy(false);
      setWechatQrStatus(null);
      setWechatError(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    }
  };

  const startWechatRedirectLogin = async () => {
    setWechatBusy(true);
    setWechatError(null);
    try {
      const result = await prepareWechatWebRedirectLogin(`${window.location.origin}${window.location.pathname}`);
      if (!result.authorizeUrl) {
        throw new Error(t("login.wechat.unavailable"));
      }
      window.location.href = result.authorizeUrl;
    } catch (caughtError) {
      setWechatBusy(false);
      setWechatError(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    }
  };

  const startWechatQrLogin = async () => {
    setWechatBusy(true);
    setWechatError(null);
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
      setWechatError(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state || handledRedirectCodeRef.current === code) {
      return;
    }

    handledRedirectCodeRef.current = code;
    setWechatBusy(true);
    setWechatError(null);
    setWechatQrStatus("SUCCESS");

    loginWithWechatWebRedirectCallback({ code, state })
      .then(async (session) => {
        await handleLoginSuccess(session);
      })
      .catch((caughtError) => {
        setWechatBusy(false);
        setWechatQrStatus(null);
        setWechatError(caughtError instanceof Error ? caughtError.message : t("login.failed"));
      });
  }, [location.search]);

  useEffect(() => () => {
    clearWechatPoll();
    activeLoginIdRef.current = null;
  }, []);

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      if (loginConfig.usernameEnabled === false) {
        throw new Error(t("login.username.disabled"));
      }
      const session = await loginWithPassword(values);
      await handleLoginSuccess(session);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  const showWechatSection = wechatWebEnabled && availableWechatModes.length > 0;

  return (
    <div className="login-screen">
      <Card className="login-card" variant="borderless">
        <Typography.Title level={2}>{frontendConfig.projectName || t("login.title")}</Typography.Title>
        <Typography.Paragraph type="secondary">{t("login.subtitle")}</Typography.Paragraph>
        {loginConfig.usernameEnabled === false ? <Alert style={{ marginBottom: 16 }} type="warning" showIcon message={t("login.username.disabled")} /> : null}
        {error ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} /> : null}
        {location.search.includes("code=") ? <Alert style={{ marginBottom: 16 }} type="info" showIcon message={t("login.wechat.callback.processing")} /> : null}
        <Form layout="vertical" onFinish={onFinish} initialValues={{ username: "admin", password: "123456" }}>
          <Form.Item label={t("login.username")} name="username" rules={[{ required: true, message: t("login.username.required") }]}>
            <Input prefix={<UserOutlined />} placeholder="admin" />
          </Form.Item>
          <Form.Item label={t("login.password")} name="password" rules={[{ required: true, message: t("login.password.required") }]}>
            <Input.Password prefix={<LockOutlined />} placeholder={t("login.password")} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            {t("login.submit")}
          </Button>
        </Form>

        {showWechatSection ? (
          <>
            <Divider>{t("login.wechat.title")}</Divider>
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                {t("login.wechat.description")}
              </Typography.Paragraph>
              {availableWechatModes.length > 1 ? (
                <Segmented
                  block
                  options={availableWechatModes.map((mode) => ({
                    label: t(mode === "qr" ? "login.wechat.mode.qr" : "login.wechat.mode.redirect"),
                    value: mode,
                  }))}
                  value={wechatMode}
                  onChange={(value) => setWechatMode(value as WechatWebMode)}
                />
              ) : null}
              {wechatError ? <Alert type="error" showIcon message={wechatError} /> : null}
              {wechatMode === "redirect" ? (
                <>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {t("login.wechat.redirect.description")}
                  </Typography.Paragraph>
                  <Button icon={<WechatOutlined />} loading={wechatBusy} onClick={() => void startWechatRedirectLogin()}>
                    {t("login.wechat.start")}
                  </Button>
                </>
              ) : (
                <>
                  <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                    {t("login.wechat.qr.description")}
                  </Typography.Paragraph>
                  {wechatQrStatus ? (
                    <Alert
                      type={wechatQrStatus === "EXPIRED" ? "warning" : "info"}
                      showIcon
                      message={resolveWechatQrStatusMessage(wechatQrStatus, t)}
                    />
                  ) : null}
                  <Button icon={<QrcodeOutlined />} loading={wechatBusy} onClick={() => void startWechatQrLogin()}>
                    {wechatQrLoginId ? t("login.wechat.refresh") : t("login.wechat.start")}
                  </Button>
                  {wechatQrCodeUrl ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: 16, border: "1px solid rgba(5, 5, 5, 0.06)", borderRadius: 12, background: "#fff" }}>
                      <img src={wechatQrCodeUrl} alt={t("login.wechat.qr.alt")} style={{ width: 180, height: 180, objectFit: "contain" }} />
                    </div>
                  ) : null}
                </>
              )}
            </Space>
          </>
        ) : null}
      </Card>
    </div>
  );
}
