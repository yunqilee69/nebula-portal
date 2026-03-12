import type { StorageFileItem, StorageListQuery, StorageListResult, StorageUploadPayload } from "@platform/core";
import { shellEnv } from "../config/env";
import { getArray, getRecord, requestDelete, requestGet, requestPost, requestUpload } from "./client";

interface StorageUploadTaskDetail {
  id: string;
  resultFileId?: string;
}

function fillTemplate(template: string, id: string) {
  return template.replace("{id}", encodeURIComponent(id));
}

function formatDate(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function toStorageFileItem(payload: unknown, fallbackIndex: number): StorageFileItem {
  const record = getRecord(payload) ?? {};
  const id = String(record.id ?? record.fileId ?? `storage-${fallbackIndex}`);

  return {
    id,
    fileName: String(record.fileName ?? record.name ?? record.originalFilename ?? `file-${fallbackIndex}`),
    fileHash: typeof record.fileHash === "string" ? record.fileHash : undefined,
    fileUrl:
      typeof record.downloadUrl === "string"
        ? record.downloadUrl
        : typeof record.fileUrl === "string"
          ? record.fileUrl
          : typeof record.url === "string"
            ? record.url
            : undefined,
    previewUrl: typeof record.previewUrl === "string" ? record.previewUrl : undefined,
    thumbnailUrl: typeof record.thumbnailUrl === "string" ? record.thumbnailUrl : undefined,
    contentType:
      typeof record.fileMimeType === "string"
        ? record.fileMimeType
        : typeof record.contentType === "string"
          ? record.contentType
          : typeof record.mimeType === "string"
            ? record.mimeType
            : undefined,
    extension:
      typeof record.fileExtension === "string"
        ? record.fileExtension
        : typeof record.extension === "string"
          ? record.extension
          : undefined,
    size: typeof record.fileSize === "number" ? record.fileSize : typeof record.size === "number" ? record.size : undefined,
    bucket: typeof record.bucketName === "string" ? record.bucketName : typeof record.bucket === "string" ? record.bucket : undefined,
    storageProvider: typeof record.storageType === "string" ? record.storageType : typeof record.storageProvider === "string" ? record.storageProvider : undefined,
    storageKey: typeof record.storageKey === "string" ? record.storageKey : undefined,
    sourceEntity: typeof record.sourceEntity === "string" ? record.sourceEntity : undefined,
    sourceId: typeof record.sourceId === "string" ? record.sourceId : undefined,
    sourceType: typeof record.sourceType === "string" ? record.sourceType : undefined,
    status: typeof record.status === "string" || typeof record.status === "number" ? record.status : undefined,
    uploadTaskId: typeof record.uploadTaskId === "string" ? record.uploadTaskId : undefined,
    uploadUserId: typeof record.uploadUserId === "string" ? record.uploadUserId : undefined,
    uploadedBy: typeof record.uploadUserId === "string" ? record.uploadUserId : typeof record.uploadedBy === "string" ? record.uploadedBy : undefined,
    createdAt: formatDate(record.createTime ?? record.createdAt),
    updatedAt: formatDate(record.updateTime ?? record.updatedAt),
  };
}

function toUploadTaskDetail(payload: unknown): StorageUploadTaskDetail {
  const record = getRecord(payload) ?? {};
  return {
    id: String(record.id ?? ""),
    resultFileId: typeof record.resultFileId === "string" ? record.resultFileId : undefined,
  };
}

async function createUploadTask(file: File) {
  return requestPost<string>(
    shellEnv.storageUploadTaskPath,
    {
      uploadMode: "simple",
      fileName: file.name,
      fileExtension: file.name.includes(".") ? file.name.split(".").pop() : undefined,
      fileMimeType: file.type || "application/octet-stream",
      fileSize: file.size,
    },
    { silent: true },
  );
}

async function uploadSimpleFile(taskId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return requestUpload<unknown>(fillTemplate(shellEnv.storageUploadSimplePathTemplate, taskId), formData, { silent: true });
}

async function completeUploadTask(taskId: string) {
  const payload = await requestPost<unknown>(fillTemplate(shellEnv.storageUploadCompletePathTemplate, taskId), undefined, { silent: true });
  return toUploadTaskDetail(payload);
}

async function bindUploadTask(taskId: string, payload: Pick<StorageUploadPayload, "sourceEntity" | "sourceId" | "sourceType">) {
  return requestPost<string>(fillTemplate(shellEnv.storageUploadBindPathTemplate, taskId), {
    sourceEntity: payload.sourceEntity,
    sourceId: payload.sourceId,
    sourceType: payload.sourceType ?? "default",
  }, { silent: true });
}

export async function fetchStoragePage(query: StorageListQuery): Promise<StorageListResult> {
  const payload = await requestGet<unknown>(shellEnv.storageFilePagePath, query, { silent: true, unwrap: false });
  const record = getRecord(payload);
  const envelopeData = getRecord(record?.data) ?? getRecord(record?.result) ?? record;
  const pageData = getRecord(envelopeData?.data) ?? envelopeData;
  const rows = getArray<unknown>(pageData?.data ?? pageData?.rows ?? pageData?.list ?? envelopeData?.rows ?? envelopeData?.list);
  const totalCandidate = pageData?.total ?? envelopeData?.total ?? record?.total;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;

  return {
    data: rows.map((item, index) => toStorageFileItem(item, index)),
    total,
  };
}

export async function fetchStorageFileDetail(fileId: string): Promise<StorageFileItem> {
  const payload = await requestGet<unknown>(fillTemplate(shellEnv.storageFileDetailPathTemplate, fileId), undefined, { silent: true });
  return toStorageFileItem(payload, 0);
}

export async function uploadStorageFile(payload: StorageUploadPayload): Promise<StorageFileItem> {
  const taskId = await createUploadTask(payload.file);
  await uploadSimpleFile(taskId, payload.file);
  const completed = await completeUploadTask(taskId);
  const fileId = await bindUploadTask(taskId, payload);
  return fetchStorageFileDetail(fileId || completed.resultFileId || taskId);
}

export async function deleteStorageFile(fileId: string) {
  await requestDelete<void>(fillTemplate(shellEnv.storageFileDeletePathTemplate, fileId), {
    successMessage: "删除成功",
  });
}

export function buildStoragePreviewUrl(file: Pick<StorageFileItem, "id" | "fileUrl" | "previewUrl">) {
  return file.previewUrl ?? file.fileUrl ?? fillTemplate(shellEnv.storageFileContentPathTemplate, file.id);
}

export function buildStorageDownloadUrl(file: Pick<StorageFileItem, "id" | "fileUrl">) {
  return file.fileUrl ?? fillTemplate(shellEnv.storageFileContentPathTemplate, file.id);
}
