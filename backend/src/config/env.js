import { fileURLToPath } from 'node:url'
import path from 'node:path'
import dotenv from 'dotenv'
import { parseEnv } from './parseEnv.js'

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

// Loads backend/.env (or backend/.env.test when NODE_ENV=test) and validates it.
// Real environment variables always win over the file, which is how production hosts inject settings.
export function loadEnv() {
  const file = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
  dotenv.config({ path: path.join(backendRoot, file), quiet: true })
  return parseEnv(process.env)
}

export { EnvValidationError } from './parseEnv.js'
