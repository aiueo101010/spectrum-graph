(function(){
const $=id=>document.getElementById(id);
const num=v=>{const x=parseFloat(String(v).trim());return isFinite(x)?x:NaN;};
const OFFICE=['#4472C4','#ED7D31','#A5A5A5','#FFC000','#5B9BD5','#70AD47','#264478','#9E480E','#636363','#997300'];
const DASHES={solid:'実線',dash:'破線',sysdot:'点線',dashdot:'一点鎖線'};
const WIDTHS=[0.75,1,1.5,2.25,3];
const st={series:[],legend:'tr',grid:true,sample:true,auto:{x:true,y:true}};let uid=0;

/* ---------- data ---------- */
function parseSpectrum(text){const lines=text.split(/\r?\n/);let start=0;const xi=lines.findIndex(l=>/^\s*XYDATA/i.test(l));if(xi>=0)start=xi+1;const pts=[];
 for(let i=start;i<lines.length;i++){const p=lines[i].trim().split(/[\t,; ]+/);if(p.length<2)continue;const a=parseFloat(p[0]),b=parseFloat(p[1]);if(isFinite(a)&&isFinite(b))pts.push([a,b]);}
 pts.sort((p,q)=>p[0]-q[0]);return pts;}
function btbColor(pH){const f=1/(1+10**(7.1-pH));const s=[[0,[214,170,0]],[0.5,[56,150,72]],[1,[33,64,160]]];const [a,b]=f<=0.5?[s[0],s[1]]:[s[1],s[2]];const t=(f-a[0])/(b[0]-a[0]);
 return '#'+a[1].map((v,i)=>Math.round(v+(b[1][i]-v)*t).toString(16).padStart(2,'0')).join('').toUpperCase();}
const gauss=(x,m,s)=>Math.exp(-0.5*((x-m)/s)**2);
function sample(){let s=7;const rnd=()=>{s=(s*16807)%2147483647;return s/2147483647-0.5;};const C=1.2e-5;
 return [3.85,6.12,6.88,7.35,7.95,10.45].map(pH=>{const fL=1/(1+10**(7.05-pH)),k=1+rnd()*0.008;const d=[];for(let w=350;w<=700;w++){const eH=1.55e4*gauss(w,431,42)+2500*gauss(w,350,25),eL=3.9e4*gauss(w,618,45)+3000*gauss(w,540,25)+5000*gauss(w,398,32)+1500*gauss(w,350,20);d.push([w,+((eH*(1-fL)+eL*fL)*C*k+rnd()*0.002).toFixed(6)]);}
  return mk({name:'pH '+pH.toFixed(2),file:'サンプル（架空のデータ）',data:d,color:btbColor(pH),isSample:true});});}
function mk(o){return {id:++uid,dash:'solid',width:1.5,show:true,...o};}

/* ---------- axis helpers ---------- */
function niceStep(span,n=6){if(!(span>0))return 1;const raw=span/n,mag=10**Math.floor(Math.log10(raw));return [1,2,2.5,5,10].map(k=>k*mag).find(v=>v>=raw*0.999);}
const decOf=v=>{const s=String(+v.toPrecision(8));const i=s.indexOf('.');return i<0?0:s.length-i-1;};
const fmtTick=(v,maj)=>{const d=Math.min(6,decOf(maj));const t=Math.abs(v)<maj*1e-6?0:v;return (t<0?'−':'')+Math.abs(t).toFixed(d);};
function visible(){return st.series.filter(s=>s.show&&s.data.length);}
function autoX(){const v=visible();if(!v.length)return;const xs=v.flatMap(s=>[s.data[0][0],s.data[s.data.length-1][0]]);setAx({xmin:Math.min(...xs),xmax:Math.max(...xs),xmaj:''});}
function autoY(){const v=visible();if(!v.length)return;const lo=+$('xmin').value,hi=+$('xmax').value;let mn=Infinity,mx=-Infinity;
 for(const s of v)for(const [x,y] of s.data){if(isFinite(lo)&&isFinite(hi)&&(x<lo||x>hi))continue;if(y<mn)mn=y;if(y>mx)mx=y;}
 if(!isFinite(mn))return;const m=niceStep(mx-mn||1);setAx({ymin:+(Math.floor(mn/m+1e-9)*m).toFixed(10),ymax:+(Math.ceil(mx/m-1e-9)*m).toFixed(10),ymaj:''});}
function setAx(o){for(const k in o)$(k).value=o[k];}
function axes(){const g=k=>num($(k).value);let xmin=g('xmin'),xmax=g('xmax'),ymin=g('ymin'),ymax=g('ymax');
 if(!(xmax>xmin)||!(ymax>ymin))return null;let xmaj=g('xmaj'),ymaj=g('ymaj');
 if(!(xmaj>0)||(xmax-xmin)/xmaj>60)xmaj=niceStep(xmax-xmin);if(!(ymaj>0)||(ymax-ymin)/ymaj>60)ymaj=niceStep(ymax-ymin);
 return {xmin,xmax,ymin,ymax,xmaj,ymaj,xt:$('xt').value,yt:$('yt').value};}

/* ---------- rich text: *italic*  ^{sup}  _{sub} ---------- */
const markup=s=>String(s||'').replace(/\*([^*]+)\*/g,'<i>$1</i>');
function runs(s){const out=[];const re=/(\^\{[^}]*\}|_\{[^}]*\}|<i>.*?<\/i>)/g;let last=0,m;s=markup(s);
 while((m=re.exec(s))){if(m.index>last)out.push({t:s.slice(last,m.index)});const t=m[0];if(t[0]==='^')out.push({t:t.slice(2,-1),sup:1});else if(t[0]==='_')out.push({t:t.slice(2,-1),sub:1});else out.push({t:t.slice(3,-4),i:1});last=re.lastIndex;}
 if(last<s.length)out.push({t:s.slice(last)});return out.map(r=>({...r,t:r.t.replace(/-/g,'−')}));}
