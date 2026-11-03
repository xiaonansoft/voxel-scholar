/* voxel-scholar · voxel world, HUD, and session loop.
   Product name: 方块备考 (Block Prep). Scores stay in localStorage. */
(()=>{
const $=id=>document.getElementById(id);
const LS_G={get:(k,d)=>{try{const v=JSON.parse(localStorage.getItem('g2q_'+k));return v??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem('g2q_'+k,JSON.stringify(v))}catch(e){}}};
let curUid=null,curUser=null;
const LS={get:(k,d)=>{if(!curUid)return d;try{const v=JSON.parse(localStorage.getItem('g2q_u_'+curUid+'_'+k));return v??d}catch(e){return d}},set:(k,v)=>{if(!curUid)return;try{localStorage.setItem('g2q_u_'+curUid+'_'+k,JSON.stringify(v))}catch(e){}}};
const AVATARS=[{id:'steve',e:'🧑',n:'小方'},{id:'alex',e:'👧',n:'小圆'},{id:'villager',e:'🧔',n:'村民'},{id:'pig',e:'🐷',n:'猪'},{id:'sheep',e:'🐑',n:'羊'},{id:'cow',e:'🐮',n:'牛'},{id:'chicken',e:'🐔',n:'鸡'},{id:'creeper',e:'🟢',n:'绿芽怪'},{id:'enderman',e:'🟣',n:'夜行客'},{id:'cat',e:'🐱',n:'猫咪'}];
const NAME_CHIPS=['小方','小圆','方块侠','挖矿达人','拼音小将','笔顺高手','数学超人','语文之星','巨龙勇士','云朵宝贝','乐乐','豆豆','果果','星星','阳光'];
const HAN_PAD='小大乐豆果星云龙虎马羊猪牛鸡猫火水山川木石金玉心想学习读写算飞跑跳快乐勇敢聪明'.split('');
const ABC_PAD='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function uid(){return 'u'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function getProfiles(){const p=LS_G.get('profiles',[]);return Array.isArray(p)?p.filter(isObj):[]}
function saveProfiles(list){LS_G.set('profiles',list)}
function avatarEmoji(id){return (AVATARS.find(a=>a.id===id)||AVATARS[0]).e}
function legacyHasData(){try{for(const k of ['history','stats','wrong_new_math','wrong_new_yuwen','wrong_new_pinyin','wrong_new_bishun','tut7','sel']){if(localStorage.getItem('g2q_'+k)!=null)return true}for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith('g2q_wrong_'))return true}}catch(e){}return false}
function migrateLegacyTo(uid){const keys=['ed','sub','sel','len','history','stats','digMig','tut7','muted7','music7','touch8','muted'];try{for(const k of keys){const raw=localStorage.getItem('g2q_'+k);if(raw!=null)localStorage.setItem('g2q_u_'+uid+'_'+k,raw)}for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith('g2q_wrong_')){localStorage.setItem('g2q_u_'+uid+'_'+k.slice(4),localStorage.getItem(k))}}LS_G.set('legacyMigrated',true)}catch(e){}}
function markLegacyDone(){LS_G.set('legacyMigrated',true);try{['history','stats','sel','digMig','tut7'].forEach(k=>localStorage.removeItem('g2q_'+k));for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith('g2q_wrong_'))localStorage.removeItem(k)}}catch(e){}}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SUBS=['yuwen','math','pinyin','bishun'];const SUBN={math:'🔢 数学',yuwen:'📖 语文',pinyin:'🔤 拼音',bishun:'✍️ 笔顺'};
const key=(e=ed,s=sub)=>e+'_'+s;
const isObj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const objStore=k=>{const v=LS.get(k,{});return isObj(v)?v:{}};
const validQs=v=>Array.isArray(v)?v.filter(q=>isObj(q)&&typeof q.q==='string'&&q.ans!=null):[];
const wrongStore=(e,s)=>validQs(LS.get('wrong_'+key(e,s),[]));
let ed='new',sub='math',sel={},roundLen=20,muted=false;
function normalizePrefs(){
 ed=LS.get('ed','new');sub=LS.get('sub','math');sel=LS.get('sel',{});roundLen=Number(LS.get('len',20));muted=LS.get('muted7',LS.get('muted',false));
 if(!['new','old'].includes(ed))ed='new';if(!SUBS.includes(sub))sub='math';if(![10,20,30].includes(roundLen))roundLen=20;
 if(!isObj(sel))sel={};for(const k in sel){if(Array.isArray(sel[k]))sel[k]=[...new Set(sel[k].filter(x=>typeof x==='string'))];else delete sel[k]}
 if(!LS.get('digMig',false)){for(const k in sel)if(/_bishun$/.test(k)&&!sel[k].includes('b0'))sel[k].unshift('b0');LS.set('sel',sel);LS.set('digMig',true)}
}
const unitsOf=(e=ed,s=sub)=>BOOKS[e]&&BOOKS[e][s]||[];
function selOf(e=ed,s=sub){const k=key(e,s);return Array.isArray(sel[k])?sel[k]:(sel[k]=s==='bishun'?['b0']:unitsOf(e,s).map(u=>u.id))}
function speak(t){try{if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){toast('这台设备不支持朗读',1500);return}const u=new SpeechSynthesisUtterance(t);u.lang='zh-CN';u.rate=.8;const vs=speechSynthesis.getVoices()||[];const v=vs.find(v=>/^zh|cmn/i.test(v.lang));if(v)u.voice=v;else if(vs.length)toast('没有找到中文语音，可能读不准',1500);speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){toast('朗读失败',1200)}}

// ================= 声音 =================
let AC=null;
function ac(){ if(!AC){ try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){} } if(AC&&AC.state==='suspended')AC.resume(); return AC; }
function tone(f,d,type='square',vol=.12,f2,delay=0){const a=ac();if(!a||muted)return;const t=a.currentTime+delay;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d+.02)}
function noise(d,vol=.25,freq=1200){const a=ac();if(!a||muted)return;const n=a.sampleRate*d|0,b=a.createBuffer(1,n,a.sampleRate),ch=b.getChannelData(0);for(let i=0;i<n;i++)ch[i]=(Math.random()*2-1)*(1-i/n);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=freq;const g=a.createGain();g.gain.value=vol;s.connect(f).connect(g).connect(a.destination);s.start()}
const SFX={
 click:()=>tone(900,.05,'square',.06),
 brk:()=>{noise(.18,.35,900)},
 dig:()=>noise(.08,.2,600),
 ok:()=>{tone(660,.12,'square',.1);tone(990,.18,'square',.1,null,.1)},
 bad:()=>tone(200,.35,'sawtooth',.12,90),
 hurt:()=>{tone(320,.15,'square',.14,140)},
 xp:()=>tone(1400+Math.random()*400,.08,'sine',.08),
 lvl:()=>{[523,659,784,1046].forEach((f,i)=>tone(f,.15,'square',.08,null,i*.09))},
 boom:()=>noise(.7,.5,400),
 roar:()=>tone(120,1,'sawtooth',.15,50),
 win:()=>{[523,659,784,1046,784,1046,1318].forEach((f,i)=>tone(f,.2,'square',.09,null,i*.13))},
 jump:()=>tone(300,.06,'sine',.04,420),
};

// ================= 纹理 =================
const B={AIR:0,GRASS:1,DIRT:2,STONE:3,COAL:4,IRON:5,GOLD:6,DIAMOND:7,LOG:8,LEAVES:9,BEDROCK:10,CLOUD:11,CHEST:12,WOOL:13,WATER:14};
function R(seed){return ()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646}}
const rgb=(c,k=1)=>`rgb(${clamp(c[0]*k|0,0,255)},${clamp(c[1]*k|0,0,255)},${clamp(c[2]*k|0,0,255)})`;
function mk(fn,seed){const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');fn(g,R(seed||7));return c}
function nz(g,c,amp,r,x0=0,y0=0,w=16,h=16){for(let y=y0;y<y0+h;y++)for(let x=x0;x<x0+w;x++){g.fillStyle=rgb(c,1+(r()-.5)*amp);g.fillRect(x,y,1,1)}}
const DIRTC=[134,96,67],STONEC=[125,125,125];
function ore(c){return (g,r)=>{nz(g,STONEC,.35,r);for(let i=0;i<6;i++){const x=1+(r()*12|0),y=1+(r()*12|0);g.fillStyle=rgb(c);g.fillRect(x,y,2,2);g.fillStyle=rgb(c,1.35);g.fillRect(x,y,1,1);g.fillStyle=rgb(c,.65);g.fillRect(x+1,y+1,1,1);if(r()<.5){g.fillStyle=rgb(c,.9);g.fillRect(x+2,y,1,1)}}}}
const TEX=[];
TEX[B.DIRT]=mk((g,r)=>nz(g,DIRTC,.45,r),3);
TEX[B.GRASS]=mk((g,r)=>{nz(g,DIRTC,.45,r);for(let x=0;x<16;x++){const h=3+(r()<.45?1:0)+(r()<.2?1:0);nz(g,[95,159,53],.35,r,x,0,1,h)}},5);
TEX[B.STONE]=mk((g,r)=>nz(g,STONEC,.35,r),9);
TEX[B.COAL]=mk(ore([35,35,35]),11);TEX[B.IRON]=mk(ore([216,175,147]),13);TEX[B.GOLD]=mk(ore([252,238,75]),17);TEX[B.DIAMOND]=mk(ore([92,219,213]),19);
TEX[B.LOG]=mk((g,r)=>{for(let x=0;x<16;x++)nz(g,[104,82,50],.3*(x%4===0?1.5:1),r,x,0,1,16);for(let x=0;x<16;x+=4){g.fillStyle='rgba(40,25,10,.35)';g.fillRect(x,0,1,16)}},21);
TEX[B.LEAVES]=mk((g,r)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){const v=r();if(v<.12)continue;g.fillStyle=rgb([58,130,38],v<.3?.6:1+(r()-.5)*.5);g.fillRect(x,y,1,1)}},23);
TEX[B.BEDROCK]=mk((g,r)=>nz(g,[85,85,85],1.2,r),29);
TEX[B.WOOL]=mk((g,r)=>{nz(g,[235,235,228],.12,r);g.fillStyle='rgba(180,180,170,.5)';for(let i=0;i<6;i++)g.fillRect(r()*14|0,r()*14|0,2,1)},37);
TEX[B.WATER]=mk((g,r)=>{nz(g,[45,120,210],.2,r);g.fillStyle='rgba(180,230,255,.35)';for(let i=0;i<5;i++)g.fillRect(0,(r()*14|0),16,1)},47);
TEX[B.CLOUD]=mk((g,r)=>{nz(g,[245,248,255],.06,r);g.fillStyle='rgba(200,215,240,.9)';g.fillRect(0,13,16,3);g.fillStyle='#fff';g.fillRect(0,0,16,2)},31);
TEX[B.CHEST]=mk((g,r)=>{nz(g,[160,105,45],.25,r);g.fillStyle='#4a2c0c';g.fillRect(0,0,16,1);g.fillRect(0,15,16,1);g.fillRect(0,0,1,16);g.fillRect(15,0,1,16);g.fillRect(0,6,16,1);g.fillStyle='#e8e8e8';g.fillRect(7,5,2,4);g.fillStyle='#222';g.fillRect(7,7,2,1)},33);
const INFO={
 [B.GRASS]:{n:'草方块',free:1,item:'泥土'},[B.DIRT]:{n:'泥土',free:1,item:'泥土'},[B.LEAVES]:{n:'树叶',free:1,item:'树叶'},
 [B.LOG]:{n:'橡木原木',item:'木头',xp:1},[B.STONE]:{n:'石头',item:'石头',xp:1},[B.COAL]:{n:'煤矿石',item:'煤炭',xp:2},
 [B.IRON]:{n:'铁矿石',item:'铁',xp:3},[B.GOLD]:{n:'金矿石',item:'金',xp:4},[B.DIAMOND]:{n:'钻石矿石',item:'钻石',xp:8,need:2},
 [B.BEDROCK]:{n:'基岩',unb:1},[B.CLOUD]:{n:'云朵',unb:1},[B.WOOL]:{n:'羊毛',free:1,item:'羊毛'},[B.CHEST]:{n:'天空宝箱',item:'钻石',xp:10},[B.WATER]:{n:'水',unb:1},
};
const ITEMS=['泥土','木头','石头','煤炭','铁','金','钻石','树叶','羊毛'];
const PLACE={'泥土':B.DIRT,'木头':B.LOG,'石头':B.STONE,'煤炭':B.COAL,'铁':B.IRON,'金':B.GOLD,'钻石':B.DIAMOND,'树叶':B.LEAVES,'羊毛':B.WOOL};
// 物品图标
function ingot(c){return mk((g)=>{g.fillStyle=rgb(c,.6);g.fillRect(2,6,12,6);g.fillStyle=rgb(c);g.fillRect(3,5,11,5);g.fillStyle=rgb(c,1.3);g.fillRect(4,5,8,2)},1)}
const ICON={'羊毛':TEX[B.WOOL],'树叶':TEX[B.LEAVES],'木头':TEX[B.LOG],'石头':TEX[B.STONE],'泥土':TEX[B.DIRT],'煤炭':mk(g=>{g.fillStyle='#222';g.fillRect(4,4,8,8);g.fillRect(3,6,10,4);g.fillStyle='#444';g.fillRect(5,5,3,2)},1),
 '铁':ingot([220,220,220]),'金':ingot([250,215,40]),'钻石':mk(g=>{g.fillStyle='#2bb5ad';g.fillRect(4,3,8,3);g.fillRect(2,6,12,2);g.fillRect(4,8,8,2);g.fillRect(6,10,4,3);g.fillStyle='#9ff7f2';g.fillRect(5,4,3,2);g.fillRect(4,6,3,1)},1)};
const ICONURL={};for(const k in ICON)ICONURL[k]=ICON[k].toDataURL();
function heartURL(full){return mk(g=>{const P=[' ## ## ','#######','#######',' ##### ','  ###  ','   #   '];P.forEach((row,y)=>[...row].forEach((ch,x)=>{if(ch==='#'){g.fillStyle=full?'#e01818':'#3a0d0d';g.fillRect(x*2+1,y*2+3,2,2)}}));g.fillStyle=full?'#ffaaaa':'#552222';g.fillRect(3,5,2,2)},1).toDataURL()}
const HEART=[heartURL(false),heartURL(true)];

// ================= 3D 额外纹理 =================
TEX.GTOP=mk((g,r)=>nz(g,[95,159,53],.35,r),41);
TEX.LOGTOP=mk((g,r)=>{nz(g,[150,118,72],.2,r);g.strokeStyle='rgba(90,64,35,.8)';for(const s of [3,6]){g.strokeRect(8-s+.5,8-s+.5,2*s-1,2*s-1)}g.fillStyle='#6a5032';g.fillRect(0,0,16,1);g.fillRect(0,15,16,1);g.fillRect(0,0,1,16);g.fillRect(15,0,1,16)},43);
TEX.CHESTTOP=mk((g,r)=>{nz(g,[160,105,45],.25,r);g.fillStyle='#4a2c0c';g.fillRect(0,0,16,1);g.fillRect(0,15,16,1);g.fillRect(0,0,1,16);g.fillRect(15,0,1,16)},45);
const ATL=[TEX.GTOP,TEX[B.GRASS],TEX[B.DIRT],TEX[B.STONE],TEX[B.COAL],TEX[B.IRON],TEX[B.GOLD],TEX[B.DIAMOND],TEX[B.LOG],TEX[B.LEAVES],TEX[B.BEDROCK],TEX[B.CLOUD],TEX[B.CHEST],TEX[B.WOOL],TEX.LOGTOP,TEX.CHESTTOP,TEX[B.WATER]];
const NT=ATL.length;
function faceTile(b,f){// f:0 上 1 下 2-5 侧
 if(b===B.GRASS)return f===0?0:f===1?2:1;if(b===B.LOG)return f<2?14:8;if(b===B.CHEST)return f<2?15:12;
 return {2:2,3:3,4:4,5:5,6:6,7:7,9:9,10:10,11:11,13:13,14:16}[b]}

