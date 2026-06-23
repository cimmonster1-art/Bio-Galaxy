// The periodic table as a small, shared lookup. The 3D atom preview uses the
// proton count to lay out a schematic Bohr model, while the detail panel pulls
// the full live record (mass, configuration, electronegativity, ...) from
// PubChem by symbol. Keeping the table here lets search, the resolver, and the
// preview all agree on what counts as an element and how to name it.

export interface ChemElement {
  symbol: string;
  protons: number;
  name: string;
}

// All 118 elements, Z order. Names follow the spellings PubChem returns; common
// alternates (aluminium, sulphur, caesium) are added as aliases below.
export const ELEMENTS: ChemElement[] = [
  { symbol: 'H', protons: 1, name: 'hydrogen' }, { symbol: 'He', protons: 2, name: 'helium' },
  { symbol: 'Li', protons: 3, name: 'lithium' }, { symbol: 'Be', protons: 4, name: 'beryllium' },
  { symbol: 'B', protons: 5, name: 'boron' }, { symbol: 'C', protons: 6, name: 'carbon' },
  { symbol: 'N', protons: 7, name: 'nitrogen' }, { symbol: 'O', protons: 8, name: 'oxygen' },
  { symbol: 'F', protons: 9, name: 'fluorine' }, { symbol: 'Ne', protons: 10, name: 'neon' },
  { symbol: 'Na', protons: 11, name: 'sodium' }, { symbol: 'Mg', protons: 12, name: 'magnesium' },
  { symbol: 'Al', protons: 13, name: 'aluminum' }, { symbol: 'Si', protons: 14, name: 'silicon' },
  { symbol: 'P', protons: 15, name: 'phosphorus' }, { symbol: 'S', protons: 16, name: 'sulfur' },
  { symbol: 'Cl', protons: 17, name: 'chlorine' }, { symbol: 'Ar', protons: 18, name: 'argon' },
  { symbol: 'K', protons: 19, name: 'potassium' }, { symbol: 'Ca', protons: 20, name: 'calcium' },
  { symbol: 'Sc', protons: 21, name: 'scandium' }, { symbol: 'Ti', protons: 22, name: 'titanium' },
  { symbol: 'V', protons: 23, name: 'vanadium' }, { symbol: 'Cr', protons: 24, name: 'chromium' },
  { symbol: 'Mn', protons: 25, name: 'manganese' }, { symbol: 'Fe', protons: 26, name: 'iron' },
  { symbol: 'Co', protons: 27, name: 'cobalt' }, { symbol: 'Ni', protons: 28, name: 'nickel' },
  { symbol: 'Cu', protons: 29, name: 'copper' }, { symbol: 'Zn', protons: 30, name: 'zinc' },
  { symbol: 'Ga', protons: 31, name: 'gallium' }, { symbol: 'Ge', protons: 32, name: 'germanium' },
  { symbol: 'As', protons: 33, name: 'arsenic' }, { symbol: 'Se', protons: 34, name: 'selenium' },
  { symbol: 'Br', protons: 35, name: 'bromine' }, { symbol: 'Kr', protons: 36, name: 'krypton' },
  { symbol: 'Rb', protons: 37, name: 'rubidium' }, { symbol: 'Sr', protons: 38, name: 'strontium' },
  { symbol: 'Y', protons: 39, name: 'yttrium' }, { symbol: 'Zr', protons: 40, name: 'zirconium' },
  { symbol: 'Nb', protons: 41, name: 'niobium' }, { symbol: 'Mo', protons: 42, name: 'molybdenum' },
  { symbol: 'Tc', protons: 43, name: 'technetium' }, { symbol: 'Ru', protons: 44, name: 'ruthenium' },
  { symbol: 'Rh', protons: 45, name: 'rhodium' }, { symbol: 'Pd', protons: 46, name: 'palladium' },
  { symbol: 'Ag', protons: 47, name: 'silver' }, { symbol: 'Cd', protons: 48, name: 'cadmium' },
  { symbol: 'In', protons: 49, name: 'indium' }, { symbol: 'Sn', protons: 50, name: 'tin' },
  { symbol: 'Sb', protons: 51, name: 'antimony' }, { symbol: 'Te', protons: 52, name: 'tellurium' },
  { symbol: 'I', protons: 53, name: 'iodine' }, { symbol: 'Xe', protons: 54, name: 'xenon' },
  { symbol: 'Cs', protons: 55, name: 'cesium' }, { symbol: 'Ba', protons: 56, name: 'barium' },
  { symbol: 'La', protons: 57, name: 'lanthanum' }, { symbol: 'Ce', protons: 58, name: 'cerium' },
  { symbol: 'Pr', protons: 59, name: 'praseodymium' }, { symbol: 'Nd', protons: 60, name: 'neodymium' },
  { symbol: 'Pm', protons: 61, name: 'promethium' }, { symbol: 'Sm', protons: 62, name: 'samarium' },
  { symbol: 'Eu', protons: 63, name: 'europium' }, { symbol: 'Gd', protons: 64, name: 'gadolinium' },
  { symbol: 'Tb', protons: 65, name: 'terbium' }, { symbol: 'Dy', protons: 66, name: 'dysprosium' },
  { symbol: 'Ho', protons: 67, name: 'holmium' }, { symbol: 'Er', protons: 68, name: 'erbium' },
  { symbol: 'Tm', protons: 69, name: 'thulium' }, { symbol: 'Yb', protons: 70, name: 'ytterbium' },
  { symbol: 'Lu', protons: 71, name: 'lutetium' }, { symbol: 'Hf', protons: 72, name: 'hafnium' },
  { symbol: 'Ta', protons: 73, name: 'tantalum' }, { symbol: 'W', protons: 74, name: 'tungsten' },
  { symbol: 'Re', protons: 75, name: 'rhenium' }, { symbol: 'Os', protons: 76, name: 'osmium' },
  { symbol: 'Ir', protons: 77, name: 'iridium' }, { symbol: 'Pt', protons: 78, name: 'platinum' },
  { symbol: 'Au', protons: 79, name: 'gold' }, { symbol: 'Hg', protons: 80, name: 'mercury' },
  { symbol: 'Tl', protons: 81, name: 'thallium' }, { symbol: 'Pb', protons: 82, name: 'lead' },
  { symbol: 'Bi', protons: 83, name: 'bismuth' }, { symbol: 'Po', protons: 84, name: 'polonium' },
  { symbol: 'At', protons: 85, name: 'astatine' }, { symbol: 'Rn', protons: 86, name: 'radon' },
  { symbol: 'Fr', protons: 87, name: 'francium' }, { symbol: 'Ra', protons: 88, name: 'radium' },
  { symbol: 'Ac', protons: 89, name: 'actinium' }, { symbol: 'Th', protons: 90, name: 'thorium' },
  { symbol: 'Pa', protons: 91, name: 'protactinium' }, { symbol: 'U', protons: 92, name: 'uranium' },
  { symbol: 'Np', protons: 93, name: 'neptunium' }, { symbol: 'Pu', protons: 94, name: 'plutonium' },
  { symbol: 'Am', protons: 95, name: 'americium' }, { symbol: 'Cm', protons: 96, name: 'curium' },
  { symbol: 'Bk', protons: 97, name: 'berkelium' }, { symbol: 'Cf', protons: 98, name: 'californium' },
  { symbol: 'Es', protons: 99, name: 'einsteinium' }, { symbol: 'Fm', protons: 100, name: 'fermium' },
  { symbol: 'Md', protons: 101, name: 'mendelevium' }, { symbol: 'No', protons: 102, name: 'nobelium' },
  { symbol: 'Lr', protons: 103, name: 'lawrencium' }, { symbol: 'Rf', protons: 104, name: 'rutherfordium' },
  { symbol: 'Db', protons: 105, name: 'dubnium' }, { symbol: 'Sg', protons: 106, name: 'seaborgium' },
  { symbol: 'Bh', protons: 107, name: 'bohrium' }, { symbol: 'Hs', protons: 108, name: 'hassium' },
  { symbol: 'Mt', protons: 109, name: 'meitnerium' }, { symbol: 'Ds', protons: 110, name: 'darmstadtium' },
  { symbol: 'Rg', protons: 111, name: 'roentgenium' }, { symbol: 'Cn', protons: 112, name: 'copernicium' },
  { symbol: 'Nh', protons: 113, name: 'nihonium' }, { symbol: 'Fl', protons: 114, name: 'flerovium' },
  { symbol: 'Mc', protons: 115, name: 'moscovium' }, { symbol: 'Lv', protons: 116, name: 'livermorium' },
  { symbol: 'Ts', protons: 117, name: 'tennessine' }, { symbol: 'Og', protons: 118, name: 'oganesson' },
];

