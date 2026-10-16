// Rehearsal's real WebGL scene. The deterministic engine remains the source of
// furniture footprints, routes and customer positions; this module only renders.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { sample, type Point2D, type Scene, type SceneObject, type SimResult } from './rehearsalCore.ts';
import type { DrawWorldOptions } from './canvasRenderer.ts';

export interface ThreeView {
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  w: number;
  h: number;
}
export type IsoView = ThreeView;

type Furniture = { group: THREE.Group; signature: string; outline: THREE.LineSegments };
type WorldState = ThreeView & {
  world: THREE.Scene;
  controls: OrbitControls;
  room: THREE.Group;
  furniture: Map<string, Furniture>;
  people: THREE.Group[];
  player: THREE.Group;
  route: THREE.Group;
  lastResult: SimResult | null | undefined;
  roomKey: string;
  width: number;
  depth: number;
  keyLight: THREE.DirectionalLight;
  ambient: THREE.HemisphereLight;
  warmLights: THREE.PointLight[];
  airflow: THREE.Group;
  materials: Record<string, THREE.MeshStandardMaterial>;
  geometry: { head: THREE.SphereGeometry; body: THREE.CapsuleGeometry; leg: THREE.CylinderGeometry; foot: THREE.CylinderGeometry };
};

const worlds = new WeakMap<HTMLCanvasElement, WorldState>();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const hit = new THREE.Vector3();

function standard(color: THREE.ColorRepresentation, roughness = 0.82, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function rounded(parent: THREE.Object3D, w: number, h: number, d: number,
  material: THREE.Material, x = 0, y = h / 2, z = 0, radius = 0.07) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2,
    Math.min(radius, w / 3, h / 3, d / 3)), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function cylinder(parent: THREE.Object3D, radius: number, height: number,
  material: THREE.Material, x: number, y: number, z: number, top = radius) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, radius, height, 24), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function woodTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#bfa485';
  ctx.fillRect(0, 0, 1024, 1024);
  // Deterministic surface noise; it is appearance, never simulation input.
  let seed = 48217;
  const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  for (let row = 0; row < 12; row++) {
    const yy = row * 86;
    ctx.fillStyle = `hsl(33 29% ${65 + random() * 8}%)`;
    ctx.fillRect(0, yy, 1024, 84);
    for (let line = 0; line < 45; line++) {
      const y = yy + random() * 84;
      ctx.strokeStyle = `rgba(94,64,37,${0.025 + random() * 0.055})`;
      ctx.lineWidth = random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(280, y - 8 * random(), 670, y + 9 * random(), 1024, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(66,49,31,.14)';
    ctx.fillRect(0, yy, 1024, 1.5);
    const joint = row % 2 ? 590 : 240;
    ctx.fillRect(joint, yy, 1.5, 85);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 8;
  return texture;
}

function label(parent: THREE.Object3D, text: string, x: number, y: number, z: number,
  color = '#536357', scale = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  ctx.font = '600 27px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, 256, 48);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, z);
  sprite.scale.set(2.5 * scale, 0.47 * scale, 1);
  parent.add(sprite);
  return sprite;
}

function disposeTree(root: THREE.Object3D, sharedMaterials: Record<string, THREE.Material>) {
  const protectedMaterials = new Set(Object.values(sharedMaterials));
  root.traverse((item) => {
    if (item instanceof THREE.Mesh || item instanceof THREE.Line || item instanceof THREE.LineSegments) {
      item.geometry?.dispose();
    }
    if ('material' in item) {
      const materials = Array.isArray(item.material) ? item.material : [item.material];
      for (const material of materials) {
        if (!material || protectedMaterials.has(material)) continue;
        if ('map' in material) material.map?.dispose();
        material.dispose();
      }
    }
  });
  root.clear();
}

function makePerson(state: WorldState, player = false) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(state.geometry.body, player ? state.materials.player : state.materials.walking);
  body.position.y = 0.64;
  body.castShadow = true;
  const head = new THREE.Mesh(state.geometry.head, state.materials.skin);
  head.position.y = 1.13;
  head.castShadow = true;
  group.add(body, head);
  for (const x of [-0.075, 0.075]) {
    const leg = new THREE.Mesh(state.geometry.leg, state.materials.dark);
    leg.position.set(x, 0.13, 0);
    leg.castShadow = true;
    group.add(leg);
  }
  const foot = new THREE.Mesh(state.geometry.foot, state.materials.dark);
  foot.position.y = 0.045;
  group.add(foot);
  if (player) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.39, 40),
      new THREE.MeshBasicMaterial({ color: '#679e74', transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);
  }
  group.scale.setScalar(1.22);
  state.world.add(group);
  return group;
}

