import { Request, Response, NextFunction } from "express";
import { auditLogsService } from "./audit-logs.service";

class AuditLogsController {
  findAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const entityType = req.query.entityType as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const logs = await auditLogsService.findAll({ entityType, limit });
      res.json(logs);
    } catch (err) {
      next(err);
    }
  };

  findByEntity = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const logs = await auditLogsService.findByEntity(
        req.params.entityType,
        req.params.entityId,
      );
      res.json(logs);
    } catch (err) {
      next(err);
    }
  };
}

export const auditLogsController = new AuditLogsController();