const BY_NAME = new Map(ELEMENTS.map((e) => [e.name, e]));
const BY_SYMBOL = new Map(ELEMENTS.map((e) => [e.symbol.toLowerCase(), e]));
// Common spelling alternates so a learner's typed name still resolves.
const NAME_ALIASES: Record<string, string> = {
  aluminium: 'aluminum', sulphur: 'sulfur', caesium: 'cesium',
};

/** Look up an element by its full name (case-insensitive, alternates allowed). */
export function elementByName(name: string): ChemElement | undefined {
  const key = name.trim().toLowerCase();
  return BY_NAME.get(NAME_ALIASES[key] ?? key);
}

/** Look up an element by its chemical symbol (case-insensitive). */
export function elementBySymbol(symbol: string): ChemElement | undefined {
  return BY_SYMBOL.get(symbol.trim().toLowerCase());
}

/**
 * Recognize a query that names a chemical element, so "Carbon", "carbon atom",
 * "oganesson", or a bare symbol like "Fe" resolves to a schematic atom. Returns
 * the element or undefined. Bare symbols stay tight (1-2 chars) so they never
 * shadow a peptide or an ordinary word.
 */
export function asElement(query: string): ChemElement | undefined {
  const cleaned = query.trim().toLowerCase().replace(/\s+atom$/, '').replace(/^an?\s+/, '').trim();
  if (!cleaned) return undefined;
  const byName = elementByName(cleaned);
  if (byName) return byName;
  if (cleaned.length <= 2) return BY_SYMBOL.get(cleaned);
  return undefined;
}
