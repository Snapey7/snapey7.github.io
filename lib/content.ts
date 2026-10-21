export const assetManifest = [
  {
    id: 'hero-night-water',
    source: '/Users/hs/Downloads/hero.png',
    use: 'Homepage hero: nocturnal jungle water, model center-right, fire bowl right.',
    path: '/assets/hero.png',
  },
  {
    id: 'editorial-grid',
    source: 'Reference mockup Image #2',
    use: 'Temporary editorial cover crops until individual photography is supplied.',
    path: '/assets/editorial-*.png',
  },
  {
    id: 'membership-backgrounds',
    source: 'Reference mockup Image #3',
    use: 'Atmospheric card interiors for IMPURA and STANDARD membership invitations.',
    path: '/assets/membership-*.png',
  },
  {
    id: 'conservation-night-beach',
    source: '/Users/hs/Downloads/section 4 background.png.png',
    use: 'Impact section background: moonlit turtle beach and conservation firelight.',
    path: '/assets/section-4-background.png',
  },
  {
    id: 'section-2-background',
    source: '/Users/hs/Downloads/section 2 background.png',
    use: 'Featured editorials background: black palm texture.',
    path: '/assets/section-2-background.png',
  },
  {
    id: 'section-3-background',
    source: '/Users/hs/Downloads/section 3 background.png.png',
    use: 'Membership background: dark tropical wall with fire bowl.',
    path: '/assets/section-3-background.png',
  },
  {
    id: 'impura-vida-logo',
    source: '/Users/hs/Downloads/impuravidalogo.png',
    use: 'Primary brand mark in navigation and brand-led sections.',
    path: '/assets/impura-vida-logo.png',
  },
] as const;

export const navItems = [
  { label: 'EDITORIALS', href: '/editorials' },
  { label: 'MEMBERS', href: '/members' },
  { label: 'DESTINATIONS', href: '/destinations' },
  { label: 'MUSE', href: '/models' },
  { label: 'ABOUT', href: '/about' },
  { label: 'SHOP', href: '/shop' },
] as const;

export const editorials = [
  {
    slug: 'the-haven',
    title: 'THE HAVEN',
    image: '/assets/editorial-the-haven.png',
    location: 'Santa Teresa',
    model: 'Valeria Sol',
    photographer: 'Matteo Cruz',
    date: 'September 2026',
    intro:
      'A private jungle hideaway where candlelight, salt air, and late-night water shape the first chapter of the season.',
    locked: true,
  },
  {
    slug: 'monica-riviera',
    title: 'MONICA RIVIERA',
    image: '/assets/editorial-monica-riviera.png',
    location: 'Nosara',
    model: 'Monica Riviera',
    photographer: 'Isla Monroe',
    date: 'August 2026',
    intro:
      'Warm interiors, rain-heavy windows, and a muse caught between ceremony and escape.',
    locked: true,
  },
  {
    slug: 'coastal-escape-pt-2',
    title: 'COASTAL ESCAPE PT. 2',
    image: '/assets/editorial-coastal-escape.png',
    location: 'Mal Pais',
    model: 'The Coast Muses',
    photographer: 'Rafael Stone',
    date: 'August 2026',
    intro:
      'The second movement of a coastal story told through linen sheets, night breeze, and slow tropical light.',
    locked: true,
  },
  {
    slug: 'golden-horizons-pt-1',
    title: 'GOLDEN HORIZONS PT. 1',
    image: '/assets/editorial-golden-horizons.png',
    location: 'Guanacaste',
    model: 'Lucia Mar',
    photographer: 'Camille Reyes',
    date: 'July 2026',
    intro:
      'A sunset field note from Costa Rica’s dry coast, edited like a private postcard.',
    locked: true,
  },
  {
    slug: 'alexis-noir',
    title: 'ALEXIS NOIR',
    image: '/assets/editorial-alexis-noir.png',
    location: 'Uvita',
    model: 'Alexis Noir',
    photographer: 'Nico Vale',
    date: 'July 2026',
    intro:
      'Deep foliage, wet skin, and the intimate quiet that arrives before the storm.',
    locked: true,
  },
  {
    slug: 'willow',
    title: 'WILLOW',
    image: '/assets/editorial-willow.png',
    location: 'Dominical',
    model: 'Willow',
    photographer: 'Sofia Lune',
    date: 'June 2026',
    intro:
      'An earth-toned portrait study in shadow, texture, and restrained tropical heat.',
    locked: true,
  },
  {
    slug: 'the-sanctuary',
    title: 'THE SANCTUARY',
    image: '/assets/editorial-sanctuary.png',
    location: 'Arenal',
    model: 'Casa Muses',
    photographer: 'Adrian Hale',
    date: 'June 2026',
    intro:
      'Volcanic stone, still water, and the ritual atmosphere of a hidden refuge.',
    locked: true,
  },
  {
    slug: 'isabella',
    title: 'ISABELLA',
    image: '/assets/editorial-isabella.png',
    location: 'Papagayo',
    model: 'Isabella',
    photographer: 'Mara Voss',
    date: 'May 2026',
    intro:
      'A high-sun silhouette translated into leather, palms, and after-dark confidence.',
    locked: true,
  },
] as const;

export const models = [
  {
    slug: 'monica-riviera',
    name: 'Monica Riviera',
    image: '/assets/editorial-monica-riviera.png',
    location: 'Nosara, Costa Rica',
    bio: 'Monica brings a cinematic stillness to humid interiors and late-night coastal stories.',
  },
  {
    slug: 'alexis-noir',
    name: 'Alexis Noir',
    image: '/assets/editorial-alexis-noir.png',
    location: 'Uvita, Costa Rica',
    bio: 'A jungle muse whose editorials lean into shadow, strength, and quiet sensuality.',
  },
  {
    slug: 'isabella',
    name: 'Isabella',
    image: '/assets/editorial-isabella.png',
    location: 'Papagayo, Costa Rica',
    bio: 'A bold, sun-warmed presence shaped by resort architecture and coastal evenings.',
  },
] as const;

export const membershipTiers = [
  {
    name: 'IMPURA',
    badge: 'MOST POPULAR',
    image: '/assets/editorial-monica-riviera.png',
    benefits: [
      'Access to Impura Vida Magazine',
      'Access to Behind the Scenes',
      'Access to Interviews',
      'Extended photo releases',
      'Exclusive Videos',
    ],
    price: '29.99 / MONTH',
    featured: true,
  },
  {
    name: 'STANDARD',
    badge: null,
    image: '/assets/editorial-coastal-escape.png',
    benefits: ['Access to Impura Vida Magazine issues'],
    price: '14.99 / MONTH',
    featured: false,
  },
] as const;

export const impactStats = [
  { value: '1,247', label: 'HATCHLINGS PROTECTED', icon: 'turtle' },
  { value: '14', label: 'NESTING BEACHES SUPPORTED', icon: 'palm' },
  { value: '8,400', label: 'CONTRIBUTED TO CONSERVATION', icon: 'wave', prefix: '$' },
  { value: '100%', label: 'COSTA RICA FOCUSED', icon: 'leaf' },
] as const;
