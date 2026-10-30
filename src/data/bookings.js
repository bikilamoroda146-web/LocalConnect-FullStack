// status: pending | confirmed | completed | cancelled | rejected
export const seedBookings = [
  { id: 'BK-1001', serviceId: 's1', providerId: 'p1', customerId: 'u-c1', date: '2026-11-03', time: '10:00', status: 'confirmed', note: 'Kitchen sink leaks under the cabinet.', created: '2026-10-20' },
  { id: 'BK-1002', serviceId: 's11', providerId: 'p6', customerId: 'u-c1', date: '2026-11-08', time: '14:00', status: 'pending', note: 'Two bedroom doors need adjusting.', created: '2026-10-23' },
  { id: 'BK-1003', serviceId: 's5', providerId: 'p3', customerId: 'u-c1', date: '2026-09-14', time: '09:00', status: 'completed', note: '', created: '2026-09-05' },
  { id: 'BK-1004', serviceId: 's7', providerId: 'p4', customerId: 'u-c1', date: '2026-08-02', time: '16:00', status: 'cancelled', note: 'Laptop will not charge.', created: '2026-07-28' },
  { id: 'BK-1005', serviceId: 's2', providerId: 'p1', customerId: 'u-c2', date: '2026-11-05', time: '11:00', status: 'pending', note: 'Replace old geyser.', created: '2026-10-24' },
  { id: 'BK-1006', serviceId: 's1', providerId: 'p1', customerId: 'u-c4', date: '2026-10-28', time: '15:00', status: 'confirmed', note: 'Bathroom tap dripping.', created: '2026-10-18' },
  { id: 'BK-1007', serviceId: 's1', providerId: 'p1', customerId: 'u-c5', date: '2026-10-02', time: '09:00', status: 'completed', note: '', created: '2026-09-25' },
  { id: 'BK-1008', serviceId: 's3', providerId: 'p2', customerId: 'u-c2', date: '2026-11-12', time: '13:00', status: 'confirmed', note: '', created: '2026-10-21' },
  { id: 'BK-1009', serviceId: 's9', providerId: 'p5', customerId: 'u-c4', date: '2026-10-30', time: '17:00', status: 'pending', note: 'Grade 10 algebra.', created: '2026-10-22' },
  { id: 'BK-1010', serviceId: 's15', providerId: 'p8', customerId: 'u-c5', date: '2026-09-20', time: '08:00', status: 'completed', note: '', created: '2026-09-10' },
  { id: 'BK-1011', serviceId: 's13', providerId: 'p7', customerId: 'u-c3', date: '2026-10-10', time: '10:00', status: 'rejected', note: '', created: '2026-10-03' },
]
