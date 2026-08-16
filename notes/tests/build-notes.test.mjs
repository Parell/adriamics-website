import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getSummary,
  normalizePracticeExam,
  parseFrontmatter,
  parsePracticeProblems,
  renderFloatingActions,
  rewriteInternalHref,
  stripSearchOnlySections,
} from '../build-notes.mjs';

test('frontmatter parsing preserves typed scalar and list values', () => {
  assert.deepEqual(parseFrontmatter([
    'title: "A useful note"',
    'published: true',
    'skills: [Linear Equations, Inverse Operations]',
    'tags:',
    '  - algebra',
    '  - practice',
  ].join('\n')), {
    title: 'A useful note',
    published: 'true',
    skills: ['Linear Equations', 'Inverse Operations'],
    tags: ['algebra', 'practice'],
  });
});

test('practice metadata and internal links are normalized at the build boundary', () => {
  const problems = parsePracticeProblems([
    '<!--',
    'id: algebra-11',
    'note: math-algebra',
    'title: "Combine Like Terms"',
    'skills: [Like Terms]',
    '-->',
    '',
    'Question text.',
    '',
    ':::solution',
    'Solution text.',
    ':::',
  ].join('\n'), 'source/math/algebra/algebra-problems.md', new Map());

  assert.equal(problems.length, 1);
  assert.equal(problems[0].id, 'algebra-11');
  assert.deepEqual(normalizePracticeExam({ exam: 'Exam II', level: 2 }), { key: 'exam-ii', label: 'Exam II' });
  assert.equal(rewriteInternalHref('../vectors/vectors.md#intro', 'notes/source/math/algebra/algebra.md'), '/notes/subjects/math/vectors/#intro');
});

test('summary extraction skips structural markdown', () => {
  assert.equal(getSummary('# Title\n\n<!-- comment -->\n\nA concise summary paragraph.'), 'A concise summary paragraph.');
});

test('search content excludes source lists but keeps note content', () => {
  const markdown = [
    '## Sources',
    '',
    '- Linear Algebra and Its Applications',
    '- Mathematics LibreTexts',
    '',
    '## Core idea',
    '',
    'Matrices organize values into rows and columns.',
  ].join('\n');

  assert.equal(stripSearchOnlySections(markdown), '## Core idea\n\nMatrices organize values into rows and columns.');
});

test('floating actions place Back To Top immediately after Search', () => {
  const html = renderFloatingActions('<a class="notes-action-chip" href="/practice/">Practice</a>');
  const searchIndex = html.indexOf('>Search (ctrl+S)</button>');
  const backToTopIndex = html.indexOf('href="#top"');

  assert.ok(searchIndex >= 0);
  assert.equal(html.slice(searchIndex, backToTopIndex).includes('Back To Top'), false);
  assert.ok(backToTopIndex > searchIndex);
  assert.match(html, /<a class="notes-action-chip" href="#top" data-notes-nav-item>Back To Top<\/a>/);
});
