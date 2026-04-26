import { CopyOutlined, DownloadOutlined, EyeOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Card, Descriptions, Form, Input, Pagination, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { StorageFileItem, StorageUploadTaskItem, StorageUploadTaskPageQuery } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { NePage, NeSearch, NeTable } from "@nebula/ui-web";
import {
  buildStorageDownloadUrl,
  buildStoragePreviewUrl,
  fetchStorageFileDetail,
  fetchStorageUploadTaskDetail,
  fetchStorageUploadTaskPage,
} from "../../../api/storage-api";

interface TempTaskFilterFormValues {
  taskMode?: string;
  fileName?: string;
  status?: string;
  uploadUserId?: string;
  taskId?: string;
}

const initialTempTaskQuery: StorageUploadTaskPageQuery = {
  pageNum: 1,
  pageSize: 10,
  orderName: "createTime",
  orderType: "desc",
};

function formatFileSize(size?: number) {
  if (size == null || Number.isNaN(size)) {
    return "-";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

async function copyToClipboard(value: string, successMessage: string) {
  if (!value.trim()) {
    throw new Error("复制内容为空");
  }

  if (!navigator.clipboard?.writeText) {
    throw new Error("当前环境不支持剪贴板复制");
  }

  try {
    await navigator.clipboard.writeText(value);
    message.success(successMessage);
  } catch (error) {
    throw error instanceof Error ? error : new Error("复制失败，请手动复制");
  }
}

function formatTaskMode(task: Pick<StorageUploadTaskItem, "taskMode" | "uploadMode">) {
  return task.taskMode ?? task.uploadMode ?? "-";
}

function formatTaskStatus(status: StorageUploadTaskItem["status"]) {
  return status == null ? "-" : String(status);
}

export function StorageUploadTaskPage() {
  const [form] = Form.useForm<TempTaskFilterFormValues>();
  const [query, setQuery] = useState<StorageUploadTaskPageQuery>(initialTempTaskQuery);
  const [rows, setRows] = useState<StorageUploadTaskItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<StorageUploadTaskItem | null>(null);
  const [selectedFormalFile, setSelectedFormalFile] = useState<StorageFileItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadRows(nextQuery: StorageUploadTaskPageQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStorageUploadTaskPage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : "加载临时上传任务失败");
    } finally {
      setLoading(false);
    }
  }

  async function openDetail(taskId: string) {
    setDetailLoading(true);
    try {
      const detail = await fetchStorageUploadTaskDetail(taskId);
      setSelectedTask(detail);
      if (detail.resultFileId) {
        const fileDetail = await fetchStorageFileDetail(detail.resultFileId).catch(() => null);
        setSelectedFormalFile(fileDetail);
      } else {
        setSelectedFormalFile(null);
      }
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    loadRows(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo<ColumnsType<StorageUploadTaskItem>>(
    () => [
      {
        title: "文件名",
        dataIndex: "fileName",
        width: 240,
        render: (value: string | undefined, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong ellipsis={{ tooltip: value ?? row.id }}>{value ?? row.id}</Typography.Text>
            <Typography.Text type="secondary">{row.extension?.toUpperCase() ?? row.contentType ?? "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "任务模式",
        width: 120,
        render: (_: unknown, row) => <Tag>{formatTaskMode(row)}</Tag>,
      },
      {
        title: "状态",
        width: 120,
        render: (_: unknown, row) => <Tag color={row.resultFileId ? "success" : "processing"}>{formatTaskStatus(row.status)}</Tag>,
      },
      {
        title: "进度",
        width: 160,
        render: (_: unknown, row) => `${row.uploadedPartCount ?? 0} / ${row.partCount ?? 0}`,
      },
      {
        title: "已上传大小",
        dataIndex: "uploadedSize",
        width: 140,
        render: (value: number | undefined) => formatFileSize(value),
      },
      {
        title: "上传人",
        width: 180,
        render: (_: unknown, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{row.uploadUserName ?? row.uploadUserId ?? "-"}</Typography.Text>
            <Typography.Text type="secondary">{row.uploadUserId ?? "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "最后更新时间",
        width: 180,
        render: (_: unknown, row) => row.updatedAt ?? row.lastPartTime ?? row.createdAt ?? "-",
      },
      {
        title: "操作",
        key: "actions",
        width: 220,
        render: (_: unknown, row) => (
          <Space wrap>
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(row.id).catch(() => undefined)}>
              查看详情
            </Button>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={async () => {
                try {
                  await copyToClipboard(row.id, "临时任务 ID 已复制");
                } catch (caughtError) {
                  message.error(caughtError instanceof Error ? caughtError.message : "复制临时任务 ID 失败");
                }
              }}
            >
              复制ID
            </Button>
            <Button
              size="small"
              icon={<DownloadOutlined />}
              disabled={!row.resultFileId || selectedTask?.id !== row.id || !selectedFormalFile}
              onClick={() => {
                if (selectedFormalFile) {
                  openUrl(buildStorageDownloadUrl(selectedFormalFile, selectedFormalFile.fileName));
                }
              }}
            >
              下载正式文件
            </Button>
          </Space>
        ),
      },
    ],
    [selectedFormalFile, selectedTask],
  );

  return (
    <NePage className="storage-upload-task-page">
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <NeSearch
          title="临时上传任务筛选"
          labels={{ expand: "展开", collapse: "收起", reset: "重置" }}
          onReset={() => {
            form.resetFields();
            setQuery(initialTempTaskQuery);
            setSelectedTask(null);
            setSelectedFormalFile(null);
            setError(null);
          }}
        >
          <Form
            form={form}
            layout="inline"
            initialValues={initialTempTaskQuery}
            onFinish={(values) => {
              const taskId = values.taskId?.trim();
              setQuery((current) => ({
                ...current,
                taskMode: values.taskMode,
                fileName: values.fileName,
                status: values.status,
                uploadUserId: values.uploadUserId,
                pageNum: 1,
              }));
              if (taskId) {
                openDetail(taskId).catch(() => undefined);
              }
            }}
          >
            <Form.Item name="taskMode" label="任务模式">
              <Select
                allowClear
                style={{ width: 160 }}
                options={[
                  { label: "simple", value: "simple" },
                  { label: "chunk", value: "chunk" },
                ]}
              />
            </Form.Item>
            <Form.Item name="fileName" label="文件名">
              <Input allowClear placeholder="按文件名搜索临时任务" />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Input allowClear placeholder="按任务状态搜索" />
            </Form.Item>
            <Form.Item name="uploadUserId" label="上传人ID">
              <Input allowClear placeholder="按上传人 ID 搜索" />
            </Form.Item>
            <Form.Item name="taskId" label="Task ID">
              <Input allowClear placeholder="输入 taskId 查看任务详情" style={{ width: 260 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
            </Form.Item>
          </Form>
          {error ? (
            <Typography.Paragraph type="danger" style={{ marginTop: 16, marginBottom: 0 }}>
              {error}
            </Typography.Paragraph>
          ) : null}
        </NeSearch>

        <NeTable
          className="storage-upload-task-page__table-panel"
          toolbar={
            <Space wrap>
              <Button icon={<ReloadOutlined />} onClick={() => loadRows(query)} loading={loading}>
                刷新临时任务
              </Button>
            </Space>
          }
          summary={`共 ${total} 条临时上传任务`}
          pagination={
            <Pagination
              align="end"
              current={query.pageNum}
              pageSize={query.pageSize}
              total={total}
              onChange={(pageNum, pageSize) => setQuery((current) => ({ ...current, pageNum, pageSize }))}
            />
          }
        >
          <Table<StorageUploadTaskItem>
            rowKey="id"
            loading={loading}
            dataSource={rows}
            columns={columns}
            pagination={false}
            scroll={{ x: 1360 }}
            onRow={(record) => ({
              onClick: () => {
                void openDetail(record.id);
              },
            })}
          />
        </NeTable>

        <Card title="临时任务详情" loading={detailLoading}>
          {selectedTask ? (
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Task ID">{selectedTask.id}</Descriptions.Item>
              <Descriptions.Item label="任务模式">{formatTaskMode(selectedTask)}</Descriptions.Item>
              <Descriptions.Item label="文件名">{selectedTask.fileName ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="状态">{formatTaskStatus(selectedTask.status)}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{formatFileSize(selectedTask.size)}</Descriptions.Item>
              <Descriptions.Item label="文件类型">{selectedTask.extension?.toUpperCase() ?? selectedTask.contentType ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="上传分片">{selectedTask.uploadedPartCount ?? 0} / {selectedTask.partCount ?? 0}</Descriptions.Item>
              <Descriptions.Item label="已上传大小">{formatFileSize(selectedTask.uploadedSize)}</Descriptions.Item>
              <Descriptions.Item label="上传人">{selectedTask.uploadUserName ?? selectedTask.uploadUserId ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="最后分片时间">{selectedTask.lastPartTime ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{selectedTask.createdAt ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{selectedTask.updatedAt ?? "-"}</Descriptions.Item>
              <Descriptions.Item label="正式文件ID" span={2}>
                {selectedTask.resultFileId ? (
                  <Space wrap>
                    <Typography.Text>{selectedTask.resultFileId}</Typography.Text>
                    <Button
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={async () => {
                        try {
                          await copyToClipboard(selectedTask.resultFileId!, "正式文件 ID 已复制");
                        } catch (caughtError) {
                          message.error(caughtError instanceof Error ? caughtError.message : "复制正式文件 ID 失败");
                        }
                      }}
                    >
                      复制ID
                    </Button>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        if (selectedFormalFile) {
                          openUrl(buildStoragePreviewUrl(selectedFormalFile));
                        }
                      }}
                      disabled={!selectedFormalFile}
                    >
                      查看正式文件
                    </Button>
                    <Button
                      size="small"
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        if (selectedFormalFile) {
                          openUrl(buildStorageDownloadUrl(selectedFormalFile, selectedFormalFile.fileName));
                        }
                      }}
                      disabled={!selectedFormalFile}
                    >
                      下载正式文件
                    </Button>
                  </Space>
                ) : (
                  <Tag color="processing">尚未转正</Tag>
                )}
              </Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
              可在上方列表中点击任一临时上传任务，或直接输入 Task ID 查看详情。
            </Typography.Paragraph>
          )}
        </Card>
      </Space>
    </NePage>
  );
}
