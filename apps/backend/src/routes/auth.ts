import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { signToken } from "../lib/jwt";
import { ApiError } from "../lib/errors";
import { asyncHandler } from "../middleware/errorHandler";
import { validateBody } from "../lib/validate";
import { loginSchema, registerSchema } from "../schemas/auth";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";

const router = Router();

function toSafeUser(user: { id: string; fullName: string; email: string; createdAt: Date; updatedAt: Date }) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.post(
  "/register",
  authRateLimiter,
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { fullName, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullName, email, passwordHash },
    });

    const token = signToken({ sub: user.id, email: user.email });

    res.status(201).json({ user: toSafeUser(user), token });
  })
);

router.post(
  "/login",
  authRateLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const token = signToken({ sub: user.id, email: user.email });

    res.status(200).json({ user: toSafeUser(user), token });
  })
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (_req, res) => {
    // Stateless JWT: the client discards the token. Nothing to revoke server-side
    // since no refresh-token/session store is used in this implementation.
    res.status(200).json({ message: "Logged out successfully" });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      throw ApiError.unauthorized("User no longer exists");
    }
    res.status(200).json({ user: toSafeUser(user) });
  })
);

export default router;
