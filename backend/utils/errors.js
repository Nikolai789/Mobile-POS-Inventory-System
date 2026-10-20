class AppError extends Error {
  /** @param {string} message @param {number} [statusCode] */
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/** @param {unknown} error @param {import('express').Response} res @param {string} fallback @param {boolean} [onlyBadRequest] */
function sendError(error, res, fallback, onlyBadRequest = false) {
  const status = error instanceof AppError ? error.statusCode : 500;
  const expose = error instanceof AppError && (!onlyBadRequest || status === 400);
  return res.status(status).json({ error: expose ? error.message : fallback });
}

/** Preserve the product API's existing database-constraint status mapping. @param {unknown} error */
function productWriteError(error) {
  if (error instanceof AppError) return error;
  const message = error instanceof Error ? error.message : String(error);
  return new AppError(message, message.includes('UNIQUE') ? 409 : 400);
}

module.exports = { AppError, productWriteError, sendError };
