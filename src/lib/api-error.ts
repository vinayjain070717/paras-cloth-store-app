import { NextRequest, NextResponse } from "next/server";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: ErrorCode,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function validationError(message: string, details?: unknown) {
  return new AppError(400, "VALIDATION_ERROR", message, details);
}

export function unauthorizedError(message = "Unauthorized") {
  return new AppError(401, "UNAUTHORIZED", message);
}

export function notFoundError(message = "Not found") {
  return new AppError(404, "NOT_FOUND", message);
}

export function rateLimitedError(retryAfterSeconds: number) {
  return new AppError(
    429,
    "RATE_LIMITED",
    `Too many requests. Try again in ${Math.ceil(retryAfterSeconds)} seconds.`,
    { retryAfter: retryAfterSeconds }
  );
}

export function conflictError(message: string) {
  return new AppError(409, "CONFLICT", message);
}

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      if (error instanceof AppError) {
        const response = NextResponse.json(
          {
            error: error.message,
            code: error.code,
            ...(error.details ? { details: error.details } : {}),
          },
          { status: error.statusCode }
        );

        if (error.code === "RATE_LIMITED" && error.details) {
          const details = error.details as { retryAfter?: number };
          if (details.retryAfter) {
            response.headers.set("Retry-After", String(Math.ceil(details.retryAfter)));
          }
        }

        return response;
      }

      if (error && typeof error === "object" && "errors" in error && Array.isArray((error as { errors: unknown[] }).errors) && error.constructor?.name === "ZodError") {
        const zodErr = error as { errors: Array<{ path: (string | number)[]; message: string }> };
        const fieldErrors = zodErr.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        return NextResponse.json(
          {
            error: "Validation failed",
            code: "VALIDATION_ERROR",
            details: fieldErrors,
          },
          { status: 400 }
        );
      }

      console.error("Unhandled API error:", error);
      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}
