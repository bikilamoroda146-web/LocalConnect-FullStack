import { initials } from '../../utils/format'
// Initials avatar: swap for a real photo by passing `src`.
export default function Avatar({ name, hue = 160, size = 48, src }) {
  if (src) return <img src={src} alt={name} width={size} height={size} className="rounded-full object-cover" />
  return (
    <span role="img" aria-label={name} style={{ width: size, height: size, background: `hsl(${hue} 40% 92%)`, color: `hsl(${hue} 55% 22%)`, fontSize: size * 0.36 }}
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold">{initials(name)}</span>
  )
}
