import { BioObject, Scale } from '../types';

/**
 * Curated registry of selectable biological objects. This is intentionally a
 * representative sample, not an exhaustive database. Records that map to a
 * protein carry a real UniProt accession and, where available, a real PDB id
 * so the detail panel can resolve live metadata.
 */
export const BIO_OBJECTS: Record<string, BioObject> = {
  // ---- Organelles ----------------------------------------------------------
  nucleus: {
    id: 'nucleus',
    name: 'Nucleus',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Double membrane compartment that stores the genome and organizes transcription.',
    size: '~6 µm',
    facts: [
      'Holds the chromosomal DNA wound around histone proteins.',
      'Exchanges molecules with the cytoplasm through nuclear pore complexes.',
      'Assembles ribosomal subunits in the nucleolus.',
    ],
    source: 'uniprot',
    crossRefs: ['ensembl', 'ncbi'],
  },
  mitochondrion: {
    id: 'mitochondrion',
    name: 'Mitochondrion',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Folded double membrane organelle that produces ATP through oxidative phosphorylation.',
    size: '~1 to 2 µm',
    facts: [
      'Inner membrane folds, the cristae, host the respiratory chain.',
      'Carries its own small circular genome.',
      'Central to programmed cell death signaling.',
    ],
    source: 'reactome',
    crossRefs: ['uniprot', 'rcsb', 'hpa'],
    reactomeId: 'R-HSA-1428517',
  },
  golgi: {
    id: 'golgi',
    name: 'Golgi Apparatus',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Stacked membrane cisternae that modify, sort, and dispatch proteins and lipids.',
    size: '~1 µm',
    facts: [
      'Distinct cis and trans faces give the stack its polarity.',
      'Adds and trims sugar groups during glycosylation.',
      'Buds vesicles that carry cargo to the membrane and beyond.',
    ],
    source: 'uniprot',
    crossRefs: ['reactome'],
  },
  er: {
    id: 'er',
    name: 'Endoplasmic Reticulum',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Branching membrane network for protein folding, lipid synthesis, and calcium storage.',
    size: '~ network spanning the cell',
    facts: [
      'Rough domains are studded with translating ribosomes.',
      'Smooth domains build lipids and buffer calcium.',
      'Quality checks protein folding before export to the Golgi.',
    ],
    source: 'reactome',
    crossRefs: ['uniprot'],
  },
  cytoskeleton: {
    id: 'cytoskeleton',
    name: 'Cytoskeleton',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Filament networks of actin, intermediate filaments, and microtubules that shape the cell.',
    size: '~7 to 25 nm filaments',
    facts: [
      'Provides mechanical support and defines cell shape.',
      'Acts as tracks for motor driven transport.',
      'Continuously remodels during movement and division.',
    ],
    source: 'uniprot',
    crossRefs: ['reactome'],
  },
  ribosomes: {
    id: 'ribosomes',
    name: 'Ribosome Cluster',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Ribonucleoprotein machines that translate messenger RNA into polypeptide chains.',
    size: '~25 nm each',
    facts: [
      'Built from large and small subunits of RNA and protein.',
      'Read messenger RNA codon by codon.',
      'Found free in the cytosol and bound to the rough ER.',
    ],
    source: 'uniprot',
    crossRefs: ['rcsb'],
    pdbId: '4V6X',
  },
  vesicles: {
    id: 'vesicles',
    name: 'Transport Vesicles',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary: 'Small membrane bound carriers that shuttle cargo between compartments.',
    size: '~50 to 100 nm',
    facts: [
      'Pinch off from donor membranes with coat proteins.',
      'Fuse selectively with target membranes.',
      'Carry secreted and recycled molecules across the cell.',
    ],
    source: 'reactome',
    crossRefs: ['uniprot'],
  },

  // ---- Protein complex / molecule -----------------------------------------
  atp_synthase: {
    id: 'atp_synthase',
    name: 'ATP Synthase',
    scale: Scale.ProteinComplex,
    kind: 'complex',
    summary:
      'Rotary molecular machine in the inner mitochondrial membrane that synthesizes ATP.',
    size: '~10 nm',
    facts: [
      'Driven by a proton gradient across the inner membrane.',
      'Couples rotation to the chemistry of ATP formation.',
      'One of the most conserved machines across life.',
    ],
    source: 'uniprot',
    crossRefs: ['rcsb', 'alphafold', 'reactome'],
    accession: 'P25705',
    pdbId: '5ARA',
    reactomeId: 'R-HSA-163210',
    alphafoldId: 'P25705',
  },
  cytochrome_c: {
    id: 'cytochrome_c',
    name: 'Cytochrome c',
    scale: Scale.ProteinComplex,
    kind: 'complex',
    summary: 'Small heme protein that shuttles electrons within the respiratory chain.',
    size: '~3 nm',
    facts: [
      'Carries single electrons between respiratory complexes.',
      'Release into the cytosol triggers apoptosis.',
      'A classic model protein in structural biology.',
    ],
    source: 'uniprot',
    crossRefs: ['rcsb', 'alphafold', 'reactome'],
    accession: 'P99999',
    pdbId: '1HRC',
    reactomeId: 'R-HSA-111457',
    alphafoldId: 'P99999',
  },
};

export function getBioObject(id: string): BioObject | undefined {
  return BIO_OBJECTS[id];
}

/** Objects that belong to a given scale, in registry order. */
export function objectsAtScale(scale: Scale): BioObject[] {
  return Object.values(BIO_OBJECTS).filter((o) => o.scale === scale);
}
