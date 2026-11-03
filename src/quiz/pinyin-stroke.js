/* voxel-scholar · pinyin and stroke-order mode.
   Expects globals HZD and PYD from the question pack, and BOOKS from generators.js.
   Stroke outlines are third-party glyph data; see data/strokes/ and NOTICE. */
// ===================== 拼音世界 & 笔顺世界 =====================
const TONEV={a:'āáǎà',o:'ōóǒò',e:'ēéěè',i:'īíǐì',u:'ūúǔù','ü':'ǖǘǚǜ'};
function pyParse(s){let tone=5,base='';for(const ch of s){let f=false;for(const v in TONEV){const k=TONEV[v].indexOf(ch);if(k>=0){tone=k+1;base+=v;f=true;break}}if(!f)base+=ch}return{base,tone}}
function pyMark(base,tone){if(!tone||tone===5)return base;let idx=-1;if(base.includes('a'))idx=base.indexOf('a');else if(base.includes('e'))idx=base.indexOf('e');else if(base.includes('ou'))idx=base.indexOf('o');else{for(let i=base.length-1;i>=0;i--)if('iouü'.includes(base[i])){idx=i;break}}if(idx<0)return base;return base.slice(0,idx)+TONEV[base[idx]][tone-1]+base.slice(idx+1)}
function pyMarkAt(base,tone,idx){const v=base[idx];if(!TONEV[v])return null;return base.slice(0,idx)+TONEV[v][tone-1]+base.slice(idx+1)}
const INITS=['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h','j','q','x','r','z','c','s','y','w'];
function pySplit(base){for(const i of INITS)if(base.startsWith(i)&&base.length>i.length)return{ini:i,fin:base.slice(i.length)};return{ini:'',fin:base}}
const TN=['','第一声','第二声','第三声','第四声'];
// 数据
const PYI=PYD.map(([w,p,both,word])=>({w,p,both,word,sy:p.split(' ').map(pyParse)}));
const VALID=new Set();PYI.forEach(x=>x.sy.forEach(s=>VALID.add(s.base)));
['shong','chong','zhong','song','cong','zong','sen','shen','zen','zhen','cen','chen','san','shan','zan','zhan','can','chan','sang','shang','zang','zhang','cang','chang','seng','sheng','zeng','zheng','ceng','cheng','lin','ling','min','ming','bin','bing','pin','ping','xin','xing','jin','jing','qin','qing','nin','ning','yin','ying','fen','feng','men','meng','ben','beng','pen','peng','gen','geng','ken','keng','hen','heng','ban','bang','pan','pang','man','mang','fan','fang','dan','dang','tan','tang','nan','nang','lan','lang','gan','gang','kan','kang','han','hang','ran','rang','ren','reng','wan','wang','wen','weng','yan','yang','lian','liang','xian','xiang','jian','jiang','qian','qiang','nian','niang','guan','guang','huan','huang','kuan','kuang','zhuan','zhuang','chuan','chuang','shuan','shuang','si','shi','zi','zhi','ci','chi','su','shu','zu','zhu','cu','chu','sa','sha','za','zha','ca','cha','sao','shao','zao','zhao','cao','chao'].forEach(b=>VALID.add(b));
const pyPool=(ed,word)=>PYI.filter(x=>(ed==='old'||x.both)&&(word===undefined||!!x.word===word));
const SWAP_I={z:'zh',zh:'z',c:'ch',ch:'c',s:'sh',sh:'s',n:'l',l:'n',f:'h',h:'f',b:'p',p:'b',d:'t',t:'d'};
function finSwap(f){const m=f.match(/^(.*?)(ang|eng|ing|an|en|in)$/);if(!m)return null;const t={an:'ang',ang:'an',en:'eng',eng:'en',in:'ing',ing:'in'}[m[2]];return m[1]+t}
function sylVariants(s){const out=[];const {ini,fin}=pySplit(s.base);
 for(let t=1;t<=4;t++)if(t!==s.tone)out.push({base:s.base,tone:t,why:'tone'});
 if(SWAP_I[ini])out.push({base:SWAP_I[ini]+fin,tone:s.tone,why:'ini'});
 const fs2=finSwap(fin);if(fs2)out.push({base:ini+fs2,tone:s.tone,why:'fin'});
 return out.filter(v=>VALID.has(v.base))}
