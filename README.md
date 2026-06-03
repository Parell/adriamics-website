# parell.github.io

Build the site from the repository root with:

```powershell
node notes/build-notes.mjs
```

Build the static note pages, catalog, search index, practice pages, and sitemap with `node notes/build-notes.mjs` after changing Markdown notes or their manifest.

Notes live in per-topic folders under `notes/subjects/...`, and each note source file must match its folder name, for example `notes/subjects/math/algebra/algebra.md`.

---

You are generating one problems file for my notes website.

Inputs for this run:

* Source note: `<SUBJECT>.md`
* Structural template only: `algebra-problems.md`
* Output file: `<SUBJECT>-problems.md`

Task:
Create a new `<SUBJECT>-problems.md` file based on the concepts in `<SUBJECT>.md`, using `algebra-problems.md` only as the formatting and difficulty-structure template.

Strict file rules:

1. Read `<SUBJECT>.md`.
2. Read `algebra-problems.md` only to copy the structure, formatting style, metadata pattern, and problem difficulty distribution.
3. Do not read any existing `<SUBJECT>-problems.md` file.
4. If `<SUBJECT>-problems.md` already exists, delete it or overwrite it from scratch without inspecting its contents.
5. Do not edit, rename, move, or reformat any other file.
6. Do not scan unrelated notes or use neighboring files as context.
7. This task must be safe to run in parallel for many different subjects.

Output format:

* The output must be a single Markdown file. 
* Each problem must be separated by `---`.
* Each problem must use YAML frontmatter like the template:

```md
---
id: <subject-slug>-<difficulty><position>
note: <note-id>
title: "<problem title>"
skills: [Skill One, Skill Two]
---
```

Optional fields such as `tolerance` may be used only when numerically appropriate.

ID rules:

* The ID format is `<subject-slug>-<difficulty><position>`.
* The leading digit is the difficulty level:

  * `1` = Level 1 — Direct Practice
  * `2` = Level 2 — Integrated Practice
  * `3` = Level 3 — Applied Problems
  * `4` = Level 4 — Challenge / Synthesis
* The trailing digits are the problem position within that difficulty level.
* Examples:

  * `<subject-slug>-11` means difficulty 1, problem 1.
  * `<subject-slug>-12` means difficulty 1, problem 2.
  * `<subject-slug>-110` means difficulty 1, problem 10.
  * `<subject-slug>-21` means difficulty 2, problem 1.
* Preserve this exact numbering logic.

Slug and note metadata:

* Derive `<subject-slug>` from the source note filename.

  * Example: `algebra.md` → `algebra`
  * Example: `atomic-structure.md` → `atomic-structure`
* Derive `note:` from the source note’s existing identity if obvious from the website convention.

  * Example from template: `note: math-algebra`
* If the note id is not explicit, infer a reasonable note id from the source note path or filename, but do not modify the source note.

Difficulty design:
Use the same overall distribution as `algebra-problems.md` unless there is a strong reason not to:

* Level 1: 10 problems
* Level 2: 8 problems
* Level 3: 5 problems
* Level 4: 4 problems

Difficulty meanings:

* Level 1 — Direct Practice: The student mainly performs one method directly.
* Level 2 — Integrated Practice: The student connects related ideas or uses two related steps.
* Level 3 — Applied Problems: The student must recognize which concept applies in a context.
* Level 4 — Challenge / Synthesis: The student reasons through an unfamiliar, mixed, or more abstract situation.

Problem-writing rules:

1. Base every problem on concepts actually covered in `<SUBJECT>.md`.
2. Cover the major sections of the source note, not just the first few topics.
3. Use clear, student-facing wording.
4. Avoid trivia unless the note itself is definition-heavy.
5. Avoid multiple-choice unless the subject genuinely benefits from identification/classification.
6. Make problems answerable from the source note.
7. Do not introduce advanced concepts not present in the note.
8. Use realistic numbers and clean arithmetic when computation is involved.
9. Include enough variety that the file is useful for practice, review, and assessment.

Solution rules:

* Every problem must include a `:::solution` block.
* Solutions should be concise but complete.
* Show the reasoning steps, not just the final answer.
* Use LaTeX math formatting where appropriate.
* Keep explanations aligned with the style of `algebra-problems.md`.

Skills rules:

* `skills:` should list the specific concepts practiced.
* Use short skill names.
* Prefer skill names that match headings or terminology from `<SUBJECT>.md`.
* Each problem should usually have 1–3 skills.

Markdown style:

* Match the clean style of `algebra-problems.md`.
* Use display math with `$$ ... $$` when helpful.
* Do not add a table of contents.
* Do not add commentary before or after the problems.
* Do not add an explanation of what you did.
* The final output should be only the completed `<SUBJECT>-problems.md` file content.

Before finishing:

* Confirm all IDs are unique.
* Confirm all IDs use the correct difficulty-prefix numbering.
* Confirm every problem has a solution.
* Confirm no existing `<SUBJECT>-problems.md` content was used.
* Confirm no files other than `<SUBJECT>-problems.md` were changed.
