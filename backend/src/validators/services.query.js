import { z } from 'zod'

const sortValues = ['relevance', 'price-asc', 'price-desc', 'rating']

const optionalDecimal = z.preprocess(
  (value) => (value === undefined || value === '' ? undefined : value),
  z.coerce.number().finite().min(0).optional(),
)

export const servicesQuerySchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
  category: z.string().trim().min(1).max(100).optional(),
  location: z.string().trim().min(1).max(100).optional(),
  min: optionalDecimal,
  max: optionalDecimal,
  rating: z.preprocess(
    (value) => (value === undefined || value === '' ? undefined : value),
    z.coerce.number().finite().min(0).max(5).optional(),
  ),
  sort: z.enum(sortValues).optional().default('relevance'),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(9),
}).superRefine((value, ctx) => {
  if (value.min !== undefined && value.max !== undefined && value.min > value.max) {
    ctx.addIssue({ code: 'custom', path: ['min'], message: 'must not be greater than max' })
  }
})

export function parseServicesQuery(rawQuery) {
  const result = servicesQuerySchema.safeParse(rawQuery)
  if (!result.success) return { success: false, error: result.error }
  return { success: true, data: result.data }
}