// ================= 世界（3D） =================
const X=64,Z=64,H=56;let world=null,placed=null,surfH=null,GH=14;
const SPX=32,SPZ=32;
const idx=(x,y,z)=>x+X*(z+Z*y);
const inW=(x,y,z)=>x>=0&&x<X&&z>=0&&z<Z&&y>=0&&y<H;
function getB(x,y,z){if(y<0)return B.BEDROCK;if(y>=H)return B.AIR;if(x<0||x>=X||z<0||z>=Z)return B.AIR;return world[idx(x,y,z)]}
function setB(x,y,z,b,pl){if(!inW(x,y,z))return;world[idx(x,y,z)]=b;placed[idx(x,y,z)]=pl?1:0;dirtyAt(x,z)}
const blk=getB;
const isPl=(x,y,z)=>inW(x,y,z)&&placed[idx(x,y,z)]===1;
const solid=(x,y,z)=>{if(x<0||x>=X||z<0||z>=Z)return true;return getB(x,y,z)!==B.AIR};
function gen(){const r=R(20251);world=new Uint8Array(X*Z*H);placed=new Uint8Array(X*Z*H);surfH=new Int16Array(X*Z);
 // v11 场景：河谷村庄 + 木桥 + 更高山峰 + 矿洞口
 const hf=(x,z)=>{
  let h=13+2.4*Math.sin(x/7.3)+2*Math.cos(z/6.1)+1.3*Math.sin((x+z)/4.3)+1.2*Math.cos((x-z)/9);
  // 东北更高山脊（尖峰）
  const mtn=Math.max(0,(x-38)/7)*7.2+Math.max(0,(z-40)/8)*5.8+Math.max(0,(x-50)/5)*3.2+Math.max(0,(z-52)/6)*2.4;
  const peak=Math.max(0,6.5-Math.hypot(x-54,z-55)*0.85);
  const rx=18+Math.sin(z/5.2)*3.2, river=Math.max(0,3.8-Math.abs(x-rx)*1.15);
  return Math.round(h+mtn+peak-river);
 };
 GH=hf(SPX,SPZ);
 for(let x=0;x<X;x++)for(let z=0;z<Z;z++){let h=hf(x,z);const d=Math.hypot(x-SPX,z-SPZ);if(d<4)h=GH;else if(d<7)h=Math.round(GH+(h-GH)*(d-4)/3);h=clamp(h,6,40);surfH[x+X*z]=h;
  const rx=18+Math.sin(z/5.2)*3.2, inRiver=Math.abs(x-rx)<2.2;
  for(let y=0;y<=h;y++){let b;const dd=h-y;if(y===0)b=B.BEDROCK;else if(inRiver&&dd===0)b=B.WATER;else if(inRiver&&dd===1)b=B.STONE;else if(dd===0)b=B.GRASS;else if(dd<4)b=B.DIRT;else{b=B.STONE;const v=r();if(dd>=9&&v<.02)b=B.DIAMOND;else if(dd>=7&&v<.045)b=B.GOLD;else if(dd>=5&&v<.09)b=B.IRON;else if(v<.15)b=B.COAL}world[idx(x,y,z)]=b}
  if(inRiver){const wy=h+1;if(wy<H&&Math.abs(x-rx)<1.4)world[idx(x,wy,z)]=B.WATER}
 }
 // 小洞穴
 for(let c=0;c<5;c++){let x=8+r()*48,y=5+r()*3,z=8+r()*48;for(let i=0;i<40;i++){x+=r()*2-1;z+=r()*2-1;y=clamp(y+r()*1.2-.6,3,8);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){const X0=x+dx|0,Y0=y+dy|0,Z0=z+dz|0;if(inW(X0,Y0,Z0)&&Y0>0&&Y0<surfH[X0+X*Z0]-3)world[idx(X0,Y0,Z0)]=B.AIR}}}
 // 地表矿堆
 const piles=[[37,30,[B.STONE,B.COAL,B.IRON]],[27,36,[B.STONE,B.IRON,B.GOLD]],[34,40,[B.COAL,B.STONE,B.DIAMOND]],[44,24,[B.GOLD,B.IRON,B.STONE]],[20,22,[B.STONE,B.DIAMOND,B.COAL]],[48,46,[B.IRON,B.GOLD,B.DIAMOND]],[14,44,[B.COAL,B.STONE,B.IRON]]];
 for(const [px,pz,ore] of piles){const s=surfH[px+X*pz];for(let dx=0;dx<2;dx++)for(let dz=0;dz<2;dz++){const x=px+dx,z=pz+dz;const hh=surfH[x+X*z];for(let y=hh+1;y<=s;y++)world[idx(x,y,z)]=B.DIRT;world[idx(x,s+1,z)]=ore[(dx*2+dz)%3];}world[idx(px,s+2,pz)]=ore[2]}
 // 树（避开村庄与桥）
 const trees=[[26,27],[39,35],[22,40],[45,33],[30,18],[16,30],[50,40],[36,50],[12,14],[54,16],[10,52],[56,56],[42,12],[24,54],[52,28],[18,8],[33,14],[48,20]];
 for(const [tx,tz] of trees){const s=surfH[tx+X*tz];if(getB(tx,s,tz)===B.WATER)continue;const th=4+(tx%2);for(let y=s+1;y<=s+th;y++)world[idx(tx,y,tz)]=B.LOG;
  for(let y=s+th-1;y<=s+th+1;y++){const rr=y>s+th?1:2;for(let dx=-rr;dx<=rr;dx++)for(let dz=-rr;dz<=rr;dz++){if(rr===2&&Math.abs(dx)===2&&Math.abs(dz)===2&&r()<.6)continue;const x=tx+dx,z=tz+dz;if(inW(x,y,z)&&world[idx(x,y,z)]===B.AIR)world[idx(x,y,z)]=B.LEAVES}}}
 // 云朵平台 + 空中岛屿（相对出生点高度）
 const put=(x,y,z,b)=>{if(inW(x,y,z)&&world[idx(x,y,z)]===B.AIR)world[idx(x,y,z)]=b};
 const cl=[[36,7,34],[30,11,38],[26,14,31],[38,17,26],[44,21,32],[33,24,44],[22,28,26],[46,31,40],[30,34,20],[40,38,48]];
 for(const [cx,a,cz] of cl){for(let dx=0;dx<3;dx++)for(let dz=0;dz<3;dz++)put(cx+dx,GH+a,cz+dz,B.CLOUD)}
 const isl=[[24,13,24],[42,22,42],[22,30,46],[44,36,18]];
 for(const [ix,a,iz] of isl){const y=GH+a;for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){if(Math.abs(dx)===2&&Math.abs(dz)===2)continue;put(ix+dx,y,iz+dz,B.GRASS);if(Math.abs(dx)<2&&Math.abs(dz)<2)put(ix+dx,y-1,iz+dz,B.DIRT)}put(ix,y-2,iz,B.DIRT);
  world[idx(ix-1,y,iz)]=B.DIAMOND;put(ix+1,y+1,iz,B.CHEST);put(ix-1,y+1,iz+1,B.LEAVES)}
 // v11：河边小村庄（2–3 栋木屋）
 const buildHouse=(hx,hz,ww,dd,doorSide)=>{
  const hs=surfH[hx+X*hz];
  for(let dx=0;dx<=ww;dx++)for(let dz=0;dz<=dd;dz++){
   const x=hx+dx,z=hz+dz;if(!inW(x,0,z))continue;
   const base=Math.max(surfH[x+X*z],hs);
   for(let y=surfH[x+X*z]+1;y<=hs;y++)world[idx(x,y,z)]=B.DIRT;
   world[idx(x,hs,z)]=B.STONE;
   const wall=dx===0||dx===ww||dz===0||dz===dd;
   let door=false;
   if(doorSide==='s')door=dx===((ww/2)|0)&&dz===0;
   else if(doorSide==='w')door=dx===0&&dz===((dd/2)|0);
   else if(doorSide==='e')door=dx===ww&&dz===((dd/2)|0);
   else door=dx===((ww/2)|0)&&dz===dd;
   for(let y=hs+1;y<=hs+3;y++){
    if(door&&y<=hs+2)world[idx(x,y,z)]=B.AIR;
    else if(wall)world[idx(x,y,z)]=B.LOG;
    else world[idx(x,y,z)]=B.AIR;
   }
   // 简单坡屋顶
   const roofIn=Math.min(dx,ww-dx,dz,dd-dz);
   world[idx(x,hs+4+(roofIn>0?0:0),z)]=B.WOOL;
   if(roofIn===0)world[idx(x,hs+4,z)]=B.WOOL;
  }
  // 屋内宝箱
  const ix=hx+Math.max(1,((ww/2)|0)), iz=hz+Math.max(1,((dd/2)|0));
  if(inW(ix,hs+1,iz))world[idx(ix,hs+1,iz)]=B.CHEST;
  // 门前石径
  for(let t=-1;t<=ww+1;t++){
   let x=hx+t,z=hz-1;if(doorSide==='n'){x=hx+t;z=hz+dd+1}else if(doorSide==='w'){x=hx-1;z=hz+t}else if(doorSide==='e'){x=hx+ww+1;z=hz+t}
   if(inW(x,0,z))world[idx(x,surfH[x+X*z],z)]=B.STONE;
  }
  return hs;
 };
 buildHouse(24,28,4,4,'s');
 buildHouse(28,22,3,3,'w');
 buildHouse(22,34,3,4,'e');
 // 木桥跨河（约 z=30，连接西岸与东岸村庄）
 {const bz=30;const west=14,east=22;
  let by=0,n=0;for(let x=west;x<=east;x++){by+=surfH[x+X*bz];n++}by=Math.round(by/n)+1;
  for(let x=west;x<=east;x++){
   for(let zz=0;zz<=1;zz++){
    const z=bz+zz;
    // 桥面抬高，水下清空成可走
    for(let y=by-2;y<by;y++){if(inW(x,y,z)&&getB(x,y,z)===B.WATER)world[idx(x,y,z)]=B.AIR}
    world[idx(x,by,z)]=B.LOG;
    if(x===west||x===east||x%2===0){world[idx(x,by+1,z)]=B.LOG}
   }
  }
  // 桥墩
  for(const px of [16,19]){const s=surfH[px+X*bz];for(let y=s+1;y<by;y++){world[idx(px,y,bz)]=B.STONE;world[idx(px,y,bz+1)]=B.STONE}}
 }
 // 山脚矿洞口（东北山坡，可见矿石）
 {const cx=50,cz=48;const sh=surfH[cx+X*cz];
  for(let i=0;i<7;i++){
   const x=cx-i,z=cz-Math.floor(i*0.6);
   for(let dy=0;dy<=3;dy++)for(let o=-1;o<=1;o++){
    const xx=x+o,yy=Math.max(2,sh-2+dy),zz=z;
    if(inW(xx,yy,zz))world[idx(xx,yy,zz)]=B.AIR;
   }
  }
  // 洞口边框与矿石
  for(const [ox,oy,oz,b] of [[0,0,0,B.COAL],[-1,0,0,B.IRON],[0,-1,-1,B.GOLD],[1,1,0,B.COAL],[-2,0,1,B.IRON],[0,0,-2,B.STONE]]){
   const x=cx+ox,y=Math.max(2,sh-1+oy),z=cz+oz;if(inW(x,y,z))world[idx(x,y,z)]=b;
  }
  // 洞内一小段通道
  for(let i=0;i<4;i++){const x=cx+1+i,z=cz+1;for(let dy=0;dy<=2;dy++){const y=Math.max(2,sh-2+dy);if(inW(x,y,z))world[idx(x,y,z)]=B.AIR}}
  if(inW(cx+3,Math.max(2,sh-2),cz+1))world[idx(cx+3,Math.max(2,sh-2),cz+1)]=B.DIAMOND;
 }
 // 路标木牌支柱（河边 / 山脚）
 const plantSign=(sx,sz)=>{
  const s0=surfH[sx+X*sz];
  world[idx(sx,s0+1,sz)]=B.LOG;world[idx(sx,s0+2,sz)]=B.LOG;
  if(inW(sx+1,s0+2,sz))world[idx(sx+1,s0+2,sz)]=B.WOOL;
  return s0+3.2;
 };
 const syRiver=plantSign(21,30);
 const syMtn=plantSign(44,44);
 const syBridge=plantSign(18,31);
 const syCave=plantSign(49,47);
 const syHouse=plantSign(24,27);
 clearLandmarks();
 addSignSprite(21.2,syRiver,30,'河边','#ffe9a8');
 addSignSprite(44.2,syMtn,44,'上山','#dfffd0');
 addSignSprite(18.2,syBridge,31,'木桥','#cdefff');
 addSignSprite(49.2,syCave,47,'矿洞','#ffd0e0');
 addSignSprite(24.2,syHouse,27,'木屋','#ffe0b2');
 window.__LM={
  river:{x:21.5,z:30,label:'河边'},
  bridge:{x:18.0,z:30.5,label:'木桥'},
  mountain:{x:44.5,z:44,label:'上山'},
  cave:{x:50.0,z:48,label:'矿洞'},
  house:{x:24.5,z:28.5,label:'木屋'}
 };
 rebuildAll()}

// ================= three.js 场景 =================
const cv=$('cv');let touchMode=false;
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,powerPreference:'high-performance'})}catch(err){console.error(err);$('menu').innerHTML='<div class="panel"><h2>无法启动 3D 世界</h2><p>当前浏览器或设备未能启用 WebGL。请使用新版浏览器，并在设置中开启硬件加速后重试。</p></div>';return}
const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(75,1,.05,200);camera.rotation.order='YXZ';
const ambL=new THREE.AmbientLight(0xffffff,.75);scene.add(ambL);const sunL=new THREE.DirectionalLight(0xffffff,.7);sunL.position.set(.5,1,.3);scene.add(sunL);
const SKY0=new THREE.Color(0x8ec5ff),SKY1=new THREE.Color(0x3f6fd8),SKY_NIGHT=new THREE.Color(0x0b1530),SKY_DUSK=new THREE.Color(0xff8a65);
scene.background=SKY0.clone();scene.fog=new THREE.Fog(0x8ec5ff,28,70);
let worldTime=0.15;const _skyTmp=new THREE.Color();
const atlasC=document.createElement('canvas');atlasC.width=16*NT;atlasC.height=16;{const ag=atlasC.getContext('2d');ATL.forEach((t,i)=>ag.drawImage(t,i*16,0))}
const atlasT=new THREE.CanvasTexture(atlasC);atlasT.magFilter=THREE.NearestFilter;atlasT.minFilter=THREE.NearestFilter;atlasT.generateMipmaps=false;if('colorSpace' in atlasT)atlasT.colorSpace=THREE.SRGBColorSpace;
const chunkMat=new THREE.MeshLambertMaterial({map:atlasT,vertexColors:true,alphaTest:.5});
// 用 Basic 材质（不受光照影响）保证方块颜色鲜艳，面明暗由顶点色决定
const chunkMatB=new THREE.MeshBasicMaterial({map:atlasT,vertexColors:true,alphaTest:.5});
const FACES=[{n:[0,1,0],c:[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],s:1},{n:[0,-1,0],c:[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],s:.5},
 {n:[1,0,0],c:[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],s:.8},{n:[-1,0,0],c:[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],s:.8},
 {n:[0,0,1],c:[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],s:.65},{n:[0,0,-1],c:[[1,0,0],[0,0,0],[0,1,0],[1,1,0]],s:.65}];
const CS=16,CN=X/CS;const chunks=[];const dirty=new Set();
const transp=b=>b===B.AIR||b===B.LEAVES;
function buildChunk(cx,cz){const pos=[],uv=[],col=[],ind=[];let n=0;const e=.001;
 for(let y=0;y<H;y++)for(let z=cz*CS;z<cz*CS+CS;z++)for(let x=cx*CS;x<cx*CS+CS;x++){const b=world[idx(x,y,z)];if(!b)continue;
  for(let f=0;f<6;f++){const F=FACES[f],nx=x+F.n[0],ny=y+F.n[1],nz=z+F.n[2];let nb=(nx<0||nx>=X||nz<0||nz>=Z)?B.AIR:getB(nx,ny,nz);if(ny<0)nb=B.STONE;
   if(!transp(nb)||(b===B.LEAVES&&nb===B.LEAVES))continue;
   const t=faceTile(b,f),u0=t/NT+e/NT,u1=(t+1)/NT-e/NT;const ao=(y<GH-2&&f!==0)?.85:1;const s=F.s*ao;
   for(const c of F.c){pos.push(x+c[0],y+c[1],z+c[2]);col.push(s,s,s)}
   uv.push(u0,0,u1,0,u1,1,u0,1);if(f<2)uv.splice(uv.length-8,8,u0,0,u1,0,u1,1,u0,1);
   ind.push(n,n+1,n+2,n,n+2,n+3);n+=4}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.setIndex(ind);g.computeBoundingSphere();
 const k=cx+CN*cz;if(chunks[k]){scene.remove(chunks[k]);chunks[k].geometry.dispose()}const m=new THREE.Mesh(g,chunkMatB);m.matrixAutoUpdate=false;chunks[k]=m;scene.add(m)}
function rebuildAll(){dirty.clear();for(let cx=0;cx<CN;cx++)for(let cz=0;cz<CN;cz++)buildChunk(cx,cz)}
function dirtyAt(x,z){const cx=x/CS|0,cz=z/CS|0;dirty.add(cx+','+cz);if(x%CS===0&&cx>0)dirty.add((cx-1)+','+cz);if(x%CS===CS-1&&cx<CN-1)dirty.add((cx+1)+','+cz);if(z%CS===0&&cz>0)dirty.add(cx+','+(cz-1));if(z%CS===CS-1&&cz<CN-1)dirty.add(cx+','+(cz+1))}
function flushDirty(){for(const k of dirty){const [a,b]=k.split(',').map(Number);buildChunk(a,b)}dirty.clear()}
// v11：路标精灵 + 月亮
// ================= v14 探险任务 =================
const QUEST_DEFS=[
 {id:'river',title:'去河边答 3 题',kind:'ans',need:3,near:'river',r:5.5,reward:{xp:3,item:'羊毛',n:1}},
 {id:'mine',title:'上山挖矿答对',kind:'ok',need:1,near:'mountain',r:7,reward:{xp:4,item:'煤炭',n:1}},
 {id:'chest',title:'拜访木屋宝箱',kind:'visit',need:1,near:'house',r:4.5,reward:{xp:3,item:'钻石',n:1}},
 {id:'bridge',title:'走过木桥看风景',kind:'visit',need:1,near:'bridge',r:4.2,reward:{xp:2,item:'泥土',n:2}},
 {id:'cave',title:'探访山脚矿洞',kind:'visit',need:1,near:'cave',r:5.5,reward:{xp:3,item:'铁',n:1}}
];
function lmOf(id){const L=window.__LM||{};return L[id]||null}
function distXZ(ax,az,bx,bz){return Math.hypot(ax-bx,az-bz)}
function nearLM(id,r){if(!G||!G.p)return false;const L=lmOf(id);if(!L)return false;return distXZ(G.p.x,G.p.z,L.x,L.z)<=(r||6)}
function initQuests(){
 if(!G)return;
 G.quests=QUEST_DEFS.map(d=>({id:d.id,title:d.title,kind:d.kind,need:d.need,near:d.near,r:d.r,reward:d.reward,prog:0,done:0}));
 G.explore={};G._questFlash=0;
 const qh=$('questHud');if(qh)qh.classList.remove('hide');
 renderQuestHud();updQuestArrow(0);
}
function showStarCeleb(n,msg,ms){
 const el=$('starCeleb');if(!el)return;
 const nn=Math.max(1,Math.min(3,n|0));
 $('starCelebStars').textContent='★'.repeat(nn)+'☆'.repeat(Math.max(0,3-nn));
 $('starCelebMsg').textContent=msg||'太棒了！';
 el.classList.remove('hide');
 clearTimeout(showStarCeleb._t);
 showStarCeleb._t=setTimeout(()=>el.classList.add('hide'),ms||1600);
}
function questReward(q){
 if(!G||q.done)return;
 q.done=1;q.prog=q.need;
 const rw=q.reward||{};
 if(rw.xp)addXP(rw.xp);
 if(rw.item){G.inv[rw.item]=(G.inv[rw.item]||0)+(rw.n||1);try{renderBar()}catch(_){}}
 try{SFX.chest()}catch(_){}
 toast(`🎁 任务完成：${q.title}　+${rw.xp||0}XP${rw.item?' · '+rw.item:''}`,2200);
 try{floatText('🎁 +奖励',0,0,'#ffe082')}catch(_){}
 renderQuestHud();
 if((rw.xp||0)>=3)showStarCeleb(1,'探险奖励！',900);
}
function bumpQuest(kind,ok){
 if(!G||!G.quests)return;
 for(const q of G.quests){
  if(q.done)continue;
  if(q.kind==='ans'&&kind==='ans'&&nearLM(q.near,q.r)){q.prog=Math.min(q.need,q.prog+1);if(q.prog>=q.need)questReward(q)}
  else if(q.kind==='ok'&&kind==='ok'&&ok&&nearLM(q.near,q.r)){q.prog=Math.min(q.need,q.prog+1);if(q.prog>=q.need)questReward(q)}
 }
 renderQuestHud();
}
function tickExplore(dt){
 if(!G||!G.quests||state!=='play')return;
 const canVisit=G.answered>=1;
 for(const q of G.quests){
  if(q.done||q.kind!=='visit')continue;
  if(canVisit&&nearLM(q.near,q.r)){q.prog=q.need;questReward(q)}
 }
 if(canVisit&&window.__LM){
  for(const id of Object.keys(window.__LM)){
   const L=window.__LM[id];
   if(G.explore[id])continue;
   if(distXZ(G.p.x,G.p.z,L.x,L.z)<4.2){
    G.explore[id]=1;
    const q=G.quests.find(x=>x.near===id&&x.kind==='visit');
    if(q&&q.done)continue;
    addXP(1);toast(`📍 发现${L.label}！+1XP`,1400);
   }
  }
 }
 updQuestArrow(dt);
}
function renderQuestHud(){
 const el=$('qlist'),wrap=$('questHud');if(!el||!G||!G.quests){if(wrap)wrap.classList.add('hide');return}
 wrap.classList.remove('hide');
 const focus=G.quests.find(q=>!q.done)||null;
 el.innerHTML=G.quests.map(q=>{
  const mark=q.done?'✅':(focus&&focus.id===q.id?'🔸':'⬜');
  const extra=q.done?'':` (${q.prog}/${q.need})`;
  return `<div class="qi${q.done?' done':''}${focus&&focus.id===q.id?' on':''}">${mark} ${q.title}${extra}</div>`;
 }).join('');
}
function updQuestArrow(dt){
 const box=$('qArrow'),icon=$('qArrIcon'),lab=$('qArrLab');
 if(!box||!icon)return;
 if(!G||state!=='play'||!G.quests){box.style.display='none';return}
 const open=G.quests.find(q=>!q.done);if(!open){box.style.display='none';return}
 const L=lmOf(open.near);if(!L){box.style.display='none';return}
 const dx=L.x-G.p.x,dz=L.z-G.p.z,d=Math.hypot(dx,dz);
 if(d<open.r+.8){box.style.display='none';return}
 const worldAng=Math.atan2(dx,-dz); // yaw 0 → -Z
 const rel=worldAng-yaw;
 icon.style.transform=`rotate(${rel}rad)`;
 lab.textContent=`${L.label} ${d|0}格`;
 box.style.display='block';
}

let landmarks=[];
function clearLandmarks(){for(const L of landmarks){scene.remove(L.mesh);if(L.mesh.material){if(L.mesh.material.map)L.mesh.material.map.dispose();L.mesh.material.dispose()}}landmarks.length=0}
function addSignSprite(x,y,z,label,fg){
 const c=document.createElement('canvas');c.width=128;c.height=48;const g=c.getContext('2d');
 g.fillStyle='rgba(92,58,28,.94)';g.fillRect(0,0,128,48);
 g.strokeStyle='#3a2410';g.lineWidth=5;g.strokeRect(2,2,124,44);
 g.fillStyle=fg||'#ffe9a8';g.font='bold 28px "Microsoft YaHei","PingFang SC",sans-serif';g.textAlign='center';g.textBaseline='middle';
 g.fillText(label,64,26);
 const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;if('colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:true,sizeAttenuation:true}));
 m.scale.set(3.2,1.2,1);m.position.set(x+.5,y,z+.5);scene.add(m);landmarks.push({mesh:m,x,y,z});
}
// 天空装饰：太阳/月亮 + 漂浮的大云
const sun=new THREE.Mesh(new THREE.PlaneGeometry(14,14),new THREE.MeshBasicMaterial({color:0xfff6a0,fog:false}));scene.add(sun);
const moon=new THREE.Mesh(new THREE.PlaneGeometry(10,10),new THREE.MeshBasicMaterial({color:0xdde7ff,fog:false}));scene.add(moon);
const deco=new THREE.Group();{const m=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.85});const r=R(77);for(let i=0;i<22;i++){const c=new THREE.Mesh(new THREE.BoxGeometry(6+r()*10,1.2,4+r()*8),m);c.position.set(-40+r()*150,H+4+r()*6,-40+r()*150);deco.add(c)}}scene.add(deco);
// 目标框
const selBox=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.004,1.004,1.004)),new THREE.LineBasicMaterial({color:0x000000}));selBox.visible=false;scene.add(selBox);

