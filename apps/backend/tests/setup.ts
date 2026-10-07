import { config } from "dotenv";
import path from "node:path";
import { execSync } from "node:child_process";
import { beforeAll, afterAll, afterEach } from "vitest";

config({ path: path.resolve(__dirname, "../.env.test"), override: true });

execSync("npx prisma migrate deploy", {
  cwd: path.resolve(__dirname, ".."),
  stdio: "inherit",
  env: process.env,
});

import { prisma } from "../src/lib/prisma";

afterEach(async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
