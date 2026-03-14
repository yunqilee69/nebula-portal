import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag } from "antd";
import type { SystemParamItem, SystemParamMutationPayload, SystemParamPageQuery } from "@platform/core";
import { NePermission, useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createSystemParam, deleteSystemParam, fetchSystemParamPage, updateSystemParam } from "../../../api/system-param-api";
import { NeDetailDrawer, NeModal, NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";
import { useResourceStore } from "../../../modules/runtime/resource-store";

const initialQuery: SystemParamPageQuery = {
  pageNum: 1,
  pageSize: 10,
  orderName: "updateTime",
  orderType: "desc",
};

export function SystemParamsPage() {
  const { t } = useI18n();
  const [form] = Form.useForm<SystemParamPageQuery>();
  const [drawerForm] = Form.useForm<SystemParamMutationPayload>();
  const [query, setQuery] = useState<SystemParamPageQuery>(initialQuery);
  const [rows, setRows] = useState<SystemParamItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<SystemParamItem | null>(null);
  const [editing, setEditing] = useState<SystemParamItem | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const resource = useResourceStore((state) => state.resources.systemParams);
  const start = useResourceStore((state) => state.start);
  const succeed = useResourceStore((state) => state.succeed);
  const fail = useResourceStore((state) => state.fail);

  useEffect(() => {
    let active = true;
    start("systemParams");
    fetchSystemParamPage(query)
      .then((result) => {
        if (!active) {
          return;
        }
        setRows(result.data);
        setTotal(result.total);
        succeed("systemParams");
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        fail("systemParams", error instanceof Error ? error.message : t("systemParams.loadFailed"));
      });
    return () => {
      active = false;
    };
  }, [fail, query, start, succeed]);

  const columns = useMemo(
    () => [
      { title: t("common.key"), dataIndex: "paramKey" },
      { title: t("common.name"), dataIndex: "paramName", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.group"), dataIndex: "groupCode", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.type"), dataIndex: "dataType", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.dynamic"),
        render: (_: unknown, row: SystemParamItem) =>
          row.isDynamic === 1 ? <Tag color="processing">{t("common.yes")}</Tag> : <Tag>{t("common.no")}</Tag>,
      },
      {
        title: t("common.status"),
        render: (_: unknown, row: SystemParamItem) =>
          row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: SystemParamItem) => (
          <Space>
            <NePermission code="crm:customer:edit">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={(event) => {
                  event.stopPropagation();
                  setEditing(row);
                  drawerForm.setFieldsValue({
                    groupCode: row.groupCode ?? "platform",
                    paramKey: row.paramKey,
                    paramName: row.paramName ?? "",
                    paramValue: "",
                    dataType: row.dataType ?? "STRING",
                    status: row.status ?? 1,
                    isSensitive: row.isSensitive ?? 0,
                    isDynamic: row.isDynamic ?? 1,
                  });
                  setEditorOpen(true);
                }}
              >
                {t("common.edit")}
              </Button>
            </NePermission>
            <NePermission code="crm:customer:export">
              <Popconfirm
                title={t("common.confirmDelete")}
                onConfirm={async () => {
                  await deleteSystemParam(String(row.id));
                  setRows((current) => current.filter((item) => item.id !== row.id));
                }}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
              </Popconfirm>
            </NePermission>
          </Space>
        ),
      },
    ],
    [drawerForm, t],
  );

  return (
    <NePage>
      <NeSearchPanel
        title={t("common.filters")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          form.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form
          form={form}
          layout="inline"
          initialValues={initialQuery}
          onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}
        >
          <Form.Item name="paramKey" label={t("common.paramKey")}>
            <Input allowClear placeholder={t("common.paramKeyExample")} />
          </Form.Item>
          <Form.Item name="paramName" label={t("common.name")}>
            <Input allowClear placeholder={t("common.primaryColorExample")} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select
              style={{ width: 140 }}
              allowClear
              options={[
                { label: t("common.enabled"), value: 1 },
                { label: t("common.disabled"), value: 0 },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t("common.search")}
            </Button>
          </Form.Item>
        </Form>
      </NeSearchPanel>
      <NeTablePanel
        toolbar={
          <Space>
            <NePermission code="crm:customer:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditing(null);
                  drawerForm.setFieldsValue({
                    groupCode: "platform",
                    paramKey: "",
                    paramName: "",
                    paramValue: "",
                    dataType: "STRING",
                    status: 1,
                    isSensitive: 0,
                    isDynamic: 1,
                  });
                  setEditorOpen(true);
                }}
              >
                {t("systemParams.createParam")}
              </Button>
            </NePermission>
            <NePermission code="crm:customer:export">
              <Button>{t("common.exportSnapshot")}</Button>
            </NePermission>
          </Space>
        }
        summary={t("common.recordCount", undefined, { count: total })}
        pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
      >
        <Table<SystemParamItem>
          rowKey="id"
          loading={resource.loading}
          dataSource={rows}
          columns={columns}
          onRow={(record) => ({
            onClick: () => setSelected(record),
          })}
          pagination={false}
        />
      </NeTablePanel>
      <NeDetailDrawer title={t("systemParams.detailTitle")} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.paramKey")}>{selected.paramKey}</Descriptions.Item>
            <Descriptions.Item label={t("common.name")}>{selected.paramName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.group")}>{selected.groupCode ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.type")}>{selected.dataType ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.dynamic")}>{selected.isDynamic === 1 ? t("common.yes") : t("common.no")}</Descriptions.Item>
            <Descriptions.Item label={t("common.sensitive")}>{selected.isSensitive === 1 ? t("common.yes") : t("common.no")}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{selected.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
      <NeModal
        title={editing ? t("systemParams.editParam") : t("systemParams.createParam")}
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        width={720}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        onConfirm={() => drawerForm.submit()}
        confirmLoading={submitting}
      >
        <Form
          form={drawerForm}
          layout="vertical" className="ne-modal-form-grid"
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              if (editing) {
                await updateSystemParam(String(editing.id), values);
              } else {
                await createSystemParam(values);
              }
              setEditorOpen(false);
              const result = await fetchSystemParamPage(query);
              setRows(result.data);
              setTotal(result.total);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="groupCode" label={t("common.group")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.group") }) }]}><Input /></Form.Item>
          <Form.Item name="paramKey" label={t("common.paramKey")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.paramKey") }) }]}><Input disabled={Boolean(editing)} /></Form.Item>
          <Form.Item name="paramName" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}><Input /></Form.Item>
          <Form.Item name="paramValue" label={t("common.value")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="dataType" label={t("common.type")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.type") }) }]}> 
            <Select options={[{ label: t("common.dataTypeString"), value: "STRING" }, { label: t("common.dataTypeInteger"), value: "INTEGER" }, { label: t("common.dataTypeBoolean"), value: "BOOLEAN" }]} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item name="isSensitive" label={t("common.sensitive")}><Select options={[{ label: t("common.no"), value: 0 }, { label: t("common.yes"), value: 1 }]} /></Form.Item>
          <Form.Item name="isDynamic" label={t("common.dynamic")}><Select options={[{ label: t("common.no"), value: 0 }, { label: t("common.yes"), value: 1 }]} /></Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
