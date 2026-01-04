import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, RequestHandler, NextFunction } from 'express';
import { ValidationException } from '../exceptions/ValidationExceptions';

/**
 * Recursively extracts error messages from ValidationError objects.
 * @param errors - Errors returned by class-validator.
 * @returns Array of errors.
 */
const extractErrors = (errors: ValidationError[]): string[] => {
  let messages: string[] = [];
  errors.forEach((error) => {
    if (error.children && error.children.length > 0) {
      messages = messages.concat(extractErrors(error.children));
    }
    if (error.constraints) {
      messages = messages.concat(Object.values(error.constraints));
    }
  });
  return messages;
};

/**
 * Returns a function-middleware for DTO validation.
 * @param dtoClass - Class to transform and validate.
 */
export default (dtoClass: new () => object): RequestHandler => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dataToValidate = req.method === 'GET' ? req.query : req.body;
    const dto = plainToInstance(dtoClass, dataToValidate);
    const errors: ValidationError[] = await validate(dto);

    if (errors.length > 0) {
      const messages = extractErrors(errors);
      return next(new ValidationException(messages));
    }
    next();
  };
};