const FONT='"BIZ UDPGothic","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif';
function rich(g,s,x,y,size,align='center'){const rs=runs(s);const f=r=>`${r.i?'italic ':''}${r.sup||r.sub?size*0.7:size}px ${FONT}`;
 let w=0;for(const r of rs){g.font=f(r);w+=g.measureText(r.t).width;}let cx=align==='center'?x-w/2:align==='right'?x-w:x;g.textAlign='left';
 for(const r of rs){g.font=f(r);g.fillText(r.t,cx,y+(r.sup?-size*0.38:r.sub?size*0.22:0));cx+=g.measureText(r.t).width;}return w;}

/* ---------- drawing (white chart, same look as the Excel output) ---------- */
let W=720,H=480;const PL=74,PR=18,PT=18,PB=60;
function geom(a){const X=v=>PL+(v-a.xmin)/(a.xmax-a.xmin)*(W-PL-PR),Y=v=>H-PB-(v-a.ymin)/(a.ymax-a.ymin)*(H-PT-PB);
 const iX=px=>a.xmin+(px-PL)/(W-PL-PR)*(a.xmax-a.xmin),iY=py=>a.ymin+(H-PB-py)/(H-PT-PB)*(a.ymax-a.ymin);return {X,Y,iX,iY};}
function dashArr(d,w){const u=Math.max(1,w);return d==='dash'?[4*u,3*u]:d==='sysdot'?[u,u]:d==='dashdot'?[4*u,2*u,u,2*u]:[];}
function legendBox(n){const w=0.22,h=Math.min(0.9,0.052*n+0.03);const p=st.legend;return {x:p[1]==='l'?0.13:0.97-w,y:p[0]==='t'?0.05:0.86-h,w,h};}
function draw(cv,scale=1,sel){const g=cv.getContext('2d');cv.width=W*scale;cv.height=H*scale;g.setTransform(scale,0,0,scale,0,0);
 g.fillStyle='#fff';g.fillRect(0,0,W,H);const a=axes();const v=visible();
 if(!a||!v.length){g.fillStyle='#5E6F70';g.font=`14px ${FONT}`;g.textAlign='center';g.fillText(v.length?'軸の最小・最大を確認してください（最大 > 最小）':'スペクトルのファイルを読み込むとグラフが表示されます',W/2,H/2);return;}
 const {X,Y}=geom(a);const t0=k=>a[k+'min']; // Excel starts tick labels at the axis minimum
 g.lineWidth=1;g.font=`12px ${FONT}`;g.fillStyle='#595959';
 for(let k=0,v=t0('x');v<=a.xmax+a.xmaj*1e-6&&k<200;k++,v=t0('x')+k*a.xmaj){const x=Math.round(X(v))+.5;if(st.grid){g.strokeStyle='#D9D9D9';g.beginPath();g.moveTo(x,PT);g.lineTo(x,H-PB);g.stroke();}g.textAlign='center';g.fillText(fmtTick(v,a.xmaj),x,H-PB+17);}
 for(let k=0,v=t0('y');v<=a.ymax+a.ymaj*1e-6&&k<200;k++,v=t0('y')+k*a.ymaj){const y=Math.round(Y(v))+.5;if(st.grid){g.strokeStyle='#D9D9D9';g.beginPath();g.moveTo(PL,y);g.lineTo(W-PR,y);g.stroke();}g.textAlign='right';g.fillText(fmtTick(v,a.ymaj),PL-7,y+4);}
 g.strokeStyle='#BFBFBF';g.beginPath();const y0=Math.round(Y(Math.min(Math.max(0,a.ymin),a.ymax)))+.5;g.moveTo(PL,y0);g.lineTo(W-PR,y0);const x0=Math.round(X(Math.min(Math.max(0,a.xmin),a.xmax)))+.5;g.moveTo(x0,PT);g.lineTo(x0,H-PB);g.stroke();
 g.fillStyle='#595959';rich(g,a.xt,PL+(W-PL-PR)/2,H-14,13);g.save();g.translate(20,PT+(H-PT-PB)/2);g.rotate(-Math.PI/2);rich(g,a.yt,0,0,13);g.restore();
 g.save();g.beginPath();g.rect(PL,PT,W-PL-PR,H-PT-PB);g.clip();g.lineJoin='round';g.lineCap='round';
 for(const s of v){const lw=s.width*1.333;g.strokeStyle=s.color;g.lineWidth=lw;g.setLineDash(dashArr(s.dash,lw));g.beginPath();let on=false;
  for(const [x,y] of s.data){if(!isFinite(y)){on=false;continue;}const px=X(x),py=Y(y);if(!on){g.moveTo(px,py);on=true;}else g.lineTo(px,py);}g.stroke();}
 g.restore();g.setLineDash([]);
 if(st.legend!=='none'){const L=legendBox(v.length);let lx=L.x*W,ly=L.y*H+12;g.font=`12px ${FONT}`;
  for(const s of v){const lw=s.width*1.333;g.strokeStyle=s.color;g.lineWidth=lw;g.setLineDash(dashArr(s.dash,lw));g.beginPath();g.moveTo(lx,ly-4);g.lineTo(lx+26,ly-4);g.stroke();g.setLineDash([]);g.fillStyle='#595959';rich(g,s.name,lx+32,ly,12,'left');ly+=Math.max(17,0.052*H);}}
 if(sel){g.fillStyle='rgba(47,93,98,.12)';g.strokeStyle='#2F5D62';g.lineWidth=1;g.setLineDash([4,3]);const x=Math.min(sel[0],sel[2]),y=Math.min(sel[1],sel[3]);g.fillRect(x,y,Math.abs(sel[2]-sel[0]),Math.abs(sel[3]-sel[1]));g.strokeRect(x+.5,y+.5,Math.abs(sel[2]-sel[0]),Math.abs(sel[3]-sel[1]));g.setLineDash([]);}}
