export enum ZoomScale {
  HUMAN = 0,            // ~10^0 m
  ORGAN_SYSTEM = 1,     // ~10^-1 m
  ORGAN = 2,            // ~10^-2 m
  TISSUE = 3,           // ~10^-3 m
  CELL = 4,             // ~10^-5 m
  ORGANELLE = 5,        // ~10^-6 m
  PROTEIN_COMPLEX = 6,  // ~10^-9 m
  MOLECULE = 7,         // ~10^-10 m
  ATOM = 8              // ~10^-10 m
}

export interface ScaleDetail {
  scale: ZoomScale;
  name: string;
  magnitude: string;
  description: string;
  cosmicAnalogy: string;
  metricLabel: string;
}

export type BiologicalElementCategory = 
  | "system" 
  | "organ" 
  | "tissue_type" 
  | "organelle" 
  | "protein_complex" 
  | "molecule"
  | "atom";

export interface BioEntity {
  id: string;
  name: string;
  category: BiologicalElementCategory;
  description: string;
  cosmicEquivalent?: string;
  metricSize: string;
  facts: string[];
  source: "UniProt" | "Reactome" | "RCSB PDB" | "Human Protein Atlas" | "NCBI" | "Ensembl";
  children?: string[];
  parentId?: string;
}
