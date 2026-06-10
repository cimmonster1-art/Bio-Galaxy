import * as THREE from 'three';
import { Scale } from '../../types';
import { ANATOMY_ENTRIES } from '../../data/anatomy';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createMembraneMaterial } from '../shaders/membrane';

export interface ModelProvenance { label: string; url?: string; external: boolean; }
const DEFAULT_PROVENANCE: ModelProvenance = { label: 'Z-Anatomy and BodyParts3D reference visualization', url: 'https://github.com/Z-Anatomy/Models-of-human-anatomy', external: false };
type ModelFormat = 'gltf' | 'glb' | 'fbx';

/** Layered human atlas with separately selectable systems and organs. */
export class AnatomyModelLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Organism, Scale.OrganSystem, Scale.Organ];
  private readonly atlas = new THREE.Group();
  private readonly systemGroups = new Map<string, THREE.Group>();
  private readonly pickables: THREE.Object3D[] = [];
  private readonly animated: { object: THREE.Object3D; base: number; speed: number }[] = [];
  private loaded: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private intensity = 0;
  private currentScale = Scale.Organism;
  private organismId = 'homo_sapiens';
  private provenance = DEFAULT_PROVENANCE;

  constructor() {
    this.root.name = 'AnatomyModelLayer';
    this.root.visible = false;
    this.buildAtlas();
    this.root.add(this.atlas);
  }

  get modelProvenance(): ModelProvenance { return this.provenance; }

  setOrganism(taxonId: string): void {
    this.organismId = taxonId;
    const tag = this.atlas.userData.pick as { id: string; scale: Scale };
    if (tag) tag.id = `organism:${taxonId}`;
  }

  async loadModel(url: string, provenance: ModelProvenance): Promise<boolean> {
    try {
      const { object, animations } = await loadObject(url, formatFromUrl(url));
      this.clearLoaded();
      this.normalizeModel(object);
      object.userData.pick = { id: `organism:${this.organismId}`, scale: Scale.Organism };
      object.traverse((child) => { if (!child.userData.pick) child.userData.pick = object.userData.pick; });
      this.loaded = object;
      this.root.add(object);
      if (animations.length) { this.mixer = new THREE.AnimationMixer(object); this.mixer.clipAction(animations[0]).play(); }
      this.provenance = { ...provenance, external: true };
      return true;
    } catch { this.provenance = DEFAULT_PROVENANCE; return false; }
  }

