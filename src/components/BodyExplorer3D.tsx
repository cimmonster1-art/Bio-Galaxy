import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Bone, HeartPulse, Layers, Loader as LoaderIcon } from 'lucide-react';
import { Scale, PickTag } from '../types';
import { createNebulaBackground } from '../three/shaders/nebula';
import { ORGAN_MODELS, ORGAN_FIT } from '../data/organModels';

/**
 * Organism screen — Astro-insight's 3D body explorer, ported to Bio Galaxy as a
 * biology-only anatomy atlas (no astrology overlays). It renders the SAME real
 * licensed model as the original explorer: **Z-Anatomy** (open-source human
 * anatomy atlas, CC-BY-SA 4.0). Two meshopt-compressed GLBs ship with the app —
 * a 278-region translucent body surface and an 1,847-bone skeleton — and every
 * mesh keeps its anatomical name, so clicks resolve down to tissue level and
 * route into Bio Galaxy's detail panel. Surface detail textures (MIT, from the
 * three.js examples) drive real bump relief. Provenance lives in
 * public/models/ATTRIBUTION.txt and public/textures/anatomy/CREDITS.md.
 *
 * Internal organs are real open-source GLB models from the HuBMAP / Human
 * Reference Atlas CCF 3D Reference Object Library (CC-BY 4.0, hosted on GitHub),
 * loaded on demand and registered *inside* the body surface — see
 * src/data/organModels.ts. The deep-space backdrop is the SAME procedural nebula
 * + starfield the rest of Bio Galaxy uses, so the sky never changes between tabs.
 */

// Bundled meshopt-compressed anatomy GLBs, served from the app origin.
const ANATOMY_BODY_URL = '/models/anatomy-body.glb';
const ANATOMY_SKELETON_URL = '/models/anatomy-skeleton.glb';

/** Toggleable anatomical layers. The body surface is always the base; the heavy
 *  skeleton and organ models load lazily the first time they are revealed. */
type LayerKey = 'body' | 'skeletal' | 'organs';

/**
 * Map a Z-Anatomy mesh name → our coarse anatomy key, used to tint the mesh and
 * to resolve a click into a Bio Galaxy organ/system record. Z-Anatomy names
 * meshes with FMA anatomy terms (e.g. "Parietal bone.r", "Biceps brachii.l").
 */
function anatomyKeyForMeshName(raw: string): string | null {
  const n = raw.toLowerCase();
  if (/(brain|cerebr|cortex|cerebell)/.test(n)) return 'brain';
  if (/(heart|cardiac|myocard|aorta|ventricle|atrium)/.test(n)) return 'heart';
  if (/(lung|bronch|trachea|pulmonary|alveol)/.test(n)) return 'lungs';
  if (/(liver|hepat)/.test(n)) return 'liver';
  if (/(stomach|gastr)/.test(n)) return 'stomach';
  if (/(intestin|colon|duoden|jejun|ileum|caecum|rectum|bowel)/.test(n)) return 'intestines';
  if (/(kidney|renal|nephron)/.test(n)) return 'kidneys';
  if (/(bone|skelet|vertebr|\brib|sternum|clavicle|femur|tibia|fibula|humerus|radius|ulna|pelvi|skull|crani|mandible|maxilla|scapula|patella|phalan|metacarp|metatars|tarsus|carpus|sacrum|coccyx|hyoid|cartilage)/.test(n)) return 'skeleton';
  if (/(muscle|muscul|bicep|tricep|deltoid|pectoral|gluteus|quadricep|gastrocnem|trapez|latissimus|abdomin|oblique|sartorius|soleus|tendon)/.test(n)) return 'muscles';
  if (/(nerve|neur|spinal cord|ganglion|plexus|axon|sciatic|vagus)/.test(n)) return 'nerves';
  return null;
}

/** Turn a raw Z-Anatomy mesh name into a clean human title (drop side/type suffixes). */
function cleanAnatomyName(raw: string): string {
  let s = raw.replace(/\.(r|l|g|j|t|c|m|s|001|\d+)$/i, '').replace(/[._]/g, ' ').trim();
  const side = /\.r\b|_r\b|\bright\b/i.test(raw) ? ' (right)' : /\.l\b|_l\b|\bleft\b/i.test(raw) ? ' (left)' : '';
  s = s.replace(/\s+/g, ' ');
  if (!s) return 'this structure';
  return s.charAt(0).toUpperCase() + s.slice(1) + side;
}

