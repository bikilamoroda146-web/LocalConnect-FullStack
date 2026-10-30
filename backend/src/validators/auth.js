import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(200),
  role: z.enum(['CUSTOMER', 'PROVIDER']).default('CUSTOMER'),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(200),
})
