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

export type EditorialImage = { id?: string; src: string; alt: string; width?: number; height?: number };

export type Editorial = {
  slug: string;
  title: string;
  image: string;
  location: string;
  model: string;
  cardDescription: string;
  photographer: string;
  date: string;
  intro: string;
  body?: string[];
  gallery?: EditorialImage[];
};

export const editorials: Editorial[] = [
  {
    slug: 'a-private-kind-of-summer',
    title: 'ANA’S LITTLE VICE',
    image: '/assets/editorial-ana-cover.jpg',
    location: 'Miami',
    model: 'Ana',
    cardDescription: 'A spontaneous portrait session above Miami, from neon-lit rooms to the last golden light.',
    photographer: 'Impura Vida',
    date: '',
    body: [
      'Ana and I met in Miami in 2022, and we clicked immediately. There was an ease between us that made picking up a camera feel like a natural continuation of the conversation. She was the kind of muse I dream of working with: expressive, spontaneous, and willing to follow an idea simply to see where it might lead.',
      'We began inside her apartment, experimenting with neon lights in her bedroom and around the house. Moving between rooms, we played with where the colour fell, how it caught her face, and how much of the surroundings we could allow to disappear into shadow. Each setup gave us another direction to explore.',
      'The neon brought its own Miami atmosphere indoors. Colour transformed familiar corners of the apartment, giving the portraits an intimate, cinematic quality. We could change the mood with a shift of the light or a turn of her head. Ana moved easily through those experiments, bringing an expression or a gesture that made me want to keep following the idea.',
      'That freedom gave the session its energy. We were discovering the photographs as we made them, letting one frame suggest the next.',
      'Then I noticed the light at the windows.',
      'The sun was lowering over the Magic City, sending a golden shimmer into the apartment. After working with the neon, I was drawn to the warmth spreading through the room. As it reached further inside, the shadows seemed to deepen around it. It was the contrast I’m always looking for: warmth with somewhere dark to fall.',
      'I positioned Ana near the corner of her bedroom window, where the light caught her face and traced her body against the shaded interior. Small changes in her position changed the photograph completely. A turn towards the window brought her eyes into the light; a slight movement away let part of her face slip back into shadow.',
      'Her blue eyes held that brightness beautifully. They became the point I kept returning to, surrounded by the warmth of her skin and the depth of the room. There was temptation in her expression, but also an ease that made the portrait feel personal. She gave herself room to move, to feel, to let go into the moment. My part was to recognise when it came together and catch it.',
      'Those are the photographs I love making. You can spend time finding an angle and shaping a composition, then an expression arrives that gives the whole image its reason to exist.',
      'Eventually, we took the session out onto the balcony.',
      'With Miami behind her, the photographs opened up. The intimacy of the bedroom gave way to the scale of the city, and Ana met it with complete assurance. She looked entirely at home above it all. I wanted the skyline to remain present, to give the portraits that unmistakable sense of Miami, while keeping her as the first thing your eye found.',
      'She carried the frame effortlessly. There was a playful confidence to it, the feeling that, for the duration of the photograph, the view belonged to her.',
      'For the final images, I asked her to lie back on the lounger, facing out towards the balcony. The golden light was reaching its richest point. It travelled across her skin and left deep shadows beside it, giving her posture shape and the photographs a languid, sun-warmed glamour.',
      'It felt as though the sun had come to watch her.',
      'There was something of a Victoria’s Secret campaign in those moments: the warmth, the confidence, the ease with which she held the camera’s attention. I kept shooting as the light shifted, following the contrast across her and letting the session find its own ending.',
      'What I remember most is how naturally it all unfolded. The neon gave us permission to experiment; the setting sun gave us something fleeting to follow. Throughout it all, Ana brought the same openness that had made us connect in the first place.',
      'Her own little vice in Miami Vice. An afternoon I’m glad we gave ourselves over to.',
    ],
    intro: 'Ana and I met in Miami in 2022, and we clicked immediately. There was an ease between us that made picking up a camera feel like a natural continuation of the conversation.',
    gallery: [
      { src: '/assets/editorial-ana-cover.jpg', alt: 'Ana on a Miami balcony with the city soft behind her.', width: 5912, height: 5088 },
      { src: '/assets/ana-little-vice-02.jpg', alt: 'Ana in purple neon light inside her apartment.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-03.jpg', alt: 'Ana wearing a wide hat in a magenta-lit room.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-04.jpg', alt: 'Ana beside a window in purple neon light.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-05.jpg', alt: 'A red-lit portrait of Ana in the apartment.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-06.jpg', alt: 'Ana in golden window light with the Miami skyline beyond.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-07.jpg', alt: 'Ana standing at the window as the setting sun fills the room.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-08.jpg', alt: 'Ana in warm evening light with the city beyond the window.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-09.jpg', alt: 'Ana by the balcony window with the evening sky over Miami.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-10.jpg', alt: 'Ana leaning against the balcony frame above the city.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-11.jpg', alt: 'A close portrait of Ana against the balcony railing.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-12.jpg', alt: 'Ana in black with the bright Miami skyline behind her.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-13.jpg', alt: 'Ana looks back over her shoulder from the balcony.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-14.jpg', alt: 'Ana reclining on a white lounger in warm light.', width: 1920, height: 2880 },
      { src: '/assets/ana-little-vice-15.jpg', alt: 'Ana resting on the lounger as evening shadows fall.', width: 1920, height: 2880 },
    ],
  },
  {
    slug: 'manzanillo-part-i-nothing-beyond-the-horizon',
    title: 'NOTHING BEYOND THE HORIZON',
    image: '/assets/lucy-manzanillo-01.jpg',
    location: 'Manzanillo',
    model: 'Lucy',
    cardDescription: 'A portrait of Lucy where the jungle meets the Caribbean, and the day opens out.',
    photographer: 'Impura Vida',
    date: '',
    body: [
      'At the edge of Manzanillo, the landscape seems to exhale. Green gives way to shoreline. The sea carries the eye out until there is almost nothing left to follow.',
      'Lucy brings a human scale to that vastness. A glance, a gesture, the small distance between a person and the water. The photographs move between her presence and the place around her, allowing each to draw us towards the other.',
      'Some of the best frames arrived without a fixed plan. We drove along the Costa Rican coast, stopping when the light or the landscape asked us to stay a little longer.',
      'At Playa Hermosa, ocean mist drifted through the sunrays above the jungle and softened the view into something almost magical. Nearby, the waves met the rocks with such force and timing that the shoreline itself became part of the action.',
      'The surfboard shop offered a different kind of composition: boards leaning together in a row, their colour and worn surfaces making a simple, beautiful frame. It was the kind of small discovery that feels especially at home on film, where texture and grain become part of the memory.',
      'There is room here for a picture that does nothing except hold the afternoon: a stretch of coast, leaves meeting the light, the horizon again.',
      'Stay a little longer. There is no next place to be.',
    ],
    intro: 'At the edge of Manzanillo, the landscape seems to exhale. Green gives way to shoreline. The sea carries the eye out until there is almost nothing left to follow.',
    gallery: [
      { src: '/assets/lucy-manzanillo-02.jpg', alt: 'Lucy among the rocks as a wave breaks across the Playa Hermosa shoreline.' },
      { src: '/assets/lucy-manzanillo-03.jpg', alt: 'Lucy beside a row of surfboards at a Costa Rican surf shop.' },
      { src: '/assets/lucy-manzanillo-04.jpg', alt: 'Lucy in a sunlit portrait surrounded by the Costa Rican jungle.' },
    ],
  },
  {
    slug: 'where-the-green-comes-in',
    title: 'WHERE THE GREEN COMES IN',
    image: '/assets/editorial-angie-daya-cover.png',
    location: 'Playa Carmen',
    model: 'Angie and Daya',
    cardDescription: 'A shared afternoon with Angie and Daya.',
    photographer: 'Impura Vida',
    date: '',
    intro:
      'A shared afternoon framed by the deep greens and open light of Playa Carmen.',
  },
  {
    slug: 'the-house-keeps-the-shadows',
    title: 'WHERE THE SHADOWS TAKE US',
    image: '/assets/editorial-cynthia-3v3a9014.jpg',
    location: 'Santa Teresa',
    model: 'Cynthia',
    cardDescription: 'Cynthia, across three shoots. Bamboo, storm light, and the deep greens of Costa Rica.',
    photographer: 'Impura Vida',
    date: '',
    body: [
      'I keep coming back to the point where light falls away. How much of a photograph can disappear into darkness while the person inside it feels completely present? That question has become part of the visual language of Impura Vida, and with Cynthia, I wanted to take it further.',
      'We started inside a bamboo casita. There was something about its rawness that felt right for our first shoot: the warmth of the material, the simple structure, the depth of the shadows behind the balcony. I positioned Cynthia against the railing and began working with angles and focal lengths, looking for a composition that would bring everything down to two tones: amber warmth and an almost uninterrupted black.',
      'From above, the railing gave the frame its geometry. Its lines opened beneath her while the background fell away, leaving the light to describe her face, shoulders, and hands. Her dark hair and black lace slipped back into the shadows. Small details held their brightness: a hoop earring, a chain, the light catching her eyes.',
      'That was the balance I wanted. Enough detail to feel close to her, enough darkness to let the image remain unresolved.',
      'For me, so much of making photographs begins with the people I’m making them with. I love being around someone eager to create, willing to try an idea and give it room to become something else. There is a freedom in that exchange. You can keep moving, keep experimenting, follow something simply because it feels promising. With Cynthia, that freedom carried us into the next shoot.',
      'This time, we wanted to take it outside.',
      'We went down to the beach a few hours before sunset, with blue hour always in mind. I wanted that brief meeting of cool surroundings and warm skin, when the sky still holds colour and the shadows begin to deepen. Along the coast, a Costa Rican storm was giving us something extraordinary to work with. Heavy clouds gathered over the water. The tide was coming in. A tree swept ashore by the high tides became part of the setting, its worn surface giving Cynthia somewhere to sit, stretch out, and move with the frame.',
      'We had an idea of the light we wanted. Reaching it meant being patient.',
      'There is a point when you have to keep looking and trust the time you have given to being there. As the daylight dropped, the balance arrived. The stormy blue behind Cynthia held its depth while the warm light across her body became richer. Sea, sky, skin, and weather came together in the same frame. The contrast was everything I had hoped for.',
      'I love the tension in those photographs. The sea is restless behind her; the light on her feels concentrated and intimate. In the portraits against the tree, her raised arms open the composition towards that immense sky. Warmth travels across her face and skin, then falls sharply into shadow. You can feel how little time there is before the whole balance changes again.',
      'We also worked further into the vegetation at the edge of the beach, letting the jungle surround her. Here, the colour shifted towards deep green, with cooler light finding its way through the palms and branches. Her hair moves across the frame; she looks back over her shoulder, and everything seems to hold together around that glance.',
      'That portrait is one of the most stunning I have taken. I keep returning to it. The depth of the greens, the movement, her expression, the warmth still held in her skin: it brings together so much of what I want to make with Impura Vida. Looking at it, I feel the excitement of being there all over again.',
      'Our last shoot was more playful: Cynthia stretched out beside the pool, and we kept exploring. From above, the pool edge cut diagonally through the photograph, with textured green on one side and dark water on the other. Her pale swimsuit caught the warm light, while the shadows gave weight to the space around her. The position of her arms and the bend of her legs brought a different rhythm to those strong lines.',
      'Across all three shoots, the jungle and those deep contrasts kept drawing us back. We found them in the darkness of the casita, beneath the storm clouds, among the palms, and beside the pool.',
      'What stays with me is the pleasure of making those photographs together. Having an idea, giving it time, and watching Cynthia bring something of her own into it. Then seeing the light arrive, lifting the camera, and knowing why we waited.',
    ],
    intro: 'I keep coming back to the point where light falls away. How much of a photograph can disappear into darkness while the person inside it feels completely present? That question has become part of the visual language of Impura Vida, and with Cynthia, I wanted to take it further.',
    gallery: [
      { src: '/assets/cynthia-story-01.jpg', alt: 'Cynthia standing at the bamboo casita railing in warm light.', width: 1280, height: 1920 },
      { src: '/assets/cynthia-story-02.jpg', alt: 'Warm light catches black lace, jewellery, and the wooden casita railing.', width: 1920, height: 1280 },
      { src: '/assets/cynthia-story-03.jpg', alt: 'Cynthia looks over her shoulder beside the casita railing, her face emerging from shadow.', width: 1280, height: 1920 },
      { src: '/assets/cynthia-story-04.jpg', alt: 'A close detail of Cynthia’s black swimsuit, gold necklace, and tattoos in outdoor light.', width: 1920, height: 1280 },
      { src: '/assets/cynthia-story-05.jpg', alt: 'Cynthia looks over her shoulder among deep green palms at the edge of the beach.', width: 1280, height: 1920 },
      { src: '/assets/cynthia-story-06.jpg', alt: 'Cynthia beneath a palm tree against the cool blue evening sky.', width: 1280, height: 1920 },
      { src: '/assets/cynthia-story-07.jpg', alt: 'Warm evening light falls across Cynthia beside a tree on the shadowed shoreline.', width: 1280, height: 1920 },
      { src: '/assets/cynthia-story-08.jpg', alt: 'Cynthia seated against a tree with the blue sea and stormy evening sky behind her.', width: 1280, height: 1920 },
    ],
  },
  {
    slug: 'the-haven',
    title: 'THE HAVEN',
    image: '/assets/editorial-the-haven.png',
    location: 'Santa Teresa',
    model: 'Valeria Sol',
    cardDescription: 'A candlelit jungle refuge shaped by salt air and still water.',
    photographer: 'Matteo Cruz',
    date: 'September 2026',
    intro:
      'A private jungle hideaway where candlelight, salt air, and late-night water shape the first chapter of the season.',
  },
  {
    slug: 'monica-riviera',
    title: 'MONICA RIVIERA',
    image: '/assets/editorial-monica-riviera.png',
    location: 'Nosara',
    model: 'Monica Riviera',
    cardDescription: 'A muse moves between ceremony and escape in rain-lit interiors.',
    photographer: 'Isla Monroe',
    date: 'August 2026',
    intro:
      'Warm interiors, rain-heavy windows, and a muse caught between ceremony and escape.',
  },
  {
    slug: 'coastal-escape-pt-2',
    title: 'COASTAL ESCAPE PT. 2',
    image: '/assets/editorial-coastal-escape.png',
    location: 'Mal Pais',
    model: 'The Coast Muses',
    cardDescription: 'Linen, night breeze, and slow light shape this coastal story.',
    photographer: 'Rafael Stone',
    date: 'August 2026',
    intro:
      'The second movement of a coastal story told through linen sheets, night breeze, and slow tropical light.',
  },
  {
    slug: 'golden-horizons-pt-1',
    title: 'GOLDEN HORIZONS PT. 1',
    image: '/assets/editorial-golden-horizons.png',
    location: 'Guanacaste',
    model: 'Lucia Mar',
    cardDescription: 'A private postcard from Costa Rica’s sunlit dry coast.',
    photographer: 'Camille Reyes',
    date: 'July 2026',
    intro:
      'A sunset field note from Costa Rica’s dry coast, edited like a private postcard.',
  },
  {
    slug: 'alexis-noir',
    title: 'ALEXIS NOIR',
    image: '/assets/alexis-editorial.jpg',
    location: 'Uvita',
    model: 'Alexis Noir',
    cardDescription: 'An intimate portrait in deep foliage before the storm.',
    photographer: 'Nico Vale',
    date: 'July 2026',
    intro:
      'Deep foliage, wet skin, and the intimate quiet that arrives before the storm.',
  },
  {
    slug: 'willow',
    title: 'WILLOW',
    image: '/assets/editorial-willow.png',
    location: 'Dominical',
    model: 'Willow',
    cardDescription: 'A portrait study in shadow, texture, and tropical warmth.',
    photographer: 'Sofia Lune',
    date: 'June 2026',
    intro:
      'An earth-toned portrait study in shadow, texture, and restrained tropical heat.',
  },
  {
    slug: 'the-sanctuary',
    title: 'THE SANCTUARY',
    image: '/assets/editorial-sanctuary.png',
    location: 'Arenal',
    model: 'Casa Muses',
    cardDescription: 'Still water and volcanic stone create a hidden refuge.',
    photographer: 'Adrian Hale',
    date: 'June 2026',
    intro:
      'Volcanic stone, still water, and the ritual atmosphere of a hidden refuge.',
  },
  {
    slug: 'isabella',
    title: 'ISABELLA',
    image: '/assets/editorial-isabella.png',
    location: 'Papagayo',
    model: 'Isabella',
    cardDescription: 'A sunlit silhouette meets palms and after-dark confidence.',
    photographer: 'Mara Voss',
    date: 'May 2026',
    intro:
      'A high-sun silhouette translated into leather, palms, and after-dark confidence.',
  },
];

