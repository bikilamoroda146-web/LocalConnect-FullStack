// Mock users. No passwords are stored anywhere; the demo login accepts any password of 6+ characters.
export const seedUsers = [
  { id: 'u-c1', name: 'Liya Tesfaye', email: 'customer@demo.test', role: 'customer', status: 'active', joined: '2026-03-12', phone: '', area: 'Waliso' },
  { id: 'u-p1', name: 'Hana Bekele', email: 'provider@demo.test', role: 'provider', status: 'active', joined: '2026-01-20', phone: '', area: 'Waliso', providerId: 'p1' },
  { id: 'u-a1', name: 'Admin Demo', email: 'admin@demo.test', role: 'admin', status: 'active', joined: '2025-12-01', phone: '', area: 'Addis Ababa' },
  { id: 'u-c2', name: 'Bruk Assefa', email: 'bruk@demo.test', role: 'customer', status: 'active', joined: '2026-04-02', area: 'Jimma' },
  { id: 'u-c3', name: 'Tsion Worku', email: 'tsion@demo.test', role: 'customer', status: 'suspended', joined: '2026-02-18', area: 'Adama' },
  { id: 'u-c4', name: 'Kaleb Desta', email: 'kaleb@demo.test', role: 'customer', status: 'active', joined: '2026-05-09', area: 'Hawassa' },
  { id: 'u-c5', name: 'Eden Mulugeta', email: 'eden@demo.test', role: 'customer', status: 'active', joined: '2026-06-21', area: 'Addis Ababa' },
  { id: 'u-p2', name: 'Samuel Tadesse', email: 'samuel@demo.test', role: 'provider', status: 'active', joined: '2025-11-05', providerId: 'p2' },
  { id: 'u-p3', name: 'Meron Alemu', email: 'meron@demo.test', role: 'provider', status: 'pending', joined: '2026-09-30', providerId: 'p3' },
  { id: 'u-p4', name: 'Dawit Haile', email: 'dawit@demo.test', role: 'provider', status: 'active', joined: '2026-02-11', providerId: 'p4' },
  { id: 'u-p5', name: 'Selam Girma', email: 'selam@demo.test', role: 'provider', status: 'pending', joined: '2026-10-02', providerId: 'p5' },
  { id: 'u-p6', name: 'Yonas Mekonnen', email: 'yonas@demo.test', role: 'provider', status: 'active', joined: '2025-12-14', providerId: 'p6' },
  { id: 'u-p7', name: 'Rahel Abebe', email: 'rahel@demo.test', role: 'provider', status: 'active', joined: '2026-03-03', providerId: 'p7' },
  { id: 'u-p8', name: 'Abel Kebede', email: 'abel@demo.test', role: 'provider', status: 'active', joined: '2026-01-08', providerId: 'p8' },
]
export const dashboardPath = { customer: '/customer/dashboard', provider: '/provider/dashboard', admin: '/admin/dashboard' }
export const profilePath = { customer: '/customer/profile', provider: '/provider/profile' }
