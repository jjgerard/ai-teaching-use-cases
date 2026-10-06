const fs=require('fs');const rd=f=>JSON.parse(fs.readFileSync('data/policy/'+f));
const C=rd('claims.json'),P=rd('presence.json');
const T=Object.fromEntries(rd('run1/claims/statement-types.v1.json').types.map(t=>[t.id,t.label]));
const S={},n={};for(const r of C){n[r.doc_id]=(n[r.doc_id]||0)+1;(S[r.doc_id]??=new Set());for(const t of [r.claim,r.claim2])if(t&&t!=='unclassified')S[r.doc_id].add(t)}
for(const x of P.found)(S[x.doc_id]??=new Set()).add(x.type||x.type_id);
const ids=Object.keys(S).filter(d=>n[d]>=8);
const size=d=>S[d].size;const sorted=ids.map(size).sort((a,b)=>a-b);const med=sorted[Math.floor(sorted.length/2)];
const strata=[ids.filter(d=>size(d)<=med),ids.filter(d=>size(d)>med)];
console.log('docs',ids.length,'median types/doc',med,'strata',strata.map(s=>s.length));
const sup={};for(const d of ids)for(const t of S[d])sup[t]=(sup[t]||0)+1;
const ts=Object.keys(sup).filter(t=>sup[t]>=8&&sup[t]<=ids.length-8);
const out=[];
for(let i=0;i<ts.length;i++)for(let j=i+1;j<ts.length;j++){const A=ts[i],B=ts[j];let num=0,den=0,or=[];
 for(const st of strata){let a=0,b=0,c=0,d=0;for(const x of st){const p=S[x].has(A),q=S[x].has(B);if(p&&q)a++;else if(p)b++;else if(q)c++;else d++}
  const N=a+b+c+d;num+=a*d/N;den+=b*c/N}
 out.push({A,B,mh:num/(den||1e-9)})}
const wanted=[['institution_provides_or_recommends_tool','data_protection'],['ai_output_may_be_wrong_so_verify_it','bias_and_exclusion'],['assessment_tiered','no_ai_at_all'],['ai_tools_may_store','ai_draws_on_others'],['ai_permitted_for_study','spelling_grammar'],['ai_draws_on_others','bias_and_exclusion']];
for(const [a,b] of wanted){const r=out.find(o=>(o.A.includes(a)&&o.B.includes(b))||(o.B.includes(a)&&o.A.includes(b)));console.log(r?[T[r.A],T[r.B],'MH OR='+r.mh.toFixed(1)].join(' | '):'? '+a+' '+b)}
