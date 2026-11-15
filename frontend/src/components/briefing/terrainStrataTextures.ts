import * as THREE from "three";

export interface StratumTextureSet {
  map: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

export interface TerrainStrataTextureBundle {
  layer1: StratumTextureSet;
  layer2: StratumTextureSet;
  layer3: StratumTextureSet;
  layer4: StratumTextureSet;
  dispose: () => void;
}

function hash2D(ix: number, iy: number, seed: number): number {
  let n = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  n = (n ^ (n >> 13)) * 1274126177;
  return ((n ^ (n >> 16)) >>> 0) / 4294967295;
}

function smoothNoise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2D(ix, iy, seed);
  const b = hash2D(ix + 1, iy, seed);
  const c = hash2D(ix, iy + 1, seed);
  const d = hash2D(ix + 1, iy + 1, seed);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(
  x: number,
  y: number,
  seed: number,
  octaves = 6,
  lacunarity = 2.08,
  gain = 0.5
): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency, seed + i * 31);
    norm += amplitude;
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return value / norm;
}

/**
 * 6-octave Ridged Multifractal noise for sharp eroded mountain crests and ravines.
 */
function ridgedMultifractal(
  x: number,
  y: number,
  seed: number,
  octaves = 6
): number {
  let sum = 0;
  let frequency = 1.0;
  let amplitude = 0.5;
  let weight = 1.0;
  let norm = 0;

  for (let i = 0; i < octaves; i++) {
    const n = smoothNoise(x * frequency, y * frequency, seed + i * 53);
    let signal = 1.0 - Math.abs(n * 2.0 - 1.0);
    signal *= signal;
    signal *= weight;
    weight = Math.max(0.0, Math.min(1.0, signal * 1.85));
    sum += signal * amplitude;
    norm += amplitude;
    frequency *= 2.12;
    amplitude *= 0.5;
  }
  return sum / norm;
}

/**
 * High-detail 6-octave Ridged Multifractal + crater + incised canyon elevation function
 * used to sculpt the 180x180 3D terrain meshes and watertight side skirts.
 */
export function evalTerrainHeight(
  x: number,
  y: number,
  scale: number,
  phase: number
): number {
  const nx = x * 1.35 + phase * 0.7;
  const ny = y * 1.35 - phase * 0.5;

  // 6-octave ridged mountain backbone
  const ridges = ridgedMultifractal(nx, ny, 17, 6);
  const microFbm = fbm(nx * 2.4, ny * 2.4, 83, 6);

  // Asymmetric volcanic caldera / impact crater
  const cx = x - 0.14;
  const cy = y + 0.08;
  const r = Math.sqrt(cx * cx + cy * cy);
  const craterRim = Math.exp(-Math.pow(r - 0.54, 2) * 15.0) * 0.24;
  const craterBowl = -Math.exp(-Math.pow(r, 2) * 9.5) * 0.22;

  // Winding incised canyon / quebrada
  const canyonCenter =
    x * 0.48 - 0.16 + Math.sin(x * 2.6 + phase) * 0.14;
  const canyonDist = Math.abs(y - canyonCenter);
  const canyonCut = -Math.exp(-canyonDist * canyonDist * 32.0) * 0.19;

  const h =
    (ridges * 0.44 + (microFbm - 0.45) * 0.22 + craterRim + craterBowl + canyonCut) *
    scale;
  return h;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mixRgb(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number
): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [lerp(c1[0], c2[0], k), lerp(c1[1], c2[1], k), lerp(c1[2], c2[2], k)];
}

