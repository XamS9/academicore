import { Request, Response, NextFunction } from "express";
import { reportsService } from "./reports.service";
import { ReportQuerySchema } from "./reports.dto";

class ReportsController {
  enrollmentStats = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = ReportQuerySchema.parse(req.query);
      res.json(await reportsService.enrollmentStats(query));
    } catch (err) {
      next(err);
    }
  };

  passFail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = ReportQuerySchema.parse(req.query);
      res.json(await reportsService.passFail(query));
    } catch (err) {
      next(err);
    }
  };

  gpaTrends = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.json(await reportsService.gpaTrends());
    } catch (err) {
      next(err);
    }
  };

  atRisk = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.json(await reportsService.atRisk());
    } catch (err) {
      next(err);
    }
  };

  summary = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.json(await reportsService.summary());
    } catch (err) {
      next(err);
    }
  };
}

export const reportsController = new ReportsController();
