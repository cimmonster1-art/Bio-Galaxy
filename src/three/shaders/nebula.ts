import * as THREE from 'three';

/**
 * Procedural deep-space backdrop for the Tree of Life. A large inward-facing
 * sphere rendered with a soft, drifting nebula and a faint star field, giving
 * the galaxy volumetric depth without any texture downloads. All GLSL is plain
 * source authored in-repo.
 */

const vertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float clouds = fbm(dir * 3.0 + vec3(0.0, 0.0, uTime * 0.01));
    clouds = smoothstep(0.45, 0.95, clouds);

    vec3 col = mix(uColorA, uColorB, clouds);

    // Sparse star field from a high-frequency noise threshold.
    float stars = pow(noise(dir * 220.0), 22.0) * 3.0;
    col += vec3(stars);

    // Vignette toward the deep void at the poles for depth.
    float depth = smoothstep(1.0, 0.2, abs(dir.y));
    col *= mix(0.55, 1.0, depth);

    gl_FragColor = vec4(col, 1.0);
  }
`;

/** Build the nebula background mesh. Caller adds it to the scene and disposes. */
export function createNebulaBackground(radius = 900): {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
} {
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#04060f') },
      uColorB: { value: new THREE.Color('#0a2436') },
    },
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 32), material);
  mesh.name = 'NebulaBackground';
  mesh.frustumCulled = false;
  return { mesh, material };
}
