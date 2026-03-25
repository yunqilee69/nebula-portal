import { Descriptions } from "antd";
import { useAppContext } from "@platform/core";
import { NeDict, NePage, NePanel } from "@platform/ui";

export function CustomerDetailPage() {
  const ctx = useAppContext();
  const { t } = ctx.i18n;
  const uploadLimitValue = ctx.config.get("upload_max_size");
  const uploadLimit = typeof uploadLimitValue === "number" ? uploadLimitValue : 0;

  return (
    <NePage title={t("demoCustomer.detailTitle")} subtitle={t("demoCustomer.detailSubtitle")}>
      <NePanel title={t("demoCustomer.contextSnapshot")}>
        <Descriptions column={1}>
          <Descriptions.Item label={t("demoCustomer.currentUser")}>{ctx.auth.getSession()?.user.username ?? "-"}</Descriptions.Item>
          <Descriptions.Item label={t("demoCustomer.permissions")}>{ctx.auth.getSession()?.permissions.join(", ") || "-"}</Descriptions.Item>
          <Descriptions.Item label={t("demoCustomer.uploadLimit")}>{uploadLimit.toString()}</Descriptions.Item>
          <Descriptions.Item label={t("demoCustomer.dictionaryFileType")}>
            <NeDict dictCode="file_type" />
          </Descriptions.Item>
        </Descriptions>
      </NePanel>
    </NePage>
  );
}
