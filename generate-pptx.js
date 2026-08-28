#!/usr/bin/env node
const PptxGenJS = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const PORTFOLIO_VALUE = 100_000_000; // EGP proxy for exposure calculation

function safeReadJson(file){
  try{ const p=path.join(process.cwd(),file); if(!fs.existsSync(p)) return null; return JSON.parse(fs.readFileSync(p,'utf8')); }catch(e){ return null; }
}

function getResidual(r){
  if(!r) return 0;
  if(typeof r.residualScore==='number'&&r.residualScore>0) return r.residualScore;
  if(typeof r.suggestedResidual==='number'&&r.suggestedResidual>0) return r.suggestedResidual;
  if(typeof r.calculatedResidualScore==='number'&&r.calculatedResidualScore>0) return r.calculatedResidualScore;
  if(Array.isArray(r.impacts)&&r.impacts.length){
    const avg = Math.round(r.impacts.reduce((s,i)=>s+Number(i.value||i),0)/r.impacts.length)||1;
    return (Number(r.likelihood)||1)*avg;
  }
  if(typeof r.riskScore==='number'&&r.riskScore>0) return r.riskScore;
  return 0;
}

(async ()=>{
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  // find branding logo if present
  let logoFile = null;
  const logoCandidates = [
    path.join(process.cwd(),'client','public','logo.png'),
    path.join(process.cwd(),'client','public','logo.svg'),
    path.join(process.cwd(),'logo.png'),
    path.join(process.cwd(),'branding','logo.png'),
  ];
  for (const c of logoCandidates) {
    try { if (fs.existsSync(c)) { logoFile = c; break; } } catch (e) {}
  }

  const risksData = safeReadJson('risks.json') || { items: [] };
  const controlsData = safeReadJson('controls.json') || { items: [] };
  const policiesData = safeReadJson('policies.json') || { items: [] };
  const poamData = safeReadJson('poam.json') || { items: [] };
  const risks = risksData.items || [];
  const controls = controlsData.items || [];
  const policies = policiesData.items || [];
  const poam = poamData.items || [];

  // compute per-domain metrics
  const domains = {};
  for(const r of risks){
    const d = String(r.domain?.name || r.domain || 'Unassigned');
    if(!domains[d]) domains[d] = { risks:[], linkedControlsCount:0, evidenceCount:0, policyCount:0 };
    domains[d].risks.push(r);
  }
  for(const c of controls){
    const d = String(c.domain || 'Unassigned');
    if(!domains[d]) domains[d] = { risks:[], linkedControlsCount:0, evidenceCount:0, policyCount:0 };
  }
  for(const p of policies){
    const d = String(p.category || p.tags?.[0] || 'Unassigned');
    if(!domains[d]) domains[d] = { risks:[], linkedControlsCount:0, evidenceCount:0, policyCount:0 };
    domains[d].policyCount = (domains[d].policyCount||0)+1;
  }

  for(const dName of Object.keys(domains)){
    const entry = domains[dName];
    entry.riskCount = entry.risks.length;
    entry.avgResidual = entry.risks.length? Math.round(entry.risks.reduce((s,r)=>s+getResidual(r),0)/entry.risks.length):0;
    entry.exposureEGP = Math.round((entry.avgResidual/25)*PORTFOLIO_VALUE);
    entry.controlCoverage = entry.riskCount? Math.round(entry.risks.filter(r=> (Array.isArray(r.linkedControls)?r.linkedControls.length:(Array.isArray(r.linked_controls)?r.linked_controls.length:0))>0).length / entry.riskCount *100):0;
    entry.evidenceCoverage = entry.riskCount? Math.round(entry.risks.filter(r=> (Array.isArray(r.evidence)?r.evidence.length: (r.treatmentEvidence? r.treatmentEvidence.length:0))>0).length / entry.riskCount *100):0;
  }

  // --- Slide 1: Title / Executive snapshot ---
  let slide = pptx.addSlide();
  slide.addText('WADJET GRC — Master Platform Report', { x:0.5, y:0.4, fontSize:28, bold:true, color:'003366' });
  slide.addText(`Generated: ${new Date().toISOString()}`, { x:0.5, y:1.1, fontSize:11, color:'666666' });
  if (logoFile) {
    try { slide.addImage({ path: logoFile, x:11.0, y:0.25, w:1.2 }); } catch (e) { /* ignore */ }
  }

  const totalOpenRisks = risks.filter(r=>r.status!=='Closed').length;
  const highCritical = risks.filter(r=>['High','Critical'].includes(r.severityLevel||r.inherentLevel)).length;
  const controlCoveragePercent = controls.length? Math.round((controls.filter(c=>c.progress>=100).length/controls.length)*100):0;

  slide.addText(`Snapshot: Risks: ${risks.length} · Open: ${totalOpenRisks} · High/Critical: ${highCritical}\nControls: ${controls.length} · Implemented: ${controlCoveragePercent}%\nPolicies: ${policies.length} · POAM items: ${poam.length}`, { x:0.5, y:1.6, fontSize:12, color:'222222' });

  // --- Slide 2: radar chart using pptx chart ---
  const labels = ['Risks','Residual','Control Coverage','Evidence','Policy Coverage'];
  const series = [];
  const colors = ['003366','FF7F0E','2CA02C','D62728','9467BD','8C564B','E377C2','7F7F7F'];
  let ci = 0;
  for(const [dName, entry] of Object.entries(domains)){
    series.push({ name: dName, labels, values: [entry.riskCount?Math.round((entry.riskCount/ (Math.max(...Object.values(domains).map(x=>x.riskCount)||[1]))*100)):0, entry.avgResidual?Math.round((entry.avgResidual/25)*100):0, entry.controlCoverage||0, entry.evidenceCoverage||0, entry.policyCount?Math.round((entry.policyCount / Math.max(1, policies.length))*100):0 ] });
    ci++;
  }
  if(series.length===0) series.push({ name:'No data', labels, values:[0,0,0,0,0] });
  slide = pptx.addSlide();
  slide.addText('Domain spider (radar) — Key metrics (normalized)', { x:0.5, y:0.3, fontSize:16, bold:true });
  slide.addChart(pptx.ChartType.radar, series, { x:0.5, y:1.0, w:13.0, h:5.5, showLegend:true });

  // --- Per-domain slides with charts and table ---
  const maxPerSlide = 1; // one domain per slide for clarity
  for(const [dName, entry] of Object.entries(domains)){
    slide = pptx.addSlide();
    slide.addText(`Domain: ${dName}`, { x:0.5, y:0.2, fontSize:18, bold:true });
    slide.addText(`Risks: ${entry.riskCount} · Avg residual: ${entry.avgResidual} · Exposure (EGP): ${entry.exposureEGP.toLocaleString()}\nControl coverage: ${entry.controlCoverage}% · Evidence coverage: ${entry.evidenceCoverage}% · Policies: ${entry.policyCount}`, { x:0.5, y:0.7, fontSize:11 });

    // Column chart: Exposure vs Control Coverage
    const chartData = [
      { name: 'Exposure (EGP, scaled M)', labels: ['Exposure'], values: [Math.round(entry.exposureEGP/1_000_000)] },
      { name: 'Control Coverage %', labels: ['Coverage'], values: [entry.controlCoverage] },
    ];
    slide.addChart(pptx.ChartType.bar, chartData, { x:0.5, y:1.6, w:6.5, h:4.0, barDir:'col' });

    // Small table of top risks for this domain
    const domainTop = (entry.risks||[]).sort((a,b)=>getResidual(b)-getResidual(a)).slice(0,5).map(r=>[ r.riskId||r._id||'', r.title||'', String(getResidual(r)) ]);
    if(domainTop.length){
      const tableRows = [ ['Risk ID','Title','Residual'], ...domainTop ];
      slide.addTable(tableRows, { x:7.2, y:1.6, w:6.5, h:3.5, fontSize:10, colW:[1.3,3.5,1.0] });
    }
  }

  // --- Top 10 risks (split into slides if needed) ---
  const sortedRisks = risks.slice().sort((a,b)=>getResidual(b)-getResidual(a));
  const chunks = [];
  for(let i=0;i<sortedRisks.length;i+=10) chunks.push(sortedRisks.slice(i,i+10));
  for(const chunk of chunks){
    slide = pptx.addSlide();
    slide.addText('Top Risks (by residual)', { x:0.5, y:0.2, fontSize:16, bold:true });
    const rows = [ ['Risk ID','Title','Domain','Owner','Residual'] , ...chunk.map(r=>[ r.riskId||r._id||'', (r.title||'').slice(0,60), r.domain?.name||r.domain||'', r.owner||r.riskOwner||'', String(getResidual(r)) ]) ];
    slide.addTable(rows, { x:0.4, y:0.8, w:13.2, fontSize:10, colW:[1.2,6.5,2.0,2.0,1.0] });
  }

  // --- Closing / recommendations slide ---
  slide = pptx.addSlide();
  slide.addText('Recommendations & Next steps', { x:0.5, y:0.3, fontSize:16, bold:true });
  const recs = [
    'Approve prioritized funding for top remediation projects (MFA/PAM, Vendor SLAs, BCP).',
    'Operationalize second-approval gating for Critical risks and require evidence checklist for closure.',
    'Increase RAG suggestion acceptance threshold to 80% and mandate human validation.',
    'Quarterly audit sampling (n≥5) for high/critical treatments.'
  ];
  slide.addText(recs.map((r,i)=>`${i+1}. ${r}`).join('\n'), { x:0.6, y:0.9, fontSize:12 });

  const out = path.join(process.cwd(),'report-WADJET-MASTER-20260828-enhanced.pptx');
  await pptx.writeFile({ fileName: out });
  console.log('Enhanced PPTX written to', out);
})();