/**
 * Resolve a coarse anatomy key to a Bio Galaxy atlas record id + the scale it
 * lives on, so a click on the model selects the same object the anatomy cards do.
 */
const KEY_TO_RECORD: Record<string, { id: string; scale: Scale }> = {
  brain: { id: 'organ:brain', scale: Scale.Organ },
  heart: { id: 'organ:heart', scale: Scale.Organ },
  lungs: { id: 'organ:lungs', scale: Scale.Organ },
  liver: { id: 'organ:liver', scale: Scale.Organ },
  stomach: { id: 'organ:stomach', scale: Scale.Organ },
  intestines: { id: 'organ:intestines', scale: Scale.Organ },
  kidneys: { id: 'organ:kidneys', scale: Scale.Organ },
  spleen: { id: 'system:digestive', scale: Scale.OrganSystem },
  pancreas: { id: 'system:digestive', scale: Scale.OrganSystem },
  skeleton: { id: 'system:skeletal', scale: Scale.OrganSystem },
  nerves: { id: 'system:nervous', scale: Scale.OrganSystem },
};

// ─── Scene builder ────────────────────────────────────────────────────────────
interface SceneHandle {
  loadSkeleton: () => void;
  loadOrgans: () => void;
  setLayerVisible: (key: LayerKey, visible: boolean) => void;
  resize: () => void;
  cleanup: () => void;
}

interface SceneCallbacks {
  onPick: (tag: PickTag | null, title: string) => void;
  onHover: (tag: PickTag | null) => void;
}

