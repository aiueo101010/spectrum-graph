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
let W=720,H=480,PB=60;const PL=74,PR=18,PT=18,PB0=60;
function geom(a){const X=v=>PL+(v-a.xmin)/(a.xmax-a.xmin)*(W-PL-PR),Y=v=>H-PB-(v-a.ymin)/(a.ymax-a.ymin)*(H-PT-PB);
 const iX=px=>a.xmin+(px-PL)/(W-PL-PR)*(a.xmax-a.xmin),iY=py=>a.ymin+(H-PB-py)/(H-PT-PB)*(a.ymax-a.ymin);return {X,Y,iX,iY};}
function dashArr(d,w){const u=Math.max(d==='sysdot'?2:1,w);return d==='dash'?[4*u,3*u]:d==='sysdot'?[u,u]:d==='dashdot'?[4*u,2*u,u,2*u]:[];}
function measureRich(g,s,size){let w=0;for(const r of runs(s)){g.font=`${r.i?'italic ':''}${r.sup||r.sub?size*0.7:size}px ${FONT}`;w+=g.measureText(r.t).width;}return w;}
/* legend placed inside the plot area, sized to its text; splits into columns when it would not fit vertically */
function legendLayout(g,v){const rowH=18,pad=6,key=32;const tw=Math.max(...v.map(s=>measureRich(g,s.name,12)));const colW=key+tw+10;
 const avail=H-PT-PB-16;const maxRows=Math.max(1,Math.min(v.length,Math.floor((avail-pad*2)/rowH)));const cols=Math.ceil(v.length/maxRows),rows=Math.ceil(v.length/cols);
 const w=cols*colW,h=Math.min(v.length,rows)*rowH+pad*2;const p=st.legend;let x,y;
 if(p==='custom'){x=PL+st.lpos.fx*Math.max(0,W-PL-PR-w);y=PT+st.lpos.fy*Math.max(0,H-PT-PB-h);}   // dragged: stored as a share of the free space, so it stays inside at any size
 else{x=p[1]==='l'?PL+8:W-PR-8-w;y=p[0]==='t'?PT+4:H-PB-4-h;}return {x,y,w,h,rows,colW,rowH,pad};}
/* legend under the graph: items side by side, wrapping onto more rows when needed */
function bottomLayout(g,v){const rowH=18,gap=18,key=32,maxW=W-PL-PR;const rows=[[]];let cw=0;
 for(const s of v){const w=key+measureRich(g,s.name,12);if(rows[rows.length-1].length&&cw+gap+w>maxW){rows.push([]);cw=0;}const r=rows[rows.length-1];if(r.length)cw+=gap;r.push({s,w,off:cw});cw+=w;r.width=cw;}
 return {rows,rowH,h:rows.length*rowH};}
