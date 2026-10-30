import { z } from 'zod'

export const createBookingSchema = z.object({
  serviceId: z.string().trim().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must use YYYY-MM-DD'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'must use HH:mm'),
  note: z.string().trim().max(300).optional().default(''),
})
