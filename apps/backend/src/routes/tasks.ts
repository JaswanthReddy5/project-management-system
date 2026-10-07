import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ApiError } from "../lib/errors";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { validateBody, validateParams, validateQuery } from "../lib/validate";
import { idParamSchema } from "../schemas/common";
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from "../schemas/task";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  validateQuery(listTasksQuerySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { search, status, priority, projectId, page, limit, sortBy, sortOrder } = req.query as unknown as {
      search?: string;
      status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
      priority?: "LOW" | "MEDIUM" | "HIGH";
      projectId?: string;
      page: number;
      limit: number;
      sortBy: "name" | "createdAt" | "dueDate" | "priority" | "status";
      sortOrder: "asc" | "desc";
    };

    const where = {
      userId: req.userId!,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(projectId ? { projectId } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.task.count({ where }),
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
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: { select: { id: true, name: true } } },
    });

    if (!task || task.userId !== req.userId) {
      throw ApiError.notFound("Task not found");
    }

    res.status(200).json({ data: task });
  })
);

router.post(
  "/",
  validateBody(createTaskSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const project = await prisma.project.findUnique({ where: { id: req.body.projectId } });
    if (!project || project.userId !== req.userId) {
      throw ApiError.badRequest("Invalid projectId");
    }

    const task = await prisma.task.create({
      data: { ...req.body, userId: req.userId! },
    });

    res.status(201).json({ data: task });
  })
);

router.put(
  "/:id",
  validateParams(idParamSchema),
  validateBody(updateTaskSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      throw ApiError.notFound("Task not found");
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.status(200).json({ data: task });
  })
);

router.delete(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      throw ApiError.notFound("Task not found");
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    res.status(204).send();
  })
);

export default router;
