import { SearchOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Select, Table, Tag, Typography } from "antd";
import type { NotifyRecordDetail, NotifyRecordItem, NotifyRecordPageQuery } from "@nebula/core";
import { useI18n } from "@nebula/core";
import { useMemo, useState } from "react";
import { fetchNotifyRecordDetail, fetchNotifyRecordPage } from "../../../api/notify-record-api";
import { NeDetailDrawer, NePage, NeSearch, NeTablePage } from "@nebula/ui-web";

const initialQuery: NotifyRecordPageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };

export function NotificationsRecordPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<NotifyRecordPageQuery>();
  const [reloadSeed, setReloadSeed] = useState(0);
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

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(await fetchNotifyRecordDetail(id));
  }

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
      <NeTablePage<NotifyRecordPageQuery>
        searchForm={filterForm}
        request={fetchNotifyRecordPage}
        initialQuery={initialQuery}
        reloadToken={reloadSeed}
        onRequestSuccess={() => setError(null)}
        onRequestFail={(caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : t("notifyRecord.loadFailed"));
        }}
        summary={(result) => t("common.recordCount", undefined, { count: result.total })}
      >
        <NeSearch
          title={t("notifyRecord.filterTitle")}
          labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
          onReset={() => {
            filterForm.resetFields();
            setReloadSeed((current) => current + 1);
          }}
        >
          <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={() => setReloadSeed((current) => current + 1)}>
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
          {error ? <Typography.Paragraph type="danger" className="ne-request-error">{error}</Typography.Paragraph> : null}
        </NeSearch>

        <Table<NotifyRecordItem>
          rowKey="id"
          columns={columns}
          onRow={(record) => ({
            onClick: () => openDetail(record.id).catch(() => undefined),
          })}
        />
      </NeTablePage>

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
