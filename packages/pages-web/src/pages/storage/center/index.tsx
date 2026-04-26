import { CopyOutlined, DeleteOutlined, DownloadOutlined, EyeOutlined, LinkOutlined, ReloadOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Form, Input, Pagination, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import type { StorageFileItem, StorageListQuery } from "@nebula/core";
import { useEffect, useMemo, useState } from "react";
import { NePage, NeSearch, NeTable } from "@nebula/ui-web";
import {
  buildStorageDownloadUrl,
  buildStoragePreviewUrl,
  deleteStorageFile,
  fetchStoragePage,
  generateStorageSignedUrl,
  uploadStorageFile,
} from "../../../api/storage-api";

interface StorageFilterFormValues {
  fileName?: string;
  sourceEntity?: string;
  sourceId?: string;
  sourceType?: string;
  uploadUserId?: string;
}

const initialQuery: StorageListQuery = {
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

export function StorageCenterPage() {
  const [form] = Form.useForm<StorageFilterFormValues>();
  const [query, setQuery] = useState<StorageListQuery>(initialQuery);
  const [rows, setRows] = useState<StorageFileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadRows(nextQuery: StorageListQuery) {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchStoragePage(nextQuery);
      setRows(result.data);
      setTotal(result.total);
    } catch (caughtError) {
      setRows([]);
      setTotal(0);
      setError(caughtError instanceof Error ? caughtError.message : "加载存储文件失败");
    } finally {
      setLoading(false);
    }
  }

  async function refreshCurrentPage() {
    await loadRows(query);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      await uploadStorageFile({
        file,
        sourceEntity: "storage-center",
        sourceId: "global",
        sourceType: "manual-upload",
      });
      message.success(`${file.name} 上传成功`);
      await loadRows({ ...query, pageNum: 1 });
      setQuery((current) => ({ ...current, pageNum: 1 }));
    } finally {
      setUploading(false);
    }
    return false;
  }

  async function handleDelete(fileId: string) {
    await deleteStorageFile(fileId);
    const nextTotal = Math.max(total - 1, 0);
    const maxPageNum = Math.max(1, Math.ceil(nextTotal / query.pageSize));
    const nextQuery = { ...query, pageNum: Math.min(query.pageNum, maxPageNum) };
    setQuery(nextQuery);
    await loadRows(nextQuery);
  }

  useEffect(() => {
    loadRows(query).catch(() => undefined);
  }, [query]);

  const columns = useMemo<ColumnsType<StorageFileItem>>(
    () => [
      {
        title: "文件名",
        dataIndex: "fileName",
        width: 260,
        render: (value: string, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong ellipsis={{ tooltip: value }}>
              {value}
            </Typography.Text>
            <Typography.Text type="secondary">{row.extension?.toUpperCase() ?? row.contentType ?? "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "业务来源",
        width: 260,
        render: (_: unknown, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{row.sourceEntity ?? "-"}</Typography.Text>
            <Typography.Text type="secondary">sourceId: {row.sourceId ?? "-"}</Typography.Text>
            <Typography.Text type="secondary">sourceType: {row.sourceType ?? "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "上传人",
        width: 180,
        render: (_: unknown, row) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{row.uploadUserName ?? row.uploadedBy ?? "-"}</Typography.Text>
            <Typography.Text type="secondary">{row.uploadUserId ?? "-"}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "大小",
        dataIndex: "size",
        width: 120,
        render: (value: number | undefined) => formatFileSize(value),
      },
      {
        title: "存储方式",
        width: 120,
        render: (_: unknown, row) => <Tag>{row.storageProvider ?? row.bucket ?? "-"}</Tag>,
      },
      {
        title: "上传时间",
        dataIndex: "createdAt",
        width: 180,
        render: (value: string | undefined) => value ?? "-",
      },
      {
        title: "操作",
        key: "actions",
        fixed: "right",
        width: 280,
        render: (_: unknown, row) => (
          <Space wrap>
            <Button size="small" icon={<EyeOutlined />} onClick={() => openUrl(buildStoragePreviewUrl(row))}>
              预览
            </Button>
            <Button size="small" icon={<DownloadOutlined />} onClick={() => openUrl(buildStorageDownloadUrl(row, row.fileName))}>
              下载
            </Button>
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={async () => {
                try {
                  const result = await generateStorageSignedUrl({
                    fileId: row.id,
                    fileName: row.fileName,
                  });
                  if (!result.url.trim()) {
                    throw new Error("未获取到有效的签名下载链接");
                  }
                  await copyToClipboard(result.url, "签名下载链接已复制");
                } catch (caughtError) {
                  message.error(caughtError instanceof Error ? caughtError.message : "分享链接生成失败");
                }
              }}
            >
              分享
            </Button>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={async () => {
                try {
                  await copyToClipboard(row.id, "文件 ID 已复制");
                } catch (caughtError) {
                  message.error(caughtError instanceof Error ? caughtError.message : "复制文件 ID 失败");
                }
              }}
            >
              复制ID
            </Button>
            <Popconfirm title="确认删除当前文件吗？" onConfirm={() => handleDelete(row.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <NePage className="storage-center-page">
      <NeSearch
        title="正式文件筛选"
        labels={{ expand: "展开", collapse: "收起", reset: "重置" }}
        onReset={() => {
          form.resetFields();
          setQuery(initialQuery);
        }}
      >
        <Form
          form={form}
          layout="inline"
          initialValues={initialQuery}
          onFinish={(values) => {
            setQuery((current) => ({
              ...current,
              ...values,
              pageNum: 1,
            }));
          }}
        >
          <Form.Item name="fileName" label="文件名">
            <Input allowClear placeholder="按文件名搜索" />
          </Form.Item>
          <Form.Item name="sourceEntity" label="业务实体">
            <Input allowClear placeholder="例如 contract / notice" />
          </Form.Item>
          <Form.Item name="sourceId" label="业务ID">
            <Input allowClear placeholder="按业务主键搜索" />
          </Form.Item>
          <Form.Item name="sourceType" label="业务类型">
            <Input allowClear placeholder="按来源类型搜索" />
          </Form.Item>
          <Form.Item name="uploadUserId" label="上传人ID">
            <Input allowClear placeholder="按上传人 ID 搜索" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              搜索
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
        className="storage-center-page__table-panel"
        toolbar={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => refreshCurrentPage()} loading={loading}>
              刷新正式文件
            </Button>
            <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
              <label style={{ cursor: "pointer" }}>
                上传文件
                <input
                  hidden
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    handleUpload(file).catch((caughtError) => {
                      message.error(caughtError instanceof Error ? caughtError.message : "上传失败");
                    }).finally(() => {
                      event.target.value = "";
                    });
                  }}
                />
              </label>
            </Button>
          </Space>
        }
        summary={`共 ${total} 条正式文件记录`}
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
        <Table<StorageFileItem>
          rowKey="id"
          loading={loading}
          dataSource={rows}
          columns={columns}
          pagination={false}
        />
      </NeTable>
    </NePage>
  );
}
