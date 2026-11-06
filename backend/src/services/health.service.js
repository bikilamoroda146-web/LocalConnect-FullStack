export async function isDatabaseUp(prisma, timeoutMs = 3000) {
  let timer

  try {
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error('Database health check timed out'))
      }, timeoutMs)
    })

    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      timeout,
    ])

    return true
  } catch (error) {
    console.error('[DATABASE HEALTH CHECK ERROR]', {
      name: error?.name,
      code: error?.code,
      message: error?.message,
      cause: error?.cause?.message,
      meta: error?.meta,
    })

    return false
  } finally {
    clearTimeout(timer)
  }
}