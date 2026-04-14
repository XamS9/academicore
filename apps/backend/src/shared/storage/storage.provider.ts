export interface StorageFile {
  key: string;         // unique storage key (used for deletion)
  url: string;         // publicly accessible URL
  originalName: string;
  mimeType: string;
  size: number;
}

export interface StorageProvider {
  upload(file: Express.Multer.File, prefix?: string): Promise<StorageFile>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
