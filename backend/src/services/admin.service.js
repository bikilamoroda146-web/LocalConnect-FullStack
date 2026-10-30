const providerProfileSelect = {
  id: true,
  profession: true,
  category: true,
  area: true,
  years: true,
  bio: true,
  skills: true,
  verified: true,
  createdAt: true,
}

export async function listPendingProviders(prisma) {
  const users = await prisma.user.findMany({
    where: { role: 'PROVIDER', status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, email: true, status: true, createdAt: true, providerProfile: { select: providerProfileSelect } },
  })
  return users.map(({ providerProfile, ...user }) => ({
    id: providerProfile?.id ?? user.id,
    profession: providerProfile?.profession ?? 'Service Provider',
    category: providerProfile?.category ?? 'general',
    area: providerProfile?.area ?? 'Not provided',
    years: providerProfile?.years ?? 0,
    bio: providerProfile?.bio ?? '',
    skills: providerProfile?.skills ?? [],
    verified: providerProfile?.verified ?? false,
    createdAt: providerProfile?.createdAt ?? user.createdAt,
    user,
  }))
}

export async function decideProvider(prisma, providerId, decision) {
  let user = await prisma.user.findUnique({ where: { id: providerId }, select: { id: true, name: true, email: true, role: true, status: true, providerProfile: { select: { id: true } } } })
  if (!user) {
    const provider = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { id: true, userId: true } })
    if (provider) user = await prisma.user.findUnique({ where: { id: provider.userId }, select: { id: true, name: true, email: true, role: true, status: true, providerProfile: { select: { id: true } } } })
  }
  if (!user || user.role !== 'PROVIDER' || user.status !== 'PENDING') return { error: 'NOT_PENDING' }

  const approved = decision === 'approve'
  const result = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { status: approved ? 'ACTIVE' : 'SUSPENDED' } })
    if (user.providerProfile) {
      return tx.providerProfile.update({ where: { id: user.providerProfile.id }, data: { verified: approved }, select: providerProfileSelect })
    }
    return tx.providerProfile.create({
      data: { userId: user.id, profession: 'Service Provider', category: 'general', area: 'Not provided', years: 0, bio: '', skills: [], verified: approved },
      select: providerProfileSelect,
    })
  })
  return { provider: { ...result, user: { id: user.id, name: user.name, email: user.email, status: approved ? 'ACTIVE' : 'SUSPENDED' } } }
}
