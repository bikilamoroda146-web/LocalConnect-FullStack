# LocalConnect (frontend demo)

React + Vite + Tailwind CSS 3 + React Router + Lucide. No backend.

    npm install
    npm run dev      # development
    npm run build    # production build

## Demo accounts
customer@demo.test, provider@demo.test, admin@demo.test. Any password of 6+ characters works.

## Important limitations
- Sign-in is simulated. Only a user id is stored in localStorage; passwords are validated and discarded.
- Role guards are a UI convenience, not security. Real authentication and authorization need a backend.
- All data (bookings, favorites, services, availability) lives in this browser only. Use the browser's site-data
  controls to reset, or call `clearAll()` from `src/utils/storage.js`.
- Provider portfolio details and publish state are saved in this browser. Portfolio cover and project photos are stored as image blobs in IndexedDB rather than localStorage; they are not uploaded, synchronized, or private from someone using the same browser profile.
- Admin homepage appearance settings (hero background image up to 5 MB and image position) are stored in IndexedDB in this browser only. They are not uploaded, synchronized, shared with other users, or protected by backend authorization. A bundled fallback illustration is used when no custom hero image is saved.
- Verified badges, reviews and metrics are sample data. Nothing is actually verified.
- Photography is not bundled: cards use tinted category illustrations. Pass a `src` to `ServiceArt` / `Avatar` to use real photos.
- Inter loads from Google Fonts; offline it falls back to the system sans-serif.

## Structure
src/app (state + router), components/{common,layout,services,providers,bookings,forms}, pages/{public,auth,customer,provider,admin},
data (mock data), utils (filters, booking transitions, validation, storage).
