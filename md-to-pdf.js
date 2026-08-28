#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const marked = require('marked');
const puppeteer = require('puppeteer');

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node md-to-pdf.js input.md output.pdf');
    process.exit(2);
  }
  const input = path.resolve(args[0]);
  const output = path.resolve(args[1]);
  const md = fs.readFileSync(input, 'utf8');
  const htmlBody = marked(md, { gfm: true });
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Report PDF</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; margin: 40px; color:#111; }
  pre { background:#f5f5f5; padding:10px; overflow:auto }
  code { background:#f5f5f5; padding:2px 4px }
  h1,h2,h3 { color:#0b3d91 }
  table { border-collapse: collapse; width: 100%; }
  table, th, td { border: 1px solid #ccc; }
  th, td { padding: 6px; text-align: left; }
  .header { font-size: 12px; border-bottom:1px solid #ddd; padding-bottom:8px; margin-bottom:12px }
</style>
</head>
<body>
<div class="header">WADJET GRC — Master Platform Report</div>
${htmlBody}
</body>
</html>`;

  const tmpHtml = path.join(path.dirname(output), `._tmp_report_${Date.now()}.html`);
  fs.writeFileSync(tmpHtml, html, 'utf8');
  let browser = null;
  try {
    browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto('file://' + tmpHtml, { waitUntil: 'networkidle0' });
    await page.pdf({ path: output, format: 'A4', printBackground: true, margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' } });
    console.log('PDF written to', output);
  } catch (err) {
    console.error('Failed to create PDF:', err.message || err);
    process.exit(3);
  } finally {
    if (browser) await browser.close();
    try { fs.unlinkSync(tmpHtml); } catch (e) {}
  }
}

main();