// ================= 状态 =================
let G=null;let state='menu';const keys={};const joyV={x:0,y:0};let yaw=Math.PI*.75,pitch=-.15,menuT=0,endTimer=0;
function resetInput(){for(const k in keys)keys[k]=false;joyV.x=joyV.y=0;look=null;const knob=$('knob');if(knob)knob.style.transform='';document.querySelectorAll('.tb.down').forEach(el=>el.classList.remove('down'))}
const EYE=1.62;
const altOf=()=>G?Math.max(0,Math.round(G.p.y-(GH+1))):0;
function resize(){touchMode=calcTouch();renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,touchMode?1.25:1.5));renderer.setSize(innerWidth,innerHeight,false);cv.style.width=innerWidth+'px';cv.style.height=innerHeight+'px';camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 const show=touchMode&&state!=='menu'&&!!G;$('touch').classList.toggle('hide',!show);document.body.classList.toggle('touchui',show);updLockHint();tabletCls()}
addEventListener('resize',resize);
function updLockHint(){const h=$('lockHint');if(h)h.classList.toggle('hide',!(G&&state==='play'&&!touchMode&&document.pointerLockElement!==cv))}
function newEnt(x,y,z,extra){return Object.assign({x,y,z,w:.6,h:1.8,vx:0,vy:0,vz:0,on:false,face:0,anim:0,hurt:0},extra)}
function spawnPos(){return newEnt(SPX+.5,GH+1.01,SPZ+.5)}
function startGame(opts){
 opts=opts||{};if(endTimer){clearTimeout(endTimer);endTimer=0}resetInput();
 const list=opts.wrongList?validQs(opts.wrongList):null;
 if(opts.wrongList&&!list.length){toast('没有可练习的错题');return false}gen();
 if(opts.sub)sub=opts.sub;
 const N0=opts.N!=null?opts.N:(list?Math.min(list.length,roundLen):roundLen);
 const units0=list?[]:(opts.units||unitsOf().filter(u=>(selOf()).includes(u.id)));
 G={mode:list?'wrong':(opts.boost?'boost':'normal'),wrongPool:list?shuffle(list):null,N:N0,ed,sub,
  units:units0,
  p:spawnPos(),hearts:10,xp:0,lvl:0,inv:{},answered:0,correct:0,kills:0,deaths:0,mined:0,seen:new Set(),wrongs:[],
  mobs:[],animals:[],aniT:1,parts:[],boss:null,bossHint:false,sel:0,built:0,maxAlt:0,achv:{},buildMode:false,pill:null,bossDone:false,spawnT:12,t0:Date.now(),texts:[]};
 if(!list&&!G.units.length){toast('请先选择至少一个单元');G=null;return false}
 yaw=Math.PI*.75;pitch=-.12;
 ITEMS.forEach(i=>G.inv[i]=0);G.tools={pick:1,sword:0,axe:0};G.mine=null;for(let i=0;i<3;i++)spawnAnimal(true);
 hideAll();initQuests();$('hud').classList.remove('hide');state='play';resize();updHUD();updBossHint();
 toast(opts.toastMsg||(G.mode==='wrong'?'⚔ 错题挑战开始！':SUBN[sub]+'世界 · 去挖矿吧！'),2200);
 if(!opts.skipTut&&!LS.get('tut7',false))showTut();else if(!touchMode)tryLock();
 return true;
}
function startPyBsBoost(){
 ac();SFX.click();
 const e=ed||'new';
 const py=BOOKS[e].pinyin.filter(u=>['p3','p4','p5','p6'].includes(u.id));
 const dig=BOOKS[e].bishun.filter(u=>u.id==='b0');
 // dig-strokes preferred: weight b0 higher
 const units=[...py,...dig,...dig,...dig];
 if(!units.length){toast('题库未就绪');return}
 startGame({boost:true,sub:'pinyin',units,N:12,toastMsg:'⭐ 拼音+笔顺强化 · 12 题短冒险！',skipTut:!!LS.get('tut7',false)});
}
function updBossHint(){
 const el=$('bossHint');if(!el)return;
 const show=!!(G&&G.boss&&G.bossHint&&state!=='end'&&state!=='menu');
 el.style.display=show?'block':'none';
 if(!show){el.classList.add('hide');return}
 el.classList.remove('hide');
 const b=G.boss,p=G.p;const dx=b.x-p.x,dz=b.z-p.z;
 const ang=Math.atan2(-dx,-dz); // match lookDir yaw (x:-sin yaw, z:-cos yaw)
 let d=ang-yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;
 const arr=el.querySelector('.arr');if(arr)arr.style.transform='rotate('+(-d*180/Math.PI)+'deg)';
}

// ================= 物理（AABB） =================
function hitsSolid(e){const x0=Math.floor(e.x-e.w/2),x1=Math.floor(e.x+e.w/2-1e-6),z0=Math.floor(e.z-e.w/2),z1=Math.floor(e.z+e.w/2-1e-6),y0=Math.floor(e.y),y1=Math.floor(e.y+e.h-1e-6);
 for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++)for(let y=y0;y<=y1;y++)if(solid(x,y,z))return [x,y,z];return null}
function moveAxis(e,a,d){if(!d)return false;const steps=Math.ceil(Math.abs(d)/.4);const s=d/steps;
 for(let i=0;i<steps;i++){e[a]+=s;const h=hitsSolid(e);if(h){
  if(a==='y'){if(s<0){e.y=h[1]+1;e.on=true}else e.y=h[1]-e.h-1e-4;e.vy=0}
  else if(a==='x'){e.x=s>0?h[0]-e.w/2-1e-4:h[0]+1+e.w/2+1e-4}else{e.z=s>0?h[2]-e.w/2-1e-4:h[2]+1+e.w/2+1e-4}
  return true}}return false}
function phys(e,dt,fly){e.on=false;if(!fly)e.vy=Math.max(e.vy-28*dt,-30);
 const bx=moveAxis(e,'x',e.vx*dt),bz=moveAxis(e,'z',e.vz*dt);e.blocked=bx||bz;moveAxis(e,'y',e.vy*dt);
 if(Math.hypot(e.vx,e.vz)>.1)e.anim+=dt*9;if(e.hurt>0)e.hurt-=dt;
 if(e.y<-8){if(e===G.p){Object.assign(e,spawnPos());toast('掉出世界啦，回到出生点',1200)}else{e.dead=1}}}

// ================= 交互 =================
const pc=()=>({x:G.p.x,y:G.p.y+EYE,z:G.p.z});
function lookDir(){const cp=Math.cos(pitch);return {x:-Math.sin(yaw)*cp,y:Math.sin(pitch),z:-Math.cos(yaw)*cp}}
function ray(maxD){const o=pc(),d=lookDir();let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);
 const sx=Math.sign(d.x),sy=Math.sign(d.y),sz=Math.sign(d.z);
 const tdx=Math.abs(1/d.x),tdy=Math.abs(1/d.y),tdz=Math.abs(1/d.z);
 let tx=d.x>0?(x+1-o.x)*tdx:(o.x-x)*tdx,ty=d.y>0?(y+1-o.y)*tdy:(o.y-y)*tdy,tz=d.z>0?(z+1-o.z)*tdz:(o.z-z)*tdz;let px=x,py=y,pz=z,t=0;
 for(let i=0;i<64&&t<=maxD;i++){const b=getB(x,y,z);if(b!==B.AIR&&inW(x,y,z))return {x,y,z,px,py,pz,b,d:t};
  px=x;py=y;pz=z;if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx}else if(ty<tz){y+=sy;t=ty;ty+=tdy}else{z+=sz;t=tz;tz+=tdz}}return null}
const REACH=5;
function targetBlock(){const h=ray(REACH);if(!h)return null;const r=[h.x,h.y,h.z];r.hit=h;return r}
let lastHit=null;
// 实体拾取：沿准星方向找最近的生物
function pickEnt(maxD){const o=pc(),d=lookDir();let best=null,bt=maxD;const blockD=(ray(maxD)||{d:1e9}).d;
 const test=(e,kind,pad)=>{const hw=(e.w||1)/2+pad,minX=e.x-hw,maxX=e.x+hw,minY=e.y-pad,maxY=e.y+(e.h||1)+pad,minZ=e.z-hw,maxZ=e.z+hw;
  let t0=0,t1=bt;for(const [o1,d1,a,b] of [[o.x,d.x,minX,maxX],[o.y,d.y,minY,maxY],[o.z,d.z,minZ,maxZ]]){if(Math.abs(d1)<1e-9){if(o1<a||o1>b)return}else{let ta=(a-o1)/d1,tb=(b-o1)/d1;if(ta>tb)[ta,tb]=[tb,ta];t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1)return}}
  if(t0<bt&&t0<=blockD+.3){bt=t0;best={kind,e}}};
 for(const m of G.mobs)test(m,'mob',.2);for(const a of G.animals)test(a,'animal',.25);return best}
function nearMob(){const c=G.p;let best=null,bd=2.2;for(const m of G.mobs){const d=Math.hypot(m.x-c.x,m.y-c.y,m.z-c.z);if(d<bd){bd=d;best=m}}return best}
function interact(x,y,z){const b=getB(x,y,z),inf=INFO[b];lastHit={x:x+.5,y:y+.5,z:z+.5};if(!inf||inf.unb){toast((inf?inf.n:'基岩')+'挖不动！',900);return}
 if(isPl(x,y,z)){breakBlock(x,y,z,false);return}
 if(inf.free){breakBlock(x,y,z,false);return}openQ({kind:'block',x,y,z,b,need:inf.need||1,got:0})}
// 粒子
const PG=new THREE.BoxGeometry(.13,.13,.13);const PMC={};
function burst(x,y,tex,n,color,z){let px,py,pz;if(z!==undefined){px=x;py=y;pz=z}else if(lastHit){px=lastHit.x;py=lastHit.y;pz=lastHit.z}else{const o=pc(),d=lookDir();px=o.x+d.x*3;py=o.y+d.y*3;pz=o.z+d.z*3}
 n=Math.min(n,20);for(let i=0;i<n;i++){let c=color;if(!c&&tex){const d=tex.getContext('2d').getImageData(Math.random()*16|0,Math.random()*16|0,1,1).data;c=`rgb(${d[0]},${d[1]},${d[2]})`}c=c||'#fff';
  const mat=PMC[c]||(PMC[c]=new THREE.MeshBasicMaterial({color:new THREE.Color(c)}));const m=new THREE.Mesh(PG,mat);m.position.set(px+(Math.random()-.5)*.6,py+(Math.random()-.5)*.6,pz+(Math.random()-.5)*.6);scene.add(m);
  G.parts.push({m,vx:(Math.random()-.5)*5,vy:Math.random()*5+1,vz:(Math.random()-.5)*5,life:.6+Math.random()*.5})}
 if(G.parts.length>120){for(const q of G.parts.splice(0,G.parts.length-120))scene.remove(q.m)}}
function floatText(t,x,y,c){const el=document.createElement('div');el.className='ftx';el.textContent=t;el.style.color=c||'#fff';el.style.left=(40+Math.random()*20)+'%';$('ftxs').appendChild(el);setTimeout(()=>el.remove(),1500)}
function addXP(n){if(!G||!n)return;n=n|0;for(let i=0;i<Math.min(n,6);i++)setTimeout(()=>SFX.xp(),i*70);G.xp+=n;try{floatText('+'+n+' XP',0,0,'#ffe566')}catch(_){}
 const xw=$('xpwrap');if(xw){xw.classList.add('flash');clearTimeout(addXP._ft);addXP._ft=setTimeout(()=>xw.classList.remove('flash'),380)}
 while(G.xp>=10*(G.lvl+1)){G.xp-=10*(G.lvl+1);G.lvl++;SFX.lvl();toast(`⬆ 升级！等级 ${G.lvl}`,1400);try{floatText('⬆ Lv.'+G.lvl,0,0,'#7CFC00')}catch(_){}}updHUD()}
// ===== 友好动物 =====
const ANI={pig:{n:'猪',w:.9,h:.9,sp:1},sheep:{n:'羊',w:.9,h:1.1,sp:.8},chicken:{n:'鸡',w:.45,h:.7,sp:1.2}};
function topAt(x,z){return surfH[clamp(x,0,X-1)+X*clamp(z,0,Z-1)]}
function spawnAnimal(near){const p=G.p;for(let k=0;k<20;k++){const ang=Math.random()*Math.PI*2,dist=near?4+Math.random()*5:8+Math.random()*14;const x=Math.floor(p.x+Math.cos(ang)*dist),z=Math.floor(p.z+Math.sin(ang)*dist);if(x<2||z<2||x>X-3||z>Z-3)continue;const s=topAt(x,z);if(getB(x,s,z)!==B.GRASS||getB(x,s+1,z)!==B.AIR||getB(x,s+2,z)!==B.AIR)continue;
 const type=pick(['pig','pig','sheep','sheep','chicken']);G.animals.push(newEnt(x+.5,s+1.01,z+.5,{type,w:ANI[type].w,h:ANI[type].h,cd:2,wt:0}));return}}
function nearAnimal(){const c=G.p;let best=null,bd=2;for(const a of G.animals){const d=Math.hypot(a.x-c.x,a.y-c.y,a.z-c.z);if(d<bd){bd=d;best=a}}return best}
function hearts(){floatText('❤ ❤ ❤',0,0,'#ff6b8b')}
const SFXA={pig:()=>{tone(260,.12,'square',.07,200);tone(300,.1,'square',.06,220,.13)},sheep:()=>tone(520,.35,'triangle',.08,470),chicken:()=>{tone(1200,.06,'square',.05,900);tone(1300,.06,'square',.05,1000,.09)}};
function animalReward(a,ok){SFXA[a.type]();if(!ok){a.cd=6;const dx=a.x-G.p.x,dz=a.z-G.p.z,l=Math.hypot(dx,dz)||1;a.vx=dx/l*3;a.vz=dz/l*3;a.run=1.2;floatText(ANI[a.type].n+'跑开了～',0,0,'#fff');return}
 burst(a.x,a.y+a.h,null,10,'#ff6b8b',a.z);hearts();addXP(2);
 if(a.type==='pig'){G.hearts=Math.min(10,G.hearts+1);floatText('🍖 猪排 +1❤',0,0,'#ffb3c1')}
 else if(a.type==='sheep'){G.inv['羊毛']=(G.inv['羊毛']||0)+2;floatText('🐑 +2 羊毛',0,0,'#fff')}
 else{G.inv['泥土']=(G.inv['泥土']||0)+3;floatText('🥚 鸡蛋换 +3 泥土',0,0,'#fff6c0')}
 G.animals=G.animals.filter(x=>x!==a);G.fed=(G.fed||0)+1;updHUD()}
function knock(m){const dx=m.x-G.p.x,dz=m.z-G.p.z,l=Math.hypot(dx,dz)||1;m.x+=dx/l*2.5;m.z+=dz/l*2.5;if(hitsSolid(m)){m.x-=dx/l*2.5;m.z-=dz/l*2.5}m.vy=6;m.cd=2;G.p.vy=5}
// ===== 搭方块 =====
function boxHit(e,x,y,z){return e.x-e.w/2<x+1&&e.x+e.w/2>x&&e.z-e.w/2<z+1&&e.z+e.w/2>z&&e.y<y+1&&e.y+e.h>y}
function cellFree(x,y,z){if(!inW(x,y,z)||getB(x,y,z)!==B.AIR)return false;if(boxHit(G.p,x,y,z))return false;for(const m of G.mobs)if(boxHit(m,x,y,z))return false;for(const a of G.animals)if(boxHit(a,x,y,z))return false;return true}
function placeAt(x,y,z,quiet){if(state!=='play')return false;const it=selItem();if(!it){if(!quiet)toast('背包里没有方块，先去挖一些吧（草和泥土随便挖）',1600);return false}
 const c=pc();if(Math.hypot(x+.5-c.x,y+.5-c.y,z+.5-c.z)>REACH+.9){if(!quiet)toast('太远了！',800);return false}
 if(!cellFree(x,y,z)){if(!quiet)toast('这里放不下',800);return false}
 if(![[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].some(([a,b,d])=>getB(x+a,y+b,z+d)!==B.AIR)){if(!quiet)toast('方块要挨着别的方块才能放',1000);return false}
 return doPlace(x,y,z,it)}
function placeTarget(){if(state!=='play')return;ac();if(pitch<-1.15&&G.p.on){buildUp();return}const h=ray(REACH);if(!h){if(pitch<-1.0){buildUp();return}toast('准星对准一个方块，新方块会贴在它旁边',1200);return}placeAt(h.px,h.py,h.pz)}
function placeBelow(quiet){const p=G.p,x=Math.floor(p.x),z=Math.floor(p.z),y=Math.floor(p.y)-1;if(p.y-(y+1)>1.05||!cellFree(x,y,z))return false;const it=selItem();if(!it){if(!quiet)toast('背包里没有方块，先去挖一些吧（草和泥土随便挖）',1600);return false}return doPlace(x,y,z,it)}
function buildUp(){if(state!=='play')return;ac();if(!selItem()){toast('背包里没有方块，先去挖一些吧（草和泥土随便挖）',1600);return}const p=G.p;
 if(p.on){p.vy=8.6;SFX.jump();G.pill={t:.7}}else if(!placeBelow(true))G.pill={t:.4}}
function hurtPlayer(n){if(G&&G.bossDone)return;G.hearts=Math.max(0,G.hearts-n);G.p.hurt=.5;SFX.hurt();const f=$('hurtfx');if(f){f.style.opacity=.6;setTimeout(()=>f.style.opacity=0,250)}updHUD()}


// ================= 题目 =================
function nextQuestion(){
 if(G.mode==='wrong'){if(!G.wrongPool.length)G.wrongPool=shuffle(G.wrongs.length?G.wrongs.map(cleanQ):(wrongStore(G.ed,G.sub)));const q=G.wrongPool.shift();return q?Object.assign({},q):genOne()}
 return genOne()}
function genOne(){const us=G.units.length?G.units:unitsOf(G.ed,G.sub);let q;for(let i=0;i<40;i++){const u=pick(us);q=u.gen();q.unit=u.id;q.uname=u.name;const sig=q.q+(q.svg||'');if(!G.seen.has(sig)){G.seen.add(sig);break}}return q}
const cleanQ=q=>{const c=Object.assign({},q);delete c.your;return c};
let cur=null,ctx=null,numBuf='',answeredCard=false;
function openQ(c){if(G&&G.bossDone)return;if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){}ctx=c;cur=(c.kind==='boss'&&digBoss())?digQ():nextQuestion();if(c.kind==='boss'&&cur&&cur.t==='dig')c.chain=c.chain||1;cur=fixQ(cur);if(!cur){toast('没有题目了');return}state='card';answeredCard=false;numBuf='';resetInput();
 const ic=$('cicon').getContext('2d');ic.clearRect(0,0,16,16);let title='',icon=null;
 if(c.kind==='block'){const inf=INFO[c.b];icon=TEX[c.b];title=`⛏ 挖掘：${inf.n}`+(c.need>1?`（钻石矿要连续答对 ${c.need} 题：第 ${c.got+1} 题）`:'')+` · 奖励 ${inf.item} +${inf.xp}XP`}
 else if(c.kind==='animal'){const n=ANI[c.a.type].n;title=`${c.a.type==='pig'?'🐷':c.a.type==='sheep'?'🐑':'🐔'} 友好的${n}！答对了它会送你礼物（${c.a.type==='pig'?'猪排 +1❤':c.a.type==='sheep'?'羊毛方块':'泥土'}）`;SFXA[c.a.type]()}
 else if(c.kind==='mob'){title=c.mob.type==='creeper'?'💥 绿芽怪来了！答对才能打败它':'🧟 僵尸来袭！'+(G.tools.sword?'有剑，答对 1 题就打败它':'没有剑要答对 2 题（第 '+((c.got||0)+1)+' 题）');}
 else{const bhp=(G.boss&&G.boss.hp!=null)?G.boss.hp:'?';title=cur.t==='dig'?`🐉 守关巨龙！连挖 3 个字：第 ${c.chain}/3 个（一笔不错 = 打中一次，龙还剩 ${bhp} 血）`:`🐉 守关巨龙！还要答对 ${bhp} 题`}
 if(cur.t==='dig'&&c.kind==='block')title=`⛏ 汉字矿：${INFO[c.b].n} · 按笔顺把笔画挖出来！`;
 if(icon)ic.drawImage(icon,0,0);else{ic.fillStyle=c.kind==='mob'?(c.mob.type==='creeper'?'#4c4':'#5a5'):'#222';ic.fillRect(0,0,16,16);ic.fillStyle=c.kind==='boss'?'#d6f':'#000';ic.fillRect(3,5,3,3);ic.fillRect(10,5,3,3)}
 $('ctt').textContent=title;$('cmeta').textContent=`${G.mode==='wrong'?'错题挑战':''} ${cur.uname||''} · 已答 ${G.answered}/${G.N}`;
 $('csvg').innerHTML=cur.svg||'';if(cur&&cur.q){const _sq=sanitizeStemIfNeeded(cur.q);if(_sq!==cur.q){cur.q=_sq;}} $('cq').textContent=cur.q;$('cfb').className='hide';$('cNext').classList.add('hide');$('cextra').innerHTML='';
 if(cur.hz&&typeof HZD!=='undefined'&&HZD[cur.hz.c]){$('csvg').innerHTML='<canvas id="hzcv" width="360" height="360" style="width:180px;height:180px;border:3px solid #555"></canvas>';hzDraw($('hzcv'),cur.hz.c,cur.hz.mode==='hi'?{ghost:1,hi:cur.hz.i}:{})}
 $('card').classList.toggle('digmode',cur.t==='dig');
 if(cur.t==='dig'){digOpen(cur.c);$('card').classList.remove('hide');return}
 if(cur.say&&!cur.sayAfter)addSayBtn();
 if(cur.tiles){tilesOpen(cur)}else if(cur.t==='mc'){$('cbody').innerHTML=cur.opts.map((o,i)=>`<button class="btn opt" data-i="${i}">${i+1}. ${o}</button>`).join('');document.querySelectorAll('#cbody .opt').forEach(b=>{b.onclick=e=>{e.preventDefault();e.stopPropagation();if(answeredCard||b.disabled)return;if(b._lock)return;b._lock=1;SFX.click();answer(cur.opts[b.dataset.i],b)}; b.ondblclick=e=>{e.preventDefault();e.stopPropagation()};})}
 else{$('cbody').innerHTML='<div id="numdisp">&nbsp;</div><div id="keypad">'+[1,2,3,4,5,6,7,8,9,'⌫',0,'✔'].map(k=>`<button class="btn${k==='✔'?' green':''}" data-k="${k}">${k}</button>`).join('')+'</div>';
  document.querySelectorAll('#keypad .btn').forEach(b=>{b.onclick=e=>{e.preventDefault();if(answeredCard||b._lock)return;if(b.dataset.k==='✔'){b._lock=1;setTimeout(()=>b._lock=0,420)}SFX.click();numKey(b.dataset.k)};b.ondblclick=e=>e.preventDefault()})}
 const card=$('card');card.classList.add('hide');void card.offsetWidth;card.classList.remove('hide')}