function fitCamera(state: WorldState) {
  const aspect = state.w / state.h;
  const verticalFov = THREE.MathUtils.degToRad(state.camera.fov);
  const extent = Math.max(state.width, state.depth);
  const distance = Math.max(extent / Math.tan(verticalFov / 2) * 0.6,
    extent / Math.tan(verticalFov / 2) / aspect * 0.7);
  const center = new THREE.Vector3(state.width / 2, 0.4, state.depth / 2);
  const direction = new THREE.Vector3(0.95, 1.12, 1.28).normalize();
  state.camera.position.copy(center).addScaledVector(direction, distance);
  state.controls.target.copy(center);
  state.controls.minDistance = distance * 0.32;
  state.controls.maxDistance = distance * 1.8;
  state.controls.update();
}

function createWorld(canvas: HTMLCanvasElement): WorldState {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.13;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0xf0eee8, 1);
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(29, 1, 0.1, 300);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI / 7;
  controls.maxPolarAngle = Math.PI / 2.6;
  // Left click belongs to the existing, collision-aware furniture drag flow.
  controls.mouseButtons = { LEFT: undefined, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
  controls.touches = { ONE: undefined, TWO: THREE.TOUCH.DOLLY_ROTATE };
  const ambient = new THREE.HemisphereLight(0xe9f2ff, 0xb39b7b, 2.3);
  world.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffedcf, 4.3);
  keyLight.position.set(5, 14, 10);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -12;
  keyLight.shadow.camera.right = 12;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -12;
  keyLight.shadow.normalBias = 0.035;
  keyLight.shadow.bias = -0.00015;
  keyLight.shadow.radius = 3;
  world.add(keyLight);
  const fill = new THREE.DirectionalLight(0xcce1fb, 1.4);
  fill.position.set(-7, 8, 3);
  world.add(fill);
  const room = new THREE.Group();
  const route = new THREE.Group();
  const airflow = new THREE.Group();
  world.add(room, route, airflow);
  const materials = {
    plaster: standard('#eee8da'), cream: standard('#f5f0e7'), oak: standard('#bd946b'),
    walnut: standard('#7b5239'), quartz: standard('#ece6d9', 0.38),
    dark: standard('#323932', 0.5), sage: standard('#82927b'),
    fabric: standard('#b8b49f'), brass: standard('#b99a61', 0.4, 0.65),
    ceramic: standard('#eee8d9', 0.25), glass: standard('#add0d6', 0.15, 0.1),
    leaves: standard('#677e53'), soil: standard('#48392d'),
    skin: standard('#d6ad8b'), walking: standard('#7c9b9d'), queue: standard('#c99b57'),
    service: standard('#9783a0'), player: standard('#437e62'),
    bulb: new THREE.MeshStandardMaterial({ color: '#fff5cc', emissive: '#ffd58a', emissiveIntensity: 1.2 }),
  };
  const state = {
    camera, renderer, w: 0, h: 0, world, controls, room, furniture: new Map(), people: [],
    route, airflow, lastResult: undefined, roomKey: '', width: 12, depth: 9,
    keyLight, ambient, warmLights: [], materials,
    geometry: { head: new THREE.SphereGeometry(0.15, 12, 10), body: new THREE.CapsuleGeometry(0.15, 0.5, 4, 8),
      leg: new THREE.CylinderGeometry(0.055, 0.06, 0.26, 8), foot: new THREE.CylinderGeometry(0.2, 0.2, 0.025, 16) },
  } as unknown as WorldState;
  state.player = makePerson(state, true);
  state.player.visible = false;
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  canvas.addEventListener('dblclick', () => fitCamera(state));
  canvas.dataset.renderer = 'three-webgl';
  canvas.dataset.sceneCoordinates = 'engine-x-y-to-world-x-z';
  worlds.set(canvas, state);
  return state;
}

