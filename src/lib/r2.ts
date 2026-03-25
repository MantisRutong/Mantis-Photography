import {
  ListObjectsV2Command,
  type ListObjectsV2CommandOutput,
  S3Client,
} from "@aws-sdk/client-s3";

export type R2Photo = {
  /** 云盘「预览」路径（output），与列表中每一项一一对应，用作 React key */
  originalKey: string;
  /** 网页展示用：云盘 output / WebP 等预览图 URL */
  src: string;
  /** 下载用：云盘 input / 原图 URL（与预览同相对路径、不同根目录与扩展名） */
  originalSrc: string;
  /** 建议下载文件名（来自 input 原图文件名；无原图时退化为预览文件名） */
  downloadFileName: string;
  alt: string;
};

type R2PhotoForSort = {
  src: string;
  originalSrc: string;
  alt: string;
  key: string;
  lastModifiedMs: number;
  downloadFileName: string;
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

const IMAGE_EXTS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".tif",
  ".tiff",
  ".heic",
]);

/** 云盘预览根目录（与本地 optimize 输出 `output_images/` 对应） */
const OUTPUT_ROOT_PREFIXES = ["output_images/", "output/"];
/** 云盘原图根目录（与本地 `input_images/` 对应） */
const INPUT_ROOT_PREFIXES = ["input_images/", "input/"];

function stripOutputPrefix(key: string): string | null {
  for (const p of OUTPUT_ROOT_PREFIXES) {
    if (key === p) return "";
    if (key.startsWith(p)) return key.slice(p.length);
  }
  return null;
}

function isOutputLayoutKey(key: string): boolean {
  return stripOutputPrefix(key) !== null;
}

function bucketHasOutputLayout(allKeys: Set<string>): boolean {
  for (const k of allKeys) {
    if (isOutputLayoutKey(k) && stripOutputPrefix(k) !== "") return true;
  }
  return false;
}

/** 预览相对路径 `dir/foo.webp` → 若干 input 对象键（同相对路径 stem，多种原图扩展名） */
function buildInputKeysFromPreviewRelative(relativeKey: string): string[] {
  const slash = relativeKey.lastIndexOf("/");
  const dir = slash >= 0 ? relativeKey.slice(0, slash) : "";
  const file = slash >= 0 ? relativeKey.slice(slash + 1) : relativeKey;
  const dot = file.lastIndexOf(".");
  const stem = dot >= 0 ? file.slice(0, dot) : file;
  const relStem = dir ? `${dir}/${stem}` : stem;
  const origExts = [".jpg", ".jpeg", ".png", ".tif", ".tiff", ".heic", ".webp", ".gif", ".avif"];
  const out: string[] = [];
  for (const ip of INPUT_ROOT_PREFIXES) {
    for (const ext of origExts) {
      out.push(`${ip}${relStem}${ext}`);
    }
  }
  return out;
}

function toPublicUrl(publicBaseUrl: string, key: string) {
  const base = publicBaseUrl.endsWith("/") ? publicBaseUrl.slice(0, -1) : publicBaseUrl;
  return `${base}/${encodePathSegments(key)}`;
}

function buildPreviewCandidates(key: string): string[] {
  const slash = key.lastIndexOf("/");
  const dir = slash >= 0 ? key.slice(0, slash) : "";
  const file = slash >= 0 ? key.slice(slash + 1) : key;
  const dot = file.lastIndexOf(".");
  const name = dot >= 0 ? file.slice(0, dot) : file;
  const ext = dot >= 0 ? file.slice(dot) : "";
  const withDir = (d: string, f: string) => (d ? `${d}/${f}` : f);

  return [
    withDir(dir, `${name}-md${ext}`),
    withDir(dir, `${name}-medium${ext}`),
    withDir(dir ? `${dir}/md` : "md", file),
    withDir(dir ? `${dir}/preview` : "preview", file),
  ];
}

/** 排除「仅作为另一张原图预览」的对象，避免列表里出现重复条目、破坏一一对应 */
function isLikelyDerivativeKey(key: string): boolean {
  const slash = key.lastIndexOf("/");
  const dir = slash >= 0 ? key.slice(0, slash) : "";
  const file = slash >= 0 ? key.slice(slash + 1) : key;
  const dirParts = dir.split("/").filter(Boolean);
  const parentFolder = dirParts.length > 0 ? dirParts[dirParts.length - 1] : "";
  if (parentFolder === "md" || parentFolder === "preview") return true;

  const dot = file.lastIndexOf(".");
  const base = dot >= 0 ? file.slice(0, dot) : file;
  return base.endsWith("-md") || base.endsWith("-medium");
}

/**
 * 下载时建议的文件名：与桶内该对象键最后一段一致（一般为 input 原图文件名）。
 * 仅移除 Windows / 跨平台非法字符，保留中文与空格。
 */
function downloadNameFromKey(key: string) {
  let file = key.split("/").pop() ?? key;
  file = file.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "").trim();
  while (file.endsWith(".") || file.endsWith(" ")) file = file.slice(0, -1).trim();
  const out = file.slice(0, 200);
  return out || "image";
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
  const publicBaseUrl = requireAnyEnv(["NEXT_PUBLIC_R2_DOMAIN", "R2_PUBLIC_DOMAIN"]);

  const client = new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const photos: R2PhotoForSort[] = [];
  let continuationToken: string | undefined = undefined;
  const allImageKeys = new Set<string>();

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
      allImageKeys.add(obj.Key);
    }

    if (!resp.IsTruncated) break;
    continuationToken = resp.NextContinuationToken;
    if (!continuationToken) break;
  }

  const useOutputInputLayout = bucketHasOutputLayout(allImageKeys);

  continuationToken = undefined;
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

      if (useOutputInputLayout) {
        if (!isOutputLayoutKey(obj.Key)) continue;
        const relative = stripOutputPrefix(obj.Key);
        if (relative === null || relative === "") continue;

        const inputKey =
          buildInputKeysFromPreviewRelative(relative).find((k) => allImageKeys.has(k)) ?? null;
        const downloadKey = inputKey ?? obj.Key;

        photos.push({
          src: toPublicUrl(publicBaseUrl, obj.Key),
          originalSrc: toPublicUrl(publicBaseUrl, downloadKey),
          alt: titleFromKey(downloadKey),
          key: obj.Key,
          lastModifiedMs: obj.LastModified ? obj.LastModified.getTime() : 0,
          downloadFileName: downloadNameFromKey(downloadKey),
        });
        continue;
      }

      if (isLikelyDerivativeKey(obj.Key)) continue;

      const previewKey =
        buildPreviewCandidates(obj.Key).find((candidate) => allImageKeys.has(candidate)) ?? obj.Key;
      photos.push({
        src: toPublicUrl(publicBaseUrl, previewKey),
        originalSrc: toPublicUrl(publicBaseUrl, obj.Key),
        alt: titleFromKey(obj.Key),
        key: obj.Key,
        lastModifiedMs: obj.LastModified ? obj.LastModified.getTime() : 0,
        downloadFileName: downloadNameFromKey(obj.Key),
      });
    }

    if (!resp.IsTruncated) break;
    continuationToken = resp.NextContinuationToken;
    if (!continuationToken) break;
  }

  photos.sort((a, b) => b.lastModifiedMs - a.lastModifiedMs);
  return photos.map(({ key, src, originalSrc, alt, downloadFileName }) => ({
    originalKey: key,
    src,
    originalSrc,
    downloadFileName,
    alt,
  }));
}

