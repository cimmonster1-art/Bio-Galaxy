import * as THREE from 'three';
import { Scale } from '../../types';
import { ANATOMY_ENTRIES } from '../../data/anatomy';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createMembraneMaterial } from '../shaders/membrane';

export interface ModelProvenance { label: string; url?: string; external: boolean; }
const DEFAULT_PROVENANCE: ModelProvenance = { label: 'Fitted anatomical systems', url: 'https://github.com/Z-Anatomy/Models-of-human-anatomy', external: false };
type ModelFormat = 'gltf' | 'glb' | 'fbx';

/** Layered human atlas with separately selectable systems and organs. */
export class AnatomyModelLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Organism, Scale.OrganSystem, Scale.Organ];
  private readonly atlas = new THREE.Group();
  private readonly atlasSurface = new THREE.Group();
  private readonly systemGroups = new Map<string, THREE.Group>();
  private readonly pickables: THREE.Object3D[] = [];
  private readonly animated: { object: THREE.Object3D; base: number; speed: number }[] = [];
  private loaded: THREE.Object3D | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private actions: THREE.AnimationAction[] = [];
  private intensity = 0;
  private currentScale = Scale.Organism;
  private selectedId: string | null = null;
  private cinematicProgress: number | null = null;
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
      this.prepareBodyMaterials(object);
      object.userData.pick = { id: `organism:${this.organismId}`, scale: Scale.Organism };
      object.traverse((child) => { if (!child.userData.pick) child.userData.pick = object.userData.pick; });
      this.loaded = object;
      this.atlasSurface.visible = false;
      this.atlas.add(object);
      if (animations.length) {
        this.mixer = new THREE.AnimationMixer(object);
        this.actions = animations.map((clip) => this.mixer!.clipAction(clip).play());
      }
      this.provenance = { ...provenance, external: true };
      return true;
    } catch { this.provenance = DEFAULT_PROVENANCE; return false; }
  }

  private buildAtlas(): void {
    this.atlas.userData.pick = { id: `organism:${this.organismId}`, scale: Scale.Organism };
    this.pickables.push(this.atlas);
    const skin = createMembraneMaterial({ color: '#478ca3', rimColor: '#70e5f2', opacity: 0.09, rimPower: 2.4 });
    const body = this.atlasSurface;
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
    // Wet, fleshy organ surface: clearcoat for a moist sheen, sheen for soft
    // back-scatter, and a faint self-emissive so organs read in the dim atlas.
    const mat = new THREE.MeshPhysicalMaterial({
      color,
      roughness: .42,
      clearcoat: .6,
      clearcoatRoughness: .35,
      sheen: .6,
      sheenColor: new THREE.Color(color),
      sheenRoughness: .5,
      transparent: true,
      opacity: .92,
      emissive: new THREE.Color(color).multiplyScalar(.12),
      emissiveIntensity: .4,
      envMapIntensity: 1.1,
    });
    const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(...position); mesh.scale.set(...scale); mesh.userData.pick = { id, scale: Scale.Organ };
    group.add(mesh); this.pickables.push(mesh); return mesh;
  }

  /** A glowing vessel/nerve swept as a smooth tube along a path of control points. */
  private vessel(id: string, group: THREE.Group, points: THREE.Vector3[], color: string, radius = .12): THREE.Mesh {
    const curve = new THREE.CatmullRomCurve3(points);
    const geo = new THREE.TubeGeometry(curve, Math.max(24, points.length * 8), radius, 8, false);
    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: new THREE.Color(color),
      emissiveIntensity: .55,
      roughness: .5,
      metalness: .05,
      transparent: true,
      opacity: .82,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.pick = { id, scale: Scale.OrganSystem };
    group.add(mesh);
    return mesh;
  }

  private buildSkeleton(): void {
    const g = this.system('system:skeletal'); const mat = new THREE.MeshStandardMaterial({ color: '#e8e1cf', roughness: .7, transparent: true, opacity: .62 });
    const bone = (a: THREE.Vector3, b: THREE.Vector3, r = .18) => { const d = b.clone().sub(a); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 10), mat); m.position.copy(a).add(b).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(m); };
    bone(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, 10, 0), .24);
    [[-1,10,0],[1,10,0],[-3.8,7,0],[3.8,7,0],[-5.7,0,0],[5.7,0,0],[-2,-3,0],[2,-3,0],[-2,-13,0],[2,-13,0]].forEach((p,i,a) => { if (i%2===0) bone(new THREE.Vector3(...p as [number,number,number]), new THREE.Vector3(...a[i+1] as [number,number,number]), .2); });
    for (let y=3; y<9; y+=1.1) { const curve = new THREE.EllipseCurve(0, y, 3.2-(y-5)*.12, 1.1, 0, Math.PI*2); const pts=curve.getPoints(28).map(p=>new THREE.Vector3(p.x,p.y,-.25)); g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({color:'#e8e1cf',transparent:true,opacity:.55}))); }
  }

  private buildNervous(): void {
    const g = this.system('system:nervous');
    this.organ('organ:brain', g, new THREE.SphereGeometry(1.9, 40, 32), [0, 12, 0], '#f5b8c8', [1, .82, .86]);
    // Spinal cord as a smooth cord, with peripheral nerves branching as tubes.
    this.vessel('system:nervous', g, [
      new THREE.Vector3(0, 10, -.2), new THREE.Vector3(0, 6, -.3),
      new THREE.Vector3(0, 1, -.2), new THREE.Vector3(0, -3, -.1),
    ], '#ffd65a', .2);
    const nerve = (pts: THREE.Vector3[]) => this.vessel('system:nervous', g, pts, '#ffe08a', .07);
    nerve([new THREE.Vector3(0, 6, -.3), new THREE.Vector3(-3.5, 5.5, 0), new THREE.Vector3(-5.5, 2, 0)]);
    nerve([new THREE.Vector3(0, 6, -.3), new THREE.Vector3(3.5, 5.5, 0), new THREE.Vector3(5.5, 2, 0)]);
    nerve([new THREE.Vector3(0, -3, -.1), new THREE.Vector3(-2, -8, 0), new THREE.Vector3(-2, -13, 0)]);
    nerve([new THREE.Vector3(0, -3, -.1), new THREE.Vector3(2, -8, 0), new THREE.Vector3(2, -13, 0)]);
  }
  private buildCardiovascular(): void {
    const g = this.system('system:cardiovascular');
    const h = this.organ('organ:heart', g, new THREE.SphereGeometry(1.2, 32, 26), [-.8, 4.7, 1.7], '#ff4058', [.85, 1.2, .75]);
    this.animated.push({ object: h, base: 1, speed: 4.6 });
    // Aorta and major arteries as glowing red tubes; venous return in blue.
    const artery = (pts: THREE.Vector3[]) => this.vessel('system:cardiovascular', g, pts, '#ff5066', .13);
    const vein = (pts: THREE.Vector3[]) => this.vessel('system:cardiovascular', g, pts, '#4f78d6', .11);
    artery([new THREE.Vector3(-.8, 5.4, 1), new THREE.Vector3(0, 6.4, .6), new THREE.Vector3(0, 2, .8), new THREE.Vector3(0, -4, .5)]);
    artery([new THREE.Vector3(0, -4, .5), new THREE.Vector3(-2, -9, .2), new THREE.Vector3(-2, -13, 0)]);
    artery([new THREE.Vector3(0, -4, .5), new THREE.Vector3(2, -9, .2), new THREE.Vector3(2, -13, 0)]);
    artery([new THREE.Vector3(0, 5.5, .8), new THREE.Vector3(-3.5, 4.5, .4), new THREE.Vector3(-5, 1, 0)]);
    artery([new THREE.Vector3(0, 5.5, .8), new THREE.Vector3(3.5, 4.5, .4), new THREE.Vector3(5, 1, 0)]);
    vein([new THREE.Vector3(-2, -13, .2), new THREE.Vector3(-1.4, -6, .6), new THREE.Vector3(-.4, 4.4, 1.2)]);
    vein([new THREE.Vector3(2, -13, .2), new THREE.Vector3(1.4, -6, .6), new THREE.Vector3(-.4, 4.4, 1.2)]);
  }
  private buildRespiratory(): void { const g=this.system('system:respiratory'); this.organ('organ:lungs',g,new THREE.SphereGeometry(1.8,32,26),[-2,5,.4],'#79d6df',[.85,1.55,.6]); this.organ('organ:lungs',g,new THREE.SphereGeometry(1.8,32,26),[2,5,.4],'#79d6df',[.85,1.55,.6]); this.vessel('system:respiratory',g,[new THREE.Vector3(0,10.5,.4),new THREE.Vector3(0,7.5,.4),new THREE.Vector3(0,6.2,.4)],'#78dce8',.34); this.vessel('system:respiratory',g,[new THREE.Vector3(0,6.4,.4),new THREE.Vector3(-1.2,5.6,.4),new THREE.Vector3(-2,5,.4)],'#78dce8',.16); this.vessel('system:respiratory',g,[new THREE.Vector3(0,6.4,.4),new THREE.Vector3(1.2,5.6,.4),new THREE.Vector3(2,5,.4)],'#78dce8',.16); }
  private buildDigestive(): void { const g=this.system('system:digestive'); this.organ('organ:liver',g,new THREE.SphereGeometry(1.8,32,24),[1.5,1.7,1.5],'#9d503f',[1.6,.65,.75]); this.organ('organ:stomach',g,new THREE.SphereGeometry(1.25,28,22),[-1.25,.4,1.7],'#e59b69',[1,.8,.72]); this.organ('organ:pancreas',g,new THREE.CapsuleGeometry(.32,1.6,8,14),[.2,.1,1.4],'#d8a85a',[1,1,1]).rotation.z=.5; this.organ('organ:spleen',g,new THREE.SphereGeometry(.7,24,18),[-2.4,1.1,1],'#7d3a52',[1,1.3,.7]); const gut=this.organ('organ:intestines',g,new THREE.TorusKnotGeometry(1.45,.3,128,12,2,3),[0,-2.6,1.3],'#d88961',[1.5,1.7,.55]); gut.rotation.x=.25; }
  private buildUrinary(): void { const g=this.system('system:urinary'); this.organ('organ:kidneys',g,new THREE.SphereGeometry(.75,28,20),[-1.65,-.2,.2],'#a45b73',[.7,1.35,.55]); this.organ('organ:kidneys',g,new THREE.SphereGeometry(.75,28,20),[1.65,-.2,.2],'#a45b73',[.7,1.35,.55]); this.organ('organ:bladder',g,new THREE.SphereGeometry(.8,24,18),[0,-6.5,1],'#c9a24a',[1,.85,.85]); this.vessel('system:urinary',g,[new THREE.Vector3(-1.65,-.6,.2),new THREE.Vector3(-.8,-3.5,.6),new THREE.Vector3(0,-6,1)],'#caa657',.06); this.vessel('system:urinary',g,[new THREE.Vector3(1.65,-.6,.2),new THREE.Vector3(.8,-3.5,.6),new THREE.Vector3(0,-6,1)],'#caa657',.06); }

  private prepareBodyMaterials(object: THREE.Object3D): void {
    object.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mesh.material = materials.map((source) => {
        const material = source.clone();
        material.transparent = true;
        material.opacity = 0.58;
        material.depthWrite = false;
        if ('emissive' in material) {
          const glowing = material as THREE.MeshStandardMaterial;
          glowing.emissive = new THREE.Color('#24d9ff');
          glowing.emissiveIntensity = 0.22;
        }
        return material;
      });
    });
  }

  private normalizeModel(object: THREE.Object3D): void { const box=new THREE.Box3().setFromObject(object); const size=box.getSize(new THREE.Vector3()); const center=box.getCenter(new THREE.Vector3()); const s=30/(Math.max(size.x,size.y,size.z)||1); object.scale.setScalar(s); object.position.sub(center.multiplyScalar(s)); }
  private clearLoaded(): void { if(this.mixer){this.mixer.stopAllAction();this.mixer=null;} this.actions=[]; if(this.loaded){this.loaded.removeFromParent();disposeObject(this.loaded);this.loaded=null;} this.atlasSurface.visible=true; }
  setSelected(id: string | null): void { this.selectedId = id?.startsWith('organ:') || id?.startsWith('system:') ? id : null; }
  setCinematicProgress(progress: number | null): void { this.cinematicProgress = progress; }
  onScaleChange(scale: Scale,intensity:number):void{this.currentScale=scale;this.intensity=intensity;this.root.visible=intensity>.01;}
  update(dt:number,elapsed:number):void{ const cinematic=this.cinematicProgress!==null; for(const action of this.actions)action.paused=!cinematic; if(this.mixer)this.mixer.update(dt); this.updateAnatomyVisibility(); const systemOpacity=this.currentScale===Scale.Organism?0:.9; for(const group of this.systemGroups.values())group.traverse(o=>{const m=(o as THREE.Mesh).material as THREE.Material|undefined;if(m&&'opacity'in m)fadeMaterial(m,systemOpacity*this.intensity,dt);}); for(const a of this.animated){const s=a.base+Math.sin(elapsed*a.speed)*.07;a.object.scale.multiplyScalar(s/a.object.scale.x);} this.atlas.rotation.y=cinematic?elapsed*.35:Math.sin(elapsed*.12)*.1; if(this.loaded){this.loaded.visible=true;this.loaded.traverse(o=>{const m=(o as THREE.Mesh).material;if(!m)return;for(const mat of (Array.isArray(m)?m:[m])){mat.opacity=this.currentScale===Scale.Organism?.78:.1; if('emissiveIntensity'in mat)(mat as THREE.MeshStandardMaterial).emissiveIntensity=cinematic?.55:.22;}});} }
  private updateAnatomyVisibility(): void {
    const organismView = this.currentScale === Scale.Organism;
    for (const [id, group] of this.systemGroups) {
      let containsSelection = false;
      group.traverse((object) => { if (object.userData.pick?.id === this.selectedId) containsSelection = true; });
      group.visible = !organismView && (!this.selectedId || id === this.selectedId || containsSelection);
      if (this.currentScale !== Scale.Organ) {
        for (const child of group.children) child.traverse((object) => { object.visible = true; });
        continue;
      }
      group.traverse((object) => {
        if (object === group) return;
        const pick = object.userData.pick as { id?: string; scale?: Scale } | undefined;
        object.visible = pick?.scale === Scale.Organ && (!this.selectedId || pick.id === this.selectedId);
      });
    }
  }
  getPickables():THREE.Object3D[]{return this.intensity>.2?(this.currentScale===Scale.Organism&&this.loaded?[this.loaded,...this.pickables]:this.pickables):[];}
  dispose():void{this.clearLoaded();disposeObject(this.root);}
}

function formatFromUrl(url:string):ModelFormat{const l=url.toLowerCase();return l.endsWith('.glb')?'glb':l.endsWith('.fbx')?'fbx':'gltf';}
async function loadObject(url:string,format:ModelFormat):Promise<{object:THREE.Object3D;animations:THREE.AnimationClip[]}>{if(format==='fbx'){const{FBXLoader}=await import('three/examples/jsm/loaders/FBXLoader.js');const object=await new FBXLoader().loadAsync(url);return{object,animations:object.animations??[]};}const{GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');const gltf=await new GLTFLoader().loadAsync(url);return{object:gltf.scene,animations:gltf.animations??[]};}
