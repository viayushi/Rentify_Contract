// Demo data for frontend-only testing

export const demoUsers = [
  {
    id: 'u1',
    name: 'Alice Buyer',
    email: 'alice@example.com',
    role: 'buyer',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg'
  },
  {
    id: 'u2',
    name: 'Bob Seller',
    email: 'bob@example.com',
    role: 'seller',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg'
  }
];

export const demoProperties = [
  {
    id: 'p1',
    title: 'Cozy Apartment',
    description: 'A nice and cozy apartment in the city center.',
    address: '123 Main St',
    city: 'Metropolis',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    price: 1200,
    bedrooms: 2,
    bathrooms: 2,
    area: 900,
    images: [
      'https://placehold.co/600x400',
      'https://placehold.co/600x400?text=Second+Image'
    ],
    sellerId: 'u2',
    verified: true,
    status: 'available',
    amenities: ['WiFi', 'Parking', 'Balcony']
  },
  {
    id: 'p2',
    title: 'Spacious Villa',
    description: 'A luxurious villa with a private pool.',
    address: '456 Lakeview Dr',
    city: 'Springfield',
    state: 'CA',
    zipCode: '90001',
    country: 'USA',
    price: 250000,
    bedrooms: 4,
    bathrooms: 4,
    area: 3500,
    images: [
      'https://placehold.co/600x400?text=Villa'
    ],
    sellerId: 'u2',
    verified: false,
    status: 'available',
    amenities: ['Pool', 'Garden', 'Parking']
  }
];

export const demoMessages = [
  {
    id: 'm1',
    propertyId: 'p1',
    senderId: 'u1',
    receiverId: 'u2',
    content: 'Hi, is this apartment still available?',
    timestamp: '2024-06-01T10:00:00Z'
  },
  {
    id: 'm2',
    propertyId: 'p1',
    senderId: 'u2',
    receiverId: 'u1',
    content: 'Yes, it is! Would you like to schedule a visit?',
    timestamp: '2024-06-01T10:05:00Z'
  }
];

export const demoAgreements = [
  {
    id: 'a1',
    propertyId: 'p1',
    buyerId: 'u1',
    sellerId: 'u2',
    agreementUrl: 'https://res.cloudinary.com/demo/image/upload/v1690000003/sample_agreement.pdf',
    status: 'signed',
    createdAt: '2024-06-01T12:00:00Z'
  }
]; 