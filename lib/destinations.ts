export const destinationNavItems = [
  { name: 'Costa Rica', href: '/destinations/costa-rica' },
  { name: 'UK', href: '/destinations/london' },
  { name: 'USA', href: '/destinations/usa' },
  { name: 'Spain', href: '/destinations/spain' },
  { name: 'Italy', href: '/destinations/italy' },
  { name: 'France', href: '/destinations/france' },
] as const;

export const destinations = [
  {
    name: 'Santa Teresa',
    image: '/assets/editorial-the-haven.png',
    position: 'center 48%',
  },
  {
    name: 'San Jose',
    image: '/assets/editorial-golden-horizons.png',
    position: 'center',
  },
  {
    name: 'Guanacaste',
    image: '/assets/editorial-isabella.png',
    position: 'center 42%',
  },
  { name: 'La Fortuna', image: '/assets/hero.png', position: 'center 45%' },
  {
    name: 'Limon (Caribbean)',
    image: '/assets/editorial-coastal-escape.png',
    position: 'center 54%',
  },
  {
    name: 'Manuel Antonio',
    image: '/assets/editorial-sanctuary.png',
    position: 'center 45%',
  },
] as const;
