import { DeleteOutlined, EditOutlined, PlusOutlined, SearchOutlined, SendOutlined } from "@ant-design/icons";
import { Button, Descriptions, Form, Input, Pagination, Popconfirm, Select, Space, Table, Tag, Typography, message } from "antd";
import type { NotifyTemplateDetail, NotifyTemplateItem, NotifyTemplateMutationPayload, NotifyTemplatePageQuery, SendNotifyPayload } from "@nebula/core";
import { useI18n } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { createNotifyTemplate, deleteNotifyTemplate, fetchNotifyTemplateDetail, fetchNotifyTemplatePage, sendNotification, updateNotifyTemplate } from "../../../api/notify-template-api";
import { NeDetailDrawer, NeModal, NePage, NeSearch, NeTable } from "@nebula/ui-web";

const initialQuery: NotifyTemplatePageQuery = { pageNum: 1, pageSize: 10, orderName: "updateTime", orderType: "desc" };
const initialForm: NotifyTemplateMutationPayload = { templateCode: "", templateName: "", channelType: "SITE", subjectTemplate: "", contentTemplate: "", status: 1, isBuiltin: 0, remark: "" };
const initialSendForm = { channelType: "SITE", templateCode: "", templateParamsText: "{}", subject: "", content: "", receiver: "", ccReceiver: "", receiverUserId: "", bizType: "", bizNo: "", extJson: "" };

