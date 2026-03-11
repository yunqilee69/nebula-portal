import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Form, Input, Typography } from "antd";
import { eventBus, useI18n } from "@platform/core";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { loginWithPassword } from "../../api/auth-api";
import { preloadShellData } from "../runtime/bootstrap";
import { useAuthStore } from "./auth-store";

interface LoginFormValues {
  username: string;
  password: string;
}

export function LoginPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useI18n();
  const setSession = useAuthStore((state) => state.setSession);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const onFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const session = await loginWithPassword(values);
      setSession(session);
      eventBus.emit("auth:login", session);
      await preloadShellData();
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
        <Typography.Title level={2}>{t("login.title")}</Typography.Title>
        <Typography.Paragraph type="secondary">
          {t("login.subtitle")}
        </Typography.Paragraph>
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
