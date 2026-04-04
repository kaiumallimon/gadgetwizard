export class HttpError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = "HTTP_ERROR", details?: unknown) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown): HttpError {
  return new HttpError(400, message, "BAD_REQUEST", details);
}

export function unauthorized(message = "Authentication required"): HttpError {
  return new HttpError(401, message, "UNAUTHORIZED");
}

export function forbidden(message = "You do not have access to this resource"): HttpError {
  return new HttpError(403, message, "FORBIDDEN");
}

export function notFound(message = "Resource not found"): HttpError {
  return new HttpError(404, message, "NOT_FOUND");
}

export function conflict(message: string): HttpError {
  return new HttpError(409, message, "CONFLICT");
}
