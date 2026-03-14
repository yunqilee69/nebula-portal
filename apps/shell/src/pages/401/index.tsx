import { useI18n } from "@platform/core";
import { NeExceptionResult } from "@platform/ui";
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
