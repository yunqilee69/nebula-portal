import { Button, Input, Modal, Pagination, Space, Typography } from "antd";
import type { StorageFileItem } from "@platform/core";
import { useI18n } from "@platform/core";
import { NeEmptyState, NeExceptionResult, NeFileCard, NeFileUploader, NePage, NePanel, NeSearchPanel } from "@platform/ui";
import { useEffect, useMemo, useState } from "react";
import { buildStorageDownloadUrl, buildStoragePreviewUrl, deleteStorageFile, fetchStoragePage, uploadStorageFile } from "../../../api/storage-api";
import { useConfigStore } from "../../../modules/config/config-store";

export function StorageCenterPage() {
  const { t } = useI18n();
  const configValues = useConfigStore((state) => state.values);
  const [searchValue, setSearchValue] = useState("");
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [files, setFiles] = useState<StorageFileItem[]>([]);
  const [recentUploads, setRecentUploads] = useState<StorageFileItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [previewing, setPreviewing] = useState<StorageFileItem | null>(null);

  const uploadLimit = typeof configValues.upload_max_size === "number" ? configValues.upload_max_size : 20 * 1024 * 1024;

  async function loadFiles() {
    setLoading(true);
    setError(undefined);
    try {
      const result = await fetchStoragePage({ pageNum, pageSize: 8, fileName: keyword });
      setFiles(result.data);
      setTotal(result.total);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t("storage.loadFailed"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFiles().catch(() => undefined);
  }, [keyword, pageNum]);

  const helperText = useMemo(() => t("storage.helper", undefined, { size: (uploadLimit / (1024 * 1024)).toFixed(0) }), [t, uploadLimit]);

  return (
    <NePage>
      <NeSearchPanel
        labels={{ expand: t("common.expand"), collapse: t("common.collapse"), reset: t("common.reset") }}
        title={t("common.filters")}
        onReset={() => {
          setSearchValue("");
          setKeyword("");
          setPageNum(1);
        }}
      >
        <Input.Search
          allowClear
          placeholder={t("storage.searchPlaceholder")}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onSearch={(value) => {
            setSearchValue(value);
            setKeyword(value);
            setPageNum(1);
          }}
          style={{ width: 320, maxWidth: "100%" }}
        />
      </NeSearchPanel>
      <div className="shell-split-grid">
        <NePanel title={t("storage.uploadPanel")}>
          <NeFileUploader
            value={recentUploads}
            maxSize={uploadLimit}
            helperText={helperText}
            onChange={setRecentUploads}
            onUpload={async (file) => {
              const uploaded = await uploadStorageFile({
                file,
                sourceEntity: "platform",
                sourceId: "shell-storage-center",
                sourceType: "default",
              });
              await loadFiles();
              return uploaded;
            }}
            onPreview={(file) => setPreviewing(file as StorageFileItem)}
            onDownload={(file) => window.open(buildStorageDownloadUrl(file as StorageFileItem), "_blank", "noopener,noreferrer")}
          />
        </NePanel>
        <NePanel title={t("storage.repositoryPanel")}>
          {error ? (
            <NeExceptionResult status="warning" title={t("storage.loadFailed")} subtitle={error} actionText={t("storage.reload")} onAction={() => loadFiles().catch(() => undefined)} />
          ) : files.length === 0 && !loading ? (
            <NeEmptyState title={t("storage.empty")} />
          ) : (
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Typography.Text type="secondary">{t("storage.count", undefined, { count: total })}</Typography.Text>
              <div className="ne-file-card-grid">
                {files.map((file) => (
                  <NeFileCard
                    key={file.id}
                    file={file}
                    onPreview={(current) => setPreviewing(current as StorageFileItem)}
                    onDownload={(current) => window.open(buildStorageDownloadUrl(current as StorageFileItem), "_blank", "noopener,noreferrer")}
                    onRemove={async (current) => {
                      await deleteStorageFile(current.id);
                      setRecentUploads((items) => items.filter((item) => item.id !== current.id));
                      await loadFiles();
                    }}
                  />
                ))}
              </div>
              <Pagination align="end" current={pageNum} pageSize={8} total={total} onChange={setPageNum} />
            </Space>
          )}
        </NePanel>
      </div>
      <Modal footer={null} open={Boolean(previewing)} onCancel={() => setPreviewing(null)} title={previewing?.fileName} width={880}>
        {previewing?.previewUrl || previewing?.contentType?.startsWith("image/") ? (
          <img alt={previewing?.fileName} src={previewing ? buildStoragePreviewUrl(previewing) : undefined} style={{ width: "100%", borderRadius: 12 }} />
        ) : (
          <NeExceptionResult status="info" title={t("storage.previewUnsupported")} subtitle={t("storage.previewUnsupportedSubtitle")} actionText={t("storage.download")} onAction={() => previewing && window.open(buildStorageDownloadUrl(previewing), "_blank", "noopener,noreferrer")} />
        )}
      </Modal>
    </NePage>
  );
}
