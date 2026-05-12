import { Button, Card, Col, Modal, Row, Space, Spin, Typography, message } from "antd";
import { useI18n } from "@nebula/core";
import { useEffect, useState } from "react";
import { fetchOAuth2Bindings, unbindOAuth2Provider } from "../../../api/profile-api";
import { prepareWechatWebRedirectLogin } from "../../../api/auth-api";
import type { OAuth2BindingItem } from "@nebula/core";

const EXPECTED_PROVIDERS = [
  { providerId: "wechat-web", icon: "💬", nameKey: "user.oauth.provider.wechatWeb" },
  { providerId: "wechat-mini-program", icon: "📱", nameKey: "user.oauth.provider.wechatMiniProgram" },
];

export function OauthBindTab() {
  const { t } = useI18n();
  const [bindings, setBindings] = useState<OAuth2BindingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [unbindingKey, setUnbindingKey] = useState<string | null>(null);

  useEffect(() => {
    loadBindings();
  }, []);

  async function loadBindings() {
    setLoading(true);
    try {
      const data = await fetchOAuth2Bindings();
      setBindings(data);
    } catch (error) {
      message.error("加载绑定列表失败");
    } finally {
      setLoading(false);
    }
  }

  function getBindingStatus(providerId: string): OAuth2BindingItem | undefined {
    return bindings.find((b) => b.providerId === providerId);
  }

  async function handleBind(providerId: string) {
    if (providerId === "wechat-mini-program") {
      message.info(t("user.oauth.miniProgramHint"));
      return;
    }

    if (providerId === "wechat-web") {
      try {
        const redirectUrl = window.location.origin + window.location.pathname;
        const { authorizeUrl, state } = await prepareWechatWebRedirectLogin(redirectUrl);
        sessionStorage.setItem("oauth-bind-state", state);
        sessionStorage.setItem("oauth-bind-provider", providerId);
        window.location.href = authorizeUrl;
      } catch (error) {
        message.error("发起绑定失败");
      }
    }
  }

  async function confirmUnbind() {
    if (!unbindingKey) return;
    try {
      await unbindOAuth2Provider(unbindingKey);
      message.success(t("user.oauth.unbindSuccess"));
      setUnbindingKey(null);
      loadBindings();
    } catch (error) {
      message.error("解绑失败");
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Spin />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        {EXPECTED_PROVIDERS.map((provider) => {
          const binding = getBindingStatus(provider.providerId);
          const isBound = binding?.bound ?? false;

          return (
            <Col span={12} key={provider.providerId}>
              <Card
                size="small"
                style={{
                  background: isBound ? "#f6ffed" : "#fafafa",
                  border: isBound ? "1px solid #b7eb8f" : undefined,
                }}
              >
                <Space align="center" size={12} style={{ width: "100%", justifyContent: "space-between" }}>
                  <Space align="center" size={12}>
                    <span style={{ fontSize: 32 }}>{provider.icon}</span>
                    <div>
                      <Typography.Text strong>{t(provider.nameKey)}</Typography.Text>
                      {isBound && binding?.providerUserId && (
                        <Typography.Text type="success" style={{ fontSize: 12, marginLeft: 8 }}>
                          {t("user.oauth.bound")} · {binding.providerUserId}
                        </Typography.Text>
                      )}
                    </div>
                  </Space>
                  {isBound ? (
                    <Button danger size="small" onClick={() => setUnbindingKey(provider.providerId)}>
                      {t("user.oauth.unbind")}
                    </Button>
                  ) : (
                    <Button type="primary" size="small" onClick={() => handleBind(provider.providerId)}>
                      {t("user.oauth.bind")}
                    </Button>
                  )}
                </Space>
              </Card>
            </Col>
          );
        })}
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