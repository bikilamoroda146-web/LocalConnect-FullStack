// An error we throw on purpose, with a safe message for the client.
export class AppError extends Error {
  constructor(status, code, message) {
    super(message)
    this.name = 'AppError'
    this.status = status
    this.code = code
  }
}
