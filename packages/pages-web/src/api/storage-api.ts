import type {
  StorageFileItem,
  StorageListQuery,
  StorageListResult,
  StorageSignedUrlPayload,
  StorageSignedUrlResult,
  StorageUploadPayload,
  StorageUploadTaskItem,
  StorageUploadTaskPageQuery,
  StorageUploadTaskPageResult,
} from "@nebula/core";
import { webEnv } from "../config/env";
import { getArray, getRecord, requestDelete, requestGet, requestPost, requestUpload } from "./client";

interface StorageUploadTaskDetail {
  id: string;
  resultFileId?: string;
}

function fillTemplate(template: string, id: string) {
  return template.replace("{id}", encodeURIComponent(id));
}

function buildQuery(params: Record<string, string | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value) {
      return;
    }
    searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function formatDate(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

function getStringValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
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
    uploadTaskId: getStringValue(record, ["uploadTaskId", "taskId"]),
    uploadUserId: getStringValue(record, ["uploadUserId", "createUserId", "createdBy"]),
    uploadUserName: getStringValue(record, ["uploadUserName", "uploadUserNickname", "createUserName", "createdByName"]),
    uploadedBy:
      getStringValue(record, ["uploadUserName", "uploadUserNickname", "createUserName", "createdByName"])
      ?? getStringValue(record, ["uploadUserId", "createUserId", "createdBy"]),
    createdAt: formatDate(record.createTime ?? record.createdAt),
    updatedAt: formatDate(record.updateTime ?? record.updatedAt),
  };
}

function toUploadTaskItem(payload: unknown): StorageUploadTaskItem {
  const record = getRecord(payload) ?? {};
  const data = getRecord(record.data) ?? getRecord(record.result) ?? record;

  return {
    id: String(data.id ?? data.taskId ?? ""),
    fileName: getStringValue(data, ["fileName", "name", "originalFilename"]),
    fileHash: getStringValue(data, ["fileHash"]),
    contentType: getStringValue(data, ["fileMimeType", "contentType", "mimeType"]),
    extension: getStringValue(data, ["fileExtension", "extension"]),
    size: typeof data.fileSize === "number" ? data.fileSize : typeof data.size === "number" ? data.size : undefined,
    taskMode: getStringValue(data, ["taskMode", "uploadMode"]),
    uploadMode: getStringValue(data, ["uploadMode", "taskMode"]),
    status: typeof data.status === "string" || typeof data.status === "number" ? data.status : undefined,
    partCount: typeof data.partCount === "number" ? data.partCount : typeof data.totalPartCount === "number" ? data.totalPartCount : undefined,
    uploadedPartCount:
      typeof data.uploadedPartCount === "number"
        ? data.uploadedPartCount
        : typeof data.uploadedParts === "number"
          ? data.uploadedParts
          : undefined,
    uploadedSize: typeof data.uploadedSize === "number" ? data.uploadedSize : undefined,
    lastPartTime: formatDate(data.lastPartTime ?? data.lastUploadPartTime),
    resultFileId: getStringValue(data, ["resultFileId"]),
    uploadUserId: getStringValue(data, ["uploadUserId", "createUserId", "createdBy"]),
    uploadUserName: getStringValue(data, ["uploadUserName", "uploadUserNickname", "createUserName", "createdByName"]),
    createdAt: formatDate(data.createTime ?? data.createdAt),
    updatedAt: formatDate(data.updateTime ?? data.updatedAt),
  };
}

function toUploadTaskDetail(payload: unknown): StorageUploadTaskDetail {
  const task = toUploadTaskItem(payload);
  return {
    id: task.id,
    resultFileId: task.resultFileId,
  };
}

async function uploadSimpleFile(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const payload = await requestUpload<unknown>(webEnv.storageUploadPath, formData, { silent: true });
  return toUploadTaskDetail(payload);
}

async function bindUploadTask(taskId: string, payload: Pick<StorageUploadPayload, "sourceEntity" | "sourceId" | "sourceType">) {
  const result = await requestPost<unknown>(fillTemplate(webEnv.storageUploadBindPathTemplate, taskId), {
    sourceEntity: payload.sourceEntity,
    sourceId: payload.sourceId,
    sourceType: payload.sourceType ?? "default",
  }, { silent: true });
  const record = getRecord(result);
  const data = getRecord(record?.data) ?? getRecord(record?.result) ?? record;
  return typeof data?.fileId === "string"
    ? data.fileId
    : typeof data?.id === "string"
      ? data.id
      : typeof result === "string"
        ? result
        : "";
}

