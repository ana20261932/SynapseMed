export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const Errors = {
  UNAUTHORIZED: () => new AppError('Authentication required', 401, 'UNAUTHORIZED'),
  FORBIDDEN: () => new AppError('Insufficient permissions', 403, 'FORBIDDEN'),
  INVALID_CREDENTIALS: () => new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'),
  TOKEN_EXPIRED: () => new AppError('Token has expired', 401, 'TOKEN_EXPIRED'),
  NOT_FOUND: (resource: string) => new AppError(`${resource} not found`, 404, 'NOT_FOUND'),
  CONFLICT: (message: string) => new AppError(message, 409, 'CONFLICT'),
  VALIDATION: (details: Record<string, string[]>) =>
    new AppError('Validation failed', 422, 'VALIDATION_ERROR', details),
  MODULE_DISABLED: (module: string) =>
    new AppError(`Module '${module}' is not enabled for this practice`, 403, 'MODULE_DISABLED'),
  SUBSCRIPTION_INACTIVE: () =>
    new AppError('Practice subscription is inactive', 403, 'SUBSCRIPTION_INACTIVE'),
  SWITCH_NOT_CONNECTED: () =>
    new AppError('Switch provider is not connected or inactive', 403, 'SWITCH_NOT_CONNECTED'),
  REAL_CLAIMS_DISABLED: () =>
    new AppError(
      'Real claim submission is disabled. Only mock/simulated transactions are permitted in this environment.',
      403,
      'REAL_CLAIMS_DISABLED',
    ),
};