export const models = [
  {
    slug: 'ana',
    name: 'Ana',
    image: '/assets/editorial-ana-cover.jpg',
    location: 'Miami',
    bio: 'An ordinary afternoon becomes something far more tempting in Ana’s intimate portrait.',
  },
  {
    slug: 'cynthia',
    name: 'Cynthia',
    image: '/assets/cynthia-muse.jpg',
    location: 'Santa Teresa',
    bio: 'An intimate, firelit portrait of Cynthia in Santa Teresa.',
  },
  {
    slug: 'lucy',
    name: 'Lucy',
    image: '/assets/lucy-muse.jpg',
    location: 'Manzanillo',
    bio: 'Lucy finds a private cove at the edge of the jungle in this sunlit coastal story.',
  },
  {
    slug: 'alexis-noir',
    name: 'Alexis',
    image: '/assets/alexis-noir-new.jpg',
    location: 'Uvita, Costa Rica',
    bio: 'A jungle muse whose editorials lean into shadow, strength, and quiet sensuality.',
  },
  {
    slug: 'monica-riviera',
    name: 'Monica Riviera',
    image: '/assets/editorial-monica-riviera.png',
    location: 'Nosara, Costa Rica',
    bio: 'Monica brings a cinematic stillness to humid interiors and late-night coastal stories.',
  },
  {
    slug: 'isabella',
    name: 'Isabella',
    image: '/assets/editorial-isabella.png',
    location: 'Papagayo, Costa Rica',
    bio: 'A bold, sun-warmed presence shaped by resort architecture and coastal evenings.',
  },
  {
    slug: 'angie',
    name: 'Angie',
    image: '/assets/angie-muse.jpg',
    location: 'Playa Carmen',
    bio: 'A sunlit portrait of Angie surrounded by the lush greens of Playa Carmen.',
  },
  {
    slug: 'gabriela',
    name: 'Gabriela',
    image: '/assets/gabriela-muse.jpg',
    location: 'Jaco',
    bio: 'Gabriela in a warm, sunlit portrait from Jaco.',
  },
  {
    slug: 'valentina',
    name: 'Valentina',
    image: '/assets/valentina-muse.jpg',
    location: 'Limon',
    bio: 'Valentina in a golden, tropical portrait from Limon.',
  },
  {
    slug: 'chloe',
    name: 'Chloe',
    image: '/assets/chloe-muse.jpg',
    location: 'Santa Teresa',
    bio: 'Chloe in a dreamy, after-dark portrait from Santa Teresa.',
  },
  {
    slug: 'daya',
    name: 'Daya',
    image: '/assets/daya-muse.jpg',
    location: 'Playa Carmen',
    bio: 'Daya in a quiet balcony portrait framed by the deep greens of Playa Carmen.',
  },
  {
    slug: 'rachel',
    name: 'Rachel',
    image: '/assets/rachel-muse.png',
    location: 'San Jose',
    bio: 'Rachel in a warm, intimate portrait.',
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
    price: '29.99',
    yearlyPrice: '298.70',
    featured: true,
  },
  {
    name: 'STANDARD',
    badge: null,
    image: '/assets/editorial-coastal-escape.png',
    benefits: ['Access to Impura Vida Magazine issues'],
    price: '14.99',
    yearlyPrice: '149.30',
    featured: false,
  },
] as const;

export const impactStats = [
  { value: '1,247', label: 'HATCHLINGS PROTECTED', icon: 'turtle' },
  { value: '14', label: 'NESTING BEACHES SUPPORTED', icon: 'palm' },
  { value: '8,400', label: 'CONTRIBUTED TO CONSERVATION', icon: 'wave', prefix: '$' },
  { value: '100%', label: 'COSTA RICA FOCUSED', icon: 'leaf' },
] as const;
