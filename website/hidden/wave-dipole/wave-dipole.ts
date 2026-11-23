import { Camera, DirectionalLight, GlobalAmbientLight, lookAtRotation, Materials, MeshInstance, MeshMaterial, runApp, StandardMaterial, StandardRenderer, Transform, type Plugin, type World } from '@dylanebert/shallot';
import { Orbit, OrbitPlugin } from '@dylanebert/shallot/extras';
import { loadGltfScene } from '@dylanebert/shallot/gltf';

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = byId<HTMLCanvasElement>('scene');
const phaseSlider = byId<HTMLInputElement>('phase');
let phase = 0, playing = true, speed = 1, app: Awaited<ReturnType<typeof runApp>> | undefined;
const TAU = Math.PI * 2;
type Item = { id: number; p: [number, number, number]; s: [number, number, number]; q: [number, number, number, number]; kind: 'E' | 'B' | 'energy' | 'current'; arrow?: boolean };
const axisQ: [number, number, number, number] = [0, 0, 0, 1];
const rotX = (a: number): [number, number, number, number] => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
const rotY = (a: number): [number, number, number, number] => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];
const rotZ = (a: number): [number, number, number, number] => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
// The bundled mesh points along +X. Rotate that axis onto a field/current vector.
const pointAlong = (v: [number, number, number]): [number, number, number, number] => {
  const length = Math.hypot(...v) || 1, x = v[0] / length, y = v[1] / length, z = v[2] / length;
  const dot = x + 1;
  if (dot < 1e-6) return [0, 0, 1, 0];
  // Shortest-arc quaternion from local +X (the mesh axis) to the target vector.
  const q: [number, number, number, number] = [0, -z, y, dot];
  const n = Math.hypot(...q); return q.map(value => value / n) as [number, number, number, number];
};
const reverseArrow = (q: [number, number, number, number]): [number, number, number, number] => [-q[2], q[3], q[0], -q[1]];
const items: Item[] = [];
let cameraEntity = 0, initialOrbit = { yaw: 0.75, pitch: 0.45, distance: 5.8 };

function scenePlugin(): Plugin {
  async function initialize(world: World) {
    world.resource(GlobalAmbientLight).brightness = 480;
    const sun = world.create(); world.add(sun, Transform, { rotation: lookAtRotation(0, 0, 0, -1, -2, 1) }); world.add(sun, DirectionalLight, { color: 0xd9edff, illuminance: 6500 });
    cameraEntity = world.create(); world.add(cameraEntity, Camera, { clearColor: 0x080d16 }); world.add(cameraEntity, StandardRenderer); world.add(cameraEntity, Orbit, initialOrbit); world.add(cameraEntity, Transform);
    const mats = world.resource(Materials);
    const material = (color: number) => mats.add(StandardMaterial({ baseColor: [(color >> 16 & 255) / 255, (color >> 8 & 255) / 255, (color & 255) / 255, 1], emissive: [(color >> 16 & 255) / 900, (color >> 8 & 255) / 900, (color & 255) / 900], perceptualRoughness: .42 }));
    const colors = { rod: material(0xdce5ee), E: material(0x39c7ed), B: material(0xc58aff), energy: material(0xffbd63), current: material(0xff675b) };
    const arrowModel = await loadGltfScene(world, new URL('./assets/arrow.glb', import.meta.url));
    const arrowMesh = arrowModel.primitives[0].mesh;
    const add = (p: [number, number, number], s: [number, number, number], q: [number, number, number, number], kind: Item['kind'], color = colors[kind], arrow = false) => {
      const id = world.create(); world.add(id, MeshInstance, arrow ? { mesh: arrowMesh } : undefined); world.add(id, Transform, { translation: p, scale: s, rotation: q }); world.add(id, MeshMaterial, color); items.push({ id, p, s, q, kind, arrow }); return id;
    };
    // The dipole is oriented on the Z axis. A short feed gap separates the two half-wave arms.
    add([0, 0, -.52], [.075, .075, .91], axisQ, 'current', colors.rod); add([0, 0, .52], [.075, .075, .91], axisQ, 'current', colors.rod);
    add([0, 0, 0], [.12, .12, .12], axisQ, 'current', colors.current);
    // Distinct arrows on both arms show conventional current along the wire.
    for (const z of [-.55, .55]) add([.13, 0, z], [.29, .075, .075], pointAlong([0, 0, 1]), 'current', colors.current, true);
    // E is meridional and B azimuthal. Sample several polar angles, azimuths and radii.
    // Their size follows sin²(theta), making the axial null and broadside maximum visible.
    for (const r of [.78, 1.18, 1.58]) for (const theta of [.42, .9, 1.35, 1.79, 2.24, 2.72]) for (let j = 0; j < 8; j++) {
      const phi = j / 8 * TAU, st = Math.sin(theta), ct = Math.cos(theta), strength = st * st;
      const p: [number, number, number] = [r * st * Math.cos(phi), r * st * Math.sin(phi), r * ct];
      const e: [number, number, number] = [ct * Math.cos(phi), ct * Math.sin(phi), -st];
      const b: [number, number, number] = [-Math.sin(phi), Math.cos(phi), 0];
      const length = .12 + .2 * strength;
      add(p, [length, .052, .052], pointAlong(e), 'E', colors.E, true);
      add(p, [length * .82, .045, .045], pointAlong(b), 'B', colors.B, true);
    }
    // Moving amber markers make outward Poynting energy flow distinct from the alternating fields.
    for (let ring = 0; ring < 12; ring++) for (let a = 0; a < 12; a++) {
      const angle = a / 12 * TAU, radius = .72 + ring * .19, pattern = Math.sin(angle) ** 2;
      if (pattern < .16) continue;
      add([radius * Math.sin(angle), .08, radius * Math.cos(angle)], [.045, .045, .045], axisQ, 'energy');
    }
  }
  return { name: 'DipoleFields', dependencies: [OrbitPlugin], initialize };
}

