export interface CharacterDef {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primaryColor: number;
  accentColor: number;
  portrait: string;
}

export const CHARACTERS: CharacterDef[] = [
  {
    id: 'banana-sam',
    name: 'Banana Sam',
    tagline: 'Slippery when nervous',
    description:
      'A worried banana in a helmet who stumbled onto the battlefield. Trips over his own peels.',
    primaryColor: 0xf5c842,
    accentColor: 0x8b6914,
    portrait: 'portrait-banana-sam',
  },
  {
    id: 'turtle-tank',
    name: 'Turtle Tank',
    tagline: 'Meh.',
    description:
      'A grumpy tortoise with a tank turret welded to his shell. Slow, armored, and completely over it.',
    primaryColor: 0x6a8a55,
    accentColor: 0x7a6a50,
    portrait: 'portrait-turtle-tank',
  },
  {
    id: 'hastronaut',
    name: 'Always Hastronaut',
    tagline: "It's just business.",
    description:
      'An astronaut with a pistol and a shrug. Always behind you. Always has been.',
    primaryColor: 0xe8e8e8,
    accentColor: 0x555555,
    portrait: 'portrait-hastronaut',
  },
  {
    id: 'fish-attawater',
    name: 'Fish Attawater',
    tagline: 'Staying deep undercover.',
    description:
      'A fish in a trench coat and fedora. Nobody suspects a thing. Nobody.',
    primaryColor: 0x5aaa5a,
    accentColor: 0x9a8055,
    portrait: 'portrait-fish-attawater',
  },
  {
    id: 'high-noon-snoo',
    name: 'High Noon Snoo',
    tagline: 'Draw.',
    description:
      'The fastest antenna in the West. Rides into battle wearing a poncho and a grudge.',
    primaryColor: 0xf0ece8,
    accentColor: 0x7a5a30,
    portrait: 'portrait-high-noon-snoo',
  },
  {
    id: 'professor-orange',
    name: 'Professor Orange',
    tagline: "I'm a pawsitive catalyst.",
    description:
      'An orange tabby in a tweed jacket. Reads between the battle lines and never misses a footnote.',
    primaryColor: 0xe8923a,
    accentColor: 0x6a5a48,
    portrait: 'portrait-professor-orange',
  },
];

export function getCharacterById(id: string): CharacterDef | undefined {
  return CHARACTERS.find((c) => c.id === id);
}
