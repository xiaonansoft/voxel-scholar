/* voxel-scholar · procedural quiz generators.
   Static stems come from QUESTION_PACK. The public default pack is the ORIGINAL demo bank.
   Fallback unit titles in un() are navigation labels for the personal extracted bank. */
// ===== 工具函数 =====
const ri=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const uniq=a=>[...new Set(a.map(String))];
const CN=['零','一','二','三','四','五','六','七','八','九','十'];
function cnNum(n){ if(n<=10) return CN[n]; if(n<20) return '十'+CN[n-10]; const t=Math.floor(n/10),o=n%10; return CN[t]+'十'+(o?CN[o]:''); }
function koujue(a,b){ if(a>b)[a,b]=[b,a]; const p=a*b; return CN[a]+CN[b]+(p<10?'得'+CN[p]:cnNum(p)); }
// 选择题：ans 正确项，ds 干扰项
function mc(q,ans,ds,ex,extra){ ans=String(ans); const d=shuffle(uniq(ds).filter(x=>x!==ans&&x!=='')).slice(0,3); return Object.assign({t:'mc',q,ans,opts:shuffle([ans,...d]),ex:ex||''},extra||{}); }
function num(q,ans,ex,extra){ return Object.assign({t:'num',q,ans:String(ans),ex:ex||''},extra||{}); }
function numDs(ans,spread){ const s=new Set(); let guard=0; while(s.size<3&&guard++<50){ const d=ans+ri(-spread,spread); if(d!==ans&&d>=0) s.add(d);} return [...s]; }

// ===== 时钟 SVG =====
function clockSVG(h,m){
  let s='<svg viewBox="0 0 200 200" width="170" height="170" class="clock"><circle cx="100" cy="100" r="92" fill="#fff" stroke="#333" stroke-width="5"/>';
  for(let i=0;i<60;i++){const a=i*6*Math.PI/180,r1=i%5?84:78,x1=100+r1*Math.sin(a),y1=100-r1*Math.cos(a),x2=100+88*Math.sin(a),y2=100-88*Math.cos(a);s+=`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#333" stroke-width="${i%5?1:3}"/>`;}
  for(let i=1;i<=12;i++){const a=i*30*Math.PI/180;s+=`<text x="${100+66*Math.sin(a)}" y="${100-66*Math.cos(a)+7}" font-size="19" text-anchor="middle" font-weight="bold">${i}</text>`;}
  const ha=((h%12)+m/60)*30*Math.PI/180, ma=m*6*Math.PI/180;
  s+=`<line x1="100" y1="100" x2="${100+45*Math.sin(ha)}" y2="${100-45*Math.cos(ha)}" stroke="#d33" stroke-width="7" stroke-linecap="round"/>`;
  s+=`<line x1="100" y1="100" x2="${100+72*Math.sin(ma)}" y2="${100-72*Math.cos(ma)}" stroke="#36c" stroke-width="4" stroke-linecap="round"/>`;
  s+='<circle cx="100" cy="100" r="5" fill="#333"/></svg>';return s;
}
const fmtT=(h,m)=>m===0?`${h}时`:`${h}时${m}分`;
const fmtD=(h,m)=>`${h}:${String(m).padStart(2,'0')}`;

