import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../shared/http-error";

export interface UploadTokenPayload {
  sub: string; // student id
  purpose: "admission_upload";
}

declare global {
  namespace Express {
    interface Request {
      uploadToken?: UploadTokenPayload;
    }
  }
}

export function signAdmissionUploadToken(studentId: string): string {
  const payload: UploadTokenPayload = {
    sub: studentId,
    purpose: "admission_upload",
  };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30m" });
}

/**
 * Accepts either a regular access token (for logged-in students re-uploading
 * from their profile) or a short-lived admission upload token (for the
 * registration flow before the account is active).
 */
export function authenticateAdmissionUpload(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return next(new HttpError(401, "Missing or invalid Authorization header"));
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    if (decoded && (decoded as UploadTokenPayload).purpose === "admission_upload") {
      req.uploadToken = decoded as UploadTokenPayload;
      return next();
    }
    // Fall through: treat as a normal access token
    req.user = decoded as unknown as Express.Request["user"];
    return next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
