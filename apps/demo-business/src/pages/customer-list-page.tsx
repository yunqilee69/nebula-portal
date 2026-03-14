import { Button, Space, Table } from "antd";
import { NePermission, useAppContext } from "@platform/core";
import { NePage, NeTablePanel } from "@platform/ui";

const rows = [
  { id: "c001", name: "Acme Corp", owner: "Lydia", level: "A" },
  { id: "c002", name: "Orion Retail", owner: "Chen", level: "B" },
];

export function CustomerListPage() {
  const ctx = useAppContext();
  const { t } = ctx.i18n;

  return (
      <NePage
        title={t("demoCustomer.listTitle")}
        subtitle={t("demoCustomer.listSubtitle")}
      extra={
        <Space>
          <Button
            onClick={() => {
              ctx.bus.emit("business:demo_ping", { at: new Date().toISOString() });
            }}
          >
            {t("demoCustomer.emitEvent")}
          </Button>
          <NePermission code="crm:customer:create">
            <Button type="primary">{t("demoCustomer.newCustomer")}</Button>
          </NePermission>
        </Space>
      }
    >
      <NeTablePanel summary={t("demoCustomer.total", undefined, { count: rows.length })}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={rows}
          columns={[
            { title: t("demoCustomer.customer"), dataIndex: "name" },
            { title: t("demoCustomer.owner"), dataIndex: "owner" },
            { title: t("demoCustomer.level"), dataIndex: "level" },
            {
              title: t("common.actions"),
              render: (_, row) => (
                <Space>
                  <NePermission code="crm:customer:edit">
                    <Button size="small">{t("common.edit")}</Button>
                  </NePermission>
                  <Button
                    size="small"
                    onClick={() => {
                      ctx.bus.emit("notify:new", {
                        id: row.id,
                        title: t("demoCustomer.opened", undefined, { name: row.name }),
                        type: "info",
                      });
                    }}
                  >
                    {t("demoCustomer.notify")}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </NeTablePanel>
    </NePage>
  );
}