// ===== v12：方向 / 竖式 / 点阵示意图 =====
function dirSVG(face){
  // face: 人物面向的方向（东/南/西/北），北在上
  const pos={北:[100,28],东:[172,100],南:[100,172],西:[28,100]};
  const arrow={北:'M100 70 L100 40 M90 52 L100 40 L110 52',东:'M130 100 L160 100 M148 90 L160 100 L148 110',南:'M100 130 L100 160 M90 148 L100 160 L110 148',西:'M70 100 L40 100 M52 90 L40 100 L52 110'};
  let s='<svg viewBox="0 0 200 200" width="170" height="170"><rect width="200" height="200" fill="#eef8ff" stroke="#89a" stroke-width="2" rx="8"/>';
  s+='<text x="100" y="22" text-anchor="middle" font-size="16" font-weight="bold" fill="#246">北</text>';
  s+='<text x="188" y="106" text-anchor="middle" font-size="16" font-weight="bold" fill="#246">东</text>';
  s+='<text x="100" y="192" text-anchor="middle" font-size="16" font-weight="bold" fill="#246">南</text>';
  s+='<text x="12" y="106" text-anchor="middle" font-size="16" font-weight="bold" fill="#246">西</text>';
  s+='<circle cx="100" cy="100" r="18" fill="#6cf" stroke="#246" stroke-width="2"/>';
  s+='<text x="100" y="106" text-anchor="middle" font-size="13" font-weight="bold">我</text>';
  if(face&&arrow[face]) s+=`<path d="${arrow[face]}" stroke="#d33" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  s+='</svg>'; return s;
}
function campusSVG(marks){
  // marks: {图书馆:[x,y], 操场:[x,y], ...} 坐标 0-100 逻辑，北上东右
  let s='<svg viewBox="0 0 220 200" width="190" height="170"><rect width="220" height="200" fill="#f4ffe8" stroke="#6a8" stroke-width="2" rx="6"/>';
  s+='<text x="110" y="16" text-anchor="middle" font-size="13" fill="#246">↑北</text>';
  s+='<text x="208" y="104" text-anchor="middle" font-size="12" fill="#246">东</text>';
  const col={'图书馆':'#c66','操场':'#4a4','教室':'#48c','大门':'#864','食堂':'#a84','花坛':'#2a6'};
  for(const [name,xy] of Object.entries(marks)){
    const x=20+xy[0]*1.8, y=30+xy[1]*1.5;
    s+=`<rect x="${x-22}" y="${y-12}" width="44" height="24" rx="4" fill="${col[name]||'#888'}" opacity=".85"/>`;
    s+=`<text x="${x}" y="${y+4}" text-anchor="middle" font-size="11" fill="#fff" font-weight="bold">${name}</text>`;
  }
  s+='</svg>'; return s;
}
function vertSVG(a,b,op){
  // 竖式（不写出结果），供选择结果
  const A=String(a), B=String(b), w=Math.max(A.length,B.length)+1;
  const pad=(t)=>(' '.repeat(w-t.length)+t).replace(/ /g,'\\u00a0');
  let s='<svg viewBox="0 0 140 110" width="130" height="100"><rect width="140" height="110" fill="#fffef5" stroke="#caa" stroke-width="2" rx="6"/>';
  s+=`<text x="120" y="32" text-anchor="end" font-size="22" font-family="monospace" font-weight="bold">${A}</text>`;
  s+=`<text x="28" y="58" font-size="22" font-weight="bold">${op}</text>`;
  s+=`<text x="120" y="58" text-anchor="end" font-size="22" font-family="monospace" font-weight="bold">${B}</text>`;
  s+='<line x1="24" y1="68" x2="124" y2="68" stroke="#333" stroke-width="2"/>';
  s+='<text x="120" y="92" text-anchor="end" font-size="22" font-family="monospace" fill="#888">？</text></svg>';
  return s;
}
function dotsSVG(rows,cols,label){
  let s='<svg viewBox="0 0 200 140" width="180" height="120"><rect width="200" height="140" fill="#f8fbff" stroke="#9ab" stroke-width="2" rx="6"/>';
  if(label) s+=`<text x="100" y="18" text-anchor="middle" font-size="12" fill="#456">${label}</text>`;
  const ox=20, oy=label?28:18, gapX=(160)/(cols||1), gapY=(100)/(rows||1);
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    s+=`<circle cx="${ox+c*gapX+gapX/2}" cy="${oy+r*gapY+gapY/2}" r="7" fill="#3a8"/>`;
  }
  s+='</svg>'; return s;
}
function judge(q,ok,ex){ return mc(q+(q.includes('（')?'':'（　）'), ok?'对':'错', ok?['错']:['对'], ex||''); }


// ===== 数学题目生成器 =====
const M={};
// 乘法（因数范围）
function mulGen(lo,hi,withDiv){
  const a=ri(lo,hi), b=ri(1,9>hi?hi:9);
  let x=a,y=ri(1,hi); if(Math.random()<.5)[x,y]=[y,x];
  const p=x*y;
  // v12：竖式/点阵结果选择
  if(Math.random()<.18){
    if(Math.random()<.5){ const ds=numDs(p,6).map(String); return mc(`看竖式，${x}×${y} 的积是（　）`,String(p),ds,`口诀：${koujue(x,y)}`,{svg:vertSVG(x,y,'×')}); }
    const rows=Math.min(x,y), cols=Math.max(x,y); const ds=numDs(p,6).map(String);
    return mc(`图里一共有多少个点？用乘法算：`,String(p),ds,`${rows}行，每行${cols}个，${rows}×${cols}=${p}`,{svg:dotsSVG(rows,cols,`${rows}×${cols}`)});
  }
  const k=ri(1,withDiv?7:6);
  switch(k){
    case 1: return num(`${x} × ${y} = ？`,p,`口诀：${koujue(x,y)}`);
    case 2: { const s=Math.min(x,y),l=Math.max(x,y); return num(`乘法口诀“${CN[s]}${CN[l]}（　）”，括号里应该是几？`,p,`${koujue(s,l)}，${s}×${l}=${p}`); }
    case 3: { const s=Math.min(x,y),l=Math.max(x,y); const add=Array(s).fill(l).join(' + '); return mc(`${add} 改写成乘法算式是（　）`,`${s} × ${l}`,[`${s} + ${l}`,`${l} × ${l}`,`${s} × ${s}`,`${l+1} × ${s}`],`${s}个${l}相加，写成 ${s}×${l} 或 ${l}×${s}，得 ${s*l}`); }
    case 4: { const c=ri(1,9); return Math.random()<.5?num(`${x} × ${y} + ${c} = ？`,p+c,`先算乘法 ${x}×${y}=${p}，再加 ${c}`):(p-c>=0?num(`${x} × ${y} - ${c} = ？`,p-c,`先算乘法 ${x}×${y}=${p}，再减 ${c}`):num(`${x} × ${y} + ${c} = ？`,p+c,`先算乘法 ${x}×${y}=${p}，再加 ${c}`)); }
    case 5: { const it=pick([['盒','支彩笔'],['排','个同学'],['盘','个苹果'],['袋','颗糖'],['束','朵花'],['串','个气球']]); const s2=Math.min(x,y),l=Math.max(x,y); return num(`每${it[0]}有 ${l} ${it[1]}，${s2} ${it[0]}一共有多少${it[1].slice(1)}？`,s2*l,`求${s2}个${l}是多少，用乘法：${s2}×${l}=${s2*l}`); }
    case 6: { // 比较
      const x2=ri(lo,hi),y2=ri(1,hi),p2=x2*y2; const r=p>p2?'>':p<p2?'<':'='; return mc(`比大小：${x} × ${y} ○ ${x2} × ${y2}`,r,['>','<','='].filter(v=>v!==r),`${x}×${y}=${p}，${x2}×${y2}=${p2}`); }
    case 7: { const s=Math.min(x,y),l=Math.max(x,y); return num(`（　）× ${s} = ${p}，括号里填几？`,l,`想口诀：${koujue(s,l)}`); }
  }
}
function divGen(lo,hi){
  let a=ri(lo,hi), b=ri(1,hi); if(Math.random()<.5)[a,b]=[b,a]; if(a<1)a=1;
  const c=a*b, k=ri(1,6);
  switch(k){
    case 1: return num(`${c} ÷ ${a} = ？`,b,`想口诀：${koujue(a,b)}，所以 ${c}÷${a}=${b}`);
    case 2: { const it=pick([['个','苹果'],['块','饼干'],['支','铅笔'],['本','书'],['颗','草莓']]); return num(`${c} ${it[0]}${it[1]}，平均分给 ${a} 个小朋友，每人分几${it[0]}？`,b,`平均分，用除法：${c}÷${a}=${b}`); }
    case 3: { const it=pick([['个','桃'],['朵','花'],['个','气球'],['根','香蕉']]); return num(`有 ${c} ${it[0]}${it[1]}，每 ${a} ${it[0]}装一袋，可以装几袋？`,b,`求${c}里有几个${a}，用除法：${c}÷${a}=${b}`); }
    case 4: return mc(`在 ${c} ÷ ${a} = ${b} 中，${c} 叫作（　）`,'被除数',['除数','商','因数'],'除号前面的数叫被除数，后面的叫除数，结果叫商。');
    case 5: return mc(`在 ${c} ÷ ${a} = ${b} 中，${b} 叫作（　）`,'商',['被除数','除数','积'],'除法的结果叫商。');
    case 6: return num(`${c} ÷（　）= ${b}，括号里填几？`,a,`想口诀：${koujue(a,b)}`);
  }
}
// 分类与整理
const CATS={'水果':['苹果','香蕉','梨','桃子','西瓜','葡萄'],'蔬菜':['白菜','萝卜','黄瓜','茄子','土豆','青菜'],'动物':['小猫','小狗','兔子','熊猫','老虎','小鸡'],'文具':['铅笔','橡皮','尺子','卷笔刀','作业本'],'交通工具':['汽车','火车','飞机','轮船','自行车']};
function classifyGen(){
  const k=ri(1,3);
  if(k===1){ const keys=Object.keys(CATS); const c1=pick(keys); let c2=pick(keys.filter(x=>x!==c1)); const three=shuffle(CATS[c1]).slice(0,3), odd=pick(CATS[c2]); return mc(`下面哪一个和其他三个不是同一类？\n${shuffle([...three,odd]).join('、')}`,odd,three,`${three.join('、')}都是${c1}，${odd}是${c2}。`); }
  if(k===2){ const shapes=['○','△','□']; const arr=[];const cnt={'○':0,'△':0,'□':0}; const n=ri(8,12); for(let i=0;i<n;i++){const s=pick(shapes);arr.push(s);cnt[s]++;} const t=pick(shapes); return num(`按形状分一分：\n${arr.join(' ')}\n${t} 有几个？`,cnt[t],`数一数，${t} 有 ${cnt[t]} 个。`); }
  const nums=shuffle([...Array(20).keys()].map(i=>i+1)).slice(0,8).sort((a,b)=>a-b); const odd=nums.filter(x=>x%2).length; return Math.random()<.5?num(`把这些数按单数、双数分一分：\n${nums.join('、')}\n单数有几个？`,odd,`单数：${nums.filter(x=>x%2).join('、')}`):num(`把这些数按单数、双数分一分：\n${nums.join('、')}\n双数有几个？`,8-odd,`双数：${nums.filter(x=>x%2===0).join('、')}`);
}
// 东南西北
function dirGen(){
  const D=['东','南','西','北']; const k=ri(1,7);
  if(k===1){ const d=pick(D),o=D[(D.indexOf(d)+2)%4]; return mc(`“${d}”的相对方向是哪里？`,o,D.filter(x=>x!==o),`东和西相对，南和北相对。`,{svg:dirSVG(d)}); }
  if(k===2){ const f=pick(D),i=D.indexOf(f); const ask=pick(['右手边','左手边','背后']); const ans=ask==='右手边'?D[(i+1)%4]:ask==='左手边'?D[(i+3)%4]:D[(i+2)%4]; return mc(`小明面向${f}站立，他的${ask}是哪个方向？`,ans,D.filter(x=>x!==ans),`面向${f}时：右边是${D[(i+1)%4]}，左边是${D[(i+3)%4]}，背后是${D[(i+2)%4]}。`,{svg:dirSVG(f)}); }
  if(k===3) return mc('早上，太阳从哪个方向升起？','东',['南','西','北'],'早上太阳从东方升起，傍晚从西方落下。',{svg:dirSVG('东')});
  if(k===4) return mc('早上面对太阳站立，你的背后是哪个方向？','西',['东','南','北'],'面对太阳是东，背后就是西。',{svg:dirSVG('东')});
  // 校园示意图
  if(k===5||k===6){
    const layouts=[
      {marks:{操场:[30,50],图书馆:[70,20],教室:[70,70],大门:[30,85]},q:'根据示意图，图书馆在操场的（　）面',ans:'北',ex:'图中上方是北，图书馆在操场上方（北）。'},
      {marks:{操场:[40,50],食堂:[75,50],教室:[40,20],大门:[40,85]},q:'根据示意图，食堂在操场的（　）面',ans:'东',ex:'右方是东，食堂在操场右侧。'},
      {marks:{花坛:[50,40],大门:[50,80],图书馆:[20,40],教室:[80,40]},q:'根据示意图，图书馆在花坛的（　）面',ans:'西',ex:'左方是西，图书馆在花坛左侧。'},
      {marks:{教室:[50,30],操场:[50,65],大门:[50,90],食堂:[80,65]},q:'小明从教室走向操场，主要是朝哪个方向走？',ans:'南',ex:'下方是南，操场在教室南边。'},
    ];
    const L=pick(layouts);
    return mc(L.q,L.ans,D.filter(x=>x!==L.ans),L.ex,{svg:campusSVG(L.marks)});
  }
  // 判断
  return Math.random()<.5?judge('判断：东和西是相对的方向。',true,'东—西相对，南—北相对。'):judge('判断：面向北时，左手边是东。',false,'面向北时，右手是东，左手是西。');
}
// 厘米和米
const LEN=[['一支铅笔长约17',"厘米"],['教室的门高约2','米'],['黑板长约4','米'],['课桌高约70','厘米'],['一根粉笔长约7','厘米'],['旗杆高约12','米'],['小明身高约130','厘米'],['一根跳绳长约2','米'],['数学书长约26','厘米'],['大拇指宽约1','厘米'],['教室长约9','米'],['一张床长约2','米']];
function lenGen(extraSeg){
  const k=ri(1,extraSeg?7:6);
  if(k===1){ const it=pick(LEN); return mc(`${it[0]}（　）`,it[1],[it[1]==='米'?'厘米':'米'],`联系生活想一想，1米大约是一大步/两臂张开那么长，1厘米大约是大拇指的宽。`); }
  if(k===2){ const n=ri(1,9); return Math.random()<.5?num(`${n} 米 = （　）厘米`,n*100,`1米=100厘米，${n}米=${n*100}厘米`):num(`${n*100} 厘米 = （　）米`,n,`100厘米=1米`); }
  if(k===3){ const a=pick([[1,'米',ri(60,99),'厘米'],[1,'米',100,'厘米'],[1,'米',ri(101,150),'厘米'],[ri(2,5),'米',ri(1,9)*100,'厘米']]); const L=a[0]*100,R=a[2]; const r=L>R?'>':L<R?'<':'='; return mc(`比大小：${a[0]}${a[1]} ○ ${a[2]}${a[3]}`,r,['>','<','='].filter(v=>v!==r),`${a[0]}米=${L}厘米`); }
  if(k===4){ const a=ri(10,60),b=ri(5,39); return Math.random()<.5?num(`${a}厘米 + ${b}厘米 = （　）厘米`,a+b,''):num(`1米 - ${b}厘米 = （　）厘米`,100-b,`1米=100厘米，100-${b}=${100-b}`); }
  if(k===5){ const a=ri(3,12),b=ri(3,12); return num(`一根绳子长 ${a+b} 米，用去 ${a} 米，还剩多少米？`,b,`${a+b}-${a}=${b}`); }
  if(k===6){ const s=ri(0,3),e=s+ri(3,9); return num(`用直尺量一支铅笔，铅笔一端对着刻度 ${s}，另一端对着刻度 ${e}，铅笔长几厘米？`,e-s,`${e}-${s}=${e-s}（不是从0开始量，要用终点减起点）`); }
  const q=pick([['一条线段有几个端点？',2],['一条线段上一共有3个点（含两个端点），共有几条线段？',3],['一条线段上一共有4个点（含两个端点），共有几条线段？',6]]); return num(q[0],q[1],q[1]===2?'线段是直的，有两个端点，可以量出长度。':'按顺序数：先数单独的小段，再数两段合成的，依次相加。');
}
// 100以内加减法（二）
function addSubGen(){
  const k=ri(0,6);
  if(k===0){ // v12 竖式结果选择
    if(Math.random()<.5){ const a=ri(23,78),b=ri(12,99-a); const ans=a+b; const ds=numDs(ans,8).map(String); return mc(`看竖式，得数是（　）`,String(ans),ds,`${a}+${b}=${ans}`,{svg:vertSVG(a,b,'+')}); }
    const a=ri(40,99),b=ri(12,a-8); const ans=a-b; const ds=numDs(ans,8).map(String); return mc(`看竖式，得数是（　）`,String(ans),ds,`${a}−${b}=${ans}`,{svg:vertSVG(a,b,'−')});
  }
  if(k===1){ const a=ri(11,79),b=ri(11,99-a); return num(`${a} + ${b} = ？`,a+b,`个位 ${a%10}+${b%10}=${a%10+b%10}${a%10+b%10>=10?'，满十向十位进1':''}`); }
  if(k===2){ const a=ri(30,99),b=ri(11,a-5); return num(`${a} - ${b} = ？`,a-b,`个位 ${a%10}${a%10<b%10?'不够减，从十位退1':''}`); }
  if(k===3){ const a=ri(10,40),b=ri(10,30),c=ri(5,100-a-b>5?100-a-b:5); if(a+b+c>100) return num(`${a} + ${b} = ？`,a+b,''); return num(`${a} + ${b} + ${c} = ？`,a+b+c,'从左往右依次计算。'); }
  if(k===4){ const a=ri(60,99),b=ri(10,30),c=ri(5,a-b-1); return num(`${a} - ${b} - ${c} = ？`,a-b-c,'从左往右依次计算。'); }
  if(k===5){ const a=ri(20,60),b=ri(10,35),c=ri(5,a+b-1); return Math.random()<.5?num(`${a} + ${b} - ${c} = ？`,a+b-c,'从左往右依次计算。'):(a-b>0?num(`${a} - ${b} + ${c} = ？`,a-b+c,'从左往右依次计算。'):num(`${a} + ${b} = ？`,a+b,'')); }
  const t=ri(1,3);
  if(t===1){ const a=ri(25,60),b=ri(8,30); return num(`小红有 ${a} 张画片，小明比小红多 ${b} 张，小明有几张？`,a+b,`求比一个数多几的数，用加法：${a}+${b}=${a+b}`); }
  if(t===2){ const a=ri(40,90),b=ri(12,a-10); return num(`二年级有 ${a} 人去春游，已经上车 ${b} 人，还有几人没上车？`,a-b,`${a}-${b}=${a-b}`); }
  const a=ri(30,60),b=ri(10,25); return num(`树上原来有 ${a} 只鸟，飞走了 ${b} 只，又飞来 ${b+3} 只，现在有几只？`,a-b+b+3,`${a}-${b}+${b+3}=${a+3}`);
}
// 角的初步认识
function angleGen(){
  const fixed=[mc('一个角有几个顶点？','1个',['2个','3个','0个'],'一个角有一个顶点、两条边。'),mc('一个角有几条边？','2条',['1条','3条','4条'],'一个角有一个顶点、两条边。'),mc('一个三角形有几个角？','3个',['2个','4个','5个'],''),mc('长方形有（　）','4个直角',['4个锐角','3个直角','2个直角'],'长方形和正方形都有4个直角。'),mc('角的大小与什么有关？','两条边张开的大小',['边的长短','画得粗细','纸的大小'],'边张口越大，角越大；与边的长短无关。'),mc('一副三角尺上的每块三角尺都有几个直角？','1个',['2个','3个','0个'],''),mc('用放大镜看一个角，这个角会（　）','大小不变',['变大','变小'],'放大镜只放大边的长短，张口大小不变。'),mc('比直角小的角是（　）','锐角',['钝角','直角'],'比直角小的叫锐角，比直角大的叫钝角。'),mc('比直角大的角是（　）','钝角',['锐角','直角'],'')];
  if(Math.random()<.6) return pick(fixed);
  const h=ri(1,11), deg=30*Math.min(h,12-h); const ans=deg===90?'直角':deg<90?'锐角（比直角小）':'钝角（比直角大）';
  return mc(`钟面上 ${h} 时整，时针和分针组成的角是（　）`,ans,['直角','锐角（比直角小）','钝角（比直角大）'].filter(x=>x!==ans),`${h}时：分针指12，时针指${h}，相隔${Math.min(h,12-h)}大格（3大格是直角）。`,{svg:clockSVG(h,0)});
}
// 观察物体（一）
function viewGen(){
  return pick([
    mc('从前面、侧面、上面看一个正方体，看到的都是（　）','正方形',['长方形','圆','三角形'],''),
    mc('从任何方向看一个皮球，看到的都是（　）','圆',['正方形','长方形','三角形'],''),
    mc('从上面看一个竖着放的圆柱形水杯，看到的是（　）','圆',['长方形','正方形','三角形'],''),
    mc('从正前方看一个竖着放的圆柱形水杯，看到的形状近似（　）','长方形',['圆','三角形','正方形'],''),
    mc('小明和小红面对面坐着看同一个玩具，他们看到的样子（　）','可能不同',['一定相同','完全一样'],'观察的位置不同，看到的样子可能不同。'),
    mc('站在汽车的正前方，能看到汽车的（　）','车头',['车尾','两侧的车门全都能看到'],''),
    mc('观察一个物体，最多能同时看到它的几个面？','3个',['1个','2个','6个'],'从一个方向观察物体，最多能看到3个面。'),
    mc('从侧面看一辆小汽车，能看到（　）','车身和车轮',['只有车灯','只有车牌'],''),
  ]);
}
// 认识时间
function timeGen(){
  const k=ri(1,5);
  if(k<=2){ const h=ri(1,12),m=ri(0,11)*5; const ans=fmtT(h,m); const ds=[fmtT(h,(m+30)%60),fmtT(h===12?1:h+1,m),fmtT(m/5||12,(h%12)*5)].filter(x=>x!==ans); return mc('钟面上是几时几分？',ans,ds,'红色短针是时针，蓝色长针是分针。分针指几，就是几个5分。',{svg:clockSVG(h,m)}); }
  if(k===3){ const h=ri(1,11),m=ri(1,11)*5; return mc(`电子表显示 ${fmtD(h,m)}，读作（　）`,fmtT(h,m),[fmtT(m/5,h*5),fmtT(h+1,m),fmtT(h,m===30?0:30)],'冒号前面是时，后面是分。'); }
  if(k===4) return pick([num('1时 = （　）分',60,'分针走一圈是60分，时针走一大格是1时。'),num('分针从12走到6，经过了多少分？',30,'走了6大格，6个5分是30分。'),num('分针从12走到3，经过了多少分？',15,'3个5分是15分。'),num('钟面上有几个大格？',12,''),num('分针走1大格是几分？',5,''),mc('时针走1大格是（　）','1时',['1分','5分','60时'],'')]);
  const h=ri(7,10),m=pick([0,10,20,30]),d=pick([10,20,30,40]); let em=m+d,eh=h; if(em>=60){em-=60;eh++;} const ans=fmtT(eh,em); return mc(`小丽 ${fmtT(h,m)} 开始读书，读了 ${d} 分钟，几时几分读完？`,ans,[fmtT(eh,(em+10)%60),fmtT(h,m+d>=60?m+d-60:m+d)===ans?fmtT(eh+1,em):fmtT(h,(m+d)%60),fmtT(eh+1,em)],`从${fmtT(h,m)}往后数${d}分钟。`);
}
// 搭配
function pairGen(){
  const k=ri(1,4);
  if(k===1){ const a=ri(2,4),b=ri(2,3); return num(`有 ${a} 件上衣、${b} 条裤子，一件上衣配一条裤子，一共有几种穿法？`,a*b,`每件上衣都可以配${b}条裤子：${a}×${b}=${a*b}`); }
  if(k===2){ const d=shuffle([1,2,3,4,5,6,7,8,9]).slice(0,3).sort(); return num(`用 ${d.join('、')} 三个数字组成两位数（十位和个位不同），能组成几个？`,6,`按顺序排：十位是${d[0]}的2个，是${d[1]}的2个，是${d[2]}的2个，共6个。`); }
  if(k===3){ const d=[0,...shuffle([1,2,3,4,5,6,7,8,9]).slice(0,2).sort()]; return num(`用 ${d.join('、')} 三个数字组成两位数（十位和个位不同），能组成几个？`,4,`0不能放在十位，十位只能是${d[1]}或${d[2]}，各2个，共4个。`); }
  const n=pick([3,4]); return num(`${n} 个小朋友，每两人握一次手，一共要握几次手？`,n*(n-1)/2,n===3?'AB、AC、BC，共3次。':'AB、AC、AD、BC、BD、CD，共6次。');
}

function poemQs(name){
  const p=POEMS[name];
  if(!p||!Array.isArray(p.l)||p.l.length<4) return [];
  const all=Object.values(POEMS).flatMap(x=>x.l), out=[];
  for(let i=0;i<3;i++) out.push(()=>mc(`《${name}》：“${p.l[i]}。”下一句是（　）`,p.l[i+1],shuffle(all.filter(x=>x!==p.l[i+1])).slice(0,3),`《${name}》：${p.l.join('，')}。`));
  out.push(()=>mc(`“____，${p.l[3]}。”出自《${name}》，横线上应填：`,p.l[2],shuffle(all.filter(x=>x!==p.l[2])).slice(0,3),''));
  out.push(()=>p.a==='北朝民歌'?mc(`《${name}》是一首（　）`,'北朝民歌',['唐诗，作者李白','唐诗，作者杜甫','宋词'],''):mc(`《${name}》的作者是（　）`,`${p.d}代 ${p.a}`,shuffle(AUTHORS.filter(x=>x!==p.a&&x!=='北朝民歌')).slice(0,3).map(x=>'唐代 '+x),''));
  return out;
}

// Banks are data. scripts/build.mjs injects QUESTION_PACK before this file.
if(typeof QUESTION_PACK==="undefined"||!QUESTION_PACK) throw new Error("voxel-scholar: QUESTION_PACK missing. Run npm run build.");
function wrapGroup(items){
  return (items||[]).map(it=>()=>it.t==="num" ? num(it.q, it.ans, it.ex||"") : mc(it.q, it.ans, it.ds||[], it.ex||""));
}
function wrapBank(groups){
  const out={};
  for(const k of Object.keys(groups||{})) out[k]=wrapGroup(groups[k]);
  return out;
}
function un(ed, sub, id, fallback){
  const names=QUESTION_PACK.unitNames;
  const hit=names&&names[ed]&&names[ed][sub]&&names[ed][sub][id];
  return hit||fallback;
}
const POEMS={};
for(const [name,p] of Object.entries(QUESTION_PACK.poems||{})){
  POEMS[name]={a:p.author,d:p.dynasty,l:p.lines.slice()};
}
const AUTHORS=QUESTION_PACK.authors||[];
const YW=wrapBank(QUESTION_PACK.yw);
const OLD_RJ=wrapBank(QUESTION_PACK.oldRj);
const XM=wrapBank(QUESTION_PACK.xm);
const XY=wrapBank(QUESTION_PACK.xy);
const gp=list=>()=>pick(list)();
const XM_COUNT=Object.values(XM).reduce((s,a)=>s+a.length,0);
const XY_COUNT=Object.values(XY).reduce((s,a)=>s+a.length,0);
const XMIX=(base,list)=>()=>Math.random()<.5?pick(list)():base();

// ===== 题库分组与单元 =====
const BOOKS={
 new:{name:(QUESTION_PACK.editionNames&&QUESTION_PACK.editionNames.new)||'分组甲',
  math:[
   {id:'m1',name:un('new','math','m1','一、分类与整理'),gen:XMIX(classifyGen,XM.cls)},
   {id:'m2',name:un('new','math','m2','二、1～6的表内乘法'),gen:XMIX(()=>mulGen(1,6),XM.mul16)},
   {id:'m3',name:un('new','math','m3','三、1～6的表内除法'),gen:XMIX(()=>divGen(1,6),XM.div16)},
   {id:'m3x',name:un('new','math','m3x','☆校园小导游（东南西北）'),gen:XMIX(dirGen,XM.dir)},
   {id:'m4',name:un('new','math','m4','四、厘米和米'),gen:XMIX(()=>lenGen(true),XM.len)},
   {id:'m5',name:un('new','math','m5','五、7～9的表内乘、除法'),gen:XMIX(()=>Math.random()<.5?mulGen(7,9,true):divGen(7,9),[...XM.mul79,...XM.div79])},
   {id:'m6',name:un('new','math','m6','六、复习与关联（综合）'),gen:XMIX(()=>pick([()=>mulGen(1,9,true),()=>divGen(1,9),()=>lenGen(true),dirGen,classifyGen])(),XM.mix)},
  ],
  yuwen:[
   {id:'y1',name:un('new','yuwen','y1','第一单元 小蝌蚪找妈妈·我是什么·植物妈妈有办法'),gen:gp([...YW.u1,...XY.u1,...XY.g])},
   {id:'y2',name:un('new','yuwen','y2','第二单元 识字：场景歌·树之歌·拍手歌·田家四季歌'),gen:gp([...YW.u2,...XY.u2])},
   {id:'y3',name:un('new','yuwen','y3','第三单元 彩虹·去外婆家·数星星的孩子'),gen:gp([...YW.n3,...XY.u3n])},
   {id:'y4',name:un('new','yuwen','y4','第四单元 古诗二首（登鹳雀楼·望庐山瀑布）·黄山奇石·日月潭·葡萄沟'),gen:gp([...YW.u4,...XY.u4])},
   {id:'y5',name:un('new','yuwen','y5','第五单元 坐井观天·寒号鸟·我要的是葫芦'),gen:gp([...YW.u5,...XY.u5])},
   {id:'y6',name:un('new','yuwen','y6','第六单元 八角楼上·朱德的扁担·难忘的泼水节·刘胡兰'),gen:gp([...YW.u6,...XY.u6])},
   {id:'y7',name:un('new','yuwen','y7','第七单元 古诗二首（江雪·敕勒歌）·雾在哪里·雪孩子'),gen:gp([...poemQs('江雪'),...YW.u7common,...XY.u7])},
   {id:'y8',name:un('new','yuwen','y8','第八单元 称赞·纸船和风筝·快乐的小河'),gen:gp([...YW.n8,...XY.u8n])},
  ]},
 old:{name:(QUESTION_PACK.editionNames&&QUESTION_PACK.editionNames.old)||'分组乙',
  math:[
   {id:'m1',name:un('old','math','m1','1 长度单位（厘米和米）'),gen:XMIX(()=>lenGen(true),XM.len)},
   {id:'m2',name:un('old','math','m2','2 100以内的加法和减法（二）'),gen:XMIX(addSubGen,XM.addsub)},
   {id:'m3',name:un('old','math','m3','3 角的初步认识'),gen:XMIX(angleGen,XM.angle)},
   {id:'m4',name:un('old','math','m4','4 表内乘法（一）2～6的乘法口诀'),gen:XMIX(()=>mulGen(1,6),XM.mul16)},
   {id:'m5',name:un('old','math','m5','5 观察物体（一）'),gen:XMIX(viewGen,XM.view)},
   {id:'m6',name:un('old','math','m6','6 表内乘法（二）7～9的乘法口诀'),gen:XMIX(()=>mulGen(7,9),XM.mul79)},
   {id:'m7',name:un('old','math','m7','7 认识时间'),gen:XMIX(timeGen,XM.time)},
   {id:'m8',name:un('old','math','m8','8 数学广角——搭配（一）'),gen:XMIX(pairGen,XM.pair)},
  ],
  yuwen:[
   {id:'y1',name:un('old','yuwen','y1','第一单元 小蝌蚪找妈妈·我是什么·植物妈妈有办法'),gen:gp([...YW.u1,...XY.u1,...XY.g])},
   {id:'y2',name:un('old','yuwen','y2','第二单元 识字：场景歌·树之歌·拍手歌·田家四季歌'),gen:gp([...YW.u2,...OLD_RJ.o2,...XY.u2])},
   {id:'y3',name:un('old','yuwen','y3','第三单元 曹冲称象·玲玲的画·一封信·妈妈睡了'),gen:gp([...YW.o3,...OLD_RJ.o3,...XY.u3o])},
   {id:'y4',name:un('old','yuwen','y4','第四单元 古诗二首（登鹳雀楼·望庐山瀑布）·黄山奇石·日月潭·葡萄沟'),gen:gp([...YW.u4,...OLD_RJ.o4,...XY.u4])},
   {id:'y5',name:un('old','yuwen','y5','第五单元 坐井观天·寒号鸟·我要的是葫芦（含日积月累《江雪》）'),gen:gp([...YW.u5,...OLD_RJ.o5,...XY.u5,XY.u7[0],XY.u7[1],XY.u7[2]])},
   {id:'y6',name:un('old','yuwen','y6','第六单元 八角楼上·朱德的扁担·难忘的泼水节·刘胡兰'),gen:gp([...YW.u6,...OLD_RJ.o6,...XY.u6])},
   {id:'y7',name:un('old','yuwen','y7','第七单元 古诗二首（夜宿山寺·敕勒歌）·雾在哪里·雪孩子'),gen:gp([...poemQs('夜宿山寺'),...YW.u7common,...OLD_RJ.o7,...XY.u7.slice(3)])},
   {id:'y8',name:un('old','yuwen','y8','第八单元 狐假虎威·纸船和风筝·风娃娃'),gen:gp([...YW.o8,...OLD_RJ.o8,...XY.u8o,...XY.u8n.slice(4,7)])},
  ]},
};
for(const ed of ['new','old'])for(const sb of ['math','yuwen']){const us=BOOKS[ed][sb].slice(),gx=sb==='yuwen'?XY.g:XM.mix;BOOKS[ed][sb].push({id:'mock',name:un(ed,sb,'mock','混合小卷'),gen:()=>Math.random()<.15?pick(gx)():pick(us).gen()});}