function plant(parent: THREE.Object3D, state: WorldState, x: number, z: number, scale = 1) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  cylinder(group, 0.22, 0.44, state.materials.ceramic, 0, 0.22, 0, 0.29);
  cylinder(group, 0.25, 0.02, state.materials.soil, 0, 0.45, 0);
  cylinder(group, 0.025, 0.9, state.materials.walnut, 0, 0.9, 0);
  for (let i = 0; i < 8; i++) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.27, 10, 8), state.materials.leaves);
    const theta = i * 2.4;
    leaf.scale.set(0.6, 1.5, 0.35);
    leaf.rotation.z = Math.sin(theta) * 0.7;
    leaf.position.set(Math.cos(theta) * 0.26, 0.85 + (i % 3) * 0.2, Math.sin(theta) * 0.26);
    leaf.castShadow = true;
    group.add(leaf);
  }
  parent.add(group);
}

function buildRoom(state: WorldState, scene: Scene, theme: string) {
  disposeTree(state.room, state.materials);
  disposeTree(state.airflow, state.materials);
  state.warmLights.forEach((light) => state.world.remove(light));
  state.warmLights = [];
  state.width = scene.width;
  state.depth = scene.height;
  const m = state.materials;
  m.sage.color.set(theme === 'island' ? '#b3906c' : theme === 'lounge' ? '#688c84' : '#82927b');
  const floorMaterial = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.8 });
  rounded(state.room, scene.width + 0.22, 0.25, scene.height + 0.22, m.cream,
    scene.width / 2, -0.16, scene.height / 2, 0.09);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(scene.width, scene.height), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(scene.width / 2, -0.025, scene.height / 2);
  floor.receiveShadow = true;
  state.room.add(floor);
  // Two permanent architectural walls; open front and right expose the room.
  rounded(state.room, scene.width + 0.18, 2.65, 0.16, m.plaster, scene.width / 2, 1.24, -0.1, 0.025);
  rounded(state.room, 0.16, 2.65, scene.height + 0.18, m.plaster, -0.1, 1.24, scene.height / 2, 0.025);
  rounded(state.room, scene.width, 0.12, 0.08, m.walnut, scene.width / 2, 0.06, 0.015, 0.01);
  rounded(state.room, 0.08, 0.12, scene.height, m.walnut, 0.015, 0.06, scene.height / 2, 0.01);
  // Picture window, sill and fine vertical frames on the left elevation.
  rounded(state.room, 0.025, 1.5, 4.9, m.glass, 0.003, 1.52, 3.7, 0.006);
  for (const z of [1.25, 2.9, 4.55, 6.15]) {
    rounded(state.room, 0.045, 1.6, 0.045, m.cream, 0.04, 1.52, z, 0.008);
  }
  rounded(state.room, 0.3, 0.1, 5.15, m.quartz, 0.12, 0.71, 3.7, 0.02);
  rounded(state.room, 0.06, 0.09, 5.1, m.cream, 0.04, 2.31, 3.7, 0.01);
  // Quiet cafe details stay on the existing wall/counter footprints.
  rounded(state.room, 2.9, 0.09, 0.22, m.walnut, 4.65, 1.7, 0.14, 0.02);
  for (let i = 0; i < 7; i++) {
    cylinder(state.room, 0.075, 0.17, m.ceramic, 3.55 + i * 0.33, 1.83, 0.16);
  }
  label(state.room, 'R E H E A R S A L', 7.9, 2.08, 0.07, '#746f5c', 1.12);
  for (const x of [3.95, 8.55]) {
    cylinder(state.room, 0.015, 0.6, m.dark, x, 2.52, 0.85);
    cylinder(state.room, 0.35, 0.24, m.dark, x, 2.12, 0.85, 0.16);
    cylinder(state.room, 0.3, 0.04, m.bulb, x, 2, 0.85);
    const light = new THREE.PointLight('#ffcf91', 3, 4, 2);
    light.position.set(x, 1.9, 0.85);
    state.warmLights.push(light);
    state.world.add(light);
  }
  // Wall-mounted air-conditioning model; toggle changes its real scene effects.
  rounded(state.room, 1.55, 0.34, 0.25, m.cream, 10.7, 2.15, 0.16, 0.065);
  rounded(state.room, 1.25, 0.035, 0.1, m.dark, 10.7, 2.05, 0.3, 0.01);
  for (let i = 0; i < 4; i++) {
    const points = [new THREE.Vector3(10.22 + i * 0.3, 2.01, 0.37),
      new THREE.Vector3(10.22 + i * 0.3, 1.7, 0.85),
      new THREE.Vector3(10.22 + i * 0.3, 1.1, 1.55)];
    const stream = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineDashedMaterial({ color: '#8ab7bd', transparent: true, opacity: 0.42, dashSize: 0.12, gapSize: 0.12 }));
    stream.computeLineDistances();
    state.airflow.add(stream);
  }
  plant(state.room, state, 0.43, 0.45, 0.9);
  for (const [key, text] of [['entrance', 'ENTRY'], ['exit', 'EXIT']] as const) {
    const point = scene[key];
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.34, 32),
      new THREE.MeshBasicMaterial({ color: key === 'entrance' ? '#869d83' : '#b9a07e', side: THREE.DoubleSide }));
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(point.x, 0.015, point.y);
    state.room.add(marker);
    label(state.room, text, point.x, 0.18, point.y + 0.45, '#7e8573', 0.7);
  }
  fitCamera(state);
}