function draw(cv,scale=1,live){const g=cv.getContext('2d');cv.width=W*scale;cv.height=H*scale;g.setTransform(scale,0,0,scale,0,0);
 g.fillStyle='#fff';g.fillRect(0,0,W,H);const a=axes();const v=visible();
 const BL=st.legend==='bottom'&&v.length?bottomLayout(g,v):null;PB=PB0+(BL?BL.h+8:0);
 if(!a||!v.length){g.fillStyle='#5E6F70';g.font=`14px ${FONT}`;g.textAlign='center';g.fillText(v.length?'軸の最小・最大を確認してください（最大 > 最小）':'スペクトルのファイルを読み込むとグラフが表示されます',W/2,H/2);return;}
 const {X,Y}=geom(a);
 // at rest ticks start at the axis minimum (that is how Excel draws them); while the graph is being moved they stay fixed to the data so the scale slides with the curves
 const t0=k=>k==='y'&&yMoving?Math.ceil(a.ymin/a.ymaj-1e-9)*a.ymaj:a[k+'min'];
 g.lineWidth=1;g.font=`12px ${FONT}`;g.fillStyle='#595959';
 for(let k=0,v=t0('x');v<=a.xmax+a.xmaj*1e-6&&k<200;k++,v=t0('x')+k*a.xmaj){const x=Math.round(X(v))+.5;if(st.grid){g.strokeStyle='#D9D9D9';g.beginPath();g.moveTo(x,PT);g.lineTo(x,H-PB);g.stroke();}g.textAlign='center';g.fillText(fmtTick(v,a.xmaj),x,H-PB+17);}
 for(let k=0,v=t0('y');v<=a.ymax+a.ymaj*1e-6&&k<200;k++,v=t0('y')+k*a.ymaj){const y=Math.round(Y(v))+.5;if(st.grid){g.strokeStyle='#D9D9D9';g.beginPath();g.moveTo(PL,y);g.lineTo(W-PR,y);g.stroke();}g.textAlign='right';g.fillText(fmtTick(v,a.ymaj),PL-7,y+4);}
 g.strokeStyle='#BFBFBF';g.beginPath();const y0=Math.round(Y(Math.min(Math.max(0,a.ymin),a.ymax)))+.5;g.moveTo(PL,y0);g.lineTo(W-PR,y0);const x0=Math.round(X(Math.min(Math.max(0,a.xmin),a.xmax)))+.5;g.moveTo(x0,PT);g.lineTo(x0,H-PB);g.stroke();
 g.fillStyle='#595959';rich(g,a.xt,PL+(W-PL-PR)/2,H-PB+46,13);g.save();g.translate(20,PT+(H-PT-PB)/2);g.rotate(-Math.PI/2);rich(g,a.yt,0,0,13);g.restore();
 g.save();g.beginPath();g.rect(PL,PT,W-PL-PR,H-PT-PB);g.clip();g.lineJoin='round';g.lineCap='round';
 for(const s of v){const lw=s.width*1.333;g.strokeStyle=s.color;g.lineWidth=lw;g.lineCap='butt';g.setLineDash(dashArr(s.dash,lw));g.lineCap=s.dash==='solid'?'round':'butt';g.beginPath();let on=false;
  for(const [x,y] of s.data){if(!isFinite(y)){on=false;continue;}const px=X(x),py=Y(y);if(!on){g.moveTo(px,py);on=true;}else g.lineTo(px,py);}g.stroke();}
 g.restore();g.setLineDash([]);
 if(BL){let y=H-PB+PB0+4+BL.rowH/2;for(const r of BL.rows){let x=PL+(W-PL-PR-r.width)/2;for(const it of r){const s=it.s,lx=x+it.off,lw=s.width*1.333;g.strokeStyle=s.color;g.lineWidth=lw;g.lineCap='butt';g.setLineDash(dashArr(s.dash,lw));g.beginPath();g.moveTo(lx+2,y);g.lineTo(lx+26,y);g.stroke();g.setLineDash([]);g.fillStyle='#595959';rich(g,s.name,lx+32,y+4,12,'left');}y+=BL.rowH;}}
 else if(st.legend!=='none'){const L=legendLayout(g,v);if(live){LG=L;if(drag){g.strokeStyle='#2F5D62';g.lineWidth=1;g.setLineDash([4,3]);g.strokeRect(L.x-2.5,L.y-.5,L.w+3,L.h+1);g.setLineDash([]);}}
  v.forEach((s,i)=>{const lx=L.x+Math.floor(i/L.rows)*L.colW,ly=L.y+L.pad+(i%L.rows)*L.rowH+L.rowH/2;const lw=s.width*1.333;g.strokeStyle=s.color;g.lineWidth=lw;g.lineCap='butt';g.setLineDash(dashArr(s.dash,lw));g.beginPath();g.moveTo(lx+2,ly);g.lineTo(lx+26,ly);g.stroke();g.setLineDash([]);g.fillStyle='#595959';rich(g,s.name,lx+32,ly+4,12,'left');});}}

const cv=$('cv');let LG=null,drag=null;
function autoUI(){for(const k of ['x','y']){const b=$(k+'auto');b.setAttribute('aria-pressed',st.auto[k]?'true':'false');b.textContent=st.auto[k]?'自動（データに合わせる）':'自動に戻す';}}
function render(){if(st.auto.x)autoX();if(st.auto.y)autoY();autoUI();const cw=cv.clientWidth||720;[W,H]=cw<560?[460,340]:[720,480];LG=null;draw(cv,Math.max(1,Math.min(3,cw/W*(window.devicePixelRatio||1))),true);note();}

