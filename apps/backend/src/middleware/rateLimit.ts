import rateLimit from "express-rate-limit";

export function createAuthRateLimiter(limit = 10) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: "Too many attempts. Please try again later." } },
  });
}

export function createApiRateLimiter(limit = 300) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { message: "Too many requests. Please slow down." } },
  });
}

// Generous limits in automated tests so functional test suites (which make many
// sequential auth calls to set up fixtures) are not rate-limited; the real
// limiter behavior is still exercised directly in tests/security.test.ts.
const isTest = process.env.NODE_ENV === "test";

export const authRateLimiter = createAuthRateLimiter(isTest ? 1000 : 10);
export const apiRateLimiter = createApiRateLimiter(isTest ? 10000 : 300);
