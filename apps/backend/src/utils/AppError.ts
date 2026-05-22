export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, unknown> | Array<unknown> | string | null;

  constructor(
    message: string, 
    statusCode: number, 
    code: string = 'GENERIC_ERROR', 
    details?: Record<string, unknown> | Array<unknown> | string | null
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