/* ---------- drag: legend → move legend, plot area → move the y range up/down (mouse & touch) ---------- */
const toCanvas=e=>{const r=cv.getBoundingClientRect();return [(e.clientX-r.left)/r.width*W,(e.clientY-r.top)/r.height*H];};
const inPlot=([x,y])=>x>=PL&&x<=W-PR&&y>=PT&&y<=H-PB;
const onLegend=([x,y])=>LG&&x>=LG.x-6&&x<=LG.x+LG.w+6&&y>=LG.y-6&&y<=LG.y+LG.h+6;
const rnd=(v,s)=>{const q=10**(Math.floor(Math.log10(s))-1);return +(Math.round(v/q)*q).toPrecision(10);};
// zoom result is put on whole ticks so the axis labels start on a gridline (same in the preview and in Excel)
function setRange(xmin,xmax,ymin,ymax,dir=0){st.auto.x=st.auto.y=false;const cur=axes();
 const fit=(lo,hi,k)=>{const man=num($(k+'maj').value);const m=man>0&&(hi-lo)/man<=60?man:niceStep(hi-lo);let a1=Math.round(lo/m)*m,a2=Math.round(hi/m)*m;
  if(cur&&dir&&Math.abs(a1-cur[k+'min'])<m*1e-6&&Math.abs(a2-cur[k+'max'])<m*1e-6){a1-=dir*m;a2+=dir*m;}if(a2-a1<m){a1=Math.floor(lo/m)*m;a2=a1+m;}return [+a1.toFixed(10),+a2.toFixed(10)];};
 const [x1,x2]=fit(xmin,xmax,'x'),[y1,y2]=fit(ymin,ymax,'y');setAx({xmin:x1,xmax:x2,ymin:y1,ymax:y2});render();}
function zoom(f,fx=0.5,fy=0.5,base){const a=base||axes();if(!a)return;const cx=a.xmin+(a.xmax-a.xmin)*fx,cy=a.ymin+(a.ymax-a.ymin)*fy;
 setRange(cx-(cx-a.xmin)*f,cx+(a.xmax-cx)*f,cy-(cy-a.ymin)*f,cy+(a.ymax-cy)*f,f<1?-1:1);}
let roTimer=0;
// mouse: follows the pointer. touch: appears while the finger is down, stays ~3 s after lifting, then fades out
function readout(p){const a=axes(),ro=$('readout');clearTimeout(roTimer);ro.classList.remove('fade');if(a&&inPlot(p)){const {iX,iY}=geom(a);ro.hidden=false;ro.textContent=`x = ${iX(p[0]).toFixed(decOf(a.xmaj)+1)},  y = ${iY(p[1]).toFixed(decOf(a.ymaj)+2)}`;}else ro.hidden=true;}
function fadeReadout(){const ro=$('readout');clearTimeout(roTimer);if(ro.hidden)return;roTimer=setTimeout(()=>{ro.classList.add('fade');roTimer=setTimeout(()=>{ro.hidden=true;ro.classList.remove('fade');},600);},3000);}
function legendButtons(){$('legend').querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x.dataset.v===st.legend?'true':'false'));}
let ypan=null,yMoving=false,snapAnim=0;
// touches that start on the legend or inside the plot area are handled here, not as page scrolling
cv.addEventListener('touchstart',e=>{if(e.touches.length===1){const p=toCanvas(e.touches[0]);if(onLegend(p)||(axes()&&inPlot(p)))e.preventDefault();}},{passive:false});
cv.addEventListener('pointerdown',e=>{const p=toCanvas(e);if(!axes()||drag||ypan)return;
 if(onLegend(p)){drag={dx:p[0]-LG.x,dy:p[1]-LG.y,w:LG.w,h:LG.h};cv.setPointerCapture(e.pointerId);render();}
 else if(inPlot(p)){cancelAnimationFrame(snapAnim);ypan={y:p[1],a:axes(),maj:$('ymaj').value,id:e.pointerId};yMoving=true;cv.setPointerCapture(e.pointerId);readout(p);}});
cv.addEventListener('pointermove',e=>{const p=toCanvas(e);
 if(drag){const fw=Math.max(1,W-PL-PR-drag.w),fh=Math.max(1,H-PT-PB-drag.h);
  st.legend='custom';st.lpos={fx:Math.min(1,Math.max(0,(p[0]-drag.dx-PL)/fw)),fy:Math.min(1,Math.max(0,(p[1]-drag.dy-PT)/fh))};legendButtons();render();return;}
 if(ypan&&e.pointerId===ypan.id){const a=ypan.a,span=a.ymax-a.ymin,s=(p[1]-ypan.y)/(H-PT-PB)*span;   // drag down = curves move down
  const d=decOf(a.ymaj)+3;st.auto.y=false;setAx({ymin:+(a.ymin+s).toFixed(d),ymax:+(a.ymax+s).toFixed(d),ymaj:ypan.maj});render();readout(p);return;}
 if(e.pointerType==='mouse'){cv.style.cursor=onLegend(p)?'move':inPlot(p)?'ns-resize':'default';readout(p);}});
