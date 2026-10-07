import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth, type AuthRequest } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const userId = req.userId!;

    const [totalProjects, projectsInProgress, totalTasks, completedTasks, pendingTasks, recentProjects, recentTasks] =
      await Promise.all([
        prisma.project.count({ where: { userId } }),
        prisma.project.count({ where: { userId, status: "IN_PROGRESS" } }),
        prisma.task.count({ where: { userId } }),
        prisma.task.count({ where: { userId, status: "COMPLETED" } }),
        prisma.task.count({ where: { userId, status: "PENDING" } }),
        prisma.project.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
        prisma.task.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { project: { select: { id: true, name: true } } },
        }),
      ]);

    res.status(200).json({
      data: {
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        projectsInProgress,
        recentProjects,
        recentTasks,
      },
    });
  })
);

export default router;