function wordVariants(item){const res=[];item.sy.forEach((s,i)=>{for(const v of sylVariants(s)){const arr=item.sy.map(x=>pyMark(x.base,x.tone));arr[i]=pyMark(v.base,v.tone);res.push({str:arr.join(' '),why:v.why})}});return res}
function pickVariants(item,n){const vs=wordVariants(item);const pri=shuffle(vs.filter(v=>v.why!=='tone')),tn=shuffle(vs.filter(v=>v.why==='tone'));const out=[];for(const v of [...pri.slice(0,2),...tn,...pri.slice(2)]){if(v.str!==item.p&&!out.includes(v.str))out.push(v.str);if(out.length>=n)break}return out}
const sayQ=(q,text,after)=>Object.assign(q,{say:text,sayAfter:!!after});
// 1 看字选拼音
function genKz(ed){const it=pick(pyPool(ed));const ds=pickVariants(it,3);return sayQ(mc(`“${it.w}”的正确读音是（　）`,it.p,ds,`“${it.w}”读作 ${it.p}。注意声母、韵母和声调都要看准哦！`),it.w,true)}
// 2 看拼音选字词
function genPk(ed){const word=Math.random()<.45;const pool=pyPool(ed,word);const it=pick(pool);
 const sameLen=pool.filter(x=>x.w!==it.w&&x.p!==it.p&&x.w.length===it.w.length);const near=sameLen.filter(x=>x.sy[0].base.slice(0,1)===it.sy[0].base.slice(0,1)||x.sy[0].tone===it.sy[0].tone);
 const ds=shuffle(near.length>=3?near:sameLen).slice(0,3).map(x=>x.w);return sayQ(mc(`看拼音，选出正确的${word?'词语':'字'}：\n${it.p}`,it.w,ds,`${it.p} → ${it.w}`),it.w,false)}
// 3 声调
function genTone(ed){const r=Math.random();
 if(r<.4){const it=pick(pyPool(ed,false).filter(x=>x.sy[0].tone<5));const s=it.sy[0];return sayQ(mc(`“${it.w}”（${s.base}）读第几声？`,TN[s.tone],TN.slice(1).filter(x=>x!==TN[s.tone]),`“${it.w}”读 ${it.p}，是${TN[s.tone]}。`),it.w,true)}
 if(r<.8){const cands=pyPool(ed,false).filter(x=>{const b=x.sy[0].base;return x.sy[0].tone<5&&(b.match(/[aoeiuü]/g)||[]).length>=2});const it=pick(cands);const s=it.sy[0];const wrong=[];for(let i=0;i<s.base.length;i++){const m=pyMarkAt(s.base,s.tone,i);if(m&&m!==it.p&&!wrong.includes(m))wrong.push(m)}wrong.push(pyMark(s.base,(s.tone%4)+1));
  return sayQ(mc(`“${it.w}”的拼音，哪个声调标对了？`,it.p,wrong,`标调口诀：有 a 不放过，没 a 找 o、e，i、u 并列标在后。所以是 ${it.p}。`),it.w,true)}
 const b=pick([['liu','u'],['gui','i'],['dui','i'],['xiu','u'],['niu','u'],['hui','i'],['shui','i'],['jiu','u'],['hao','a'],['xie','e'],['guo','o'],['lou','o'],['mei','e'],['huai','a'],['xue','e']]);
 return mc(`给“${b[0]}”标声调，声调应该标在哪个字母上？`,b[1],[...new Set(b[0].split('').filter(ch=>'aoeiu'.includes(ch)&&ch!==b[1]))].concat(['a','o','e','i','u'].filter(x=>!b[0].includes(x))).slice(0,3),'标调口诀：有 a 不放过，没 a 找 o、e，i、u 并列标在后。')}
// 4 平舌/翘舌
function genZh(ed){const pool=pyPool(ed,false).filter(x=>/^(zh|ch|sh|z|c|s)/.test(x.sy[0].base));const it=pick(pool);const s=it.sy[0];const {ini,fin}=pySplit(s.base);const pair=SWAP_I[ini];
 if(Math.random()<.5){const other=['z','c','s'].includes(ini)?(ini==='s'?['c','ch']:['s','sh']):(ini==='sh'?['c','ch']:['s','sh']);return sayQ(mc(`“${it.w}”的声母是（　）`,ini,[pair,...other],`“${it.w}”读 ${it.p}，声母是 ${ini}，是${ini.length===2?'翘舌音':'平舌音'}。z c s 是平舌音，zh ch sh 是翘舌音。`),it.w,true)}
 const sw=pyMark(pair+fin,s.tone);const ot=((s.tone%4)+1);return sayQ(mc(`“${it.w}”的读音是（　）`,it.p,[sw,pyMark(s.base,ot),pyMark(pair+fin,ot)],`“${it.w}”读 ${it.p}，${ini.length===2?'翘舌音（舌尖翘起来）':'平舌音（舌尖平伸）'}。`),it.w,true)}