<<<<<<< HEAD
  private clearLoaded(): void {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer = null;
    }
    if (this.loaded) {
      disposeObject(this.loaded);
      this.loaded = null;
    }
  }

  /** Fit an arbitrary model into the scene's organism volume. */
  private normalizeModel(object: THREE.Object3D): void {
    this.enhanceShading(object);

    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 30 / maxDim;
    object.scale.setScalar(scale);
    object.position.sub(center.multiplyScalar(scale));
  }

  /**
   * Improve the shading of a freshly loaded mesh so the real anatomy model reads
   * well under the scene lighting. We lift the environment response, give flat
   * materials a sensible roughness, and keep thin anatomical surfaces visible
   * from both sides without losing correct front-facing normals.
   */
  private enhanceShading(object: THREE.Object3D): void {
    object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        const std = mat as THREE.MeshStandardMaterial;
        if (!std || (!std.isMeshStandardMaterial && !(std as THREE.MeshPhysicalMaterial).isMeshPhysicalMaterial)) {
          continue;
        }
        std.envMapIntensity = 1.1;
        std.side = THREE.FrontSide;
        // Flat materials with no metalness read as plastic; nudge them toward a
        // soft organic finish so the surface catches light.
        if (std.roughness >= 0.95 && std.metalness <= 0.05) {
          std.roughness = 0.65;
        }
        std.metalness = Math.min(std.metalness, 0.1);
        // Thin shells and cut surfaces should not vanish when viewed edge on.
        if (std.transparent || std.opacity < 1) {
          std.side = THREE.DoubleSide;
        }
        std.needsUpdate = true;
      }
    });
  }

  // ---- procedural fallback -------------------------------------------------

  private buildPlaceholder(): void {
    const bodyMat = createMembraneMaterial({
      color: '#16607a',
      rimColor: '#39d4e6',
      opacity: 0.05,
      rimPower: 2.6,
    });
    this.membranes.push(bodyMat);

=======
  private buildAtlas(): void {
    this.atlas.userData.pick = { id: `organism:${this.organismId}`, scale: Scale.Organism };
    this.pickables.push(this.atlas);
    const skin = createMembraneMaterial({ color: '#478ca3', rimColor: '#70e5f2', opacity: 0.09, rimPower: 2.4 });
>>>>>>> origin/main
    const body = new THREE.Group();
    const addSkin = (geometry: THREE.BufferGeometry, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0]) => {
      const mesh = new THREE.Mesh(geometry, skin); mesh.position.set(...position); mesh.rotation.set(...rotation); body.add(mesh);
    };
    addSkin(new THREE.SphereGeometry(2.65, 32, 24), [0, 12, 0]);
    addSkin(new THREE.CapsuleGeometry(4.2, 8.5, 12, 28), [0, 3, 0]);
    addSkin(new THREE.CapsuleGeometry(1.05, 9, 8, 18), [-5, 3, 0], [0, 0, .28]);
    addSkin(new THREE.CapsuleGeometry(1.05, 9, 8, 18), [5, 3, 0], [0, 0, -.28]);
    addSkin(new THREE.CapsuleGeometry(1.45, 10, 8, 20), [-2.15, -8.2, 0], [0, 0, .04]);
    addSkin(new THREE.CapsuleGeometry(1.45, 10, 8, 20), [2.15, -8.2, 0], [0, 0, -.04]);
    body.traverse((o) => { if (!o.userData.pick) o.userData.pick = this.atlas.userData.pick; });
    this.atlas.add(body);

    this.buildSkeleton();
    this.buildNervous();
    this.buildCardiovascular();
    this.buildRespiratory();
    this.buildDigestive();
    this.buildUrinary();
  }

  private system(id: string): THREE.Group {
    const group = new THREE.Group(); group.name = id; group.userData.pick = { id, scale: Scale.OrganSystem };
    this.systemGroups.set(id, group); this.atlas.add(group); this.pickables.push(group); return group;
  }

  private organ(id: string, group: THREE.Group, geometry: THREE.BufferGeometry, position: [number, number, number], color: string, scale: [number, number, number] = [1, 1, 1]): THREE.Mesh {
    const mat = new THREE.MeshPhysicalMaterial({ color, roughness: .48, clearcoat: .35, transparent: true, opacity: .92, emissive: new THREE.Color(color).multiplyScalar(.08) });
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(...position); mesh.scale.set(...scale); mesh.userData.pick = { id, scale: Scale.Organ };
    group.add(mesh); this.pickables.push(mesh); return mesh;
  }

  private buildSkeleton(): void {
    const g = this.system('system:skeletal'); const mat = new THREE.MeshStandardMaterial({ color: '#e8e1cf', roughness: .7, transparent: true, opacity: .62 });
    const bone = (a: THREE.Vector3, b: THREE.Vector3, r = .18) => { const d = b.clone().sub(a); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m); };
    bone(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 10, 0), .24);
    [[-1,10,0],[1,10,0],[-3.8,7,0],[3.8,7,0],[-5.7,0,0],[5.7,0,0],[-2,-3,0],[2,-3,0],[-2,-13,0],[2,-13,0]].forEach((p,i,a) => { if (i%2===0) bone(new THREE.Vector3(...p as [number,number,number]), new THREE.Vector3(...a[i+1] as [number,number,number]), .2); });
    for (let y=3; y<9; y+=1.1) { const curve = new THREE.EllipseCurve(0, y, 3.2-(y-5)*.12, 1.1, 0, Math.PI*2); const pts=curve.getPoints(28).map(p=>new THREE.Vector3(p.x,p.y,-.25)); g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:'#e8e1cf',transparent:true,opacity:.55}))); }
  }

  private buildNervous(): void { const g=this.system('system:nervous'); this.organ('organ:brain',g,new THREE.SphereGeometry(1.9,28,20),[0,12,0],'#f5b8c8',[1,.82,.86]); this.organ('system:nervous',g,new THREE.CylinderGeometry(.18,.28,12,12),[0,4.3,-.2],'#ffd65a'); }
  private buildCardiovascular(): void { const g=this.system('system:cardiovascular'); const h=this.organ('organ:heart',g,new THREE.SphereGeometry(1.2,24,20),[-.8,4.7,1.7],'#ff4058',[.85,1.2,.75]); this.animated.push({object:h,base:1,speed:4.6}); const mat=new THREE.LineBasicMaterial({color:'#ff596d',transparent:true,opacity:.72}); const pts=[new THREE.Vector3(-.8,5,1),new THREE.Vector3(0,2,1),new THREE.Vector3(0,-5,.5),new THREE.Vector3(-2,-13,0),new THREE.Vector3(0,-5,.5),new THREE.Vector3(2,-13,0),new THREE.Vector3(0,5,1),new THREE.Vector3(-5,1,0),new THREE.Vector3(0,5,1),new THREE.Vector3(5,1,0)]; g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),mat)); }
  private buildRespiratory(): void { const g=this.system('system:respiratory'); this.organ('organ:lungs',g,new THREE.SphereGeometry(1.8,24,20),[-2,5,.4],'#79d6df',[.85,1.55,.6]); this.organ('organ:lungs',g,new THREE.SphereGeometry(1.8,24,20),[2,5,.4],'#79d6df',[.85,1.55,.6]); this.organ('system:respiratory',g,new THREE.CylinderGeometry(.28,.42,5,12),[0,9,.4],'#78dce8'); }
  private buildDigestive(): void { const g=this.system('system:digestive'); this.organ('organ:liver',g,new THREE.SphereGeometry(1.8,24,18),[1.5,1.7,1.5],'#9d503f',[1.6,.65,.75]); this.organ('organ:stomach',g,new THREE.SphereGeometry(1.25,22,18),[-1.25,.4,1.7],'#e59b69',[1,.8,.72]); const gut=this.organ('organ:intestines',g,new THREE.TorusKnotGeometry(1.45,.3,90,10,2,3),[0,-2.6,1.3],'#d88961',[1.5,1.7,.55]); gut.rotation.x=.25; }
  private buildUrinary(): void { const g=this.system('system:urinary'); this.organ('organ:kidneys',g,new THREE.SphereGeometry(.75,20,16),[-1.65,-.2,.2],'#a45b73',[.7,1.35,.55]); this.organ('organ:kidneys',g,new THREE.SphereGeometry(.75,20,16),[1.65,-.2,.2],'#a45b73',[.7,1.35,.55]); }

  private normalizeModel(object: THREE.Object3D): void { const box=new THREE.Box3().setFromObject(object); const size=box.getSize(new THREE.Vector3()); const center=box.getCenter(new THREE.Vector3()); const s=30/(Math.max(size.x,size.y,size.z)||1); object.scale.setScalar(s); object.position.sub(center.multiplyScalar(s)); }
  private clearLoaded(): void { if(this.mixer){this.mixer.stopAllAction();this.mixer=null;} if(this.loaded){disposeObject(this.loaded);this.loaded=null;} }
  onScaleChange(scale: Scale,intensity:number):void{this.currentScale=scale;this.intensity=intensity;this.root.visible=intensity>.01;}
  update(dt:number,elapsed:number):void{ if(this.mixer)this.mixer.update(dt); const systemOpacity=this.currentScale===Scale.Organism?.42:.9; for(const group of this.systemGroups.values())group.traverse(o=>{const m=(o as THREE.Mesh).material as THREE.Material|undefined;if(m&&'opacity'in m)fadeMaterial(m,systemOpacity*this.intensity,dt);}); for(const a of this.animated){const s=a.base+Math.sin(elapsed*a.speed)*.07;a.object.scale.multiplyScalar(s/a.object.scale.x);} this.atlas.rotation.y=Math.sin(elapsed*.12)*.1; if(this.loaded)this.loaded.visible=this.currentScale===Scale.Organism; }
  getPickables():THREE.Object3D[]{return this.intensity>.2?(this.currentScale===Scale.Organism&&this.loaded?[this.loaded,...this.pickables]:this.pickables):[];}
  dispose():void{this.clearLoaded();disposeObject(this.root);}
}