function buildScene(canvas: HTMLCanvasElement, cb: SceneCallbacks): SceneHandle {
  const isMobile = window.innerWidth <= 768;
  const dpr = Math.min(window.devicePixelRatio, isMobile ? 1.25 : 2);
  const useBloom = !isMobile;
  const timeUniform = { value: 0 };

  // ── Renderer ──────────────────────────────────────────────────────────────
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, alpha: false, powerPreference: 'default' });
  renderer.setPixelRatio(dpr);
  renderer.setSize(Math.max(canvas.clientWidth, 1), Math.max(canvas.clientHeight, 1));
  renderer.setClearColor(0x02040a, 1);
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.55;

  // ── Open-source anatomy detail textures (MIT, from three.js) ───────────────
  // Sampled triplanar in `enrich` (no UVs needed) to add real photographic
  // grain/fibre + drive bump relief. They load async; the sampler is bound to a
  // neutral 1×1 grey until the image arrives so nothing flashes black.
  const texLoader = new THREE.TextureLoader();
  const loadDetail = (url: string) => {
    const t = texLoader.load(url);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return t;
  };
  const muscleTex = loadDetail('/textures/anatomy/muscle_fibre.jpg');
  const grainTex = loadDetail('/textures/anatomy/tissue_grain.jpg');
  const neutralTex = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1, THREE.RGBAFormat);
  neutralTex.needsUpdate = true;
  const detailTextures = [muscleTex, grainTex, neutralTex];

  // ── Bloom post-processing (desktop only, best-effort) ──────────────────────
  let composer: EffectComposer | null = null;
  let renderPass: RenderPass | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  if (useBloom) {
    try {
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(renderer.getPixelRatio());
      renderPass = new RenderPass(undefined as any, undefined as any);
      composer.addPass(renderPass);
      bloomPass = new UnrealBloomPass(
        new THREE.Vector2(Math.max(canvas.clientWidth * 0.5, 1), Math.max(canvas.clientHeight * 0.5, 1)),
        0.42, 0.3, 0.85,
      );
      composer.addPass(bloomPass);
    } catch (e) {
      console.warn('[BodyExplorer3D] bloom unavailable at init — using plain render:', e);
      composer = null; renderPass = null; bloomPass = null;
    }
  }

  // ── Scene + camera ────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02040a, 0.0011);

  // Procedural studio environment for physically based reflections — the same
  // technique the main galaxy scene uses. Without it the PBR organ/skin
  // materials have nothing to reflect and read as flat; with it they pick up
  // soft specular highlights that sculpt their real surface relief.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTexture;
  pmrem.dispose();

  const w = Math.max(canvas.clientWidth, 1), h = Math.max(canvas.clientHeight, 1);
  const camera = new THREE.PerspectiveCamera(52, w / h, 0.05, 40);
  camera.position.set(0, 0, 3.3);

  const ZOOM_MIN = 0.25, ZOOM_MAX = 9;
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  // OrbitControls applies wheel/pinch dolly instantly (it isn't damped), which
  // reads as steppy. We disable its zoom and ease the camera toward a target
  // distance every frame instead, for smooth, continuous zooming.
  controls.enableZoom = false;
  controls.minDistance = ZOOM_MIN;
  controls.maxDistance = ZOOM_MAX;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.4;
  controls.update();

  // ── Smooth, continuous zoom ─────────────────────────────────────────────────
  // Wheel and pinch nudge a target distance; the render loop eases the actual
  // camera distance toward it with frame-rate-independent damping.
  let zoomTarget = camera.position.distanceTo(controls.target);
  const clampZoom = (d: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, d));
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const px = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * 100 : e.deltaY;
    zoomTarget = clampZoom(zoomTarget * Math.exp(px * 0.0012));
  };
  let pinchPrev = 0;
  const onTouchPinch = (e: TouchEvent) => {
    if (e.touches.length !== 2) { pinchPrev = 0; return; }
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    const dist = Math.hypot(dx, dy);
    if (pinchPrev > 0 && dist > 0) zoomTarget = clampZoom(zoomTarget * (pinchPrev / dist));
    pinchPrev = dist;
  };
  const onTouchPinchEnd = () => { pinchPrev = 0; };
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchmove', onTouchPinch, { passive: true });
  canvas.addEventListener('touchend', onTouchPinchEnd);

  /** Ease the camera distance toward zoomTarget; run before controls.update(). */
  const applyZoom = (dt: number) => {
    const offset = camera.position.clone().sub(controls.target);
    const dist = offset.length();
    if (dist < 1e-5) return;
    const k = 1 - Math.exp(-dt * 9);
    const next = dist + (zoomTarget - dist) * k;
    camera.position.copy(controls.target).add(offset.multiplyScalar(next / dist));
  };

  // Three-point light rig — sculpts the bump-mapped relief.
  scene.add(new THREE.AmbientLight(0x140a32, 0.42));
  const keyLight = new THREE.DirectionalLight(0xcdbcff, 1.15); keyLight.position.set(-1.5, 3, 2.5); scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0x4070ff, 0.3); fillLight.position.set(1.5, 1, 1.5); scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0x6a20d8, 0.6); rimLight.position.set(0, 0.5, -3); scene.add(rimLight);

  // ── Deep-space backdrop — the SAME procedural nebula + starfield the rest of
  //    Bio Galaxy renders, so the organism tab's sky matches every other scale ──
  const nebula = createNebulaBackground(36);
  scene.add(nebula.mesh);

  // ── Float group — the whole assembly drifts + turns like a suspended specimen ─
  const floatGroup = new THREE.Group();
  scene.add(floatGroup);

  // ── Material enrichment ─────────────────────────────────────────────────────
  // Injects (via onBeforeCompile) hyperdetailed procedural tissue texture + a
  // slim Fresnel "atmospheric outline" that hugs the real silhouette, while
  // keeping full physically-based lighting. Ported verbatim from the explorer.
  const RIM_COLOR = new THREE.Color(0x55b8ff);
  const enrich = (
    mat: THREE.MeshStandardMaterial,
    o: { rim?: number; detail?: number; detailScale?: number; striation?: number; bump?: number;
         tex?: THREE.Texture; texAmt?: number; texScale?: number } = {},
  ) => {
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uEnrTime = timeUniform;
      shader.uniforms.uRim = { value: o.rim ?? 0 };
      shader.uniforms.uRimColor = { value: RIM_COLOR.clone() };
      shader.uniforms.uDetail = { value: o.detail ?? 0 };
      shader.uniforms.uDetailScale = { value: o.detailScale ?? 26 };
      shader.uniforms.uStriation = { value: o.striation ?? 0 };
      shader.uniforms.uBump = { value: o.bump ?? 0 };
      shader.uniforms.uTex = { value: o.tex ?? neutralTex };
      shader.uniforms.uTexAmt = { value: o.texAmt ?? 0 };
      shader.uniforms.uTexScale = { value: o.texScale ?? 1 };

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vEnrWPos;\nvarying vec3 vEnrWNrm;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vEnrWPos = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;')
        .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  vEnrWNrm = normalize( mat3( modelMatrix ) * objectNormal );');

      const head = `
        varying vec3 vEnrWPos; varying vec3 vEnrWNrm;
        uniform float uEnrTime; uniform float uRim; uniform vec3 uRimColor;
        uniform float uDetail; uniform float uDetailScale; uniform float uStriation;
        uniform float uBump;
        uniform sampler2D uTex; uniform float uTexAmt; uniform float uTexScale;
        float enrFres = 0.0;
        float gTexL = 0.5;
        float enrHash( vec3 p ){ return fract( sin( dot( p, vec3( 17.13, 113.51, 71.79 ) ) ) * 43758.5453 ); }
        float enrNoise( vec3 p ){
          vec3 i = floor( p ), f = fract( p ); f = f * f * ( 3.0 - 2.0 * f );
          float n000 = enrHash( i + vec3(0,0,0) ), n100 = enrHash( i + vec3(1,0,0) );
          float n010 = enrHash( i + vec3(0,1,0) ), n110 = enrHash( i + vec3(1,1,0) );
          float n001 = enrHash( i + vec3(0,0,1) ), n101 = enrHash( i + vec3(1,0,1) );
          float n011 = enrHash( i + vec3(0,1,1) ), n111 = enrHash( i + vec3(1,1,1) );
          return mix( mix( mix(n000,n100,f.x), mix(n010,n110,f.x), f.y ),
                      mix( mix(n001,n101,f.x), mix(n011,n111,f.x), f.y ), f.z );
        }
        float enrFbm( vec3 p ){ float a = 0.5, s = 0.0; for ( int i = 0; i < 4; i++ ){ s += a * enrNoise( p ); p *= 2.03; a *= 0.5; } return s; }
      `;
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\n' + head)
        .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
          if ( uTexAmt > 0.0 ) {
            vec3 an = abs( normalize( vEnrWNrm ) );
            vec2 tuv = ( an.x >= an.y && an.x >= an.z ) ? vEnrWPos.zy
                     : ( an.y >= an.z ) ? vEnrWPos.xz : vEnrWPos.xy;
            gTexL = texture2D( uTex, tuv * uTexScale ).r;
          }
          if ( uBump > 0.0 ) {
            float bScale = uDetailScale * (uStriation > 0.5 ? 1.0 : 1.4);
            float hC = mix( enrFbm( vEnrWPos * bScale ), gTexL, clamp( uTexAmt, 0.0, 0.7 ) );
            vec3 sigX = dFdx( vEnrWPos );
            vec3 sigY = dFdy( vEnrWPos );
            vec3 Nb = normalize( vEnrWNrm );
            float hX = dFdx( hC );
            float hY = dFdy( hC );
            vec3 R1 = cross( sigY, Nb );
            vec3 R2 = cross( Nb, sigX );
            float det = dot( sigX, R1 );
            vec3 grad = sign( det ) * ( hX * R1 + hY * R2 );
            normal = normalize( abs( det ) * Nb - uBump * grad );
          }`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          {
            float enrDet = enrFbm( vEnrWPos * uDetailScale );
            float enrStri = 0.5 + 0.5 * sin( vEnrWPos.y * uDetailScale * 2.6 + enrDet * 6.2832 );
            float enrTex = mix( enrDet, enrStri, uStriation );
            diffuseColor.rgb *= ( 1.0 - uDetail * 0.45 ) + uDetail * ( 0.55 + 0.9 * enrTex );
            totalEmissiveRadiance *= ( 1.0 - uDetail * 0.3 ) + uDetail * ( 0.6 + 0.8 * enrTex );
            diffuseColor.rgb *= ( 1.0 - uTexAmt * 0.4 ) + uTexAmt * ( 0.45 + 1.0 * gTexL );
            if ( uRim > 0.0 ) {
              vec3 enrV = normalize( cameraPosition - vEnrWPos );
              enrFres = pow( 1.0 - max( dot( normalize( vEnrWNrm ), enrV ), 0.0 ), 3.0 );
              float enrPulse = 0.85 + 0.15 * sin( uEnrTime * 1.2 );
              totalEmissiveRadiance += uRimColor * enrFres * uRim * enrPulse;
            }
          }`)
        .replace('#include <opaque_fragment>', `
          #ifdef OPAQUE
          diffuseColor.a = 1.0;
          #endif
          #ifdef USE_TRANSMISSION
          diffuseColor.a *= material.transmissionAlpha;
          #endif
          gl_FragColor = vec4( outgoingLight, clamp( diffuseColor.a + uRim * enrFres * 0.6, 0.0, 1.0 ) );
        `);
    };
    mat.needsUpdate = true;
  };

  // ── Shared materials — one per system, not per-mesh (keeps GPU state tiny) ──
  const SYS_TINT: Record<string, number> = {
    skeleton: 0xece3cf, muscles: 0xa83244, nerves: 0xf2e08a,
    heart: 0xd83a4e, lungs: 0xd79bb0, brain: 0xc9b5d6, body: 0xe9c39a,
    liver: 0x9d503f, kidneys: 0xa45b73, spleen: 0x7d3a52, pancreas: 0xd8a85a, intestines: 0xd88961,
  };
  const ORGAN_KEYS = new Set(['heart', 'lungs', 'brain', 'liver', 'kidneys', 'spleen', 'pancreas', 'intestines']);
  const sharedMats: Record<string, THREE.MeshStandardMaterial> = {};
  const matFor = (key: string) => {
    if (sharedMats[key]) return sharedMats[key];
    const tint = SYS_TINT[key] ?? SYS_TINT.body;
    const isSkin = key === 'body';
    const opaque = key === 'skeleton';
    const isBone = key === 'skeleton';
    const isOrgan = ORGAN_KEYS.has(key);

    // Organs get a wet, fleshy MeshPhysicalMaterial — clearcoat for a moist
    // sheen, sheen for soft back-scatter, low self-emission so the light rig and
    // the environment reflections (not a flat glow) define their form.
    const mat: THREE.MeshStandardMaterial = isOrgan
      ? new THREE.MeshPhysicalMaterial({
          color: tint, emissive: tint, emissiveIntensity: 0.12,
          metalness: 0.0, roughness: 0.4,
          clearcoat: 0.72, clearcoatRoughness: 0.38,
          sheen: 0.55, sheenColor: new THREE.Color(tint), sheenRoughness: 0.6,
          transparent: true, opacity: 0.96, depthWrite: true,
          envMapIntensity: 1.25, side: THREE.FrontSide,
        })
      : new THREE.MeshStandardMaterial({
          color: tint, emissive: tint,
          emissiveIntensity: isBone ? 0.22 : isSkin ? 0.07 : 0.4,
          metalness: isBone ? 0.05 : 0.12, roughness: isBone ? 0.82 : 0.5,
          transparent: !opaque,
          // Skin barely visible so the organs read through it.
          opacity: isSkin ? 0.2 : 0.86,
          depthWrite: opaque,
          envMapIntensity: 0.9,
          side: THREE.FrontSide,
        });
    if (isSkin)                 enrich(mat, { rim: 0.9, detail: 0.32, detailScale: 34, striation: 0.35, bump: 0.25 });
    else if (isBone)            enrich(mat, { rim: 0.5, detail: 0.5, detailScale: 50, bump: 1.1, tex: grainTex, texAmt: 0.5, texScale: 1.8 });
    else if (key === 'muscles') enrich(mat, { detail: 0.7, detailScale: 36, striation: 1.0, bump: 0.95, tex: muscleTex, texAmt: 0.6, texScale: 1.2 });
    else if (isOrgan)           enrich(mat, { detail: 0.5, detailScale: 46, bump: 0.85, tex: grainTex, texAmt: 0.4, texScale: 1.7 });
    else                        enrich(mat, { detail: 0.4, detailScale: 32, bump: 0.55, tex: grainTex, texAmt: 0.35, texScale: 1.3 });
    sharedMats[key] = mat;
    return mat;
  };

  // ── Model container + lazy skeleton + lazy organs ───────────────────────────
  const modelGroup = new THREE.Group();
  const skeletonGroup = new THREE.Group();
  skeletonGroup.visible = false;
  // Internal organs share one HuBMAP coordinate frame, so a single affine map
  // (see ORGAN_FIT) registers the whole cluster inside the body surface.
  const organsGroup = new THREE.Group();
  organsGroup.visible = false;
  organsGroup.scale.setScalar(ORGAN_FIT.scale);
  organsGroup.position.set(...ORGAN_FIT.position);
  floatGroup.add(modelGroup);
  floatGroup.add(skeletonGroup);
  floatGroup.add(organsGroup);

  const gltfLoader = new GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);

  const anatomyTargets: THREE.Mesh[] = [];
  const breathers: Array<{ obj: THREE.Object3D; base: THREE.Vector3 }> = [];
  let glbBodyRoot: THREE.Object3D | null = null;

  // Normalize a loaded model into a consistent body-space frame so the body and
  // skeleton stay registered: head-top ≈ 1.55, feet ≈ -1.25.
  const ingest = (root: THREE.Object3D, kind: 'body' | 'skeleton') => {
    const FRAME_TOP = 1.55, FRAME_BOTTOM = -1.25;
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3(); box.getSize(size);
    const center = new THREE.Vector3(); box.getCenter(center);
    const scale = size.y > 0 ? (FRAME_TOP - FRAME_BOTTOM) / size.y : 1;
    root.scale.setScalar(scale);
    root.position.set(-center.x * scale, FRAME_TOP - box.max.y * scale, -center.z * scale);

    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      const nm = obj.name || obj.parent?.name || '';
      const key = anatomyKeyForMeshName(nm) ?? (kind === 'skeleton' ? 'skeleton' : 'body');
      obj.material = matFor(key);
      obj.frustumCulled = true;
      obj.userData.anatomyKey = key;
      obj.userData.anatomyName = cleanAnatomyName(nm);
      anatomyTargets.push(obj);
    });

    if (kind === 'skeleton') {
      skeletonGroup.add(root);
    } else {
      glbBodyRoot = root;
      modelGroup.add(root);
      breathers.push({ obj: root, base: root.scale.clone() });
    }
  };

  gltfLoader.load(ANATOMY_BODY_URL, (g) => ingest(g.scene, 'body'), undefined,
    (err) => console.warn('[BodyExplorer3D] body model load failed:', err));

  let skeletonRequested = false;
  const loadSkeleton = () => {
    if (skeletonRequested) return;
    skeletonRequested = true;
    gltfLoader.load(ANATOMY_SKELETON_URL, (g) => ingest(g.scene, 'skeleton'), undefined,
      (err) => { skeletonRequested = false; console.warn('[BodyExplorer3D] skeleton model load failed:', err); });
  };

  // Drop a real open-source organ GLB into the shared organ frame, tag every
  // mesh so a click resolves to its atlas record, and tint it to the system.
  const ingestOrgan = (root: THREE.Object3D, entry: typeof ORGAN_MODELS[number]) => {
    root.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      obj.material = matFor(entry.anatomyKey);
      obj.frustumCulled = true;
      obj.userData.anatomyKey = entry.anatomyKey;
      obj.userData.anatomyName = entry.label;
      anatomyTargets.push(obj);
    });
    organsGroup.add(root);
  };

  let organsRequested = false;
  const loadOrgans = () => {
    if (organsRequested) return;
    organsRequested = true;
    // Lightest organs first so something appears quickly; each is best-effort.
    for (const entry of ORGAN_MODELS) {
      gltfLoader.load(entry.url, (g) => ingestOrgan(g.scene, entry), undefined,
        (err) => console.warn(`[BodyExplorer3D] organ "${entry.id}" load failed:`, err));
    }
  };

  const setLayerVisible = (key: LayerKey, visible: boolean) => {
    if (key === 'body') { modelGroup.visible = visible; }
    else if (key === 'organs') { if (visible) loadOrgans(); organsGroup.visible = visible; }
    else { if (visible) loadSkeleton(); skeletonGroup.visible = visible; }
  };

  // ── Pointer interaction ─────────────────────────────────────────────────────
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const worldVisible = (o: THREE.Object3D | null): boolean => {
    for (let n = o; n; n = n.parent) if (!n.visible) return false;
    return true;
  };
  const pick = (cx: number, cy: number): { key: string; name: string } | null => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((cx - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((cy - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const visible = anatomyTargets.filter(worldVisible);
    const hits = raycaster.intersectObjects(visible);
    if (!hits.length) return null;
    const obj = hits[0].object;
    return { key: obj.userData.anatomyKey as string, name: obj.userData.anatomyName as string };
  };

  const resolveTag = (key: string): PickTag | null => {
    const rec = KEY_TO_RECORD[key];
    return rec ? { id: rec.id, scale: rec.scale } : null;
  };

  function handleClick(ev: MouseEvent | TouchEvent) {
    try {
      let cx: number, cy: number;
      if ('changedTouches' in ev) { const t = ev.changedTouches[0]; if (!t) return; cx = t.clientX; cy = t.clientY; }
      else { cx = (ev as MouseEvent).clientX; cy = (ev as MouseEvent).clientY; }
      const hit = pick(cx, cy);
      if (!hit) return;
      cb.onPick(resolveTag(hit.key), hit.name);
    } catch (err) {
      console.warn('[BodyExplorer3D] click handler error (ignored):', err);
    }
  }
  let lastHoverKey: string | null = null;
  function handleMove(ev: MouseEvent) {
    const hit = pick(ev.clientX, ev.clientY);
    const tag = hit ? resolveTag(hit.key) : null;
    canvas.style.cursor = tag ? 'pointer' : 'grab';
    const key = tag?.id ?? null;
    if (key === lastHoverKey) return;
    lastHoverKey = key;
    cb.onHover(tag);
  }
  canvas.addEventListener('click', handleClick);
  canvas.addEventListener('touchend', handleClick as EventListener);
  canvas.addEventListener('pointermove', handleMove);

  // ── Animation loop ──────────────────────────────────────────────────────────
  let rafId = 0;
  let lastTime = performance.now();
  let bloomFailed = false;
  let frameWarned = false;

  function animate() {
    rafId = requestAnimationFrame(animate);
    try {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      timeUniform.value += dt;
      applyZoom(dt);
      controls.update();

      // Drift the shared nebula exactly as the main galaxy scene does.
      nebula.material.uniforms.uTime.value = timeUniform.value;
      nebula.mesh.rotation.y = timeUniform.value * 0.003;

      // Serene float + the faintest breathing swell of the body.
      floatGroup.position.y = Math.sin(timeUniform.value * 0.55) * 0.035;
      floatGroup.rotation.z = Math.sin(timeUniform.value * 0.32) * 0.012;
      const breath = 1 + Math.sin(timeUniform.value * 0.9) * 0.012;
      for (const b of breathers) b.obj.scale.set(b.base.x, b.base.y * breath, b.base.z);

      if (composer && renderPass) {
        try {
          renderPass.scene = scene;
          renderPass.camera = camera;
          composer.render();
        } catch (e) {
          if (!bloomFailed) { console.warn('[BodyExplorer3D] bloom failed — switching to plain render:', e); bloomFailed = true; }
          composer = null; renderPass = null;
          renderer.render(scene, camera);
        }
      } else {
        renderer.render(scene, camera);
      }
    } catch (err) {
      if (!frameWarned) { console.warn('[BodyExplorer3D] frame skipped (continuing):', err); frameWarned = true; }
    }
  }

  const onVisChange = () => {
    if (document.hidden) { cancelAnimationFrame(rafId); rafId = 0; }
    else { lastTime = performance.now(); animate(); }
  };
  document.addEventListener('visibilitychange', onVisChange);
  animate();

  const resize = () => {
    const rw = Math.max(canvas.clientWidth, 1), rh = Math.max(canvas.clientHeight, 1);
    renderer.setSize(rw, rh, false);
    composer?.setSize(rw, rh);
    bloomPass?.resolution.set(Math.max(rw * 0.5, 1), Math.max(rh * 0.5, 1));
    camera.aspect = rw / rh;
    camera.updateProjectionMatrix();
  };
  const resizeObs = new ResizeObserver(resize);
  resizeObs.observe(canvas);

  return {
    loadSkeleton,
    loadOrgans,
    setLayerVisible,
    resize,
    cleanup() {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisChange);
      resizeObs.disconnect();
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchend', handleClick as EventListener);
      canvas.removeEventListener('pointermove', handleMove);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchmove', onTouchPinch);
      canvas.removeEventListener('touchend', onTouchPinchEnd);
      controls.dispose();
      composer?.dispose();
      detailTextures.forEach((t) => t.dispose());
      Object.values(sharedMats).forEach((m) => m.dispose());
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.Points) o.geometry?.dispose();
      });
      nebula.material.dispose();
      scene.environment = null;
      envTexture.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch { /* noop */ }
    },
  };
}

