import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Popconfirm, Select, Space, Tag } from "antd";
import type { DictTypeItem, DictTypeMutationPayload, DictTypePageQuery } from "@nebula/core";
import { useI18n } from "@nebula/core";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createDictType,
  deleteDictType,
  fetchDictTypePage,
  updateDictType,
} from "../../../api/dict-admin-api";
import { NeModal, NePage, NeSearch, NeTablePage } from "@nebula/ui-web";
import { Table } from "antd";

const initialTypeQuery: DictTypePageQuery = {
  pageNum: 1,
  pageSize: 20,
  code: undefined,
  name: undefined,
  status: undefined,
};

const initialTypeForm: DictTypeMutationPayload = {
  code: "",
  name: "",
  status: 1,
  remark: "",
};

export function AdvancedDictPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [typeFilterForm] = Form.useForm<DictTypePageQuery>();
  const [typeDrawerForm] = Form.useForm<DictTypeMutationPayload>();
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [typeDrawerOpen, setTypeDrawerOpen] = useState(false);
  const [editingType, setEditingType] = useState<DictTypeItem | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);

  const typeColumns = useMemo(
    () => [
      { title: t("common.code"), dataIndex: "code" },
      { title: t("common.name"), dataIndex: "name" },
      {
        title: t("common.status"),
        render: (_: unknown, row: DictTypeItem) =>
          row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: DictTypeItem) => (
          <Space wrap>
            <Button
              size="small"
              type="primary"
              onClick={() => navigate(`/system/dict-items?dictCode=${encodeURIComponent(row.code)}&dictName=${encodeURIComponent(row.name)}`)}
            >
              {t("dict.manageItems")}
            </Button>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingType(row);
                typeDrawerForm.setFieldsValue({
                  code: row.code,
                  name: row.name,
                  status: row.status ?? 1,
                  remark: row.remark ?? "",
                });
                setTypeDrawerOpen(true);
              }}
            >
              {t("common.edit")}
            </Button>
            <Popconfirm
              title={t("common.confirmDelete")}
              onConfirm={async () => {
                await deleteDictType(row.id);
                setReloadSeed((current) => current + 1);
              }}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                {t("common.delete")}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [navigate, t, typeDrawerForm],
  );

  return (
    <NePage>
      <NeTablePage
        searchForm={typeFilterForm}
        request={fetchDictTypePage}
        initialQuery={initialTypeQuery}
        reloadToken={reloadSeed}
        toolbar={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingType(null);
              typeDrawerForm.setFieldsValue(initialTypeForm);
              setTypeDrawerOpen(true);
            }}
          >
            {t("dict.createType")}
          </Button>
        }
        summary={(result) => t("common.recordCount", undefined, { count: result.total })}
      >
        <NeSearch
          title={t("dict.typeManagementTitle")}
          labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
          onReset={() => {
            typeFilterForm.resetFields();
            setReloadSeed((current) => current + 1);
          }}
        >
          <Form
            form={typeFilterForm}
            layout="inline"
            initialValues={initialTypeQuery}
            onFinish={() => setReloadSeed((current) => current + 1)}
          >
            <Form.Item name="code" label={t("common.code")}>
              <Input allowClear />
            </Form.Item>
            <Form.Item name="name" label={t("common.name")}>
              <Input allowClear />
            </Form.Item>
            <Form.Item name="status" label={t("common.status")}>
              <Select
                allowClear
                style={{ width: 140 }}
                options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                {t("common.search")}
              </Button>
            </Form.Item>
          </Form>
        </NeSearch>
        <Table<DictTypeItem> rowKey="id" columns={typeColumns} />
      </NeTablePage>

      <NeModal
        title={editingType ? t("dict.editType") : t("dict.createType")}
        open={typeDrawerOpen}
        onClose={() => setTypeDrawerOpen(false)}
        width={720}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        onConfirm={() => typeDrawerForm.submit()}
        confirmLoading={typeSubmitting}
      >
        <Form
          form={typeDrawerForm}
          layout="vertical"
          className="ne-modal-form-grid"
          initialValues={initialTypeForm}
          onFinish={async (values) => {
            setTypeSubmitting(true);
            try {
              if (editingType) {
                await updateDictType(editingType.id, values);
              } else {
                await createDictType(values);
              }
              setTypeDrawerOpen(false);
              setReloadSeed((current) => current + 1);
            } finally {
              setTypeSubmitting(false);
            }
          }}
        >
          <Form.Item name="code" label={t("common.code")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.code") }) }]}>
            <Input disabled={Boolean(editingType)} />
          </Form.Item>
          <Form.Item name="name" label={t("common.name")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.name") }) }]}>
            <Input />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
          <Form.Item name="remark" label={t("common.remark")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