// 5 前鼻/后鼻
function genNg(ed){const pool=pyPool(ed,false).filter(x=>finSwap(pySplit(x.sy[0].base).fin)&&x.sy[0].tone<5);const it=pick(pool);const s=it.sy[0];const {ini,fin}=pySplit(s.base);const sw=finSwap(fin);
 const tail=fin.match(/(ang|eng|ing|an|en|in)$/)[1];const isBack=tail.endsWith('g');
 if(Math.random()<.5&&['an','ang','en','eng','in','ing'].includes(fin)){const opts=['an','ang','en','eng','in','ing'].filter(x=>x!==fin&&x!==sw);return sayQ(mc(`“${it.w}”的韵母是（　）`,fin,[sw,...shuffle(opts).slice(0,2)],`“${it.w}”读 ${it.p}，韵母是 ${fin}，是${isBack?'后鼻韵母':'前鼻韵母'}。`),it.w,true)}
 const ws=pyMark(ini+sw,s.tone);const ot=((s.tone%4)+1);return sayQ(mc(`“${it.w}”的读音是（　）`,it.p,[ws,pyMark(s.base,ot),pyMark(ini+sw,ot)],`“${it.w}”读 ${it.p}，是${isBack?'后鼻音（ng 结尾）':'前鼻音（n 结尾）'}。`),it.w,true)}
// 6 b d p q
const BDPQ_TIP='口诀：右下半圆 b b b，左下半圆 d d d，右上半圆 p p p，左上半圆 q q q。';
function genBd(ed){const r=Math.random();
 if(r<.65){const pool=pyPool(ed,false).filter(x=>/^[bdpq]/.test(x.sy[0].base));const it=pick(pool);const ini=it.sy[0].base[0];return sayQ(mc(`“${it.w}”（${it.p}）的声母是（　）`,ini,['b','d','p','q'].filter(x=>x!==ini),BDPQ_TIP),it.w,true)}
 const t=pick([['右下半圆','b'],['左下半圆','d'],['右上半圆','p'],['左上半圆','q']]);return mc(`竖线加一个“${t[0]}”，是哪个字母？`,t[1],['b','d','p','q'].filter(x=>x!==t[1]),BDPQ_TIP)}
// 7 ü 两点
function genU(ed){const r=Math.random();
 if(r<.6){const pool=pyPool(ed,false).filter(x=>/^[jqxy]u/.test(x.sy[0].base));const it=pick(pool);const s=it.sy[0];const dotted=pyMark(s.base.replace('u','ü'),s.tone);
  const ot=((s.tone%4)+1);return sayQ(mc(`“${it.w}”的拼音写法正确的是（　）`,it.p,[dotted,pyMark(s.base,ot),pyMark(s.base.replace('u','ü'),ot)],`小 ü 见了 j、q、x、y，去掉两点还读 ü。所以写作 ${it.p}。`),it.w,true)}
 if(r<.75){const it=pick([['女','nǚ','nǔ'],['绿','lǜ','lù'],['旅','lǚ','lǔ']]);return sayQ(mc(`“${it[0]}”的拼音写法正确的是（　）`,it[1],[it[2]],`ü 和 n、l 相拼时，两点不能去掉，要写成 ${it[1]}。`),it[0],true)}
 return pick([()=>mc('小 ü 和 j、q、x 相拼时，ü 上的两点要（　）','去掉，但还读 ü',['保留','去掉，读成 u'],'小 ü 见了 j q x，去掉两点还读 ü。'),()=>mc('ü 和 n、l 相拼时，两点要（　）','保留',['去掉','改成 u'],'n、l 和 ü 相拼，两点不能去掉，比如 nǚ、lǜ。'),()=>mc('“yu、ju、qu、xu”里的 u 读作（　）','ü',['u','i'],'这里的 u 其实是去掉两点的 ü。')])()}