// ================= ⛏ 按顺序挖笔画 =================
let DIG=null;
function digBoss(){return G&&G.sub==='bishun'&&G.mode!=='wrong'&&G.units.some(u=>u.id==='b0')}
function digQ(){const u=G.units.find(x=>x.id==='b0');let q;for(let i=0;i<30;i++){q=u.gen();if(!G.seen.has(q.q))break}G.seen.add(q.q);q.unit=u.id;q.uname=u.name;return q}
function digReward(n){return n>=8?{item:'钻石',xp:8}:n>=5?{item:'金',xp:4}:{item:'铁',xp:3}}
function digPatCv(base,vr,cell,spk){const c=document.createElement('canvas');c.width=c.height=16*cell;const g=c.getContext('2d');
 for(let y=0;y<16;y++)for(let x=0;x<16;x++){const r=Math.random();g.fillStyle=spk&&r<.07?spk:rgb(base,1+(Math.random()-.5)*vr);g.fillRect(x*cell,y*cell,cell,cell)}return c}
function digOpen(c){const d=HZD[c],n=d.s.length;digClose();
 const css=Math.round(Math.min(innerWidth*.8,innerHeight*.46,420)),S=Math.round(css*Math.min(window.devicePixelRatio||1,2));
 $('csvg').innerHTML=`<canvas id="digcv" width="${S}" height="${S}" style="width:${css}px;height:${css}px"></canvas><div id="digprog" aria-label="挖笔画进度"><i id="digprogi" style="width:0%"></i></div><div id="digst">第 1 笔在哪里？挖一挖！下一笔已高亮～</div>`;
 $('cbody').innerHTML='<div id="digctl"><button class="btn" id="digHint">💡 提示</button><button class="btn" id="digRe">↺ 重来</button></div>';
 const cv=$('digcv'),g=cv.getContext('2d'),cell=Math.max(2,Math.round(S/90));
 DIG={c,n,cv,S,last:performance.now(),done:0,mist:0,hearts:0,finished:0,anim:0,parts:[],flash:null,hint:null,trace:null,glow:0,
  pS:g.createPattern(digPatCv([128,128,128],.38,cell,'#5c5c5c'),'repeat'),pG:g.createPattern(digPatCv([250,200,40],.3,cell,'#fff6b0'),'repeat'),
  pD:g.createPattern(digPatCv([92,219,213],.3,cell,'#e8fffe'),'repeat')};
 // v13: 按下跟踪，滑出画布则取消；抬起再判定，减少误触
 DIG.press=null;
 const xyOf=(e)=>{const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)*S/r.width,y:(e.clientY-r.top)*S/r.height,cssW:r.width,inside:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};};
 cv.addEventListener('pointerdown',e=>{e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}
  const p=xyOf(e); DIG.press={id:e.pointerId,x:p.x,y:p.y,cssW:p.cssW,alive:1}; cv.classList.add('next-glow');});
 cv.addEventListener('pointermove',e=>{if(!DIG||!DIG.press||DIG.press.id!==e.pointerId)return;e.preventDefault();
  const p=xyOf(e); DIG.press.x=p.x;DIG.press.y=p.y;DIG.press.cssW=p.cssW;
  if(!p.inside){ DIG.press.alive=0; cv.classList.remove('next-glow'); const st=$('digst'); if(st&&!DIG.finished){st.textContent='手指滑出了，松手取消，再点下一笔～';st.className='';} }});
 const endPress=e=>{if(!DIG||!DIG.press||DIG.press.id!==e.pointerId)return;e.preventDefault();
  const p=DIG.press; DIG.press=null; cv.classList.remove('next-glow');
  if(!p.alive){return;} digTap(p.x,p.y,p.cssW);};
 cv.addEventListener('pointerup',endPress);
 cv.addEventListener('pointercancel',e=>{if(DIG&&DIG.press&&DIG.press.id===e.pointerId){DIG.press=null;cv.classList.remove('next-glow');}});
 cv.addEventListener('lostpointercapture',e=>{if(DIG&&DIG.press&&DIG.press.id===e.pointerId){DIG.press=null;cv.classList.remove('next-glow');}});
 $('digHint').onclick=()=>{SFX.click();digShowHint(1600)};
 $('digRe').onclick=()=>{SFX.click();if(!DIG||DIG.finished)return;DIG.done=0;DIG.trace=null;DIG.parts=[];DIG.press=null;digUpdProg();$('digst').className='';$('digst').textContent='重新开始：第 1 笔在哪里？下一笔已高亮～';digShowHint(1200)};
 digShowHint(2200); digUpdProg();
 DIG.raf=requestAnimationFrame(digRender)}
function digUpdProg(){const D=DIG,el=$('digprogi');if(!D||!el)return;el.style.width=((D.done/Math.max(1,D.n))*100).toFixed(1)+'%';}
function digClose(){if(DIG){cancelAnimationFrame(DIG.raf);DIG.dead=1}DIG=null;$('card').classList.remove('digmode')}
function digShowHint(ms){const D=DIG;if(!D||D.finished)return;D.hint={i:D.done,t:performance.now()+ms}}
function digDist(c,i,X,Y){const m=HZD[c].m[i];let b=1e9;if(m.length===1)return Math.hypot(X-m[0][0],Y-m[0][1]);
 for(let k=1;k<m.length;k++){const ax=m[k-1][0],ay=m[k-1][1],bx=m[k][0],by=m[k][1],dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;let t=L?((X-ax)*dx+(Y-ay)*dy)/L:0;t=Math.max(0,Math.min(1,t));b=Math.min(b,Math.hypot(X-ax-t*dx,Y-ay-t*dy))}return b}
// 命中检测：Path2D 填充 isPointInPath + 沿中线的宽容差（小笔画如“点”在手机上也好点）
function digHit(x,y,cssW){const D=DIG,S=D.S,k=S/1024,X=x/k,Y=900-y/k,g=D.cv.getContext('2d');const tol=Math.max(130,34*1024/(cssW||S)); // v13: 更大触控宽容
 g.save();hzT(g,S);const inF=i=>g.isPointInPath(hzPath(D.c,i),x,y);const nx=D.done;let r=null;
 if(inF(nx)||digDist(D.c,nx,X,Y)<=62)r=nx; // v13: 优先下一笔
 else{for(let j=nx+1;j<D.n;j++)if(inF(j)){r=j;break}
  if(r===null){if(digDist(D.c,nx,X,Y)<=tol)r=nx;else{let bd=tol;for(let j=nx+1;j<D.n;j++){const dd=digDist(D.c,j,X,Y);if(dd<=bd){bd=dd;r=j}}}}}
 g.restore();return r}
function digLabel(i){const d=HZD[DIG.c];return d.ok[i]?`第 ${i+1} 笔：${d.n[i]}`:`第 ${i+1} 笔`}
function digTap(x,y,cssW){const D=DIG;if(!D||D.finished||state!=='card')return;ac();const r=digHit(x,y,cssW),now=performance.now(),st=$('digst');
 if(r===null){if(D.done>0&&(()=>{const g=D.cv.getContext('2d');g.save();hzT(g,D.S);let h=false;for(let j=0;j<D.done;j++)if(g.isPointInPath(hzPath(D.c,j),x,y))h=true;g.restore();return h})())st.textContent='这一笔已经挖出来啦，找下一笔！';else st.textContent='点在灰色的笔画上哦～';st.className='';return}
 if(r===D.done){SFX.brk();for(let i=0;i<22;i++)D.parts.push({x,y,vx:(Math.random()-.5)*D.S*.02,vy:-Math.random()*D.S*.02,life:.5+Math.random()*.4,c:i%3?(i%2?'#ffd21f':'#fff6b0'):'#8a8a8a',s:D.S*(.012+Math.random()*.014)});
  D.trace={i:r,t0:now,t1:now+380};D.hint=null;D.done++;digUpdProg();st.textContent=digLabel(r)+' ✔'+(D.done<D.n?`　→ 请挖第 ${D.done+1} 笔`:'');st.className='ok';
  if(D.done>=D.n)digFinish(); else digShowHint(2400);}
 else{SFX.bad();D.flash={i:r,t:now+650};D.cv.classList.remove('shake');void D.cv.offsetWidth;D.cv.classList.add('shake');D.mist++;
  let h='';if(D.hearts<2){D.hearts++;hurtPlayer(1);updHUD();h='　-1 ❤'}
  st.textContent=`✘ 不对哦，请挖高亮的第 ${D.done+1} 笔${h}`;st.className='no';digShowHint(2000);}}
function digFinish(){const D=DIG;D.finished=1;D.glow=performance.now();digUpdProg();$('digctl').innerHTML='';$('digst').textContent=`🎉 “${D.c}”挖出来啦！共 ${D.n} 画`;$('digst').className='ok';
 setTimeout(()=>{if(DIG!==D)return;D.anim=1;cancelAnimationFrame(D.raf);hzAnimate(D.cv,D.c);const b=document.createElement('button');b.className='btn sm';b.id='animBtn';b.textContent='▶ 再看笔顺动画';b.onclick=()=>hzAnimate(D.cv,D.c);$('digctl').appendChild(b)},1100);
 answer(D.mist)}
function digRender(now){const D=DIG;if(!D||D.dead||D.anim)return;const g=D.cv.getContext('2d'),S=D.S,c=D.c,d=HZD[c];
 hzGrid(g,S);const gl=D.glow?Math.min(1,(now-D.glow)/400):0;
 for(let i=0;i<D.n;i++){const p=hzPath(c,i);
  if(gl){g.save();hzT(g,S);g.shadowColor='#ffe066';g.shadowBlur=S/18*gl*(1+.3*Math.sin(now/90));g.fillStyle='#ffd21f';g.fill(p);g.restore()}
  g.save();hzT(g,S);g.clip(p);g.setTransform(1,0,0,1,0,0);g.fillStyle=i<D.done?(D.n>=8?D.pD:D.pG):D.pS;g.fillRect(0,0,S,S);
  if(D.flash&&D.flash.i===i&&now<D.flash.t){g.fillStyle=`rgba(235,25,25,${.75+.12*Math.sin(now/45)})`;g.fillRect(0,0,S,S)}
  // v13: 下一笔持续确认高亮（hint 过期仍有柔和描边）
  if(i===D.done&&!D.finished){g.fillStyle=`rgba(90,220,80,${(D.hint&&now<(D.hint.t||0))?(0.45+.35*Math.sin(now/70)):0.22+.12*Math.sin(now/90)})`;g.fillRect(0,0,S,S)}
  else if(D.hint&&D.hint.i===i&&now<D.hint.t){g.fillStyle=`rgba(110,255,60,${.4+.35*Math.sin(now/70)})`;g.fillRect(0,0,S,S)}
  if(i===D.done&&!D.finished){g.save();hzT(g,S);g.strokeStyle=`rgba(40,160,40,${.55+.25*Math.sin(now/80)})`;g.lineWidth=28;g.lineJoin='round';g.stroke(p);g.restore()}
  if(D.trace&&D.trace.i===i&&now<D.trace.t1){const m=d.m[i],pr=(now-D.trace.t0)/(D.trace.t1-D.trace.t0);hzT(g,S);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=90;g.lineCap='round';g.lineJoin='round';g.beginPath();
   let L=0;for(let k=1;k<m.length;k++)L+=Math.hypot(m[k][0]-m[k-1][0],m[k][1]-m[k-1][1]);let need=pr*L;g.moveTo(m[0][0],m[0][1]);
   for(let k=1;k<m.length&&need>0;k++){const sg=Math.hypot(m[k][0]-m[k-1][0],m[k][1]-m[k-1][1]),f=Math.min(1,need/sg);g.lineTo(m[k-1][0]+(m[k][0]-m[k-1][0])*f,m[k-1][1]+(m[k][1]-m[k-1][1])*f);need-=sg}g.stroke()}
  g.restore();
  g.save();hzT(g,S);g.lineWidth=11;g.strokeStyle=i<D.done?'#7a5200':(D.hint&&D.hint.i===i&&now<D.hint.t?'#1c8a00':'#2a2a2a');g.stroke(p);g.restore()}
 g.setTransform(1,0,0,1,0,0);const dt=clamp((now-D.last)/1000,0,.05);D.last=now;D.parts=D.parts.filter(q=>(q.life-=dt)>0);for(const q of D.parts){q.vy+=S*.0012;q.x+=q.vx;q.y+=q.vy;g.fillStyle=q.c;g.fillRect(q.x,q.y,q.s,q.s)}
 g.fillStyle='rgba(0,0,0,.55)';g.font=`bold ${Math.round(S/14)}px monospace`;g.fillText(`${D.done}/${D.n}`,8,S-10);
 D.raf=requestAnimationFrame(digRender)}
function addSayBtn(){if(document.getElementById('sayBtn'))return;const b=document.createElement('button');b.className='btn sm';b.id='sayBtn';b.textContent='🔊 读一读';b.onclick=()=>speak(cur.say);$('cextra').appendChild(b)}
function numKey(k){if(answeredCard)return;if(k==='⌫')numBuf=numBuf.slice(0,-1);else if(k==='✔'){if(numBuf!=='')answer(numBuf)}else if(numBuf.length<4)numBuf+=k;const d=$('numdisp');if(d)d.innerHTML=numBuf||'&nbsp;'}
function answer(v,btn){if(answeredCard)return;answeredCard=true;const q=cur;const ok=q.t==='dig'?Number(v)===0:q.t==='mc'?v===q.ans:Number(v)===Number(q.ans);G.answered++;if(ok)G.correct++;try{bumpQuest('ans');if(ok)bumpQuest('ok',true)}catch(_){} try{if(btn){btn.classList.add(ok?'ok-pulse':'no-pulse');}}catch(_){}
 // 统计与错题本（与原题库共用存储）
 const st=objStore('stats'),k=key(G.ed,G.sub)+'_'+q.unit;if(q.unit){st[k]=isObj(st[k])&&Number.isFinite(st[k].n)&&Number.isFinite(st[k].r)?st[k]:{n:0,r:0};st[k].n++;if(ok)st[k].r++;LS.set('stats',st)}
 let wb=wrongStore(G.ed,G.sub);const sig=q.q+(q.svg||'');
 if(ok){if(G.mode==='wrong')wb=wb.filter(x=>x.q+(x.svg||'')!==sig)}else{G.wrongs.push(Object.assign({your:q.t==='dig'?`挖错 ${v} 次`:v},q));if(!wb.some(x=>x.q+(x.svg||'')===sig))wb.push(cleanQ(q))}LS.set('wrong_'+key(G.ed,G.sub),wb.slice(-200));
 if(q.t==='mc')document.querySelectorAll('#cbody .opt').forEach(b=>{const o=q.opts[b.dataset.i];if(o===q.ans)b.classList.add('ok','ok-pulse');else if(b===btn)b.classList.add('no','no-pulse');b.disabled=true;b._lock=1});else if(q.t==='num'){const d=$('numdisp');if(d)d.style.color=ok?'#7efc20':'#f55'}
 let msg;
 if(q.t==='dig'){const n=HZD[q.c].s.length,rw=digReward(n);G.inv[rw.item]=(G.inv[rw.item]||0)+1;addXP(rw.xp,G.p.x,G.p.y);ctx.dig=1;ctx.dmg=0;
  ctx.ok=ok;msg=(ok?`✔ 一笔不错！挖出了“${q.c}”`:`⛏ 挖出了“${q.c}”，但挖错了 ${v} 次，已记入错题本`)+`　获得 ${rw.item} +${rw.xp}XP（${n} 画${n>=8?'，超稀有！':''}）`;if(ok)SFX.ok();
  $('cfb').innerHTML=msg+`<div style="font-size:16px;margin-top:4px">💡 ${q.ex}</div>`;$('cfb').className=ok?'ok':'no';$('cNext').classList.remove('hide');setTimeout(()=>{$('cNext').scrollIntoView({block:'nearest'});$('cNext').focus({preventScroll:true})},60);return}
 if(ok){SFX.ok();const extra=ctx.kind==='block'?(ctx.got+1<ctx.need?'钻石矿还要再答对 1 题！':`方块挖掉了！获得 ${INFO[ctx.b].item}`):ctx.kind==='mob'?((ctx.got||0)+1<(G.tools.sword?1:2)?'击中怪物！再答对 1 题（有剑只要 1 题）':'打败了怪物！+3 XP'):ctx.kind==='animal'?(ctx.a.type==='pig'?'小猪送你猪排，+1 ❤':ctx.a.type==='sheep'?'小羊送你 2 块羊毛，可以搭方块！':'小鸡送你 3 块泥土'):'击中守关巨龙！';msg=`✔ 答对了！${extra}`}
 else{SFX.bad();const dmg=ctx.kind==='animal'?0:ctx.kind==='mob'&&ctx.mob.type==='creeper'?(G.tools.sword?1:2):1;msg=(dmg?`✘ 答错了！-${dmg} ❤`:'✘ 答错了，小动物跑开了（不扣血）')+`　正确答案：${q.ans}`;ctx.dmg=dmg}
 if(q.say)addSayBtn();if(q.hz&&typeof HZD!=='undefined'&&HZD[q.hz.c]&&$('hzcv')){hzAnimate($('hzcv'),q.hz.c);const b=document.createElement('button');b.className='btn sm';b.id='animBtn';b.textContent='▶ 看笔顺动画';b.onclick=()=>hzAnimate($('hzcv'),q.hz.c);$('cextra').appendChild(b)}
 ctx.ok=ok;$('cfb').innerHTML=msg+(q.ex?`<div style="font-size:16px;margin-top:4px">💡 ${q.ex}</div>`:'');$('cfb').className=ok?'ok':'no';$('cNext').classList.remove('hide');0}
function closeCard(){if(!answeredCard)return;SFX.click();$('card').classList.add('hide');state='play';setTimeout(()=>{if(state==='play')tryLock()},0);const c=ctx;digClose();
 if(c.dig){c.dig=0;
  if(c.kind==='block'){const b=getB(c.x,c.y,c.z);setB(c.x,c.y,c.z,B.AIR);flushDirty();burst(c.x+.5,c.y+.5,TEX[b],18,null,c.z+.5);SFX.brk();G.mined++;floatText('汉字矿 ✔',c.x+.5,c.y-.3,'#ffe066')}
  else if(c.kind==='mob')killMob(c.mob);
  else if(c.kind==='animal')animalReward(c.a,c.ok);
  else if(c.kind==='boss'){if(c.ok){G.boss.hp--;G.boss.hurt=.4;G.bossHint=false;updBossHint();SFX.roar();burst(G.boss.x,G.boss.y,null,25,'#d6f');if(G.boss.hp<=0){bossDie();return}}
   updHUD();if(G.hearts<=0){die();return}
   if(c.chain<3){c.chain++;c.ok=0;openQ(c);return}}
  updHUD();if(G.hearts<=0){die();return}
  if(G.answered>=G.N&&!G.boss&&!G.bossDone)spawnBoss();return}
 if(c.kind==='animal'){animalReward(c.a,c.ok);updHUD();if(G.answered>=G.N&&!G.boss&&!G.bossDone)spawnBoss();return}
 if(c.kind==='block'){if(c.ok){c.got++;if(c.got<c.need){openQ(c);return}breakBlock(c.x,c.y,c.z,true)}else{hurtPlayer(c.dmg)}}
 else if(c.kind==='mob'){const m=c.mob;if(c.ok){c.got=(c.got||0)+1;if(c.got<(G.tools.sword?1:2)){openQ(c);return}killMob(m)}else{if(m.type==='creeper'){burst(m.x+.35,m.y+.8,null,30,'#ddd');SFX.boom();G.mobs=G.mobs.filter(x=>x!==m)}else{knock(m)}hurtPlayer(c.dmg)}}
 else if(c.kind==='boss'){if(c.ok){G.boss.hp--;G.boss.hurt=.4;G.bossHint=false;updBossHint();SFX.roar();burst(G.boss.x,G.boss.y,null,25,'#d6f');if(G.boss.hp<=0){bossDie();return}}else hurtPlayer(1)}
 updHUD();
 if(G.hearts<=0){die();return}
 if(G.answered>=G.N&&!G.boss&&!G.bossDone)spawnBoss();}
