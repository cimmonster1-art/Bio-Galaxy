import * as THREE from 'three';

/**
 * Translucent membrane shader. A Fresnel rim makes the lipid bilayer glow at
 * grazing angles while staying near-transparent face-on, with a slow flowing
 * shimmer driven by world position and time. All GLSL is authored here in plain
 * source; nothing is precompiled or binary.
 */

const vertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vViewPos;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 viewPos = viewMatrix * worldPos;
    vViewPos = viewPos.xyz;
    gl_Position = projectionMatrix * viewPos;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor;
  uniform vec3 uRimColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uRimPower;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vViewPos;

  // Lightweight value noise so the surface drifts without a texture fetch.
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

  // Two octaves of drifting noise read as a flowing lipid bilayer.
  float flowField(vec3 p) {
    float a = noise(p * 0.25 + vec3(0.0, uTime * 0.12, uTime * 0.04));
    float b = noise(p * 0.7 - vec3(uTime * 0.05, 0.0, uTime * 0.08));
    return a * 0.65 + b * 0.35;
  }

  void main() {
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 normal = normalize(vWorldNormal);
    float ndv = clamp(dot(normal, viewDir), 0.0, 1.0);

    // Sharp grazing rim plus a softer secondary halo for a thick wet edge. A
    // tighter exponent on the core rim makes the bilayer near-invisible face on
    // and brightens steeply toward the silhouette.
    float fresnel = pow(1.0 - ndv, uRimPower * 1.25);
    float halo = pow(1.0 - ndv, uRimPower * 0.4);

    // Two flow samples at different scales and drifts give a layered, slowly
    // churning lipid surface with more depth than a single octave.
    float flow = flowField(vWorldPos);
    float flowFine = flowField(vWorldPos * 2.3 + vec3(uTime * 0.03));
    float lipid = flow * 0.7 + flowFine * 0.3;

    // Faint inner depth: darker toward the core, brighter where light scatters
    // through the membrane. A subtle secondary tint deepens the wet body.
    float depth = mix(0.7, 1.18, lipid);
    vec3 body = uColor * depth;
    body += uColor * (lipid - 0.5) * 0.12;
    vec3 base = mix(body, uRimColor, fresnel);
    base += uRimColor * halo * 0.22;
    base += uRimColor * lipid * 0.12;

    // A thin iridescent sheen modulated by view angle and flow reads as the
    // soap-film shimmer of the lipid bilayer at grazing angles.
    float sheen = sin(lipid * 6.2831 + ndv * 4.0 + uTime * 0.3) * 0.5 + 0.5;
    base += mix(vec3(0.0), uRimColor, sheen * fresnel * 0.3);

    // Fine flowing speckle keeps the broad faces from reading as flat glass.
    base += uRimColor * (flowFine - 0.5) * 0.06;

    float alpha = uOpacity + fresnel * 0.66 + halo * 0.14;
    gl_FragColor = vec4(base, clamp(alpha, 0.0, 1.0));
  }
`;

export interface MembraneOptions {
  color?: THREE.ColorRepresentation;
  rimColor?: THREE.ColorRepresentation;
  opacity?: number;
  rimPower?: number;
}

/** Build a configured, disposable membrane ShaderMaterial. */
export function createMembraneMaterial(opts: MembraneOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: {
      uColor: { value: new THREE.Color(opts.color ?? '#0e7c8c') },
      uRimColor: { value: new THREE.Color(opts.rimColor ?? '#39d4e6') },
      uTime: { value: 0 },
      uOpacity: { value: opts.opacity ?? 0.06 },
      uRimPower: { value: opts.rimPower ?? 2.2 },
    },
  });
}
