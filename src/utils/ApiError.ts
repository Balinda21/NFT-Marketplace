class ApiError extends Error {
  statusCode: number;
  errorCode: string;
  isOperational: boolean;

  constructor(statusCode: number, message: string | undefined, errorCode: string, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
