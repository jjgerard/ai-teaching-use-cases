const fs=require('fs');const rd=f=>JSON.parse(fs.readFileSync('data/policy/'+f));
const V=rd('run1/claims/statement-types.v2.json').types,C=rd('claims.json'),P=rd('presence.json');
const N=new Set(C.map(r=>r.doc_id)).size;
const ext={},aud={},uns={},fit={},pts={};
for(const r of C){for(const t of [r.claim,r.claim2])if(t&&t!=='unclassified'){(ext[t]??=new Set()).add(r.doc_id);pts[t]=(pts[t]||0)+1;(fit[t]??={clear:0,partial:0,none:0})[r.fit]++}}
for(const x of P.found)(aud[x.type||x.type_id]??=new Set()).add(x.doc_id);
for(const x of P.unsure)(uns[x.type||x.type_id]??=new Set()).add(x.doc_id);
const U={};for(const v of V){U[v.id]=new Set([...(ext[v.id]||[]),...(aud[v.id]||[])])}
const rows=V.map(v=>{const u=U[v.id];let best=['',0];for(const w of V){if(w.id===v.id)continue;const o=U[w.id];const i=[...u].filter(d=>o.has(d)).length;const j=i/(u.size+o.size-i||1);if(j>best[1])best=[w.id,j]}
 const f=fit[v.id]||{clear:0,partial:0,none:0};const tot=f.clear+f.partial+f.none;
 return{id:v.id,group:v.group,docs:u.size,pct:Math.round(100*u.size/N),pts:pts[v.id]||0,partial:tot?Math.round(100*f.partial/tot):null,unsure:(uns[v.id]||new Set()).size,sim:best[0].slice(0,38)+' '+best[1].toFixed(2)}}).sort((a,b)=>a.docs-b.docs);
console.log('N',N);for(const r of rows)console.log([r.docs,r.pct+'%','pts'+r.pts,'part'+r.partial,'uns'+r.unsure,r.id,r.sim].join('\t'));
