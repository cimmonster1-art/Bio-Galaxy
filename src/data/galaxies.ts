// A small catalogue of well-known galaxies so a search for "Andromeda" or the
// "Whirlpool Galaxy" lands on a real, navigable object with its own distance,
// diameter, and morphology, not just a generic spiral. The 3D preview renders
// every entry as a procedural spiral disk; the figures below are the
// source-cited context shown alongside it.

export interface NamedGalaxy {
  id: string;
  name: string;
  aliases: string[];
  morphology: string;
  /** Human-readable diameter, kept as text so units stay explicit. */
  diameter: string;
  /** Human-readable distance from the Milky Way. */
  distance: string;
  summary: string;
  facts: string[];
}

export const NAMED_GALAXIES: NamedGalaxy[] = [
  {
    id: 'milky-way',
    name: 'Milky Way',
    aliases: ['milky way', 'the galaxy', 'home galaxy'],
    morphology: 'Barred spiral (SBbc)',
    diameter: '~100,000 light-years',
    distance: '0 (our galaxy)',
    summary: 'Our home barred-spiral galaxy of 100 to 400 billion stars, with a central bar and a supermassive black hole, Sagittarius A*, at its core.',
    facts: [
      'The Sun sits about 27,000 light-years from the galactic centre.',
      'Sagittarius A* has a mass of roughly 4 million Suns.',
      'Spiral arms are sites of ongoing star formation.',
    ],
  },
  {
    id: 'andromeda',
    name: 'Andromeda Galaxy',
    aliases: ['andromeda', 'andromeda galaxy', 'messier 31', 'm31', 'ngc 224'],
    morphology: 'Barred spiral (SA(s)b)',
    diameter: '~152,000 light-years',
    distance: '~2.5 million light-years',
    summary: 'The nearest large spiral galaxy to the Milky Way and the most distant object visible to the naked eye, on a collision course with our own galaxy.',
    facts: [
      'Andromeda and the Milky Way will merge in about 4.5 billion years.',
      'It holds roughly one trillion stars.',
      'Catalogued as Messier 31 (M31).',
    ],
  },
  {
    id: 'whirlpool',
    name: 'Whirlpool Galaxy',
    aliases: ['whirlpool', 'whirlpool galaxy', 'messier 51', 'm51', 'ngc 5194'],
    morphology: 'Grand-design spiral (SA(s)bc)',
    diameter: '~76,000 light-years',
    distance: '~31 million light-years',
    summary: 'A classic grand-design spiral interacting with the smaller companion NGC 5195, whose tidal pull sharpens its sweeping arms.',
    facts: [
      'A textbook grand-design spiral with two prominent arms.',
      'Its companion NGC 5195 distorts the larger disk.',
      'Catalogued as Messier 51 (M51).',
    ],
  },
  {
    id: 'triangulum',
    name: 'Triangulum Galaxy',
    aliases: ['triangulum', 'triangulum galaxy', 'messier 33', 'm33', 'ngc 598'],
    morphology: 'Unbarred spiral (SA(s)cd)',
    diameter: '~60,000 light-years',
    distance: '~2.7 million light-years',
    summary: 'The third-largest member of the Local Group, a flocculent spiral rich in star-forming regions including the giant nebula NGC 604.',
    facts: [
      'The third-largest galaxy in our Local Group.',
      'Hosts NGC 604, one of the largest known star-forming regions.',
      'Catalogued as Messier 33 (M33).',
    ],
  },
  {
    id: 'sombrero',
    name: 'Sombrero Galaxy',
    aliases: ['sombrero', 'sombrero galaxy', 'messier 104', 'm104', 'ngc 4594'],
    morphology: 'Spiral with a large bulge (SA(s)a)',
    diameter: '~49,000 light-years',
    distance: '~29 million light-years',
    summary: 'An edge-on spiral whose bright bulge and dark, encircling dust lane give it the look of a wide-brimmed hat.',
    facts: [
      'Seen nearly edge-on, with a prominent dust lane.',
      'Hosts a very massive central black hole, around a billion Suns.',
      'Catalogued as Messier 104 (M104).',
    ],
  },
  {
    id: 'pinwheel',
    name: 'Pinwheel Galaxy',
    aliases: ['pinwheel', 'pinwheel galaxy', 'messier 101', 'm101', 'ngc 5457'],
    morphology: 'Face-on spiral (SAB(rs)cd)',
    diameter: '~170,000 light-years',
    distance: '~21 million light-years',
    summary: 'A large, face-on spiral with sprawling, asymmetric arms studded with bright star-forming regions.',
    facts: [
      'Nearly twice the diameter of the Milky Way.',
      'Asymmetric arms shaped by past gravitational encounters.',
      'Catalogued as Messier 101 (M101).',
    ],
  },
];

const GALAXY_INDEX = new Map<string, NamedGalaxy>();
for (const g of NAMED_GALAXIES) {
  GALAXY_INDEX.set(g.name.toLowerCase(), g);
  for (const a of g.aliases) GALAXY_INDEX.set(a, g);
}

/** Resolve a typed name or alias to a named galaxy, when one matches exactly. */
export function galaxyByName(query: string): NamedGalaxy | undefined {
  return GALAXY_INDEX.get(query.trim().toLowerCase());
}

/** A named galaxy by its catalogue id (e.g. "andromeda"). */
export function galaxyById(id: string): NamedGalaxy | undefined {
  return NAMED_GALAXIES.find((g) => g.id === id);
}

/**
 * Recognize a query that names or describes a galaxy: any catalogued name or
 * alias, or the word "galaxy" itself (so "spiral galaxy" still resolves).
 */
export function asGalaxy(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (galaxyByName(q)) return true;
  return /\bgalax(y|ies)\b/.test(q);
}
