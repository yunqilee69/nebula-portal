import { Button, Card, Col, Modal, Row, Space, Typography, message } from "antd";
import { useI18n } from "@nebula/core";
import { useState } from "react";

interface OAuthProvider {
  key: string;
  nameKey: string;
  icon: string;
  bound: boolean;
  boundInfo?: string;
}

const PROVIDER_KEYS = [
  { key: "wechat_work", nameKey: "user.oauth.provider.wechatWork", icon: "📧" },
  { key: "dingtalk", nameKey: "user.oauth.provider.dingtalk", icon: "💬" },
  { key: "github", nameKey: "user.oauth.provider.github", icon: "🔗" },
  { key: "gitlab", nameKey: "user.oauth.provider.gitlab", icon: "🦊" },
];

// Mock data for demonstration - will be replaced with real API data
const MOCK_BOUND_STATUS: Record<string, { bound: boolean; boundInfo?: string }> = {
  wechat_work: { bound: false },
  dingtalk: { bound: true, boundInfo: "张三" },
  github: { bound: true, boundInfo: "zhangsan_dev" },
  gitlab: { bound: false },
};

export function OauthBindTab() {
  const { t } = useI18n();

  const providers = PROVIDER_KEYS.map((p) => ({
    ...p,
    bound: MOCK_BOUND_STATUS[p.key]?.bound ?? false,
    boundInfo: MOCK_BOUND_STATUS[p.key]?.boundInfo,
  }));

  const [unbindingKey, setUnbindingKey] = useState<string | null>(null);

  const handleBind = (providerKey: string) => {
    message.info(t("user.oauth.bindHint"));
  };

  const handleUnbind = (providerKey: string) => {
    setUnbindingKey(providerKey);
  };

  const confirmUnbind = () => {
    message.info(t("user.oauth.unbindHint"));
    setUnbindingKey(null);
  };

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        {providers.map((provider) => (
          <Col span={12} key={provider.key}>
            <Card
              size="small"
              style={{
                background: provider.bound ? "#f6ffed" : "#fafafa",
                border: provider.bound ? "1px solid #b7eb8f" : undefined,
              }}
            >
              <Space align="center" size={12} style={{ width: "100%", justifyContent: "space-between" }}>
                <Space align="center" size={12}>
                  <span style={{ fontSize: 32 }}>{provider.icon}</span>
                  <div>
                    <Typography.Text strong>{t(provider.nameKey)}</Typography.Text>
                    {provider.bound && provider.boundInfo && (
                      <Typography.Text type="success" style={{ fontSize: 12, marginLeft: 8 }}>
                        {t("user.oauth.bound")} · {provider.boundInfo}
                      </Typography.Text>
                    )}
                  </div>
                </Space>
                {provider.bound ? (
                  <Button danger size="small" onClick={() => handleUnbind(provider.key)}>
                    {t("user.oauth.unbind")}
                  </Button>
                ) : (
                  <Button type="primary" size="small" onClick={() => handleBind(provider.key)}>
                    {t("user.oauth.bind")}
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        open={unbindingKey !== null}
        title={t("user.oauth.unbind")}
        onOk={confirmUnbind}
        onCancel={() => setUnbindingKey(null)}
        okText={t("user.oauth.unbind")}
        cancelText={t("common.cancel")}
      >
        <Typography.Text>{t("user.oauth.unbindConfirm")}</Typography.Text>
      </Modal>
    </div>
  );
}
