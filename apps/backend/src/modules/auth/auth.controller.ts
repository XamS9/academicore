import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { LoginDto, RefreshDto } from './auth.dto';

class AuthController {
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginDto.parse(req.body);
      const result = await authService.login(dto);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RefreshDto.parse(req.body);
      const result = await authService.refresh(dto.refreshToken);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  };
}

export const authController = new AuthController();