export function NotificationsTemplatePage() {
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

  const channelOptions = useMemo(
    () => [
      { label: t("notify.channel.site"), value: "SITE" },
      { label: t("notify.channel.email"), value: "EMAIL" },
      { label: t("notify.channel.sms"), value: "SMS" },
    ],
    [t],
  );

  function getChannelLabel(value: string | undefined) {
    return channelOptions.find((item) => item.value === value)?.label ?? value ?? "-";
  }

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
      setError(caughtError instanceof Error ? caughtError.message : t("notifyTemplate.loadFailed"));
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
      { title: t("common.templateCode"), dataIndex: "templateCode" },
      { title: t("common.templateName"), dataIndex: "templateName" },
      { title: t("common.channel"), dataIndex: "channelType", render: (value: string | undefined) => getChannelLabel(value) },
      { title: t("common.builtin"), render: (_: unknown, row: NotifyTemplateItem) => row.isBuiltin === 1 ? <Tag color="gold">{t("common.yes")}</Tag> : <Tag>{t("common.no")}</Tag> },
      { title: t("common.status"), render: (_: unknown, row: NotifyTemplateItem) => row.status === 1 ? <Tag color="success">{t("common.enabled")}</Tag> : <Tag color="error">{t("common.disabled")}</Tag> },
      {
        title: t("common.actions"),
        render: (_: unknown, row: NotifyTemplateItem) => (
          <Space>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                setEditing(row);
                fetchNotifyTemplateDetail(row.id)
                  .then((resolved) => {
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
                  })
                  .catch(() => undefined);
              }}
            >
              {t("common.edit")}
            </Button>
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                sendForm.setFieldsValue({ ...initialSendForm, channelType: row.channelType, templateCode: row.templateCode });
                setSendOpen(true);
              }}
            >
              {t("notifyTemplate.send")}
            </Button>
            <Popconfirm
              title={t("common.confirmDelete")}
              onConfirm={async (event) => {
                event?.stopPropagation();
                await deleteNotifyTemplate(row.id);
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
    [drawerForm, query, sendForm, t],
  );

  return (
    <NePage>
      <NeSearch
        title={t("notifyTemplate.filterTitle")}
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        onReset={() => {
          filterForm.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form form={filterForm} layout="inline" initialValues={initialQuery} onFinish={(values) => setQuery((current) => ({ ...current, ...values, pageNum: 1 }))}>
          <Form.Item name="templateCode" label={t("common.templateCode")}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="templateName" label={t("common.templateName")}>
            <Input allowClear />
          </Form.Item>
          <Form.Item name="channelType" label={t("common.channel")}>
            <Select allowClear style={{ width: 160 }} options={channelOptions} />
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
      </NeSearch>

      <NeTable
        toolbar={
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditing(null);
                drawerForm.setFieldsValue(initialForm);
                setDrawerOpen(true);
              }}
            >
              {t("notifyTemplate.create")}
            </Button>
            <Button
              icon={<SendOutlined />}
              onClick={() => {
                sendForm.setFieldsValue(initialSendForm);
                setSendOpen(true);
              }}
            >
              {t("notifyTemplate.sendNotification")}
            </Button>
          </Space>
        }
        summary={t("common.recordCount", undefined, { count: total })}
        pagination={<Pagination align="end" current={query.pageNum} pageSize={query.pageSize} total={total} onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))} />}
      >
        <Table<NotifyTemplateItem> rowKey="id" loading={loading} dataSource={rows} columns={columns} pagination={false} onRow={(record) => ({ onClick: () => openDetail(record.id).catch(() => undefined) })} />
      </NeTable>

      <NeDetailDrawer title={t("notifyTemplate.detailTitle")} open={detailOpen && Boolean(detail)} onClose={() => setDetailOpen(false)} width={640}>
        {detail ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label={t("common.templateCode")}>{detail.templateCode}</Descriptions.Item>
            <Descriptions.Item label={t("common.templateName")}>{detail.templateName}</Descriptions.Item>
            <Descriptions.Item label={t("common.channel")}>{getChannelLabel(detail.channelType)}</Descriptions.Item>
            <Descriptions.Item label={t("common.subjectTemplate")}>{detail.subjectTemplate ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.contentTemplate")}>{detail.contentTemplate ?? "-"}</Descriptions.Item>
            <Descriptions.Item label={t("common.status")}>{detail.status === 1 ? t("common.enabled") : t("common.disabled")}</Descriptions.Item>
            <Descriptions.Item label={t("common.remark")}>{detail.remark ?? "-"}</Descriptions.Item>
          </Descriptions>
        ) : null}
      </NeDetailDrawer>

      <NeModal
        title={editing ? t("notifyTemplate.edit") : t("notifyTemplate.create")}
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
                await updateNotifyTemplate(editing.id, values);
              } else {
                await createNotifyTemplate(values);
              }
              setDrawerOpen(false);
              await loadRows(query);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <Form.Item name="templateCode" label={t("common.templateCode")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.templateCode") }) }]}><Input disabled={Boolean(editing)} /></Form.Item>
          <Form.Item name="templateName" label={t("common.templateName")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.templateName") }) }]}><Input /></Form.Item>
          <Form.Item name="channelType" label={t("common.channel")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.channel") }) }]}><Select options={channelOptions} /></Form.Item>
          <Form.Item name="subjectTemplate" label={t("common.subjectTemplate")}><Input /></Form.Item>
          <Form.Item name="contentTemplate" label={t("common.contentTemplate")} rules={[{ required: true, message: t("validation.enterField", undefined, { field: t("common.contentTemplate") }) }]} className="ne-modal-form-grid__full"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="isBuiltin" label={t("common.builtin")}><Select options={[{ label: t("common.no"), value: 0 }, { label: t("common.yes"), value: 1 }]} /></Form.Item>
          <Form.Item name="status" label={t("common.status")}><Select options={[{ label: t("common.enabled"), value: 1 }, { label: t("common.disabled"), value: 0 }]} /></Form.Item>
          <Form.Item name="remark" label={t("common.remark")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </NeModal>

      <NeModal
        title={t("notifyTemplate.sendDialogTitle")}
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        width={720}
        confirmText={t("common.save")}
        cancelText={t("common.cancel")}
        onConfirm={() => sendForm.submit()}
        confirmLoading={sendSubmitting}
      >
        <Form
          form={sendForm}
          layout="vertical" className="ne-modal-form-grid"
          initialValues={initialSendForm}
          onFinish={async (values) => {
            setSendSubmitting(true);
            try {
              let templateParams: Record<string, string> | undefined;
              try {
                templateParams = values.templateParamsText ? (JSON.parse(values.templateParamsText) as Record<string, string>) : undefined;
              } catch {
                message.error(t("notifyTemplate.templateParamsJsonInvalid"));
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
          }}
        >
          <Form.Item name="channelType" label={t("common.channel")} rules={[{ required: true, message: t("validation.selectField", undefined, { field: t("common.channel") }) }]}><Select options={channelOptions} /></Form.Item>
          <Form.Item name="templateCode" label={t("common.templateCode")}><Input /></Form.Item>
          <Form.Item name="templateParamsText" label={t("common.templateParamsJson")} className="ne-modal-form-grid__full"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="subject" label={t("common.subject")}><Input /></Form.Item>
          <Form.Item name="content" label={t("common.content")} className="ne-modal-form-grid__full"><Input.TextArea rows={4} /></Form.Item>
          <Form.Item name="receiver" label={t("common.receiver")}><Input /></Form.Item>
          <Form.Item name="ccReceiver" label={t("common.ccReceiver")}><Input /></Form.Item>
          <Form.Item name="receiverUserId" label={t("common.receiverUserId")}><Input /></Form.Item>
          <Form.Item name="bizType" label={t("common.bizType")}><Input /></Form.Item>
          <Form.Item name="bizNo" label={t("common.bizNo")}><Input /></Form.Item>
          <Form.Item name="extJson" label={t("common.extJson")} className="ne-modal-form-grid__full"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </NeModal>
    </NePage>
  );
}
