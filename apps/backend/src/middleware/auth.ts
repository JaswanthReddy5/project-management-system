import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";
import { ApiError } from "../lib/errors";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing or malformed authorization header"));
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return next(ApiError.unauthorized("Missing token"));
  }

  try {
    const payload = verifyToken(token);
    req.userId = payload.sub;
    req.userEmail = payload.email;
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired token"));
  }
}
