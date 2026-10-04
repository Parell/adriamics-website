# Adriamics Website — Minimal Recursive Design

**Status:** Refined direction  
**Goal:** Make the site communicate one idea as quickly as possible:

> **Adriamics produces exceptional engineers and physicists.**

Everything else exists as proof.

---

## 1. Brand thesis

Adriamics should not present itself as a collection of projects.

It should present a system for producing unusually capable technical people:

```text
STUDY  →  FRAME  →  SOLAR TUG
learn      build      prove
```

- **Study** develops the knowledge.
- **Frame** develops the engineering capability.
- **Solar Tug** demonstrates that capability on a hard physical problem.

The projects are evidence of the thesis, not competing messages.

The website should make this understandable in roughly **10–15 seconds** with almost no reading.

---

## 2. Homepage structure

The homepage should contain only five meaningful elements.

### 2.1 Hero

Full viewport. Near-black background. One statement.

```text
ADRIAMICS

WE BUILD ENGINEERS
AND PHYSICISTS.
```

Optional quieter line beneath:

```text
Learn deeply. Build rigorously. Prove it in the real world.
```

Do not add a paragraph, feature list, mission statement, or CTA cluster.

Behind the text: one restrained animated technical drawing combining a coordinate frame, orbit arc, and wireframe structure. It should feel like a live engineering notebook rather than decorative sci-fi.

Navigation:

```text
STUDY     FRAME     TUG     GITHUB
```

That is enough.

---

### 2.2 The system

The second section explains the company without prose.

```text
01  STUDY
    LEARN

02  FRAME
    BUILD

03  SOLAR TUG
    PROVE
```

Each item receives one visual and one sentence at most.

#### STUDY

**Learn first principles.**

Visual: a small prerequisite graph expanding from mathematics into physics and engineering.

#### FRAME

**Turn first principles into working spacecraft systems.**

Visual: a compact mission graph: design → simulate → verify → flight software.

#### SOLAR TUG

**Prove the work against a real vehicle.**

Visual: sparse spacecraft line drawing and transfer arc.

No feature grids. No icon wall. No statistics unless a statistic proves something important.

---

### 2.3 Evidence

A single narrow strip of live facts generated from source manifests.

Example:

```text
FRAME          v0.1.0       ACTIVE
STUDY          143 TOPICS    PUBLIC
SOLAR TUG      RESEARCH      TBA
```

This is the only status-heavy section on the homepage.

The purpose is not telemetry. It is proof that the work is alive.

---

### 2.4 Principle

One statement, large enough to function as a second hero:

> **You do not become a great engineer by reading about engineering. You become one by doing difficult engineering.**

This ties Study, Frame, and the Tug together without another explanatory section.

---

### 2.5 Footer

Only:

```text
ADRIAMICS © 2026
GITHUB   CONTACT   STUDY
```

Legal links can sit quietly below or behind a menu.

---

## 3. Content hierarchy

Every piece of content must answer one of three questions:

1. **What do you learn?** → Study
2. **What do you build with it?** → Frame
3. **Can it survive contact with reality?** → Solar Tug

If content does not strengthen one of these answers, remove it.

This means the homepage should **not** contain:

- long company history;
- generic aerospace marketing language;
- exhaustive software capability lists;
- founder biography blocks;
- blog excerpts;
- testimonials without strong technical relevance;
- decorative metrics;
- multiple calls to action per section;
- stock space imagery;
- slogans competing with the central statement.

---

## 4. Project pages

The homepage remains extremely sparse. Detail lives one level down.

### `/study/`

Study is the educational engine.

The page should emphasize structure rather than marketing:

```text
STUDY
First-principles mathematics, physics, and engineering.

[ prerequisite graph ]

START LEARNING
```

Live facts such as topic count or recently updated material may appear as small metadata.

### `/frame/`

Frame is the engineering environment.

Use one sentence:

> **One mission model from trajectory design through closed-loop flight simulation.**

Then show the architecture visually.

```text
MISSION
  ↓
DESIGN
  ↓
OPTIMIZE
  ↓
VERIFY
  ↓
GNC / FSW
```

Detailed capabilities can exist farther down the page, but the first viewport should remain nearly empty.

### `/tug/`

The Tug page should remain intentionally incomplete while the design is not public.

```text
SOLAR TUG
A proving ground for high-power orbital transport.

STATUS
RESEARCH

TECHNICAL DETAILS
TBA
```

Do not fill the page with speculative numbers just to make it look complete.

---

## 5. Visual language

The TypeSafe reference is useful because it creates confidence through restraint.

Adriamics should use the same principles without copying its composition.

### Palette

```text
background      #1E1E1E
foreground      #F5F5F5
secondary       #A0A0A0
hairline        rgba(255,255,255,0.18)
```

No gradients unless they communicate physical state. No colorful project branding.

### Typography

One sans-serif family and one monospace family.

```text
Hero            8–12vw
Section title   4–7vw
Body            1rem
Metadata        0.7rem uppercase
```

Large type should replace explanatory paragraphs wherever possible.

### Geometry

Use only engineering-derived motifs:

- coordinate frames;
- orbital arcs;
- state vectors;
- wireframe volumes;
- dependency graphs;
- spacecraft silhouettes;
- registration marks.

Every visual should correspond to something the company actually does.

### Motion

Motion should be almost imperceptible.

