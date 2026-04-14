import path from "path";
import { StorageProvider } from "./storage.provider";
import { LocalStorageProvider } from "./local.provider";
import { S3StorageProvider } from "./s3.provider";

export { StorageProvider, StorageFile } from "./storage.provider";

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER ?? "local";

  if (provider === "s3") {
    const required = ["S3_BUCKET", "S3_REGION", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"];
    for (const key of required) {
      if (!process.env[key]) {
        throw new Error(`Missing required env var for S3 storage: ${key}`);
      }
    }

    return new S3StorageProvider({
      bucket: process.env.S3_BUCKET!,
      region: process.env.S3_REGION!,
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    });
  }

  // Default: local
  const uploadDir = path.resolve(
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
  );
  const baseUrl = process.env.API_BASE_URL ?? `http://localhost:${process.env.PORT ?? 3000}/api`;

  return new LocalStorageProvider(uploadDir, baseUrl);
}

// Singleton — created once at startup
export const storageProvider: StorageProvider = createStorageProvider();
