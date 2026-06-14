import * as THREE from 'three';

/**
 * Lighting rig for the atlas. A cool ambient fill, a warm key, and a teal rim
 * give organelles and structures soft volumetric shading that reads as
 * expensive without blowing out the dark background. Owns its lights and
 * removes them on teardown.
 */
export class SceneLightingRig {
  private readonly group = new THREE.Group();

  constructor(scene: THREE.Scene) {
    this.group.name = 'LightingRig';

    this.group.add(new THREE.AmbientLight(0x4a6a85, 0.48));

    // Sky/ground hemisphere bounce gives organic surfaces — vegetation, skin,
    // membranes — soft natural fill that the flat ambient alone cannot.
    this.group.add(new THREE.HemisphereLight(0xbfe9ff, 0x14241c, 0.55));

    const key = new THREE.DirectionalLight(0xbfe9ff, 1.4);
    key.position.set(34, 48, 26);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 320;
    key.shadow.camera.left = -170;
    key.shadow.camera.right = 170;
    key.shadow.camera.top = 170;
    key.shadow.camera.bottom = -170;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 4;
    this.group.add(key);

    const warm = new THREE.DirectionalLight(0xffd9a0, 0.35);
    warm.position.set(-30, 10, -20);
    this.group.add(warm);

    const rim = new THREE.PointLight(0x27c4d9, 0.38, 600, 1.6);
    rim.position.set(-40, -20, 30);
    this.group.add(rim);

    const fill = new THREE.PointLight(0x1b4a6b, 0.6, 500, 1.8);
    fill.position.set(50, -30, -40);
    this.group.add(fill);

    scene.add(this.group);
  }

  dispose(): void {
    this.group.parent?.remove(this.group);
    this.group.clear();
  }
}
