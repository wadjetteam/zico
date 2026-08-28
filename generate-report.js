#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function loadJson(name) {
  const p = path.join(process.cwd(), name);
  if (!fs.existsSync(p)) return null;
  const buf = fs.readFileSync(p);
  let raw = null;
  // detect encoding: UTF-16 LE BOM or UTF-8 BOM
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
    raw = buf.toString('utf16le');
  } else if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    raw = buf.toString('utf8');
  } else {
    // try utf8 first, fall back to utf16le
    raw = buf.toString('utf8');
    if (!raw.trim().startsWith('{') && !raw.trim().startsWith('[')) raw = buf.toString('utf16le');
  }
  try { return JSON.parse(raw); } catch (e) {
    const idx = raw.indexOf('{');
    if (idx >= 0) return JSON.parse(raw.slice(idx));
    throw e;
  }
}

function getResidual(r){
  if (!r) return 0;
  if (typeof r.residualScore === 'number' && r.residualScore>0) return r.residualScore;
  if (typeof r.suggestedResidual === 'number' && r.suggestedResidual>0) return r.suggestedResidual;
  if (typeof r.calculatedResidualScore === 'number' && r.calculatedResidualScore>0) return r.calculatedResidualScore;
  if (Array.isArray(r.impacts) && r.impacts.length){
    const avg = Math.round(r.impacts.reduce((s,i)=>s+Number(i.value||i),0)/r.impacts.length) || 1;
    return (Number(r.likelihood)||1) * avg;
  }
  if (typeof r.riskScore === 'number' && r.riskScore>0) return r.riskScore;
  return 0;
}

