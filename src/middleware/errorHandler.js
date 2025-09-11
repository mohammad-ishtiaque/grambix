// middlewares/errorMiddleware.js
const { ApiError } = require("../errors/errorHandler");
const logger = require("../utils/logger");



const errorMiddleware = (err, req, res, next) => {
  // If it's not an ApiError, wrap it
  if (!(err instanceof ApiError)) {
    logger.error(err); // Log unexpected errors
    err = new ApiError(err.message || "Internal Server Error", err.statusCode || 500);
  }

  const { statusCode, message } = err;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // Show stack trace only in dev
  });
};

module.exports = errorMiddleware;
