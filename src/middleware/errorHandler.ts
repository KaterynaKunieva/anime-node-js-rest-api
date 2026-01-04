import { type Request, type Response, type NextFunction } from 'express';
import { ValidationException } from '../exceptions/ValidationExceptions';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import log4js from 'log4js';
import { DuplicateException } from '../exceptions/DuplicateExceptions';

/**
 * Global error handling middleware.
 * Maps specific exceptions to HTTP status codes.
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const logger = log4js.getLogger();

  // Handle known business exceptions
  if (err instanceof ValidationException) {
    res.status(StatusCodes.BAD_REQUEST).json({ errors: err.errors });
  } else if (err instanceof DuplicateException) {
    res.status(StatusCodes.CONFLICT).json({ errors: err.errors });
  }

  // Fallback for unhandled internal errors
  if (!res.headersSent) {
    logger.error(err.stack);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
    });
  }
}
