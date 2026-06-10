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
      'Bounded by the nuclear envelope, which is continuous with the endoplasmic reticulum.',
      'Disassembles and reforms during each round of cell division.',
    ],
    source: 'uniprot',
    crossRefs: ['ensembl', 'ncbi'],
    wikipedia: 'Cell nucleus',
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
      'Thought to descend from an ancient free living bacterium taken in by an early cell.',
      'Inherited largely through the egg, so its genome traces the maternal line.',
    ],
    source: 'reactome',
    crossRefs: ['uniprot', 'rcsb', 'hpa'],
    reactomeId: 'R-HSA-1428517',
    wikipedia: 'Mitochondrion',
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
      'Receives newly made proteins arriving from the endoplasmic reticulum.',
      'Named after Camillo Golgi, who first described it in 1898.',
    ],
    source: 'uniprot',
    crossRefs: ['reactome'],
    wikipedia: 'Golgi apparatus',
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
      'Forms one continuous membrane network spread through the cytoplasm.',
      'Its membrane connects directly to the outer nuclear envelope.',
    ],
    source: 'reactome',
    crossRefs: ['uniprot'],
    wikipedia: 'Endoplasmic reticulum',
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
      'Microtubules pull chromosomes apart during cell division.',
      'Actin filaments drive crawling, contraction, and the pinching of dividing cells.',
    ],
    source: 'uniprot',
    crossRefs: ['reactome'],
    wikipedia: 'Cytoskeleton',
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
      'Catalyze peptide bond formation through their ribosomal RNA core.',
      'Often work in chains called polysomes that read one transcript at once.',
    ],
    source: 'uniprot',
    crossRefs: ['rcsb'],
    pdbId: '4V6X',
    wikipedia: 'Ribosome',
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
      'Coat proteins such as clathrin and COPII select the cargo to enclose.',
      'Synaptic vesicles release neurotransmitters at nerve endings.',
    ],
    source: 'reactome',
    crossRefs: ['uniprot'],
    wikipedia: 'Vesicle (biology and chemistry)',
  },
  lysosome: {
    id: 'lysosome',
    name: 'Lysosome',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Acidic membrane bound organelle that digests worn out parts and engulfed material.',
    size: '~0.1 to 1.2 µm',
    facts: [
      'Holds dozens of hydrolytic enzymes that work best at low pH.',
      'A proton pump keeps the interior acidic, around pH 4.5 to 5.',
      'Breaks down material delivered by endocytosis and autophagy.',
      'Recycles the building blocks back to the cytosol for reuse.',
      'Faults in its enzymes cause a family of lysosomal storage disorders.',
    ],
    source: 'uniprot',
    crossRefs: ['reactome', 'ncbi'],
    wikipedia: 'Lysosome',
  },
  peroxisome: {
    id: 'peroxisome',
    name: 'Peroxisome',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Single membrane organelle that handles oxidative reactions and breaks down fatty acids.',
    size: '~0.1 to 1 µm',
    facts: [
      'Breaks down very long chain fatty acids through beta oxidation.',
      'Produces hydrogen peroxide, then neutralizes it with the enzyme catalase.',
      'Contributes to the synthesis of certain membrane lipids.',
      'Imports its proteins already folded from the cytosol.',
      'Found in nearly all eukaryotic cells.',
    ],
    source: 'uniprot',
    crossRefs: ['reactome', 'ncbi'],
    wikipedia: 'Peroxisome',
  },
  centriole: {
    id: 'centriole',
    name: 'Centriole',
    scale: Scale.Organelle,
    kind: 'organelle',
    summary:
      'Barrel of microtubule triplets that organizes the spindle and templates cilia.',
    size: '~0.5 µm long',
    facts: [
      'Built from nine triplets of microtubules in a pinwheel arrangement.',
      'A pair sits at the core of the centrosome, the main microtubule organizer.',
      'Helps build the spindle that separates chromosomes during division.',
      'Duplicates once per cell cycle, in step with DNA replication.',
      'Acts as a basal body that seeds the growth of cilia and flagella.',
    ],
    source: 'uniprot',
    crossRefs: ['reactome', 'ncbi'],
    wikipedia: 'Centriole',
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
    crossRefs: ['rcsb', 'reactome'],
    accession: 'P25705',
    pdbId: '5ARA',
    reactomeId: 'R-HSA-163210',
    wikipedia: 'ATP synthase',
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
    crossRefs: ['rcsb', 'reactome'],
    accession: 'P99999',
    pdbId: '1HRC',
    reactomeId: 'R-HSA-111457',
    wikipedia: 'Cytochrome c',
  },
};

export function getBioObject(id: string): BioObject | undefined {
  return BIO_OBJECTS[id];
}

/** Objects that belong to a given scale, in registry order. */
export function objectsAtScale(scale: Scale): BioObject[] {
  return Object.values(BIO_OBJECTS).filter((o) => o.scale === scale);
}
