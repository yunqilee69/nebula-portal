import { Typography } from "antd";
import { useI18n } from "@nebula/core";

export function LoginLogTab() {
  const { t } = useI18n();

  return (
    <div style={{ padding: 48, textAlign: "center" }}>
      <span style={{ fontSize: 48 }}>📋</span>
      <Typography.Text type="secondary" style={{ marginTop: 16, display: "block" }}>
        {t("common.noData")}
      </Typography.Text>
    </div>
  );
}