function createCanvasTextureFromBuffer(
  size: number,
  buffer: Uint8ClampedArray,
  isColor: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const img = ctx.createImageData(size, size);
    img.data.set(buffer);
    ctx.putImageData(img, 0, 0);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Converts a scalar heightfield [0..1] into a tangent-space normalMap CanvasTexture.
 */
function buildNormalMapFromHeightfield(
  size: number,
  heights: Float32Array,
  strength: number
): THREE.CanvasTexture {
  const buf = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y++) {
    const ym = y === 0 ? size - 1 : y - 1;
    const yp = y === size - 1 ? 0 : y + 1;
    for (let x = 0; x < size; x++) {
      const xm = x === 0 ? size - 1 : x - 1;
      const xp = x === size - 1 ? 0 : x + 1;

      const dX = (heights[y * size + xp] - heights[y * size + xm]) * strength;
      const dY = (heights[yp * size + x] - heights[ym * size + x]) * strength;

      let nx = -dX;
      let ny = -dY;
      let nz = 1.0;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;
      nx /= len;
      ny /= len;
      nz /= len;

      const idx = (y * size + x) * 4;
      buf[idx] = clampByte((nx * 0.5 + 0.5) * 255);
      buf[idx + 1] = clampByte((ny * 0.5 + 0.5) * 255);
      buf[idx + 2] = clampByte((nz * 0.5 + 0.5) * 255);
      buf[idx + 3] = 255;
    }
  }
  return createCanvasTextureFromBuffer(size, buf, false);
}

/**
 * Generates high-resolution (1024x1024 default) PBR textures (map, normalMap, roughnessMap)
 * for all 4 geological strata and the subterranean lava tube.
 */
