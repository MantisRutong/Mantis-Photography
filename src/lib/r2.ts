import {
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";

export type R2Photo = {
  // 直接给 <Image /> 使用的公开 URL
  src: string;
  alt: string;
  key: string;
  lastModified: Date | null;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
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
  const endpoint = requireEnv("R2_ENDPOINT");
  const accessKeyId = requireEnv("R2_ACCESS_ID");
  const secretAccessKey = requireEnv("R2_SECRET_KEY");
  const bucket = requireEnv("R2_BUCKET_NAME");
  // 优先使用你提供的公开域名（不签名直连）。如果你暂时没配，先回退到 endpoint，避免页面崩溃。
  // 但 endpoint 可能不是公开可访问的域名，因此图片加载可能会失败，后续你补上 R2_PUBLIC_DOMAIN 即可。
  const publicBaseUrl = process.env.R2_PUBLIC_DOMAIN ?? endpoint;

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    // Cloudflare R2 更兼容 path-style
    forcePathStyle: true,
  });

  const photos: R2Photo[] = [];
  let continuationToken: string | undefined = undefined;

  while (true) {
    const resp: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      }),
    );

    const contents = resp.Contents ?? [];
    for (const obj of contents) {
      // 过滤掉“文件夹/占位对象”
      if (!obj.Key) continue;
      if ((obj.Size ?? 0) === 0) continue;
      const ext = obj.Key.includes(".") ? obj.Key.slice(obj.Key.lastIndexOf(".")).toLowerCase() : "";
      if (!IMAGE_EXTS.has(ext)) continue;

      photos.push({
        src: toPublicUrl(publicBaseUrl, obj.Key),
        alt: titleFromKey(obj.Key),
        key: obj.Key,
        lastModified: obj.LastModified ?? null,
      });
    }

    if (!resp.IsTruncated) break;
    continuationToken = resp.NextContinuationToken;
    if (!continuationToken) break;
  }

  photos.sort((a, b) => {
    const at = a.lastModified?.getTime() ?? 0;
    const bt = b.lastModified?.getTime() ?? 0;
    return bt - at;
  });

  return photos;
}

