const AppError = require('../utils/AppError');

/**
 * 404 Route Not Found Middleware
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot find ${req.method} ${req.originalUrl} on this server`, 404));
};

/**
 * Normalizes MongoDB / Mongoose specific errors into user-friendly AppErrors
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `A record with ${field} '${value}' already exists. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400, errors);
};

const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

/**
 * Development error payload (verbose for debugging)
 */
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    details: err.details || null,
    stack: err.stack,
  });
};

/**
 * Production error payload (sanitized to prevent security leaks)
 */
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      details: err.details || null,
    });
  }

  // Programming or unknown error: don't leak details to client
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'An unexpected internal server error occurred. Please try again later.',
  });
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const env = process.env.NODE_ENV || 'development';
  const statusCode = Number.isInteger(err.statusCode)
    ? err.statusCode
    : Number.isInteger(err.status)
      ? err.status
      : 500;
  let error = Object.assign(Object.create(err), err);
  error.statusCode = statusCode;
  error.status = err.status || (`${statusCode}`.startsWith('4') ? 'fail' : 'error');

  if (err.type === 'entity.parse.failed') {
    error = new AppError('Invalid JSON request body', 400);
  } else if (err.type === 'entity.too.large') {
    error = new AppError('Request body is too large', 413);
  } else if (err.name === 'CastError') {
    error = handleCastErrorDB(err);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsDB(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationErrorDB(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  } else if (statusCode < 500 && !err.isOperational) {
    error = new AppError(err.message, statusCode);
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: error.statusCode >= 500 ? 'error' : 'warn',
    event: 'http_error',
    method: req.method,
    path: req.path,
    statusCode: error.statusCode,
    error: error.name,
    ...(error.statusCode >= 500 && { message: error.message }),
  };
  console[error.statusCode >= 500 ? 'error' : 'warn'](JSON.stringify(logEntry));

  if (env === 'development' || env === 'test') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