export function createTerrainStrataTextures(
  size = 1024
): TerrainStrataTextureBundle {
  const total = size * size;

  const makeLayerMaps = (
    normalStrength: number,
    evalPixel: (
      u: number,
      v: number
    ) => { rgb: [number, number, number]; height: number; roughness: number }
  ): StratumTextureSet => {
    const colorBuf = new Uint8ClampedArray(total * 4);
    const roughBuf = new Uint8ClampedArray(total * 4);
    const heightField = new Float32Array(total);

    for (let y = 0; y < size; y++) {
      const v = y / (size - 1);
      for (let x = 0; x < size; x++) {
        const u = x / (size - 1);
        const { rgb, height, roughness } = evalPixel(u, v);
        const pIdx = y * size + x;
        const idx = pIdx * 4;
        colorBuf[idx] = clampByte(rgb[0]);
        colorBuf[idx + 1] = clampByte(rgb[1]);
        colorBuf[idx + 2] = clampByte(rgb[2]);
        colorBuf[idx + 3] = 255;

        const rByte = clampByte(roughness * 255);
        roughBuf[idx] = rByte;
        roughBuf[idx + 1] = rByte;
        roughBuf[idx + 2] = rByte;
        roughBuf[idx + 3] = 255;

        heightField[pIdx] = height;
      }
    }

    return {
      map: createCanvasTextureFromBuffer(size, colorBuf, true),
      normalMap: buildNormalMapFromHeightfield(size, heightField, normalStrength),
      roughnessMap: createCanvasTextureFromBuffer(size, roughBuf, false),
    };
  };

  // Layer 1: Satellite volcanic/arid terrain + subtle vegetation patches (Galapagos / Atacama)
  const layer1 = makeLayerMaps(3.2, (u, v) => {
    const base = fbm(u * 7.5, v * 7.5, 11, 5);
    const ridge = ridgedMultifractal(u * 11, v * 11, 29, 4);
    const vegMask = fbm(u * 3.8 + 1.9, v * 3.8 - 1.2, 43, 4);

    let rgb = mixRgb([48, 42, 38], [154, 112, 74], base);
    rgb = mixRgb(rgb, [192, 158, 118], Math.max(0, ridge - 0.52) * 1.45);

    let rough = 0.82 + (1 - ridge) * 0.14;
    if (vegMask > 0.56 && base < 0.58) {
      const veg = Math.min(1, (vegMask - 0.56) * 4.2) * 0.62;
      rgb = mixRgb(rgb, [64, 90, 52], veg);
      rough = lerp(rough, 0.92, veg);
    }
    return { rgb, height: base * 0.55 + ridge * 0.45, roughness: rough };
  });

  // Layer 2: DEM 90m volcanic rock & sandstone with eroded ridges
  const layer2 = makeLayerMaps(4.8, (u, v) => {
    const ridge = ridgedMultifractal(u * 6.5, v * 6.5, 101, 6);
    const soil = fbm(u * 12, v * 12, 113, 4);
    let rgb = mixRgb([34, 36, 44], [142, 88, 50], Math.pow(ridge, 0.85));
    rgb = mixRgb(rgb, [206, 172, 128], Math.max(0, ridge - 0.6) * 2.1);
    rgb = mixRgb(rgb, [76, 66, 58], soil * 0.28);
    return {
      rgb,
      height: ridge * 0.78 + soil * 0.22,
      roughness: 0.72 + (1 - ridge) * 0.22,
    };
  });

  // Layer 3: Geology & lithology (base texture enhanced by triplanar GLSL strata shader)
  const layer3 = makeLayerMaps(4.2, (u, v) => {
    const grain = fbm(u * 16, v * 16, 211, 5);
    const fracture = ridgedMultifractal(u * 9, v * 9, 227, 4);
    const rgb = mixRgb([120, 88, 64], [186, 152, 116], grain);
    return {
      rgb,
      height: grain * 0.55 + fracture * 0.45,
      roughness: 0.74 + grain * 0.2,
    };
  });

  // Layer 4: Deep rough volcanic basaltic crust with subtle crystalline cryosphere veins
  const layer4 = makeLayerMaps(5.0, (u, v) => {
    const rock = fbm(u * 12, v * 12, 401, 5);
    const fracture = ridgedMultifractal(u * 9.0, v * 9.0, 419, 5);
    let rgb = mixRgb([16, 18, 23], [38, 41, 49], rock);
    let rough = 0.9;
    if (fracture > 0.78) {
      const crystal = Math.min(1, (fracture - 0.78) * 4.2);
      rgb = mixRgb(rgb, [112, 168, 204], crystal * 0.55);
      rough = lerp(0.9, 0.34, crystal);
    }
    return { rgb, height: rock * 0.62 + fracture * 0.38, roughness: rough };
  });

  const allTextures: THREE.CanvasTexture[] = [
    layer1.map,
    layer1.normalMap,
    layer1.roughnessMap,
    layer2.map,
    layer2.normalMap,
    layer2.roughnessMap,
    layer3.map,
    layer3.normalMap,
    layer3.roughnessMap,
    layer4.map,
    layer4.normalMap,
    layer4.roughnessMap,
  ];

  return {
    layer1,
    layer2,
    layer3,
    layer4,
    dispose: () => {
      for (const tex of allTextures) {
        tex.dispose();
      }
    },
  };
}

export type StratumShaderMode = "surface" | "relief" | "geology" | "subsurface";

const GLSL_NOISE_HELPERS = /* glsl */ `
varying vec3 vStrataLocalPos;
varying vec3 vStrataLocalNormal;

float strataHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float strataNoise3D(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(strataHash(i + vec3(0,0,0)), strataHash(i + vec3(1,0,0)), f.x),
      mix(strataHash(i + vec3(0,1,0)), strataHash(i + vec3(1,1,0)), f.x),
      f.y
    ),
    mix(
      mix(strataHash(i + vec3(0,0,1)), strataHash(i + vec3(1,0,1)), f.x),
      mix(strataHash(i + vec3(0,1,1)), strataHash(i + vec3(1,1,1)), f.x),
      f.y
    ),
    f.z
  );
}

float strataFbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * strataNoise3D(p);
    p = p * 2.07 + vec3(13.1, 7.7, 5.3);
    a *= 0.5;
  }
  return v;
}
`;

/**
 * Enhances a MeshStandardMaterial with per-pixel GLSL procedural micro-detail,
 * slope/altitude coloration, valley ambient occlusion, and triplanar geological strata.
 */