const cv=$('cv');let sel=null;
function autoUI(){for(const k of ['x','y']){const b=$(k+'auto');b.setAttribute('aria-pressed',st.auto[k]?'true':'false');b.textContent=st.auto[k]?'自動（データに合わせる）':'自動に戻す';}}
function render(){if(st.auto.x)autoX();if(st.auto.y)autoY();autoUI();const cw=cv.clientWidth||720;[W,H]=cw<560?[460,340]:[720,480];draw(cv,Math.max(1,Math.min(3,cw/W*(window.devicePixelRatio||1))),sel);note();}

/* ---------- zoom / pan / readout: mouse = drag-rectangle + wheel, touch = pinch + one-finger sideways pan ---------- */
const toCanvas=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
const inPlot=([x,y])=>x>=PL&&x<=W-PR&&y>=PT&&y<=H-PB;
const rnd=(v,s)=>{const q=10**(Math.floor(Math.log10(s))-1);return +(Math.round(v/q)*q).toPrecision(10);};
function setRange(xmin,xmax,ymin,ymax){st.auto.x=st.auto.y=false;const xs=xmax-xmin,ys=ymax-ymin;setAx({xmin:rnd(xmin,xs),xmax:rnd(xmax,xs),ymin:rnd(ymin,ys),ymax:rnd(ymax,ys),xmaj:'',ymaj:''});render();}
function zoom(f,fx=0.5,fy=0.5,base){const a=base||axes();if(!a)return;const cx=a.xmin+(a.xmax-a.xmin)*fx,cy=a.ymin+(a.ymax-a.ymin)*fy;
 setRange(cx-(cx-a.xmin)*f,cx+(a.xmax-cx)*f,cy-(cy-a.ymin)*f,cy+(a.ymax-cy)*f);}
