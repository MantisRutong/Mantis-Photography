import {
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";

export type R2Photo = {
  // 直接给 <Image /> 使用的公开 URL
  src: string;
  alt: string;
};

type R2PhotoForSort = {
  src: string;
  alt: string;
  key: string;
  lastModifiedMs: number;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[R2] Missing required env: ${name}`);
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function mask(value: string) {
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

function titleFromKey(key: string) {
  const last = key.split("/").pop() ?? key;
  const base = last.replace(/\.[^/.]+$/, "");
  return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim() || "作品";
}

// encodeURIComponent each segment, but keep '/' separators
function encodePathSegments(p: string) {
  return p
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
}

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

function toPublicUrl(publicBaseUrl: string, key: string) {
  const base = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
  return `${base}/${encodePathSegments(key)}`;
}

/**
 * 从 Cloudflare R2（S3-compatible）中拉取桶内所有“图片文件”清单。
 * 说明：
 * - 过滤掉 Size=0 的对象（通常是“文件夹/占位对象”）
 * - 按 LastModified 倒序排列
 *
 * 注意：该函数是 Server Component 可直接调用的（不使用 "use client"）。
 */
export async function getPhotosFromR2(): Promise<R2Photo[]> {
  // #region agent log
  fetch("http://127.0.0.1:7908/ingest/2aecafe0-4983-470f-80f1-d11170493e8e", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "aaa77d" },
    body: JSON.stringify({
      sessionId: "aaa77d",
      runId: "run1",
      hypothesisId: "H1",
      location: "src/lib/r2.ts:getPhotosFromR2:entry",
      message: "R2 function entry",
      data: {
        hasEndpoint: Boolean(process.env.R2_ENDPOINT),
        hasAccessId: Boolean(process.env.R2_ACCESS_ID),
        hasSecret: Boolean(process.env.R2_SECRET_KEY),
        hasBucket: Boolean(process.env.R2_BUCKET_NAME),
        hasNextPublicDomain: Boolean(process.env.NEXT_PUBLIC_R2_DOMAIN),
        hasLegacyDomain: Boolean(process.env.R2_PUBLIC_DOMAIN),
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const envStatus = {
    R2_ENDPOINT: Boolean(process.env.R2_ENDPOINT),
    R2_ACCESS_ID: Boolean(process.env.R2_ACCESS_ID),
    R2_SECRET_KEY: Boolean(process.env.R2_SECRET_KEY),
    R2_BUCKET_NAME: Boolean(process.env.R2_BUCKET_NAME),
    NEXT_PUBLIC_R2_DOMAIN: Boolean(process.env.NEXT_PUBLIC_R2_DOMAIN),
    R2_PUBLIC_DOMAIN: Boolean(process.env.R2_PUBLIC_DOMAIN),
  };
  console.log("[R2] getPhotosFromR2 called. env status:", envStatus);

  try {
    const endpoint = requireEnv("R2_ENDPOINT");
    const accessKeyId = requireEnv("R2_ACCESS_ID");
    const secretAccessKey = requireEnv("R2_SECRET_KEY");
    const bucket = requireEnv("R2_BUCKET_NAME");
    // 统一优先使用 NEXT_PUBLIC_R2_DOMAIN，兼容旧变量 R2_PUBLIC_DOMAIN
    const publicBaseUrl =
      process.env.NEXT_PUBLIC_R2_DOMAIN ?? process.env.R2_PUBLIC_DOMAIN ?? endpoint;

    // #region agent log
    fetch("http://127.0.0.1:7908/ingest/2aecafe0-4983-470f-80f1-d11170493e8e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "aaa77d" },
      body: JSON.stringify({
        sessionId: "aaa77d",
        runId: "run1",
        hypothesisId: "H2",
        location: "src/lib/r2.ts:getPhotosFromR2:resolvedConfig",
        message: "Resolved R2 runtime config",
        data: {
          endpointHost: (() => {
            try {
              return new URL(endpoint).host;
            } catch {
              return "invalid-endpoint";
            }
          })(),
          bucket,
          domainSource: process.env.NEXT_PUBLIC_R2_DOMAIN
            ? "NEXT_PUBLIC_R2_DOMAIN"
            : process.env.R2_PUBLIC_DOMAIN
              ? "R2_PUBLIC_DOMAIN"
              : "R2_ENDPOINT_FALLBACK",
          publicDomainHost: (() => {
            try {
              return new URL(publicBaseUrl).host;
            } catch {
              return "invalid-public-domain";
            }
          })(),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    console.log("[R2] Using config:", {
      endpoint,
      bucket,
      publicBaseUrl,
      accessKeyId: mask(accessKeyId),
      secretAccessKey: mask(secretAccessKey),
      domainSource: process.env.NEXT_PUBLIC_R2_DOMAIN
        ? "NEXT_PUBLIC_R2_DOMAIN"
        : process.env.R2_PUBLIC_DOMAIN
          ? "R2_PUBLIC_DOMAIN"
          : "R2_ENDPOINT(fallback)",
    });

    const client = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    const photos: R2PhotoForSort[] = [];
    let continuationToken: string | undefined = undefined;
    let page = 0;

    while (true) {
      // #region agent log
      fetch("http://127.0.0.1:7908/ingest/2aecafe0-4983-470f-80f1-d11170493e8e", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "aaa77d" },
        body: JSON.stringify({
          sessionId: "aaa77d",
          runId: "run1",
          hypothesisId: "H3",
          location: "src/lib/r2.ts:getPhotosFromR2:listRequest",
          message: "Sending ListObjectsV2 request",
          data: { page: page + 1, hasContinuationToken: Boolean(continuationToken) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const resp: ListObjectsV2CommandOutput = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        }),
      );

      page += 1;
      const contents = resp.Contents ?? [];
      // #region agent log
      fetch("http://127.0.0.1:7908/ingest/2aecafe0-4983-470f-80f1-d11170493e8e", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "aaa77d" },
        body: JSON.stringify({
          sessionId: "aaa77d",
          runId: "run1",
          hypothesisId: "H3",
          location: "src/lib/r2.ts:getPhotosFromR2:listResponse",
          message: "Received ListObjectsV2 response",
          data: { page, objectCount: contents.length, isTruncated: Boolean(resp.IsTruncated) },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      console.log("[R2] ListObjectsV2 page:", {
        page,
        count: contents.length,
        isTruncated: Boolean(resp.IsTruncated),
      });

      for (const obj of contents) {
        if (!obj.Key) continue;
        if ((obj.Size ?? 0) === 0) continue;
        const ext = obj.Key.includes(".") ? obj.Key.slice(obj.Key.lastIndexOf(".")).toLowerCase() : "";
        if (!IMAGE_EXTS.has(ext)) continue;

        photos.push({
          src: toPublicUrl(publicBaseUrl, obj.Key),
          alt: titleFromKey(obj.Key),
          key: obj.Key,
          lastModifiedMs: obj.LastModified ? obj.LastModified.getTime() : 0,
        });
      }

      if (!resp.IsTruncated) break;
      continuationToken = resp.NextContinuationToken;
      if (!continuationToken) break;
    }

    photos.sort((a, b) => b.lastModifiedMs - a.lastModifiedMs);
    console.log("[R2] Final photo count:", photos.length);
    // #region agent log
    fetch("http://127.0.0.1:7908/ingest/2aecafe0-4983-470f-80f1-d11170493e8e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "aaa77d" },
      body: JSON.stringify({
        sessionId: "aaa77d",
        runId: "run1",
        hypothesisId: "H4",
        location: "src/lib/r2.ts:getPhotosFromR2:success",
        message: "R2 fetch succeeded",
        data: { totalPhotos: photos.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return photos.map(({ src, alt }) => ({ src, alt }));
  } catch (error) {
    // #region agent log
    fetch("http://127.0.0.1:7908/ingest/2aecafe0-4983-470f-80f1-d11170493e8e", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "aaa77d" },
      body: JSON.stringify({
        sessionId: "aaa77d",
        runId: "run1",
        hypothesisId: "H5",
        location: "src/lib/r2.ts:getPhotosFromR2:failure",
        message: "R2 fetch failed",
        data: {
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    console.error("[R2] getPhotosFromR2 failed:", error);
    throw error;
  }
}

