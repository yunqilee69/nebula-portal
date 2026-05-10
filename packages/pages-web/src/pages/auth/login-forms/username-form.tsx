import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Form, Input } from "antd";
import type { LoginFormValues } from "../login-types";

export interface UsernameFormProps {
  disabled: boolean;
  loading: boolean;
  usernameLabel: string;
  usernameRequiredMessage: string;
  passwordLabel: string;
  passwordRequiredMessage: string;
  submitLabel: string;
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
}

export function UsernameForm({
  disabled,
  loading,
  usernameLabel,
  usernameRequiredMessage,
  passwordLabel,
  passwordRequiredMessage,
  submitLabel,
  onSubmit,
}: UsernameFormProps) {
  return (
    <Form layout="vertical" onFinish={onSubmit} initialValues={{ username: "admin", password: "123456" }} disabled={disabled}>
      <Form.Item label={usernameLabel} name="username" rules={[{ required: true, message: usernameRequiredMessage }]}>
        <Input prefix={<UserOutlined />} placeholder="admin" />
      </Form.Item>
      <Form.Item label={passwordLabel} name="password" rules={[{ required: true, message: passwordRequiredMessage }]}>
        <Input.Password prefix={<LockOutlined />} placeholder={passwordLabel} />
      </Form.Item>
      <Button type="primary" htmlType="submit" loading={loading} block>
        {submitLabel}
      </Button>
    </Form>
  );
}
