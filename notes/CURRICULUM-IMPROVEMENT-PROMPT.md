# Universal Education Curriculum Improvement Prompt

Copy and paste the prompt below into Codex or another repository-aware coding agent when improving this curriculum.

```text
You are improving the Universal Education notes repository as a structured study system, not writing a textbook. Be direct, rigorous, accessible, and practical. The curriculum is organized around prerequisites, focused notes, practice, and proof of understanding. Improve it through evidence-based editing and explicit issue tracking.

Default behavior: inspect, edit, rebuild, and verify. Work across the curriculum as needed, while prioritizing the requested note or topic. Make safe, focused in-scope changes without waiting for approval. Do not perform destructive operations, broad restructuring, external publication, or edits outside this notes project unless explicitly asked.

## Before editing

1. Establish repository conventions by reading `README.md`, `index.html`, the documented build scripts (especially `build-notes.mjs`), `source/manifest.js`, `source/paths.json`, prerequisite/dependency maps, and relevant repository instructions.
2. Read representative source notes and their practice files, including the requested topic and at least one prerequisite, dependent, and related note. Inspect navigation, search, MathJax, and generated-page conventions where relevant.
3. Treat `source/` as authoritative. Never manually edit generated files in `subjects/`; regenerate them with the project’s documented command after source changes.
4. Map the selected topic’s prerequisites, dependents, related notes, manifest entry, links, and practice material. Record facts verified from the repository before making judgments.

## Audit

Diagnose the selected work and its surrounding curriculum for:

- mathematical, scientific, and technical correctness;
- definitions that are missing, circular, vague, or introduced after use;
- incorrect assumptions, edge cases, units, dimensions, notation, terminology, or links;
- unclear explanations, unexplained steps, weak or decorative examples, and unsupported claims;
- proper distinction between intuition, definition, theorem, derivation, method, approximation, and heuristic;
- prerequisite gaps, incorrect dependency order, duplication, inconsistent difficulty, and missing downstream connections;
- structure, accessibility, readability, Markdown, MathJax, navigation, search indexing, and generated-site issues;
- practice progression from direct skill practice to integrated, applied, error-analysis, and synthesis problems.

For every significant issue, identify evidence, educational impact, dependency impact, severity, and estimated implementation effort. Separate curriculum-level recommendations from edits that are actually needed now.

## Plan and edit

Create a prioritized plan before modifying files. Prioritize by correctness and safety first, then prerequisite/dependency impact, learning value, and effort. Preserve good existing material and avoid unrelated rewrites.

For explanations, use common words and precise definitions. Add only what materially improves understanding: intuition, assumptions, derivations, useful worked examples, counterexamples, applications, summaries, and checkpoints. Explain what the topic assumes and what it enables. Keep the scope focused: no filler, unnecessary history, textbook-like expansion, or unsupported claims.

Improve practice only when it materially supports the concept. Ensure problems test understanding rather than recall and progress from straightforward execution toward transfer and synthesis. Include enough information to make the intended skill clear, but do not turn every note into an exhaustive problem bank.

Update manifests, prerequisite maps, paths, or other metadata only when the audit justifies the change and the relationship is supported by the source material. Keep notation, terminology, difficulty, and prerequisite order consistent across related notes.

## Required workflow

Follow this sequence:

1. Establish conventions and inspect relevant source files.
2. Map prerequisites, dependents, related notes, and practice.
3. Diagnose correctness, pedagogy, structure, consistency, and technical issues.
4. Create a prioritized improvement plan.
5. Implement only changes within the requested scope.
6. Add or improve examples and practice where they materially improve understanding.
7. Update manifests or dependency maps only when justified.
8. Rebuild generated pages using the documented build command.
9. Validate output and inspect the final diff.
10. Produce the improvement report described below.

## Quality gates

Before reporting completion, check:

- correctness, assumptions, edge cases, and dimensional consistency where applicable;
- definitions before use and a clear separation of intuition, theorem, method, and heuristic;
- progressive difficulty and useful worked examples;
- practice that tests reasoning and transfer, not only recall;
- internal links, prerequisite relationships, navigation, and search indexing;
- Markdown and MathJax syntax;
- source/generated-file separation;
- successful build and presence of expected generated pages;
- absence of accidental unrelated modifications.

Use the repository’s available validation commands. If a check cannot be run, say exactly why and mark the result unresolved. Do not claim a build or validation succeeded without evidence.

## Final report

Return a concise report with these sections:

1. **Summary** — what was improved and why.
2. **Files changed** — distinguish source, metadata, generated output, and other files.
3. **Educational improvements** — the concrete gains in correctness, prerequisites, explanation, examples, practice, or accessibility.
4. **Issues discovered but not fixed** — include severity, impact, and reason deferred.
5. **Prioritized recommendations** — the next most valuable curriculum improvements.
6. **Validation/build results** — commands run and their outcomes, including unresolved checks.
7. **Suggested next improvement cycle** — a focused follow-up scope.

Clearly label each claim as one of: repository fact, mathematical/scientific judgment, recommendation, unresolved uncertainty, or change actually made. Mention any generated files rebuilt and any limitations or assumptions.
```
