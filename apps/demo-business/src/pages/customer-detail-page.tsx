import { Descriptions } from "antd";
import { useAppContext } from "@platform/core";
import { NePage, NePanel } from "@platform/ui";

export function CustomerDetailPage() {
  const ctx = useAppContext();
  const uploadLimitValue = ctx.config.get("upload_max_size");
  const uploadLimit = typeof uploadLimitValue === "number" ? uploadLimitValue : 0;

  return (
    <NePage title="Customer Detail" subtitle="Example detail page rendered from a federated remote module.">
      <NePanel title="Context Snapshot">
        <Descriptions column={1}>
          <Descriptions.Item label="Current User">{ctx.auth.getSession()?.user.username ?? "-"}</Descriptions.Item>
          <Descriptions.Item label="Permissions">{ctx.auth.getSession()?.permissions.join(", ") || "-"}</Descriptions.Item>
          <Descriptions.Item label="Upload Limit">{uploadLimit.toString()}</Descriptions.Item>
          <Descriptions.Item label="Dictionary:file_type">
            {ctx.dict.get("file_type").map((item) => item.label).join(", ") || "-"}
          </Descriptions.Item>
        </Descriptions>
      </NePanel>
    </NePage>
  );
}
