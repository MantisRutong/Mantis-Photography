import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT_DIR = process.cwd();
const INPUT_DIR = path.join(ROOT_DIR, "input_images");
const OUTPUT_DIR = path.join(ROOT_DIR, "output_images");
const GITIGNORE_PATH = path.join(ROOT_DIR, ".gitignore");

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".tif", ".tiff", ".heic", ".webp"]);

async function ensureGitignoreRules() {
  const requiredRules = ["/input_images/", "/output_images/"];

  let content = "";
  try {
    content = await fs.readFile(GITIGNORE_PATH, "utf8");
  } catch (err) {
    if (err && err.code !== "ENOENT") throw err;
  }

  const lines = new Set(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );

  const missing = requiredRules.filter((rule) => !lines.has(rule));
  if (missing.length === 0) return;

  const separator = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  const appendBlock = `${separator}\n# local raw/optimized images\n${missing.join("\n")}\n`;
  await fs.appendFile(GITIGNORE_PATH, appendBlock, "utf8");
  console.log(`Updated .gitignore with: ${missing.join(", ")}`);
}

async function collectImages(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectImages(absPath)));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTS.has(ext)) files.push(absPath);
  }

  return files;
}

function formatIndex(current, total) {
  const width = String(total).length;
  return `[${String(current).padStart(width, " ")}/${total}]`;
}

async function optimizeOne(srcPath, idx, total) {
  const rel = path.relative(INPUT_DIR, srcPath);
  const parsed = path.parse(rel);
  const outDir = path.join(OUTPUT_DIR, parsed.dir);
  // Output `<stem>.webp`. On R2 use parallel keys: preview under output_images/, originals under input_images/ (see src/lib/r2.ts).
  const outPath = path.join(outDir, `${parsed.name}.webp`);

  await fs.mkdir(outDir, { recursive: true });

  console.log(`${formatIndex(idx, total)} Processing: ${rel}`);

  const image = sharp(srcPath, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;

  const isLandscape = width >= height;
  const resizeOptions = isLandscape
    ? { width: 2560, withoutEnlargement: true }
    : { height: 2560, withoutEnlargement: true };

  await image
    .rotate()
    .resize(resizeOptions)
    .webp({ quality: 80 })
    .withMetadata()
    .toFile(outPath);
}

async function main() {
  await ensureGitignoreRules();

  try {
    await fs.access(INPUT_DIR);
  } catch {
    console.error("input_images not found. Create it in the project root and add source images.");
    process.exit(1);
  }

  const files = await collectImages(INPUT_DIR);
  if (files.length === 0) {
    console.log("No images to process in input_images.");
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (let i = 0; i < files.length; i += 1) {
    await optimizeOne(files[i], i + 1, files.length);
  }

  console.log("\n✨ Done. Upload WebP files from output_images/ to Cloudflare R2 (preview path).");
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
