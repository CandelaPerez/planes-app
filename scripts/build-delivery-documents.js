import { readFile, writeFile, mkdir, mkdtemp } from 'node:fs/promises';
import { deflateRawSync } from 'node:zlib';
import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = new URL('../docs/entrega/', import.meta.url);
const titles = ['INFORME', 'BITACORA', 'VERIFICACION', 'EVIDENCIAS', 'GUION_VIDEO', 'PENDIENTES'];
const docs = await Promise.all(titles.map(async name => ({ name, text: await readFile(new URL(name + '.md', directory), 'utf8') })));
const esc = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const inline = value => esc(value).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
async function html(text) {
  const result = [];
  for (const line of text.split(/\r?\n/)) {
    const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line);
    if (image) {
      const bytes = await readFile(new URL(image[2], directory));
      result.push('<figure><img src="data:image/png;base64,' + bytes.toString('base64') + '" alt="' + esc(image[1]) + '"><figcaption>' + esc(image[1]) + '</figcaption></figure>');
    } else if (/^#{1,6} /.test(line)) {
      const level = line.indexOf(' '); result.push('<h' + level + '>' + inline(line.slice(level + 1)) + '</h' + level + '>');
    } else if (line.trim()) result.push('<p>' + inline(line) + '</p>');
  }
  return result.join('\n');
}
const contents = await Promise.all(docs.map(async doc => '<section class="chapter">' + await html(doc.text) + '</section>'));
const outputHtml = '<!doctype html><html lang="es"><meta charset="utf-8"><title>Por Hacer — Entrega TP2</title><style>body{font:11pt/1.5 Arial,sans-serif;color:#2b2d42;max-width:820px;margin:40px auto;padding:0 24px}h1{font-size:23pt;line-height:1.2;border-bottom:2px solid #2b2d42;padding-bottom:12px}h2{font-size:15pt;margin-top:24px;break-after:avoid}h3{font-size:12pt;break-after:avoid}p{margin:8px 0}a{color:#365e91;overflow-wrap:anywhere}code{font-size:10pt}figure{text-align:center;break-inside:avoid;margin:20px 0}img{max-width:100%;max-height:520px;object-fit:contain}figcaption{font-size:9pt;color:#555}.chapter{margin-bottom:48px}@page{size:A4;margin:19mm}@media print{body{margin:0;padding:0;max-width:none}.chapter+.chapter{break-before:page}img{max-height:190mm}}</style>' + contents.join('\n') + '</html>';
await writeFile(new URL('DOSSIER_ENTREGA.html', directory), outputHtml);

// Minimal standard OOXML package; no third-party document dependencies.
const crcTable = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ value >>> 1 : value >>> 1;
  return value >>> 0;
});
const crc32 = bytes => {
  let value = 0xffffffff;
  for (const byte of bytes) value = crcTable[(value ^ byte) & 255] ^ value >>> 8;
  return (value ^ 0xffffffff) >>> 0;
};
function zip(files) {
  const chunks = [], central = []; let offset = 0;
  for (const [name, input] of files) {
    const data = Buffer.isBuffer(input) ? input : Buffer.from(input), filename = Buffer.from(name), compressed = deflateRawSync(data), crc = crc32(data);
    const head = Buffer.alloc(30); head.writeUInt32LE(0x04034b50); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x800, 6); head.writeUInt16LE(8, 8); head.writeUInt32LE(crc, 14); head.writeUInt32LE(compressed.length, 18); head.writeUInt32LE(data.length, 22); head.writeUInt16LE(filename.length, 26);
    const entry = Buffer.alloc(46); entry.writeUInt32LE(0x02014b50); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x800, 8); entry.writeUInt16LE(8, 10); entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(compressed.length, 20); entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(filename.length, 28); entry.writeUInt32LE(offset, 42);
    chunks.push(head, filename, compressed); central.push(entry, filename); offset += head.length + filename.length + compressed.length;
  }
  const table = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(table.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, table, end]);
}
const plain = line => line.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
async function word(selected, filename) {
  const body = [], media = [], rels = [];
  const paragraph = (text, style = 'Normal') => '<w:p><w:pPr><w:pStyle w:val="' + style + '"/></w:pPr><w:r><w:t xml:space="preserve">' + esc(text) + '</w:t></w:r></w:p>';
  for (const [index, doc] of selected.entries()) {
    if (index) body.push('<w:p><w:r><w:br w:type="page"/></w:r></w:p>');
    for (const line of doc.text.split(/\r?\n/)) {
      const image = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(line);
      if (image) {
        const data = await readFile(new URL(image[2], directory)), number = media.length + 1, id = 'rIdImage' + number;
        const width = data.readUInt32BE(16), height = data.readUInt32BE(20), cx = Math.round((height > width ? 2.65 : 5.7) * 914400), cy = Math.round(cx * height / width);
        media.push(['word/media/image' + number + '.png', data]);
        rels.push('<Relationship Id="' + id + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image' + number + '.png"/>');
        body.push('<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline><wp:extent cx="' + cx + '" cy="' + cy + '"/><wp:docPr id="' + number + '" name="Captura ' + number + '"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="' + number + '" name="Captura"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="' + id + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>');
        body.push(paragraph(image[1]));
      } else if (line.trim()) {
        const heading = /^(#{1,6}) (.*)$/.exec(line);
        body.push(paragraph(plain(heading ? heading[2] : line), heading ? heading[1].length === 1 ? 'Title' : 'Heading1' : 'Normal'));
      }
    }
  }
  const document = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>' + body.join('') + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1077" w:right="1077" w:bottom="1077" w:left="1077"/></w:sectPr></w:body></w:document>';
  const styles = '<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:after="140" w:line="276" w:lineRule="auto"/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="2B2D42"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="240"/></w:pPr><w:rPr><w:b/><w:sz w:val="38"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="Heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="220" w:after="140"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style></w:styles>';
  const files = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdDocument" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
    ['word/document.xml', document], ['word/styles.xml', styles],
    ['word/_rels/document.xml.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' + rels.join('') + '</Relationships>'], ...media,
  ];
  await writeFile(new URL(filename, directory), zip(files));
}
await mkdir(directory, { recursive: true });
await word(docs.filter(doc => doc.name === 'INFORME'), 'INFORME_POR_HACER.docx');
await word(docs.filter(doc => ['BITACORA', 'EVIDENCIAS'].includes(doc.name)), 'BITACORA_POR_HACER.docx');
await word(docs, 'DOSSIER_ENTREGA.docx');
if (globalThis.process.argv.includes('--pdf')) {
  const chrome = globalThis.process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const profile = await mkdtemp(join(tmpdir(), 'porhacer-delivery-pdf-'));
  const pdf = new URL('DOSSIER_ENTREGA.pdf', directory);
  const result = spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--no-pdf-header-footer', '--user-data-dir=' + profile, '--print-to-pdf=' + fileURLToPath(pdf), new URL('DOSSIER_ENTREGA.html', directory).href], { windowsHide: true, timeout: 45000, encoding: 'utf8' });
  if (result.error || result.status !== 0) throw result.error || Error('Chrome PDF failed: ' + result.status);
  const bytes = await readFile(pdf); if (bytes.subarray(0, 5).toString() !== '%PDF-') throw Error('Invalid PDF');
}
console.log('Documentos de entrega generados en docs/entrega.');
