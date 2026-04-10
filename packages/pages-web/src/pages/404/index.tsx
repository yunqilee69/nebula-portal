import { useI18n } from "@nebula/core";
import { NeExceptionResult } from "@nebula/ui-web";
import { useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <NeExceptionResult
      status="404"
      title={t("notFound.title")}
      subtitle={t("notFound.subtitle")}
      actionText={t("common.backHome")}
      onAction={() => navigate("/")}
    />
  );
}
