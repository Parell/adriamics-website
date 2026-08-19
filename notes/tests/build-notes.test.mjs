import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import test from 'node:test';

import {
  MATHJAX_CDN_URL,
  MATHJAX_SVG_BLACKER,
  MATHJAX_SVG_FONT_CACHE,
  createPracticeExampleContext,
  getSummary,
  normalizePracticeExam,
  parseFrontmatter,
  parsePracticeProblems,
  renderBlocks,
  renderFloatingActions,
  renderTableOfContents,
  rewriteInternalHref,
  stripSearchOnlySections,
} from '../build-notes.mjs';

test('MathJax SVG output is self-contained for printing', () => {
  assert.equal(MATHJAX_SVG_FONT_CACHE, 'local');
  assert.equal(MATHJAX_SVG_BLACKER, 0);
  assert.match(MATHJAX_CDN_URL, /mathjax@4\.1\.3\/tex-svg\.js$/);
});

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

test('typed callouts render semantic, titled blocks with nested markdown', () => {
  const html = renderBlocks([
    ':::definition Escape <this>',
    '',
    '**Meaning** with a list:',
    '',
    '- one',
    '- two',
    '',
    ':::example Nested',
    '',
    '| Input | Output |',
    '| --- | --- |',
    '| `x` | **y** |',
    '',
    '```js',
    'const value = ":::";',
    '```',
    ':::',
    ':::',
  ].join('\n'), 'notes/example.md');

  assert.match(html, /<aside class="callout callout--definition">/);
  assert.match(html, /<span class="callout__label">Definition<\/span>/);
  assert.match(html, /Escape &lt;this&gt;/);
  assert.match(html, /<strong>Meaning<\/strong>/);
  assert.match(html, /<aside class="callout callout--example">/);
  assert.match(html, /<table>/);
  assert.match(html, /const value = &quot;:::&quot;;/);
});

