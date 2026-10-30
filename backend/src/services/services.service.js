const serviceSelect = {
  id: true,
  providerId: true,
  title: true,
  category: true,
  area: true,
  description: true,
  price: true,
  priceUnit: true,
  includes: true,
  imageKey: true,
  published: true,
  createdAt: true,
  provider: {
    select: {
      id: true,
      profession: true,
      category: true,
      area: true,
      years: true,
      bio: true,
      skills: true,
      verified: true,
      user: { select: { id: true, name: true, avatarKey: true } },
      reviews: { select: { rating: true } },
    },
  },
}

const serviceDetailSelect = {
  id: true,
  providerId: true,
  title: true,
  category: true,
  area: true,
  description: true,
  price: true,
  priceUnit: true,
  includes: true,
  imageKey: true,
  published: true,
  createdAt: true,
  provider: {
    select: {
      id: true,
      profession: true,
      category: true,
      area: true,
      years: true,
      bio: true,
      skills: true,
      verified: true,
      user: { select: { id: true, name: true, avatarKey: true } },
      reviews: { select: { id: true, authorName: true, rating: true, text: true, createdAt: true } },
    },
  },
}

function decimalValue(value) {
  return Number(value.toString())
}

function averageRating(reviews) {
  if (!reviews.length) return null
  return Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2))
}

function relevanceScore(service, query) {
  if (!query) return 0
  const needle = query.toLowerCase()
  const fields = [
    [service.title, 4],
    [service.provider.user.name, 3],
    [service.provider.profession, 2],
    [service.category, 1],
    [service.area, 1],
    [service.description, 1],
  ]
  return fields.reduce((score, [field, weight]) => score + (field.toLowerCase().includes(needle) ? weight : 0), 0)
}

function compareServices(a, b, query, sort) {
  if (sort === 'price-asc') return decimalValue(a.price) - decimalValue(b.price)
  if (sort === 'price-desc') return decimalValue(b.price) - decimalValue(a.price)
  if (sort === 'rating') return (b.averageRating ?? -1) - (a.averageRating ?? -1)
  if (query) return relevanceScore(b, query) - relevanceScore(a, query)
  return b.createdAt.getTime() - a.createdAt.getTime()
}

function toPublicService(service) {
  const reviews = service.provider.reviews
  return {
    id: service.id,
    providerId: service.providerId,
    title: service.title,
    category: service.category,
    area: service.area,
    description: service.description,
    price: service.price.toString(),
    priceUnit: service.priceUnit,
    includes: service.includes,
    imageKey: service.imageKey,
    published: service.published,
    averageRating: averageRating(reviews),
    reviewCount: reviews.length,
    provider: {
      id: service.provider.id,
      userId: service.provider.user.id,
      name: service.provider.user.name,
      avatarKey: service.provider.user.avatarKey,
      profession: service.provider.profession,
      category: service.provider.category,
      area: service.provider.area,
      years: service.provider.years,
      bio: service.provider.bio,
      skills: service.provider.skills,
      verified: service.provider.verified,
    },
  }
}

export async function getServiceById(prisma, id) {
  const service = await prisma.service.findFirst({
    where: {
      id,
      published: true,
      provider: { verified: true, user: { status: 'ACTIVE' } },
    },
    select: serviceDetailSelect,
  })

  if (!service) return null

  return {
    ...toPublicService(service),
    reviews: service.provider.reviews.map((review) => ({
      id: review.id,
      author: review.authorName || 'LocalConnect user',
      rating: review.rating,
      text: review.text,
      createdAt: review.createdAt,
    })),
  }
}

export async function createService(prisma, providerId, input) {
  const service = await prisma.service.create({
    data: {
      providerId,
      title: input.title,
      category: input.category,
      area: input.area,
      description: input.description,
      price: input.price,
      priceUnit: input.priceUnit,
      includes: input.includes,
      imageKey: input.imageKey || null,
      published: input.published,
    },
    select: serviceSelect,
  })
  return toPublicService({ ...service, averageRating: averageRating(service.provider.reviews) })
}

export async function listServices(prisma, query) {
  const where = {
    published: true,
    provider: { verified: true, user: { status: 'ACTIVE' } },
    ...(query.category ? { category: { equals: query.category, mode: 'insensitive' } } : {}),
    ...(query.location ? { area: { equals: query.location, mode: 'insensitive' } } : {}),
    ...(query.min !== undefined || query.max !== undefined
      ? { price: { ...(query.min !== undefined ? { gte: query.min } : {}), ...(query.max !== undefined ? { lte: query.max } : {}) } }
      : {}),
    ...(query.q
      ? {
          OR: [
            { title: { contains: query.q, mode: 'insensitive' } },
            { description: { contains: query.q, mode: 'insensitive' } },
            { category: { contains: query.q, mode: 'insensitive' } },
            { area: { contains: query.q, mode: 'insensitive' } },
            { provider: { profession: { contains: query.q, mode: 'insensitive' } } },
            { provider: { user: { name: { contains: query.q, mode: 'insensitive' } } } },
          ],
        }
      : {}),
  }

  const rows = await prisma.service.findMany({ where, select: serviceSelect })
  const services = rows.map((row) => ({ ...row, averageRating: averageRating(row.provider.reviews) }))
    .filter((service) => query.rating === undefined || (service.averageRating !== null && service.averageRating >= query.rating))
    .sort((a, b) => compareServices(a, b, query.q, query.sort))

  const total = services.length
  const start = (query.page - 1) * query.pageSize
  const data = services.slice(start, start + query.pageSize).map(toPublicService)
  return {
    data,
    meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) },
  }
}
