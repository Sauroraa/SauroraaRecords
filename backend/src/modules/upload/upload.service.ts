import { Injectable } from "@nestjs/common";
import * as path from "path";
import * as fs from "fs";

@Injectable()
export class UploadService {
  private readonly storageMode = process.env.STORAGE_MODE || "local";
  private readonly localPath = process.env.LOCAL_STORAGE_PATH || "/data/uploads";

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
}