// ─── React component ──────────────────────────────────────────────────────────
interface Props {
  /** Currently selected atlas record id (e.g. "organ:heart"), reflected in the layers. */
  selectedId?: string | null;
  onSelect: (tag: PickTag | null) => void;
  onHover: (tag: PickTag | null) => void;
  className?: string;
}

const LAYERS: { key: LayerKey; label: string; icon: React.ReactNode }[] = [
  { key: 'body', label: 'Body surface', icon: <Layers className="h-3.5 w-3.5" /> },
  { key: 'organs', label: 'Internal organs', icon: <HeartPulse className="h-3.5 w-3.5" /> },
  { key: 'skeletal', label: 'Skeleton', icon: <Bone className="h-3.5 w-3.5" /> },
];

/**
 * Organism screen. Mounts the real Z-Anatomy 3D body explorer and wires its
 * tissue-level clicks into Bio Galaxy's selection so the detail panel updates.
 */
export const BodyExplorer3D: React.FC<Props> = ({ selectedId, onSelect, onHover, className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const cbRef = useRef({ onSelect, onHover });
  cbRef.current = { onSelect, onHover };

  const [layers, setLayers] = useState<Set<LayerKey>>(() => new Set<LayerKey>(['body']));
  const [picked, setPicked] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: SceneHandle | null = null;
    try {
      handle = buildScene(canvas, {
        onPick: (tag, title) => { setPicked(title); cbRef.current.onSelect(tag); },
        onHover: (tag) => cbRef.current.onHover(tag),
      });
      sceneRef.current = handle;
      setReady(true);
    } catch (err) {
      console.error('[BodyExplorer3D] failed to build scene:', err);
    }
    return () => { handle?.cleanup(); sceneRef.current = null; };
  }, []);

  // Apply layer visibility whenever the toggle set changes.
  useEffect(() => {
    const s = sceneRef.current;
    if (!s) return;
    for (const { key } of LAYERS) s.setLayerVisible(key, layers.has(key));
  }, [layers, ready]);

  // Reveal the matching layer when a record is selected elsewhere: the skeleton
  // for bone records, and the internal organs for any organ / soft-tissue system.
  useEffect(() => {
    if (!selectedId) return;
    const reveal = (key: LayerKey) => setLayers((prev) => prev.has(key) ? prev : new Set(prev).add(key));
    if (selectedId === 'system:skeletal') reveal('skeletal');
    else if (selectedId.startsWith('organ:') || selectedId.startsWith('system:')) reveal('organs');
  }, [selectedId]);

  const toggle = (key: LayerKey) => setLayers((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  return (
    <div className={`absolute inset-0 ${className ?? ''}`}>
      <canvas ref={canvasRef} className="h-full w-full" style={{ display: 'block', touchAction: 'none', cursor: 'grab' }} />

      {/* Layer controls — the explorer's see-through stack. */}
      <div className="pointer-events-auto absolute left-3 top-3 z-20 flex flex-col gap-1.5 panel rounded-xl px-2.5 py-2 shadow-2xl shadow-black/40">
        <span className="meta-label px-1">Anatomy layers</span>
        {LAYERS.map(({ key, label, icon }) => {
          const on = layers.has(key);
          return (
            <button key={key} onClick={() => toggle(key)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] font-semibold transition ${on ? 'border-cyan-300/60 bg-cyan-400/15 text-slate-100' : 'border-white/10 bg-[#07101d]/85 text-slate-400 hover:border-cyan-300/40'}`}>
              {icon}<span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Provenance + current pick. */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-20 max-w-xs">
        {picked && <div className="mb-1.5 inline-block rounded-lg bg-[#07101d]/85 px-3 py-1.5 text-[12px] font-semibold text-cyan-100 shadow-lg backdrop-blur">{picked}</div>}
        <div className="meta-label">Z-Anatomy body (CC-BY-SA 4.0) · HuBMAP CCF organs (CC-BY 4.0) · click a structure to inspect</div>
      </div>

      {!ready && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-400"><LoaderIcon className="h-4 w-4 animate-spin" /><span className="text-sm">Loading anatomy…</span></div>
        </div>
      )}
    </div>
  );
};

export default BodyExplorer3D;
