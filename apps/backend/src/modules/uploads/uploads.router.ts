import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { authenticate } from "../../middleware/auth.middleware";
import { storageProvider } from "../../shared/storage";
import { HttpError } from "../../shared/http-error";

export const uploadsRouter = Router();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  },
});

// POST /api/uploads — upload a file, returns { key, url, originalName, mimeType, size }
uploadsRouter.post(
  "/",
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    upload.single("file")(req as any, res as any, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return next(new HttpError(413, `El archivo supera el tamaño máximo de ${MAX_FILE_SIZE / 1024 / 1024} MB`));
        }
        return next(new HttpError(400, err.message));
      }
      if (err) {
        return next(new HttpError(400, err.message));
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        throw new HttpError(400, "No se recibió ningún archivo");
      }
      const result = await storageProvider.upload(req.file, "submissions");
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/uploads — delete a previously uploaded file
uploadsRouter.delete(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { key } = req.body as { key?: string };
      if (!key) throw new HttpError(400, "Se requiere el campo 'key'");
      await storageProvider.delete(key);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);
