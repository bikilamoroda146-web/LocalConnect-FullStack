// Asks PostgreSQL a trivial question ("SELECT 1") to prove the connection works.
// Gives up after `timeoutMs` so the health endpoint can never hang.
export async function isDatabaseUp(prisma, timeoutMs = 2000) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('database check timed out')), timeoutMs)
  })
  try {
    await Promise.race([prisma.$queryRaw`SELECT 1`, timeout])
    return true
  } catch {
    return false // details are deliberately not exposed to the caller
  } finally {
    clearTimeout(timer)
  }
}