// 8 音节分类
const PYCAT={'声母':'b p m f d t n l g k h j q x zh ch sh r z c s y w'.split(' '),'单韵母':'a o e i u ü'.split(' '),'复韵母':'ai ei ui ao ou iu ie üe er'.split(' '),'前鼻韵母':'an en in un ün'.split(' '),'后鼻韵母':'ang eng ing ong'.split(' '),'整体认读音节':'zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying'.split(' ')};
function genCat(){if(Math.random()<.2)return pick([()=>num('声母一共有几个？（包括 y、w）',23,'声母：b p m f d t n l g k h j q x zh ch sh r z c s y w，共 23 个。'),()=>num('韵母一共有几个？',24,'单韵母6个、复韵母9个、前鼻韵母5个、后鼻韵母4个，共 24 个。'),()=>num('整体认读音节一共有几个？',16,'zhi chi shi ri zi ci si yi wu yu ye yue yuan yin yun ying，共 16 个。')])();
 const cat=pick(Object.keys(PYCAT));const ans=pick(PYCAT[cat]);const others=Object.entries(PYCAT).filter(([k])=>k!==cat).flatMap(([,v])=>v).filter(x=>!PYCAT[cat].includes(x));
 return mc(`下面哪一个是${cat}？`,ans,shuffle(others).slice(0,3),`${cat}：${PYCAT[cat].join(' ')}`)}
// 9 拼读
function genSpell(ed){const pool=pyPool(ed,false).filter(x=>{const s=x.sy[0];if(s.tone>4)return false;const {ini,fin}=pySplit(s.base);return ini&&!/^[jqxyw]$/.test(ini)});const it=pick(pool);const s=it.sy[0];const {ini,fin}=pySplit(s.base);
 let parts;const m=fin.match(/^([iu])([aoe].*)$/);if(m&&fin!=='iu'&&fin!=='ui'&&fin!=='un'&&fin!=='in')parts=[ini,m[1],pyMark(m[2],s.tone)];else parts=[ini,pyMark(fin,s.tone)];
 const ds=sylVariants(s).map(v=>pyMark(v.base,v.tone));return sayQ(mc(`拼一拼：\n${parts.join(' — ')} → ？`,it.p,ds,`${parts.join('-')} → ${it.p}（${it.w}）${parts.length===3?'，这是三拼音节：声母 + 介母 + 韵母':''}`),it.w,true)}

// ---------- 笔顺 ----------
const HZK=Object.keys(HZD);
const hzPool=(ed,f)=>HZK.filter(c=>(HZD[c].t!=='old'||ed==='old')&&(!f||f(HZD[c],c)));
const STROKE_NAMES=[...new Set(HZK.flatMap(c=>HZD[c].n.filter((n,i)=>HZD[c].ok[i])))];
const SIMILAR=[['横折','横折钩','横撇','横钩','横折提','横折弯钩','横斜钩','横折折撇','横折折折钩'],['竖','竖钩','竖提','竖折','竖弯','竖弯钩','竖折折钩','弯钩'],['撇','撇点','撇折','点','提'],['点','捺','斜钩','卧钩','提']];
function strokeDs(n){const g=SIMILAR.find(a=>a.includes(n))||[];const near=shuffle(g.filter(x=>x!==n&&STROKE_NAMES.includes(x)));const far=shuffle(STROKE_NAMES.filter(x=>x!==n&&!near.includes(x)));return [...near.slice(0,2),...far].slice(0,3)}
const seqStr=c=>HZD[c].n.join('、');
const hzQ=(q,c,mode,i)=>Object.assign(q,{hz:{c,mode,i}});
function genCount(ed){const yc=Math.random()<.5;const c=pick(hzPool(ed,(x)=>yc?x.t==='yc':true));const n=HZD[c].n.length;return hzQ(num(`“${c}”一共有几画？`,n,`“${c}”共 ${n} 画：${seqStr(c)}。`),c,'show')}
function genNth(ed){const yc=Math.random()<.55;const c=pick(hzPool(ed,(x)=>x.ok.includes(1)&&x.n.length>1&&(!yc||x.t==='yc')));const x=HZD[c];const idx=shuffle(x.n.map((_,i)=>i).filter(i=>x.ok[i]))[0];
 const N=idx+1;return hzQ(mc(`“${c}”的第 ${N} 笔是（　）`,x.n[idx],strokeDs(x.n[idx]),`“${c}”的笔顺：${x.n.map((n,i)=>`${i+1}.${n}`).join(' ')}`),c,'show')}
