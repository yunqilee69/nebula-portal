import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { eventBus, preloadShellData, useAuthStore, useFrontendStore, useI18n } from "@nebula/core";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithPassword } from "../../api/auth-api";
import { fetchCurrentMenus } from "../../api/menu-api";
import { fetchDictCodes, fetchDictByCode } from "../../api/dict-api";
import { fetchCurrentConfig } from "../../api/config-api";
import { fetchCurrentNotifications } from "../../api/notify-api";

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const setSession = useAuthStore((state) => state.setSession);
  const frontendConfig = useFrontendStore((state) => state.frontendConfig);
  const loginConfig = useFrontendStore((state) => state.loginConfig);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      if (loginConfig.usernameEnabled === false) {
        throw new Error(t("login.username.disabled"));
      }
      const session = await loginWithPassword(values);
      setSession(session);
      eventBus.emit("auth:login", session);
      await preloadShellData({
        fetchMenus: fetchCurrentMenus,
        fetchDictCodes: fetchDictCodes,
        fetchDictByCode: fetchDictByCode,
        fetchConfig: fetchCurrentConfig,
        fetchNotifications: fetchCurrentNotifications,
      });
      navigate(from, { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("login.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-screen">
      <Card className="login-card" variant="borderless">
        <Typography.Title level={2}>{frontendConfig.projectName || t("login.title")}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t("login.subtitle")}
        </Typography.Paragraph>
        {loginConfig.usernameEnabled === false ? <Alert style={{ marginBottom: 16 }} type="warning" showIcon message={t("login.username.disabled")} /> : null}
        {error ? <Alert style={{ marginBottom: 16 }} type="error" showIcon message={error} /> : null}
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
      </Card>
    </div>
  );
}
