import { BioObject, Scale } from '../types';

/**
 * The connective tissue of the scientific graph. These records fill in the rungs
 * that turn isolated scenes into continuous, cross-domain traversals — the killer
 * feature: descending from an organ all the way to the gene that builds it, and
 * climbing from a single atom up through chemistry into living pathways.
 *
 * Two marquee chains are wired here, each rung carrying real database identifiers
 * so the detail panel resolves live science:
 *
 *   Biology   Heart → Left ventricle → Cardiomyocyte → Sarcomere →
 *             Actin filament → Actin protein (ACTA1) → ACTA1 gene
 *   Chemistry Carbon → Methane → Glucose → Glycolysis → ATP
 */
export const SCIENCE_OBJECTS: Record<string, BioObject> = {
  // ── Biology: heart → gene ──────────────────────────────────────────────────
  'region:left_ventricle': {
    id: 'region:left_ventricle', name: 'Left ventricle', scale: Scale.Organ, kind: 'organ',
    summary: 'The thick-walled pumping chamber that drives oxygenated blood into the systemic circulation.',
    size: '~10 mm myocardial wall', facts: [
      'Generates the highest pressure of any heart chamber.',
      'Its wall is built from spiralling layers of cardiac muscle.',
      'Ejects blood into the aorta with each contraction.',
    ], source: 'hpa', crossRefs: ['ncbi'],
  },
  'cell:cardiomyocyte': {
    id: 'cell:cardiomyocyte', name: 'Cardiomyocyte', scale: Scale.Cell, kind: 'cell',
    summary: 'The contractile heart-muscle cell, packed with sarcomeres and mitochondria, electrically coupled to its neighbours.',
    size: '~100 µm long', facts: [
      'Branched, striated cells joined by intercalated discs.',
      'Dense with mitochondria to fund continuous contraction.',
      'Contracts in response to a wave of electrical excitation.',
    ], source: 'hpa', crossRefs: ['ensembl', 'uniprot', 'ncbi'],
  },
  'organelle:sarcomere': {
    id: 'organelle:sarcomere', name: 'Sarcomere', scale: Scale.Organelle, kind: 'organelle',
    summary: 'The repeating contractile unit of striated muscle, bounded by Z-discs, where actin and myosin filaments slide past one another.',
    size: '~2 µm at rest', facts: [
      'Shortening of many sarcomeres in series contracts the cell.',
      'Defined by interdigitating thin (actin) and thick (myosin) filaments.',
      'Its banding pattern gives muscle its striated appearance.',
    ], source: 'reactome', crossRefs: ['uniprot', 'rcsb'],
  },
  'complex:actin_filament': {
    id: 'complex:actin_filament', name: 'Actin filament (F-actin)', scale: Scale.ProteinComplex, kind: 'complex',
    summary: 'A helical polymer of actin protein subunits — the thin filament of the sarcomere and a core element of the cytoskeleton.',
    size: '~7 nm diameter', facts: [
      'Assembles from globular G-actin into a double-helical strand.',
      'Provides the track along which myosin motors generate force.',
      'Dynamically grows and shrinks at its two distinct ends.',
    ], source: 'rcsb', crossRefs: ['uniprot', 'alphafold', 'reactome'], pdbId: '1ATN',
  },
  'protein:actin': {
    id: 'protein:actin', name: 'Actin (ACTA1)', scale: Scale.ProteinComplex, kind: 'complex',
    summary: 'Alpha-skeletal-muscle actin: the protein subunit whose polymer forms the thin filament. Mutations cause congenital myopathies.',
    size: '~42 kDa monomer', facts: [
      'One of the most conserved proteins across eukaryotes.',
      'Binds ATP, which it slowly hydrolyses as the filament ages.',
      'Encoded by the ACTA1 gene; variants cause nemaline myopathy.',
    ], source: 'uniprot', crossRefs: ['rcsb', 'alphafold', 'ensembl', 'ncbi'],
    accession: 'P68133', pdbId: '1ATN', alphafoldId: 'P68133',
  },
  'gene:acta1': {
    id: 'gene:acta1', name: 'ACTA1 gene', scale: Scale.Molecule, kind: 'molecule',
    summary: 'The gene on chromosome 1 encoding alpha-skeletal-muscle actin — the bottom of the heart traversal, where structure meets the genome.',
    size: '~3 kb locus', facts: [
      'Transcribed and translated into the actin protein.',
      'Pathogenic variants disrupt thin-filament assembly.',
      'Linked through Ensembl and NCBI to sequence and literature.',
    ], source: 'ensembl', crossRefs: ['ncbi', 'uniprot'],
    provenanceNote: 'Gene record; sequence and variants via Ensembl and NCBI.',
  },

  // ── Chemistry: carbon → ATP ────────────────────────────────────────────────
  'mol_methane': {
    id: 'mol_methane', name: 'Methane', scale: Scale.Molecule, kind: 'molecule',
    summary: 'The simplest hydrocarbon — one carbon bonded to four hydrogens — the first step from a lone carbon atom into molecular chemistry.',
    size: '~0.4 nm', facts: [
      'Perfectly tetrahedral, with 109.5° H–C–H bond angles.',
      'A potent greenhouse gas and primary component of natural gas.',
      'Carbon’s four valence electrons each form one C–H bond.',
    ], source: 'pubchem', pubchemCid: 297, provenanceNote: 'Chemical identity from PubChem (CID 297).',
  },
  'mol_glucose': {
    id: 'mol_glucose', name: 'Glucose', scale: Scale.Molecule, kind: 'molecule',
    summary: 'A six-carbon sugar and the central fuel of metabolism — the molecule cells break down to release energy.',
    size: '~0.9 nm', facts: [
      'Built on a backbone of six carbon atoms.',
      'Oxidised through glycolysis and respiration to power the cell.',
      'The monomer of starch, glycogen, and cellulose.',
    ], source: 'pubchem', pubchemCid: 5793, crossRefs: ['reactome'], provenanceNote: 'Chemical identity from PubChem (CID 5793).',
  },
  'pathway_glycolysis': {
    id: 'pathway_glycolysis', name: 'Glycolysis', scale: Scale.Molecule, kind: 'molecule',
    summary: 'The ten-step pathway that splits glucose into pyruvate, yielding ATP — the bridge where chemistry becomes living metabolism.',
    size: 'cytosolic pathway', facts: [
      'Converts one glucose into two pyruvate molecules.',
      'Nets two ATP and two NADH per glucose.',
      'Universal across nearly all living cells.',
    ], source: 'reactome', crossRefs: ['pubchem'], reactomeId: 'R-HSA-70171',
    provenanceNote: 'Pathway record from Reactome (R-HSA-70171).',
  },
  'mol_atp': {
    id: 'mol_atp', name: 'ATP', scale: Scale.Molecule, kind: 'molecule',
    summary: 'Adenosine triphosphate — the cell’s energy currency, charged by metabolism and spent to drive nearly every cellular process.',
    size: '~1.1 nm', facts: [
      'Releases energy when its terminal phosphate bond is broken.',
      'Regenerated by ATP synthase using a proton gradient.',
      'Links glucose chemistry to the work of living cells.',
    ], source: 'pubchem', pubchemCid: 5957, crossRefs: ['reactome'], provenanceNote: 'Chemical identity from PubChem (CID 5957).',
  },
};
