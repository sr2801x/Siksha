// Minimal text-only PDF writer used to generate sample study PDFs for the demo seed.
function wrap(text, width = 88) {
  const out = [];
  for (const para of text.split('\n')) {
    if (!para.trim()) {
      out.push('');
      continue;
    }
    let line = '';
    for (const word of para.split(/\s+/)) {
      if ((line + ' ' + word).trim().length > width) {
        out.push(line);
        line = word;
      } else line = (line + ' ' + word).trim();
    }
    out.push(line);
  }
  return out;
}

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '');

function makePdf(title, body) {
  const lines = wrap(body);
  const perPage = 46;
  const pages = [];
  for (let i = 0; i < Math.max(lines.length, 1); i += perPage) pages.push(lines.slice(i, i + perPage));

  const objects = [];
  const add = (s) => objects.push(s) && objects.length;
  const catalog = add('');
  const pagesObj = add('');
  const fontReg = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  const pageIds = [];
  pages.forEach((pl, idx) => {
    let stream = 'BT\n';
    let y = 790;
    if (idx === 0) {
      stream += `/F2 18 Tf 50 ${y} Td (${esc(title)}) Tj\n`;
      stream += `/F1 9 Tf 0 -16 Td (Siksha - Smart Learning Platform) Tj\n`;
      stream += `/F1 11 Tf 0 -28 Td\n`;
    } else stream += `/F1 11 Tf 50 ${y} Td\n`;
    for (const l of pl) stream += `(${esc(l)}) Tj 0 -15 Td\n`;
    stream += `ET\nBT /F1 8 Tf 500 30 Td (Page ${idx + 1} of ${pages.length}) Tj ET`;
    const content = add(`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`);
    pageIds.push(
      add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontReg} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${content} 0 R >>`)
    );
  });
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${pageIds.map((p) => `${p} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) out += `${String(off).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(out, 'latin1');
}

module.exports = { makePdf };