- one slowly moving orbital marker;
- one dependency graph revealing itself;
- one Frame pipeline state transition;
- one transfer arc drawing in.

No floating particles, glow clouds, scrolling marquees, or continuous camera motion.

---

## 6. The rule for text

Use the minimum amount of text required to establish meaning.

A section should normally contain:

```text
NAME
VERB
ONE SENTENCE
ONE VISUAL
```

If the same idea can be understood from the visual, remove the sentence.

If a paragraph exceeds three lines on desktop, it probably belongs on a detail page.

If two phrases say roughly the same thing, keep the stronger one.

The site should feel closer to an aerospace program cover sheet than a SaaS landing page.

---

## 7. Recursive content architecture

The site should update itself, but the visible result must remain minimal.

The architecture is:

```text
SOURCE MANIFESTS
      ↓
VALIDATE
      ↓
NORMALIZE
      ↓
PUBLIC PROJECT MODEL
      ↓
GENERATE
  ├─ homepage status
  ├─ project pages
  ├─ navigation
  ├─ metadata
  ├─ sitemap
  └─ social cards
```

The website does **not** rewrite its own application code. It regenerates its public representation from controlled structured sources.

---

## 8. Minimal project schema

Keep the public schema as small as possible.

```yaml
id: frame
name: FRAME
verb: BUILD
status: active
headline: One mission model from trajectory design through closed-loop flight simulation.
url: /frame/
visual: frame-system

public:
  version: 0.1.0
  updated: 2026-10-04
```

Study:

```yaml
id: study
name: STUDY
verb: LEARN
status: public
headline: First-principles mathematics, physics, and engineering.
url: /study/
visual: prerequisite-graph

public:
  topics: generated
  updated: generated
```

Tug:

```yaml
id: solar-tug
name: SOLAR TUG
verb: PROVE
status: research
headline: A proving ground for high-power orbital transport.
url: /tug/
visual: tug-schematic

public: {}
```

If a field is not necessary to render the site, it should not be in the public schema.

---

## 9. Source rules

### Frame

Frame is private. Public website automation may consume only a deliberately exported manifest such as:

```text
website/public.json
```

Never expose private commit messages, issue titles, branches, contributors, or repository credentials in the browser.

### Study

Study should emit a small manifest during build containing only facts that improve the public page:

```json
{
  "topics": 143,
  "updated": "2026-10-04"
}
```

No need to mirror the entire curriculum into the homepage.

### Solar Tug

Keep manual until the technical architecture is deliberately made public.

Absence is preferable to speculative content.

---

## 10. Update behavior

Preferred flow:

```text
source changes
   ↓
source CI passes
   ↓
public manifest updates
   ↓
website rebuild triggered
   ↓
schema validation
   ↓
content hash comparison
   ↓
static build
   ↓
deploy only if valid
```

If a source is unavailable or malformed, keep the last-known-good public snapshot.

The website should never become blank because an upstream system failed.

---

## 11. AI-assisted updates

AI can propose copy, but should not autonomously publish technical claims.

Allowed:

```text
public structured facts
    ↓
AI proposes concise wording
    ↓
pull request
    ↓
human review
```

Not allowed:

- inferring capabilities from commits;
- publishing performance estimates;
- converting private notes into public claims;
- expanding sparse pages simply because they look empty.

Minimalism requires resisting automatic content inflation.

---

## 12. Implementation direction

Preferred stack remains:

```text
Astro
TypeScript
SVG / lightweight Canvas
GitHub Actions
Static deployment
```

The important implementation rule is that **one project definition drives every public surface**.

Suggested structure:

```text
src/
  content/projects/
    frame.yaml
    study.yaml
    solar-tug.yaml
  components/
    Hero.astro
    ProjectSequence.astro
    StatusStrip.astro
    FrameDiagram.astro
    StudyGraph.astro
    TugDiagram.astro
  lib/
    schema.ts
    normalize.ts
    sources/

scripts/
  sync-content.ts
```

Three generic page primitives should be enough:

```text
Hero
ProjectSequence
ProjectDetail
```

Avoid creating a component library larger than the site requires.

---

## 13. Acceptance criteria

The design is successful when a first-time visitor can infer, without scrolling far:

```text
Adriamics develops engineers and physicists.
Study teaches them.
Frame gives them serious tools.
The Tug gives them something real to prove themselves against.
```

The site should also satisfy these technical constraints:

- homepage meaning is clear in under 15 seconds;
- no homepage section requires more than one short paragraph;
- Frame, Study, and Tug are generated from one project registry;
- project status can update without editing page markup;
- private Frame data never reaches the client;
- failed source syncs retain the last valid build;
- the site remains useful with JavaScript disabled;
- animation is optional and respects reduced-motion settings;
- adding a fourth project requires only a new manifest and visual preset.

---

## 14. Final composition

The entire homepage can be reduced to this:

```text
ADRIAMICS

WE BUILD ENGINEERS
AND PHYSICISTS.


01  STUDY
    LEARN
    First principles.

02  FRAME
    BUILD
    Real spacecraft systems.

03  SOLAR TUG
    PROVE
    Against a real vehicle.


You do not become a great engineer by reading about engineering.
You become one by doing difficult engineering.


FRAME  v0.1.0 / ACTIVE
STUDY  PUBLIC
TUG    RESEARCH

GITHUB   CONTACT
```

That is the target: **one idea, three proofs, almost nothing else.**
