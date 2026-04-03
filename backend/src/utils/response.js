/**
 * Send a standardised success response
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 */
export const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  const payload = {
    success: true,
    message,
    ...(data !== null && { data }),
  }
  return res.status(statusCode).json(payload)
}

/**
 * Send a standardised error response
 */
export const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const payload = {
    success: false,
    message,
    ...(errors !== null && { errors }),
  }
  return res.status(statusCode).json(payload)
}