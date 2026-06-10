import type { TaxonNode } from '../../data/taxonomy';

export interface TaxonSelectionProps {
  selectedTaxonId: string | null;
  onSelect: (id: string) => void;
}

export interface TaxonWorkspaceProps extends TaxonSelectionProps {
  selected: TaxonNode | null;
  lineage: TaxonNode[];
  visibleChildren: TaxonNode[];
}
