import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("[ERROR]", err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal server error",
    ...(err.errors ? { errors: err.errors } : {}),
  });
}

export function badRequest(message: string, errors?: any) {
  const err: any = new Error(message);
  err.status = 400;
  if (errors) err.errors = errors;
  return err;
}

export function notFound(message: string) {
  const err: any = new Error(message);
  err.status = 404;
  return err;
}

export function conflict(message: string) {
  const err: any = new Error(message);
  err.status = 409;
  return err;
}
