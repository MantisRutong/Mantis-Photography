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

function requireAnyEnv(names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  const joined = names.join(" or ");
  console.error(`[R2] Missing required env(s): ${joined}`);
  throw new Error(`Missing required environment variable: ${joined}`);
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
  const bucket = requireAnyEnv(["R2_BUCKET_NAME", "R2_BUCKET"]);
  const publicBaseUrl =
    process.env.NEXT_PUBLIC_R2_DOMAIN ?? process.env.R2_PUBLIC_DOMAIN ?? endpoint;

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const photos: R2PhotoForSort[] = [];
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
  return photos.map(({ src, alt }) => ({ src, alt }));
}

