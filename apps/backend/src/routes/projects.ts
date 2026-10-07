import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { validateBody, validateParams, validateQuery } from "../lib/validate";
import { idParamSchema } from "../schemas/common";
import { createProjectSchema, listProjectsQuerySchema, updateProjectSchema } from "../schemas/project";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateQuery(listProjectsQuerySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { search, status, page, limit, sortBy, sortOrder } = req.query as unknown as {
      search?: string;
      status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
      page: number;
      limit: number;
      sortBy: "name" | "createdAt" | "startDate" | "endDate" | "status";
      sortOrder: "asc" | "desc";
    };

    const where = {
      userId: req.userId!,
      ...(status ? { status } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { tasks: true } } },
      }),
      prisma.project.count({ where }),
    ]);

    res.status(200).json({
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  })
);

router.get(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: { tasks: { orderBy: { createdAt: "desc" } } },
    });

    if (!project || project.userId !== req.userId) {
      throw ApiError.notFound("Project not found");
    }

    res.status(200).json({ data: project });
  })
);

router.post(
  "/",
  validateBody(createProjectSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const project = await prisma.project.create({
      data: { ...req.body, userId: req.userId! },
    });
    res.status(201).json({ data: project });
  })
);

router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateProjectSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      throw ApiError.notFound("Project not found");
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.status(200).json({ data: project });
  })
);

router.delete(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      throw ApiError.notFound("Project not found");
    }

    await prisma.project.delete({ where: { id: req.params.id } });

    res.status(204).send();
  })
);

export default router;
