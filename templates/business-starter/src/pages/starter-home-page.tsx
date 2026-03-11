import { Typography } from "antd";
import { NePage, NePanel } from "@platform/ui";

export function StarterHomePage() {
  return (
    <NePage title="__APP_TITLE__" subtitle="Starter module created from the platform template.">
      <NePanel title="Next Steps">
        <Typography.Paragraph style={{ marginBottom: 0 }}>
          Replace the template route, register more components, and start building your business workflows.
        </Typography.Paragraph>
      </NePanel>
    </NePage>
  );
}
