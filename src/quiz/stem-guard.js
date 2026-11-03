/* voxel-scholar · single-question stem guard, ported from the v15.2 prototype.
   Loaded as a classic script. Tests evaluate this file in a vm. */
function countStemQMarks(s){
  if(s==null)return 0;
  s=String(s);
  // 省略号 …… / ... 不算问号；全角／半角问号计入
  s=s.replace(/……/g,'').replace(/\.\.\./g,'');
  let n=0;
  for(const ch of s){ if(ch==='？'||ch==='?') n++; }
  return n;
}
function stemHasMultiQuestion(s){ return countStemQMarks(s)>1; }
/** 扫描静态题库工厂与若干次动态 gen，收集多问号题干 */
function auditQuestionStems(opts){
  opts=opts||{};
  const rounds=opts.rounds||8;
  const bad=[];
  const seen=new Set();
  function check(q, meta){
    if(!q||seen.has(q+'|'+meta)) return;
    if(!stemHasMultiQuestion(q)) return;
    seen.add(q+'|'+meta);
    bad.push({q, meta, marks:countStemQMarks(q)});
  }
  function runFactory(fn, meta){
    try{
      const r=fn();
      if(!r) return;
      if(typeof r==='function'){ const q=r(); if(q&&q.q) check(q.q, meta); return; }
      if(r.q) check(r.q, meta);
      if(Array.isArray(r)) r.forEach((x,i)=>{ if(x&&x.q) check(x.q, meta+'['+i+']'); if(typeof x==='function'){ const y=x(); if(y&&y.q) check(y.q, meta+'['+i+']'); }});
    }catch(e){ /* skip broken factory */ }
  }
  for(const ed of ['new','old']){
    const B=BOOKS[ed]; if(!B) continue;
    for(const sub of Object.keys(B)){
      const units=B[sub]; if(!Array.isArray(units)) continue;
      for(const u of units){
        const meta=ed+'.'+sub+'.'+(u.id||u.name||'?');
        if(typeof u.gen==='function'){
          for(let i=0;i<rounds;i++) runFactory(()=>u.gen(), meta+'#gen'+i);
        }
        if(Array.isArray(u.qs)) u.qs.forEach((fn,i)=>runFactory(typeof fn==='function'?fn:()=>fn, meta+'.qs'+i));
        if(Array.isArray(u.list)) u.list.forEach((fn,i)=>runFactory(typeof fn==='function'?fn:()=>fn, meta+'.list'+i));
      }
    }
  }
  // 直接扫 XM / YW 静态工厂（若存在）
  try{
    if(typeof XM==='object'&&XM) for(const k of Object.keys(XM)){
      const arr=XM[k]; if(!Array.isArray(arr)) continue;
      arr.forEach((fn,i)=>runFactory(typeof fn==='function'?fn:()=>fn, 'XM.'+k+'['+i+']'));
    }
  }catch(e){}
  try{
    if(typeof YW==='object'&&YW) for(const k of Object.keys(YW)){
      const arr=YW[k]; if(!Array.isArray(arr)) continue;
      arr.forEach((fn,i)=>runFactory(typeof fn==='function'?fn:()=>fn, 'YW.'+k+'['+i+']'));
    }
  }catch(e){}
  try{
    if(typeof XY==='object'&&XY) for(const k of Object.keys(XY)){
      const arr=XY[k]; if(!Array.isArray(arr)) continue;
      arr.forEach((fn,i)=>runFactory(typeof fn==='function'?fn:()=>fn, 'XY.'+k+'['+i+']'));
    }
  }catch(e){}
  // 角/线段等独立 gen（同 IIFE 作用域）
  const namedGens=[typeof angleGen==='function'&&angleGen,typeof clockGen==='function'&&clockGen,typeof segGen==='function'&&segGen,typeof dirGen==='function'&&dirGen,typeof vertGen==='function'&&vertGen].filter(Boolean);
  namedGens.forEach((fn,i)=>{ for(let k=0;k<rounds;k++) runFactory(fn, 'named'+i+'#'+k); });
  return {ok:bad.length===0, bad, checkedHint:'BOOKS+XM+YW+namedGens x'+rounds};
}
function sanitizeStemIfNeeded(q){
  // 运行时兜底：若误漏网，只保留最后一个问句，避免选项对不上前半句
  if(!stemHasMultiQuestion(q)) return q;
  const parts=String(q).split(/(?<=[？?])/);
  // 合并：取最后一段含问号的完整问句；若最后一段过短则取最后两段
  let last=parts.filter(p=>p.trim()).pop()||q;
  if(last.length<8 && parts.length>=2) last=(parts[parts.length-2]||'')+last;
  return last.trim()||q;
}
