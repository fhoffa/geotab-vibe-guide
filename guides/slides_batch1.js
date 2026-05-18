const pptxgen = require('/opt/homebrew/lib/node_modules/pptxgenjs');

const OUT = process.argv[2] || 'batch1.pptx';

// ── palette ──────────────────────────────────────────────────────────────
const BG_DEEP   = '0D1321';
const BG_DARK   = '152238';
const CARD      = '1E3A5F';
const CARD_WARN = '3D1A0A';
const ORANGE    = 'F5A623';
const BLUE      = '4A90D9';
const WHITE     = 'FFFFFF';
const MUTED     = 'A0B4C8';
const WARN      = 'E05A2B';

const makeShadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 3, angle: 135, opacity: 0.3 });

function card(slide, x, y, w, h, fillColor) {
  slide.addShape(pptxgen.shapes ? pptxgen.shapes.RECTANGLE : 'rect', {
    x, y, w, h,
    fill: { color: fillColor || CARD },
    shadow: makeShadow(),
    line: { color: fillColor || CARD, width: 0 },
  });
}

// ── presentation ─────────────────────────────────────────────────────────
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.author = 'Felipe Hoffa';
pres.title = 'Vibe Coding Demo + ACE — Connect Europe 2026';

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 1 — Session Title
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DEEP };

  // orange accent bar left
  s.addShape('rect', { x: 0, y: 0, w: 0.15, h: 5.625, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });

  // main title
  s.addText('Vibe Coding Demo + ACE', {
    x: 0.4, y: 1.4, w: 9.2, h: 1.4,
    fontSize: 48, bold: true, color: WHITE, fontFace: 'Trebuchet MS',
    align: 'left', valign: 'middle', margin: 0,
  });

  // subtitle
  s.addText('Felipe Hoffa  ·  Connect Europe 2026  ·  Barcelona', {
    x: 0.4, y: 2.95, w: 9.2, h: 0.5,
    fontSize: 20, color: MUTED, fontFace: 'Calibri',
    align: 'left', valign: 'middle', margin: 0,
  });

  // thin divider line
  s.addShape('rect', { x: 0.4, y: 2.85, w: 4.5, h: 0.04, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });

  // bottom label
  s.addText('02:50 PM – 03:50 PM  |  60 minutes', {
    x: 0.4, y: 4.8, w: 9.2, h: 0.4,
    fontSize: 13, color: MUTED, fontFace: 'Calibri',
    align: 'left', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 2 — The Competition
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  // title
  s.addText('47 teams. 3 weeks. $25,000.', {
    x: 0.5, y: 0.3, w: 9, h: 0.8,
    fontSize: 38, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
    align: 'left', margin: 0,
  });

  // bullets
  const bullets = [
    'February 12 – March 2, 2026',
    'Open to any developer — not just Geotab employees',
    'Tools: any AI assistant (Claude, Gemini, ChatGPT, Cursor, Copilot)',
    'Data: Geotab fleet API',
    '43 repos cloned and code-reviewed — by AI',
  ];
  s.addText(bullets.map((t, i) => ({
    text: t,
    options: { bullet: true, breakLine: i < bullets.length - 1, fontSize: 20, color: WHITE, fontFace: 'Calibri', paraSpaceAfter: 10 },
  })), { x: 0.6, y: 1.3, w: 8.8, h: 3.2 });

  // footer card
  card(s, 0.5, 4.75, 9, 0.55, '1A2E1A');
  s.addText('We used vibe coding to judge vibe coding.', {
    x: 0.6, y: 4.78, w: 8.8, h: 0.45,
    fontSize: 16, color: ORANGE, fontFace: 'Calibri', italic: true,
    align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 3 — The Judging Rubric
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('What actually matters in a fleet tool', {
    x: 0.5, y: 0.3, w: 9, h: 0.7,
    fontSize: 34, bold: true, color: WHITE, fontFace: 'Trebuchet MS',
    align: 'left', margin: 0,
  });

  const rows = [
    [
      { text: 'Criterion', options: { bold: true, color: WHITE, fill: { color: BLUE }, fontSize: 16 } },
      { text: 'Weight',    options: { bold: true, color: WHITE, fill: { color: BLUE }, fontSize: 16 } },
      { text: 'Question',  options: { bold: true, color: WHITE, fill: { color: BLUE }, fontSize: 16 } },
    ],
    ['Useful',     '35%', 'Would a real fleet team use this?'],
    ['Original',   '25%', 'Clear differentiator?'],
    ['Fun',        '15%', 'Engaging to use?'],
    ['Well-done',  '25%', 'Does the code match the promise?'],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.15, w: 9, h: 3.1,
    colW: [2, 1.2, 5.8],
    border: { pt: 1, color: '2A4A6A' },
    fill: { color: CARD },
    color: WHITE,
    fontSize: 18,
    fontFace: 'Calibri',
    align: 'left',
    valign: 'middle',
  });

  // footer warning
  card(s, 0.5, 4.7, 9, 0.6, '2A1A0A');
  s.addText('⚠  Well-done was capped at 6 for mock data projects.', {
    x: 0.7, y: 4.73, w: 8.6, h: 0.5,
    fontSize: 15, color: WARN, fontFace: 'Calibri', italic: true,
    align: 'left', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 4 — The #1 Lesson
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText("The #1 differentiator wasn't the idea. It wasn't the UI.", {
    x: 0.5, y: 0.25, w: 9, h: 0.75,
    fontSize: 28, bold: true, color: WHITE, fontFace: 'Trebuchet MS',
    align: 'left', margin: 0,
  });

  // big statement
  card(s, 0.5, 1.1, 9, 0.85, '1A2E4A');
  s.addText('It was whether the project connected to real fleet data.', {
    x: 0.65, y: 1.13, w: 8.7, h: 0.75,
    fontSize: 24, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
    align: 'center', valign: 'middle', margin: 0,
  });

  // left column: advanced
  card(s, 0.5, 2.1, 4.3, 2.25, CARD);
  s.addText('Projects that advanced', {
    x: 0.6, y: 2.15, w: 4.1, h: 0.4,
    fontSize: 16, bold: true, color: BLUE, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText([
    { text: 'Real Geotab API calls', options: { bullet: true, breakLine: true } },
    { text: 'Real driver names, real trips', options: { bullet: true, breakLine: true } },
    { text: 'Real fault codes', options: { bullet: true } },
  ], { x: 0.65, y: 2.6, w: 4.0, h: 1.6, fontSize: 17, color: WHITE, fontFace: 'Calibri' });

  // right column: didn't
  card(s, 5.2, 2.1, 4.3, 2.25, CARD_WARN);
  s.addText("Projects that didn't", {
    x: 5.3, y: 2.15, w: 4.1, h: 0.4,
    fontSize: 16, bold: true, color: WARN, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText([
    { text: 'Math.random()', options: { bullet: true, breakLine: true } },
    { text: 'seed-data.ts', options: { bullet: true, breakLine: true } },
    { text: 'fakeData.ts', options: { bullet: true } },
  ], { x: 5.35, y: 2.6, w: 4.0, h: 1.6, fontSize: 17, color: WHITE, fontFace: 'Calibri', charSpacing: 0 });

  s.addText('Polished demos. No real data. The code inspection caught them all.', {
    x: 0.5, y: 4.8, w: 9, h: 0.4,
    fontSize: 14, color: MUTED, fontFace: 'Calibri', italic: true,
    align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 5 — Winner Reveal
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DEEP };

  // trophy + name
  s.addText('🏆  FleetShield AI — Vimal Kanagaraj', {
    x: 0.5, y: 0.5, w: 9, h: 0.9,
    fontSize: 34, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
    align: 'center', margin: 0,
  });

  // score — large
  s.addText('8.35', {
    x: 3.5, y: 1.55, w: 3, h: 1.1,
    fontSize: 80, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
    align: 'center', margin: 0,
  });
  s.addText('Overall Score', {
    x: 3.5, y: 2.6, w: 3, h: 0.4,
    fontSize: 14, color: MUTED, fontFace: 'Calibri',
    align: 'center', margin: 0,
  });

  // breakdown row
  const cats = [['Useful', '9'], ['Original', '9'], ['Fun', '8'], ['Well-done', '7']];
  cats.forEach(([label, val], i) => {
    const x = 1.0 + i * 2.1;
    card(s, x, 3.15, 1.8, 0.95, CARD);
    s.addText(val,   { x, y: 3.18, w: 1.8, h: 0.5,  fontSize: 28, bold: true, color: WHITE,  fontFace: 'Trebuchet MS', align: 'center', margin: 0 });
    s.addText(label, { x, y: 3.68, w: 1.8, h: 0.35, fontSize: 13, color: MUTED, fontFace: 'Calibri', align: 'center', margin: 0 });
  });

  // tagline
  s.addText('Predictive Fleet Safety & Insurance Intelligence — Claude + real Geotab data + actual Twilio calls', {
    x: 0.5, y: 4.5, w: 9, h: 0.75,
    fontSize: 16, color: MUTED, fontFace: 'Calibri', italic: true,
    align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 6 — FleetShield AI: The Closed Loop
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('One voice command. Automatic driver calls.', {
    x: 0.5, y: 0.25, w: 9, h: 0.65,
    fontSize: 32, bold: true, color: WHITE, fontFace: 'Trebuchet MS',
    align: 'left', margin: 0,
  });

  // three flow boxes
  const boxes = [
    ["Operator says:\n'Run a coaching sweep'", CARD],
    ["Scores every driver vs 90-day baseline.\nGenerates prioritized action items.", CARD],
    ["Driver portal updated.\nTwilio AI call placed to flagged drivers.", '1A2E4A'],
  ];
  boxes.forEach(([text, fill], i) => {
    const x = 0.35 + i * 3.2;
    card(s, x, 1.0, 2.9, 1.9, fill);
    s.addText(text, {
      x: x + 0.1, y: 1.05, w: 2.7, h: 1.8,
      fontSize: 17, color: WHITE, fontFace: 'Calibri',
      align: 'center', valign: 'middle', margin: 5,
    });
    // arrow (skip after last box)
    if (i < 2) {
      s.addText('→', {
        x: x + 2.95, y: 1.75, w: 0.25, h: 0.4,
        fontSize: 24, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
        align: 'center', margin: 0,
      });
    }
  });

  // stats bar
  card(s, 0.35, 3.1, 9.3, 0.75, '0A1A2E');
  const stats = ['25,000 lines of code', '17 Claude agent tools', '9 scoring engines', '2 voice AI surfaces'];
  s.addText(stats.join('   ·   '), {
    x: 0.5, y: 3.13, w: 9, h: 0.65,
    fontSize: 16, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
    align: 'center', margin: 0,
  });

  // playlist note
  s.addText('Full playlist: youtube.com/playlist?list=PLG1fouPFF9lydA6SmkGlZbhDJyaI4MsBG', {
    x: 0.5, y: 5.1, w: 9, h: 0.35,
    fontSize: 12, color: MUTED, fontFace: 'Calibri', italic: true,
    align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 7 — The Architect's Secret
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('They wrote a 736-line CLAUDE.md.', {
    x: 0.5, y: 0.25, w: 9, h: 0.7,
    fontSize: 34, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
    align: 'left', margin: 0,
  });

  // left column
  card(s, 0.5, 1.05, 4.3, 2.7, CARD);
  s.addText('What it contains:', {
    x: 0.65, y: 1.1, w: 4.0, h: 0.38,
    fontSize: 15, bold: true, color: BLUE, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText([
    { text: 'Every Geotab API pattern',                  options: { bullet: true, breakLine: true } },
    { text: 'Every Geotab quirk and gotcha',             options: { bullet: true, breakLine: true } },
    { text: 'FMCSA-grounded insurance formulas',         options: { bullet: true, breakLine: true } },
    { text: 'Scoring engine methodology',                 options: { bullet: true, breakLine: true } },
    { text: 'Deployment verification steps',             options: { bullet: true } },
  ], { x: 0.65, y: 1.52, w: 4.0, h: 2.1, fontSize: 16, color: WHITE, fontFace: 'Calibri' });

  // right column
  card(s, 5.2, 1.05, 4.3, 2.7, '1A2E4A');
  s.addText([
    { text: '"Claude wasn\'t guessing at fleet insurance math.\n\nIt was given the domain knowledge first.\n\nThen it executed."', options: { italic: true } },
  ], {
    x: 5.35, y: 1.15, w: 4.0, h: 2.5,
    fontSize: 18, color: WHITE, fontFace: 'Calibri',
    align: 'left', valign: 'top', margin: 8,
  });

  // full-width quote
  card(s, 0.5, 3.9, 9, 0.75, '0A1A0A');
  s.addText('"You are the architect. AI is the hands. But the architect has to know the domain."', {
    x: 0.65, y: 3.93, w: 8.7, h: 0.65,
    fontSize: 17, bold: true, color: ORANGE, fontFace: 'Trebuchet MS',
    italic: true, align: 'center', valign: 'middle', margin: 0,
  });
}

// ── write ─────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: OUT }).then(() => console.log('✓ written:', OUT)).catch(e => { console.error(e); process.exit(1); });