function genOrder(ed){const c=pick(hzPool(ed,(x,ch)=>!x.ok.includes(0)&&x.n.length>=2&&x.n.length<=8&&new Set(x.n).size>1&&(x.t==='yc'||Math.random()<.5)));const x=HZD[c];const right=seqStr(c);const ds=new Set();
 for(let k=0;k<30&&ds.size<3;k++){const a=x.n.slice();const i=ri(0,a.length-2);const j=Math.random()<.7?i+1:ri(0,a.length-1);if(a[i]===a[j])continue;[a[i],a[j]]=[a[j],a[i]];const s=a.join('、');if(s!==right)ds.add(s)}
 if(ds.size===0){const a=x.n.slice().reverse().join('、');if(a!==right)ds.add(a)}
 return hzQ(mc(`“${c}”的笔顺，哪一个是对的？`,right,[...ds],`正确笔顺：${right}（共 ${x.n.length} 画）`),c,'show')}
const RULES=[['十','先横后竖'],['八','先撇后捺'],['人','先撇后捺'],['入','先撇后捺'],['三','从上到下'],['川','从左到右'],['月','从外到内'],['同','从外到内'],['问','从外到内'],['国','先里头后封口'],['回','先里头后封口'],['日','先里头后封口'],['小','先中间后两边'],['水','先中间后两边']].filter(r=>HZD[r[0]]);
const RULE_NAMES=['先横后竖','先撇后捺','从上到下','从左到右','从外到内','先里头后封口','先中间后两边'];
function genRule(){const r=Math.random();
 if(r<.45){const [c,rule]=pick(RULES);const CONF={'先撇后捺':['从左到右'],'从左到右':['先撇后捺'],'先里头后封口':['从外到内','从上到下'],'从外到内':['先里头后封口'],'先横后竖':['从上到下'],'从上到下':['先横后竖']};return hzQ(mc(`写“${c}”主要用到哪条笔顺规则？`,rule,shuffle(RULE_NAMES.filter(x=>x!==rule&&!(CONF[rule]||[]).includes(x))),`“${c}”：${seqStr(c)} —— ${rule}。`),c,'show')}
 if(r<.75){const c=pick(['国','回','日','目','田'].filter(x=>HZD[x]));const x=HZD[c];return hzQ(mc(`按照“先进去后关门”，写“${c}”时最后一笔是（　）`,x.n[x.n.length-1],strokeDs(x.n[x.n.length-1]),`“先里头后封口”（先进去后关门）：${seqStr(c)}，最后一笔是封口的${x.n[x.n.length-1]}。`),c,'show')}
 const c=pick(['小','水','十','八','人','月','火'].filter(x=>HZD[x]&&HZD[x].ok[0]));const x=HZD[c];return hzQ(mc(`写“${c}”时，第一笔是（　）`,x.n[0],strokeDs(x.n[0]),`“${c}”：${seqStr(c)}`),c,'show')}
function genName(ed){const c=pick(hzPool(ed,(x)=>x.ok.includes(1)&&x.n.length>=2));const x=HZD[c];const idx=shuffle(x.n.map((_,i)=>i).filter(i=>x.ok[i]))[0];
 return hzQ(mc(`“${c}”中红色的这一笔叫什么？`,x.n[idx],strokeDs(x.n[idx]),`红色是“${c}”的第 ${idx+1} 笔：${x.n[idx]}。`),c,'hi',idx)}

// ---------- 汉字绘制与动画 ----------
const P2D={};function hzPath(c,i){const k=c+i;if(!P2D[k])P2D[k]=new Path2D(HZD[c].s[i]);return P2D[k]}
function hzGrid(g,S){g.setTransform(1,0,0,1,0,0);g.fillStyle='#f7f1dc';g.fillRect(0,0,S,S);g.strokeStyle='#c0392b';g.lineWidth=2;g.strokeRect(1,1,S-2,S-2);g.setLineDash([5,5]);g.lineWidth=1;g.beginPath();g.moveTo(S/2,0);g.lineTo(S/2,S);g.moveTo(0,S/2);g.lineTo(S,S/2);g.moveTo(0,0);g.lineTo(S,S);g.moveTo(S,0);g.lineTo(0,S);g.stroke();g.setLineDash([])}
function hzT(g,S){const k=S/1024;g.setTransform(k,0,0,-k,0,900*k)}
function hzDraw(cv,c,opt){opt=opt||{};const S=cv.width,g=cv.getContext('2d');hzGrid(g,S);hzT(g,S);const n=HZD[c].s.length;
 for(let i=0;i<n;i++){let col=opt.ghost?'#d9d2bd':'#222';if(opt.hi===i)col='#e3262f';if(opt.upto!==undefined)col=i<opt.upto?'#222':'#d9d2bd';g.fillStyle=col;g.fill(hzPath(c,i))}g.setTransform(1,0,0,1,0,0)}
