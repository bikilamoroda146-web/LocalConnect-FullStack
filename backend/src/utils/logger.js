// Tiny logger. Rule: never pass passwords, tokens, cookies or connection strings to it.
const write = (level, message, meta) => {
  if (process.env.NODE_ENV === 'test') return // keep test output quiet
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${message}`
  const out = level === 'error' || level === 'warn' ? console.error : console.log
  meta === undefined ? out(line) : out(line, meta)
}
export const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
}
