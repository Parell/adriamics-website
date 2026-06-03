---
auditors:
  - "@Parell"
status: draft
last_reviewed: 2026-06-02
sources: []
---
# Interactive Visualizations

Interactive visualizations turn a static equation or diagram into something the learner can move, tune, and inspect. This page is a home for force diagrams, graph animations, circuit diagrams, organic reaction mechanisms, thermodynamic cycle plots, vector fields, and formula sliders.

The goal is not decoration. Each interaction should expose one idea clearly:

- Force diagrams: change magnitudes and angles, then show the resultant.
- Graph animations: move time or a parameter and watch the curve update.
- Circuit diagrams: toggle switches, source values, and node voltages.
- Organic reaction mechanisms: step through arrows, intermediates, and products.
- Thermodynamic cycle plots: trace the path and highlight work or heat regions.
- Vector field visualizations: show direction and magnitude at sampled points.
- Formula sliders: connect coefficients to the shape of a function.

---

## 1. What a good interactive page needs

Every useful demo should answer the same questions:

1. What variable is the learner controlling?
2. What changes on the screen when that variable changes?
3. What formula or rule explains the change?
4. What should the learner notice first?

If the answer is not obvious, the interaction is too complicated.

### Design checklist

- Keep the axis labels and units visible.
- Put the formula next to the visual.
- Use the same color for the same quantity across the page.
- Avoid hiding important structure behind animation speed.
- Make the default state meaningful, not random.

---

## 2. Common interaction patterns

| Pattern | Best use | Learner control | Visual response |
| --- | --- | --- | --- |
| Slider + graph | Functions and formulas | Coefficients, phase, offset | Curve shape changes in real time |
| Slider + arrows | Force diagrams | Magnitude and direction | Vector lengths and balance update |
| Stepper + sequence | Reaction mechanisms | Next step or intermediate | Arrows and products advance in order |
| Toggle + schematic | Circuit diagrams | Switch state or source value | Current paths and node labels update |
| Playback + plot | Thermodynamic cycles | Time or cycle stage | Path moves around the diagram |
| Sample grid + field | Vector fields | Sampling density or flow speed | Arrows or particles move through the field |

---

## 3. Where each topic fits

### Force diagrams

Use force diagrams when the key idea is equilibrium or resultant force. The interaction should make it easy to compare the vector sum against the original inputs.

### Graph animations

Use graph animations when the subject depends on time, phase, or changing parameters. The animation should be slow enough that the shape, not just the motion, is easy to read.

### Circuit diagrams

Use circuit diagrams when the learner needs to connect symbols to behavior. Show current paths, source polarity, and node labels directly on the diagram.

### Organic reaction mechanisms

Use reaction mechanisms when the sequence of electron movement matters. Step buttons and highlighted arrows are usually more useful than a fast animation.

### Thermodynamic cycle plots

Use cycle plots when the path between states matters more than a single endpoint. The visual should make the cycle direction and enclosed area easy to see.

### Vector fields

Use vector fields when the value at one point depends on position. A good demo should show direction, relative magnitude, and a sample particle path.

### Formula sliders

Use formula sliders when the student needs to see how coefficients reshape a function. The interaction should connect each parameter to one clear visual effect.

---

## 4. Formula slider demo

<form class="panel" id="formula-slider-demo" style="display:grid;gap:1rem;padding:1rem;">
  <fieldset style="display:grid;gap:0.85rem;grid-template-columns:repeat(auto-fit,minmax(14rem,1fr));align-items:end;border:0;min-inline-size:0;margin:0;padding:0;">
    <label style="display:grid;gap:0.35rem;">
      <span>Amplitude <output id="wave-amplitude-value">1.5</output></span>
      <input id="wave-amplitude" type="range" min="0.5" max="3" step="0.1" value="1.5" />
    </label>
    <label style="display:grid;gap:0.35rem;">
      <span>Frequency <output id="wave-frequency-value">1.0</output></span>
      <input id="wave-frequency" type="range" min="0.5" max="3" step="0.1" value="1" />
    </label>
    <label style="display:grid;gap:0.35rem;">
      <span>Vertical shift <output id="wave-offset-value">0.0</output></span>
      <input id="wave-offset" type="range" min="-2" max="2" step="0.1" value="0" />
    </label>
  </fieldset>

  <fieldset style="display:grid;gap:0.35rem;border:0;min-inline-size:0;margin:0;padding:0;">
    <span style="display:block;margin:0;"><strong>Formula:</strong> <code id="formula-readout">y = 1.5 sin(1.0x) + 0.0</code></span>
    <span class="viewer-meta" style="display:block;margin:0;">Move the sliders to see how the graph responds to each coefficient.</span>
  </fieldset>

  <svg viewBox="0 0 800 300" role="img" aria-labelledby="wave-title wave-desc" style="width:100%;height:auto;display:block;border:1px solid var(--border);background:var(--panel);">
    <title id="wave-title">Interactive sine curve</title>
    <desc id="wave-desc">A line graph that updates when the amplitude, frequency, or vertical shift sliders move.</desc>
    <g style="stroke:var(--border);stroke-width:1;opacity:0.9;">
      <line x1="0" y1="150" x2="800" y2="150" />
      <line x1="100" y1="0" x2="100" y2="300" />
      <line x1="300" y1="0" x2="300" y2="300" />
      <line x1="500" y1="0" x2="500" y2="300" />
      <line x1="700" y1="0" x2="700" y2="300" />
    </g>
    <path id="wave-path" d="" fill="none" stroke="var(--accent-strong)" stroke-width="3" />
  </svg>
</form>

---

## 5. Implementation notes

If this page grows into a set of real demos, keep the same structure for each one:

1. Introduce the mathematical idea in one paragraph.
2. Show the control panel beside the visual.
3. Keep the default state simple.
4. Add a short note that explains what changed.
5. Reuse the same visual language so the page feels like one system.

That is enough to make the page useful without turning it into a generic playground.
