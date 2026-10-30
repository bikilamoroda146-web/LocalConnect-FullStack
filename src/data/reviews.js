// Clearly illustrative demo reviews (not real customers).
export const seedReviews = [
  { id: 'r1', providerId: 'p1', author: 'Demo reviewer A', rating: 5, date: '2026-09-02', text: 'Explained the cause of the leak first and finished within the quoted price.' },
  { id: 'r2', providerId: 'p1', author: 'Demo reviewer B', rating: 5, date: '2026-08-11', text: 'Arrived on time and left the bathroom clean.' },
  { id: 'r3', providerId: 'p2', author: 'Demo reviewer C', rating: 5, date: '2026-09-18', text: 'Thorough assessment and a clear written list of what to fix first.' },
  { id: 'r4', providerId: 'p3', author: 'Demo reviewer D', rating: 4, date: '2026-09-15', text: 'Great result overall; one window needed a second pass.' },
  { id: 'r5', providerId: 'p4', author: 'Demo reviewer E', rating: 5, date: '2026-07-29', text: 'Saved my files and the laptop runs much faster.' },
  { id: 'r6', providerId: 'p5', author: 'Demo reviewer F', rating: 5, date: '2026-08-30', text: 'Patient with my daughter and gave useful practice sets.' },
  { id: 'r7', providerId: 'p6', author: 'Demo reviewer G', rating: 4, date: '2026-09-05', text: 'Careful work on the doors. Quote matched the final price.' },
  { id: 'r8', providerId: 'p7', author: 'Demo reviewer H', rating: 5, date: '2026-10-01', text: 'Relaxed session and the style held up well.' },
  { id: 'r9', providerId: 'p8', author: 'Demo reviewer I', rating: 4, date: '2026-09-21', text: 'Crew protected the furniture and was quick.' },
]
export const seedReports = [
  { id: 'rp1', target: 'Move-out Cleaning (s6)', reason: 'Price in description differs from listed price', status: 'open', date: '2026-10-22' },
  { id: 'rp2', target: 'Provider: Dawit Haile (p4)', reason: 'Reported missed appointment', status: 'open', date: '2026-10-20' },
  { id: 'rp3', target: 'Review r4', reason: 'Possible duplicate review', status: 'resolved', date: '2026-10-09' },
]
export const testimonials = [
  { id: 't1', name: 'Sample customer', note: 'Example text showing how a customer story would appear.', role: 'Illustrative demo testimonial' },
  { id: 't2', name: 'Sample provider', note: 'Example text showing how a provider story would appear.', role: 'Illustrative demo testimonial' },
  { id: 't3', name: 'Sample customer', note: 'Example text showing how a booking story would appear.', role: 'Illustrative demo testimonial' },
]