function killMob(m){burst(m.x+.35,m.y+.8,null,24,'#eee');G.mobs=G.mobs.filter(x=>x!==m);G.kills++;addXP(3);floatText('击败！',m.x+.35,m.y-.3,'#ff5')}
function spawnBoss(){G.bossLook=2;G.bossHint=true;const BOSS_R=11,BOSS_H=5.5;G.boss={x:G.p.x+lookDir().x*BOSS_R,y:G.p.y+BOSS_H,z:G.p.z+lookDir().z*BOSS_R,type:'dragon',hp:3,max:3,t:0,face:-1,hurt:0};G.mobs=[];SFX.boss();toast('🐉 守关巨龙出现了！按 ⛏ / 鼠标左键攻击它！跟着箭头找龙～',3000);updBossHint()}
function bossDie(){const g=G;if(!g||g.bossDone)return;g.bossDone=true;g.bossHint=false;updBossHint();const b=g.boss;for(let i=0;i<5;i++)setTimeout(()=>{if(G===g&&state!=='end')burst(b.x+(Math.random()-.5)*4,b.y,null,30,i%2?'#d6f':'#fff')},i*150);g.boss=null;addXP(20);SFX.win();toast('🎉 你打败了守关巨龙！',2000);endTimer=setTimeout(()=>{endTimer=0;if(G===g&&state!=='end')endGame(true)},1600)}
function die(){state='dead';resetInput();if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){}G.deaths++;$('deathTxt').textContent=`已答 ${G.answered} 题，答对 ${G.correct} 题。重生后进度会保留！`;$('deathP').classList.remove('hide');$('touch').classList.add('hide');updLockHint()}
function respawn(){resetInput();G.hearts=10;G.p=spawnPos();G.pill=null;G.mobs=[];G.spawnT=10;$('deathP').classList.add('hide');state='play';resize();updHUD();tryLock();toast('重生啦！加油！',1200)}
function stars(acc){return acc>=.9?3:acc>=.7?2:acc>=.5?1:0}
function endGame(won){if(!G||state==='end')return;if(endTimer){clearTimeout(endTimer);endTimer=0}resetInput();if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){}state='end';updLockHint();const acc=G.answered?G.correct/G.answered:0,s=won?stars(acc):Math.min(stars(acc),1),secs=Math.round((Date.now()-G.t0)/1000);try{if(s>=1)showStarCeleb(s,won?'通关啦！获得星星':'本局星星',1800)}catch(_){};
 const hv=LS.get('history',[]),h=Array.isArray(hv)?hv.filter(isObj):[];h.unshift({d:new Date().toLocaleString('zh-CN',{hour12:false}),ed:G.ed,sub:G.sub,mode:G.mode,n:G.answered,r:G.correct,s,won,secs,lvl:G.lvl});LS.set('history',h.slice(0,50));
 hideAll();$('hud').classList.add('hide');$('touch').classList.add('hide');
 $('endTitle').textContent=won?'🐉 你打败了守关巨龙！通关！':'本局结束';$('endStars').textContent=s?'★'.repeat(s)+'☆'.repeat(3-s):'☆☆☆';
 $('endStats').innerHTML=[['答对',`${G.correct} / ${G.answered} 题`],['正确率',`${Math.round(acc*100)}%`],['等级',G.lvl],['击败怪物',G.kills],['挖掉矿石',G.mined],['重生次数',G.deaths],['搭方块',G.built],['喂小动物',G.fed||0],['最高高度',G.maxAlt],['用时',`${Math.floor(secs/60)}分${secs%60}秒`],['世界',`${SUBN[G.sub]} · ${G.ed==='new'?'分组甲':'分组乙'}`]].map(([a,b])=>`<div>${a}：${b}</div>`).join('');
 $('endItems').innerHTML=ITEMS.filter(i=>G.inv[i]).map(i=>`<div class="slot" style="background:#8b8b8b"><img src="${ICONURL[i]}"><b>${G.inv[i]}</b></div>`).join('');
 $('endWrong').innerHTML=G.wrongs.length?'<h3>这局的错题</h3>'+G.wrongs.map(w=>`<div class="wl">${w.q.replace(/\n/g,' ')}<br>你的答案：<span style="color:#a00">${w.your}</span>　正确答案：<b style="color:#1a6b10">${w.ans}</b></div>`).join(''):'<p style="text-align:center">全部答对，太厉害了！</p>';
 $('eWrong').classList.toggle('hide',!G.wrongs.length);$('endP').classList.remove('hide');}

// ================= HUD =================
function updHUD(){if(!G)return;$('hearts').innerHTML=Array.from({length:10},(_,i)=>`<img src="${HEART[i<G.hearts?1:0]}">`).join('');
 $('xpbar').style.width=(G.xp/(10*(G.lvl+1))*100)+'%';$('lvl').textContent=G.lvl;
 renderBar();
 const t=G.boss?`🐉 打败守关巨龙！（剩 ${G.boss.hp} 滴血）`:G.bossDone?'通关！':`${G.mode==='wrong'?'错题挑战':'任务'}：答题 ${G.answered}/${G.N} → 召唤守关巨龙`;$('tasktxt').textContent=t;$('alt').textContent='⬆ 高度 '+altOf();$('tMode').classList.toggle('on',!!G.buildMode)
 ;document.querySelector('#taskbar i').style.width=(G.boss?(G.boss.hp/3*100):Math.min(100,G.answered/G.N*100))+'%';try{renderQuestHud()}catch(_){}}
let toastTimer=0;function toast(t,ms=1500){const el=$('toast');el.textContent=t;el.classList.toggle('long',t.length>18);el.style.opacity=1;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.opacity=0,ms)}

// ================= 方块模型（生物） =================
const LM={};const lam=c=>LM[c]||(LM[c]=new THREE.MeshLambertMaterial({color:c}));
function faceTex(draw){const c=document.createElement('canvas');c.width=c.height=8;draw(c.getContext('2d'));const t=new THREE.CanvasTexture(c);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;if('colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshLambertMaterial({map:t})}
const CREEPF=faceTex(g=>{g.fillStyle='#5dbb4a';g.fillRect(0,0,8,8);g.fillStyle='#4a9a3a';for(let i=0;i<10;i++)g.fillRect((i*5)%8,(i*3)%8,1,1);g.fillStyle='#111';g.fillRect(1,2,2,2);g.fillRect(5,2,2,2);g.fillRect(3,4,2,2);g.fillRect(2,5,4,2);g.fillRect(2,7,1,1);g.fillRect(5,7,1,1)});
const ZOMF=faceTex(g=>{g.fillStyle='#4f8f3c';g.fillRect(0,0,8,8);g.fillStyle='#2e5a22';g.fillRect(0,0,8,2);g.fillStyle='#111';g.fillRect(1,3,2,1);g.fillRect(5,3,2,1);g.fillStyle='#355f2a';g.fillRect(2,6,4,1)});
const PIGF=faceTex(g=>{g.fillStyle='#f0a3ae';g.fillRect(0,0,8,8);g.fillStyle='#fff';g.fillRect(1,2,1,1);g.fillRect(6,2,1,1);g.fillStyle='#111';g.fillRect(2,2,1,1);g.fillRect(5,2,1,1);g.fillStyle='#e57d8c';g.fillRect(2,4,4,3);g.fillStyle='#9e4a55';g.fillRect(3,5,1,1);g.fillRect(4,5,1,1)});
function bx(gp,w,h,d,x,y,z,mat){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof mat==='number'?lam(mat):mat);m.position.set(x,y,z);gp.add(m);return m}
function leg(gp,w,h,x,z,y0,c){const p=new THREE.Group();p.position.set(x,y0,z);bx(p,w,h,w,0,-h/2,0,c);gp.add(p);return p}
function headMat(base,face){return [lam(base),lam(base),lam(base),lam(base),lam(base),face]}// +x -x +y -y +z(前) -z
function makeModel(e){const g=new THREE.Group();const L=[];
 if(e.type==='zombie'){L.push(leg(g,.25,.75,-.13,0,.75,0x3c3a8f),leg(g,.25,.75,.13,0,.75,0x3c3a8f));bx(g,.5,.7,.28,0,1.1,0,0x2aa3a3);const ar=[leg(g,.22,.65,-.36,0,1.4,0x4f8f3c),leg(g,.22,.65,.36,0,1.4,0x4f8f3c)];ar.forEach(a=>a.rotation.x=-Math.PI/2);bx(g,.5,.5,.5,0,1.7,0,headMat(0x4f8f3c,ZOMF))}
 else if(e.type==='creeper'){for(const [x,z] of [[-.13,-.15],[.13,-.15],[-.13,.15],[.13,.15]])L.push(leg(g,.24,.4,x,z,.4,0x4fa83c));bx(g,.45,.75,.3,0,.78,0,0x5dbb4a);bx(g,.5,.5,.5,0,1.4,0,headMat(0x5dbb4a,CREEPF))}
 else if(e.type==='pig'){for(const [x,z] of [[-.25,-.3],[.25,-.3],[-.25,.3],[.25,.3]])L.push(leg(g,.22,.35,x,z,.35,0xd97a88));bx(g,.6,.45,.95,0,.55,0,0xe8909c);bx(g,.5,.45,.4,0,.75,.6,headMat(0xf0a3ae,PIGF))}
 else if(e.type==='sheep'){for(const [x,z] of [[-.25,-.3],[.25,-.3],[-.25,.3],[.25,.3]])L.push(leg(g,.18,.45,x,z,.45,0x777777));bx(g,.75,.6,1.0,0,.72,0,0xf2f2ee);bx(g,.36,.38,.36,0,.95,.6,0xd9c8b4);bx(g,.06,.06,.02,-.1,1.0,.785,0x111111);bx(g,.06,.06,.02,.1,1.0,.785,0x111111)}
 else if(e.type==='chicken'){L.push(leg(g,.06,.3,-.08,0,.3,0xe8a12a),leg(g,.06,.3,.08,0,.3,0xe8a12a));bx(g,.35,.3,.45,0,.42,0,0xfafafa);bx(g,.25,.3,.2,0,.68,.2,0xfafafa);bx(g,.2,.08,.12,0,.66,.36,0xe8a12a);bx(g,.08,.1,.05,0,.56,.33,0xdd2222);bx(g,.04,.04,.02,-.08,.74,.305,0x111111);bx(g,.04,.04,.02,.08,.74,.305,0x111111)}
 else if(e.type==='dragon'){const k=0x1b1b1f;bx(g,1.4,1.1,4.5,0,0,0,k);bx(g,.7,.6,2.6,0,.2,-3.4,k);bx(g,.4,.4,1.6,0,.3,-5.3,k);bx(g,.6,.6,1.6,0,.5,2.8,k);bx(g,1.3,1.1,1.5,0,.9,4.1,0x2a2a30);bx(g,.9,.5,.8,0,.6,5.1,0x2a2a30);
  bx(g,.35,.18,.05,-.4,1.2,4.86,0xd65cff);bx(g,.35,.18,.05,.4,1.2,4.86,0xd65cff);for(let i=-2;i<=2;i++)bx(g,.25,.3,.25,0,.7,i*.9,0x111111);
  const wl=new THREE.Group(),wr=new THREE.Group();wl.position.set(-.7,.4,0);wr.position.set(.7,.4,0);bx(wl,4.5,.12,2.6,-2.25,0,0,0x2c2c36);bx(wr,4.5,.12,2.6,2.25,0,0,0x2c2c36);bx(wl,4.2,.14,.2,-2.1,.05,-1.2,0x111111);bx(wr,4.2,.14,.2,2.1,.05,-1.2,0x111111);g.add(wl,wr);g.userData.wings=[wl,wr];
  for(const [x,z] of [[-.6,-1.4],[.6,-1.4],[-.6,1.4],[.6,1.4]])L.push(leg(g,.3,.8,x,z,-.4,k))}
 g.userData.legs=L;return g}
const ENT=new Map();
function syncEnt(e,dt){let m=ENT.get(e);if(!m){m=makeModel(e);scene.add(m);ENT.set(e,m)}m.userData.seen=1;m.position.set(e.x,e.y,e.z);
 if(e.type==='dragon'){m.rotation.y=e.face;const w=m.userData.wings,f=Math.sin(e.t*6)*.6;w[0].rotation.z=f;w[1].rotation.z=-f;m.scale.setScalar(1)}
 else{if(Math.hypot(e.vx,e.vz)>.05)e.face=Math.atan2(e.vx,e.vz);let d=e.face-m.rotation.y;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;m.rotation.y+=d*Math.min(1,dt*10);
  const sw=Math.sin(e.anim)*(Math.hypot(e.vx,e.vz)>.1?.6:0);m.userData.legs.forEach((l,i)=>l.rotation.x=(i%2?sw:-sw)+(e.type==='zombie'&&i>1?-Math.PI/2:0));
  if(e.type==='creeper'){const fl=e.flash>0&&Math.floor(e.flash*8)%2;m.scale.setScalar(fl?1.08:1)}}}
function disposeGeo(root){root.traverse(o=>{if(o.geometry)o.geometry.dispose()})}
function syncAll(dt){for(const m of ENT.values())m.userData.seen=0;if(G&&state!=='menu'){for(const e of G.mobs)syncEnt(e,dt);for(const e of G.animals)syncEnt(e,dt);if(G.boss){G.boss.type='dragon';syncEnt(G.boss,dt);if(G.bossHint)updBossHint()}}
 for(const [e,m] of ENT)if(!m.userData.seen){scene.remove(m);disposeGeo(m);ENT.delete(e)}}

// ================= 主循环 =================
let last=performance.now(),frames=0;const bossEl=$('bossbar'),bossFill=bossEl.querySelector('i');let bossShown=null,bossHp=-1,playingShown=null;
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{if(state==='play')update(dt);if(G&&G.boss&&state!=='play')G.boss.t+=dt*.3;render(dt)}catch(err){console.error(err)}frames++;requestAnimationFrame(loop)}
function update(dt){const p=G.p;
 let fx=(keys.fwd?1:0)-(keys.back?1:0)+(-joyV.y),sx=(keys.right?1:0)-(keys.left?1:0)+joyV.x;const l=Math.hypot(fx,sx);if(l>1){fx/=l;sx/=l}
 const sp=4.3,sy=Math.sin(yaw),cy=Math.cos(yaw);p.vx=(-sy*fx+cy*sx)*sp;p.vz=(-cy*fx-sy*sx)*sp;
 if(keys.jump&&p.on){p.vy=8.6;SFX.jump()}
 const wasOn=p.on;phys(p,dt);tick7(dt,wasOn);if(state!=='play')return;
 try{tickExplore(dt)}catch(_){}
 if(touchMode&&p.blocked&&p.on&&l>.3){p.vy=8.6}// 触屏自动跳一格
 if(G.pill){G.pill.t-=dt;if(placeBelow(true))G.pill=null;else if(G.pill.t<=0)G.pill=null}
 {const a=altOf();if(a>G.maxAlt)G.maxAlt=a;if($('alt').dataset.a!=String(a)){$('alt').dataset.a=a;$('alt').textContent='⬆ 高度 '+a}
  for(const [h,msg] of [[8,'🧱 搭得真高！高度 8'],[14,'🏝 看到空中岛屿了！'],[22,'☁ 登上云端！'],[32,'🌟 直上九霄！高度 32']])if(a>=h&&!G.achv[h]){G.achv[h]=1;SFX.lvl();toast(msg,2000);addXP(2)}}
 // 怪物
 const _dayNow=Math.max(0,Math.sin(worldTime*Math.PI*2));const nightMore=_dayNow<0.22;const mobCap=nightMore?3:2;G.spawnT-=dt;if(!G.boss&&G.spawnT<=0&&G.mobs.length<mobCap){G.spawnT=(nightMore?10:16)+Math.random()*(nightMore?6:8);for(let k=0;k<10;k++){const ang=Math.random()*Math.PI*2,dist=12+Math.random()*6,x=Math.floor(p.x+Math.cos(ang)*dist),z=Math.floor(p.z+Math.sin(ang)*dist);if(x<1||z<1||x>X-2||z>Z-2)continue;const s=topAt(x,z);if(getB(x,s+1,z)!==B.AIR||getB(x,s+2,z)!==B.AIR)continue;const type=Math.random()<(nightMore?.45:.4)?'creeper':'zombie';G.mobs.push(newEnt(x+.5,s+1.01,z+.5,{type,h:type==='creeper'?1.65:1.95,cd:1,flash:0}));break}}
 for(const m of G.mobs){const dx=p.x-m.x,dz=p.z-m.z,d=Math.hypot(dx,dz);m.cd=Math.max(0,(m.cd||0)-dt);
  if(d<16&&d>.5&&m.cd<=0){const v=m.type==='creeper'?1.6:1.3;m.vx=dx/d*v;m.vz=dz/d*v}else{m.vx=m.vz=0}phys(m,dt);if(m.blocked&&m.on)m.vy=8;
  if(m.type==='creeper'&&d<2.5)m.flash=(m.flash||0)+dt;
  if(m.cd<=0&&d<.9&&Math.abs(m.y-p.y)<1.3){openQ({kind:'mob',mob:m});return}}
 G.mobs=G.mobs.filter(m=>!m.dead&&Math.hypot(m.x-p.x,m.z-p.z)<40);
 G.aniT-=dt;if(G.aniT<=0){G.aniT=6;if(G.animals.length<5)spawnAnimal()}
 for(const a of G.animals){a.cd=Math.max(0,a.cd-dt);a.wt-=dt;if(a.run>0)a.run-=dt;else if(a.wt<=0){a.wt=1.5+Math.random()*3;if(Math.random()<.4){a.vx=a.vz=0}else{const an=Math.random()*Math.PI*2;a.vx=Math.cos(an)*ANI[a.type].sp;a.vz=Math.sin(an)*ANI[a.type].sp}}
  phys(a,dt);if(a.blocked&&a.on)a.vy=7;
  if(a.cd<=0&&state==='play'&&Math.hypot(a.x-p.x,a.z-p.z)<.8&&Math.abs(a.y-p.y)<.8){a.cd=8;openQ({kind:'animal',a});return}}
 G.animals=G.animals.filter(a=>!a.dead&&Math.hypot(a.x-p.x,a.z-p.z)<45);
 if(G.boss){const b=G.boss;b.t+=dt;const tx=p.x+Math.cos(b.t*.5)*11,tz=p.z+Math.sin(b.t*.5)*11,ty=p.y+5.5+Math.sin(b.t*1.3)*.6;b.x+=(tx-b.x)*dt*.9;b.z+=(tz-b.z)*dt*.9;b.y+=(ty-b.y)*dt*.9;b.face=Math.atan2(p.x-b.x,p.z-b.z);if(b.hurt>0)b.hurt-=dt}}
function render(dt){if(!world)gen();menuT+=dt;
 if(dirty.size)flushDirty();
 let alt=0;
 if(G&&state!=='menu'){camera.position.set(G.p.x,G.p.y+EYE,G.p.z);camera.rotation.set(pitch,yaw,0);alt=altOf()}
 else{const a=menuT*.06;camera.position.set(SPX+Math.cos(a)*26,GH+16,SPZ+Math.sin(a)*26);camera.lookAt(SPX,GH+4,SPZ)}
 worldTime=(worldTime+dt*(state==='play'?0.012:0.004))%1;
 const day=Math.max(0,Math.sin(worldTime*Math.PI*2));
 const night=Math.max(0,-Math.sin(worldTime*Math.PI*2));
 // 黎明/黄昏：在昼夜交界处渐变（修复原先两峰相乘恒为 0）
 const dusk=clamp(1-Math.abs(Math.sin(worldTime*Math.PI*2))*3.2,0,1);
 const k=clamp(alt/35,0,1);
 scene.background.copy(SKY0).lerp(SKY1,k);
 _skyTmp.copy(SKY_NIGHT).lerp(SKY_DUSK,clamp(dusk*1.4,0,1));
 scene.background.lerp(_skyTmp,clamp(1-day*0.95,0,1));
 scene.fog.color.copy(scene.background);
 scene.fog.near=26+day*6;scene.fog.far=62+day*12;
 ambL.intensity=.16+day*.58+dusk*.14;sunL.intensity=.08+day*.7+dusk*.18;
 const ang=worldTime*Math.PI*2;
 sunL.position.set(Math.cos(ang)*0.85,Math.sin(ang)*0.95+0.12,0.22).normalize();
 sun.visible=day>0.04;sun.material.color.set(dusk>0.35?0xffb074:0xfff6a0);
 sun.position.set(camera.position.x+Math.cos(ang)*80,camera.position.y+Math.sin(ang)*70+10,camera.position.z-40);sun.lookAt(camera.position);
 moon.visible=night>0.05;moon.material.color.set(0xc9d7ff);
 moon.position.set(camera.position.x-Math.cos(ang)*75,camera.position.y-Math.sin(ang)*65+8,camera.position.z-35);moon.lookAt(camera.position);
 // HUD 日夜图标（轻量、不每帧改 DOM 文本除非变化）
 {const el=$('todHud');if(el){const isNight=day<0.18;const isDusk=!isNight&&dusk>0.38;const key=(isNight?'n':isDusk?'d':'y')+(worldTime<.5?'a':'b');if(el.dataset.k!==key){el.dataset.k=key;$('todIcon').textContent=isNight?'🌙':(isDusk?'🌤':'☀');$('todLab').textContent=isNight?'夜晚':(isDusk?(day>0.35?'黄昏':'黎明'):'白天')}}}
 for(const c of deco.children){c.position.x+=dt*.6;if(c.position.x>110)c.position.x=-40}
 // 目标框
 if(G&&state==='play'){const t=ray(REACH);if(t){selBox.visible=true;selBox.position.set(t.x+.5,t.y+.5,t.z+.5)}else selBox.visible=false}else selBox.visible=false;
 if(G){for(const q of G.parts){q.vy-=18*dt;q.m.position.x+=q.vx*dt;q.m.position.y+=q.vy*dt;q.m.position.z+=q.vz*dt;q.life-=dt;if(q.life<=0)scene.remove(q.m)}G.parts=G.parts.filter(q=>q.life>0)}
 syncAll(dt);
 const showBoss=!!(G&&G.boss&&state!=='end'&&state!=='menu');if(showBoss!==bossShown){bossEl.classList.toggle('hide',!showBoss);bossShown=showBoss;if(!showBoss)bossHp=-1}
 if(showBoss&&G.boss.hp!==bossHp){bossHp=G.boss.hp;bossFill.style.width=(G.boss.hp/G.boss.max*100)+'%'}
 const playing=!!G&&state==='play';if(playing!==playingShown){document.body.classList.toggle('playing',playing);playingShown=playing}render7(dt);renderer.render(scene,camera)}
requestAnimationFrame(loop);

