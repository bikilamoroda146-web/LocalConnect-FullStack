import Button from '../../components/common/Button'
export default function NotFound({ message = 'The page you are looking for does not exist or has moved.' }) {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <p className="text-sm font-semibold text-brand-800">Error 404</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">We can’t find that page</h1>
      <p className="mt-3 max-w-md text-ink-soft">{message}</p>
      <div className="mt-6 flex gap-3"><Button to="/">Go to homepage</Button><Button to="/services" variant="secondary">Browse services</Button></div>
    </div>
  )
}
