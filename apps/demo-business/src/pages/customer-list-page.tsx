import { Button, Space, Table } from "antd";
import { NePermission, useAppContext } from "@platform/core";
import { NePage, NeTablePanel } from "@platform/ui";

const rows = [
  { id: "c001", name: "Acme Corp", owner: "Lydia", level: "A" },
  { id: "c002", name: "Orion Retail", owner: "Chen", level: "B" },
];

export function CustomerListPage() {
  const ctx = useAppContext();

  return (
    <NePage
      title="Customer Center"
      subtitle="This remote module consumes shell auth, config, dictionaries, and event bus APIs."
      extra={
        <Space>
          <Button
            onClick={() => {
              ctx.bus.emit("business:demo_ping", { at: new Date().toISOString() });
            }}
          >
            Emit Event
          </Button>
          <NePermission code="crm:customer:create">
            <Button type="primary">New Customer</Button>
          </NePermission>
        </Space>
      }
    >
      <NeTablePanel summary={`Total ${rows.length} customers`}>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={rows}
          columns={[
            { title: "Customer", dataIndex: "name" },
            { title: "Owner", dataIndex: "owner" },
            { title: "Level", dataIndex: "level" },
            {
              title: "Actions",
              render: (_, row) => (
                <Space>
                  <NePermission code="crm:customer:edit">
                    <Button size="small">Edit</Button>
                  </NePermission>
                  <Button
                    size="small"
                    onClick={() => {
                      ctx.bus.emit("notify:new", {
                        id: row.id,
                        title: `Opened ${row.name}`,
                        type: "info",
                      });
                    }}
                  >
                    Notify
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