export async function fetchStoragePage(query: StorageListQuery): Promise<StorageListResult> {
  const payload = await requestPost<unknown>(webEnv.storageFilePagePath, query, { silent: true, unwrap: false });
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

export async function fetchStorageUploadTaskPage(query: StorageUploadTaskPageQuery): Promise<StorageUploadTaskPageResult> {
  const payload = await requestPost<unknown>(webEnv.storageUploadTaskPagePath, query, { silent: true, unwrap: false });
  const record = getRecord(payload);
  const envelopeData = getRecord(record?.data) ?? getRecord(record?.result) ?? record;
  const pageData = getRecord(envelopeData?.data) ?? envelopeData;
  const rows = getArray<unknown>(pageData?.data ?? pageData?.rows ?? pageData?.list ?? envelopeData?.rows ?? envelopeData?.list);
  const totalCandidate = pageData?.total ?? envelopeData?.total ?? record?.total;
  const total = typeof totalCandidate === "number" ? totalCandidate : rows.length;

  return {
    data: rows.map((item) => toUploadTaskItem(item)),
    total,
  };
}

export async function fetchStorageUploadTaskDetail(taskId: string): Promise<StorageUploadTaskItem> {
  const payload = await requestGet<unknown>(fillTemplate(`${webEnv.storageUploadTaskPath}/{id}`, taskId), undefined, { silent: true });
  return toUploadTaskItem(payload);
}

export async function fetchStorageFileDetail(fileId: string): Promise<StorageFileItem> {
  const payload = await requestGet<unknown>(fillTemplate(webEnv.storageFileDetailPathTemplate, fileId), undefined, { silent: true });
  return toStorageFileItem(payload, 0);
}

export async function uploadStorageFile(payload: StorageUploadPayload): Promise<StorageFileItem> {
  const uploadTask = await uploadSimpleFile(payload.file);
  const taskId = uploadTask.id;
  const fileId = await bindUploadTask(taskId, payload);
  return fetchStorageFileDetail(fileId || uploadTask.resultFileId || taskId);
}

export async function deleteStorageFile(fileId: string) {
  await requestDelete<void>(fillTemplate(webEnv.storageFileDeletePathTemplate, fileId), {
    successMessage: "删除成功",
  });
}

export async function generateStorageSignedUrl(payload: StorageSignedUrlPayload): Promise<StorageSignedUrlResult> {
  const result = await requestPost<unknown>(webEnv.storageGenerateSignedUrlPath, payload, { silent: true, unwrap: false });
  const record = getRecord(result);
  const data = getRecord(record?.data) ?? getRecord(record?.result) ?? record;
  return {
    url: String(data?.url ?? ""),
    expireAt: typeof data?.expireAt === "string" ? data.expireAt : undefined,
    maxDownloadCount: typeof data?.maxDownloadCount === "number" ? data.maxDownloadCount : undefined,
  };
}

export function buildStoragePreviewUrl(file: Pick<StorageFileItem, "id" | "fileUrl" | "previewUrl">) {
  return file.previewUrl ?? file.fileUrl ?? `${webEnv.storageDownloadPath}${buildQuery({ fileId: file.id })}`;
}

export function buildStorageDownloadUrl(file: Pick<StorageFileItem, "id" | "fileUrl">, fileName?: string) {
  return file.fileUrl ?? `${webEnv.storageDownloadPath}${buildQuery({ fileId: file.id, fileName })}`;
}

export function buildStorageSignedDownloadUrl(params: {
  fileId: string;
  fileName?: string;
  expireAt: string;
  maxDownloadCount?: number;
  signature: string;
}) {
  return `${webEnv.storageSignedDownloadPath}${buildQuery({
    fileId: params.fileId,
    fileName: params.fileName,
    expireAt: params.expireAt,
    maxDownloadCount: params.maxDownloadCount ? String(params.maxDownloadCount) : undefined,
    signature: params.signature,
  })}`;
}