let hzAnimTok=0;
function hzAnimate(cv,c){const tok=++hzAnimTok;const S=cv.width,g=cv.getContext('2d');const d=HZD[c];const n=d.s.length;
 const lens=d.m.map(m=>{let L=0;for(let i=1;i<m.length;i++)L+=Math.hypot(m[i][0]-m[i-1][0],m[i][1]-m[i-1][1]);return L});
 let i=0,t0=performance.now();const per=i=>350+lens[i]*.6;
 function frame(now){if(tok!==hzAnimTok)return;hzDraw(cv,c,{upto:i});let prog=Math.min(1,(now-t0)/per(i));
  hzT(g,S);g.save();g.clip(hzPath(c,i));g.strokeStyle='#e3262f';g.lineWidth=180;g.lineCap='round';g.lineJoin='round';g.beginPath();const m=d.m[i];let need=prog*lens[i];g.moveTo(m[0][0],m[0][1]);
  for(let k=1;k<m.length&&need>0;k++){const seg=Math.hypot(m[k][0]-m[k-1][0],m[k][1]-m[k-1][1]);const f=Math.min(1,need/seg);g.lineTo(m[k-1][0]+(m[k][0]-m[k-1][0])*f,m[k-1][1]+(m[k][1]-m[k-1][1])*f);need-=seg}g.stroke();g.restore();
  g.setTransform(1,0,0,1,0,0);g.fillStyle='#3f3f3f';g.font=`bold ${Math.round(S/9)}px monospace`;g.fillText(`${i+1}/${n} ${d.n[i]}`,6,S-8);
  if(prog>=1){i++;t0=now+180;if(i>=n){setTimeout(()=>{if(tok===hzAnimTok){hzDraw(cv,c);const gg=cv.getContext('2d');gg.fillStyle='#1a6b10';gg.font=`bold ${Math.round(S/9)}px monospace`;gg.fillText(`共 ${n} 画 ✔`,6,S-8)}},250);return}}
  requestAnimationFrame(frame)}requestAnimationFrame(frame)}


// ---------- ⛏ 按顺序挖笔画 ----------
function genDig(ed){const yc=Math.random()<.5;const c=pick(hzPool(ed,x=>x.n.length>=2&&(!yc||x.t==='yc')));const d=HZD[c];
 return {t:'dig',c,q:`按笔顺挖出“${c}”的笔画（共 ${d.n.length} 画），点一点下一笔！`,ans:d.n.map((n,i)=>d.ok[i]?n:`第${i+1}笔`).join('、'),
  ex:`“${c}”的笔顺：`+d.n.map((n,i)=>`${i+1}.${d.ok[i]?n:'(看动画)'}`).join(' ')}}
// ---------- 单元注册 ----------
for(const ed of ['new','old']){
 BOOKS[ed].pinyin=[
  {id:'p1',name:'看字选拼音',gen:()=>genKz(ed)},{id:'p2',name:'看拼音选字/词',gen:()=>genPk(ed)},{id:'p3',name:'声调辨别（几声与标调）',gen:()=>genTone(ed)},
  {id:'p4',name:'平舌音 z c s / 翘舌音 zh ch sh',gen:()=>genZh(ed)},{id:'p5',name:'前鼻音 an en in / 后鼻音 ang eng ing',gen:()=>genNg(ed)},{id:'p6',name:'b d p q 辨别',gen:()=>genBd(ed)},
  {id:'p7',name:'ü 遇 j q x 去两点',gen:()=>genU(ed)},{id:'p8',name:'声母/韵母/整体认读音节分类',gen:genCat},{id:'p9',name:'拼读（g-u-ā → guā）',gen:()=>genSpell(ed)}];
 BOOKS[ed].bishun=[
  {id:'b0',name:'⭐ ⛏ 按顺序挖笔画',gen:()=>genDig(ed)},
  {id:'b1',name:'数笔画（共几画）',gen:()=>genCount(ed)},{id:'b2',name:'第 N 笔是什么',gen:()=>genNth(ed)},{id:'b3',name:'哪个笔顺对',gen:()=>genOrder(ed)},
  {id:'b4',name:'笔顺规则（先横后竖、先进去后关门…）',gen:genRule},{id:'b5',name:'笔画名称识别（红色这一笔）',gen:()=>genName(ed)}];
}
