import { AppError } from '../utils/errors.js'

export const notFound = (req, res, next) => next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found.'))
