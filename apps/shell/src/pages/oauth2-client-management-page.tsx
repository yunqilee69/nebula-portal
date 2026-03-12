import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, InputNumber, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { OAuth2ClientDetail, OAuth2ClientItem, OAuth2ClientMutationPayload, OAuth2ClientPageQuery } from "@platform/core";
import { useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createOAuth2Client, deleteOAuth2Client, fetchOAuth2ClientDetail, fetchOAuth2ClientPage, updateOAuth2Client } from "../api/oauth2-client-api";
import { NeDetailDrawer, NeFormDrawer, NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";

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

export function OAuth2ClientManagementPage() {
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
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load OAuth2 clients");
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
      { title: "Client ID", dataIndex: "clientId" },
      { title: "Client Name", dataIndex: "clientName", render: (value: string | undefined) => value ?? "-" },
      { title: "Type", dataIndex: "clientType", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.status"), render: (_: unknown, row: OAuth2ClientItem) => row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag> },
      {
        title: t("common.actions"),
        render: (_: unknown, row: OAuth2ClientItem) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={(event) => {
              event.stopPropagation();
              setEditing(row);
              fetchOAuth2ClientDetail(row.id).then((resolved) => {
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
              }).catch(() => undefined);
            }}>{t("common.edit")}</Button>
            <Popconfirm title={t("common.confirmDelete")} onConfirm={async (event) => {
              event?.stopPropagation();
              await deleteOAuth2Client(row.id);
              await loadRows(query);
            }}>
              <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [drawerForm, query, t],
  );

  return (
    <NePage>
      <NeSearchPanel title="OAuth2 客户端筛选" labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }} onReset={() => {
        filterForm.resetFields();
        setQuery(initialQuery);
      }}>
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="clientId" label="Client ID"><Input allowClear /></Form.Item>
          <Form.Item name="clientName" label="Client Name"><Input allowClear /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>

      <NeTablePanel toolbar={<Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditing(null);
        drawerForm.setFieldsValue(initialForm);
        setDrawerOpen(true);
      }}>{t("common.create")} OAuth2 Client</Button>} summary={t("common.recordCount", undefined, { count: total })} pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}>
        <Table<OAuth2ClientItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTablePanel>

      <NeDetailDrawer title="OAuth2 Client Detail" open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={560}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Client ID">{detail.clientId}</Descriptions.Item>
            <Descriptions.Item label="Client Name">{detail.clientName ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Grant Types">{detail.grantTypes ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Scopes">{detail.scopes ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Redirect URIs">{detail.redirectUris ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Auto Approve">{detail.autoApprove === 1 ? "Yes" : "No"}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>

      <NeFormDrawer title={editing ? `${t("common.edit")} OAuth2 Client` : `${t("common.create")} OAuth2 Client`} open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={() => drawerForm.submit()} submitting={submitting}>
        <Form form={drawerForm} layout="vertical" initialValues={initialForm} onFinish={async (values) => {
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
        }}>
          <Form.Item name="clientId" label="Client ID" rules={[{ required: true, message: "请输入客户端 ID" }]}><Input disabled={Boolean(editing)} /></Form.Item>
          <Form.Item name="clientSecret" label="Client Secret" rules={editing ? undefined : [{ required: true, message: "请输入客户端密钥" }]}><Input.Password /></Form.Item>
          <Form.Item name="clientName" label="Client Name"><Input /></Form.Item>
          <Form.Item name="grantTypes" label="Grant Types"><Input /></Form.Item>
          <Form.Item name="scopes" label="Scopes"><Input /></Form.Item>
          <Form.Item name="redirectUris" label="Redirect URIs"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="autoApprove" label="Auto Approve"><Select options={[{ label: "No", value: 0 }, { label: "Yes", value: 1 }]} /></Form.Item>
          <Form.Item name="accessTokenValidity" label="Access Token Validity (s)"><InputNumber min={60} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="refreshTokenValidity" label="Refresh Token Validity (s)"><InputNumber min={60} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="additionalInformation" label="Additional Information"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