function buildFurniture(state: WorldState, object: SceneObject): Furniture {
  const group = new THREE.Group();
  const m = state.materials;
  const w = object.w, d = object.h;
  if (object.kind === 'desk') {
    rounded(group, w - 0.05, 0.95, d - 0.05, m.sage, 0, 0.475, 0, 0.045);
    rounded(group, w, 0.12, d, m.quartz, 0, 1.02, 0, 0.04);
    // Slatted timber front provides the architectural detail of a real fixture.
    for (let x = -w / 2 + 0.1; x < w / 2 - 0.05; x += 0.13) {
      rounded(group, 0.045, 0.77, 0.035, m.oak, x, 0.48, d / 2 - 0.012, 0.008);
    }
    if (object.id.includes('order')) {
      rounded(group, 0.65, 0.37, 0.44, m.dark, -w * 0.22, 1.25, 0, 0.045);
      rounded(group, 0.59, 0.08, 0.42, m.brass, -w * 0.22, 1.46, 0, 0.016);
      for (const dx of [-0.13, 0.13]) cylinder(group, 0.045, 0.07, m.ceramic, -w * 0.22 + dx, 1.11, 0.15);
      rounded(group, 0.3, 0.23, 0.07, m.dark, w * 0.28, 1.27, 0.06, 0.02).rotation.x = -0.25;
      cylinder(group, 0.045, 0.16, m.dark, w * 0.28, 1.16, 0.06);
    } else {
      cylinder(group, 0.105, 0.19, m.ceramic, -0.4, 1.17, 0.03);
      cylinder(group, 0.105, 0.19, m.ceramic, 0, 1.17, 0.03);
      rounded(group, 0.45, 0.02, 0.3, m.walnut, 0.55, 1.1, 0, 0.01);
    }
  } else if (object.kind === 'table') {
    // A rounded cafe tabletop and tucked stools remain inside the engine AABB.
    rounded(group, w * 0.87, 0.1, d * 0.7, m.oak, 0, 0.78, 0, 0.09);
    cylinder(group, 0.07, 0.73, m.dark, 0, 0.37, 0);
    cylinder(group, Math.min(w, d) * 0.25, 0.04, m.dark, 0, 0.04, 0);
    for (const sign of [-1, 1]) {
      const z = sign * d * 0.35;
      cylinder(group, Math.min(w, d) * 0.19, 0.1, m.fabric, 0, 0.47, z);
      cylinder(group, 0.035, 0.42, m.walnut, 0, 0.23, z);
      rounded(group, w * 0.43, 0.28, 0.07, m.fabric, 0, 0.65, sign * d * 0.45, 0.025);
    }
    cylinder(group, 0.045, 0.1, m.ceramic, 0.08, 0.88, 0.07);
    cylinder(group, 0.055, 0.12, m.leaves, 0.08, 0.99, 0.07, 0.025);
  } else if (object.kind === 'seating') {
    rounded(group, w, 0.33, d, m.walnut, 0, 0.23, 0, 0.06);
    rounded(group, w - 0.04, 0.16, d - 0.03, m.fabric, 0, 0.49, 0, 0.08);
    rounded(group, w, 0.47, 0.14, m.fabric, 0, 0.76, -d / 2 + 0.07, 0.06);
    for (const x of [-w * 0.32, w * 0.32]) {
      rounded(group, 0.16, 0.1, d * 0.84, m.sage, x, 0.6, 0.02, 0.04);
    }
  } else if (object.kind === 'display') {
    rounded(group, w - 0.1, 0.72, d - 0.05, m.walnut, 0, 0.4, 0, 0.045);
    rounded(group, w, 0.11, d, m.quartz, 0, 0.82, 0, 0.05);
    for (let i = 0; i < Math.floor(w / 0.48); i++) {
      const x = -w / 2 + 0.32 + i * 0.47;
      rounded(group, 0.31, 0.07, d * 0.57, m.oak, x, 0.91, 0, 0.03);
      for (const z of [-0.12, 0.1]) {
        const pastry = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.038, 8, 12, Math.PI * 1.55), m.brass);
        pastry.rotation.x = Math.PI / 2;
        pastry.position.set(x, 0.99, z);
        pastry.castShadow = true;
        group.add(pastry);
      }
    }
  } else {
    rounded(group, w, 0.8, d, m.plaster, 0, 0.4, 0, 0.08);
  }
  const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(w + 0.04, 0.03, d + 0.04));
  const outline = new THREE.LineSegments(outlineGeometry, new THREE.LineBasicMaterial({ color: '#508467', transparent: true, opacity: 0.9 }));
  outline.position.y = 0.035;
  outline.visible = false;
  group.add(outline);
  group.userData.objectId = object.id;
  state.world.add(group);
  return { group, signature: `${w}:${d}:${object.kind}`, outline };
}