(async ()=>{
  const risksData = loadJson('risks.json');
  const controlsData = loadJson('controls.json');
  const policiesData = loadJson('policies.json');
  const poamData = loadJson('poam.json');

  const risks = (risksData && risksData.items) || [];
  const controls = (controlsData && controlsData.items) || [];
  const policies = (policiesData && policiesData.items) || [];
  const poam = (poamData && poamData.items) || [];

  // collect domains
  const domainSet = new Set();
  for (const r of risks){ if (r.domain && (r.domain.name||r.domain)) domainSet.add(String(r.domain.name||r.domain)); }
  for (const c of controls){ if (c.domain) domainSet.add(String(c.domain)); }
  const domains = Array.from(domainSet).sort();

  // metrics per domain
  const per = {};
  let maxRiskCount = 1;
  for (const d of domains){ per[d] = { riskCount:0, residuals:[], linkedControlsCount:0, evidenceCount:0, policiesCount:0 }; }
  for (const r of risks){
    const d = String(r.domain?.name || r.domain || 'Unassigned');
    if (!per[d]) per[d] = { riskCount:0, residuals:[], linkedControlsCount:0, evidenceCount:0, policiesCount:0 };
    per[d].riskCount++;
    const res = getResidual(r);
    if (res) per[d].residuals.push(res);
    const linked = Array.isArray(r.linkedControls) ? r.linkedControls.length : (Array.isArray(r.linked_controls)?r.linked_controls.length:0);
    if (linked>0) per[d].linkedControlsCount++;
    const evidence = Array.isArray(r.evidence) ? r.evidence.length : (Array.isArray(r.treatmentEvidence)? r.treatmentEvidence.length : 0);
    if (evidence>0) per[d].evidenceCount++;
  }
  for (const p of policies){
    // try to map policy to domain by category or tags
    const cat = String(p.category || p.tags?.[0] || 'Unassigned');
    if (per[cat]) per[cat].policiesCount++;
  }
  for (const d of Object.keys(per)) if (per[d].riskCount>maxRiskCount) maxRiskCount = per[d].riskCount;

  // normalize metrics for radar (0-100)
  const labels = ['Risks','Residual','Control Coverage','Evidence Complete','Policy Coverage'];
  const datasets = [];
  for (const d of Object.keys(per)){
    const entry = per[d];
    const riskNorm = Math.round((entry.riskCount / maxRiskCount) * 100);
    const avgResidual = entry.residuals.length ? (entry.residuals.reduce((s,x)=>s+x,0)/entry.residuals.length) : 0;
    const residualNorm = Math.round((avgResidual/25)*100); // 25 max
    const controlCov = entry.riskCount ? Math.round((entry.linkedControlsCount/entry.riskCount)*100) : 0;
    const evidenceCov = entry.riskCount ? Math.round((entry.evidenceCount/entry.riskCount)*100) : 0;
    const policyCov = policies.length ? Math.round((entry.policiesCount / policies.length)*100) : 0;
    datasets.push({ label: d, data: [riskNorm, residualNorm, controlCov, evidenceCov, policyCov] });
  }

  // build HTML
  // try to find a branding logo to embed (search common locations)
  let logoData = null;
  const logoCandidates = [
    path.join(process.cwd(),'client','public','logo.png'),
    path.join(process.cwd(),'client','public','logo.svg'),
    path.join(process.cwd(),'logo.png'),
    path.join(process.cwd(),'branding','logo.png'),
  ];
  for (const candidate of logoCandidates) {
    try {
      if (fs.existsSync(candidate)) {
        const buf = fs.readFileSync(candidate);
        const ext = path.extname(candidate).toLowerCase();
        const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.png' ? 'image/png' : 'image/jpeg';
        logoData = `data:${mime};base64,${buf.toString('base64')}`;
        break;
      }
    } catch (e) {
      // ignore
    }
  }
  const logoImg = logoData ? `<img src="${logoData}" alt="WADJET" style="height:64px; width:auto; object-fit:contain; margin-right:18px;"/>` : '';

  const html = `
<html>
<head>
<meta charset="utf-8">
<title>WADJET GRC — Master Report</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<style>
body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#111}
.header{border-bottom:1px solid #ddd;padding-bottom:8px;margin-bottom:12px}
h1{color:#0b3d91}
.section{margin-bottom:18px}
.table{width:100%;border-collapse:collapse}
.table th,.table td{border:1px solid #ddd;padding:6px;text-align:left}
.chart-wrap{width:800px;height:600px}
</style>
</head>
<body>
<div class="header" style="display:flex;align-items:center;justify-content:space-between;gap:18px;">
    <div style="display:flex;align-items:center;">
      ${logoImg}
      <div>
        <h1>WADJET GRC — Master Platform Report</h1>
        <div style="font-size:13px;color:#555;margin-top:4px">Executive summary and platform-level risk & control snapshot</div>
      </div>
    </div>
    <div style="text-align:right;color:#666;font-size:13px">Generated: ${new Date().toISOString()}<br/>For: Executive Board — Confidential</div>
  </div>
<div class="section">
<h2>Executive snapshot</h2>
<p>Risks: ${risks.length} · Controls: ${controls.length} · Policies: ${policies.length} · POAM items: ${poam.length}</p>
</div>
<div class="section">
<h2>Spider (Radar) chart — domains vs metrics</h2>
<canvas id="radar" width="800" height="600"></canvas>
<script>
const labels = ${JSON.stringify(labels)};
const datasets = ${JSON.stringify(datasets)};
const colors = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf'];
const ds = datasets.map((d,i)=>({ label:d.label, data:d.data, fill:true, backgroundColor: colors[i%colors.length]+'33', borderColor: colors[i%colors.length], pointBackgroundColor:colors[i%colors.length]}));
const ctx = document.getElementById('radar').getContext('2d');
new Chart(ctx, { type:'radar', data:{ labels, datasets: ds }, options:{ elements:{ line:{tension:0.2} }, scales:{ r:{ beginAtZero:true, max:100 } }, plugins:{ legend:{position:'right'} } } });
</script>
</div>
<div class="section">
<h2>Per-domain summary (raw numbers)</h2>
<table class="table"><thead><tr><th>Domain</th><th>Risks</th><th>Avg Residual</th><th>Control Coverage %</th><th>Evidence %</th><th>Policies Count</th></tr></thead><tbody>
${Object.keys(per).map(d=>{ const e=per[d]; const avg = e.residuals.length?Math.round(e.residuals.reduce((s,x)=>s+x,0)/e.residuals.length):0; return `<tr><td>${d}</td><td>${e.riskCount}</td><td>${avg}</td><td>${e.riskCount?Math.round((e.linkedControlsCount/e.riskCount)*100):0}</td><td>${e.riskCount?Math.round((e.evidenceCount/e.riskCount)*100):0}</td><td>${e.policiesCount}</td></tr>`}).join('')}
</tbody></table>
</div>
<div class="section"><h2>Top 10 risks</h2>
<table class="table"><thead><tr><th>RiskId</th><th>Title</th><th>Domain</th><th>Owner</th><th>Residual</th></tr></thead><tbody>
${risks.sort((a,b)=>getResidual(b)-getResidual(a)).slice(0,10).map(r=>`<tr><td>${r.riskId||r._id||''}</td><td>${r.title||''}</td><td>${r.domain?.name||r.domain||''}</td><td>${r.owner||r.riskOwner||''}</td><td>${getResidual(r)}</td></tr>`).join('')}
</tbody></table></div>
<div class="section"><h2>Module summaries</h2>
<ul>
<li>Risks: ${risks.length} (open: ${risks.filter(r=>r.status!=='Closed').length})</li>
<li>Controls: ${controls.length} (implemented: ${controls.filter(c=>/Implement|Implement/.test(c.status||'')).length})</li>
<li>Policies: ${policies.length} (published: ${policies.filter(p=>p.status==='Published').length})</li>
<li>POAM items: ${poam.length} (open: ${poam.filter(p=>p.status&&p.status!=='Closed').length})</li>
</ul>
</div>
<footer style="font-size:11px;color:#666;margin-top:20px;border-top:1px solid #eee;padding-top:8px">WADJET GRC Automated Engine — Generated on ${new Date().toISOString()}</footer>
</body>
</html>`;

  const outHtml = path.join(process.cwd(),'report-WADJET-MASTER-20260828.html');
  fs.writeFileSync(outHtml, html, 'utf8');

  // write CSV exports
  const toCsv = (arr, fields) => {
    const esc = (v) => typeof v === 'string' ? '"'+v.replace(/"/g,'""')+'"' : (v==null? '""': String(v));
    const header = fields.join(',') + '\n';
    const rows = arr.map(item => fields.map(f => esc(typeof f === 'function' ? f(item) : item[f])).join(',')).join('\n');
    return header + rows + '\n';
  };
  try {
    if (risks.length) fs.writeFileSync(path.join(process.cwd(),'risks.csv'), toCsv(risks, ['riskId', 'title', (r)=>r.domain?.name||r.domain||'', 'owner', (r)=>getResidual(r), 'status', 'treatment']));
    if (controls.length) fs.writeFileSync(path.join(process.cwd(),'controls.csv'), toCsv(controls, ['controlId','name','domain','status','progress','maturityLevel']));
    if (policies.length) fs.writeFileSync(path.join(process.cwd(),'policies.csv'), toCsv(policies, ['policyId','title','category','owner','status','version']));
    if (poam.length) fs.writeFileSync(path.join(process.cwd(),'poam.csv'), toCsv(poam, ['_id','title','risk_id','owner','status','dueDate']));
    console.log('CSV exports written');
  } catch (e) { console.error('Failed writing CSVs', e.message); }

  // render to PDF and capture radar PNG
  const browser = await puppeteer.launch({ args:['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + outHtml, { waitUntil: 'networkidle0' });

  // capture radar canvas as PNG via dataURL
  try {
    const dataUrl = await page.evaluate(() => {
      const c = document.getElementById('radar');
      if (!c) return null;
      return c.toDataURL('image/png');
    });
    if (dataUrl) {
      const base64 = dataUrl.split(',')[1];
      fs.writeFileSync(path.join(process.cwd(),'report-WADJET-MASTER-20260828-radar.png'), Buffer.from(base64, 'base64'));
      console.log('Radar PNG written');
    } else console.warn('Radar canvas not found');
  } catch (e) {
    console.warn('Failed to capture radar PNG:', e.message);
  }

  const outPdf = path.join(process.cwd(),'report-WADJET-MASTER-20260828.pdf');
  await page.pdf({ path: outPdf, format: 'A4', printBackground:true, margin:{top:'20mm',bottom:'20mm',left:'15mm',right:'15mm'} });
  await browser.close();
  console.log('PDF written to', outPdf);
})();