export function applyStratumPbrShader(
  material: THREE.MeshStandardMaterial,
  mode: StratumShaderMode
): void {
  material.customProgramCacheKey = () => `atlania-stratum-${mode}-v1`;

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
varying vec3 vStrataLocalPos;
varying vec3 vStrataLocalNormal;`
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
vStrataLocalPos = position;
vStrataLocalNormal = normal;`
      );

    let colorInjection = "";
    let roughnessInjection = "";

    if (mode === "surface") {
      colorInjection = /* glsl */ `
float micro = strataFbm(vStrataLocalPos * 26.0);
float slope = clamp(1.0 - abs(normalize(vStrataLocalNormal).z), 0.0, 1.0);
float alt = smoothstep(-0.12, 0.26, vStrataLocalPos.z);
vec3 volcanicRock = vec3(0.16, 0.14, 0.13);
vec3 aridDust = vec3(0.62, 0.45, 0.30);
vec3 vegPatch = vec3(0.22, 0.33, 0.18);
float vegNoise = strataFbm(vStrataLocalPos * 5.2 + vec3(3.1, -1.7, 0.0));
float vegFactor = smoothstep(0.54, 0.72, vegNoise) * (1.0 - smoothstep(0.18, 0.45, slope)) * (1.0 - alt * 0.6);
vec3 proceduralTint = mix(aridDust, volcanicRock, smoothstep(0.22, 0.65, slope));
proceduralTint = mix(proceduralTint, vegPatch, vegFactor * 0.72);
diffuseColor.rgb = mix(diffuseColor.rgb, proceduralTint * (0.78 + 0.44 * micro), 0.48);
float valleyAo = smoothstep(-0.18, 0.18, vStrataLocalPos.z);
diffuseColor.rgb *= mix(0.62, 1.08, valleyAo);
`;
      roughnessInjection = /* glsl */ `
float rMicro = strataFbm(vStrataLocalPos * 28.0);
roughnessFactor = clamp(roughnessFactor + (rMicro - 0.5) * 0.16, 0.55, 0.98);
`;
    } else if (mode === "relief") {
      colorInjection = /* glsl */ `
float micro = strataFbm(vStrataLocalPos * 32.0);
float ridgeDetail = strataFbm(vStrataLocalPos * 14.0 + vec3(2.4));
float slope = clamp(1.0 - abs(normalize(vStrataLocalNormal).z), 0.0, 1.0);
float alt = smoothstep(-0.22, 0.42, vStrataLocalPos.z);
vec3 canyonBasalt = vec3(0.11, 0.12, 0.15);
vec3 ochreSandstone = vec3(0.58, 0.35, 0.19);
vec3 crestRhyolite = vec3(0.76, 0.63, 0.48);
vec3 rockTone = mix(canyonBasalt, ochreSandstone, smoothstep(0.12, 0.55, alt + slope * 0.25));
rockTone = mix(rockTone, crestRhyolite, smoothstep(0.62, 0.95, alt) * (0.5 + 0.5 * ridgeDetail));
diffuseColor.rgb = mix(diffuseColor.rgb, rockTone * (0.76 + 0.48 * micro), 0.62);
float valleyAo = smoothstep(-0.26, 0.25, vStrataLocalPos.z);
diffuseColor.rgb *= mix(0.45, 1.12, valleyAo);
`;
      roughnessInjection = /* glsl */ `
float rMicro = strataFbm(vStrataLocalPos * 30.0);
roughnessFactor = clamp(roughnessFactor + (rMicro - 0.5) * 0.2, 0.48, 0.96);
`;
    } else if (mode === "geology") {
      colorInjection = /* glsl */ `
float warp = strataFbm(vStrataLocalPos * 4.8) * 1.45;
float fault = step(0.5, fract(vStrataLocalPos.x * 0.9 + 0.35)) * 0.14;
float strataCoord = vStrataLocalPos.z * 18.0 + vStrataLocalPos.x * 2.4 + vStrataLocalPos.y * 1.3 + warp + fault * 4.0;
float band = fract(strataCoord * 0.22);
float grain = strataFbm(vStrataLocalPos * 36.0);
vec3 basalt = vec3(0.12, 0.13, 0.16);
vec3 ochre = vec3(0.64, 0.38, 0.18);
vec3 ash = vec3(0.34, 0.32, 0.30);
vec3 mineral = vec3(0.78, 0.70, 0.52);
vec3 oxide = vec3(0.50, 0.20, 0.12);
vec3 strataCol = basalt;
strataCol = mix(strataCol, ochre, smoothstep(0.12, 0.22, band));
strataCol = mix(strataCol, ash, smoothstep(0.34, 0.44, band));
strataCol = mix(strataCol, mineral, smoothstep(0.54, 0.62, band));
strataCol = mix(strataCol, oxide, smoothstep(0.72, 0.80, band));
strataCol = mix(strataCol, basalt, smoothstep(0.88, 0.96, band));
float seam = smoothstep(0.02, 0.0, abs(fract(strataCoord) - 0.5) - 0.46);
strataCol *= (1.0 - seam * 0.35);
diffuseColor.rgb = mix(diffuseColor.rgb, strataCol * (0.78 + 0.44 * grain), 0.78);
`;
      roughnessInjection = /* glsl */ `
float bandRough = strataFbm(vec3(0.0, 0.0, vStrataLocalPos.z * 16.0));
roughnessFactor = clamp(mix(0.45, 0.94, bandRough), 0.4, 0.96);
`;
    } else {
      // subsurface: deep rough volcanic basalt + subtle crystalline cryosphere mineral veins + faint geothermal grotto glow
      colorInjection = /* glsl */ `
float rockGrain = strataFbm(vStrataLocalPos * 32.0);
float microPit = strataFbm(vStrataLocalPos * 64.0);
float iceNoise = 1.0 - abs(strataNoise3D(vStrataLocalPos * 10.5 + vec3(1.7)) * 2.0 - 1.0);
float iceVein = smoothstep(0.87, 0.98, iceNoise);
vec3 deepBasalt = vec3(0.065, 0.072, 0.088) * (0.68 + 0.62 * rockGrain) * (0.85 + 0.3 * microPit);
vec3 cryoCrystal = vec3(0.42, 0.68, 0.84);
vec3 subCol = mix(deepBasalt, cryoCrystal, iceVein * 0.52);

// Subtle warm geothermal glow inside sculpted cross-section grottos
float frontWall = smoothstep(0.72, 0.98, -vStrataLocalPos.y);
float rightWall = smoothstep(0.72, 0.98, vStrataLocalPos.x);
float grottoA = exp(-pow((vStrataLocalPos.x + 0.25) * 4.2, 2.0) - pow((vStrataLocalPos.z + 0.16) * 8.5, 2.0)) * frontWall;
float grottoB = exp(-pow((vStrataLocalPos.y - 0.18) * 4.5, 2.0) - pow((vStrataLocalPos.z + 0.17) * 8.5, 2.0)) * rightWall;
float grottoMask = clamp(grottoA + grottoB, 0.0, 1.0);
subCol = mix(subCol, vec3(0.03, 0.02, 0.02), grottoMask * 0.72);
subCol += vec3(0.55, 0.18, 0.04) * pow(grottoMask, 1.8) * 0.65;

diffuseColor.rgb = mix(diffuseColor.rgb, subCol, 0.84);
`;
      roughnessInjection = /* glsl */ `
float iceN = 1.0 - abs(strataNoise3D(vStrataLocalPos * 10.5 + vec3(1.7)) * 2.0 - 1.0);
float iceV = smoothstep(0.87, 0.98, iceN);
roughnessFactor = mix(clamp(roughnessFactor, 0.78, 0.97), 0.28, iceV * 0.75);
`;
    }

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${GLSL_NOISE_HELPERS}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${colorInjection}`)
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>\n${roughnessInjection}`
      );
  };
}
