import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, InputNumber, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { OAuth2ClientDetail, OAuth2ClientItem, OAuth2ClientMutationPayload, OAuth2ClientPageQuery } from "@nebula/core";
import { useI18n } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { createOAuth2Client, deleteOAuth2Client, fetchOAuth2ClientDetail, fetchOAuth2ClientPage, updateOAuth2Client } from "../../../api/oauth2-client-api";
import { NeDetailDrawer, NeModal, NePage, NeSearchPanel, NeTablePanel } from "@nebula/ui-web";

const initialQuery: OAuth2ClientPageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };
const initialForm: OAuth2ClientMutationPayload = {
  clientId: "",
  clientSecret: "",
  clientName: "",
  grantTypes: "password,refresh_token",
  scopes: "openid,profile",
  redirectUris: "",
  autoApprove: 0,
  accessTokenValidity: 3600,
  refreshTokenValidity: 604800,
  additionalInformation: "",
  status: 1,
};

export function AdvancedOAuth2ClientPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<OAuth2ClientPageQuery>();
  const [drawerForm] = Form.useForm<OAuth2ClientMutationPayload>();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<OAuth2ClientItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<OAuth2ClientItem | null>(null);
  const [detail, setDetail] = useState<OAuth2ClientDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRows(nextQuery: OAuth2ClientPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOAuth2ClientPage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : t("oauth2Client.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(await fetchOAuth2ClientDetail(id));
  }

  useEffect(() => {
    loadRows(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo(
    () => [
      { title: t("common.clientId"), dataIndex: "clientId" },
      { title: t("common.clientName"), dataIndex: "clientName", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.type"), dataIndex: "clientType", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.status"),
        render: (_: unknown, row: OAuth2ClientItem) => row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: OAuth2ClientItem) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setEditing(row);
                fetchOAuth2ClientDetail(row.id)
                  .then((resolved) => {
                    drawerForm.setFieldsValue({
                      clientId: resolved?.clientId ?? row.clientId,
                      clientSecret: resolved?.clientSecret ?? "",
                      clientName: resolved?.clientName ?? "",
                      grantTypes: resolved?.grantTypes ?? "",
                      scopes: resolved?.scopes ?? "",
                      redirectUris: resolved?.redirectUris ?? "",
                      autoApprove: resolved?.autoApprove ?? 0,
                      accessTokenValidity: resolved?.accessTokenValidity ?? 3600,
                      refreshTokenValidity: resolved?.refreshTokenValidity ?? 604800,
                      additionalInformation: resolved?.additionalInformation ?? "",
                      status: resolved?.status ?? 1,
                    });
                    setDrawerOpen(true);
                  })
                  .catch(() => undefined);
              }}
            >
              {t("common.edit")}
            </Button>
            <Popconfirm
              title={t("common.confirmDelete")}
              onConfirm={async (event) => {
                event?.stopPropagation();
                await deleteOAuth2Client(row.id);
                await loadRows(query);
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
    [drawerForm, query, t],
  );

  return (
    <NePage>
      <NeSearchPanel
        title={t("oauth2Client.filterTitle")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          filterForm.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="clientId" label={t("common.clientId")}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="clientName" label={t("common.clientName")}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t("common.search")}
            </Button>
          </Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>

      <NeTablePanel
        toolbar={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditing(null);
              drawerForm.setFieldsValue(initialForm);
              setDrawerOpen(true);
            }}
          >
            {t("oauth2Client.create")}
          </Button>
        }
        summary={t("common.recordCount", undefined, { count: total })}
        pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
      >
        <Table<OAuth2ClientItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTablePanel>

      <NeDetailDrawer title={t("oauth2Client.detailTitle")} open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={560}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.clientId")}>{detail.clientId}</Descriptions.Item>
            <Descriptions.Item label={t("common.clientName")}>{detail.clientName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.grantTypes")}>{detail.grantTypes ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.scopes")}>{detail.scopes ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.redirectUris")}>{detail.redirectUris ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.autoApprove")}>{detail.autoApprove === 1 ? t("common.yes") : t("common.no")}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>

      <NeModal
        title={editing ? t("oauth2Client.edit") : t("oauth2Client.create")}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        onConfirm={() => drawerForm.submit()}
        confirmLoading={submitting}
      >
        <Form
          form={drawerForm}
          layout="vertical" className="ne-modal-form-grid"
          initialValues={initialForm}
          onFinish={async (values) => {
            setSubmitting(true);
            try {
              if (editing) {
                await updateOAuth2Client(editing.id, values);
              } else {
                await createOAuth2Client(values);
              }
              setDrawerOpen(false);
              await loadRows(query);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="clientId" label={t("common.clientId")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.clientId") }) }]}>
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item name="clientSecret" label={t("common.clientSecret")} rules={editing ? undefined : [{ required: true, message: t("validation.enterField", undefined, { field: t("common.clientSecret") }) }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="clientName" label={t("common.clientName")}>
            <Input />
          </Form.Item>
          <Form.Item name="grantTypes" label={t("common.grantTypes")}>
            <Input />
          </Form.Item>
          <Form.Item name="scopes" label={t("common.scopes")}>
            <Input />
          </Form.Item>
          <Form.Item name="redirectUris" label={t("common.redirectUris")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="autoApprove" label={t("common.autoApprove")}>
            <Select options={[{ label: t("common.no"), value: 0 }, { label: t("common.yes"), value: 1 }]} />
          </Form.Item>
          <Form.Item name="accessTokenValidity" label={t("common.accessTokenValidity")}>
            <InputNumber min={60} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="refreshTokenValidity" label={t("common.refreshTokenValidity")}>
            <InputNumber min={60} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="additionalInformation" label={t("common.additionalInformation")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label={t("common.status")}>
            <Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} />
          </Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