// ================= 输入 =================
const KM={KeyW:'fwd',ArrowUp:'fwd',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump'};
addEventListener('keydown',e=>{
 if(state==='card'){if(answeredCard){if(e.key==='Enter'||e.key===' '){e.preventDefault();closeCard()}return}
  if(cur.t==='mc'&&/^[1-4]$/.test(e.key)){const b=document.querySelector(`#cbody .opt[data-i="${+e.key-1}"]`);if(b)b.click()}
  else if(cur.t==='num'){if(/^[0-9]$/.test(e.key))numKey(e.key);else if(e.key==='Backspace')numKey('⌫');else if(e.key==='Enter')numKey('✔')}return}
 if(state!=='play')return;if(KM[e.code]){keys[KM[e.code]]=true;e.preventDefault()}
 if(e.code==='KeyF'||e.code==='KeyE'||e.code==='Enter'){e.preventDefault();action()}
 if(e.code==='KeyR'){e.preventDefault();placeTarget()}
 if(e.code==='KeyQ'){e.preventDefault();buildUp()}
 if(/^Digit[1-9]$/.test(e.code)){G.sel=+e.code.slice(5)-1;updHUD()}
 if(e.code==='KeyH')goHome();if(e.code==='Escape'&&!document.pointerLockElement)pause()});
addEventListener('keyup',e=>{if(KM[e.code])keys[KM[e.code]]=false});
addEventListener('blur',resetInput);
function tryLock(){if(touchMode||!cv.requestPointerLock)return;try{const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==cv&&state==='play'&&!touchMode){for(const k in keys)keys[k]=false;pause()}updLockHint()});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement!==cv||state!=='play')return;yaw-=e.movementX*.0025;pitch=clamp(pitch-e.movementY*.0025,-1.55,1.55)});
cv.addEventListener('contextmenu',e=>e.preventDefault());
let look=null;
cv.addEventListener('pointerdown',e=>{if(state!=='play')return;ac();
 if(e.pointerType==='touch'||touchMode&&e.pointerType!=='mouse'){look={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),mv:0};try{cv.setPointerCapture(e.pointerId)}catch(_){};return}
 if(document.pointerLockElement!==cv){if(touchMode){look={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),mv:0};return}tryLock();return}
 if(e.button===2){e.preventDefault();placeTarget()}else if(e.button===0)action()});
cv.addEventListener('pointermove',e=>{if(!look||e.pointerId!==look.id)return;const dx=e.clientX-look.x,dy=e.clientY-look.y;look.x=e.clientX;look.y=e.clientY;look.mv+=Math.abs(dx)+Math.abs(dy);yaw-=dx*.006;pitch=clamp(pitch-dy*.006,-1.55,1.55)});
const endLook=e=>{if(!look||e.pointerId!==look.id)return;if(look.mv<8&&performance.now()-look.t<250&&state==='play')action();look=null};
cv.addEventListener('pointerup',endLook);cv.addEventListener('pointercancel',e=>{look=null});
addEventListener('wheel',e=>{if(!G||state!=='play')return;G.sel=(G.sel+(e.deltaY>0?1:-1)+9)%9;updHUD()},{passive:true});
// 虚拟摇杆
{const joy=$('joy'),knob=$('knob');let jid=null;const R0=55;
 const setJ=e=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const l=Math.hypot(dx,dy);if(l>R0){dx*=R0/l;dy*=R0/l}knob.style.transform=`translate(${dx}px,${dy}px)`;joyV.x=dx/R0;joyV.y=dy/R0};
 joy.addEventListener('pointerdown',e=>{e.preventDefault();ac();jid=e.pointerId;try{joy.setPointerCapture(e.pointerId)}catch(_){};setJ(e)});
 joy.addEventListener('pointermove',e=>{if(e.pointerId===jid)setJ(e)});
 const off=e=>{if(e.pointerId!==jid)return;jid=null;joyV.x=joyV.y=0;knob.style.transform=''};joy.addEventListener('pointerup',off);joy.addEventListener('pointercancel',off)}
function hold(id,k){const el=$(id);const on=e=>{e.preventDefault();ac();keys[k]=true;el.classList.add('down')},off=e=>{e.preventDefault();keys[k]=false;el.classList.remove('down')};el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointerleave',off);el.addEventListener('pointercancel',off)}
hold('tJump','jump');
$('tMine').addEventListener('pointerdown',e=>{e.preventDefault();action()});
$('tBuild').addEventListener('pointerdown',e=>{e.preventDefault();placeTarget()});
$('tUp').addEventListener('pointerdown',e=>{e.preventDefault();buildUp()});
$('hotbar').addEventListener('pointerdown',e=>{const s=e.target.closest('.slot');if(!s||!G||state!=='play')return;e.preventDefault();G.sel=+s.dataset.k;SFX.click();updHUD()});
$('tHome').addEventListener('pointerdown',e=>{e.preventDefault();goHome()});
$('lockHint').addEventListener('pointerdown',e=>{e.preventDefault();ac();tryLock()});
function goHome(){if(state!=='play')return;Object.assign(G.p,spawnPos());yaw=Math.PI*.75;pitch=-.12;G.pill=null;toast('回到出生点',800)}
function pause(){if(state!=='play')return;resetInput();state='pause';$('pauseP').classList.remove('hide');updLockHint()}

// ================= v7：声音修复 + 工具/合成 + 搭建提示 + 教程 =================
muted=false;let musicOn=true;
const SND={ctx:0,tone:0,noise:0,unlock:0,calls:{}};
let MG=null,MUS=null,NBUF=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();SND.ctx++;MG=AC.createGain();MG.gain.value=1;MG.connect(AC.destination);MUS=AC.createGain();MUS.gain.value=.6;MUS.connect(MG)}catch(e){}}
 if(AC&&AC.state!=='running'){try{const r=AC.resume();if(r&&r.catch)r.catch(()=>{})}catch(e){}}return AC}
const SILENT_WAV=(()=>{const n=400,b=new Uint8Array(44+n),v=new DataView(b.buffer);const w=(o,s)=>{for(let i=0;i<s.length;i++)b[o+i]=s.charCodeAt(i)};w(0,'RIFF');v.setUint32(4,36+n,true);w(8,'WAVEfmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,8000,true);v.setUint32(28,8000,true);v.setUint16(32,1,true);v.setUint16(34,8,true);w(36,'data');v.setUint32(40,n,true);b.fill(128,44);let s='';for(const c of b)s+=String.fromCharCode(c);return 'data:audio/wav;base64,'+btoa(s)})();
let silentEl=null;
function unlockAudio(){if(AC&&AC.state==='running'&&SND.unlock>2&&silentEl){if(musicOn&&!muted)startMusic();return}const a=ac();if(!a)return;SND.unlock++;
 try{const b=a.createBuffer(1,1,22050),s=a.createBufferSource();s.buffer=b;s.connect(a.destination);s.start(0)}catch(e){}
 try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback'}catch(e){}
 if(!silentEl){try{silentEl=new Audio(SILENT_WAV);silentEl.loop=true;silentEl.setAttribute('playsinline','');silentEl.volume=0.01;const p=silentEl.play();if(p&&p.catch)p.catch(()=>{silentEl=null})}catch(e){silentEl=null}}
 if(musicOn&&!muted)startMusic()}
['pointerdown','pointerup','touchstart','touchend','mousedown','keydown','click'].forEach(t=>addEventListener(t,unlockAudio,{capture:true,passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden){resetInput();stopMusic()}else if(AC){ac();if(musicOn&&!muted)startMusic()}});
function tone(f,d,type='square',vol=.12,f2,delay=0,dest){const a=ac();if(!a||muted)return;SND.tone++;const t=a.currentTime+delay;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+d);o.connect(g).connect(dest||MG);o.start(t);o.stop(t+d+.03)}
function noise(d,vol=.25,freq=1200,delay=0,ft='lowpass'){const a=ac();if(!a||muted)return;SND.noise++;if(!NBUF){const n=a.sampleRate*1.5|0;NBUF=a.createBuffer(1,n,a.sampleRate);const ch=NBUF.getChannelData(0);for(let i=0;i<n;i++)ch[i]=Math.random()*2-1}
 const t=a.currentTime+delay,s=a.createBufferSource();s.buffer=NBUF;const f=a.createBiquadFilter();f.type=ft;f.frequency.value=freq;const g=a.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0005,t+d);s.connect(f).connect(g).connect(MG);s.start(t,Math.random()*.3,d+.05)}
SFXA.pig=()=>{tone(240,.14,'square',.06,190);tone(280,.12,'square',.05,210,.15)};
SFXA.sheep=()=>{tone(500,.4,'triangle',.07,460);tone(505,.4,'sawtooth',.02,465)};
SFXA.chicken=()=>{tone(1200,.06,'square',.04,900);tone(1350,.06,'square',.04,1000,.09);tone(1250,.05,'square',.03,950,.18)};
Object.assign(SFX,{
 hit:()=>{noise(.06,.22,1800);tone(170,.05,'square',.035,120)},
 brk:()=>{noise(.24,.38,1000);tone(150,.14,'triangle',.08,70)},
 dig:()=>noise(.09,.22,700),
 place:()=>{noise(.07,.3,520);tone(115,.08,'sine',.13,80)},
 step:()=>noise(.05,.06,650),
 land:()=>noise(.1,.16,420),
 jump:()=>tone(300,.09,'sine',.06,460),
 groan:()=>{tone(110,.7,'sawtooth',.05,82);tone(117,.6,'sawtooth',.035,85,.06)},
 hiss:()=>noise(1.1,.16,4200,0,'highpass'),
 chest:()=>{tone(200,.09,'square',.05,250);noise(.15,.15,900);[784,988,1318].forEach((f,i)=>tone(f,.16,'triangle',.07,null,.12+i*.08))},
 craft:()=>{noise(.08,.2,800);noise(.08,.2,800,.12);[660,880,1100].forEach((f,i)=>tone(f,.1,'square',.06,null,.22+i*.07))},
 equip:()=>tone(1200,.05,'triangle',.06,1600),
 need:()=>{tone(300,.12,'square',.07);tone(220,.18,'square',.07,null,.13)},
 boss:()=>{tone(90,1.4,'sawtooth',.12,45);noise(1,.15,300);[392,370,349,330].forEach((f,i)=>tone(f,.3,'square',.05,null,.35+i*.25))},
 wing:()=>noise(.28,.07,260),
 pig:()=>SFXA.pig(),sheep:()=>SFXA.sheep(),chicken:()=>SFXA.chicken(),
});
for(const k of Object.keys(SFX)){const f=SFX[k];SFX[k]=(...a)=>{SND.calls[k]=(SND.calls[k]||0)+1;return f(...a)}}
for(const k of Object.keys(SFXA)){const f=SFXA[k];SFXA[k]=(...a)=>{SND.calls[k]=(SND.calls[k]||0)+1;return f(...a)}}
// 背景音乐（程序生成，轻柔）
let musT=null,musNext=0,musStep=0;
const CH=[[261.6,329.6,392],[220,261.6,329.6],[174.6,220,261.6],[196,246.9,293.7]];
function startMusic(){if(musT||!musicOn||muted||!AC)return;musNext=AC.currentTime+.2;musT=setInterval(musTick,200)}
function stopMusic(){if(musT)clearInterval(musT);musT=null}
function musTick(){const a=AC;if(!a||a.state!=='running'||muted||!musicOn)return;while(musNext<a.currentTime+.8){const i=musStep++,c=CH[(i>>3)%4],dl=Math.max(0,musNext-a.currentTime);
 if(i%8===0)c.forEach(f=>tone(f/2,3.6,'sine',.03,null,dl,MUS));
 if(i%2===0||Math.random()<.35){const f=c[(Math.random()*3)|0]*(Math.random()<.5?2:1);tone(f,.6,'triangle',.022,null,dl,MUS)}
 SND.calls.music=(SND.calls.music||0)+1;musNext+=.42}}
function setMute(m){muted=m;LS.set('muted7',m);$('muteBtn').textContent=m?'🔇':'🔊';$('mMute').textContent=m?'🔇 声音：关':'🔊 声音：开';if(m)stopMusic();else if(AC){ac();startMusic()}}
function setMusic(on){musicOn=on;LS.set('music7',on);$('musBtn').classList.toggle('off',!on);$('mMusic').textContent=on?'🎵 音乐：开':'🎵 音乐：关';if(on){if(AC)ac();startMusic()}else stopMusic()}
$('musBtn').onclick=()=>{setMusic(!musicOn);SFX.click()};$('mMusic').onclick=()=>{setMusic(!musicOn);SFX.click()};setMusic(musicOn);

// ================= 工具 =================
const PICKS=['','木镐','石镐','铁镐','钻石镐'],SWORDS=['','木剑','石剑','铁剑','钻石剑'];
const TCOL={1:[176,128,64],2:[140,140,140],3:[232,232,232],4:[80,225,214]};
function toolCanvas(k,t){return mk(g=>{const c=TCOL[t],C=rgb(c),D=rgb(c,.62),L=rgb(c,1.3),Hc='#5c3d17',HL='#8a6232';const px=(x,y,col)=>{g.fillStyle=col;g.fillRect(x,y,1,1)};
 if(k==='sword'){for(let i=0;i<9;i++){px(6+i,9-i,L);px(6+i,10-i,C);px(7+i,9-i,C);px(5+i,10-i,D);px(7+i,10-i,D)}
  [[3,8],[4,9],[5,10],[6,11],[7,12]].forEach(([x,y])=>px(x,y,'#3a3a3a'));px(4,8,'#555');px(7,11,'#555');
  for(let i=0;i<3;i++){px(2+i,13-i,Hc);px(3+i,13-i,HL)}px(1,14,'#3a3a3a');px(2,14,'#3a3a3a');px(1,13,'#3a3a3a');return}
 for(let i=0;i<10;i++){px(2+i,13-i,Hc);px(3+i,13-i,HL)}
 if(k==='pick'){const arc=[[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,2],[10,2],[11,3],[12,4],[13,5],[13,6],[14,7],[14,8],[14,9],[14,10],[13,11]];arc.forEach(([x,y],j)=>{px(x,y,j%3?C:L);px(x,y+1,D)});arc.slice(2,-2).forEach(([x,y])=>px(x-1,y+1,C));return}
 const rows={2:[10,12],3:[9,13],4:[9,14],5:[10,14],6:[11,13],7:[12,12]};for(const y in rows){const [a,b]=rows[y];for(let x=a;x<=b;x++)px(x,+y,x===b?D:(y==2?L:C))}},1)}
for(let t=1;t<=4;t++){ICON[PICKS[t]]=toolCanvas('pick',t);ICON[SWORDS[t]]=toolCanvas('sword',t)}ICON['斧子']=toolCanvas('axe',2);
for(const k in ICON)if(!ICONURL[k])ICONURL[k]=ICON[k].toDataURL();
const RECIPES=[
 {n:'木镐',k:'pick',t:1,cost:{'木头':3}},{n:'石镐',k:'pick',t:2,cost:{'石头':3,'木头':1}},{n:'铁镐',k:'pick',t:3,cost:{'铁':3,'木头':1}},{n:'钻石镐',k:'pick',t:4,cost:{'钻石':3,'木头':1}},
 {n:'木剑',k:'sword',t:1,cost:{'木头':3}},{n:'石剑',k:'sword',t:2,cost:{'石头':2,'木头':1}},{n:'铁剑',k:'sword',t:3,cost:{'铁':2,'木头':1}},{n:'钻石剑',k:'sword',t:4,cost:{'钻石':2,'木头':1}},
 {n:'斧子',k:'axe',t:1,cost:{'石头':2,'木头':2}}];
const BAR=['@pick','@sword','@axe','泥土','木头','石头','羊毛','树叶','@craft'];
function barItem(k){const s=BAR[k];if(!G||!G.tools)return null;if(s==='@pick')return PICKS[G.tools.pick]||null;if(s==='@sword')return SWORDS[G.tools.sword]||null;if(s==='@axe')return G.tools.axe?'斧子':null;if(s==='@craft')return null;return s}
function held(){return G?barItem(G.sel):null}
const isBlk=n=>!!n&&!!PLACE[n];
function selItem(){const h=held();if(isBlk(h)&&G.inv[h]>0)return h;for(let k=3;k<8;k++){const n=BAR[k];if(G.inv[n]>0){G.sel=k;renderBar();return n}}return null}
function renderBar(){if(!G)return;if(G.sel===8)G.sel=G._ps===7?0:7;G._ps=G.sel;
 $('hotbar').innerHTML=BAR.map((s,k)=>{const n=barItem(k);if(s==='@craft')return `<div class="slot craft" data-k="8"><span class="nm">合成</span><span class="cf">🛠</span></div>`;
  return `<div class="slot${k===G.sel?' on':''}${n?'':' empty'}" data-k="${k}">${n?`<span class="nm">${n}</span><img src="${ICONURL[n]}">${isBlk(n)?`<b>${G.inv[n]||0}</b>`:''}`:''}</div>`}).join('');updHint()}
function updHint(){const el=$('hint7');if(!el||!G)return;const h=held(),T=touchMode;let s;
 const anyBlk=BAR.slice(3,8).some(n=>G.inv[n]>0);
 if(isBlk(h)&&G.inv[h]>0)s=`手持 ${h}×${G.inv[h]} · `+(T?'点🧱放 · 点⬆垫高':'右键放方块 · Q 往上垫');
 else if(isBlk(h)||(!h&&!anyBlk))s=anyBlk?`${h||'这格'}用完了 · 选别的方块`:'先去挖一些方块吧（草和泥土随便挖）';
 else if(PICKS.includes(h))s=`手持 ${h} · `+(T?'点⛏挖 · 点🛠合成':'左键挖 · E 合成更好的工具')+(anyBlk?'':' · 先去挖一些方块吧');
 else if(SWORDS.includes(h))s=`手持 ${h} · 打怪物只要答对 1 题`+(T?'':' · 左键攻击');
 else if(h==='斧子')s='手持 斧子 · 砍树（木头）更快';
 else s=T?'点⛏挖 · 点🛠合成':'左键挖 · 右键放 · E 合成';
 if(el.textContent!==s)el.textContent=s}
function needTier(b){return b===B.STONE||b===B.COAL?1:b===B.IRON?2:b===B.GOLD||b===B.DIAMOND?3:0}
function mineTime(b,pl){if(pl)return .25;if(b===B.LOG)return G.tools.axe?.25:.9;if(b===B.CHEST)return .3;const inf=INFO[b];if(inf.free)return b===B.LEAVES?.15:.3;return Math.max(.2,1.15-.25*(G.tools.pick||0))}
function swing(){G.swing=1}
function action(){if(state!=='play')return;ac();swing();if(G.boss){SFX.hit();openQ({kind:'boss'});return}
 const pe=pickEnt(4.5);if(pe){SFX.hit();if(pe.kind==='mob')openQ({kind:'mob',mob:pe.e});else openQ({kind:'animal',a:pe.e});return}
 const t=targetBlock();if(t){startMine(t[0],t[1],t[2]);return}
 const m=nearMob();if(m){openQ({kind:'mob',mob:m});return}const an=nearAnimal();if(an){openQ({kind:'animal',a:an});return}
 toast('准星对准方块再挖哦（走近一点）',1000)}
function startMine(x,y,z){const b=getB(x,y,z),inf=INFO[b];lastHit={x:x+.5,y:y+.5,z:z+.5};if(!inf||inf.unb){SFX.need();toast((inf?inf.n:'基岩')+'挖不动！',900);return}
 const pl=isPl(x,y,z),nt=needTier(b);if(!pl&&(G.tools.pick||0)<nt){SFX.need();toast(`需要 ${PICKS[nt]} 才能挖${inf.n}！按 ${touchMode?'🛠':'E'} 合成`,2200);return}
 if(G.mine&&G.mine.x===x&&G.mine.y===y&&G.mine.z===z)return;
 if(G.tools.pick&&!pl&&!inf.free&&b!==B.LOG&&!PICKS.includes(held())){G.sel=0;renderBar()}
 if(b===B.LOG&&G.tools.axe&&!pl&&held()!=='斧子'){G.sel=2;renderBar()}
 G.mine={x,y,z,b,t:0,T:mineTime(b,pl),nh:0};SFX.hit()}
function breakBlock(x,y,z,reward){const b=getB(x,y,z);setB(x,y,z,B.AIR);burst(x+.5,y+.5,TEX[b],14,null,z+.5);
 const inf=INFO[b];if(inf.item){G.inv[inf.item]=(G.inv[inf.item]||0)+1}
 if(b===B.CHEST)SFX.chest();
 if(reward){SFX.brk();G.mined++;addXP(inf.xp||1);floatText(b===B.CHEST?`🎁 宝箱打开！+1 ${inf.item} +${inf.xp}XP`:`+1 ${inf.item}`,0,0,b===B.CHEST?'#ffe066':'#fff')}else SFX.brk();
 updHUD()}
function doPlace(x,y,z,it){setB(x,y,z,PLACE[it],1);G.inv[it]--;G.built++;SFX.place();swing();burst(x+.5,y+.5,TEX[PLACE[it]],6,null,z+.5);updHUD();return true}
function hideAll(){['loginP','menu','setup','wrongP','scoreP','card','pauseP','deathP','endP','craftP','tutP'].forEach(id=>$(id).classList.add('hide'))}
// 合成面板
function canCraft(r){return Object.entries(r.cost).every(([k,v])=>(G.inv[k]||0)>=v)}
function owned(r){return (G.tools[r.k]||0)>=r.t}
function openCraft(){if(!G||state!=='play')return;state='craft';G.mine=null;resetInput();if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){};drawCraft();$('craftP').classList.remove('hide');SFX.click()}
function drawCraft(){const inv=['木头','石头','煤炭','铁','金','钻石','泥土','羊毛','树叶'].map(n=>`<span class="iv"><img src="${ICONURL[n]}">${n} <b>${G.inv[n]||0}</b></span>`).join('');
 $('craftInv').innerHTML=inv;
 $('craftList').innerHTML=RECIPES.map((r,i)=>{const own=owned(r),ok=canCraft(r);const cost=Object.entries(r.cost).map(([k,v])=>`<span class="cst${(G.inv[k]||0)>=v?'':' lack'}"><img src="${ICONURL[k]}">${k}×${v}</span>`).join(' + ');
  const eff=r.k==='pick'?['','能挖石头和煤','能挖铁矿','能挖金矿和钻石','挖得最快！'][r.t]:r.k==='sword'?'打怪只要答对 1 题，绿芽怪少扣血':'砍树更快';
  return `<div class="rc${own?' own':''}"><img class="ti" src="${ICONURL[r.n]}"><div class="rt"><div>${r.n} <small>${eff}</small></div><div class="cs">${cost}</div></div><button class="btn sm${ok&&!own?' green':''}" data-r="${i}" ${own?'disabled':''}>${own?'✔ 已拥有':'合成'}</button></div>`}).join('');
 document.querySelectorAll('#craftList button[data-r]').forEach(b=>b.onclick=()=>craft(+b.dataset.r))}
