import { SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Select, Table, Tag, Typography } from "antd";
import type { NotifyRecordDetail, NotifyRecordItem, NotifyRecordPageQuery } from "@platform/core";
import { useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { fetchNotifyRecordDetail, fetchNotifyRecordPage } from "../api/notify-record-api";
import { NeDetailDrawer, NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";

const initialQuery: NotifyRecordPageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };

export function NotifyRecordPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<NotifyRecordPageQuery>();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<NotifyRecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<NotifyRecordDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load notify records");
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
      { title: "Channel", dataIndex: "channelType" },
      { title: "Template Code", dataIndex: "templateCode", render: (value: string | undefined) => value ?? "-" },
      { title: "Subject", dataIndex: "subjectText", render: (value: string | undefined) => value ?? "-" },
      { title: "Receiver", dataIndex: "receiver", render: (value: string | undefined) => value ?? "-" },
      { title: "Send Status", render: (_: unknown, row: NotifyRecordItem) => <Tag color={row.sendStatus === "SUCCESS" ? "success" : row.sendStatus === "FAILED" ? "error" : "processing"}>{row.sendStatus ?? "UNKNOWN"}</Tag> },
      { title: "Send Time", dataIndex: "sendTime", render: (value: string | undefined) => value ?? "-" },
    ],
    [],
  );

  return (
    <NePage>
      <NeSearchPanel title="通知记录筛选" labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }} onReset={() => {
        filterForm.resetFields();
        setQuery(initialQuery);
      }}>
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="channelType" label="Channel"><Select allowClear style={{ width: 160 }} options={[{ label: "Site", value: "SITE" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }]} /></Form.Item>
          <Form.Item name="templateCode" label="Template Code"><Input allowClear /></Form.Item>
          <Form.Item name="receiver" label="Receiver"><Input allowClear /></Form.Item>
          <Form.Item name="sendStatus" label="Send Status"><Select allowClear style={{ width: 160 }} options={[{ label: "Success", value: "SUCCESS" }, { label: "Pending", value: "PENDING" }, { label: "Failed", value: "FAILED" }]} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>

      <NeTablePanel summary={t("common.recordCount", undefined, { count: total })} pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}>
        <Table<NotifyRecordItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTablePanel>

      <NeDetailDrawer title="Notify Record Detail" open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={640}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Channel">{detail.channelType}</Descriptions.Item>
            <Descriptions.Item label="Template Code">{detail.templateCode ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Subject">{detail.subjectText ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Content">{detail.contentText ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Receiver">{detail.receiver ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="CC Receiver">{detail.ccReceiver ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Biz Type">{detail.bizType ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Biz No">{detail.bizNo ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Send Status">{detail.sendStatus ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Fail Reason">{detail.failReason ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Send Time">{detail.sendTime ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Ext JSON">{detail.extJson ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>
    </NePage>
  );
}
