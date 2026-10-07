import { PrismaClient, ProjectStatus, TaskPriority, TaskStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Safe, synthetic demo data only. No real personal information.
 */
async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const alice = await prisma.user.upsert({
    where: { email: "alice@example.com" },
    update: {},
    create: {
      fullName: "Alice Johnson",
      email: "alice@example.com",
      passwordHash,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    update: {},
    create: {
      fullName: "Bob Smith",
      email: "bob@example.com",
      passwordHash,
    },
  });

  const aliceProject = await prisma.project.create({
    data: {
      userId: alice.id,
      name: "Website Redesign",
      description: "Revamp the marketing website with a new design system.",
      status: ProjectStatus.IN_PROGRESS,
      startDate: new Date("2026-01-05"),
      endDate: new Date("2026-03-01"),
    },
  });

  const aliceProject2 = await prisma.project.create({
    data: {
      userId: alice.id,
      name: "Mobile App Launch",
      description: "Ship v1 of the companion mobile app.",
      status: ProjectStatus.NOT_STARTED,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-06-01"),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: aliceProject.id,
        userId: alice.id,
        name: "Design homepage mockup",
        description: "Create high-fidelity mockup in Figma.",
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        dueDate: new Date("2026-01-15"),
      },
      {
        projectId: aliceProject.id,
        userId: alice.id,
        name: "Implement responsive navbar",
        description: "Build nav component with mobile menu.",
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date("2026-01-25"),
      },
      {
        projectId: aliceProject.id,
        userId: alice.id,
        name: "Set up analytics",
        description: "Integrate privacy-friendly analytics.",
        priority: TaskPriority.LOW,
        status: TaskStatus.PENDING,
        dueDate: new Date("2026-02-10"),
      },
      {
        projectId: aliceProject2.id,
        userId: alice.id,
        name: "Define app navigation structure",
        description: "Plan the screens and navigation flow.",
        priority: TaskPriority.HIGH,
        status: TaskStatus.PENDING,
        dueDate: new Date("2026-02-15"),
      },
    ],
  });

  const bobProject = await prisma.project.create({
    data: {
      userId: bob.id,
      name: "Internal Tooling",
      description: "Build internal admin dashboard.",
      status: ProjectStatus.NOT_STARTED,
      startDate: new Date("2026-01-10"),
      endDate: new Date("2026-04-01"),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        projectId: bobProject.id,
        userId: bob.id,
        name: "Scaffold admin routes",
        description: "Set up Express routes for admin panel.",
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date("2026-01-20"),
      },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo accounts (password: Password123!):");
  console.log("  alice@example.com");
  console.log("  bob@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
