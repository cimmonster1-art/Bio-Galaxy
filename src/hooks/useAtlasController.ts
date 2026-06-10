import { useCallback, useMemo, useState } from 'react';
import { rcsb } from '../data/clients';
import { MODEL_CATALOG, type ModelEntry } from '../data/modelCatalog';
import { resolveObject } from '../data/resolve';
import { FIRST_SCALE, LAST_SCALE } from '../data/scales';
import { lineageOf } from '../data/taxonomy';
import type { BioObject, PickTag } from '../types';
import { Scale } from '../types';
import type { AtlasWorkspace } from '../components/AtlasTopNav';
import type { OrganismModelRequest, StructurePayload } from '../components/BioGalaxyCanvas';
import type { MobileAtlasPanel } from '../components/MobileAtlasDock';
import type { ModelStatus } from '../components/panels/AnatomyModelsPanel';
import { useAsync } from './useAsync';

const stripTaxon = (id: string): string => id.replace(/^taxon:|^organism:/, '');
const defaultHuman = MODEL_CATALOG.find((entry) => entry.id === 'human') ?? MODEL_CATALOG[0];

/** Owns atlas navigation, selection, model-loading, and derived panel state. */
export function useAtlasController() {
  const [scale, setScale] = useState<Scale>(Scale.Cosmos);
  const [selected, setSelected] = useState<BioObject | null>(null);
  const [hovered, setHovered] = useState<BioObject | null>(null);
  const [focusTaxonId, setFocusTaxonId] = useState<string | null>(null);
  const [organismModel, setOrganismModel] = useState<OrganismModelRequest | null>({ url: defaultHuman.url, label: defaultHuman.label, sourceUrl: defaultHuman.repoUrl });
  const [activeModelId, setActiveModelId] = useState<string | null>(defaultHuman.id);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('loading');
  const [workspace, setWorkspace] = useState<AtlasWorkspace>(null);
  const [cinematicProgress, setCinematicProgress] = useState<number | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobileAtlasPanel>(null);

  const applySelection = useCallback((object: BioObject) => {
    setSelected(object);
    if (object.id.startsWith('taxon:')) setFocusTaxonId(object.id);
    if (object.id.startsWith('organism:')) setFocusTaxonId(`taxon:${stripTaxon(object.id)}`);
    setScale(object.id.startsWith('organism:') ? Scale.Organism : object.scale);
  }, []);
  const navigateTo = useCallback((id: string) => { const object = resolveObject(id); if (object) applySelection(object); }, [applySelection]);
  const selectTaxon = useCallback((id: string) => navigateTo(`taxon:${id}`), [navigateTo]);
  const handleHover = useCallback((tag: PickTag | null) => setHovered(tag ? resolveObject(tag.id) ?? null : null), []);
  const handleSelect = useCallback((tag: PickTag | null) => { if (!tag) setSelected(null); else navigateTo(tag.id); }, [navigateTo]);
  const stepScale = useCallback((direction: 1 | -1) => setScale((value) => Math.max(FIRST_SCALE, Math.min(LAST_SCALE, value + direction)) as Scale), []);
  const loadModelEntry = useCallback((entry: ModelEntry) => { setActiveModelId(entry.id); setModelStatus('loading'); setOrganismModel({ url: entry.url, label: entry.label, sourceUrl: entry.repoUrl }); setScale(Scale.Organism); }, []);
  const handleModelResult = useCallback((ok: boolean) => setModelStatus(ok ? 'loaded' : 'error'), []);

  const pdbId = selected?.pdbId ?? null;
  const structureState = useAsync((signal) => rcsb.fetchStructure(pdbId as string, { signal }), [pdbId], Boolean(pdbId));
  const structure = useMemo<StructurePayload | null>(() => pdbId && structureState.data && selected ? { atoms: structureState.data.atoms, pickId: selected.id } : null, [pdbId, structureState.data, selected]);
  const selectedTaxonId = focusTaxonId ? stripTaxon(focusTaxonId) : null;

  return {
    scale, setScale, selected, hovered, focusTaxonId, organismModel, activeModelId, modelStatus,
    workspace, setWorkspace, cinematicProgress, setCinematicProgress, mobilePanel, setMobilePanel,
    navigateTo, selectTaxon, handleHover, handleSelect, stepScale, loadModelEntry, handleModelResult,
    structure, selectedTaxonId,
    lineage: selectedTaxonId ? lineageOf(selectedTaxonId).map((taxon) => taxon.name) : [],
    activeSources: selected ? [...(selected.source ? [selected.source] : []), ...(selected.crossRefs ?? [])] : [],
    anatomyScale: scale >= Scale.Organism && scale <= Scale.Tissue,
    coreAnatomyScale: scale >= Scale.Organism && scale <= Scale.Organ,
  };
}

export type AtlasController = ReturnType<typeof useAtlasController>;
