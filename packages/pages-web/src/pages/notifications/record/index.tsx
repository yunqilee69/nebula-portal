import { SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Select, Table, Tag, Typography } from "antd";
import type { NotifyRecordDetail, NotifyRecordItem, NotifyRecordPageQuery } from "@nebula/core/types";
import { useI18n } from "@nebula/core/i18n";
import { useEffect, useMemo, useState } from "react";
import { fetchNotifyRecordDetail, fetchNotifyRecordPage } from "../../../api/notify-record-api";
import { NeDetailDrawer, NePage, NeSearchPanel, NeTablePanel } from "@nebula/ui-web";

const initialQuery: NotifyRecordPageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };

export function NotificationsRecordPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<NotifyRecordPageQuery>();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<NotifyRecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<NotifyRecordDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channelOptions = useMemo(
    () => [
      { label: t("notify.channel.site"), value: "SITE" },
      { label: t("notify.channel.email"), value: "EMAIL" },
      { label: t("notify.channel.sms"), value: "SMS" },
    ],
    [t],
  );
  const sendStatusOptions = useMemo(
    () => [
      { label: t("notify.status.success"), value: "SUCCESS" },
      { label: t("notify.status.pending"), value: "PENDING" },
      { label: t("notify.status.failed"), value: "FAILED" },
    ],
    [t],
  );

  function getChannelLabel(value: string | undefined) {
    return channelOptions.find((item) => item.value === value)?.label ?? value ?? "-";
  }

  function getSendStatusLabel(value: string | undefined) {
    if (value === "SUCCESS") {
      return t("notify.status.success");
    }
    if (value === "PENDING") {
      return t("notify.status.pending");
    }
    if (value === "FAILED") {
      return t("notify.status.failed");
    }
    return value ?? t("notify.status.unknown");
  }

  async function loadRows(nextQuery: NotifyRecordPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNotifyRecordPage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : t("notifyRecord.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(await fetchNotifyRecordDetail(id));
  }

  useEffect(() => {
    loadRows(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo(
    () => [
      { title: t("common.channel"), dataIndex: "channelType", render: (value: string | undefined) => getChannelLabel(value) },
      { title: t("common.templateCode"), dataIndex: "templateCode", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.subject"), dataIndex: "subjectText", render: (value: string | undefined) => value ?? "-" },
      { title: t("common.receiver"), dataIndex: "receiver", render: (value: string | undefined) => value ?? "-" },
      {
        title: t("common.sendStatus"),
        render: (_: unknown, row: NotifyRecordItem) => (
          <Tag color={row.sendStatus === "SUCCESS" ? "success" : row.sendStatus === "FAILED" ? "error" : "processing"}>
            {getSendStatusLabel(row.sendStatus)}
          </Tag>
        ),
      },
      { title: t("common.sendTime"), dataIndex: "sendTime", render: (value: string | undefined) => value ?? "-" },
    ],
    [channelOptions, t],
  );

  return (
    <NePage>
      <NeSearchPanel
        title={t("notifyRecord.filterTitle")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          filterForm.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="channelType" label={t("common.channel")}>
            <Select allowClear style={{ width: 160 }} options={channelOptions} />
          </Form.Item>
          <Form.Item name="templateCode" label={t("common.templateCode")}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="receiver" label={t("common.receiver")}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="sendStatus" label={t("common.sendStatus")}>
            <Select allowClear style={{ width: 160 }} options={sendStatusOptions} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              {t("common.search")}
            </Button>
          </Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>

      <NeTablePanel summary={t("common.recordCount", undefined, { count: total })} pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}>
        <Table<NotifyRecordItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTablePanel>

      <NeDetailDrawer title={t("notifyRecord.detailTitle")} open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={640}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.channel")}>{getChannelLabel(detail.channelType)}</Descriptions.Item>
            <Descriptions.Item label={t("common.templateCode")}>{detail.templateCode ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.subject")}>{detail.subjectText ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.content")}>{detail.contentText ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.receiver")}>{detail.receiver ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.ccReceiver")}>{detail.ccReceiver ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.bizType")}>{detail.bizType ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.bizNo")}>{detail.bizNo ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.sendStatus")}>{getSendStatusLabel(detail.sendStatus)}</Descriptions.Item>
            <Descriptions.Item label={t("common.failReason")}>{detail.failReason ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.sendTime")}>{detail.sendTime ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.extJson")}>{detail.extJson ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
    </NePage>
  );
}