function updateRoute(state: WorldState, result: SimResult | null | undefined, proposed: boolean) {
  disposeTree(state.route, state.materials);
  if (!result?.route?.length) return;
  // The line uses the actual engine route rather than a visual approximation.
  const points = result.route.map((p) => new THREE.Vector3(p.x, 0.028, p.y));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineDashedMaterial({ color: proposed ? '#6d9978' : '#b4a58a', dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.8 }));
  line.computeLineDistances();
  state.route.add(line);
}

export function drawWorldCanvas(options: DrawWorldOptions): ThreeView {
  const { canvas, scene, result, currentTimeSec, selectedObjectId, hoveredObjectId,
    worldIndex, playerPos, walkMode, lightsOn = true, acOn = true, themeKey = 'express' } = options;
  const state = worlds.get(canvas) || createWorld(canvas);
  const bounds = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(bounds.width));
  const height = Math.max(1, Math.round(bounds.height));
  if (width !== state.w || height !== state.h) {
    state.w = width;
    state.h = height;
    state.renderer.setSize(width, height, false);
    state.camera.aspect = width / height;
    state.camera.updateProjectionMatrix();
    fitCamera(state);
  }
  const roomKey = `${scene.width}:${scene.height}:${themeKey}`;
  if (roomKey !== state.roomKey) {
    buildRoom(state, scene, themeKey);
    state.roomKey = roomKey;
  }
  const activeIds = new Set(scene.objects.map((object) => object.id));
  for (const [id, item] of state.furniture) {
    if (activeIds.has(id)) continue;
    state.world.remove(item.group);
    disposeTree(item.group, state.materials);
    state.furniture.delete(id);
  }
  for (const object of scene.objects) {
    let item = state.furniture.get(object.id);
    const signature = `${object.w}:${object.h}:${object.kind}`;
    if (!item || item.signature !== signature) {
      if (item) {
        state.world.remove(item.group);
        disposeTree(item.group, state.materials);
      }
      item = buildFurniture(state, object);
      state.furniture.set(object.id, item);
    }
    item.group.position.set(object.x + object.w / 2, 0, object.y + object.h / 2);
    item.outline.visible = worldIndex === 1 && (object.id === selectedObjectId || object.id === hoveredObjectId);
  }
  if (state.lastResult !== result) {
    updateRoute(state, result, worldIndex === 1);
    state.lastResult = result;
  }
  const frame = result ? sample(result, Math.max(0, Math.min(result.duration, currentTimeSec))) : null;
  const people = frame?.people || [];
  while (state.people.length < people.length) state.people.push(makePerson(state));
  state.people.forEach((avatar, index) => {
    const person = people[index];
    avatar.visible = Boolean(person);
    if (!person) return;
    avatar.position.set(person.x, 0, person.y);
    const body = avatar.children[0] as THREE.Mesh;
    body.material = state.materials[person.state === 'queue' ? 'queue' : person.state === 'service' ? 'service' : 'walking'];
  });
  state.player.visible = walkMode;
  if (walkMode) state.player.position.set(playerPos.x, 0, playerPos.y);
  state.keyLight.intensity = lightsOn ? 4.3 : 0.7;
  state.ambient.intensity = lightsOn ? 2.3 : 0.85;
  state.warmLights.forEach((light) => { light.intensity = lightsOn ? 3 : 0; });
  state.materials.bulb.emissiveIntensity = lightsOn ? 1.2 : 0;
  state.airflow.visible = acOn;
  state.controls.update();
  state.renderer.render(state.world, state.camera);
  canvas.dataset.people = String(people.length);
  canvas.dataset.webglDrawCalls = String(state.renderer.info.render.calls);
  return state;
}

