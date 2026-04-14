import crypto from "crypto";
import path from "path";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { StorageProvider, StorageFile } from "./storage.provider";

export interface S3ProviderConfig {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;   // for S3-compatible providers (e.g. MinIO)
  forcePathStyle?: boolean;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly endpoint?: string;
  private readonly forcePathStyle: boolean;

  constructor(config: S3ProviderConfig) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;
    this.forcePathStyle = config.forcePathStyle ?? false;

    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      ...(config.endpoint && { endpoint: config.endpoint }),
      ...(config.forcePathStyle && { forcePathStyle: true }),
    });
  }

  async upload(file: Express.Multer.File, prefix = "uploads"): Promise<StorageFile> {
    const ext = path.extname(file.originalname) || "";
    const key = `${prefix}/${crypto.randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: `inline; filename="${file.originalname}"`,
      }),
    );

    return {
      key,
      url: this.getUrl(key),
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  getUrl(key: string): string {
    if (this.endpoint) {
      const base = this.forcePathStyle
        ? `${this.endpoint}/${this.bucket}`
        : `${this.endpoint}`;
      return `${base}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
