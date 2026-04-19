import type {
  MobileRequestClient,
  MobileStorageService,
  MobileStorageUploadEndpoints,
  MobileStorageUploadPayload,
  StorageFileItem,
} from "../types";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getRecord(value: unknown) {
  return isRecord(value) ? value : undefined;
}

function formatDate(value: unknown) {
  return typeof value === "string" ? value : undefined;
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

function toUploadTaskDetail(payload: unknown): StorageUploadTaskDetail {
  const record = getRecord(payload) ?? {};
  const data = getRecord(record.data) ?? getRecord(record.result) ?? record;
  return {
    id: String(data.id ?? data.taskId ?? ""),
    resultFileId: typeof data.resultFileId === "string" ? data.resultFileId : undefined,
  };
}

async function uploadSimpleFile(client: MobileRequestClient, endpoints: MobileStorageUploadEndpoints, formData: FormData) {
  const payload = await client.upload<unknown>(endpoints.uploadPath, formData);
  return toUploadTaskDetail(payload);
}

async function bindUploadTask(client: MobileRequestClient, endpoints: MobileStorageUploadEndpoints, taskId: string, payload: MobileStorageUploadPayload) {
  const result = await client.post<unknown>(fillTemplate(endpoints.bindPathTemplate, taskId), {
    sourceEntity: payload.sourceEntity,
    sourceId: payload.sourceId,
    sourceType: payload.sourceType ?? "default",
  });
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

async function fetchStorageFileDetail(client: MobileRequestClient, endpoints: MobileStorageUploadEndpoints, fileId: string) {
  const payload = await client.get<unknown>(fillTemplate(endpoints.detailPathTemplate, fileId));
  return toStorageFileItem(payload, 0);
}

export function createMobileStorageService(
  client: MobileRequestClient,
  endpoints: MobileStorageUploadEndpoints,
  requestFactory: { createFormData: (payload: MobileStorageUploadPayload["asset"]) => FormData },
): MobileStorageService {
  return {
    async uploadFile(payload) {
      const uploadTask = await uploadSimpleFile(client, endpoints, requestFactory.createFormData(payload.asset));
      const taskId = uploadTask.id;
      const fileId = await bindUploadTask(client, endpoints, taskId, payload);
      return fetchStorageFileDetail(client, endpoints, fileId || uploadTask.resultFileId || taskId);
    },
    previewUrl(file) {
      return file.previewUrl ?? file.fileUrl ?? `${endpoints.downloadPath}${buildQuery({ fileId: file.id })}`;
    },
    downloadUrl(file) {
      return file.fileUrl ?? `${endpoints.downloadPath}${buildQuery({ fileId: file.id })}`;
    },
  };
}
