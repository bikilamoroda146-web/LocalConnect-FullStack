import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import ProfileAvatar from '../common/ProfileAvatar'
import Rating from '../common/Rating'
import { VerificationBadge } from '../common/Badges'
import FavoriteButton from '../common/FavoriteButton'
import Button from '../common/Button'
import { categoryById } from '../../data/categories'
import { priceLabel } from '../../utils/format'
import { useApp } from '../../app/AppContext'

export default function ProviderCard({ provider, showVerification = true }) {
  const { services } = useApp()
  const own = services.filter((s) => s.providerId === provider.id && s.published)
  const lowest = own.sort((a, b) => a.price - b.price)[0]
  return (
    <article className="card flex flex-col p-5 transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProfileAvatar userId={provider.userId} name={provider.name} hue={provider.hue} size={56} />
          <div>
            <h3 className="font-semibold leading-tight">{provider.name}</h3>
            <p className="text-sm text-ink-soft">{provider.profession}</p>
          </div>
        </div>
        <FavoriteButton id={provider.id} label={provider.name} />
      </div>
      <dl className="mt-4 space-y-1.5 text-sm text-ink-soft">
        <div className="flex items-center gap-2"><dt className="sr-only">Category</dt><dd>{categoryById(provider.category)?.name}</dd></div>
        <div className="flex items-center gap-1.5"><MapPin size={14} aria-hidden="true" /><dt className="sr-only">Service area</dt><dd>{provider.area}</dd></div>
      </dl>
      <div className="mt-3 flex items-center justify-between gap-2"><Rating value={provider.rating} count={provider.reviews} />{showVerification && <VerificationBadge verified={provider.verified} />}</div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm"><span className="text-ink-muted">{lowest ? '' : 'No services yet'}</span>{lowest && <span className="font-semibold">{priceLabel(lowest)}</span>}</p>
        <Button to={`/providers/${provider.id}`} variant="secondary" size="sm">View Profile</Button>
      </div>
    </article>
  )
}