<<<<<<< HEAD
// ---- loaders ----------------------------------------------------------------

function formatFromUrl(url: string): ModelFormat {
  const lower = url.toLowerCase();
  if (lower.endsWith('.glb')) return 'glb';
  if (lower.endsWith('.fbx')) return 'fbx';
  return 'gltf';
}

interface LoadedModel {
  object: THREE.Object3D;
  animations: THREE.AnimationClip[];
}

async function loadObject(url: string, format: ModelFormat): Promise<LoadedModel> {
  if (format === 'fbx') {
    const { FBXLoader } = await import('three/examples/jsm/loaders/FBXLoader.js');
    const object = await new FBXLoader().loadAsync(url);
    return { object, animations: object.animations ?? [] };
  }
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  // Z-Anatomy GLBs are meshopt-compressed (EXT_meshopt_compression), so the
  // decoder must be attached before loading or the parse fails.
  const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js');
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(url);
  return { object: gltf.scene, animations: gltf.animations ?? [] };
}
=======
function formatFromUrl(url:string):ModelFormat{const l=url.toLowerCase();return l.endsWith('.glb')?'glb':l.endsWith('.fbx')?'fbx':'gltf';}
async function loadObject(url:string,format:ModelFormat):Promise<{object:THREE.Object3D;animations:THREE.AnimationClip[]}>{if(format==='fbx'){const{FBXLoader}=await import('three/examples/jsm/loaders/FBXLoader.js');const object=await new FBXLoader().loadAsync(url);return{object,animations:object.animations??[]};}const{GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');const gltf=await new GLTFLoader().loadAsync(url);return{object:gltf.scene,animations:gltf.animations??[]};}
>>>>>>> origin/main
