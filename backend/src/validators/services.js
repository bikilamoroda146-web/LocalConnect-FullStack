import { z } from 'zod'

export const createServiceSchema = z.object({
  title: z.string().trim().min(4).max(100),
  category: z.string().trim().min(1).max(100),
  description: z.string().trim().min(20).max(1000),
  price: z.coerce.number().finite().positive(),
  priceUnit: z.enum(['per visit', 'per hour', 'per item', 'estimate', 'from']),
  area: z.string().trim().min(1).max(100),
  includes: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
  imageKey: z.string().trim().max(500).nullable().optional(),
  published: z.boolean().default(true),
})
