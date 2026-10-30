// Illustrative demo data. Verification is only true where explicitly set here.
export const providers = [
  { id: 'p1', userId: 'u-p1', name: 'Hana Bekele', profession: 'Plumber', category: 'plumbing', area: 'Waliso', years: 9, rating: 4.8, reviews: 42, verified: true, hue: 160,
    bio: 'Licensed plumber focused on leak repairs, bathroom fittings and water-heater installs. I explain the problem and the price before I start.', skills: ['Leak repair', 'Pipe fitting', 'Water heaters', 'Drain clearing'] },
  { id: 'p2', userId: 'u-p2', name: 'Samuel Tadesse', profession: 'Electrician', category: 'electrical', area: 'Addis Ababa', years: 12, rating: 4.9, reviews: 67, verified: true, hue: 205,
    bio: 'Residential electrician handling rewiring, lighting layouts and safety inspections for homes and small shops.', skills: ['Rewiring', 'Lighting', 'Fuse boards', 'Safety checks'] },
  { id: 'p3', userId: 'u-p3', name: 'Meron Alemu', profession: 'Home Cleaner', category: 'cleaning', area: 'Jimma', years: 6, rating: 4.7, reviews: 58, verified: false, hue: 40,
    bio: 'I run a small two-person cleaning team. We bring our own supplies and work to a written checklist.', skills: ['Deep cleaning', 'Move-out cleans', 'Windows', 'Upholstery'] },
  { id: 'p4', userId: 'u-p4', name: 'Dawit Haile', profession: 'IT Support Specialist', category: 'it-support', area: 'Addis Ababa', years: 8, rating: 4.6, reviews: 31, verified: true, hue: 265,
    bio: 'Laptop and network troubleshooting for households and small businesses. Remote or on-site.', skills: ['Laptop repair', 'Wi-Fi setup', 'Data backup', 'Software install'] },
  { id: 'p5', userId: 'u-p5', name: 'Selam Girma', profession: 'Math & Science Tutor', category: 'tutoring', area: 'Adama', years: 5, rating: 4.9, reviews: 24, verified: false, hue: 330,
    bio: 'University-trained tutor for grades 8–12 and entrance-exam preparation. Lessons are paced to the student.', skills: ['Mathematics', 'Physics', 'Exam prep', 'Study planning'] },
  { id: 'p6', userId: 'u-p6', name: 'Yonas Mekonnen', profession: 'Carpenter & Handyman', category: 'home-repairs', area: 'Waliso', years: 14, rating: 4.7, reviews: 49, verified: true, hue: 25,
    bio: 'Furniture repair, door and window fitting, shelving and general home fixes done carefully.', skills: ['Carpentry', 'Door fitting', 'Shelving', 'Furniture repair'] },
  { id: 'p7', userId: 'u-p7', name: 'Rahel Abebe', profession: 'Hair Stylist', category: 'beauty', area: 'Hawassa', years: 7, rating: 4.8, reviews: 36, verified: false, hue: 350,
    bio: 'Mobile stylist offering braiding, cuts and event styling at your home.', skills: ['Braiding', 'Cuts', 'Event styling', 'Hair treatments'] },
  { id: 'p8', userId: 'u-p8', name: 'Abel Kebede', profession: 'Moving Crew Lead', category: 'moving', area: 'Addis Ababa', years: 10, rating: 4.5, reviews: 28, verified: true, hue: 190,
    bio: 'Small crew with a pickup and a box truck for apartment and office moves in the city.', skills: ['Loading', 'Packing', 'Furniture assembly', 'Local transport'] },
]
export const providerById = (id) => providers.find((p) => p.id === id)