function craft(i){const r=RECIPES[i];if(owned(r)){toast('已经有了',800);return false}if(!canCraft(r)){SFX.need();const miss=Object.entries(r.cost).filter(([k,v])=>(G.inv[k]||0)<v).map(([k,v])=>`${k}还差${v-(G.inv[k]||0)}`).join('，');toast(`材料不够：${miss}`,1800);return false}
 for(const [k,v] of Object.entries(r.cost))G.inv[k]-=v;G.tools[r.k]=r.t;G.sel=r.k==='pick'?0:r.k==='sword'?1:2;SFX.craft();toast(`🛠 合成了 ${r.n}！`,1400);addXP(2);drawCraft();updHUD();return true}
function closeCraft(){if(state!=='craft')return;$('craftP').classList.add('hide');state='play';SFX.click();tryLock();updLockHint()}
$('craftClose').onclick=closeCraft;
// 教程
const TUT=[
 {e:'🚶',t:'1. 走路，看四周',d:'电脑：WASD 走路，空格跳，移动鼠标看四周（先点一下画面）。',m:'手机：左下摇杆走路，右边屏幕拖动看四周，⤒ 跳。'},
 {e:'⛏',t:'2. 挖方块，答题',d:'准星对准方块，按鼠标左键挖。挖矿石会出题，答对就能拿到！草和泥土随便挖。',m:'准星对准方块，点 ⛏挖。挖矿石会出题，答对就能拿到！'},
 {e:'🧱',t:'3. 放方块，往上搭',d:'按 1-9 或滚轮选一个方块，看到半透明的“影子”就是放的位置，按鼠标右键放。按 Q 往脚下垫一块，一直按就能搭到天上！',m:'点下面物品栏选方块，看到半透明“影子”，点 🧱放。点 ⬆垫高 往上搭！'},
 {e:'🛠',t:'4. 合成工具',d:'按 E 打开合成：石镐 = 3石头+1木头。好镐子挖得快，铁矿要石镐，金矿钻石要铁镐。有剑打怪更容易！',m:'点 🛠 打开合成：石镐 = 3石头+1木头。好镐子挖得快，有剑打怪更容易！'},
 {e:'🗺',t:'5. 探险小任务',d:'左上角有任务清单：去河边答题、过桥、上山、探矿洞、拜访木屋。远处黄色箭头会指路，答过题后再探索还能领小奖励。',m:'左上角任务清单 + 远处箭头指路。去河边/过桥/上山/探洞/拜访木屋，答过题后再探索有小奖励。'},
 {e:'🌤',t:'6. 昼夜与风景',d:'世界会慢慢从白天到夜晚。顺着路标去河边、木桥、山峰和矿洞看看风景，别忘了带镐子挖矿石练题！',m:'白天夜晚会切换。跟着路标去河边、木桥、上山、矿洞逛逛，挖矿石就能练题。'},
 {e:'🎒',t:'7. 登录与切换角色',d:'开头可以新建或选择角色，每位小朋友的成绩和错题单独保存。主菜单点「切换」就能换人玩。推荐用桌面上的 HTML 文件打开本游戏。',m:'可新建/选择角色，成绩错题分开存。主菜单「切换」换人。推荐打开桌面上的 HTML 文件。'}];
let tutI=0,tutPrev=null;
function showTut(){tutI=0;tutPrev=state;if(state==='play'){state='tut';resetInput();if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){}}drawTut();$('toast').style.opacity=0;$('tutP').classList.remove('hide')}
function drawTut(){const s=TUT[tutI];$('tutE').textContent=s.e;$('tutT').textContent=s.t;$('tutD').textContent=touchMode?s.m:s.d;$('tutN').textContent=`${tutI+1}/${TUT.length}`;$('tutPrev').classList.toggle('hide',tutI===0);$('tutNext').textContent=tutI===TUT.length-1?'开始玩！':'下一步 ▶'}
function closeTut(){LS.set('tut7',true);$('tutP').classList.add('hide');if(state==='tut'){state='play';tryLock();updLockHint()}}
$('tutNext').onclick=()=>{SFX.click();if(tutI<TUT.length-1){tutI++;drawTut()}else closeTut()};$('tutPrev').onclick=()=>{SFX.click();if(tutI>0){tutI--;drawTut()}};$('tutSkip').onclick=()=>{SFX.click();closeTut()};
$('mTut').onclick=()=>{SFX.click();showTut()};$('pTut').onclick=()=>{SFX.click();showTut()};
// 按键 / 按钮
addEventListener('keydown',e=>{
 if(state==='craft'){if(e.code==='KeyE'||e.code==='Escape'||e.code==='Digit9'){e.preventDefault();closeCraft()}e.stopImmediatePropagation();return}
 if(state==='tut'){if(e.code==='Escape'||e.code==='Enter'){e.preventDefault();closeTut()}e.stopImmediatePropagation();return}
 if(state!=='play')return;
 if(e.code==='KeyE'||e.code==='Digit9'){e.preventDefault();e.stopImmediatePropagation();openCraft();return}
 if(/^Digit[1-8]$/.test(e.code)){G.sel=+e.code.slice(5)-1;SFX.equip();renderBar();e.stopImmediatePropagation()}},true);
$('bottom').addEventListener('pointerdown',e=>{const s=e.target.closest&&e.target.closest('.slot');if(!s||!G||state!=='play')return;if(s.dataset.k==='8'){e.preventDefault();e.stopPropagation();openCraft()}else SFX.equip()},true);
$('craftBtn').onclick=e=>{ac();if(state==='craft'){closeCraft();return}if(state==='pause'){$('pauseP').classList.add('hide');state='play'}openCraft()};$('pCraft').onclick=()=>{ac();$('pauseP').classList.add('hide');state='play';openCraft()};$('tCraft').addEventListener('pointerdown',e=>{e.preventDefault();ac();openCraft()});
// 手持物品 + 影子方块
scene.add(camera);const hand=new THREE.Group();camera.add(hand);const HP={x:.46,y:-.42,z:-.75};hand.position.set(HP.x,HP.y,HP.z);
const HMC={};function hmat(key,canvas,opts){if(HMC[key])return HMC[key];const t=new THREE.CanvasTexture(canvas);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;if('colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;return HMC[key]=new THREE.MeshBasicMaterial(Object.assign({map:t,depthTest:false,depthWrite:false,fog:false,transparent:false,alphaTest:.5},opts||{}))}
const armMat=new THREE.MeshBasicMaterial({color:0xd9a27a,depthTest:false,depthWrite:false,fog:false});
let handKey='#';
function setHand(){const h=held()||'';if(h===handKey)return;handKey=h;while(hand.children.length){const c=hand.children[0];disposeGeo(c);hand.remove(c)}
 const arm=new THREE.Mesh(new THREE.BoxGeometry(.13,.13,.45),armMat);arm.position.set(.1,-.1,.18);arm.rotation.set(.2,.15,0);arm.renderOrder=998;hand.add(arm);
 if(!h)return;
 if(isBlk(h)){const m=new THREE.Mesh(new THREE.BoxGeometry(.24,.24,.24),hmat('b'+h,TEX[PLACE[h]],{alphaTest:0}));m.position.set(0,.05,-.05);m.rotation.set(.15,.7,0);m.renderOrder=999;hand.add(m);return}
 const g=new THREE.Group();const mat=hmat('t'+h,ICON[h],{side:THREE.DoubleSide});for(let i=0;i<4;i++){const p=new THREE.Mesh(new THREE.PlaneGeometry(.4,.4),mat);p.position.z=i*.012-.018;p.renderOrder=999;g.add(p)}
 g.position.set(.0,.12,-.1);g.rotation.set(-.15,-1.25,.15);hand.add(g)}
const ghostMat=new THREE.MeshBasicMaterial({transparent:true,opacity:.45,depthWrite:false});const ghost=new THREE.Mesh(new THREE.BoxGeometry(1.003,1.003,1.003),ghostMat);
ghost.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.01,1.01,1.01)),new THREE.LineBasicMaterial({color:0xffffff})));ghost.visible=false;scene.add(ghost);
const GTX={};function ghostTex(h){if(!GTX[h]){const t=new THREE.CanvasTexture(TEX[PLACE[h]]);t.magFilter=t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;if('colorSpace' in t)t.colorSpace=THREE.SRGBColorSpace;GTX[h]=t}return GTX[h]}
let ghostAt=null;
function render7(dt){const play=!!G&&state!=='menu';hand.visible=play;
 if(!play){ghost.visible=false;$('mineBar').classList.add('hide');return}
 setHand();
 const s=G.swing||0;G.swing=Math.max(0,s-dt*4);const sp=Math.hypot(G.p.vx,G.p.vz);G.bob=(G.bob||0)+dt*sp*2.2;
 const sw=Math.sin(Math.PI*(1-G.swing));const by=G.p.on&&sp>.5?Math.abs(Math.sin(G.bob))*.03:0;
 hand.position.set(HP.x-sw*.12,HP.y+by+sw*.05,HP.z-sw*.12);hand.rotation.set(-sw*1.0,sw*.25,0);
 // 影子方块
 ghostAt=null;const h=held();
 if(state==='play'&&isBlk(h)&&G.inv[h]>0&&!G.mine){const r=ray(REACH);if(r&&cellFree(r.px,r.py,r.pz)){ghostAt=[r.px,r.py,r.pz];if(ghostMat.map!==ghostTex(h)){ghostMat.map=ghostTex(h);ghostMat.needsUpdate=true}ghost.position.set(r.px+.5,r.py+.5,r.pz+.5);ghost.material.opacity=.35+.15*Math.sin(performance.now()/180)}}
 ghost.visible=!!ghostAt;
 const mb=$('mineBar');if(G.mine&&state==='play'){mb.classList.remove('hide');mb.querySelector('i').style.width=Math.min(100,G.mine.t/G.mine.T*100)+'%'}else mb.classList.add('hide')}
// 每帧逻辑（在 update 中调用）
function tick7(dt,wasOn){const p=G.p;
 if(G.mine){const m=G.mine,r=ray(REACH);if(!r||r.x!==m.x||r.y!==m.y||r.z!==m.z||getB(m.x,m.y,m.z)!==m.b){G.mine=null}else{m.t+=dt;const k=Math.floor(m.t/.22);if(k>m.nh){m.nh=k;swing();SFX.hit();burst(m.x+.5,m.y+.5,TEX[m.b],3,null,m.z+.5)}if(m.t>=m.T){G.mine=null;swing();interact(m.x,m.y,m.z);return}}}
 const sp=Math.hypot(p.vx,p.vz);if(p.on&&sp>1){G.stepA=(G.stepA||0)+dt*sp;if(G.stepA>2.1){G.stepA=0;SFX.step()}}
 if(!wasOn&&p.on&&(G._vy||0)<-7)SFX.land();G._vy=p.vy;
 G.ambT=(G.ambT==null?3:G.ambT)-dt;if(G.ambT<=0){G.ambT=4+Math.random()*5;const near=(arr,r)=>arr.filter(e=>Math.hypot(e.x-p.x,e.z-p.z)<r);
  const zs=near(G.mobs.filter(m=>m.type==='zombie'),14),as=near(G.animals,10);if(zs.length&&Math.random()<.7)SFX.groan();else if(as.length)SFXA[as[Math.random()*as.length|0].type]()}
 for(const m of G.mobs)if(m.type==='creeper'&&m.flash>0&&!m.hissed){m.hissed=1;SFX.hiss()}
 if(G.boss){G.wingT=(G.wingT||0)-dt;if(G.wingT<=0){G.wingT=.9;SFX.wing()}
  if(G.bossLook>0){G.bossLook-=dt;const b=G.boss,dx=b.x-p.x,dy=b.y-(p.y+EYE),dz=b.z-p.z;const ty=Math.atan2(-dx,-dz),tp=clamp(Math.atan2(dy,Math.hypot(dx,dz)),-1.2,1.2);let d=ty-yaw;d=Math.atan2(Math.sin(d),Math.cos(d));const k=Math.min(1,dt*4);yaw+=d*k;pitch+=(tp-pitch)*k}}
 G.hintT=(G.hintT||0)-dt;if(G.hintT<=0){G.hintT=.3;updHint()}}

// ===== v8：全点击答题 + 平板适配 =====
let touchPref='auto';
function isTouchDev(){return matchMedia('(pointer:coarse)').matches||('ontouchstart' in window)||(navigator.maxTouchPoints||0)>0||(/Macintosh/.test(navigator.userAgent)&&(navigator.maxTouchPoints||0)>1)}
function calcTouch(){return touchPref==='on'?true:touchPref==='off'?false:(isTouchDev()||innerWidth<900)}
const TPN={auto:'自动',on:'开',off:'关'};
function updTouchBtns(){document.querySelectorAll('.touchSet').forEach(b=>b.textContent='📱 触屏模式：'+TPN[touchPref])}
function cycleTouch(){touchPref=touchPref==='auto'?'on':touchPref==='on'?'off':'auto';LS.set('touch8',touchPref);SFX.click();if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){};resize();updTouchBtns();if(G)updHint();toast('触屏模式：'+TPN[touchPref]+(touchPref==='on'?'（鼠标也能点按钮玩）':''),1600)}
document.querySelectorAll('.touchSet').forEach(b=>b.onclick=cycleTouch);updTouchBtns();
function tabletCls(){const big=Math.min(innerWidth,innerHeight)>=600;document.body.classList.toggle('tablet',big&&touchMode);document.body.classList.toggle('portrait',innerHeight>innerWidth)}
addEventListener('orientationchange',()=>setTimeout(()=>{resize();tabletCls()},250));
addEventListener('resize',()=>tabletCls());
// 禁止缩放/双击放大/选择
['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
document.addEventListener('touchmove',e=>{if(e.touches.length>1||state==='play'||state==='card'&&!e.target.closest('.panel'))e.preventDefault()},{passive:false});
let lastTE=0;document.addEventListener('touchend',e=>{const n=Date.now();if(n-lastTE<350&&!e.target.closest('button,.btn,.slot,.tb,select'))e.preventDefault();lastTE=n},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
document.addEventListener('contextmenu',e=>{if(state!=='menu')e.preventDefault()});
// 下拉框 → 大按钮
document.querySelectorAll('select').forEach(s=>{const w=document.createElement('span');w.className='seg';[...s.options].forEach(o=>{const b=document.createElement('button');b.className='btn sm segb';b.type='button';b.textContent=o.textContent;b.dataset.v=o.value;b.onclick=()=>{s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}));sync()};w.appendChild(b)});
 const sync=()=>w.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===s.value));s.addEventListener('change',sync);sync();s.style.display='none';s.after(w)});
// 题目体检：保证每道题都能点着答
const CHUNK=q=>{const a=String(q.ans).replace(/[。！？]$/,''),ds=(q.opts||[]).filter(o=>o!==q.ans).map(o=>o.replace(/[。！？]$/,''));const t=[];let w=a[0];
 for(let i=1;i<a.length;i++){const pr=a[i-1]+a[i];if(ds.length&&ds.every(d=>d.includes(pr)))w+=a[i];else{t.push(w);w=a[i]}}t.push(w);return t};
function fixQ(q){if(!q)return q;
 if(q.t==='mc'&&/连词成句/.test(q.q)&&!q.tiles){const t=CHUNK(q);if(t.length>=3&&t.length<=8)q.tiles=t}
 if(q.t==='num'&&!/^\d{1,4}$/.test(String(q.ans))){q.t='mc';const a=String(q.ans),n=Number(a);q.opts=shuffle([a,...(isNaN(n)?['?']:[n+1,n-1,n+10].map(String))].slice(0,4))}
 if(q.t!=='mc'&&q.t!=='num'&&q.t!=='dig'){q.t='mc';q.opts=shuffle([String(q.ans),...(q.opts||[]).map(String).filter(o=>o!==String(q.ans))].slice(0,4))}
 return q}
function tilesOpen(q){const sp=q.tiles.slice();let ord=shuffle(sp.map((_,i)=>i));if(ord.every((v,i)=>v===i))ord.reverse();const picked=[];
 $('cbody').innerHTML='<div id="tline"></div><div id="tpool"></div><div id="tctl"><button class="btn" id="tUndo">↶ 撤销</button><button class="btn" id="tClr">清空</button><button class="btn green" id="tOk">✔ 确定</button></div>';
 const addTile=i=>{if(answeredCard||picked.includes(i))return;SFX.click();picked.push(i);draw()};
 const bindDrag=()=>{
  const line=$('tline');
  line.ondragover=e=>{e.preventDefault();line.classList.add('drag-over')};
  line.ondragleave=()=>line.classList.remove('drag-over');
  line.ondrop=e=>{e.preventDefault();line.classList.remove('drag-over');const i=+e.dataTransfer.getData('text/tile');if(Number.isFinite(i))addTile(i)};
  document.querySelectorAll('#tpool .tile').forEach(b=>{
   if(b.disabled)return;
   b.draggable=true;
   b.ondragstart=e=>{b.classList.add('dragging');e.dataTransfer.setData('text/tile',b.dataset.i);try{e.dataTransfer.effectAllowed='copy'}catch(_){}};
   b.ondragend=()=>b.classList.remove('dragging');
   // 触屏拖到句子行
   let drag=null;
   b.addEventListener('pointerdown',e=>{if(answeredCard||b.disabled)return;if(e.pointerType==='mouse'&&e.button!==0)return;
    drag={id:e.pointerId,x0:e.clientX,y0:e.clientY,moved:0}; try{b.setPointerCapture(e.pointerId)}catch(_){}});
   b.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;
    if(Math.hypot(e.clientX-drag.x0,e.clientY-drag.y0)>12){drag.moved=1;b.classList.add('dragging');line.classList.toggle('drag-over',(()=>{const r=line.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom})())}});
   b.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const was=drag;drag=null;b.classList.remove('dragging');line.classList.remove('drag-over');
    if(was.moved){const r=line.getBoundingClientRect();if(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)addTile(+b.dataset.i); return}
    addTile(+b.dataset.i);});
   b.addEventListener('pointercancel',()=>{drag=null;b.classList.remove('dragging');line.classList.remove('drag-over')});
  });
 };
 const draw=()=>{$('tline').innerHTML=picked.length?picked.map(i=>`<span class="tw">${sp[i]}</span>`).join('')+(picked.length===sp.length?'。':''):'<span style="color:#888">点选或拖到这里组句 ↓</span>';
  $('tpool').innerHTML=ord.map(i=>`<button class="btn tile" data-i="${i}" ${picked.includes(i)?'disabled':''}>${sp[i]}</button>`).join('');
  bindDrag();$('tOk').disabled=picked.length!==sp.length};
 $('tUndo').onclick=()=>{if(answeredCard)return;SFX.click();picked.pop();draw()};$('tClr').onclick=()=>{if(answeredCard)return;picked.length=0;draw()};
 $('tOk').onclick=()=>{if(answeredCard||picked.length!==sp.length||$('tOk')._lock)return;$('tOk')._lock=1;const s2=picked.map(i=>sp[i]).join(''),a=String(q.ans).replace(/[。！？]$/,'');answer(s2===a?q.ans:s2+'。',$('tOk'));$('tline').style.color=s2===a?'#2a7a00':'#c22';if(s2!==a)$('tline').insertAdjacentHTML('beforeend',`<div style="font-size:18px;color:#2a7a00">正确：${q.ans}</div>`);document.querySelectorAll('#tctl .btn,#tpool .btn').forEach(b=>b.disabled=true)};
 draw()}
// 检查题卡：不允许出现需要键盘的输入框
function cardNeedsKeys(){return !!document.querySelector('#card input,#card textarea,#card [contenteditable]')}
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement&&state!=='play')try{document.exitPointerLock()}catch(e){}});

