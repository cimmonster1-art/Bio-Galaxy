import { BioEntity, ScaleDetail, ZoomScale } from "./types";

export const SCALE_DETAILS: Record<ZoomScale, ScaleDetail> = {
  [ZoomScale.HUMAN]: {
    scale: ZoomScale.HUMAN,
    name: "Human",
    magnitude: "~10⁰ m",
    description: "Homo sapiens. The biological organism coordinates tissues, organs, and neural lines to maintain homeostatic equilibrium.",
    cosmicAnalogy: "Macroscopic Cluster",
    metricLabel: "Meters"
  },
  [ZoomScale.ORGAN_SYSTEM]: {
    scale: ZoomScale.ORGAN_SYSTEM,
    name: "Organ System",
    magnitude: "~10⁻¹ m",
    description: "Interconnected tissues executing systemic workflows such as signal transduction, circulation, and pulmonary gas exchange.",
    cosmicAnalogy: "Network Array",
    metricLabel: "Decimeters"
  },
  [ZoomScale.ORGAN]: {
    scale: ZoomScale.ORGAN,
    name: "Organ",
    magnitude: "~10⁻² m",
    description: "Anatomical structures comprising specialized cell types. Pumping, filtering, and processing metabolic loads.",
    cosmicAnalogy: "Macro Node",
    metricLabel: "Centimeters"
  },
  [ZoomScale.TISSUE]: {
    scale: ZoomScale.TISSUE,
    name: "Tissue",
    magnitude: "~10⁻³ m",
    description: "Multicellular laminar layers of highly arranged extracellular matrices. Structural networks guiding blood cells and axons.",
    cosmicAnalogy: "Mesh Framework",
    metricLabel: "Millimeters"
  },
  [ZoomScale.CELL]: {
    scale: ZoomScale.CELL,
    name: "Cell",
    magnitude: "~10⁻⁵ m",
    description: "The autonomous operational unit of life structured by a phospholipid membrane bilayer and cytosolic currents.",
    cosmicAnalogy: "Microcosmic Vessel",
    metricLabel: "Micrometers"
  },
  [ZoomScale.ORGANELLE]: {
    scale: ZoomScale.ORGANELLE,
    name: "Organelle",
    magnitude: "~10⁻⁶ m",
    description: "Functional intracellular compartments. Governs mitochondrial ATP yield, nuclear regulation, and golgi peptide processing.",
    cosmicAnalogy: "Organelle Planets",
    metricLabel: "Micrometers"
  },
  [ZoomScale.PROTEIN_COMPLEX]: {
    scale: ZoomScale.PROTEIN_COMPLEX,
    name: "Protein Complex",
    magnitude: "~10⁻⁹ m",
    description: "Multi-subunit enzymes assembling to execute specialized catalyses (e.g., ATP synthase rotor spin).",
    cosmicAnalogy: "Nano Machines",
    metricLabel: "Nanometers"
  },
  [ZoomScale.MOLECULE]: {
    scale: ZoomScale.MOLECULE,
    name: "Molecule",
    magnitude: "~10⁻¹⁰ m",
    description: "Atomic groupings bound by electrostatic valence forces to form water, nucleotides, and lipids.",
    cosmicAnalogy: "Chemical Core",
    metricLabel: "Angstroms"
  },
  [ZoomScale.ATOM]: {
    scale: ZoomScale.ATOM,
    name: "Atom",
    magnitude: "~10⁻¹⁰ m",
    description: "Quantum nucleus structures of protons and neutrons, framed by dynamic orbiting electron probability fields.",
    cosmicAnalogy: "Quantum Scale",
    metricLabel: "Picometers"
  }
};

