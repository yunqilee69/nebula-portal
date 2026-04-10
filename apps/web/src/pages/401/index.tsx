import { useI18n } from "@nebula/core";
import { NeExceptionResult } from "@nebula/ui-web";
import { useNavigate } from "react-router-dom";

export function UnauthorizedPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <NeExceptionResult
      status="403"
      title={t("unauthorized.title")}
      subtitle={t("unauthorized.subtitle")}
      actionText={t("common.backHome")}
      onAction={() => navigate("/")}
    />
  );
}
