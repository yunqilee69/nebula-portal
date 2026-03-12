import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { OAuth2AccountDetail, OAuth2AccountItem, OAuth2AccountMutationPayload, OAuth2AccountPageQuery } from "@platform/core";
import { useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createOAuth2Account, deleteOAuth2Account, fetchOAuth2AccountDetail, fetchOAuth2AccountPage, updateOAuth2Account } from "../api/oauth2-account-api";
import { NeDetailDrawer, NeFormDrawer, NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";

const initialQuery: OAuth2AccountPageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };
const initialForm: OAuth2AccountMutationPayload = { userId: "", providerId: "github", providerUserId: "", providerAttributes: "" };

export function OAuth2AccountManagementPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<OAuth2AccountPageQuery>();
  const [drawerForm] = Form.useForm<OAuth2AccountMutationPayload>();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<OAuth2AccountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState<OAuth2AccountItem | null>(null);
  const [detail, setDetail] = useState<OAuth2AccountDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRows(nextQuery: OAuth2AccountPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOAuth2AccountPage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load OAuth2 accounts");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(await fetchOAuth2AccountDetail(id));
  }

  useEffect(() => {
    loadRows(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo(
    () => [
      { title: "User ID", dataIndex: "userId" },
      { title: "Provider", render: (_: unknown, row: OAuth2AccountItem) => row.provider ?? "-" },
      { title: "Account", render: (_: unknown, row: OAuth2AccountItem) => row.oauth2AccountId ?? "-" },
      { title: t("common.status"), render: (_: unknown, row: OAuth2AccountItem) => row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag>{row.status ?? "-"}</Tag> },
      {
        title: t("common.actions"),
        render: (_: unknown, row: OAuth2AccountItem) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={(event) => {
              event.stopPropagation();
              setEditing(row);
              fetchOAuth2AccountDetail(row.id).then((resolved) => {
                drawerForm.setFieldsValue({
                  userId: resolved?.userId ?? row.userId,
                  providerId: resolved?.providerId ?? row.provider ?? "github",
                  providerUserId: resolved?.providerUserId ?? row.oauth2AccountId ?? "",
                  providerAttributes: resolved?.providerAttributes ?? "",
                });
                setDrawerOpen(true);
              }).catch(() => undefined);
            }}>{t("common.edit")}</Button>
            <Popconfirm title={t("common.confirmDelete")} onConfirm={async (event) => {
              event?.stopPropagation();
              await deleteOAuth2Account(row.id);
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
      <NeSearchPanel title="OAuth2 账户筛选" labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }} onReset={() => {
        filterForm.resetFields();
        setQuery(initialQuery);
      }}>
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="userId" label="User ID"><Input allowClear /></Form.Item>
          <Form.Item name="providerId" label="Provider"><Select allowClear style={{ width: 160 }} options={[{ label: "GitHub", value: "github" }, { label: "Google", value: "google" }, { label: "Wechat", value: "wechat" }, { label: "Alipay", value: "alipay" }]} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>

      <NeTablePanel toolbar={<Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditing(null);
        drawerForm.setFieldsValue(initialForm);
        setDrawerOpen(true);
      }}>{t("common.create")} OAuth2 Account</Button>} summary={t("common.recordCount", undefined, { count: total })} pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}>
        <Table<OAuth2AccountItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTablePanel>

      <NeDetailDrawer title="OAuth2 Account Detail" open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={560}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="User ID">{detail.userId}</Descriptions.Item>
            <Descriptions.Item label="Username">{detail.username ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Nickname">{detail.nickname ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Provider">{detail.providerId ?? detail.provider ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Provider User ID">{detail.providerUserId ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Linked At">{detail.linkedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Attributes">{detail.providerAttributes ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>

      <NeFormDrawer title={editing ? `${t("common.edit")} OAuth2 Account` : `${t("common.create")} OAuth2 Account`} open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={() => drawerForm.submit()} submitting={submitting}>
        <Form form={drawerForm} layout="vertical" initialValues={initialForm} onFinish={async (values) => {
          setSubmitting(true);
          try {
            if (editing) {
              await updateOAuth2Account(editing.id, values);
            } else {
              await createOAuth2Account(values);
            }
            setDrawerOpen(false);
            await loadRows(query);
          } finally {
            setSubmitting(false);
          }
        }}>
          <Form.Item name="userId" label="User ID" rules={[{ required: true, message: "请输入用户 ID" }]}><Input disabled={Boolean(editing)} /></Form.Item>
          <Form.Item name="providerId" label="Provider" rules={[{ required: true, message: "请选择提供商" }]}><Select options={[{ label: "GitHub", value: "github" }, { label: "Google", value: "google" }, { label: "Wechat", value: "wechat" }, { label: "Alipay", value: "alipay" }]} /></Form.Item>
          <Form.Item name="providerUserId" label="Provider User ID"><Input /></Form.Item>
          <Form.Item name="providerAttributes" label="Provider Attributes"><Input.TextArea rows={4} /></Form.Item>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
