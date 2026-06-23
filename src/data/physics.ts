import { BioObject } from '../types';

/**
 * Physics as the glue between every scale. Where the rest of the atlas answers
 * "what is inside this?", these facets answer "why does this system behave the
 * way it does?" — the quantitative, physical properties a chemistry or physics
 * student actually needs: a planet's gravity and escape velocity, an atom's
 * orbitals and quantum numbers, a galaxy's dark matter and rotation curve.
 */
export interface PhysicsFacet {
  label: string;
  value: string;
  note?: string;
}

const PLANET_FACETS = (
  gravity: string, escape: string, atmosphere: string, field: string, extra?: PhysicsFacet[],
): PhysicsFacet[] => [
  { label: 'Surface gravity', value: gravity, note: 'Acceleration a free body feels at the surface.' },
  { label: 'Escape velocity', value: escape, note: 'Speed needed to break free of the body’s gravity.' },
  { label: 'Atmosphere', value: atmosphere },
  { label: 'Magnetic field', value: field },
  ...(extra ?? []),
];

const CARBON_FACETS: PhysicsFacet[] = [
  { label: 'Electron configuration', value: '1s² 2s² 2p²', note: 'Six electrons across two shells.' },
  { label: 'Valence electrons', value: '4', note: 'Lets carbon form four covalent bonds.' },
  { label: 'Quantum numbers (2p)', value: 'n=2, ℓ=1', note: 'Principal and azimuthal numbers of the valence orbital.' },
  { label: 'Binding force', value: 'Electromagnetic', note: 'The Coulomb force binds electrons to the nucleus.' },
  { label: 'Atomic number', value: 'Z = 6' },
];

// Keyed by resolver id. Cosmic and atomic scales carry the richest physics.
const PHYSICS_FACETS: Record<string, PhysicsFacet[]> = {
  cosmos: [
    { label: 'Expansion', value: 'H₀ ≈ 70 km/s/Mpc', note: 'Space itself stretches; distant galaxies recede faster.' },
    { label: 'Dark energy', value: '≈ 68% of the energy budget', note: 'Drives the accelerating expansion.' },
    { label: 'Dark matter', value: '≈ 27%', note: 'Unseen mass whose gravity shapes structure.' },
    { label: 'Ordinary matter', value: '≈ 5%' },
    { label: 'CMB temperature', value: '2.725 K', note: 'The cooled afterglow of the Big Bang.' },
    { label: 'Age', value: '13.8 billion years' },
  ],
  galaxy: [
    { label: 'Dark matter halo', value: '≈ 85% of the mass', note: 'Required to hold the disk together.' },
    { label: 'Rotation curve', value: 'Flat at large radius', note: 'Stars orbit too fast for visible mass alone — evidence for dark matter.' },
    { label: 'Redshift', value: 'Tracks recession & distance', note: 'Spectral lines shift toward red as the universe expands.' },
    { label: 'Central black hole', value: '~4×10⁶ M☉ (Milky Way)', note: 'Sagittarius A* anchors the core.' },
    { label: 'Diameter', value: '~100,000 light years' },
  ],
  'planet:sun': [
    { label: 'Surface gravity', value: '274 m/s²', note: '~28× Earth’s.' },
    { label: 'Escape velocity', value: '617.5 km/s' },
    { label: 'Core fusion', value: 'H → He at ~15 million K', note: 'Proton–proton chain releases the Sun’s energy.' },
    { label: 'Luminosity', value: '3.8×10²⁶ W' },
    { label: 'Magnetic field', value: 'Dynamo-driven, ~11-year cycle' },
  ],
  'planet:mercury': PLANET_FACETS('3.7 m/s²', '4.3 km/s', 'Negligible (exosphere)', 'Weak global dipole (~1% of Earth’s)'),
  'planet:venus': PLANET_FACETS('8.87 m/s²', '10.36 km/s', 'Thick CO₂, ~92 bar', 'No intrinsic field (induced only)', [{ label: 'Surface temp', value: '~464 °C', note: 'Runaway greenhouse effect.' }]),
  'planet:earth': PLANET_FACETS('9.81 m/s²', '11.19 km/s', 'N₂/O₂, ~1 bar', 'Strong dipole from the liquid-iron dynamo', [{ label: 'Obliquity', value: '23.4°', note: 'Axial tilt that drives the seasons.' }]),
  'planet:mars': PLANET_FACETS('3.71 m/s²', '5.03 km/s', 'Thin CO₂, ~0.006 bar', 'No global field; patchy crustal magnetism'),
  'planet:jupiter': PLANET_FACETS('24.79 m/s²', '59.5 km/s', 'H₂/He', 'Strongest planetary field (~20,000× Earth’s)'),
  'planet:saturn': PLANET_FACETS('10.44 m/s²', '35.5 km/s', 'H₂/He', 'Strong, remarkably axisymmetric field'),
  'planet:uranus': PLANET_FACETS('8.69 m/s²', '21.3 km/s', 'H₂/He/CH₄', 'Tilted, offset field; rotates on its side'),
  'planet:neptune': PLANET_FACETS('11.15 m/s²', '23.5 km/s', 'H₂/He/CH₄', 'Tilted, offset field'),
  atom_carbon: CARBON_FACETS,
  'atom:C': CARBON_FACETS,
};

// By-kind fallbacks so physics-relevant objects still answer "why does it behave?"
const KIND_FACETS: Partial<Record<BioObject['kind'], PhysicsFacet[]>> = {
  star: [
    { label: 'Energy source', value: 'Core nuclear fusion', note: 'Hydrogen fuses to helium, balancing gravity.' },
    { label: 'Colour ↔ temperature', value: 'Blue hot, red cool', note: 'Spectral class encodes surface temperature.' },
    { label: 'Hydrostatic equilibrium', value: 'Gravity vs. radiation pressure', note: 'The balance that sets a star’s size.' },
  ],
  atom: [
    { label: 'Binding force', value: 'Electromagnetic', note: 'Electrons are held in quantized orbitals around the nucleus.' },
    { label: 'Shell structure', value: 'Quantized energy levels', note: 'Electrons occupy discrete orbitals (s, p, d, f).' },
  ],
  molecule: [
    { label: 'Bonding', value: 'Shared valence electrons', note: 'Covalent bonds set geometry and reactivity.' },
    { label: 'Energy', value: 'Stored in chemical bonds', note: 'Breaking and forming bonds releases or absorbs energy.' },
  ],
};

/** Physics facets for a selection, or an empty list if none apply. */
export function physicsFor(object: BioObject): PhysicsFacet[] {
  return PHYSICS_FACETS[object.id] ?? KIND_FACETS[object.kind] ?? [];
}

export function hasPhysics(object: BioObject | null): boolean {
  return !!object && physicsFor(object).length > 0;
}
