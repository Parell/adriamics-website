const alpha = 1e-4;
const initial = 100;
const reservoir = 20;
const target = 28;
const modes = 140;
const xi = Array.from({ length: 181 }, (_, i) => i / 180);
const odd = Array.from({ length: modes }, (_, n) => 2 * n + 1);
const ka = odd.map((n) => n * Math.PI);
const kb = ka.map((k) => k / 2);
const weights = ka.map((k) => 8 / (k * k));
const coefficient = ka.map((k) => 4 / k);
let length = 0.1;
let time = 0;
let running = false;
let lastFrame = 0;
let targetA = 0;
let targetB = 0;
let duration = 1;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const heatA = $('heat-a');
const heatB = $('heat-b');
const summaryA = $('summary-a');
const summaryB = $('summary-b');
const profileCanvas = $('profile-chart') as HTMLCanvasElement;
const meanCanvas = $('mean-chart') as HTMLCanvasElement;
const clock = $('clock');
const timeline = $('timeline') as HTMLInputElement;
const playButton = $('play');
const targetTimes = $('target-times');
const lessonSteps = [
  { title: 'Start with the physical setup', text: 'A 10 cm rod starts uniformly at 100°C. The surroundings stay at 20°C, and heat can move only along the rod. We compare two ways to treat its right end.', equation: 'T(x, 0) = 100°C  ·  0 < x < L     |     α = 10⁻⁴ m²/s     |     L = 0.10 m', flow: 'First, we set the shared starting point: one hot rod and two possible boundary setups.', visual: 'setup' },
  { title: 'Translate the ends into boundary conditions', text: 'A cooled end is held at the reservoir temperature. An insulated end passes no heat, so its temperature gradient is zero.', equation: 'Case A:  T(0,t) = 20°C,  T(L,t) = 20°C\nCase B:  T(0,t) = 20°C,  ∂T/∂x(L,t) = 0', flow: 'Then, we encode cooling as fixed temperature and insulation as zero heat flux: qₓ = −k ∂T/∂x.', visual: 'boundaries' },
  { title: 'Shift temperature to simplify the math', text: 'Subtract the constant reservoir temperature. The new field u is still measured in degrees Celsius; it is the temperature rise above the surroundings.', equation: 'u(x,t) = T(x,t) − 20°C\n∂u/∂t = α ∂²u/∂x²', flow: 'Next, we measure temperature above the surroundings, so cooled boundaries become zero and the equation keeps the same form.', visual: 'shift' },
  { title: 'Separate position from time', text: 'Assume each mode has a spatial shape X and a time amplitude G. Substitution separates the PDE into one equation for each.', equation: 'u(x,t) = X(x)G(t)\nX″ + λ²X = 0       G′ + αλ²G = 0', flow: 'Now, we split each solution into a spatial shape and a time decay; each mode fades like e⁻ᵅˡᵅ²ᵗ.', visual: 'modes' },
  { title: 'The boundary conditions select the modes', text: 'Both cooled ends fit integer half-waves. A cooled end paired with an insulated end fits odd quarter-wave multiples, so its smallest wavenumber is half as large.', equation: 'Case A:  λₙ = nπ/L\nCase B:  λₙ = (2n + 1)π/(2L)', flow: 'Then, the ends select the allowed wavelengths. Case B’s slowest mode has half the wavenumber, so its decay rate αλ² is one-quarter.', visual: 'modes' },
  { title: 'Build the temperature from all modes', text: 'A uniform starting temperature is reconstructed by adding sine modes. At t = 0, the sharp ends make the partial sum overshoot; diffusion quickly smooths that shape as the higher modes fade.', equation: 'Aₙ(t) = 320/((2n+1)π) · e⁻ᵅˡᵅₙ²ᵗ\nT(x,t) = 20 + Σₙ Aₙ(t) sin(λₙx)', flow: 'Watch the sum (white) form from the first mode and faster modes. Drag time forward: each higher mode fades much sooner.', visual: 'series' },
  { title: 'Read the cooling time from the slowest mode', text: 'The slowest mode dominates after the faster modes fade. Its e-folding time is the inverse of its decay rate.', equation: 'τ = 1/(αλ₁²)\nCase A: τA = L²/(απ²) = 10.13 s\nCase B: τB = 4L²/(απ²) = 40.53 s', flow: 'Finally, we invert the slowest decay rate: Case B’s characteristic time is four times Case A’s.', visual: 'times' },
  { title: 'Check the full solution against a target', text: 'The Fourier series combines all modes to predict the full temperature field. For the average rod temperature to reach 28°C, this model gives about 21.2 s for Case A and 84.8 s for Case B.', equation: 'T̄A = 28°C at 21.2 s\nT̄B = 28°C at 84.8 s     →     tB/tA = 4', flow: 'We finish with the full-series result: the average reaches 28°C in 21.2 s versus 84.8 s. Explore both curves below.', visual: 'result' },
];
let lessonIndex = 0;
const lessonTitle = $('lesson-title'), lessonText = $('lesson-text'), lessonEquation = $('lesson-equation'), lessonFlow = $('lesson-flow'), lessonVisual = $('lesson-visual');
const renderedEquations = JSON.parse($('lesson-equations').textContent || '{}').rendered as string[];
const renderLesson = () => {
  const step = lessonSteps[lessonIndex];
  lessonTitle.textContent = step.title; lessonText.textContent = step.text; lessonEquation.innerHTML = renderedEquations[lessonIndex] || ''; lessonFlow.textContent = step.flow;
  $('lesson-count').textContent = `STEP ${lessonIndex + 1} OF ${lessonSteps.length}`;
  ($('lesson-progress') as HTMLElement).style.width = `${(lessonIndex + 1) / lessonSteps.length * 100}%`;
  lessonVisual.innerHTML = visualFor(step.visual);
  if (step.visual === 'series') drawModeReconstruction();
  ($('lesson-prev') as HTMLButtonElement).disabled = lessonIndex === 0;
  ($('lesson-next') as HTMLButtonElement).textContent = lessonIndex === lessonSteps.length - 1 ? 'Explore the simulation ↓' : 'Next step →';
  $('lesson-dots').innerHTML = lessonSteps.map((_, i) => `<button type="button" aria-label="Go to step ${i + 1}" aria-current="${i === lessonIndex}" data-step="${i}"></button>`).join('');
};
function visualFor(kind: string): string {
  if (kind === 'setup') return '<div class="rod-labels"><span>100°C initially</span><span>α = 10⁻⁴ m²/s</span></div><div class="mini-rod hot"></div><div class="rod-labels"><span>x = 0</span><span>x = L = 10 cm</span></div><p>Same rod and starting temperature in both cases</p>';
  if (kind === 'boundaries') return '<div class="mini-case"><b>CASE A</b><span class="sink">20°</span><i></i><span class="sink">20°</span></div><div class="mini-case"><b>CASE B</b><span class="sink">20°</span><i></i><span class="insulator">q = 0</span></div><p>Cooling boundary ··· insulated boundary</p>';
  if (kind === 'shift') return '<div class="shift-visual"><span>100°C</span><b>− 20°C</b><strong>u = 80°C</strong></div><div class="mini-rod shifted"></div><p>Subtracting the reservoir sets cooled ends to zero</p>';
  if (kind === 'times') return '<div class="time-bars"><div><span>Case A</span><i style="--bar:25%"></i><b>10.13 s</b></div><div><span>Case B</span><i style="--bar:100%"></i><b>40.53 s</b></div></div><p>Characteristic time · relative scale</p>';
  if (kind === 'series') return '<div class="mode-demo"><canvas id="mode-chart" aria-label="Temperature profile reconstructed by adding five fading sine modes"></canvas><div class="mode-legend"><span><i class="sum"></i>sum</span><span><i class="m1"></i>1st mode</span><span><i class="m2"></i>3rd</span><span><i class="m3"></i>5th</span><span><i class="m4"></i>7th</span><span><i class="m5"></i>9th</span></div><label class="mode-time">FOURIER NUMBER <input id="mode-time" aria-label="Dimensionless time" type="range" min="0" max="0.15" step="0.001" value="0"><output id="mode-time-label">Fo = 0</output></label></div><p>At the start, the sum approximates the uniform interior; the edge overshoot is the Fourier-series Gibbs effect.</p>';
  if (kind === 'result') return '<div class="result-number"><strong>4×</strong><span>longer to reach 28°C average</span></div><div class="mini-case"><b>A</b><i></i><span>both ends cool</span></div><div class="mini-case"><b>B</b><i></i><span>one end insulated</span></div>';
  return '<div class="wave-visual"><div><span>Case A</span><svg viewBox="0 0 240 70" role="img" aria-label="Full wave mode"><path d="M8 35 C 42 3 78 3 120 35 S 198 67 232 35" /></svg><small>λ₁ = π/L</small></div><div><span>Case B</span><svg viewBox="0 0 240 70" role="img" aria-label="Half wave mode"><path d="M8 65 C 82 65 130 5 232 5" /></svg><small>λ₁ = π/(2L)</small></div></div><p>Longer spatial wave → slower decay</p>';
}
function drawModeReconstruction() {
  const canvas = document.getElementById('mode-chart') as HTMLCanvasElement;
  const slider = document.getElementById('mode-time') as HTMLInputElement;
  const label = document.getElementById('mode-time-label')!;
  const render = () => {
    const rect = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d')!; ctx.scale(ratio, ratio);
    const w = rect.width, h = rect.height, left = 36, right = w - 8, top = 10, bottom = h - 16;
    const tau = Number(slider.value), harmonics = [1, 3, 5, 7, 9];
    ctx.font = '10px system-ui'; ctx.fillStyle = '#bcb7b0'; ctx.strokeStyle = '#484848';
    [20, 60, 100].forEach((temp) => { const y = bottom - (temp - 20) / 80 * (bottom - top); ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.fillText(`${temp}°`, 2, y + 3); });
    const components = harmonics.map((n) => Array.from({ length: 181 }, (_, i) => 320 / (n * Math.PI) * Math.sin(n * Math.PI * i / 180) * Math.exp(-n * n * Math.PI * Math.PI * tau)));
    const colors = ['#e8e2d9', '#d2a8a0', '#ffbd55', '#fb7185', '#b4d6c4'];
    const trace = (values: number[], color: string, width: number) => { ctx.beginPath(); values.forEach((v, i) => { const x = left + (right - left) * i / 180, y = bottom - v / 80 * (bottom - top); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); };
    components.forEach((values, i) => trace(values, colors[i], 1.2));
    trace(components[0].map((_, i) => components.reduce((sum, mode) => sum + mode[i], 0)), '#f4f7fb', 2.6);
    label.textContent = `Fo = ${tau.toFixed(3)}`;
  };
  slider.addEventListener('input', render); render();
}
($('lesson-prev') as HTMLButtonElement).addEventListener('click', () => { lessonIndex = Math.max(0, lessonIndex - 1); renderLesson(); });
($('lesson-next') as HTMLButtonElement).addEventListener('click', () => { if (lessonIndex === lessonSteps.length - 1) { document.querySelector('.race')?.scrollIntoView({ behavior: 'smooth' }); time = 0; draw(); } else lessonIndex++; renderLesson(); });
$('lesson-dots').addEventListener('click', (event) => { const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-step]'); if (button) { lessonIndex = Number(button.dataset.step); renderLesson(); } });
const meanTemperature = (t: number, insulated = false, rodLength = length): number => {
  if (t === 0) return initial;
  const k = insulated ? kb : ka;
  const fo = alpha * t / (rodLength * rodLength);
  return reservoir + (initial - reservoir) * k.reduce((sum, mode, i) => sum + weights[i] * Math.exp(-mode * mode * fo), 0);
};
const profile = (t: number, insulated = false): number[] => {
  if (t === 0) return xi.map((x, i) => i === 0 || (!insulated && i === xi.length - 1) ? reservoir : initial);
  const k = insulated ? kb : ka;
  const fo = alpha * t / (length * length);
  return xi.map((x, i) => {
    const value = reservoir + (initial - reservoir) * k.reduce((sum, mode, n) => sum + coefficient[n] * Math.sin(mode * x) * Math.exp(-mode * mode * fo), 0);
    return i === 0 || (!insulated && i === xi.length - 1) ? reservoir : value;
  });
};
const timeToTarget = (rodLength: number): number => {
  let low = 0;
  let high = 2 * rodLength * rodLength / alpha;
  for (let n = 0; n < 70; n++) {
    const mid = (low + high) / 2;
    if (meanTemperature(mid, false, rodLength) > target) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
};
const drawChart = (canvas: HTMLCanvasElement, render: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) => {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(ratio, ratio);
  render(ctx, rect.width, rect.height);
};
const axes = (ctx: CanvasRenderingContext2D, w: number, h: number, xLabel: string) => {
  const left = 48, right = w - 14, top = 14, bottom = h - 32;
  ctx.font = '11px system-ui'; ctx.fillStyle = '#bcb7b0'; ctx.strokeStyle = '#484848'; ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) { const y = top + (bottom - top) * i / 4; const v = 100 - i * 20; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(right, y); ctx.stroke(); ctx.fillText(`${v}°`, 8, y + 4); }
  ctx.fillText(xLabel, right - 65, h - 7);
  return { left, right, top, bottom };
};
const paint = (ctx: CanvasRenderingContext2D, values: number[], color: string, bounds: {left:number;right:number;top:number;bottom:number}) => {
  ctx.beginPath(); values.forEach((v, i) => { const x = bounds.left + (bounds.right - bounds.left) * i / (values.length - 1); const y = bounds.bottom - (v - 20) / 80 * (bounds.bottom - bounds.top); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
};
const draw = () => {
  time = Math.max(0, Math.min(time, duration));
  const a = profile(time), b = profile(time, true);
  const meanA = meanTemperature(time), meanB = meanTemperature(time, true);
  heatA.style.background = `linear-gradient(90deg,${a.map((v, i) => `${heatColor(v)} ${i / (a.length - 1) * 100}%`).join(',')})`;
  heatB.style.background = `linear-gradient(90deg,${b.map((v, i) => `${heatColor(v)} ${i / (b.length - 1) * 100}%`).join(',')})`;
  summaryA.textContent = `Average: ${meanA.toFixed(1)}°C · center: ${a[90].toFixed(1)}°C`;
  summaryB.textContent = `Average: ${meanB.toFixed(1)}°C · insulated tip: ${b[b.length - 1].toFixed(1)}°C`;
  clock.textContent = `t = ${time.toFixed(1)} s`;
  timeline.value = String(time / duration);
  drawChart(profileCanvas, (ctx, w, h) => { const box = axes(ctx, w, h, `Position (${(length * 100).toFixed(0)} cm)`); paint(ctx, a, '#e8e2d9', box); paint(ctx, b, '#ffbd55', box); });
  drawChart(meanCanvas, (ctx, w, h) => {
    const box = axes(ctx, w, h, 'Time (s)');
    const point = (t: number, temp: number) => ({ x: box.left + (box.right - box.left) * t / duration, y: box.bottom - (temp - 20) / 80 * (box.bottom - box.top) });
    for (const [insulated, color] of [[false, '#e8e2d9'], [true, '#ffbd55']] as const) { ctx.beginPath(); for (let i = 0; i <= 160; i++) { const t = duration * i / 160, p = point(t, meanTemperature(t, insulated)); if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); } ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke(); const p = point(time, meanTemperature(time, insulated)); ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
    const y = point(0, target).y; ctx.setLineDash([4, 5]); ctx.strokeStyle = '#ff7e96'; ctx.beginPath(); ctx.moveTo(box.left, y); ctx.lineTo(box.right, y); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ff9aaa'; ctx.fillText('28°C target', box.left + 5, y - 5);
  });
};
const heatColor = (temperature: number) => { const ratio = Math.max(0, Math.min(1, (temperature - 20) / 80)); const stops = [[8, 10, 40], [100, 25, 70], [205, 53, 38], [255, 225, 84]]; const x = ratio * 3, i = Math.min(2, Math.floor(x)), f = x - i; const rgb = stops[i].map((v, n) => Math.round(v + (stops[i + 1][n] - v) * f)); return `rgb(${rgb.join(',')})`; };
const resetCurves = () => { targetA = timeToTarget(length); targetB = targetA * 4; duration = targetB * 1.16; targetTimes.textContent = `TIME TO 28°C: A ${targetA.toFixed(1)} s  ·  B ${targetB.toFixed(1)} s  ·  4× slower`; };
playButton.addEventListener('click', () => { running = !running; lastFrame = performance.now(); playButton.textContent = running ? 'PAUSE' : 'PLAY'; });
$('reset').addEventListener('click', () => { time = 0; running = false; playButton.textContent = 'PLAY'; draw(); });
timeline.addEventListener('input', () => { time = Number(timeline.value) * duration; draw(); });
$('speed').addEventListener('change', draw);
$('length').addEventListener('click', () => { length = length < 0.15 ? 0.2 : 0.1; $('length').textContent = `L = ${length * 100} cm`; resetCurves(); draw(); });
window.addEventListener('keydown', (event) => { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return; if (event.code === 'Space') { event.preventDefault(); playButton.click(); } else if (event.key.toLowerCase() === 'r') $('reset').click(); else if (event.key.toLowerCase() === 'l') $('length').click(); else if (event.key === 'ArrowRight') { time += duration * 0.03; draw(); } else if (event.key === 'ArrowLeft') { time -= duration * 0.03; draw(); } });
const animate = (now: number) => { if (running) { time += Math.min((now - lastFrame) / 1000, 0.25) * Number(($('speed') as HTMLSelectElement).value); if (time >= duration) { time = duration; running = false; playButton.textContent = 'PLAY'; } draw(); } lastFrame = now; requestAnimationFrame(animate); };
window.addEventListener('resize', draw);
renderLesson(); resetCurves(); draw(); requestAnimationFrame(animate);
