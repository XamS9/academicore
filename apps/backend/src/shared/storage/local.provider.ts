import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { StorageProvider, StorageFile } from "./storage.provider";

export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(uploadDir: string, baseUrl: string) {
    this.uploadDir = uploadDir;
    this.baseUrl = baseUrl;
    // Ensure the upload directory exists
    fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
  }

  async upload(file: Express.Multer.File, prefix = "uploads"): Promise<StorageFile> {
    const ext = path.extname(file.originalname) || "";
    const key = `${prefix}/${crypto.randomUUID()}${ext}`;
    const dest = path.join(this.uploadDir, key);

    // Ensure subdirectory exists
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, file.buffer);

    return {
      key,
      url: `${this.baseUrl}/files/${key}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    await fs.unlink(filePath).catch(() => {});
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/files/${key}`;
  }
}
