import { Alert } from "antd";
import { useI18n } from "@nebula/core/i18n";

export function UnavailablePage() {
  const { t } = useI18n();
  return (
    <Alert
      type="warning"
      showIcon
      message={t("unavailable.title")}
      description={t("unavailable.subtitle")}
    />
  );
}
