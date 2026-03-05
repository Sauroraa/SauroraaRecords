import Redis from "ioredis";
import { execFile } from "node:child_process";
import { mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";
const queueName = process.env.WORKER_QUEUE_NAME || "audio:processing";
const outputRoot = process.env.WORKER_OUTPUT_ROOT || "/data/uploads/streams";

const redis = new Redis(redisUrl);

async function runFfmpeg(args) {
  await execFileAsync("ffmpeg", args, {
    windowsHide: true,
    maxBuffer: 10 * 1024 * 1024
  });
}

async function probeDurationSec(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath
  ]);
  const duration = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return duration;
}

async function buildHls(masterPath, outputDir, durationSec, startSec = 0, watermarkRef = "") {
  await mkdir(outputDir, { recursive: true });
  const playlist = join(outputDir, "index.m3u8");
  const metadataArg = watermarkRef ? ["-metadata", `comment=${watermarkRef}`] : [];
  const args = [
    "-y",
    ...(startSec > 0 ? ["-ss", String(startSec)] : []),
    "-i",
    masterPath,
    ...(durationSec > 0 ? ["-t", String(durationSec)] : []),
    ...metadataArg,
    "-codec:a",
    "aac",
    "-b:a",
    "192k",
    "-hls_time",
    "4",
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    join(outputDir, "seg_%03d.ts"),
    playlist
  ];

  await runFfmpeg(args);
  return playlist;
}

function computeSmartPreviewStart(totalSec, previewDuration) {
  if (totalSec <= 0) return 0;
  // Approximation "drop-centered": start around 35% of track then center preview window.
  const center = totalSec * 0.35;
  const rawStart = center - previewDuration / 2;
  return Math.max(0, Math.floor(rawStart));
}

async function buildPreviewHls(masterPath, outputDir, previewDuration, watermarkRef = "") {
  const total = await probeDurationSec(masterPath);
  const start = computeSmartPreviewStart(total, previewDuration);
  return buildHls(masterPath, outputDir, previewDuration, start, watermarkRef);
}

async function buildFullHls(masterPath, outputDir, watermarkRef = "") {
  return buildHls(masterPath, outputDir, 0, 0, watermarkRef);
}

async function buildWaveform(masterPath, outputFile) {
  await mkdir(dirname(outputFile), { recursive: true });
  await runFfmpeg([
    "-y",
    "-i",
    masterPath,
    "-filter_complex",
    "aformat=channel_layouts=mono,showwavespic=s=1200x300:colors=0x00AEEF",
    "-frames:v",
    "1",
    outputFile
  ]);
  return outputFile;
}

async function processJob(payload) {
  const { releaseId, masterPath, previewDuration = 45, watermarkRef = "" } = payload;
  if (!releaseId || !masterPath) throw new Error("Invalid worker payload");

  await stat(masterPath);

  const releaseRoot = join(outputRoot, releaseId);
  const fullDir = join(releaseRoot, "full");
  const previewDir = join(releaseRoot, "preview");
  const waveformFile = join(releaseRoot, "waveform.png");

  await buildFullHls(masterPath, fullDir, watermarkRef);
  await buildPreviewHls(masterPath, previewDir, Math.min(Math.max(previewDuration, 30), 90), watermarkRef);
  await buildWaveform(masterPath, waveformFile);

  console.log(
    JSON.stringify({
      level: "info",
      msg: "audio_processed",
      releaseId,
      fullPlaylist: join(fullDir, "index.m3u8"),
      previewPlaylist: join(previewDir, "index.m3u8"),
      waveformFile
    })
  );
}

async function consumeQueue() {
  console.log(`[worker] listening queue=${queueName}`);
  while (true) {
    const item = await redis.brpop(queueName, 0);
    if (!item || item.length < 2) continue;
    const [, rawPayload] = item;
    try {
      const payload = JSON.parse(rawPayload);
      await processJob(payload);
    } catch (error) {
      console.error("[worker] job_failed", error);
    }
  }
}

consumeQueue().catch((error) => {
  console.error("[worker] fatal", error);
  process.exit(1);
});