function readout(p){const a=axes(),ro=$('readout');if(a&&inPlot(p)){const {iX,iY}=geom(a);ro.hidden=false;ro.textContent=`x = ${iX(p[0]).toFixed(decOf(a.xmaj)+1)},  y = ${iY(p[1]).toFixed(decOf(a.ymaj)+2)}`;}else ro.hidden=true;}
const touches=new Map();let pinch=null,pan=null,lastTap=0;
function reset(){st.auto.x=st.auto.y=true;render();}
cv.addEventListener('pointerdown',e=>{const p=toCanvas(e);if(!axes())return;
 if(e.pointerType==='mouse'){if(!inPlot(p))return;sel=[...p,...p];cv.setPointerCapture(e.pointerId);return;}
 touches.set(e.pointerId,p);cv.setPointerCapture(e.pointerId);
 if(touches.size===2){const [q1,q2]=[...touches.values()];pinch={d:Math.hypot(q1[0]-q2[0],q1[1]-q2[1])||1,c:[(q1[0]+q2[0])/2,(q1[1]+q2[1])/2],a:axes()};pan=null;}
 else if(touches.size===1){pan={p,a:axes(),moved:false};readout(p);}});
cv.addEventListener('pointermove',e=>{const p=toCanvas(e);
 if(e.pointerType==='mouse'){readout(p);if(sel){sel[2]=Math.min(Math.max(p[0],PL),W-PR);sel[3]=Math.min(Math.max(p[1],PT),H-PB);render();}return;}
 if(!touches.has(e.pointerId))return;touches.set(e.pointerId,p);
 if(pinch&&touches.size===2){const [q1,q2]=[...touches.values()];const d=Math.hypot(q1[0]-q2[0],q1[1]-q2[1])||1;
  zoom(pinch.d/d,(pinch.c[0]-PL)/(W-PL-PR),(H-PB-pinch.c[1])/(H-PT-PB),pinch.a);}
 else if(pan){const dx=p[0]-pan.p[0];if(Math.abs(dx)>4)pan.moved=true;if(pan.moved){const a=pan.a,s=(a.xmax-a.xmin)/(W-PL-PR)*dx;st.auto.x=false;const xs=a.xmax-a.xmin;setAx({xmin:rnd(a.xmin-s,xs),xmax:rnd(a.xmax-s,xs),xmaj:''});render();}readout(p);}});
