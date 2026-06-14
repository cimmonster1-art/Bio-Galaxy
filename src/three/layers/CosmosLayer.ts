import * as THREE from 'three';
import { PickTag, Scale } from '../../types';
import { SceneLayer, fadeMaterial } from '../core/SceneLayer';
import { disposeObject } from '../core/dispose';
import { createGlowTexture } from '../textures/proceduralTextures';
import { galaxySceneStars } from '../../data/stars';

/**
 * The cosmic backdrop: a luminous core standing in for the Big Bang and
 * galactic center, a deep field of distant galaxies, and a spiral galaxy that
 * resolves as the camera approaches the galaxy scale. Instanced throughout so
 * thousands of points cost only a couple of draw calls. Not pickable; it sets
 * the stage above the solar system.
 *
 * When the history cutscene plays, the core erupts into a Big Bang: a blinding
 * singularity flash, an expanding recombination shock ring, and a burst of
 * primordial shards that fly outward and cool, all keyed to cinematic progress so
 * the opening epoch reads as a directed sequence rather than a static backdrop.
 */
export class CosmosLayer implements SceneLayer {
  readonly root = new THREE.Group();
  readonly activeScales = [Scale.Cosmos, Scale.Galaxy];

  private readonly field: THREE.InstancedMesh;
  private readonly fieldMat: THREE.MeshBasicMaterial;
  private readonly spiral: THREE.InstancedMesh;
  private readonly spiralMat: THREE.MeshBasicMaterial;
  private readonly core: THREE.Mesh;
  private readonly coreMat: THREE.MeshBasicMaterial;
  private readonly coreGlow: THREE.Sprite;
  private readonly coreGlowMat: THREE.SpriteMaterial;
  private readonly dust: THREE.Points;
  private readonly dustMat: THREE.PointsMaterial;

  // Real catalogue stars (HYG / Bright Star Catalogue) placed on the surrounding
  // celestial shell, each individually pickable, beyond the Oort Cloud.
  private readonly catalogStars: THREE.InstancedMesh;
  private readonly catalogStarsMat: THREE.MeshBasicMaterial;
  private readonly catalogGlow: THREE.Points;
  private readonly catalogGlowMat: THREE.PointsMaterial;

  // Cosmic web: a particle field condensed into filaments and cluster knots, so
  // the large-scale structure reads as glowing cosmic matter — not a graph.
  private readonly web: THREE.Points;
  private readonly webMat: THREE.PointsMaterial;

  // Big Bang cutscene elements.
  private readonly bang = new THREE.Group();
  private readonly flash: THREE.Sprite;
  private readonly flashMat: THREE.SpriteMaterial;
  private readonly shock: THREE.Mesh;
  private readonly shockMat: THREE.MeshBasicMaterial;
  private readonly shards: THREE.Points;
  private readonly shardMat: THREE.PointsMaterial;
  private readonly shardDirs: Float32Array;
  private readonly shardGeo: THREE.BufferGeometry;
  private readonly glowTex: THREE.Texture;
  private cinematic: number | null = null;

  private intensity = 0;
  private currentScale: Scale = Scale.Cosmos;

