/**
 * Global error handler — must have 4 params for Express to treat it as an error handler
 */
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500
  const message    = err.message    || 'Internal Server Error'

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${err.stack}`)
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}