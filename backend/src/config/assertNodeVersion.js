// Imported first by the entry points so a too-old Node.js gives a clear message
// instead of a confusing crash later.
// Why 22.18+? Prisma 7's generated client is TypeScript, and Node runs .ts files
// natively (no extra flags) from 22.18.0 onward and in Node 24.
const [major, minor] = process.versions.node.split('.').map(Number)
const supported = major >= 24 || (major === 22 && minor >= 18)

if (!supported) {
  console.error(
    `\nLocalConnect backend needs Node.js 22.18 or newer (Node 24 LTS recommended).\n` +
      `You are running Node.js ${process.versions.node}. Install a newer version from https://nodejs.org and try again.\n`,
  )
  process.exit(1)
}
