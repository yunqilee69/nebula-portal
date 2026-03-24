import type { StorageFileItem } from "@platform/core";
import type { MobileAssetDescriptor, MobileRequestClient, MobileStorageService, MobileStorageUploadEndpoints, MobileStorageUploadPayload, MobileStorageUploadRequestFactory } from "./types";

interface StorageUploadTaskDetail {
  id: string;
  resultFileId?: string;
}

function fillTemplate(template: string, id: string) {
  return template.replace("{id}", encodeURIComponent(id));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRecord(value: unknown) {
  return isRecord(value) ? value : undefined;
}

function formatDate(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function toStorageFileItem(payload: unknown, fallbackIndex: number): StorageFileItem {
  const record = getRecord(payload) ?? {};
  return {
    id: String(record.id ?? record.fileId ?? `storage-${fallbackIndex}`),
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

async function createUploadTask(client: MobileRequestClient, endpoints: MobileStorageUploadEndpoints, asset: MobileAssetDescriptor) {
  return client.post<string>(endpoints.createTaskPath, {
    uploadMode: "simple",
    fileName: asset.name,
    fileExtension: asset.name.includes(".") ? asset.name.split(".").pop() : undefined,
    fileMimeType: asset.mimeType || "application/octet-stream",
    fileSize: asset.size,
  });
}

async function uploadSimpleFile(
  client: MobileRequestClient,
  endpoints: MobileStorageUploadEndpoints,
  requestFactory: MobileStorageUploadRequestFactory,
  taskId: string,
  asset: MobileAssetDescriptor,
) {
  return client.upload(fillTemplate(endpoints.uploadPathTemplate, taskId), requestFactory.createFormData(asset));
}

async function completeUploadTask(client: MobileRequestClient, endpoints: MobileStorageUploadEndpoints, taskId: string) {
  const payload = await client.post<unknown>(fillTemplate(endpoints.completePathTemplate, taskId));
  return toUploadTaskDetail(payload);
}

async function bindUploadTask(client: MobileRequestClient, endpoints: MobileStorageUploadEndpoints, taskId: string, payload: MobileStorageUploadPayload) {
  return client.post<string>(fillTemplate(endpoints.bindPathTemplate, taskId), {
    sourceEntity: payload.sourceEntity,
    sourceId: payload.sourceId,
    sourceType: payload.sourceType ?? "default",
  });
}

async function fetchStorageFileDetail(client: MobileRequestClient, endpoints: MobileStorageUploadEndpoints, fileId: string) {
  const payload = await client.get<unknown>(fillTemplate(endpoints.detailPathTemplate, fileId));
  return toStorageFileItem(payload, 0);
}

export function createMobileStorageService(
  client: MobileRequestClient,
  endpoints: MobileStorageUploadEndpoints,
  requestFactory: MobileStorageUploadRequestFactory,
): MobileStorageService {
  return {
    async uploadFile(payload) {
      const taskId = await createUploadTask(client, endpoints, payload.asset);
      await uploadSimpleFile(client, endpoints, requestFactory, taskId, payload.asset);
      const completed = await completeUploadTask(client, endpoints, taskId);
      const fileId = await bindUploadTask(client, endpoints, taskId, payload);
      return fetchStorageFileDetail(client, endpoints, fileId || completed.resultFileId || taskId);
    },
    previewUrl(file) {
      return file.previewUrl ?? file.fileUrl ?? fillTemplate(endpoints.contentPathTemplate, file.id);
    },
    downloadUrl(file) {
      return file.fileUrl ?? fillTemplate(endpoints.contentPathTemplate, file.id);
    },
  };
}
