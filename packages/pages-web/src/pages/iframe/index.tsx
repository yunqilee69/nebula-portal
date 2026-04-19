import { Alert } from "antd";
import { useI18n } from "@nebula/core/i18n";
import { useSearchParams } from "react-router-dom";

export function IframePage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const url = params.get("url");

  if (!url) {
    return <Alert type="error" message={t("iframe.invalid")} showIcon />;
  }

  return (
    <iframe
      title={t("iframe.title")}
      src={decodeURIComponent(url)}
      style={{ width: "100%", minHeight: "calc(100vh - 180px)", border: "none", background: "#fff" }}
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}
