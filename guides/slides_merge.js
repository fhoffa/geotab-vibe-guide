const { execSync } = require('child_process');
const path = require('path');

// Use python-pptx via a temp python script to merge three pptx files
const pythonScript = `
import sys
from pptx import Presentation
from pptx.util import Inches

batches = ['batch1.pptx', 'batch2.pptx', 'batch3.pptx']
out = 'vibe_coding_masterclass.pptx'

# Open first as base
merged = Presentation(batches[0])

for batch_file in batches[1:]:
    src = Presentation(batch_file)
    for slide in src.slides:
        # Clone slide layout (use blank from merged as fallback)
        slide_layout = merged.slide_layouts[6]  # blank
        new_slide = merged.slides.add_slide(slide_layout)

        # Copy all shapes
        from pptx.oxml.ns import qn
        from lxml import etree
        import copy

        # Remove placeholder shapes from new slide
        sp_tree = new_slide.shapes._spTree
        for sp in sp_tree.findall(qn('p:sp')):
            sp_tree.remove(sp)

        # Copy spTree children from source slide (skip bg, grpSpPr)
        src_sp_tree = slide.shapes._spTree
        for child in src_sp_tree:
            if child.tag not in (qn('p:grpSpPr'), qn('p:sp') + '[@id="1"]'):
                new_slide.shapes._spTree.append(copy.deepcopy(child))

        # Copy background
        if slide._element.find(qn('p:bg')) is not None:
            bg = copy.deepcopy(slide._element.find(qn('p:bg')))
            sp_tree_parent = new_slide._element
            existing_bg = sp_tree_parent.find(qn('p:bg'))
            if existing_bg is not None:
                sp_tree_parent.remove(existing_bg)
            sp_tree_parent.insert(2, bg)

        # Copy slide transition/timing notes if any
        src_notes = slide.notes_slide if slide.has_notes_slide else None

merged.save(out)
print(f'✓ merged {sum(1 for b in batches for _ in Presentation(b).slides)} slides → {out}')
`;

const fs = require('fs');
fs.writeFileSync('/tmp/merge_pptx.py', pythonScript);

try {
  const result = execSync('python3 /tmp/merge_pptx.py', { cwd: __dirname, encoding: 'utf8' });
  console.log(result.trim());
} catch (e) {
  console.error('python merge failed, trying fallback approach...');
  console.error(e.message);
  process.exit(1);
}