test('callouts reject unclosed supported blocks and leave unknown directives as text', () => {
  assert.throws(
    () => renderBlocks(':::warning\nUnfinished', 'notes/broken.md'),
    /Missing closing ::: for warning callout in notes\/broken\.md/,
  );

  const html = renderBlocks(':::note\nOrdinary content\n:::', 'notes/unknown.md');
  assert.doesNotMatch(html, /class="callout/);
  assert.match(html, /:::note Ordinary content :::/);
});

test('ordinary blockquotes and practice solutions retain their existing rendering', () => {
  assert.match(renderBlocks('> A quoted fact.', 'notes/example.md'), /<blockquote><p>A quoted fact\.<\/p><\/blockquote>/);
  const problems = parsePracticeProblems([
    '<!--', 'id: algebra-11', 'note: math-algebra', 'title: "A problem"', 'skills: [Algebra]', '-->',
    '', 'Solve $x=1$.', '', ':::solution', 'Therefore **x = 1**.', ':::',
  ].join('\n'), 'source/math/algebra/algebra-problems.md', new Map());
  assert.match(renderBlocks(problems[0].solutionMarkdown, 'notes/example.md'), /<strong>x = 1<\/strong>/);
});

function makePracticeExampleProblem(overrides = {}) {
  return {
    id: 'physics-i-14',
    note: 'physics-physics-i',
    title: 'Find <Final> Velocity',
    promptMarkdown: '**Given:** $v_0 = 2$ m/s and $2 < 3$.\n\n- Use constant acceleration.\n- Keep the units.',
    solutionMarkdown: 'Use\n\n$$\nv = v_0 + at\n$$\n\nThen **$v = 14$ m/s**.',
    sourcePath: 'source/physics/physics-i/physics-i-problems.md',
    ...overrides,
  };
}

test('practice examples resolve sourced markdown into collapsed accessible worked examples', () => {
  const problem = makePracticeExampleProblem();
  const context = createPracticeExampleContext(
    'source/physics/physics-i/physics-i.md',
    [problem],
    [problem],
  );
  const html = renderBlocks(
    ':::practice-example physics-i-14\n:::',
    'source/physics/physics-i/physics-i.md',
    context,
  );

  assert.match(html, /<aside class="callout callout--example practice-example" data-practice-example="physics-i-14">/);
  assert.match(html, /<span class="callout__label">Worked example<\/span>/);
  assert.match(html, /Find &lt;Final&gt; Velocity/);
  assert.match(html, /<strong>Given:<\/strong>/);
  assert.match(html, /2 &lt; 3/);
  assert.match(html, /<ul><li>/);
  assert.match(html, /<div class="math-block">\$\$/);
  assert.match(html, /<details class="practice-example__answer"><summary>Reveal answer<\/summary>/);
  assert.doesNotMatch(html, /<details class="practice-example__answer" open/);
  assert.match(html, /href="practice\/\?filter=all#physics-i-14">Practice this problem<\/a>/);
  assert.deepEqual(context.resolvedProblems, [problem]);
});

test('practice examples reject unknown and cross-lesson problem references', () => {
  const currentProblem = makePracticeExampleProblem();
  const otherProblem = makePracticeExampleProblem({
    id: 'algebra-11',
    note: 'math-algebra',
    sourcePath: 'source/math/algebra/algebra-problems.md',
  });
  const context = createPracticeExampleContext(
    'source/physics/physics-i/physics-i.md',
    [currentProblem],
    [currentProblem, otherProblem],
  );

  assert.throws(
    () => renderBlocks(':::practice-example missing-11\n:::', context.notePath, context),
    /Unknown practice example "missing-11" in source\/physics\/physics-i\/physics-i\.md/,
  );
  assert.throws(
    () => renderBlocks(':::practice-example algebra-11\n:::', context.notePath, context),
    /Practice example "algebra-11" in source\/physics\/physics-i\/physics-i\.md belongs to another lesson/,
  );
});

test('practice examples reject non-empty, malformed, unclosed, duplicate, and unsolved directives', () => {
  const problem = makePracticeExampleProblem();
  const lessonPath = 'source/physics/physics-i/physics-i.md';

  assert.throws(
    () => renderBlocks(':::practice-example physics-i-14\nOverride text\n:::', lessonPath, createPracticeExampleContext(lessonPath, [problem])),
    /Practice example "physics-i-14".*must be empty/,
  );
  assert.throws(
    () => renderBlocks(':::practice-example physics-i-14 extra\n:::', lessonPath, createPracticeExampleContext(lessonPath, [problem])),
    /Malformed practice-example directive.*physics-i-14 extra.*physics-i\.md/,
  );
  assert.throws(
    () => renderBlocks(':::practice-example physics-i-14', lessonPath, createPracticeExampleContext(lessonPath, [problem])),
    /Missing closing ::: for practice example "physics-i-14".*physics-i\.md/,
  );
  assert.throws(
    () => renderBlocks([
      ':::practice-example physics-i-14',
      ':::',
      '',
      ':::practice-example physics-i-14',
      ':::',
    ].join('\n'), lessonPath, createPracticeExampleContext(lessonPath, [problem])),
    /Duplicate practice example "physics-i-14".*physics-i\.md/,
  );
  const unsolved = makePracticeExampleProblem({ solutionMarkdown: '' });
  assert.throws(
    () => renderBlocks(':::practice-example physics-i-14\n:::', lessonPath, createPracticeExampleContext(lessonPath, [unsolved])),
    /Practice example "physics-i-14".*has no solution/,
  );
});

test('Physics I direct static-friction problem is assigned to Exam II', async () => {
  const sourcePath = new URL('../source/physics/physics-i/physics-i-problems.md', import.meta.url);
  const problems = parsePracticeProblems(await fs.readFile(sourcePath, 'utf8'), sourcePath.pathname, new Map());
  const problem = problems.find(({ id }) => id === 'physics-i-111');

  assert.ok(problem);
  assert.equal(problem.level, 1);
  assert.equal(problem.position, 11);
  assert.deepEqual(normalizePracticeExam(problem), { key: 'exam-ii', label: 'Exam II' });
  assert.match(problem.solutionMarkdown, /acts up the incline/i);
  assert.match(problem.solutionMarkdown, /not automatically.*\\mu_sN/is);
});

test('table of contents includes only level-one note headings', () => {
  const toc = renderTableOfContents([
    '<h1 id="overview">Overview</h1>',
    '<h2 id="details">Details</h2>',
    '<h3 id="example">Example</h3>',
    '<h1 id="summary">Summary</h1>',
  ].join(''));

  assert.match(toc, /href="#overview"/);
  assert.match(toc, /href="#summary"/);
  assert.doesNotMatch(toc, /href="#details"/);
  assert.doesNotMatch(toc, /href="#example"/);
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
