import { HttpError, badRequest } from "@/lib/server/core/errors";
import { getEnv } from "@/lib/server/core/env";

interface CdnApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    message?: string;
  };
}

interface CdnFileRecord {
  id: string;
  category: string;
  mimeType: string;
  originalName: string;
  extension: string;
  sizeBytes: number;
  accessCount: number;
  lastAccessedAt: string | null;
  checksumSha256: string;
  createdAt: string;
  updatedAt: string;
  url: string;
}

interface CdnStatsPayload {
  totals: {
    totalFiles: number;
    totalSizeBytes: number;
    totalAccessCount: number;
  };
  byCategory: Record<
    string,
    {
      totalFiles: number;
      totalSizeBytes: number;
      totalAccessCount: number;
    }
  >;
  topAccessedFiles: CdnFileRecord[];
  recentUploads: CdnFileRecord[];
  generatedAt: string;
}

export interface CdnUploadedAsset extends Omit<CdnFileRecord, "url"> {
  urlSuffix: string;
  url: string;
}

export interface CdnStatsData {
  totals: CdnStatsPayload["totals"];
  byCategory: CdnStatsPayload["byCategory"];
  topAccessedFiles: CdnUploadedAsset[];
  recentUploads: CdnUploadedAsset[];
  generatedAt: string;
}

function getCdnApiConfig() {
  const env = getEnv();
  const apiBaseUrl = env.CDN_API_BASE_URL ?? env.CDN_BASE_URL;
  const apiKey = env.CDN_API_KEY;

  if (!apiKey) {
    throw new HttpError(500, "CDN_API_KEY is not configured", "CDN_CONFIG_ERROR");
  }

  return {
    apiBaseUrl,
    apiKey,
  };
}

function resolvePublicUrl(urlSuffix: string): string {
  const env = getEnv();
  const base = new URL(env.CDN_BASE_URL.endsWith("/") ? env.CDN_BASE_URL : `${env.CDN_BASE_URL}/`);
  const suffix = urlSuffix.startsWith("/") ? urlSuffix.slice(1) : urlSuffix;
  return new URL(suffix, base).toString();
}

function normalizeFileRecord(record: CdnFileRecord): CdnUploadedAsset {
  return {
    id: record.id,
    category: record.category,
    mimeType: record.mimeType,
    originalName: record.originalName,
    extension: record.extension,
    sizeBytes: record.sizeBytes,
    accessCount: record.accessCount,
    lastAccessedAt: record.lastAccessedAt,
    checksumSha256: record.checksumSha256,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    urlSuffix: record.url,
    url: resolvePublicUrl(record.url),
  };
}

async function callCdnApi<T>(path: string, init: RequestInit): Promise<T> {
  const { apiBaseUrl, apiKey } = getCdnApiConfig();
  const base = apiBaseUrl.endsWith("/") ? apiBaseUrl.slice(0, -1) : apiBaseUrl;

  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");
  headers.set("x-api-key", apiKey);

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  let payload: CdnApiEnvelope<T> | null = null;

  try {
    payload = (await response.json()) as CdnApiEnvelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const message = payload?.error?.message ?? `CDN request failed (${response.status})`;
    throw new HttpError(response.status, message, "CDN_API_ERROR", payload);
  }

  return payload.data;
}

export async function uploadImageToCdn(file: File): Promise<CdnUploadedAsset> {
  if (!file || file.size <= 0) {
    throw badRequest("File is required for upload");
  }

  const formData = new FormData();
  formData.set("file", file);

  const data = await callCdnApi<CdnFileRecord>("/api/v1/image", {
    method: "POST",
    body: formData,
  });

  return normalizeFileRecord(data);
}

export async function getCdnStats(): Promise<CdnStatsData> {
  const data = await callCdnApi<CdnStatsPayload>("/api/v1/stats", {
    method: "GET",
  });

  return {
    totals: data.totals,
    byCategory: data.byCategory,
    topAccessedFiles: data.topAccessedFiles.map(normalizeFileRecord),
    recentUploads: data.recentUploads.map(normalizeFileRecord),
    generatedAt: data.generatedAt,
  };
}
