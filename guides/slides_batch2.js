const pptxgen = require('/opt/homebrew/lib/node_modules/pptxgenjs');
const OUT = process.argv[2] || 'batch2.pptx';

const BG_DEEP = '0D1321';
const BG_DARK = '152238';
const CARD    = '1E3A5F';
const ORANGE  = 'F5A623';
const BLUE    = '4A90D9';
const WHITE   = 'FFFFFF';
const MUTED   = 'A0B4C8';
const WARN    = 'E05A2B';
const GREEN   = '1A3A2A';

const makeShadow = () => ({ type: 'outer', color: '000000', blur: 8, offset: 3, angle: 135, opacity: 0.3 });

function card(slide, x, y, w, h, fill) {
  slide.addShape('rect', { x, y, w, h, fill: { color: fill || CARD }, shadow: makeShadow(), line: { color: fill || CARD, width: 0 } });
}

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 8 — The Gem: Build With the Audience
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText("Let's build one. Right now. Your idea.", {
    x: 0.5, y: 0.25, w: 9, h: 0.75,
    fontSize: 36, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });
  s.addText('Geotab Add-In Architect Gem  →  Google Gemini  →  MyGeotab  →  done.', {
    x: 0.5, y: 1.05, w: 9, h: 0.45,
    fontSize: 18, color: MUTED, fontFace: 'Calibri', italic: true, align: 'left', margin: 0,
  });

  // 3 numbered steps
  const steps = ['You describe it', 'Gem writes the JSON', 'Paste into MyGeotab'];
  steps.forEach((text, i) => {
    const x = 0.6 + i * 3.1;
    // circle
    s.addShape('ellipse', { x: x + 1.05, y: 1.7, w: 0.9, h: 0.9, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
    s.addText(String(i + 1), { x: x + 1.05, y: 1.7, w: 0.9, h: 0.9, fontSize: 28, bold: true, color: BG_DEEP, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
    // connector arrow
    if (i < 2) {
      s.addText('→', { x: x + 2.95, y: 2.0, w: 0.5, h: 0.4, fontSize: 22, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', margin: 0 });
    }
    // label card
    card(s, x, 2.75, 2.8, 0.85, CARD);
    s.addText(text, { x: x + 0.1, y: 2.78, w: 2.6, h: 0.79, fontSize: 18, color: WHITE, fontFace: 'Calibri', align: 'center', valign: 'middle', margin: 0 });
  });

  // backup prompt
  card(s, 0.5, 3.8, 9, 1.3, '0A1A2E');
  s.addText('Backup prompt:', { x: 0.7, y: 3.84, w: 8.6, h: 0.35, fontSize: 13, bold: true, color: BLUE, fontFace: 'Trebuchet MS', margin: 0 });
  s.addText('"Safety coaching dashboard — show my 10 riskiest drivers ranked by speeding and harsh braking this week. Color-code red/yellow/green."', {
    x: 0.7, y: 4.2, w: 8.6, h: 0.78,
    fontSize: 14, color: MUTED, fontFace: 'Calibri', italic: true, align: 'left', margin: 0,
  });

  s.addText('No install.  No hosting.  No build step.', {
    x: 0.5, y: 5.2, w: 9, h: 0.3,
    fontSize: 14, color: ORANGE, fontFace: 'Calibri', bold: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 9 — Two Lanes Forward
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('Where do you go from here?', {
    x: 0.5, y: 0.25, w: 9, h: 0.65,
    fontSize: 34, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // left card: fleet manager
  card(s, 0.5, 1.05, 4.3, 3.5, CARD);
  s.addShape('rect', { x: 0.5, y: 1.05, w: 4.3, h: 0.48, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
  s.addText('Fleet Manager', { x: 0.6, y: 1.07, w: 4.1, h: 0.42, fontSize: 20, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
  s.addText([
    { text: 'The Gem is your tool', options: { bullet: true, breakLine: true } },
    { text: 'Describe → paste → done', options: { bullet: true, breakLine: true } },
    { text: 'This is a complete solution', options: { bullet: true, breakLine: true } },
    { text: 'Zero code, zero hosting', options: { bullet: true } },
  ], { x: 0.7, y: 1.65, w: 3.9, h: 2.7, fontSize: 18, color: WHITE, fontFace: 'Calibri' });

  // right card: developer
  card(s, 5.2, 1.05, 4.3, 3.5, '1A3A1A');
  s.addShape('rect', { x: 5.2, y: 1.05, w: 4.3, h: 0.48, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
  s.addText('Developer / Reseller', { x: 5.3, y: 1.07, w: 4.1, h: 0.42, fontSize: 20, bold: true, color: BG_DEEP, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
  s.addText([
    { text: 'The Gem is your scaffold', options: { bullet: true, breakLine: true } },
    { text: 'Copy JSON → GitHub → Claude Code', options: { bullet: true, breakLine: true } },
    { text: 'This is the starting point', options: { bullet: true, breakLine: true } },
    { text: 'Unlimited extension', options: { bullet: true } },
  ], { x: 5.4, y: 1.65, w: 3.9, h: 2.7, fontSize: 18, color: WHITE, fontFace: 'Calibri' });

  s.addText('Full guide: guides/GEM_TO_CLAUDE_CODE.md  ·  github.com/fhoffa/geotab-vibe-guide', {
    x: 0.5, y: 4.9, w: 9, h: 0.4,
    fontSize: 13, color: MUTED, fontFace: 'Calibri', italic: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 10 — How Claude Knows Geotab (Skills)
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('The repo that powers this session', {
    x: 0.5, y: 0.25, w: 9, h: 0.65,
    fontSize: 34, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // left card: for humans
  card(s, 0.5, 1.05, 4.3, 2.9, CARD);
  s.addShape('rect', { x: 0.5, y: 1.05, w: 4.3, h: 0.44, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
  s.addText('For humans  (guides/)', { x: 0.6, y: 1.07, w: 4.1, h: 0.38, fontSize: 17, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
  s.addText([
    { text: 'Tutorials & walkthroughs', options: { bullet: true, breakLine: true } },
    { text: 'Prompts to copy-paste', options: { bullet: true, breakLine: true } },
    { text: 'The Gem guide', options: { bullet: true, breakLine: true } },
    { text: 'Gem → GitHub → Claude Code bridge', options: { bullet: true } },
  ], { x: 0.7, y: 1.58, w: 3.9, h: 2.25, fontSize: 17, color: WHITE, fontFace: 'Calibri' });

  // right card: for AI tools
  card(s, 5.2, 1.05, 4.3, 2.9, '1A2E1A');
  s.addShape('rect', { x: 5.2, y: 1.05, w: 4.3, h: 0.44, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
  s.addText('For AI tools  (skills/)', { x: 5.3, y: 1.07, w: 4.1, h: 0.38, fontSize: 17, bold: true, color: BG_DEEP, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
  s.addText([
    { text: 'geotab — complete dev guide', options: { bullet: true, breakLine: true } },
    { text: 'agentic-n8n — fleet automation', options: { bullet: true, breakLine: true } },
    { text: 'geotab-custom-mcp — MCP servers', options: { bullet: true, breakLine: true } },
    { text: 'Works with Claude, Codex, Gemini…', options: { bullet: true } },
  ], { x: 5.4, y: 1.58, w: 3.9, h: 2.25, fontSize: 17, color: WHITE, fontFace: 'Calibri' });

  // callout
  card(s, 0.5, 4.1, 9, 0.85, '0A1A0A');
  s.addText('Your team can do this for your own domain.  agentskills.io  ·  open format  ·  any AI tool', {
    x: 0.65, y: 4.13, w: 8.7, h: 0.75,
    fontSize: 17, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0,
  });

  s.addText('github.com/fhoffa/geotab-vibe-guide', {
    x: 0.5, y: 5.2, w: 9, h: 0.3,
    fontSize: 13, color: MUTED, fontFace: 'Calibri', align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 11 — The Business Framing
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('AI assistants are becoming a business tool — like email, like a browser.', {
    x: 0.5, y: 0.2, w: 9, h: 0.9,
    fontSize: 28, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // big question
  card(s, 0.5, 1.2, 9, 0.85, '1A2E4A');
  s.addText('When your employees have an AI assistant — what can it do for your fleet?', {
    x: 0.65, y: 1.23, w: 8.7, h: 0.75,
    fontSize: 22, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0,
  });

  // wrong / right
  card(s, 0.5, 2.2, 9, 0.75, '2A1A1A');
  s.addText('❌  Wrong: "Why is Geotab making me pay for Claude?"', {
    x: 0.7, y: 2.23, w: 8.6, h: 0.65,
    fontSize: 18, color: WHITE, fontFace: 'Calibri', align: 'left', margin: 0,
  });

  card(s, 0.5, 3.1, 9, 0.85, GREEN);
  s.addText('✅  Right: "What becomes possible when my fleet is part of the AI conversation my team is already having?"', {
    x: 0.7, y: 3.13, w: 8.6, h: 0.75,
    fontSize: 18, color: WHITE, fontFace: 'Calibri', align: 'left', valign: 'middle', margin: 0,
  });

  // positioning statement
  s.addShape('rect', { x: 0, y: 4.25, w: 10, h: 0.08, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
  s.addText("Geotab isn't adopting AI.  Geotab is ready for the AI-native world you're already entering.", {
    x: 0.5, y: 4.4, w: 9, h: 0.85,
    fontSize: 20, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', margin: 0,
  });

  s.addText('Bring your AI tools.  We\'ll meet you there.', {
    x: 0.5, y: 5.18, w: 9, h: 0.35,
    fontSize: 16, color: MUTED, fontFace: 'Calibri', italic: true, align: 'center', margin: 0,
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 12 — Without MCP vs With MCP
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('Your AI assistant, connected to your fleet', {
    x: 0.5, y: 0.25, w: 9, h: 0.65,
    fontSize: 32, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  // without MCP
  card(s, 0.5, 1.05, 4.3, 3.7, CARD);
  s.addShape('rect', { x: 0.5, y: 1.05, w: 4.3, h: 0.44, fill: { color: '3A3A3A' }, line: { color: '3A3A3A', width: 0 } });
  s.addText('Without MCP', { x: 0.6, y: 1.07, w: 4.1, h: 0.38, fontSize: 18, bold: true, color: MUTED, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
  s.addText([
    { text: 'You: "Which vehicles are offline?"', options: { breakLine: true, color: WHITE } },
    { text: '\n', options: { breakLine: true } },
    { text: 'Claude: "I can help you write code to query that..."', options: { color: MUTED, italic: true } },
  ], { x: 0.65, y: 1.6, w: 4.0, h: 3.0, fontSize: 18, fontFace: 'Calibri', align: 'left', valign: 'top', margin: 8 });

  // with MCP
  card(s, 5.2, 1.05, 4.3, 3.7, '0A2A1A');
  s.addShape('rect', { x: 5.2, y: 1.05, w: 4.3, h: 0.44, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
  s.addText('With Geotab MCP', { x: 5.3, y: 1.07, w: 4.1, h: 0.38, fontSize: 18, bold: true, color: BG_DEEP, fontFace: 'Trebuchet MS', align: 'center', valign: 'middle', margin: 0 });
  s.addText([
    { text: 'You: "Which vehicles are offline?"', options: { breakLine: true, color: WHITE } },
    { text: '\n', options: { breakLine: true } },
    { text: 'Claude: [queries Geotab live]', options: { breakLine: true, color: MUTED, italic: true } },
    { text: '"2 vehicles — GVF-1204 (Lyon, 3 days) and GVF-0891 (Valencia, 5 days). Check fault history?"', options: { color: ORANGE } },
  ], { x: 5.35, y: 1.6, w: 4.0, h: 3.0, fontSize: 17, fontFace: 'Calibri', align: 'left', valign: 'top', margin: 8 });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 13 — The Announcement
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DEEP };

  s.addText('The Official Geotab MCP', {
    x: 0.5, y: 0.4, w: 9, h: 0.85,
    fontSize: 40, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'center', margin: 0,
  });

  // three stat blocks
  const stats = [['20', 'tools'], ['Full', 'read + write'], ['Beta', 'opening soon']];
  stats.forEach(([num, label], i) => {
    const x = 0.7 + i * 3.0;
    card(s, x, 1.45, 2.6, 2.2, CARD);
    s.addText(num, { x, y: 1.55, w: 2.6, h: 1.15, fontSize: 60, bold: true, color: ORANGE, fontFace: 'Trebuchet MS', align: 'center', margin: 0 });
    s.addText(label, { x, y: 2.72, w: 2.6, h: 0.5, fontSize: 18, color: WHITE, fontFace: 'Calibri', align: 'center', margin: 0 });
  });

  s.addText('Not a roadmap item.  I have early access.  Let me show you.', {
    x: 0.5, y: 4.0, w: 9, h: 0.55,
    fontSize: 18, color: MUTED, fontFace: 'Calibri', italic: true, align: 'center', margin: 0,
  });

  s.addShape('rect', { x: 2.5, y: 3.82, w: 5, h: 0.05, fill: { color: ORANGE }, line: { color: ORANGE, width: 0 } });
}

// ═══════════════════════════════════════════════════════════════════════════
// SLIDE 14 — The 20 Tools
// ═══════════════════════════════════════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: BG_DARK };

  s.addText('20 tools across 5 categories', {
    x: 0.5, y: 0.2, w: 9, h: 0.65,
    fontSize: 34, bold: true, color: WHITE, fontFace: 'Trebuchet MS', align: 'left', margin: 0,
  });

  const rows = [
    [
      { text: 'Category', options: { bold: true, color: WHITE, fill: { color: BLUE }, fontSize: 15 } },
      { text: 'Tools', options: { bold: true, color: WHITE, fill: { color: BLUE }, fontSize: 15 } },
    ],
    ['Data Retrieval', 'Get, GetCountOf, GetAceResults, ListEntities, GetEntity'],
    ['Fleet Management', 'Add, Set, Remove, DecodeVins'],
    ['Safety & Compliance', 'DismissFaults, GetHosRuleSets, EmissionEnrollDevices, EmissionDeadline, GetPostedRoadSpeeds'],
    ['Video — Go Focus', 'SearchMedia, GetMediaUrl, GetDevicesInformation, DownloadMediaFile, UploadMediaFile'],
    ['Reporting', 'SendReportProcessingRequest'],
  ];

  s.addTable(rows, {
    x: 0.5, y: 1.0, w: 9, h: 3.55,
    colW: [2.5, 6.5],
    border: { pt: 1, color: '2A4A6A' },
    fill: { color: CARD },
    color: WHITE, fontSize: 15, fontFace: 'Calibri',
    align: 'left', valign: 'middle',
  });

  s.addText('GetAceResults = natural language → fleet answer.   Add / Set / Remove = full write access.', {
    x: 0.5, y: 4.75, w: 9, h: 0.4,
    fontSize: 13, color: ORANGE, fontFace: 'Calibri', bold: true, align: 'center', margin: 0,
  });
}

pres.writeFile({ fileName: OUT }).then(() => console.log('✓ written:', OUT)).catch(e => { console.error(e); process.exit(1); });
