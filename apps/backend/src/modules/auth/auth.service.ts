import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../shared/prisma.client";
import { HttpError } from "../../shared/http-error";
import { env } from "../../config/env";
import { LoginDto } from "./auth.dto";

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  userType: string;
}

class AuthService {
  private async getRoles(userId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur: { role: { name: string } }) => ur.role.name);
  }

  async login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: string;
    };
  }> {
    const user = await prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null, isActive: true },
    });

    if (!user) {
      throw new HttpError(401, "Invalid credentials");
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatch) {
      throw new HttpError(401, "Invalid credentials");
    }

    const roles = await this.getRoles(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      userType: user.userType,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
      },
    };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch {
      throw new HttpError(401, "Invalid or expired refresh token");
    }

    const user = await prisma.user.findFirst({
      where: { id: decoded.sub, deletedAt: null, isActive: true },
    });

    if (!user) {
      throw new HttpError(401, "User not found or inactive");
    }

    const roles = await this.getRoles(user.id);

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      roles,
      userType: user.userType,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
    });

    return { accessToken };
  }
}

export const authService = new AuthService();
