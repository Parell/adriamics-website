---
auditors:
  - "@Parell"
status: draft
last_reviewed: 2026-05-22
sources: []
---

# Adding and Editing Documents

This page explains the current process for updating the UES notes library, whether you want to fix an existing page or add a new one.

## Editing an existing document

Use the existing page when the topic already exists and only needs correction, clarification, or expansion.

1. Open the note that needs work.
2. Click **Suggest edit** in the upper-right corner of the notes viewer.
3. Submit the GitHub issue with the page path and a short description of the change.
4. An auditor reviews the issue and either updates the page directly or turns the request into a pull request.
5. After review, the change is merged and the site publishes the updated document.

## Adding a new document

Use a new document when the topic does not already exist in the subject tree.

1. Choose the correct subject folder under `notes/source/`.
2. Create a new Markdown file with a short kebab-case name such as `example-topic.md`.
3. Copy the standard frontmatter block from an existing note, keep GitHub-sensitive values quoted such as `- "@Parell"`, use `sources: []` for an empty list, and set the title with an `# H1` heading.
4. Add the new file to `notes/source/manifest.js` so it appears in the guide panel.
5. Open the notes site and confirm the page loads, renders, and appears under the correct subject.
6. Submit the change for auditor review before it is merged.

## File checklist

- Put the Markdown file in the matching subject directory.
- Keep filenames lowercase and hyphenated.
- Make the page title in the document match the title used in the manifest.
- Use concise headings so the table of contents stays readable.
- Prefer updating an existing page over creating duplicates with overlapping scope.

## Review flow

The intended review flow is:

User finds an issue or missing topic -> Suggest edit or open an issue -> Auditor reviews the request -> A pull request is prepared -> The assigned auditor reviews the pull request -> The site publishes the merged update.

## Practical example

To add a page under `General`, you would:

1. Create `notes/source/general/new-topic.md`.
2. Add a matching entry in the `general` section of `notes/source/manifest.js`.
3. Write the page content in Markdown.
4. Load `/notes/` and verify the page appears in the left-side guide.

## Common mistakes

- Creating the Markdown file but forgetting to register it in the manifest.
- Using a different page title in the file than in the manifest.
- Adding a topic to the wrong subject folder.
- Making a new page for material that should have been added to an existing document.
