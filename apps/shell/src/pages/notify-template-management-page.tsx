import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import type { NotifyTemplateDetail, NotifyTemplateItem, NotifyTemplateMutationPayload, NotifyTemplatePageQuery, SendNotifyPayload } from "@platform/core";
import { useI18n } from "@platform/core";
import { useEffect, useMemo, useState } from "react";
import { createNotifyTemplate, deleteNotifyTemplate, fetchNotifyTemplateDetail, fetchNotifyTemplatePage, sendNotification, updateNotifyTemplate } from "../api/notify-template-api";
import { NeDetailDrawer, NeFormDrawer, NePage, NeSearchPanel, NeTablePanel } from "@platform/ui";

const initialQuery: NotifyTemplatePageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };
const initialForm: NotifyTemplateMutationPayload = { templateCode: "", templateName: "", channelType: "SITE", subjectTemplate: "", contentTemplate: "", status: 1, isBuiltin: 0, remark: "" };
const initialSendForm = { channelType: "SITE", templateCode: "", templateParamsText: "{}", subject: "", content: "", receiver: "", ccReceiver: "", receiverUserId: "", bizType: "", bizNo: "", extJson: "" };

export function NotifyTemplateManagementPage() {
  const { t } = useI18n();
  const [filterForm] = Form.useForm<NotifyTemplatePageQuery>();
  const [drawerForm] = Form.useForm<NotifyTemplateMutationPayload>();
  const [sendForm] = Form.useForm<typeof initialSendForm>();
  const [query, setQuery] = useState(initialQuery);
  const [rows, setRows] = useState<NotifyTemplateItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendSubmitting, setSendSubmitting] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [editing, setEditing] = useState<NotifyTemplateItem | null>(null);
  const [detail, setDetail] = useState<NotifyTemplateDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRows(nextQuery: NotifyTemplatePageQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchNotifyTemplatePage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : "Failed to load notify templates");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(await fetchNotifyTemplateDetail(id));
  }

  useEffect(() => {
    loadRows(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo(
    () => [
      { title: "Template Code", dataIndex: "templateCode" },
      { title: "Template Name", dataIndex: "templateName" },
      { title: "Channel", dataIndex: "channelType" },
      { title: "Builtin", render: (_: unknown, row: NotifyTemplateItem) => row.isBuiltin === 1 ? <Tag color="gold">Yes</Tag> : <Tag>No</Tag> },
      { title: t("common.status"), render: (_: unknown, row: NotifyTemplateItem) => row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag> },
      {
        title: t("common.actions"),
        render: (_: unknown, row: NotifyTemplateItem) => (
          <Space>
            <Button size="small" icon={<EditOutlined />} onClick={(event) => {
              event.stopPropagation();
              setEditing(row);
              fetchNotifyTemplateDetail(row.id).then((resolved) => {
                drawerForm.setFieldsValue({
                  templateCode: resolved?.templateCode ?? row.templateCode,
                  templateName: resolved?.templateName ?? row.templateName,
                  channelType: resolved?.channelType ?? row.channelType,
                  subjectTemplate: resolved?.subjectTemplate ?? "",
                  contentTemplate: resolved?.contentTemplate ?? "",
                  status: resolved?.status ?? 1,
                  isBuiltin: resolved?.isBuiltin ?? 0,
                  remark: resolved?.remark ?? "",
                });
                setDrawerOpen(true);
              }).catch(() => undefined);
            }}>{t("common.edit")}</Button>
            <Button size="small" icon={<SendOutlined />} onClick={(event) => {
              event.stopPropagation();
              sendForm.setFieldsValue({ ...initialSendForm, channelType: row.channelType, templateCode: row.templateCode });
              setSendOpen(true);
            }}>Send</Button>
            <Popconfirm title={t("common.confirmDelete")} onConfirm={async (event) => {
              event?.stopPropagation();
              await deleteNotifyTemplate(row.id);
              await loadRows(query);
            }}>
              <Button size="small" danger icon={<DeleteOutlined />}>{t("common.delete")}</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [drawerForm, query, sendForm, t],
  );

  return (
    <NePage>
      <NeSearchPanel title="通知模板筛选" labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }} onReset={() => {
        filterForm.resetFields();
        setQuery(initialQuery);
      }}>
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="templateCode" label="Template Code"><Input allowClear /></Form.Item>
          <Form.Item name="templateName" label="Template Name"><Input allowClear /></Form.Item>
          <Form.Item name="channelType" label="Channel"><Select allowClear style={{ width: 160 }} options={[{ label: "Site", value: "SITE" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }]} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select allowClear style={{ width: 140 }} options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t("common.search")}</Button></Form.Item>
        </Form>
        {error ? <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>{error}</Typography.Paragraph> : null}
      </NeSearchPanel>

      <NeTablePanel toolbar={<Space><Button type="primary" icon={<PlusOutlined />} onClick={() => {
        setEditing(null);
        drawerForm.setFieldsValue(initialForm);
        setDrawerOpen(true);
      }}>{t("common.create")}模板</Button><Button icon={<SendOutlined />} onClick={() => {
        sendForm.setFieldsValue(initialSendForm);
        setSendOpen(true);
      }}>Send Notification</Button></Space>} summary={t("common.recordCount", undefined, { count: total })} pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}>
        <Table<NotifyTemplateItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTablePanel>

      <NeDetailDrawer title="Notify Template Detail" open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={640}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Template Code">{detail.templateCode}</Descriptions.Item>
            <Descriptions.Item label="Template Name">{detail.templateName}</Descriptions.Item>
            <Descriptions.Item label="Channel">{detail.channelType}</Descriptions.Item>
            <Descriptions.Item label="Subject Template">{detail.subjectTemplate ?? "-"}</Descriptions.Item>
            <Descriptions.Item label="Content Template">{detail.contentTemplate ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
            <Descriptions.Item label={t("common.remark")}>{detail.remark ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>

      <NeFormDrawer title={editing ? `${t("common.edit")}模板` : `${t("common.create")}模板`} open={drawerOpen} onClose={() => setDrawerOpen(false)} onSubmit={() => drawerForm.submit()} submitting={submitting}>
        <Form form={drawerForm} layout="vertical" initialValues={initialForm} onFinish={async (values) => {
          setSubmitting(true);
          try {
            if (editing) {
              await updateNotifyTemplate(editing.id, values);
            } else {
              await createNotifyTemplate(values);
            }
            setDrawerOpen(false);
            await loadRows(query);
          } finally {
            setSubmitting(false);
          }
        }}>
          <Form.Item name="templateCode" label="Template Code" rules={[{ required: true, message: "请输入模板编码" }]}><Input disabled={Boolean(editing)} /></Form.Item>
          <Form.Item name="templateName" label="Template Name" rules={[{ required: true, message: "请输入模板名称" }]}><Input /></Form.Item>
          <Form.Item name="channelType" label="Channel" rules={[{ required: true, message: "请选择通知渠道" }]}><Select options={[{ label: "Site", value: "SITE" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }]} /></Form.Item>
          <Form.Item name="subjectTemplate" label="Subject Template"><Input /></Form.Item>
          <Form.Item name="contentTemplate" label="Content Template" rules={[{ required: true, message: "请输入模板内容" }]}><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="isBuiltin" label="Builtin"><Select options={[{ label: "No", value: 0 }, { label: "Yes", value: 1 }]} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item name="remark" label={t("common.remark")}><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </NeFormDrawer>

      <NeFormDrawer title="Send Notification" open={sendOpen} onClose={() => setSendOpen(false)} onSubmit={() => sendForm.submit()} submitting={sendSubmitting}>
        <Form form={sendForm} layout="vertical" initialValues={initialSendForm} onFinish={async (values) => {
          setSendSubmitting(true);
          try {
            let templateParams: Record<string, string> | undefined;
            try {
              templateParams = values.templateParamsText ? (JSON.parse(values.templateParamsText) as Record<string, string>) : undefined;
            } catch {
              message.error("Template Params must be valid JSON");
              return;
            }
            const payload: SendNotifyPayload = {
              channelType: values.channelType,
              templateCode: values.templateCode || undefined,
              templateParams,
              subject: values.subject || undefined,
              content: values.content || undefined,
              receiver: values.receiver || undefined,
              ccReceiver: values.ccReceiver || undefined,
              receiverUserId: values.receiverUserId || undefined,
              bizType: values.bizType || undefined,
              bizNo: values.bizNo || undefined,
              extJson: values.extJson || undefined,
            };
            await sendNotification(payload);
            setSendOpen(false);
          } finally {
            setSendSubmitting(false);
          }
        }}>
          <Form.Item name="channelType" label="Channel" rules={[{ required: true, message: "请选择通知渠道" }]}><Select options={[{ label: "Site", value: "SITE" }, { label: "Email", value: "EMAIL" }, { label: "SMS", value: "SMS" }]} /></Form.Item>
          <Form.Item name="templateCode" label="Template Code"><Input /></Form.Item>
          <Form.Item name="templateParamsText" label="Template Params JSON"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="subject" label="Subject"><Input /></Form.Item>
          <Form.Item name="content" label="Content"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="receiver" label="Receiver"><Input /></Form.Item>
          <Form.Item name="ccReceiver" label="CC Receiver"><Input /></Form.Item>
          <Form.Item name="receiverUserId" label="Receiver User ID"><Input /></Form.Item>
          <Form.Item name="bizType" label="Biz Type"><Input /></Form.Item>
          <Form.Item name="bizNo" label="Biz No"><Input /></Form.Item>
          <Form.Item name="extJson" label="Ext JSON"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </NeFormDrawer>
    </NePage>
  );
}