export const BIOLOGICAL_ENTITIES: Record<string, BioEntity> = {
  // HUMAN SCALE
  "human_organism": {
    id: "human_organism",
    name: "Homo Sapiens",
    category: "system",
    description: "A world-class organism characterized by multi-tiered physiological regulatory engines, neurological pathways, and somatic boundaries.",
    metricSize: "1.8 m",
    facts: [
      "Coordinates over 37 trillion autonomous cells working in continuous alignment.",
      "Consumes approximately 2000-2500 kcal of chemical energy per solar day.",
      "Maintains core systemic homeostasis within a very narrow physical range."
    ],
    source: "Human Protein Atlas"
  },

  // ORGAN SYSTEM
  "nervous_system": {
    id: "nervous_system",
    name: "Nervous System",
    category: "system",
    description: "Somatic and autonomic communications network conducting electrochemical signals across high-velocity axonal channels.",
    metricSize: "1.4 m",
    facts: [
      "Transmits action potentials at up to 120 meters per second.",
      "Encompasses approximately 86 billion processing neurons.",
      "Employs neurotransmitter chemical signals over synaptic clefts."
    ],
    source: "UniProt",
    parentId: "human_organism"
  },

  // ORGAN
  "brain_organ": {
    id: "brain_organ",
    name: "Brain Node",
    category: "organ",
    description: "The primary control center of the nervous system, housing cortical layers that process sensory input and coordinate motor output.",
    metricSize: "15 cm",
    facts: [
      "Consumes 20% of the body's total oxygen intake.",
      "Processes sensory vectors continuously across massive synapses.",
      "Possesses a synaptic memory capacity estimated at 2.5 petabytes."
    ],
    source: "Human Protein Atlas",
    parentId: "nervous_system"
  },

  // TISSUE
  "neuronal_tissue": {
    id: "neuronal_tissue",
    name: "Cortical Neuropil",
    category: "tissue_type",
    description: "A dense, intricate mesh of unmyelinated axons, dendrites, and glial cell processes embedded in extracellular matrix.",
    metricSize: "500 µm",
    facts: [
      "Forms multi-layered laminar circuits of pyramidal neurons.",
      "Sustained by continuous trophic nourishment from local capillary astrocytes.",
      "Exhibits synaptic plasticity under learning and stimulation."
    ],
    source: "NCBI",
    parentId: "brain_organ"
  },

  // CELL
  "neuronal_cell": {
    id: "neuronal_cell",
    name: "Neuronal Soma",
    category: "organelle", // used as container scale
    description: "An active post-mitotic neuronal cell characterized by elaborate dendritic trees, an active soma, and long synaptic projections.",
    metricSize: "20 µm",
    facts: [
      "Exhibits high baseline metabolic rates requiring substantial ATP yield.",
      "Maintains a high resting membrane potential of -70 mV via continuous ion pumping.",
      "Possesses thousands of mitochondria clustered at active synapsis knobs."
    ],
    source: "Human Protein Atlas",
    parentId: "neuronal_tissue"
  },

  // --- ORGANELLE SCALE (HOTSPOTS IN mockup central viewport) ---
  "nucleus": {
    id: "nucleus",
    name: "Nucleus",
    category: "organelle",
    description: "Double membrane-bound repository of the human genome, supervising gene expression, transcription, and chromatin structuring.",
    metricSize: "6 µm",
    facts: [
      "Envelopes ~3.2 billion base pairs of genomic DNA wound around histones.",
      "Regulates traffic via thousands of nuclear pore complexes selectively.",
      "Synthesizes raw ribosome components inside the dense nucleolus core."
    ],
    source: "UniProt",
    parentId: "neuronal_cell"
  },
  "mitochondrion": {
    id: "mitochondrion",
    name: "Mitochondon",
    category: "organelle",
    description: "A highly folded double-membrane organelle compiling the respiratory chain to generate chemical ATP via oxidative phosphorylation.",
    metricSize: "2 µm",
    facts: [
      "Synthesizes ATP using a proton-motive force across the cristae inner membrane.",
      "Maintains its own autonomous compact circular DNA genome.",
      "Operates as the central trigger for programmed cell apoptosis."
    ],
    source: "Reactome",
    parentId: "neuronal_cell"
  },
  "golgi_apparatus": {
    id: "golgi_apparatus",
    name: "Golgi Apparatus",
    category: "organelle",
    description: "A series of flattened cisterna membrane sacs that sort, modify, and pack synthesized peptides for cargo transport.",
    metricSize: "1.5 µm",
    facts: [
      "Modifies glycoproteins dynamically through localized glycosylation enzymes.",
      "Dispatches loaded secretory vesicles along microtubules.",
      "Maintains a polar structure with distinct cis and trans faces."
    ],
    source: "UniProt",
    parentId: "neuronal_cell"
  },
  "endoplasmic_reticulum": {
    id: "endoplasmic_reticulum",
    name: "Endoplasmic Reticulum",
    category: "organelle",
    description: "An extensive membranous network of branching tubules and flattened sacs involved in protein synthesis and calcium buffering.",
    metricSize: "3 µm",
    facts: [
      "Rough domain is studded with active ribosomes compiling peptides.",
      "Smooth domain synthesizes cellular lipids and buffers cytosolic calcium ions.",
      "Monitors correct protein folding before transport to the Golgi."
    ],
    source: "Reactome",
    parentId: "neuronal_cell"
  },
  "cytoskeleton": {
    id: "cytoskeleton",
    name: "Cytoskeleton",
    category: "organelle",
    description: "A structural network of microfilaments, intermediate filaments, and microtubules spanning the cytoplasm.",
    metricSize: "25 nm",
    facts: [
      "Provides mechanical scaffolding to support thin neuronal dendrites.",
      "Functions as an active highway for kinesin and dynein cargo transport.",
      "Dynamically reorganizes to alter neural connection pathways."
    ],
    source: "UniProt",
    parentId: "neuronal_cell"
  },

  // PROTEIN COMPLEX SCALE
  "atp_synthase": {
    id: "atp_synthase",
    name: "ATP Synthase F0F1 Complex",
    category: "protein_complex",
    description: "A molecular rotor nanomachine running on a proton electrochemical gradient, spinning to synthesize ATP.",
    metricSize: "10 nm",
    facts: [
      "Rotor spins at up to 6,000 RPM inside the cristae membranous fold.",
      "Converts mechanical rotational energy into chemical anhydride bonds.",
      "Yields three ATP molecules per full 360-degree rotation of the stalk."
    ],
    source: "RCSB PDB"
  },

  // MOLECULE SCALE
  "water_molecule": {
    id: "water_molecule",
    name: "Water Molecule H2O",
    category: "molecule",
    description: "A polar chemical solvent whose hydrogen-bonding properties act as the primary medium for all biological reactions.",
    metricSize: "0.27 nm",
    facts: [
      "Forms brief tetrahedron alignment grids with adjacent water molecules.",
      "Acts as the fluid cytoplasm solvent enabling cellular transport.",
      "Exhibits a strong dipole moment supporting membrane integrity."
    ],
    source: "Ensembl"
  },

  // ATOM SCALE
  "carbon_atom": {
    id: "carbon_atom",
    name: "Carbon-12 Atom",
    category: "atom",
    description: "The fundamental organic element, possessing four outer valence electrons capable of forming diverse covalent links.",
    metricSize: "170 pm",
    facts: [
      "Forms stable single, double, and triple bonds with adjacent nuclei.",
      "Comprises the atomic backbone of all proteins, nucleotides, and lipids.",
      "Has a covalent radius of 77 picometers."
    ],
    source: "NCBI"
  }
};
