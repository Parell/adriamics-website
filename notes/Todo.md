Add sequentiel learning paths

Github Sponsors, embed on website introduction? is this nessasary?

Implement a clean “Learning Paths” feature for the notes site.

Goal:
Add sequential learning paths that guide users through existing notes and practice pages without duplicating note content.

Current context:

* The current notes system is organized around subjects such as General, Math, Physics, and Engineering.
* Existing notes should remain the source of truth.
* Learning paths should be a guided overlay that links to existing notes, practice pages, formulas, mistakes, and exam review material.
* Do not perform a large redesign. Keep the current visual style.

Primary UX:
Add a top-level navigation item:

General | Paths | Math | Physics | Engineering

Routes/pages:

* `/notes/paths/`
* `/notes/paths/math-foundations/`
* `/notes/paths/calculus-i/`
* `/notes/paths/physics-i/`
* `/notes/paths/engineering-math/`

The `/notes/paths/` page should show cards for each path:

* Title
* Subject
* Level
* Estimated time
* Short description
* Prerequisites
* Start/Continue button

Each individual path page should show:

* Path title
* Goal
* Prerequisites
* Ordered step list
* Progress indicator if local progress already exists or is easy to add
* Links for each step:

  * Read notes
  * Practice
  * Formula sheet, if available
  * Common mistakes, if available
  * Exam review, if available

Do not duplicate lesson content inside path pages. Each step should link to existing note pages.

Data model:
Create a simple data-driven structure for paths. Prefer JSON, YAML, or markdown frontmatter depending on the existing repo pattern.

Example path object:

```yaml
title: Calculus I Path
slug: calculus-i
subject: math
level: college
estimated_hours: 40
description: Learn limits, derivatives, integrals, and core applications in order.
prerequisites:
  - Algebra
  - Functions
  - Trigonometry
steps:
  - id: calc1-functions
    title: Functions
    type: required
    note: /notes/subjects/math/functions/
    practice: /notes/subjects/math/functions/practice/
    exam_tags:
      - Exam I

  - id: calc1-limits
    title: Limits
    type: required
    note: /notes/subjects/math/limits/
    practice: /notes/subjects/math/limits/practice/
    exam_tags:
      - Exam I

  - id: calc1-derivatives
    title: Derivatives
    type: required
    note: /notes/subjects/math/derivatives/
    practice: /notes/subjects/math/derivatives/practice/
    exam_tags:
      - Exam I
      - Exam II
```

Initial paths to add:

1. Math Foundations
2. Calculus I
3. Physics I
4. Engineering Math

Minimum content for each path:

* 6–12 ordered steps
* Use existing pages when they exist
* If a linked page does not exist, either omit that link or mark it as “Coming soon”
* Avoid broken links

* Not started
* In progress
* Complete

A simple checkbox per step is enough.

Also add filters on path pages:

* All
* Required
* Optional
* Exam I
* Exam II
* Final

If the existing practice problem structure supports metadata, add or prepare support for:

```yaml
problem_id: MATH-CALC1-DERIV-001
topic: Derivatives
difficulty: medium
exam_tags:
  - Exam I
  - Calculus I
status_tags:
  - marked-for-study
```

Do not fully build a complex backend. This should be static-site friendly.

Acceptance criteria:

* “Learning Paths” appears in the main navigation.
* `/notes/paths/` loads and lists path cards.
* Each path page renders an ordered sequence of study steps.
* Steps link to existing notes/practice pages where available.
* Missing pages do not create broken navigation.
* Styling matches the existing notes UI.
* Search behavior is not broken.
* Sitemap/build output still works.
* Run the repo’s existing build command after changes:

```bash
node scripts/build-notes.mjs
```

* If there are tests or lint/build scripts, run those too.
* Keep the change small, readable, and easy to extend.