  constructor() {
    this.root.name = 'CosmosLayer';
    this.root.visible = false;
    this.glowTex = createGlowTexture(256);

    // Bright core: the Big Bang origin and, later, the galactic center.
    this.coreMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#fff1d6'),
      transparent: true,
      opacity: 0,
    });
    this.core = new THREE.Mesh(new THREE.SphereGeometry(6, 32, 32), this.coreMat);
    this.core.userData.pick = { id: 'galaxy', scale: Scale.Galaxy };
    this.root.add(this.core);

    // Bright additive halo so the galactic core blooms instead of reading as a
    // hard ball — the luminous heart of the spiral.
    this.coreGlowMat = new THREE.SpriteMaterial({
      map: this.glowTex,
      color: new THREE.Color('#ffe9c2'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.coreGlow = new THREE.Sprite(this.coreGlowMat);
    this.coreGlow.scale.setScalar(46);
    this.root.add(this.coreGlow);

    // Deep field of distant galaxies.
    const fieldCount = 1800;
    this.fieldMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.field = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7, 0), this.fieldMat, fieldCount);
    this.field.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(fieldCount * 3), 3);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < fieldCount; i++) {
      const dir = randomDir();
      const r = 90 + Math.random() * 460;
      dummy.position.copy(dir.multiplyScalar(r));
      dummy.scale.setScalar(0.5 + Math.random() * 2.4);
      dummy.updateMatrix();
      this.field.setMatrixAt(i, dummy.matrix);
      color.setHSL((200 + Math.random() * 120) / 360, 0.5, 0.55 + Math.random() * 0.3);
      this.field.setColorAt(i, color);
    }
    this.field.instanceMatrix.needsUpdate = true;
    this.field.userData.pick = { id: 'cosmos', scale: Scale.Cosmos };
    this.root.add(this.field);

    // Spiral galaxy that resolves near the galaxy scale.
    const spiralCount = 4200;
    this.spiralMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.spiral = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.4, 0), this.spiralMat, spiralCount);
    this.spiral.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(spiralCount * 3), 3);
    const warm = new THREE.Color('#ffe7b3');
    const cool = new THREE.Color('#8fbfff');
    for (let i = 0; i < spiralCount; i++) {
      const t = i / spiralCount;
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const radius = 8 + t * 130;
      const angle = arm + t * 9 + (Math.random() - 0.5) * 0.5;
      // Tighter scatter than before so the two logarithmic arms stay distinct.
      const spread = (1 - t) * 2 + 0.6;
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * spread;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * spread;
      const y = (Math.random() - 0.5) * (3 + (1 - t) * 8);
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.75 + Math.random() * 1.65);
      dummy.updateMatrix();
      this.spiral.setMatrixAt(i, dummy.matrix);
      color.copy(cool).lerp(warm, Math.max(0, 1 - t * 1.6));
      this.spiral.setColorAt(i, color);
    }
    this.spiral.instanceMatrix.needsUpdate = true;
    this.spiral.userData.pick = { id: 'galaxy', scale: Scale.Galaxy };
    this.root.add(this.spiral);

    // A broad, pale dust lane makes the Milky Way disk readable behind the stars.
    const dustCount = 7200;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const radius = 10 + Math.pow(Math.random(), 0.72) * 135;
      const angle = Math.random() * Math.PI * 2 + radius * 0.018;
      const thickness = (1 - radius / 170) * 5 + 1.2;
      dustPositions[i * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 8;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * thickness;
      dustPositions[i * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 8;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    this.dustMat = new THREE.PointsMaterial({
      color: '#ffffff', size: 1.15, sizeAttenuation: true, transparent: true,
      opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.dust = new THREE.Points(dustGeometry, this.dustMat);
    this.root.add(this.dust);

    // ---- Real catalogue stars: the deep sky beyond the Oort Cloud -----------
    // Borrowed from the Astro-Insight HYG / Bright Star Catalogue. Every star is
    // placed by its real right ascension and declination onto a surrounding
    // celestial shell, tinted by spectral colour, sized by apparent magnitude,
    // and individually pickable through a per-instance pick tag.
    const sceneStars = galaxySceneStars();
    const starCount = sceneStars.length;
    this.catalogStarsMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 });
    this.catalogStars = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.9, 0), this.catalogStarsMat, starCount);
    this.catalogStars.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(starCount * 3), 3);
    const starPickTags: PickTag[] = new Array(starCount);
    const glowPositions = new Float32Array(starCount * 3);
    const glowColors = new Float32Array(starCount * 3);
    const starColor = new THREE.Color();
    for (let i = 0; i < starCount; i++) {
      const s = sceneStars[i];
      // Brighter stars sit nearer the disk; fainter ones recede into the shell.
      const radius = 120 + (1 - s.brightness) * 130 + (Math.random() - 0.5) * 14;
      const x = s.dir[0] * radius;
      const y = s.dir[1] * radius;
      const z = s.dir[2] * radius;
      dummy.position.set(x, y, z);
      dummy.scale.setScalar(0.7 + s.brightness * 2.4);
      dummy.updateMatrix();
      this.catalogStars.setMatrixAt(i, dummy.matrix);
      starColor.set(s.color);
      this.catalogStars.setColorAt(i, starColor);
      glowPositions[i * 3] = x;
      glowPositions[i * 3 + 1] = y;
      glowPositions[i * 3 + 2] = z;
      glowColors[i * 3] = starColor.r;
      glowColors[i * 3 + 1] = starColor.g;
      glowColors[i * 3 + 2] = starColor.b;
      starPickTags[i] = { id: s.id, scale: Scale.Galaxy };
    }
    this.catalogStars.instanceMatrix.needsUpdate = true;
    this.catalogStars.userData.pickInstances = starPickTags;
    this.root.add(this.catalogStars);

    // Additive glow halo so even faint catalogue stars read as glints.
    const glowGeo = new THREE.BufferGeometry();
    glowGeo.setAttribute('position', new THREE.BufferAttribute(glowPositions, 3));
    glowGeo.setAttribute('color', new THREE.BufferAttribute(glowColors, 3));
    this.catalogGlowMat = new THREE.PointsMaterial({
      map: this.glowTex, size: 5, sizeAttenuation: true, vertexColors: true,
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.catalogGlow = new THREE.Points(glowGeo, this.catalogGlowMat);
    this.catalogGlow.frustumCulled = false;
    this.root.add(this.catalogGlow);

    // ---- Cosmic web: filaments and cluster knots as a particle field --------
    // Scatter cluster knots through a large volume, link each to its nearest
    // neighbours, and seed dense points ALONG those links plus tight swarms at
    // the knots. The result reads as glowing filaments threading dark voids —
    // cosmic structure rather than a wireframe graph.
    const KNOTS = 130;
    const knots: THREE.Vector3[] = [];
    for (let i = 0; i < KNOTS; i++) {
      knots.push(randomDir().multiplyScalar(120 + Math.random() * 430));
    }
    // A handful of knots are superclusters: much denser, larger, and brighter,
    // anchoring the great filaments the way Virgo/Coma anchor the local universe.
    const superclusters = new Set<number>();
    for (let i = 0; i < 9; i++) superclusters.add(Math.floor(Math.random() * KNOTS));

    const webPos: number[] = [];
    const webCol: number[] = [];
    const pale = new THREE.Color('#a99fff');     // cool filament strands
    const knotCol = new THREE.Color('#dfe6ff');  // cluster cores
    const superCol = new THREE.Color('#fff0d8'); // hot supercluster cores
    const pushPoint = (p: THREE.Vector3, c: THREE.Color, jitter: number) => {
      webPos.push(p.x + (Math.random() - 0.5) * jitter, p.y + (Math.random() - 0.5) * jitter, p.z + (Math.random() - 0.5) * jitter);
      webCol.push(c.r, c.g, c.b);
    };
    // Dense swarm at each cluster knot; superclusters get a far larger halo.
    knots.forEach((k, i) => {
      if (superclusters.has(i)) {
        for (let s = 0; s < 260; s++) pushPoint(k, superCol, 16 + Math.random() * 34);
      } else {
        for (let s = 0; s < 90; s++) pushPoint(k, knotCol, 10 + Math.random() * 18);
      }
    });
    // Filament strands: points strung between each knot and its three nearest
    // neighbours, so the web reads as a connected cosmic scaffold around dark voids.
    for (let i = 0; i < KNOTS; i++) {
      const near = knots
        .map((n, j) => ({ j, d: knots[i].distanceToSquared(n) }))
        .filter((e) => e.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      for (const { j } of near) {
        if (j < i) continue;
        const a = knots[i];
        const b = knots[j];
        const steps = 34;
        for (let t = 1; t < steps; t++) {
          const f = t / steps;
          const p = a.clone().lerp(b, f);
          // Thin the strand toward its middle so knots stay denser than voids.
          const taper = 2 + Math.sin(f * Math.PI) * 5;
          pushPoint(p, pale, taper);
          // A second, slightly offset point thickens the strand into a real filament.
          if (t % 2 === 0) pushPoint(p, pale, taper + 4);
        }
      }
    }
    const webGeo = new THREE.BufferGeometry();
    webGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(webPos), 3));
    webGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(webCol), 3));
    this.webMat = new THREE.PointsMaterial({
      size: 1.8,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.web = new THREE.Points(webGeo, this.webMat);
    this.web.frustumCulled = false;
    this.root.add(this.web);

    // ---- Big Bang cutscene rig (hidden until the cinematic drives it) -------
    this.bang.visible = false;
    this.root.add(this.bang);

    this.flashMat = new THREE.SpriteMaterial({
      map: this.glowTex,
      color: new THREE.Color('#fff6e0'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.flash = new THREE.Sprite(this.flashMat);
    this.flash.scale.setScalar(1);
    this.bang.add(this.flash);

    // Recombination shock: a thin ring that expands outward from the origin.
    this.shockMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#9ec9ff'),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shock = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 96), this.shockMat);
    this.bang.add(this.shock);

    // Primordial shards: points that fly outward and cool from white to amber.
    const shardCount = 1400;
    const shardPos = new Float32Array(shardCount * 3);
    this.shardDirs = new Float32Array(shardCount * 3);
    const shardCol = new Float32Array(shardCount * 3);
    for (let i = 0; i < shardCount; i++) {
      const d = randomDir();
      this.shardDirs[i * 3] = d.x;
      this.shardDirs[i * 3 + 1] = d.y;
      this.shardDirs[i * 3 + 2] = d.z;
      shardCol[i * 3] = 1;
      shardCol[i * 3 + 1] = 1;
      shardCol[i * 3 + 2] = 1;
    }
    this.shardGeo = new THREE.BufferGeometry();
    this.shardGeo.setAttribute('position', new THREE.BufferAttribute(shardPos, 3));
    this.shardGeo.setAttribute('color', new THREE.BufferAttribute(shardCol, 3));
    this.shardMat = new THREE.PointsMaterial({
      map: this.glowTex,
      size: 2.4,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.shards = new THREE.Points(this.shardGeo, this.shardMat);
    this.bang.add(this.shards);
  }

  /** Drive the Big Bang sequence from the history cutscene (null = idle). */
  setCinematic(progress: number | null): void {
    this.cinematic = progress;
  }

  onScaleChange(scale: Scale, intensity: number): void {
    this.currentScale = scale;
    this.intensity = intensity;
    this.root.visible = intensity > 0.01 || this.cinematic !== null;
  }

  update(dt: number, elapsed: number): void {
    const galaxyWeight = this.currentScale >= Scale.Galaxy ? 1 : 0.32;
    // The cosmic web rules the Cosmos scale and recedes as the camera dives into
    // a single galaxy; the galactic core blooms the other way.
    const webWeight = this.currentScale === Scale.Cosmos ? 1 : 0.08;
    // Pull the random deep field well back at Cosmos scale so the filaments,
    // superclusters, and voids of the cosmic web — not a uniform haze of points —
    // define the large-scale structure.
    const fieldWeight = this.currentScale === Scale.Cosmos ? 0.4 : 0.12;
    fadeMaterial(this.coreMat, this.intensity, dt);
    fadeMaterial(this.coreGlowMat, this.intensity * (this.currentScale >= Scale.Galaxy ? 0.95 : 0.4), dt);
    fadeMaterial(this.fieldMat, this.intensity * fieldWeight, dt);
    fadeMaterial(this.spiralMat, this.intensity * galaxyWeight, dt);
    fadeMaterial(this.dustMat, this.intensity * galaxyWeight * 0.78, dt);
    fadeMaterial(this.webMat, this.intensity * webWeight * 1.15, dt);
    // Catalogue stars belong to the Galaxy scale; they recede at Cosmos scale so
    // the large-scale web stays legible.
    const starWeight = this.currentScale >= Scale.Galaxy ? 1 : 0.18;
    fadeMaterial(this.catalogStarsMat, this.intensity * starWeight, dt);
    fadeMaterial(this.catalogGlowMat, this.intensity * starWeight * 0.7, dt);

    this.spiral.rotation.y = elapsed * 0.02;
    this.catalogStars.rotation.y = elapsed * 0.008;
    this.catalogGlow.rotation.y = elapsed * 0.008;
    this.dust.rotation.y = elapsed * 0.014;
    this.field.rotation.y = elapsed * 0.004;
    this.web.rotation.y = elapsed * 0.006;
    const pulse = 1 + Math.sin(elapsed * 1.5) * 0.05;
    this.core.scale.setScalar(pulse);
    this.coreGlow.scale.setScalar(46 * (1 + Math.sin(elapsed * 1.5) * 0.04));

    this.updateBigBang(elapsed);
  }

  /**
   * Choreograph the opening epoch. The first slice of the timeline (0 → ~7%) is
   * the Big Bang: an instant singularity flash, then an expanding shock and a
   * burst of shards that cool as the universe expands.
   */
  private updateBigBang(elapsed: number): void {
    if (this.cinematic === null) {
      this.bang.visible = false;
      fadeMaterial(this.flashMat, 0, 0.1);
      fadeMaterial(this.shockMat, 0, 0.1);
      fadeMaterial(this.shardMat, 0, 0.1);
      return;
    }
    this.bang.visible = true;
    // Local time within the opening epoch, 0..1.
    const t = THREE.MathUtils.clamp(this.cinematic / 0.07, 0, 1);

    // Singularity flash: blinding at t=0, fading fast as space expands.
    const flashGlow = Math.pow(1 - t, 2.2);
    this.flashMat.opacity = flashGlow;
    this.flash.scale.setScalar(4 + Math.sin(elapsed * 30) * 0.4 + t * 18);

    // Shock ring expands outward and thins.
    const shockR = 1 + t * 220;
    this.shock.scale.setScalar(shockR);
    this.shock.rotation.x = Math.PI / 2 + Math.sin(elapsed * 0.2) * 0.05;
    this.shockMat.opacity = Math.sin(t * Math.PI) * 0.7;

    // Shards stream outward and redshift from white toward amber, then dim.
    const pos = this.shardGeo.attributes.position as THREE.BufferAttribute;
    const col = this.shardGeo.attributes.color as THREE.BufferAttribute;
    const reach = t * 320;
    const cool = THREE.MathUtils.clamp(t * 1.4, 0, 1);
    for (let i = 0; i < pos.count; i++) {
      const dx = this.shardDirs[i * 3];
      const dy = this.shardDirs[i * 3 + 1];
      const dz = this.shardDirs[i * 3 + 2];
      const jitter = 0.6 + ((i % 7) / 7) * 0.8;
      pos.setXYZ(i, dx * reach * jitter, dy * reach * jitter, dz * reach * jitter);
      col.setXYZ(i, 1, 1 - cool * 0.35, 1 - cool * 0.7);
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
    this.shardMat.opacity = Math.sin(THREE.MathUtils.clamp(t * 1.2, 0, 1) * Math.PI) * 0.9;
  }

  getPickables(): THREE.Object3D[] {
    if (this.intensity < 0.3) return [];
    // At the Galaxy scale, individual catalogue stars are pickable in front of
    // the core and arms; the deep field selects the cosmos from farther out.
    return this.currentScale >= Scale.Galaxy
      ? [this.catalogStars, this.core, this.spiral]
      : [this.field, this.core];
  }

  dispose(): void {
    this.glowTex.dispose();
    disposeObject(this.root);
  }
}

function randomDir(): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const theta = u * Math.PI * 2;
  const phi = Math.acos(2 * v - 1);
  return new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta),
    Math.sin(phi) * Math.sin(theta),
    Math.cos(phi),
  );
}
