import { Scale } from '../types';

/**
 * Real, open-source 3D organ models that live on GitHub and are loaded into the
 * Organism screen so individual organs sit *inside* the Z-Anatomy body surface.
 *
 * Source: the HuBMAP / Human Reference Atlas (HRA) "CCF 3D Reference Object
 * Library". Every organ is a committed `.glb` in the public repository below,
 * served with permissive CORS headers from raw.githubusercontent.com, licensed
 * CC-BY 4.0. The whole library shares one anatomical coordinate frame (metres,
 * Y-up), so the organs assemble into their correct relative positions and only a
 * single affine map is needed to register them to the Z-Anatomy body.
 *
 *   https://github.com/hubmapconsortium/ccf-3d-reference-object-library
 *
 * Loading is best-effort and per-organ: if one file is unreachable the rest
 * still appear, so nothing here is faked or hidden.
 */
export interface OrganModel {
  /** Catalog id. */
  id: string;
  /** Human-readable label shown on pick. */
  label: string;
  /** Atlas record id selected when the organ is clicked (organ:* or system:*). */
  recordId: string;
  /** Owning organ-system record id. */
  system: string;
  /** Coarse tint/material key shared with the body explorer's material cache. */
  anatomyKey: string;
  /** Direct GLB url (committed binary, CORS-enabled). */
  url: string;
  /** Approximate download size in MB, for ordering light organs first. */
  sizeMB: number;
}

export const ORGAN_REPO = {
  repo: 'hubmapconsortium/ccf-3d-reference-object-library',
  repoUrl: 'https://github.com/hubmapconsortium/ccf-3d-reference-object-library',
  license: 'CC-BY 4.0',
  attribution: 'HuBMAP Consortium — HRA CCF 3D Reference Object Library',
};

// Versioned, content-stable path inside the reference library (male set, to
// match the male Z-Anatomy body surface).
const BASE =
  'https://raw.githubusercontent.com/hubmapconsortium/ccf-3d-reference-object-library/master/VH_Male/v1.2';

export const ORGAN_MODELS: OrganModel[] = [
  { id: 'pancreas',        label: 'Pancreas',        recordId: 'system:digestive',     system: 'system:digestive',      anatomyKey: 'pancreas',   url: `${BASE}/VH_M_Pancreas.glb`,        sizeMB: 0.27 },
  { id: 'spleen',          label: 'Spleen',          recordId: 'system:digestive',     system: 'system:digestive',      anatomyKey: 'spleen',     url: `${BASE}/VH_M_Spleen.glb`,          sizeMB: 0.54 },
  { id: 'large-intestine', label: 'Large intestine', recordId: 'organ:intestines',     system: 'system:digestive',      anatomyKey: 'intestines', url: `${BASE}/SBU_M_Intestine_Large.glb`, sizeMB: 0.69 },
  { id: 'small-intestine', label: 'Small intestine', recordId: 'organ:intestines',     system: 'system:digestive',      anatomyKey: 'intestines', url: `${BASE}/VH_M_Small_Intestine.glb`, sizeMB: 0.86 },
  { id: 'kidney-l',        label: 'Kidney (left)',   recordId: 'organ:kidneys',        system: 'system:urinary',        anatomyKey: 'kidneys',    url: `${BASE}/VH_M_Kidney_L.glb`,        sizeMB: 1.3 },
  { id: 'kidney-r',        label: 'Kidney (right)',  recordId: 'organ:kidneys',        system: 'system:urinary',        anatomyKey: 'kidneys',    url: `${BASE}/VH_M_Kidney_R.glb`,        sizeMB: 1.5 },
  { id: 'heart',           label: 'Heart',           recordId: 'organ:heart',          system: 'system:cardiovascular', anatomyKey: 'heart',      url: `${BASE}/VH_M_Heart.glb`,           sizeMB: 1.7 },
  { id: 'liver',           label: 'Liver',           recordId: 'organ:liver',          system: 'system:digestive',      anatomyKey: 'liver',      url: `${BASE}/VH_M_Liver.glb`,           sizeMB: 1.7 },
  { id: 'lungs',           label: 'Lungs',           recordId: 'organ:lungs',          system: 'system:respiratory',    anatomyKey: 'lungs',      url: `${BASE}/VH_M_Lung.glb`,            sizeMB: 6.4 },
  { id: 'brain',           label: 'Brain',           recordId: 'organ:brain',          system: 'system:nervous',        anatomyKey: 'brain',      url: `${BASE}/Allen_M_Brain.glb`,        sizeMB: 12 },
];

/**
 * Fixed affine map from the HuBMAP reference frame (metres, Y-up) into the body
 * explorer's normalized body frame (head-top ≈ 1.55, feet ≈ -1.25).
 *
 * The library's measured organ envelope is x[-0.133, 0.143] y[-0.039, 0.903]
 * z[-0.092, 0.139]. True anatomical scale (~1.6) fills the body cavity right up
 * to the thin translucent skin, so organs poke through it. We deliberately keep
 * the cluster ~14% under anatomical scale and tuck it slightly posterior so the
 * whole viscera + brain sits comfortably *inside* the torso and skull:
 *   - brain crown (y 0.903) → body y ≈ 1.40 (inside the cranium)
 *   - pelvic floor (y -0.039) → body y ≈ 0.03 (above the groin)
 *   - half-width ≈ 0.20, half-depth ≈ 0.17 — both within the torso shell
 *   body = HUBMAP * scale + position
 */
export const ORGAN_FIT = {
  scale: 1.45,
  position: [-0.007, 0.091, -0.045] as [number, number, number],
};