function up(e){if(e.pointerType==='mouse'){if(!sel)return;const s=sel;sel=null;const a=axes();
  if(a&&Math.abs(s[2]-s[0])>8&&Math.abs(s[3]-s[1])>8){const {iX,iY}=geom(a);const x1=iX(Math.min(s[0],s[2])),x2=iX(Math.max(s[0],s[2])),y1=iY(Math.max(s[1],s[3])),y2=iY(Math.min(s[1],s[3]));
   const fx=(lo,hi)=>{const m=niceStep(hi-lo);return [+(Math.floor(lo/m+1e-9)*m).toFixed(10),+(Math.ceil(hi/m-1e-9)*m).toFixed(10)];};const [xa,xb]=fx(x1,x2),[ya,yb]=fx(y1,y2);
   st.auto.x=st.auto.y=false;setAx({xmin:xa,xmax:xb,ymin:ya,ymax:yb,xmaj:'',ymaj:''});}
  render();return;}
 const wasTap=pan&&!pan.moved&&touches.size===1;touches.delete(e.pointerId);
 if(touches.size<2)pinch=null;if(!touches.size)pan=null;
 if(wasTap&&e.type==='pointerup'){const t=Date.now();if(t-lastTap<320){reset();lastTap=0;}else lastTap=t;}}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')$('readout').hidden=true;});
cv.addEventListener('wheel',e=>{const p=toCanvas(e);if(!axes()||!inPlot(p))return;e.preventDefault();zoom(e.deltaY>0?1.25:0.8,(p[0]-PL)/(W-PL-PR),(H-PB-p[1])/(H-PT-PB));},{passive:false});
$('zin').addEventListener('click',()=>zoom(0.8));$('zout').addEventListener('click',()=>zoom(1.25));
cv.addEventListener('dblclick',e=>{if(!e.pointerType||e.pointerType==='mouse')reset();});
if(matchMedia('(pointer: coarse)').matches)$('gesture').textContent='2本指で拡大縮小 · 1本指で左右に移動 · ダブルタップで元に戻す';

