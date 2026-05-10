import { QrcodeOutlined, WechatOutlined } from "@ant-design/icons";
import { Alert, Button, Segmented, Space, Typography } from "antd";
import type { WechatQrStatus, WechatWebMode } from "../login-types";

export interface WechatFormProps {
  availableModes: WechatWebMode[];
  busy: boolean;
  mode: WechatWebMode;
  qrCodeUrl: string | null;
  qrLoginId: string | null;
  qrStatus: WechatQrStatus | null;
  description: string;
  redirectDescription: string;
  qrDescription: string;
  redirectModeLabel: string;
  qrModeLabel: string;
  startLabel: string;
  refreshLabel: string;
  qrAlt: string;
  callbackProcessingLabel: string;
  resolveQrStatusMessage: (status: WechatQrStatus) => string;
  onModeChange: (mode: WechatWebMode) => void;
  onStartRedirect: () => void;
  onStartQr: () => void;
}

export function WechatForm({
  availableModes,
  busy,
  mode,
  qrCodeUrl,
  qrLoginId,
  qrStatus,
  description,
  redirectDescription,
  qrDescription,
  redirectModeLabel,
  qrModeLabel,
  startLabel,
  refreshLabel,
  qrAlt,
  callbackProcessingLabel,
  resolveQrStatusMessage,
  onModeChange,
  onStartRedirect,
  onStartQr,
}: WechatFormProps) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {description}
      </Typography.Paragraph>
      {availableModes.length > 1 ? (
        <Segmented
          block
          options={availableModes.map((wechatMode) => ({
            label: wechatMode === "qr" ? qrModeLabel : redirectModeLabel,
            value: wechatMode,
          }))}
          value={mode}
          onChange={(value) => onModeChange(value as WechatWebMode)}
        />
      ) : null}
      {mode === "redirect" ? (
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {redirectDescription}
          </Typography.Paragraph>
          {qrStatus === "SUCCESS" ? <Alert type="info" showIcon message={callbackProcessingLabel} /> : null}
          <Button icon={<WechatOutlined />} loading={busy} onClick={onStartRedirect}>
            {startLabel}
          </Button>
        </>
      ) : (
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {qrDescription}
          </Typography.Paragraph>
          {qrStatus ? (
            <Alert type={qrStatus === "EXPIRED" ? "warning" : "info"} showIcon message={resolveQrStatusMessage(qrStatus)} />
          ) : null}
          <Button icon={<QrcodeOutlined />} loading={busy} onClick={onStartQr}>
            {qrLoginId ? refreshLabel : startLabel}
          </Button>
          {qrCodeUrl ? (
            <div className="login-wechat-qr-frame">
              <img className="login-wechat-qr-image" src={qrCodeUrl} alt={qrAlt} />
            </div>
          ) : null}
        </>
      )}
    </Space>
  );
}