// ================= 菜单 =================
function setMute_v6(m){muted=m;LS.set('muted',m);$('muteBtn').textContent=m?'🔇':'🔊';$('mMute').textContent=m?'🔇 声音：关':'🔊 声音：开'}
setMute(muted);
$('muteBtn').onclick=()=>{setMute(!muted)};$('mMute').onclick=()=>{setMute(!muted);ac();SFX.click()};
$('pauseBtn').onclick=pause;$('pResume').onclick=()=>{$('pauseP').classList.add('hide');state='play';tryLock();updLockHint()};
$('pEnd').onclick=()=>{$('pauseP').classList.add('hide');endGame(false)};$('pMenu').onclick=toMenu;
$('cNext').onclick=closeCard;$('respawnBtn').onclick=respawn;$('deathMenu').onclick=()=>{$('deathP').classList.add('hide');endGame(false)};
function toMenu(){if(endTimer){clearTimeout(endTimer);endTimer=0}resetInput();digClose();try{$('questHud').classList.add('hide');$('qArrow').style.display='none';$('starCeleb').classList.add('hide')}catch(_){}hideAll();if(document.pointerLockElement)try{document.exitPointerLock()}catch(e){}G=null;state='menu';$('hud').classList.add('hide');$('touch').classList.add('hide');refreshUserBar();$('menu').classList.remove('hide');updLockHint()}
$('eMenu').onclick=toMenu;$('eAgain').onclick=()=>{const w=G&&G.mode==='wrong';if(w)toMenu();else startGame()};
$('eWrong').onclick=()=>{const l=G.wrongs.map(cleanQ);ed=G.ed;sub=G.sub;startGame({wrongList:l})};
function renderSetup(){document.querySelectorAll('#setup [data-sub]').forEach(b=>b.classList.toggle('on',b.dataset.sub===sub));$('edSel').value=ed;
 document.querySelectorAll('.lenb').forEach(b=>b.classList.toggle('on',+b.dataset.n===roundLen));
 const s=selOf(),st=objStore('stats');
 $('units').innerHTML=unitsOf().map(u=>{const x=st[key()+'_'+u.id];return `<div class="unit ${s.includes(u.id)?'on':''}" data-id="${u.id}"><span>${s.includes(u.id)?'☑':'☐'}</span><span>${u.name}</span><span class="st">${x&&x.n>0?`正确率 ${Math.round(x.r/x.n*100)}%`:'未练习'}</span></div>`}).join('');
 document.querySelectorAll('#units .unit').forEach(el=>el.onclick=()=>{SFX.click();let s=selOf();const id=el.dataset.id;s=s.includes(id)?s.filter(x=>x!==id):[...s,id];sel[key()]=s;LS.set('sel',sel);renderSetup()});
 $('ednote').textContent=(QUESTION_PACK.bank==='extracted'?'个人提取题库：条目标为 NEED_REWRITE，不能当作已获教材授权。分组只影响抽题范围。':'开源示范题由方块备考自编，不是教材原文。分组甲和分组乙是两套练习范围。')+(sub==='pinyin'?' 拼音按题型练习，字词来自当前题库。':sub==='bishun'?' 笔顺轮廓来自开源字形数据，说明见项目 NOTICE。':'')}
$('mStart').onclick=()=>{ac();SFX.click();hideAll();renderSetup();$('setup').classList.remove('hide')};
$('mBoost').onclick=()=>startPyBsBoost();
document.querySelectorAll('.world-card[data-quick]').forEach(b=>b.onclick=()=>{ac();SFX.click();sub=b.dataset.quick;LS.set('sub',sub);hideAll();renderSetup();$('setup').classList.remove('hide')});
if($('mSwitch'))$('mSwitch').onclick=()=>{ac();SFX.click();showLoginHome(true)};

document.querySelectorAll('#setup [data-sub]').forEach(b=>b.onclick=e=>{SFX.click();sub=e.currentTarget.dataset.sub;LS.set('sub',sub);renderSetup()});
$('edSel').onchange=e=>{ed=e.target.value;LS.set('ed',ed);renderSetup()};
document.querySelectorAll('.lenb').forEach(b=>b.onclick=()=>{SFX.click();roundLen=+b.dataset.n;LS.set('len',roundLen);renderSetup()});
$('allBtn').onclick=()=>{const s=selOf();sel[key()]=s.length===unitsOf().length?[]:unitsOf().map(u=>u.id);LS.set('sel',sel);renderSetup()};
$('goBtn').onclick=()=>{SFX.click();startGame()};$('setupBack').onclick=toMenu;
// 错题本
let wSub=sub,wEd=ed;
function renderWrong(){document.querySelectorAll('.wsub').forEach(b=>b.classList.toggle('on',b.dataset.sub===wSub));$('wEd').value=wEd;const wb=wrongStore(wEd,wSub);
 $('wlist').innerHTML=wb.length?`<div style="margin-bottom:4px">共 ${wb.length} 道错题（答对后会自动移出）</div>`+wb.slice().reverse().map(w=>`<div class="wl">${(w.uname||'').slice(0,14)}｜${w.q.replace(/\n/g,' ')}<br>正确答案：<b style="color:#1a6b10">${w.ans}</b></div>`).join(''):'<p>错题本是空的，太棒了！</p>';$('wPlay').disabled=!wb.length}
$('mWrong').onclick=()=>{ac();SFX.click();wSub=sub;wEd=ed;hideAll();renderWrong();$('wrongP').classList.remove('hide')};
document.querySelectorAll('.wsub').forEach(b=>b.onclick=()=>{wSub=b.dataset.sub;renderWrong()});$('wEd').onchange=e=>{wEd=e.target.value;renderWrong()};
$('wPlay').onclick=()=>{const wb=wrongStore(wEd,wSub);if(!wb.length)return;ed=wEd;sub=wSub;startGame({wrongList:wb})};
$('wClear').onclick=()=>{if(confirm('确定清空这个错题本吗？')){LS.set('wrong_'+key(wEd,wSub),[]);renderWrong()}};$('wBack').onclick=toMenu;
// 成绩
let scoreTab='me';
function userStarTotal(uid){try{const raw=localStorage.getItem('g2q_u_'+uid+'_history');const h=raw?JSON.parse(raw):[];if(!Array.isArray(h))return 0;return h.reduce((a,x)=>a+(+x.s||0),0)}catch(e){return 0}}
function renderScoreMe(){const st=objStore('stats');let h='';
 const hv=LS.get('history',[]),hist=Array.isArray(hv)?hv.filter(isObj):[];
 const totalStars=hist.reduce((a,x)=>a+(+x.s||0),0);
 const bySub={};for(const s of SUBS)bySub[s]={n:0,r:0,stars:0};
 for(const x of hist){if(bySub[x.sub]){bySub[x.sub].n+=x.n||0;bySub[x.sub].r+=x.r||0;bySub[x.sub].stars+=x.s||0}}
 h+=`<div style="text-align:center;margin:8px 0 14px;font-size:22px;font-weight:800;color:#5d4037">⭐ 总星星 <b style="color:#e65100">${totalStars}</b></div>`;
 h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">'+SUBS.map(s=>{const b=bySub[s];const pct=b.n?Math.round(b.r/b.n*100):0;return `<div style="background:#fff8e1;border:2px solid #a1887f;border-radius:10px;padding:10px;text-align:center"><div style="font-size:18px">${SUBN[s]}</div><div style="font-size:20px;font-weight:700;color:#2e7d32">${pct}%</div><div style="font-size:12px;color:#6d4c41">${b.r}/${b.n||0} · ★${b.stars}</div></div>`}).join('')+'</div>';
 for(const e of ['new','old'])for(const s of SUBS){const rows=unitsOf(e,s).map(u=>{const x=st[key(e,s)+'_'+u.id];return x&&x.n>0?`<tr><td>${u.name}</td><td style="width:34%"><div class="bar2"><i style="width:${x.r/x.n*100}%"></i></div>${Math.round(x.r/x.n*100)}%（${x.r}/${x.n}）</td></tr>`:''}).join('');if(rows)h+=`<h3>${SUBN[s]} · ${e==='new'?'分组甲':'分组乙'}</h3><table>${rows}</table>`}
 h+='<h3>最近冒险</h3>'+(hist.length?'<table><tr><th>时间</th><th>世界</th><th>成绩</th><th>星</th></tr>'+hist.slice(0,15).map(x=>`<tr><td>${x.d}</td><td>${SUBN[x.sub]||x.sub}${x.mode==='wrong'?'·错题':''}${x.mode==='boost'?'·强化':''}</td><td>${x.r}/${x.n}${x.won?' 🐉':''}</td><td>${'★'.repeat(x.s)||'-'}</td></tr>`).join('')+'</table>':'<p>还没有冒险记录，快去开始吧！</p>');
 return h||'<p>还没有成绩</p>'}
function renderScoreLB(){const list=getProfiles().map(p=>({...p,stars:userStarTotal(p.id)})).sort((a,b)=>b.stars-a.stars);
 if(!list.length)return '<p>还没有角色</p>';
 return '<h3>🏅 谁星最多（本机）</h3><table><tr><th>#</th><th>角色</th><th>星星</th></tr>'+list.map((p,i)=>`<tr style="${p.id===curUid?'background:#fff59d':''}"><td>${i+1}</td><td>${avatarEmoji(p.av)} ${p.name}${p.id===curUid?'（我）':''}</td><td>★ ${p.stars}</td></tr>`).join('')+'</table>'}
function openScore(tab){scoreTab=tab||'me';ac();SFX.click();hideAll();
 document.querySelectorAll('.score-tabs .btn').forEach(b=>b.classList.toggle('on',b.dataset.sc===scoreTab));
 $('scoreBody').innerHTML=scoreTab==='lb'?renderScoreLB():renderScoreMe();
 $('scoreP').classList.remove('hide')}
$('mScore').onclick=()=>openScore('me');
document.querySelectorAll('.score-tabs .btn').forEach(b=>b.onclick=()=>openScore(b.dataset.sc));

$('sBack').onclick=toMenu;
const fsDoc=document,fsRoot=document.documentElement;
function fsCur(){return fsDoc.fullscreenElement||fsDoc.webkitFullscreenElement||null}
function fsCan(){return !!(fsRoot.requestFullscreen||fsRoot.webkitRequestFullscreen)&&(fsDoc.fullscreenEnabled!==false||fsDoc.webkitFullscreenEnabled)}
function fsUpd(){const on=!!fsCur();document.querySelectorAll('.fsb').forEach(b=>{b.innerHTML='⛶<span class="fsl"> '+(on?'退出全屏':'全屏')+'</span>';b.title=on?'退出全屏':'全屏'});resize();setTimeout(resize,250)}
function toggleFS(){try{ac();SFX.click()}catch(e){}
 if(fsCur()){const ex=fsDoc.exitFullscreen||fsDoc.webkitExitFullscreen;if(ex){try{const r=ex.call(fsDoc);if(r&&r.catch)r.catch(()=>{})}catch(e){}}return}
 if(!fsCan()){toast('此浏览器不支持全屏，可以用浏览器菜单的“添加到主屏幕”打开',3200);return}
 try{const r=fsRoot.requestFullscreen?fsRoot.requestFullscreen({navigationUI:'hide'}):fsRoot.webkitRequestFullscreen();if(r&&r.catch)r.catch(()=>toast('此浏览器不支持全屏，可以用浏览器菜单的“添加到主屏幕”打开',3200))}catch(e){toast('此浏览器不支持全屏，可以用浏览器菜单的“添加到主屏幕”打开',3200)}}
document.querySelectorAll('.fsb').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFS();b.blur()});
fsDoc.addEventListener('fullscreenchange',fsUpd);fsDoc.addEventListener('webkitfullscreenchange',fsUpd);


resize();

// ================= v10：离线角色登录 + 分用户成绩 =================
let draftAv='steve',draftNick='小冒险家',draftPin='',pinCheck='',pendingProfile=null,nickMode='chip';
function refreshUserBar(){
 if(!curUser)return;
 const av=$('userAv'),nm=$('userName'),st=$('userStars');
 if(av)av.textContent=avatarEmoji(curUser.av);
 if(nm)nm.textContent=curUser.name||'冒险家';
 if(st)st.textContent='★ '+userStarTotal(curUid);
 const wel=$('menuWelcome');
 if(wel){wel.textContent='';wel.append('欢迎，');const b=document.createElement('b');b.textContent=curUser.name||'冒险家';wel.append(b);wel.append('！')}
}
function loadUserAudioTouch(){
 muted=!!LS.get('muted7',false);musicOn=LS.get('music7',true)!==false;touchPref=LS.get('touch8','auto')||'auto';
 if($('muteBtn'))$('muteBtn').textContent=muted?'🔇':'🔊';
 if($('mMute'))$('mMute').textContent=muted?'🔇 声音：关':'🔊 声音：开';
 if($('musBtn'))$('musBtn').classList.toggle('off',!musicOn);
 if($('mMusic'))$('mMusic').textContent=musicOn?'🎵 音乐：开':'🎵 音乐：关';
 document.querySelectorAll('.touchSet').forEach(b=>b.textContent='📱 触屏模式：'+( {auto:'自动',on:'开',off:'关'}[touchPref]||'自动'));
}
function enterUser(p,opts){
 opts=opts||{};
 curUid=p.id;curUser=p;LS_G.set('curUser',p.id);
 normalizePrefs();loadUserAudioTouch();refreshUserBar();
 hideAll();state='menu';$('menu').classList.remove('hide');
 // 欢迎语在 #menuWelcome 专属行展示（refreshUserBar），不再用居中 toast 遮挡世界卡
}
function showLoginPanel(id){
 ['loginHome','loginPick','loginCreate','loginPin','loginMig'].forEach(x=>{const el=$(x);if(el)el.classList.toggle('hide',x!==id)});
}
function showLoginHome(fromSwitch){
 hideAll();state='login';$('loginP').classList.remove('hide');showLoginPanel('loginHome');
 const list=getProfiles();const lastId=LS_G.get('curUser',null);const last=list.find(p=>p.id===lastId)||list[0];
 const box=$('loginRecent');
 if(last){
  box.innerHTML=`<div style="text-align:center;font-size:48px;line-height:1">${avatarEmoji(last.av)}</div><div style="text-align:center;font-size:22px;font-weight:800;color:#3e2723;margin:6px 0">${last.name}</div><div style="text-align:center;color:#6d4c41">★ ${userStarTotal(last.id)} 星星</div>`;
  $('loginContinue').style.display='inline-flex';
  $('loginContinue').onclick=()=>tryEnter(last);
 }else{
  box.innerHTML='<div style="text-align:center;color:#6d4c41;padding:8px">还没有角色，点「新建角色」开始吧！</div>';
  $('loginContinue').style.display='none';
 }
 if(fromSwitch)toast('切换角色',1200);
}
function renderProfileList(){
 const list=getProfiles();
 $('profileList').innerHTML=list.length?list.map(p=>`<button type="button" class="btn big" data-pid="${p.id}" style="width:100%;margin:6px 0;justify-content:flex-start;gap:12px"><span style="font-size:28px">${avatarEmoji(p.av)}</span><span style="flex:1;text-align:left">${p.name}</span><span>★ ${userStarTotal(p.id)}</span>${p.pin?'🔐':''}</button>`).join(''):'<p style="text-align:center">还没有角色</p>';
 $('profileList').querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>{const p=getProfiles().find(x=>x.id===b.dataset.pid);if(p)tryEnter(p)});
}
function tryEnter(p){
 if(p.pin){pendingProfile=p;pinCheck='';updPinCheck();$('pinWho').textContent=avatarEmoji(p.av)+' '+p.name;showLoginPanel('loginPin');return}
 enterUser(p);
}
function updNickPreview(){$('nickPreview').textContent=draftNick||'（空）'}
function updPinPreview(){$('pinPreview').textContent=(draftPin+'----').slice(0,4).replace(/./g,(c,i)=>i<draftPin.length?c:'-')}
function updPinCheck(){$('pinCheck').textContent=(pinCheck+'----').slice(0,4).replace(/./g,(c,i)=>i<pinCheck.length?c:'-');$('pinErr').textContent=''}
function renderAvatars(){
 $('avatarGrid').innerHTML=AVATARS.map(a=>`<button type="button" class="avatar-btn ${draftAv===a.id?'on':''}" data-av="${a.id}" title="${a.n}"><span>${a.e}</span><small>${a.n}</small></button>`).join('');
 $('avatarGrid').querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>{draftAv=b.dataset.av;renderAvatars();SFX.click()});
}
function renderChips(){
 $('nameChips').innerHTML=NAME_CHIPS.map(n=>`<button type="button" class="chip ${draftNick===n?'on':''}" data-n="${n}">${n}</button>`).join('');
 $('nameChips').querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{draftNick=b.dataset.n;nickMode='chip';updNickPreview();renderChips();SFX.click()});
}
function renderSoftPad(){
 const pad=$('softPad');
 if(nickMode==='chip'){pad.innerHTML='';pad.style.display='none';$('nameChips').style.display='flex';return}
 pad.style.display='grid';$('nameChips').style.display='none';
 const keys=nickMode==='han'?HAN_PAD:ABC_PAD;
 pad.innerHTML=keys.map(k=>`<button type="button" class="pad-key" data-k="${k}">${k}</button>`).join('')+`<button type="button" class="pad-key wide" data-k="del">删</button>`;
 pad.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
  if(b.dataset.k==='del')draftNick=draftNick.slice(0,-1);
  else if(draftNick.length<8)draftNick+=b.dataset.k;
  updNickPreview();SFX.click();
 });
}
function renderPinPad(target){
 const el=$(target==='create'?'pinPad':'pinCheckPad');
 el.innerHTML=['1','2','3','4','5','6','7','8','9','清空','0','删'].map(k=>`<button type="button" class="pad-key" data-k="${k}">${k}</button>`).join('');
 el.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
  SFX.click();
  if(target==='create'){
   if(b.dataset.k==='清空')draftPin='';
   else if(b.dataset.k==='删')draftPin=draftPin.slice(0,-1);
   else if(draftPin.length<4)draftPin+=b.dataset.k;
   updPinPreview();
  }else{
   if(b.dataset.k==='清空')pinCheck='';
   else if(b.dataset.k==='删')pinCheck=pinCheck.slice(0,-1);
   else if(pinCheck.length<4)pinCheck+=b.dataset.k;
   updPinCheck();
   if(pinCheck.length===4){
    if(pendingProfile&&pinCheck===String(pendingProfile.pin)){enterUser(pendingProfile);pendingProfile=null}
    else{$('pinErr').textContent='PIN 不对，再试一次';pinCheck='';updPinCheck()}
   }
  }
 });
}
function openCreate(){
 draftAv='steve';draftNick=NAME_CHIPS[Math.floor(Math.random()*NAME_CHIPS.length)];draftPin='';nickMode='chip';
 renderAvatars();renderChips();renderSoftPad();updNickPreview();updPinPreview();renderPinPad('create');
 showLoginPanel('loginCreate');
}
function finishCreate(skipPin){
 const name=(draftNick||'').trim()||'小冒险家';
 if(!skipPin&&draftPin&&draftPin.length!==4){toast('PIN 要 4 位数字，或点跳过');return}
 const p={id:uid(),name,av:draftAv,pin:(!skipPin&&draftPin.length===4)?draftPin:'',t:Date.now()};
 const list=getProfiles();list.push(p);saveProfiles(list);
 if(!LS_G.get('legacyMigrated',false)&&legacyHasData()){
  curUid=p.id;curUser=p;LS_G.set('curUser',p.id);
  showLoginPanel('loginMig');
  $('migYes').onclick=()=>{migrateLegacyTo(p.id);markLegacyDone();normalizePrefs();loadUserAudioTouch();refreshUserBar();hideAll();state='menu';$('menu').classList.remove('hide');toast('已导入旧成绩到 '+p.name,2200)};
  $('migNo').onclick=()=>{markLegacyDone();enterUser(p);toast('已新建角色',1600)};
  return;
 }
 enterUser(p);
}
function bootLogin(){
 // wire once
 $('loginNew').onclick=()=>{SFX.click();openCreate()};
 $('loginChoose').onclick=()=>{SFX.click();renderProfileList();showLoginPanel('loginPick')};
 $('pickBack').onclick=()=>{SFX.click();showLoginHome()};
 $('createBack').onclick=()=>{SFX.click();showLoginHome()};
 $('pinBack').onclick=()=>{SFX.click();pendingProfile=null;showLoginHome()};
 $('pinSkip').onclick=()=>{SFX.click();draftPin='';updPinPreview();finishCreate(true)};
 $('createGo').onclick=()=>{SFX.click();finishCreate(false)};
 $('nickTabChip').onclick=()=>{nickMode='chip';renderChips();renderSoftPad();SFX.click()};
 $('nickTabHan').onclick=()=>{nickMode='han';renderSoftPad();SFX.click()};
 $('nickTabAbc').onclick=()=>{nickMode='abc';renderSoftPad();SFX.click()};
 $('nickClear').onclick=()=>{draftNick='';updNickPreview();SFX.click()};
 const list=getProfiles();
 if(!list.length){showLoginHome();return}
 const last=list.find(p=>p.id===LS_G.get('curUser',null));
 if(last&&!last.pin){enterUser(last,{silent:true});return}
 showLoginHome();
}
bootLogin();


// Stem guard functions live in src/quiz/stem-guard.js (countStemQMarks, auditQuestionStems, sanitizeStemIfNeeded).

window.__mc={auditQuestionStems,countStemQMarks,stemHasMultiQuestion,sanitizeStemIfNeeded,BOOKS,XMC:XM_COUNT,XYC:XY_COUNT,QUEST_DEFS,initQuests,renderQuestHud,bumpQuest,get LM(){return window.__LM},get frames(){return frames},get DIG(){return DIG},toggleFS,get G(){return G},get cur(){return cur},get state(){return state},action,startGame,closeCard,answer,numKey,keys,joyV,targetBlock,ray,spawnBoss,placeAt,placeTarget,placeBelow,spawnAnimal,nearAnimal,buildUp,getB,setB,isPl,altOf,B,get GH(){return GH},H,X,Z,SPX,SPZ,topAt,
 look(y,p){yaw=y;pitch=p},get SND(){return SND},get AC(){return AC},openCraft,craft,closeCraft,held,renderBar,showTut,closeTut,get ghostAt(){return ghostAt},get muted(){return muted},get musicOn(){return musicOn},unlockAudio,lookDir,get yaw(){return yaw},get pitch(){return pitch},renderer,openQ,fixQ,cardNeedsKeys,cycleTouch,get touchMode(){return touchMode},get touchPref(){return touchPref},
 forceMob:()=>{const d=lookDir();G.mobs.push(newEnt(G.p.x+d.x*2,G.p.y,G.p.z+d.z*2,{type:'zombie',h:1.95,cd:0,flash:0}))},startPyBsBoost,updBossHint,get worldTime(){return worldTime},set worldTime(v){worldTime=v},get landmarks(){return landmarks},clearLandmarks,addSignSprite};
})();
