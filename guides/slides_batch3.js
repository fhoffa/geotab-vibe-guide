const pptxgen = require('/opt/homebrew/lib/node_modules/pptxgenjs');
const OUT = process.argv[2] || 'batch3.pptx';

const BG_DEEP = '0D1321';
const BG_DARK = '152238';
const CARD    = '1E3A5F';
const ORANGE  = 'F5A623';
const BLUE    = '4A90D9';
const WHITE   = 'FFFFFF';
const MUTED   = 'A0B4C8';
const WARN    = 'E05A2B';

const makeShadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 3, angle: 135, opacity: 0.3 });
function card(slide, x, y, w, h, fill) {
  slide.addShape('rect', { x, y, w, h, fill: { color: fill || CARD }, shadow: makeShadow(), line: { color: fill || CARD, width: 0 } });
}

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 15 — After the Demo: Query → Analyze → Act
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('Query → Analyze → Act.  One conversation.', {
    x: 0.5, y: 0.25, w: 9, h: 0.7,
    fontSize: 34, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  const rows = [
    ['"Which drivers had the most harsh braking last week?"', 'GetAceResults'],
    ['"Decode the VINs for their assigned vehicles."', 'DecodeVins'],
    ['"Create a group called Safety Coaching Q2 and add them."', 'Add + Set'],
  ];

  rows.forEach(([question, tool], i) => {
    const y = 1.15 + i * 1.25;
    card(s, 0.5, y, 6.7, 1.05, CARD);
    s.addText(question, { x: 0.65, y: y + 0.08, w: 6.4, h: 0.88, fontSize: 18, color: WHITE, fontFace: 'Calibri', align: 'left', valign: 'middle', margin: 0 });
    card(s, 7.4, y, 2.1, 1.05, '0A1A2E');
    s.addText(tool, { x: 7.42, y: y + 0.08, w: 2.06, h: 0.88, fontSize: 16, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
    // arrow
    s.addText('→', { x: 7.18, y: y + 0.3, w: 0.25, h: 0.45, fontSize: 20, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', margin: 0 });
  });

  s.addText('Custom demo (Ace-only, read-only): github.com/fhoffa/geotab-ace-mcp-demo — works today, 15-min setup.', {
    x: 0.5, y: 4.95, w: 9, h: 0.35,
    fontSize: 12, color: MUTED, fontFace: 'Calibri', italic: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 16 — ACE in Three Contexts
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('Same AI engine.  Three places.  Different possibilities.', {
    x: 0.5, y: 0.2, w: 9, h: 0.72,
    fontSize: 30, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  const cols = [
    { header: 'MyGeotab Web UI', bullets: ['Just ask questions', 'Fleet manager self-service', 'No code, no setup'], color: BLUE },
    { header: 'Via MCP', bullets: ['One tool of 20', 'Chain with other tools', '30–45 sec, natural language'], color: ORANGE },
    { header: 'Inside an Add-In', bullets: ['Embedded in your page', 'Your custom interface', 'The Gem builds this'], color: '2A8A6A' },
  ];

  cols.forEach(({ header, bullets, color }, i) => {
    const x = 0.4 + i * 3.15;
    card(s, x, 1.05, 2.95, 3.7, CARD);
    s.addShape('rect', { x, y: 1.05, w: 2.95, h: 0.46, fill: { color }, line: { color, width: 0 } });
    s.addText(header, { x: x + 0.08, y: 1.07, w: 2.79, h: 0.4, fontSize: 17, bold: true, color: i === 1 ? BG_DEEP : WHITE, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
    s.addText(bullets.map((b, j) => ({ text: b, options: { bullet: true, breakLine: j < bullets.length - 1, paraSpaceAfter: 8 } })),
      { x: x + 0.12, y: 1.6, w: 2.7, h: 2.9, fontSize: 17, color: WHITE, fontFace: 'Calibri' });
  });

  s.addText('ACE = Geotab\'s AI query engine. Natural language in → SQL-backed fleet intelligence out.', {
    x: 0.5, y: 5.05, w: 9, h: 0.35,
    fontSize: 13, color: MUTED, fontFace: 'Calibri', italic: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 17 — Context 1: Web UI + SQL Insight
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('ACE in MyGeotab: the intelligence layer that\'s already there', {
    x: 0.5, y: 0.2, w: 9, h: 0.72,
    fontSize: 28, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // main insight card
  card(s, 0.5, 1.05, 9, 1.55, '0A2A1A');
  s.addShape('rect', { x: 0.5, y: 1.05, w: 0.12, h: 1.55, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
  s.addText('💡  Read the SQL ACE generated.', {
    x: 0.75, y: 1.1, w: 8.5, h: 0.44,
    fontSize: 18, bold: true, color: BLUE, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText('The fastest way to learn the Geotab data model — ACE explains the schema through every query it runs. Ask a question, read the SQL, understand the join. Better than documentation.',
    { x: 0.75, y: 1.55, w: 8.5, h: 0.92, fontSize: 16, color: WHITE, fontFace: 'Calibri', margin: 0 });

  // warning card
  card(s, 0.5, 2.8, 9, 1.65, '2A1A0A');
  s.addShape('rect', { x: 0.5, y: 2.8, w: 0.12, h: 1.65, fill: { color: WARN }, line: { color: WARN, width: 0 } });
  s.addText('⚠  Cross-check ACE for mission-critical numbers.', {
    x: 0.75, y: 2.85, w: 8.5, h: 0.44,
    fontSize: 18, bold: true, color: WARN, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText('ACE added  IsTracked = TRUE  →  returned 304,000 km when actual fleet total was 490,000 km.',
    { x: 0.75, y: 3.3, w: 8.5, h: 0.44, fontSize: 16, color: WHITE, fontFace: 'Calibri', margin: 0 });
  s.addText('The query wasn\'t wrong from ACE\'s perspective — but it wasn\'t the full picture. Read the SQL.',
    { x: 0.75, y: 3.75, w: 8.5, h: 0.55, fontSize: 15, color: MUTED, fontFace: 'Calibri', italic: true, margin: 0 });

  s.addText('For fleet-wide KPIs at scale, the OData Data Connector is faster and more complete.', {
    x: 0.5, y: 5.0, w: 9, h: 0.35,
    fontSize: 13, color: MUTED, fontFace: 'Calibri', italic: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 18 — Context 2: Speed Comparison
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('ACE is deep.  The direct API is fast.  Use both.', {
    x: 0.5, y: 0.2, w: 9, h: 0.72,
    fontSize: 32, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // big callout
  card(s, 0.5, 1.05, 9, 0.8, CARD);
  s.addText('Same question.   41 seconds via ACE.   1.3 seconds via direct API.', {
    x: 0.65, y: 1.08, w: 8.7, h: 0.7,
    fontSize: 22, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0,
  });

  // comparison table
  const rows = [
    [
      { text: '', options: { fill: { color: BLUE } } },
      { text: 'GetAceResults', options: { bold: true, color: WHITE, fill: { color: BLUE }, fontSize: 15 } },
      { text: 'Direct API (Get, GetCountOf)', options: { bold: true, color: WHITE, fill: { color: BLUE }, fontSize: 15 } },
    ],
    ['Speed', '30–45 seconds', '< 1 second'],
    ['Query type', 'Natural language', 'Structured (filters, fields)'],
    ['Best for', 'Complex analysis, trend questions', 'Counts, lookups, real-time data'],
    ['Risk', 'Implicit filters', '5K result cap without pagination'],
  ];

  s.addTable(rows, {
    x: 0.5, y: 2.0, w: 9, h: 2.75,
    colW: [2.2, 3.4, 3.4],
    border: { pt: 1, color: '2A4A6A' },
    fill: { color: CARD },
    color: WHITE, fontSize: 16, fontFace: 'Calibri',
    align: 'left', valign: 'middle',
  });

  s.addText('Use ACE when you need the reasoning.  Use the API when you need the speed.', {
    x: 0.5, y: 5.0, w: 9, h: 0.38,
    fontSize: 15, color: ORANGE, fontFace: 'Calibri', bold: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 19 — Context 3: ACE in an Add-In
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('ACE inside your Add-In — the Gem builds this', {
    x: 0.5, y: 0.2, w: 9, h: 0.65,
    fontSize: 30, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // left panel: async pattern
  card(s, 0.5, 1.0, 4.3, 3.85, '0A1A2E');
  s.addText('The async pattern:', {
    x: 0.65, y: 1.05, w: 4.0, h: 0.38,
    fontSize: 15, bold: true, color: BLUE, fontFace: 'Trebuchet MS', margin: 0,
  });
  const steps = [
    '1.  create-chat  →  chat_id',
    '2.  send-prompt  →  message_group_id',
    '3.  Wait 10 seconds',
    '4.  Poll every 8s  →  until DONE',
    '5.  Read from  preview_array',
  ];
  s.addText(steps.map((t, i) => ({ text: t, options: { breakLine: i < steps.length - 1, paraSpaceAfter: 6 } })), {
    x: 0.65, y: 1.5, w: 4.0, h: 3.2,
    fontSize: 15, color: ORANGE, fontFace: 'Consolas', align: 'left', valign: 'top', margin: 0,
  });

  // right panel: gem prompt
  card(s, 5.1, 1.0, 4.4, 3.85, CARD);
  s.addText('Gem prompt to copy:', {
    x: 5.25, y: 1.05, w: 4.1, h: 0.38,
    fontSize: 15, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', margin: 0,
  });
  s.addText([
    { text: 'Build a "Fleet Insights" Add-In with a text input. Use Geotab Ace (async: create-chat → send-prompt → poll until DONE every 8s). Spinner: "ACE is thinking…"\n\nPreset buttons:\n• "Which drivers need coaching?"\n• "What\'s our fuel trend this month?"\n• "Maintenance alerts?"' },
  ], {
    x: 5.25, y: 1.5, w: 4.1, h: 3.25,
    fontSize: 14, color: WHITE, fontFace: 'Calibri', align: 'left', valign: 'top', margin: 4,
  });

  s.addText('Verified: ACE works from embedded Add-Ins. Auth comes from the MyGeotab session automatically.', {
    x: 0.5, y: 5.1, w: 9, h: 0.35,
    fontSize: 12, color: MUTED, fontFace: 'Calibri', italic: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 20 — Three Things Today
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('Three things.  Today.', {
    x: 0.5, y: 0.2, w: 9, h: 0.72,
    fontSize: 38, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  const items = [
    {
      num: '1',
      head: 'Try the Gem',
      body: 'Geotab Add-In Architect on Gemini. Describe a fleet problem. Working Add-In in MyGeotab in 10 minutes.',
    },
    {
      num: '2',
      head: 'Sign up for MCP beta',
      body: 'Talk to Geotab before you leave today. When it opens, you\'ll be first to connect Claude to your live fleet.',
    },
    {
      num: '3',
      head: 'Explore the guide',
      body: 'github.com/fhoffa/geotab-vibe-guide — Gem guide, Gem→Claude Code bridge, ACE comparison, all hackathon entries.',
    },
  ];

  items.forEach(({ num, head, body }, i) => {
    const y = 1.1 + i * 1.45;
    // number circle
    s.addShape('ellipse', { x: 0.5, y: y + 0.05, w: 0.85, h: 0.85, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
    s.addText(num, { x: 0.5, y: y + 0.05, w: 0.85, h: 0.85, fontSize: 28, bold: true, color: BG_DEEP, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
    // card
    card(s, 1.55, y, 8.0, 1.25, CARD);
    s.addText(head, { x: 1.7, y: y + 0.07, w: 7.7, h: 0.38, fontSize: 19, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', margin: 0 });
    s.addText(body, { x: 1.7, y: y + 0.48, w: 7.7, h: 0.68, fontSize: 16, color: WHITE, fontFace: 'Calibri', margin: 0 });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 21 — Closing Line
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DEEP };

  // left orange bar
  s.addShape('rect', { x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });

  s.addText([
    { text: 'You used to write instructions.\n', options: { color: WHITE, bold: false } },
    { text: 'Now you describe outcomes.\n', options: { color: ORANGE, bold: true } },
    { text: 'Bring your AI tools —\n', options: { color: WHITE, bold: false } },
    { text: 'Geotab is ready for that world.', options: { color: ORANGE, bold: true } },
  ], {
    x: 0.5, y: 1.0, w: 9, h: 3.5,
    fontSize: 34, fontFace: 'Trebuchet MS',
    align: 'left', valign: 'middle', margin: 0,
  });

  s.addText('— Felipe Hoffa, Connect Europe 2026', {
    x: 0.5, y: 4.95, w: 9, h: 0.38,
    fontSize: 14, color: MUTED, fontFace: 'Calibri', italic: true, align: 'right', margin: 0,
  });
}

pres.writeFile({ fileName: OUT }).then(() => console.log('✓ written:', OUT)).catch(e => { console.error(e); process.exit(1); });
