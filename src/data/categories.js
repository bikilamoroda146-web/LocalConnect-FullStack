import { Hammer, SprayCan, Laptop, GraduationCap, Droplets, Zap, Scissors, Truck } from 'lucide-react'

export const categories = [
  { id: 'home-repairs', name: 'Home Repairs', icon: Hammer, blurb: 'Fixes, fittings and small renovations' },
  { id: 'cleaning', name: 'Cleaning', icon: SprayCan, blurb: 'Homes, offices and move-out cleans' },
  { id: 'it-support', name: 'Computer & IT Support', icon: Laptop, blurb: 'Repairs, setup and troubleshooting' },
  { id: 'tutoring', name: 'Tutoring', icon: GraduationCap, blurb: 'Subject help for school and university' },
  { id: 'plumbing', name: 'Plumbing', icon: Droplets, blurb: 'Leaks, installs and drain work' },
  { id: 'electrical', name: 'Electrical Services', icon: Zap, blurb: 'Wiring, lighting and safety checks' },
  { id: 'beauty', name: 'Beauty & Personal Care', icon: Scissors, blurb: 'Hair, nails and grooming at home' },
  { id: 'moving', name: 'Moving Services', icon: Truck, blurb: 'Loading, transport and unpacking' },
]
export const categoryById = (id) => categories.find((c) => c.id === id)
export const locations = ['Waliso', 'Addis Ababa', 'Jimma', 'Adama', 'Hawassa']
