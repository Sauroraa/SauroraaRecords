import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

type ResumableKind = "audio" | "cover" | "zip";

type ResumableInitInput = {
  userId: string;
  kind: ResumableKind;
  filename: string;
  mimeType: string;
  totalSize: number;
  chunkSize: number;
  fingerprint?: string;
};

type ResumableManifest = {
  id: string;
  userId: string;
  kind: ResumableKind;
  filename: string;
  mimeType: string;
  totalSize: number;
  chunkSize: number;
  uploadedBytes: number;
  nextChunk: number;
  fingerprint?: string;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class UploadService {
  private readonly storageMode = process.env.STORAGE_MODE || "local";
  private readonly localPath = process.env.LOCAL_STORAGE_PATH || "/data/uploads";
  private readonly resumablePath = path.join(this.localPath, ".resumable");
  private readonly resumableTtlMs = 24 * 60 * 60 * 1000;

  async saveFile(file: Express.Multer.File, subfolder: string): Promise<string> {
    if (this.storageMode === "s3") {
      return this.uploadToS3(file, subfolder);
    }
    return this.saveLocally(file, subfolder);
  }

  private saveLocally(file: Express.Multer.File, subfolder: string): string {
    const dir = path.join(this.localPath, subfolder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filename = `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, file.buffer);
    return `/uploads/${subfolder}/${filename}`;
  }

  async initResumable(input: ResumableInitInput) {
    this.ensureDir(this.resumablePath);
    this.cleanupExpiredResumable();

    const existing = this.findResumableByFingerprint(input.userId, input.fingerprint);
    if (existing) {
      return this.toResumableState(existing);
    }

    const id = crypto.randomUUID();
    const manifest: ResumableManifest = {
      id,
      userId: input.userId,
      kind: input.kind,
      filename: this.sanitizeFilename(input.filename),
      mimeType: input.mimeType,
      totalSize: input.totalSize,
      chunkSize: input.chunkSize,
      uploadedBytes: 0,
      nextChunk: 0,
      fingerprint: input.fingerprint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.writeManifest(manifest);
    fs.writeFileSync(this.partPath(id), Buffer.alloc(0));
    return this.toResumableState(manifest);
  }

  async getResumableStatus(uploadId: string, userId: string) {
    const manifest = this.readManifest(uploadId);
    if (!manifest || manifest.userId !== userId) return null;
    return this.toResumableState(manifest);
  }

  async appendResumableChunk(uploadId: string, userId: string, chunkIndex: number, chunk: Buffer) {
    const manifest = this.readManifest(uploadId);
    if (!manifest || manifest.userId !== userId) return null;
    if (chunkIndex !== manifest.nextChunk) {
      return this.toResumableState(manifest);
    }
    fs.appendFileSync(this.partPath(uploadId), chunk);
    const actualSize = fs.statSync(this.partPath(uploadId)).size;
    manifest.uploadedBytes = Math.min(actualSize, manifest.totalSize);
    manifest.nextChunk += 1;
    manifest.updatedAt = new Date().toISOString();
    this.writeManifest(manifest);
    return this.toResumableState(manifest);
  }

  async completeResumable(uploadId: string, userId: string) {
    const manifest = this.readManifest(uploadId);
    if (!manifest || manifest.userId !== userId) return null;

    const partPath = this.partPath(uploadId);
    if (!fs.existsSync(partPath)) return null;
    const currentSize = fs.statSync(partPath).size;
    if (currentSize !== manifest.totalSize) {
      return this.toResumableState(manifest);
    }

    const subfolder = this.kindToSubfolder(manifest.kind);
    const finalDir = path.join(this.localPath, subfolder);
    this.ensureDir(finalDir);
    const finalName = `${Date.now()}-${manifest.filename}`;
    const finalPath = path.join(finalDir, finalName);
    fs.renameSync(partPath, finalPath);

    let publicPath = `/uploads/${subfolder}/${finalName}`;
    if (this.storageMode === "s3") {
      const fileBuffer = fs.readFileSync(finalPath);
      publicPath = await this.uploadBufferToS3(fileBuffer, subfolder, finalName, manifest.mimeType);
      fs.rmSync(finalPath, { force: true });
    }

    fs.rmSync(this.manifestPath(uploadId), { force: true });
    return { done: true, path: publicPath };
  }

  private async uploadToS3(file: Express.Multer.File, subfolder: string): Promise<string> {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || ""
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
    });

    const key = `${subfolder}/${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || "sauroraa",
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      })
    );

    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }

  private async uploadBufferToS3(
    buffer: Buffer,
    subfolder: string,
    filename: string,
    contentType: string
  ): Promise<string> {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY || "",
        secretAccessKey: process.env.S3_SECRET_KEY || ""
      },
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
    });
    const key = `${subfolder}/${filename}`;
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET || "sauroraa",
        Key: key,
        Body: buffer,
        ContentType: contentType
      })
    );
    return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`;
  }

  async getSignedUrl(filePath: string): Promise<string> {
    if (this.storageMode === "s3") {
      const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      const client = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "us-east-1",
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY || "",
          secretAccessKey: process.env.S3_SECRET_KEY || ""
        },
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true"
      });
      const key = filePath.replace(`${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/`, "");
      return getSignedUrl(
        client,
        new GetObjectCommand({ Bucket: process.env.S3_BUCKET || "sauroraa", Key: key }),
        { expiresIn: 600 }
      );
    }
    return filePath;
  }

  private kindToSubfolder(kind: ResumableKind) {
    if (kind === "cover") return "covers";
    if (kind === "zip") return "dubpacks";
    return "audio";
  }

  private sanitizeFilename(name: string) {
    return name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9.\-_]/g, "");
  }

  private ensureDir(dirPath: string) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
  }

  private manifestPath(id: string) {
    return path.join(this.resumablePath, `${id}.json`);
  }

  private partPath(id: string) {
    return path.join(this.resumablePath, `${id}.part`);
  }

  private writeManifest(manifest: ResumableManifest) {
    fs.writeFileSync(this.manifestPath(manifest.id), JSON.stringify(manifest));
  }

  private readManifest(id: string): ResumableManifest | null {
    const manifestPath = this.manifestPath(id);
    if (!fs.existsSync(manifestPath)) return null;
    try {
      return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ResumableManifest;
    } catch {
      return null;
    }
  }

  private findResumableByFingerprint(userId: string, fingerprint?: string): ResumableManifest | null {
    if (!fingerprint || !fs.existsSync(this.resumablePath)) return null;
    const files = fs.readdirSync(this.resumablePath).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const manifest = JSON.parse(
          fs.readFileSync(path.join(this.resumablePath, file), "utf8")
        ) as ResumableManifest;
        if (manifest.userId === userId && manifest.fingerprint === fingerprint) {
          return manifest;
        }
      } catch {}
    }
    return null;
  }

  private cleanupExpiredResumable() {
    if (!fs.existsSync(this.resumablePath)) return;
    const now = Date.now();
    const files = fs.readdirSync(this.resumablePath);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      try {
        const manifestPath = path.join(this.resumablePath, file);
        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as ResumableManifest;
        const age = now - new Date(manifest.updatedAt).getTime();
        if (age > this.resumableTtlMs) {
          fs.rmSync(manifestPath, { force: true });
          fs.rmSync(this.partPath(manifest.id), { force: true });
        }
      } catch {}
    }
  }

  private toResumableState(manifest: ResumableManifest) {
    return {
      uploadId: manifest.id,
      chunkSize: manifest.chunkSize,
      uploadedBytes: manifest.uploadedBytes,
      totalSize: manifest.totalSize,
      nextChunk: manifest.nextChunk,
      done: manifest.uploadedBytes >= manifest.totalSize
    };
  }
}