function updateScene() {
  const polarity = Math.cos(phase), current = Math.sin(phase);
  for (const item of items) {
    const enabled = byId<HTMLInputElement>(`show-${item.kind}`).checked;
    const visible = enabled;
    const transform = app?.world.storage(Transform);
    if (!transform) continue;
    if (item.kind === 'E' || item.kind === 'B') {
      const sign = polarity >= 0 ? 1 : -1;
      const amplitude = .25 + .75 * Math.abs(polarity);
      transform.scale.x.set(item.id, visible ? item.s[0] * amplitude : 0); transform.scale.y.set(item.id, visible ? item.s[1] : 0); transform.scale.z.set(item.id, visible ? item.s[2] : 0);
      transform.translation.x.set(item.id, visible ? item.p[0] : 1000);
      const q = sign > 0 ? item.q : reverseArrow(item.q);
      transform.rotation.x.set(item.id, q[0]); transform.rotation.y.set(item.id, q[1]); transform.rotation.z.set(item.id, q[2]); transform.rotation.w.set(item.id, q[3]);
    } else if (item.kind === 'energy') {
      const offset = (phase / TAU * 2.1) % 2.1;
      const base = Math.hypot(item.p[0], item.p[2]);
      const r = .72 + ((base - .72 + offset) % 2.1);
      const theta = Math.atan2(item.p[0], item.p[2]);
      transform.translation.x.set(item.id, visible ? r * Math.sin(theta) : 1000); transform.translation.z.set(item.id, r * Math.cos(theta));
    } else if (item.kind === 'current') {
      transform.translation.x.set(item.id, visible ? item.p[0] : 1000);
      if (item.arrow) { const sign = current >= 0 ? 1 : -1, q = sign > 0 ? item.q : reverseArrow(item.q); transform.rotation.x.set(item.id, q[0]); transform.rotation.y.set(item.id, q[1]); transform.rotation.z.set(item.id, q[2]); transform.rotation.w.set(item.id, q[3]); transform.scale.x.set(item.id, item.s[0] * (.2 + .8 * Math.abs(current))); }
    }
  }
  byId('phase-label').textContent = `PHASE ${String(Math.round(phase / TAU * 360)).padStart(3, '0')}°`;
  phaseSlider.value = String(phase);
}

function setPlaying(value: boolean) { playing = value; byId('play').textContent = playing ? 'Ⅱ  Pause' : '▶  Play'; }
byId<HTMLButtonElement>('play').addEventListener('click', () => setPlaying(!playing));
byId<HTMLButtonElement>('reset').addEventListener('click', () => { phase = 0; setPlaying(false); updateScene(); });
byId<HTMLButtonElement>('view-reset').addEventListener('click', () => {
  if (!app) return;
  const orbit = app.world.storage(Orbit); orbit.yaw.set(cameraEntity, initialOrbit.yaw); orbit.pitch.set(cameraEntity, initialOrbit.pitch); orbit.distance.set(cameraEntity, initialOrbit.distance);
});
phaseSlider.addEventListener('input', () => { phase = Number(phaseSlider.value); setPlaying(false); updateScene(); });
byId<HTMLSelectElement>('speed').addEventListener('change', (event) => { speed = Number((event.currentTarget as HTMLSelectElement).value); });
document.querySelectorAll<HTMLInputElement>('.layer-toggle').forEach(toggle => toggle.addEventListener('change', updateScene));
let previous = performance.now();
function animate(now: number) { if (playing) phase = (phase + (now - previous) / 1000 * speed * TAU * .22) % TAU; previous = now; updateScene(); requestAnimationFrame(animate); }
window.addEventListener('pagehide', () => app?.dispose());
if (!navigator.gpu) { byId('webgpu-error').hidden = false; }
else runApp({ canvas, plugins: [scenePlugin()], pixelRatio: Math.min(devicePixelRatio || 1, 1.5) }).then(value => { app = value; updateScene(); requestAnimationFrame(animate); }).catch(error => { byId('webgpu-error').hidden = false; byId('webgpu-error').textContent = `This simulation needs a browser with WebGPU enabled. ${String(error)}`; });
