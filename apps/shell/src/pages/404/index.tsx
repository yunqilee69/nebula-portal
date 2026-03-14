import { useI18n } from "@platform/core";
import { NeExceptionResult } from "@platform/ui";
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