function up(e){if(drag){drag=null;render();}if(ypan&&e.pointerId===ypan.id){ypan=null;snapY();}if(e.pointerType!=='mouse')fadeReadout();}
// after moving, glide to the nearest gridline so the minimum is a whole tick again (clean labels, identical in Excel)
function snapY(){const a=axes();if(!a){yMoving=false;render();return;}const span=a.ymax-a.ymin,from=a.ymin,to=+(Math.round(a.ymin/a.ymaj)*a.ymaj).toFixed(10),maj=$('ymaj').value,t0=performance.now();
 const step=t=>{const k=Math.min(1,(t-t0)/160),e=1-(1-k)**3,m=k<1?from+(to-from)*e:to;setAx({ymin:k<1?m:to,ymax:k<1?m+span:+(to+span).toFixed(10),ymaj:maj});if(k<1){render();snapAnim=requestAnimationFrame(step);}else{yMoving=false;render();}};
 snapAnim=requestAnimationFrame(step);}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')$('readout').hidden=true;});
$('zin').addEventListener('click',()=>zoom(0.8));$('zout').addEventListener('click',()=>zoom(1.25));
$('gesture').textContent='グラフをドラッグで上下に移動 · 凡例はドラッグで移動';

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
function excelLegend(v){const keep=[W,H];W=720;H=480;const g=document.createElement('canvas').getContext('2d');const L=legendLayout(g,v);[W,H]=keep;const sw=1.12;
 return {x:L.x/720,y:L.y/480,w:Math.min(0.85,L.w*sw/720),h:Math.min(0.85,L.h/480)};}
function workbook(){const a=axes(),v=visible();const {Sheet,ST,aref}=XL;
 const ds=new Sheet('データ');v.forEach((s,k)=>{const c=k*2;ds.width(c,10).width(c+1,11);ds.set(0,c,XL.plain(markup(s.name)),ST.bold);ds.row(1,c,['x','y'],ST.head);s.data.forEach(([x,y],i)=>{ds.set(2+i,c,x,ST.n2);ds.set(2+i,c+1,y,ST.n6);});});
 const gs=new Sheet('グラフ');gs.grid=false;for(let c=0;c<12;c++)gs.width(c,10);
 const ser=v.map((s,k)=>({name:XL.plain(markup(s.name)),x:s.data.map(p=>p[0]),y:s.data.map(p=>p[1]),xRef:aref('データ',2,k*2,1+s.data.length,k*2),yRef:aref('データ',2,k*2+1,1+s.data.length,k*2+1),line:true,width:Math.round(s.width*12700),dash:s.dash,color:s.color.replace('#',''),marker:'none'}));
 const fm=m=>{const d=decOf(m);return d?'0.'+'0'.repeat(d):'0';};
 gs.chart({series:ser,x:{title:markup(a.xt),min:a.xmin,max:a.xmax,major:a.xmaj,fmt:fm(a.xmaj),grid:st.grid},y:{title:markup(a.yt),min:a.ymin,max:a.ymax,major:a.ymaj,fmt:fm(a.ymaj),grid:st.grid},legend:st.legend==='none'?false:st.legend==='bottom'?{pos:'b'}:excelLegend(v)},1,1,22,11);
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
$('legend').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{st.legend=b.dataset.v;legendButtons();render();}));
$('scheme').addEventListener('change',e=>{const k=e.target.value;e.target.value='';if(!k)return;const miss=[];const n=st.series.length;
 st.series.forEach((s,i)=>{if(k==='office')s.color=OFFICE[i%OFFICE.length];else if(k==='btb'){const m=s.name.match(/pH\s*([0-9]+(?:\.[0-9]+)?)/i);if(m)s.color=btbColor(+m[1]);else miss.push(s.name||'（名前なし）');}
  else{const t=n>1?i/(n-1):0;const [c1,c2]=k==='grad'?[[33,64,200],[200,40,40]]:[[0,0,0],[170,170,170]];s.color='#'+c1.map((v,j)=>Math.round(v+(c2[j]-v)*t).toString(16).padStart(2,'0')).join('').toUpperCase();}});
 if(k==='btb'&&miss.length){$('msg').className='msg err';$('msg').textContent=`名前に pH がないため色を変えなかった線：${miss.join('、')}（名前を「pH 7.35」のようにしてから、もう一度選んでください）`;}else $('msg').textContent='';
 touch();list();render();});
$('clearall').addEventListener('click',()=>{st.series=[];st.sample=false;$('msg').textContent='';list();render();});
$('sample').addEventListener('click',()=>{st.series=sample();st.sample=true;setAx({xt:'*λ* / nm',yt:'*A*'});st.auto.x=st.auto.y=true;list();render();});
window.addEventListener('resize',()=>render());
st.series=sample();setAx({xt:'*λ* / nm',yt:'*A*'});list();render();
})();
