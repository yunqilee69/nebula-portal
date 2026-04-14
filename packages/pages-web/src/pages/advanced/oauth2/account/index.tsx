import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography } from "antd";
import type { OAuth2AccountDetail, OAuth2AccountItem, OAuth2AccountMutationPayload, OAuth2AccountPageQuery } from "@nebula/core";
import { useI18n } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { createOAuth2Account, deleteOAuth2Account, fetchOAuth2AccountDetail, fetchOAuth2AccountPage, updateOAuth2Account } from "../../../api/oauth2-account-api";
import { NeDetailDrawer, NeModal, NePage, NeSearchPanel, NeTablePanel } from "@nebula/ui-web";

const initialQuery: OAuth2AccountPageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };
const initialForm: OAuth2AccountMutationPayload = { userId: "", providerId: "github", providerUserId: "", providerAttributes: "" };

export function AdvancedOAuth2AccountPage() {
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

  const providerOptions = useMemo(
    () => [
      { label: t("oauth2.provider.github"), value: "github" },
      { label: t("oauth2.provider.google"), value: "google" },
      { label: t("oauth2.provider.wechat"), value: "wechat" },
      { label: t("oauth2.provider.alipay"), value: "alipay" },
    ],
    [t],
  );

  function getProviderLabel(value: string | undefined) {
    return providerOptions.find((item) => item.value === value)?.label ?? value ?? "-";
  }

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
      setError(caughtError instanceof Error ? caughtError.message : t("oauth2Account.loadFailed"));
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
      { title: t("common.userId"), dataIndex: "userId" },
      { title: t("common.provider"), render: (_: unknown, row: OAuth2AccountItem) => getProviderLabel(row.provider) },
      { title: t("common.account"), render: (_: unknown, row: OAuth2AccountItem) => row.oauth2AccountId ?? "-" },
      {
        title: t("common.status"),
        render: (_: unknown, row: OAuth2AccountItem) => row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag>{row.status ?? "-"}</Tag>,
      },
      {
        title: t("common.actions"),
        render: (_: unknown, row: OAuth2AccountItem) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setEditing(row);
                fetchOAuth2AccountDetail(row.id)
                  .then((resolved) => {
                    drawerForm.setFieldsValue({
                      userId: resolved?.userId ?? row.userId,
                      providerId: resolved?.providerId ?? row.provider ?? "github",
                      providerUserId: resolved?.providerUserId ?? row.oauth2AccountId ?? "",
                      providerAttributes: resolved?.providerAttributes ?? "",
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
                await deleteOAuth2Account(row.id);
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
    [drawerForm, providerOptions, query, t],
  );

  return (
    <NePage>
      <NeSearchPanel
        title={t("oauth2Account.filterTitle")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          filterForm.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="userId" label={t("common.userId")}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="providerId" label={t("common.provider")}>
            <Select allowClear style={{ width: 160 }} options={providerOptions} />
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
            {t("oauth2Account.create")}
          </Button>
        }
        summary={t("common.recordCount", undefined, { count: total })}
        pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
      >
        <Table<OAuth2AccountItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTablePanel>

      <NeDetailDrawer title={t("oauth2Account.detailTitle")} open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={560}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.userId")}>{detail.userId}</Descriptions.Item>
            <Descriptions.Item label={t("common.username")}>{detail.username ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.nickname")}>{detail.nickname ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.provider")}>{getProviderLabel(detail.providerId ?? detail.provider)}</Descriptions.Item>
            <Descriptions.Item label={t("common.providerUserId")}>{detail.providerUserId ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.linkedAt")}>{detail.linkedAt ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.attributes")}>{detail.providerAttributes ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>

      <NeModal
        title={editing ? t("oauth2Account.edit") : t("oauth2Account.create")}
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
                await updateOAuth2Account(editing.id, values);
              } else {
                await createOAuth2Account(values);
              }
              setDrawerOpen(false);
              await loadRows(query);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="userId" label={t("common.userId")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.userId") }) }]}>
            <Input disabled={Boolean(editing)} />
          </Form.Item>
          <Form.Item name="providerId" label={t("common.provider")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.provider") }) }]}>
            <Select options={providerOptions} />
          </Form.Item>
          <Form.Item name="providerUserId" label={t("common.providerUserId")}>
            <Input />
          </Form.Item>
          <Form.Item name="providerAttributes" label={t("common.attributes")} className="ne-modal-form-grid__full">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
