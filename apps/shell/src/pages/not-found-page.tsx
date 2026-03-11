import { Result } from "antd";
import { useI18n } from "@platform/core";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  return <Result status="404" title={t("notFound.title")} extra={<a onClick={() => navigate("/")}>{t("common.backHome")}</a>} />;
}