/* ---------- series list ---------- */
function list(){const box=$('series');box.innerHTML='';$('count').textContent=st.series.length?st.series.length+' 本':'';
 if(!st.series.length){box.innerHTML='<p class="empty">まだファイルがありません。上の枠から読み込んでください（何本でも重ねられます）。</p>';return;}
 st.series.forEach((s,i)=>{const d=document.createElement('div');d.className='s'+(s.show?'':' off');
  d.innerHTML=`<input type="checkbox" ${s.show?'checked':''} aria-label="${esc(s.name)}を表示"><input type="color" value="${s.color}" aria-label="${esc(s.name)}の線の色"><input type="text" value="${esc(s.name)}" aria-label="凡例に出る名前"><div class="opts"><select aria-label="線の種類">${Object.entries(DASHES).map(([k,v])=>`<option value="${k}" ${k===s.dash?'selected':''}>${v}</option>`).join('')}</select>
   <select aria-label="線の太さ">${WIDTHS.map(w=>`<option value="${w}" ${w===s.width?'selected':''}>${w} pt</option>`).join('')}</select></div><div class="moves"><button class="btn icon" type="button" data-a="up" aria-label="上へ" ${i?'':'disabled'}>↑</button><button class="btn icon" type="button" data-a="down" aria-label="下へ" ${i<st.series.length-1?'':'disabled'}>↓</button><button class="btn icon" type="button" data-a="del" aria-label="削除">×</button></div>
   <span class="file" title="${esc(s.file)}">${esc(s.file)}（${s.data.length} 点）</span>
   `;
  box.appendChild(d);const [chk,col,name]=d.querySelectorAll('input');const [dash,wid]=d.querySelectorAll('select');
  chk.addEventListener('change',()=>{s.show=chk.checked;d.classList.toggle('off',!s.show);touch();render();});
  col.addEventListener('input',()=>{s.color=col.value.toUpperCase();touch();render();});
  name.addEventListener('input',()=>{s.name=name.value;touch();render();});
  dash.addEventListener('change',()=>{s.dash=dash.value;touch();render();});wid.addEventListener('change',()=>{s.width=+wid.value;touch();render();});
  d.querySelectorAll('[data-a]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.a;if(a==='del')st.series.splice(i,1);else{const j=a==='up'?i-1:i+1;[st.series[i],st.series[j]]=[st.series[j],st.series[i]];}touch();list();render();}));});}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function touch(){if(st.sample){st.sample=false;}}
function note(){$('note').textContent=st.sample?'サンプル（架空のBTBスペクトル6本）を表示中です。自分のファイルを読み込むと置き換わります。':`${visible().length} 本の線を、上のグラフと同じ見た目でExcelのグラフにします（データは「データ」シートに入ります）。`;}

async function load(files){const msg=$('msg');msg.className='msg';msg.textContent='';const bad=[];let added=0;
 st.series=st.series.filter(s=>!s.isSample);st.sample=false;
 const sorted=[...files].sort((a,b)=>a.name.localeCompare(b.name,'ja',{numeric:true}));
 for(const f of sorted){const data=parseSpectrum(await f.text());if(data.length<3){bad.push(f.name);continue;}
  const base=f.name.replace(/\.[^.]+$/,'');st.series.push(mk({name:base,file:f.name,data,color:OFFICE[st.series.length%OFFICE.length]}));added++;}
 if(bad.length){msg.className='msg err';msg.textContent=bad.join('、')+' から数値データ（波長と吸光度の2列）を読み取れませんでした。';}
 if(added){st.auto.x=st.auto.y=true;}list();render();}

/* ---------- export ---------- */
function workbook(){const a=axes(),v=visible();const {Sheet,ST,aref}=XL;
 const ds=new Sheet('データ');v.forEach((s,k)=>{const c=k*2;ds.width(c,10).width(c+1,11);ds.set(0,c,XL.plain(markup(s.name)),ST.bold);ds.row(1,c,['x','y'],ST.head);s.data.forEach(([x,y],i)=>{ds.set(2+i,c,x,ST.n2);ds.set(2+i,c+1,y,ST.n6);});});
 const gs=new Sheet('グラフ');gs.grid=false;for(let c=0;c<12;c++)gs.width(c,10);
 const ser=v.map((s,k)=>({name:XL.plain(markup(s.name)),x:s.data.map(p=>p[0]),y:s.data.map(p=>p[1]),xRef:aref('データ',2,k*2,1+s.data.length,k*2),yRef:aref('データ',2,k*2+1,1+s.data.length,k*2+1),line:true,width:Math.round(s.width*12700),dash:s.dash,color:s.color.replace('#',''),marker:'none'}));
 const fm=m=>{const d=decOf(m);return d?'0.'+'0'.repeat(d):'0';};
 gs.chart({series:ser,x:{title:markup(a.xt),min:a.xmin,max:a.xmax,major:a.xmaj,fmt:fm(a.xmaj),grid:st.grid},y:{title:markup(a.yt),min:a.ymin,max:a.ymax,major:a.ymaj,fmt:fm(a.ymaj),grid:st.grid},legend:st.legend==='none'?false:legendBox(v.length)},1,1,22,11);
 return [gs,ds];}
async function saveFile(name,blob){const sm=$('save-msg');sm.className='msg';
 try{if(window.claude&&typeof window.claude.use==='function'){const d=await window.claude.use('downloads');if(d){try{await d.save({filename:name,data:blob});sm.textContent=name+' を保存しました。';}catch(e){sm.className='msg err';sm.textContent=e&&e.code==='declined'?'保存はキャンセルされました。':'保存できませんでした。';}return;}}}catch(_){}
 const url=URL.createObjectURL(blob);const el=document.createElement('a');el.href=url;el.download=name;document.body.appendChild(el);el.click();el.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);sm.textContent=name+' を作成しました。';}
function ready(){if(!visible().length||!axes()){$('save-msg').className='msg err';$('save-msg').textContent=visible().length?'軸の最小・最大を確認してください。':'表示する線がありません。';return false;}return true;}
$('xlsx').addEventListener('click',()=>{if(ready())saveFile('スペクトル.xlsx',new Blob([XL.build(workbook())],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));});
$('png').addEventListener('click',()=>{if(!ready())return;const c=document.createElement('canvas');const keep=[W,H];W=720;H=480;draw(c,3);[W,H]=keep;c.toBlob(b=>saveFile('スペクトル.png',b),'image/png');});

/* ---------- wiring ---------- */
const drop=$('drop'),inp=$('file');
drop.addEventListener('click',e=>{if(e.target!==inp)inp.click();});drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inp.click();}});
inp.addEventListener('change',()=>{if(inp.files.length)load(inp.files);inp.value='';});
drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('over');});drop.addEventListener('dragleave',()=>drop.classList.remove('over'));
drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('over');if(e.dataTransfer.files.length)load(e.dataTransfer.files);});
['xt','yt','xmin','xmax','xmaj','ymin','ymax','ymaj'].forEach(k=>$(k).addEventListener('input',()=>{if(/^x(min|max|maj)$/.test(k))st.auto.x=false;if(/^y(min|max|maj)$/.test(k))st.auto.y=false;touch();render();}));
$('xauto').addEventListener('click',()=>{st.auto.x=true;render();});$('yauto').addEventListener('click',()=>{st.auto.y=true;render();});
$('grid').addEventListener('change',e=>{st.grid=e.target.checked;render();});
$('legend').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{st.legend=b.dataset.v;$('legend').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));render();}));
$('scheme').addEventListener('change',e=>{const k=e.target.value;e.target.value='';if(!k)return;const n=st.series.length;
 st.series.forEach((s,i)=>{if(k==='office')s.color=OFFICE[i%OFFICE.length];else if(k==='btb'){const m=s.name.match(/pH\s*([0-9]+(?:\.[0-9]+)?)/i)||s.name.match(/([0-9]+(?:\.[0-9]+)?)/);if(m)s.color=btbColor(+m[1]);}
  else{const t=n>1?i/(n-1):0;const [c1,c2]=k==='grad'?[[33,64,200],[200,40,40]]:[[0,0,0],[170,170,170]];s.color='#'+c1.map((v,j)=>Math.round(v+(c2[j]-v)*t).toString(16).padStart(2,'0')).join('').toUpperCase();}});
 if(k==='btb'&&!st.series.some(s=>/[0-9]/.test(s.name))){$('msg').className='msg err';$('msg').textContent='BTBの色は、名前に「pH 7.35」のようにpHの数値があるときに使えます。';}
 touch();list();render();});
$('clearall').addEventListener('click',()=>{st.series=[];st.sample=false;$('msg').textContent='';list();render();});
$('sample').addEventListener('click',()=>{st.series=sample();st.sample=true;setAx({xt:'*λ* / nm',yt:'*A*'});st.auto.x=st.auto.y=true;list();render();});
window.addEventListener('resize',()=>render());
st.series=sample();setAx({xt:'*λ* / nm',yt:'*A*'});list();render();
})();