/** Map CSS-pixel pointer coordinates through the perspective camera to y=0. */
export function unproject(view: ThreeView, px: number, py: number, planeHeight = 0): Point2D {
  pointer.set(px / view.w * 2 - 1, -(py / view.h) * 2 + 1);
  view.camera.updateMatrixWorld();
  raycaster.setFromCamera(pointer, view.camera);
  floorPlane.constant = -planeHeight;
  const intersection = raycaster.ray.intersectPlane(floorPlane, hit);
  return intersection ? { x: intersection.x, y: intersection.z } : { x: Number.NaN, y: Number.NaN };
}

/** Pick the visible furniture surface, then keep its elevation during dragging. */
export function pickObject(view: ThreeView, px: number, py: number):
  { id: string; point: Point2D; height: number } | null {
  const state = view as WorldState;
  pointer.set(px / view.w * 2 - 1, -(py / view.h) * 2 + 1);
  view.camera.updateMatrixWorld();
  raycaster.setFromCamera(pointer, view.camera);
  const groups = [...state.furniture.values()].map((item) => item.group);
  for (const intersection of raycaster.intersectObjects(groups, true)) {
    if (!(intersection.object instanceof THREE.Mesh)) continue;
    let parent: THREE.Object3D | null = intersection.object;
    while (parent && !parent.userData.objectId) parent = parent.parent;
    if (parent?.userData.objectId) {
      return { id: parent.userData.objectId as string,
        point: { x: intersection.point.x, y: intersection.point.z }, height: intersection.point.y };
    }
  }
  return null;
}

export function disposeWorldCanvas(canvas: HTMLCanvasElement) {
  const state = worlds.get(canvas);
  if (!state) return;
  state.controls.dispose();
  state.world.traverse((item) => {
    if (item instanceof THREE.Mesh || item instanceof THREE.Line || item instanceof THREE.LineSegments) item.geometry.dispose();
  });
  Object.values(state.materials).forEach((material) => material.dispose());
  state.renderer.dispose();
  worlds.delete(canvas);
}
