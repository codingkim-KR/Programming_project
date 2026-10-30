/** Chapter 1 canonical X/Z attack geometry. Damage is external to this renderer.
 * Angles: radians; angle 0 points +X; +PI/2 points +Z. World units: 1T = 1.
 * hitTest uses the same triangle mesh supplied to the renderer.
 */
export const ATTACKS = Object.freeze({
  'B1-1': {name:'어둠의 탄환', damage:14, telegraphSeconds:.95, cooldownSeconds:3.5, width:.7, defense:'reflectable'},
  'B1-2': {name:'화염 고리', damage:20, telegraphSeconds:1.4, cooldownSeconds:8, outerRadius:5, safeGapRadians:Math.PI/2, defense:'unblockable', burn:{damagePerTick:2,ticks:3}},
  'B1-3': {name:'거울의 그림자선', damage:18, telegraphSeconds:1.2, cooldownSeconds:7, simultaneousLines:1, linesTotal:2, defense:'guardable', manaLoss:4},
  'B1-4': {name:'절박한 돌진', damage:25, telegraphSeconds:1.6, cooldownSeconds:10, length:6, defense:'unblockable', knockback:2},
  'MB1-1': {name:'곤봉 내려찍기', damage:22, telegraphSeconds:1.6, cooldownSeconds:5, radius:2.5, defense:'unblockable', knockback:2},
  'MB1-2': {name:'넓은 휩쓸기', damage:16, telegraphSeconds:1.3, cooldownSeconds:6, radius:4, arcRadians:Math.PI, defense:'guardable'}
});
export const WARNING_STYLE = Object.freeze({
  reflectable:{color:'#6cc7ff',pattern:'blue_circle',icon:'reflectable.png'},
  guardable:{color:'#e9bf52',pattern:'yellow_cog',icon:'guardable.png'},
  unblockable:{color:'#f36d67',pattern:'red_diagonal',icon:'unblockable.png'}
});
const TAU=Math.PI*2, EPS=1e-9;
const finite=(n,name)=>{if(!Number.isFinite(n))throw new TypeError(name+' must be finite');return n;};
const positive=(n,name)=>{finite(n,name);if(n<=0)throw new RangeError(name+' must be > 0');return n;};
const point=(p,name='point')=>{if(!Array.isArray(p)||p.length!==2)throw new TypeError(name+' must be [x,z]');return p.map((n,i)=>finite(n,name+i));};
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
function mesh(vertices,triangles,boundaries,meta={}){return {vertices,triangles,boundaries,...meta};}
export function sectorMesh({center=[0,0],outerRadius,innerRadius=0,startAngle=0,sweepAngle=TAU,segments=96}) {
  center=point(center);positive(outerRadius,'outerRadius');finite(innerRadius,'innerRadius');finite(startAngle,'startAngle');positive(sweepAngle,'sweepAngle');
  if(innerRadius<0||innerRadius>=outerRadius||sweepAngle>TAU+EPS)throw new RangeError('Invalid ring/sector dimensions');
  if(!Number.isInteger(segments)||segments<8||segments>512)throw new RangeError('segments must be 8..512');
  const n=Math.max(2,Math.ceil(segments*sweepAngle/TAU)),v=[],t=[],outer=[],inner=[];
  for(let i=0;i<=n;i++){const a=startAngle+sweepAngle*i/n;outer.push([center[0]+Math.cos(a)*outerRadius,center[1]+Math.sin(a)*outerRadius]);}
  if(innerRadius===0){v.push(center,...outer);for(let i=0;i<n;i++)t.push([0,i+1,i+2]);return mesh(v,t,[sweepAngle>=TAU-EPS?outer:[center,...outer]],{shape:'sector',center,outerRadius,innerRadius,startAngle,sweepAngle});}
  for(let i=0;i<=n;i++){const a=startAngle+sweepAngle*i/n;inner.push([center[0]+Math.cos(a)*innerRadius,center[1]+Math.sin(a)*innerRadius]);v.push(outer[i],inner[i]);}
  for(let i=0;i<n;i++){const k=i*2;t.push([k,k+2,k+1],[k+1,k+2,k+3]);}
  return mesh(v,t,[outer.concat([...inner].reverse())],{shape:'ring_sector',center,outerRadius,innerRadius,startAngle,sweepAngle});
}
export function lineMesh({start,end,width}) {
  start=point(start,'start');end=point(end,'end');positive(width,'width');const dx=end[0]-start[0],dz=end[1]-start[1],length=Math.hypot(dx,dz);positive(length,'line length');
  const nx=-dz/length*width/2,nz=dx/length*width/2;
  const v=[[start[0]+nx,start[1]+nz],[end[0]+nx,end[1]+nz],[end[0]-nx,end[1]-nz],[start[0]-nx,start[1]-nz]];
  return mesh(v,[[0,1,2],[0,2,3]],[v],{shape:'line',start,end,width});
}
export function pointInMesh(m,p) {
  point(p);return m.triangles.some(ids=>{const [a,b,c]=ids.map(i=>m.vertices[i]),u=cross(a,b,p),v=cross(b,c,p),w=cross(c,a,p);return (u>=-EPS&&v>=-EPS&&w>=-EPS)||(u<=EPS&&v<=EPS&&w<=EPS);});
}
function distanceSegment(p,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],l=dx*dx+dz*dz;const t=l===0?0:Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/l));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz);}
export function diskIntersectsMesh(m,center,radius=0) {
  point(center);finite(radius,'radius');if(radius<0)throw new RangeError('radius must be >= 0');
  if(pointInMesh(m,center))return true;if(radius===0)return false;
  return m.triangles.some(ids=>{const vs=ids.map(i=>m.vertices[i]);return vs.some((a,i)=>distanceSegment(center,a,vs[(i+1)%3])<=radius+EPS);});
}
export function buildAttackGeometry(id,params={}) {
  const attack=ATTACKS[id];if(!attack)throw new RangeError('Unknown attack '+id);let m;
  const center=params.center??[0,0],direction=finite(params.direction??0,'direction');
  if(id==='B1-1'){
    // Collision calls pass previous/current projectile positions for ONE simulation step.
    // A full aim trajectory is warning-only (active:false), never an instantaneous beam.
    m={...lineMesh({start:params.start,end:params.end,width:attack.width}),collisionSemantics:'swept_projectile_previous_to_current'};
  }
  else if(id==='B1-2'){
    // Thickness is not specified by campaign v1. A game configuration must supply it.
    finite(params.innerRadius,'innerRadius (required by gameplay configuration)');
    const gap=finite(params.safeGapCenter??0,'safeGapCenter');m=sectorMesh({center,outerRadius:5,innerRadius:params.innerRadius,startAngle:gap+Math.PI/4,sweepAngle:Math.PI*1.5});
  } else if(id==='B1-3'){
    if(!Array.isArray(params.lines)||params.lines.length!==2)throw new RangeError('Exactly two configured shadow lines required');
    if(params.activeLine!==0&&params.activeLine!==1)throw new RangeError('Exactly one active shadow line: activeLine 0 or 1');
    // Source wording says two floor lines; it does not specify their width or length.
    m=lineMesh(params.lines[params.activeLine]);
  } else if(id==='B1-4'){
    const start=point(center);m=lineMesh({start,end:[start[0]+Math.cos(direction)*6,start[1]+Math.sin(direction)*6],width:params.width});
  } else if(id==='MB1-1')m=sectorMesh({center,outerRadius:2.5});
  else m=sectorMesh({center,outerRadius:4,startAngle:direction-Math.PI/2,sweepAngle:Math.PI});
  return {...m,attackId:id,attack,style:WARNING_STYLE[attack.defense],renderLayer:'world_telegraph_above_particles_below_ui'};
}
export function attackPhase(id,elapsedSeconds,activeDurationSeconds) {
  const a=ATTACKS[id];if(!a)throw new RangeError('Unknown attack');finite(elapsedSeconds,'elapsedSeconds');positive(activeDurationSeconds,'activeDurationSeconds required from gameplay');
  if(elapsedSeconds<0)return {phase:'pending',progress:0,active:false};
  if(elapsedSeconds<a.telegraphSeconds)return {phase:'warning',progress:elapsedSeconds/a.telegraphSeconds,active:false};
  if(elapsedSeconds<a.telegraphSeconds+activeDurationSeconds)return {phase:'active',progress:1,active:true};
  return {phase:'finished',progress:1,active:false};
}
export function hitTest(m,entityCenter,entityRadius,{active=false}={}){return active&&diskIntersectsMesh(m,entityCenter,entityRadius);}
export function drawTelegraph2D(ctx,m,project,{progress=1,active=false}={}) {
  // project accepts [x, y, z]. Render geometry is the exact same mesh as hitTest.
  ctx.save();ctx.beginPath();
  for(const tri of m.triangles){const pts=tri.map(i=>project([m.vertices[i][0],.025,m.vertices[i][1]]));ctx.moveTo(...pts[0]);ctx.lineTo(...pts[1]);ctx.lineTo(...pts[2]);ctx.closePath();}
  ctx.fillStyle=m.style?.color??'#f36d67';ctx.globalAlpha=active?.48:.12+.17*Math.max(0,Math.min(1,progress));ctx.fill();
  // Red diagonal hatching, yellow cogs and blue circles remain distinguishable without color.
  ctx.save();ctx.clip();ctx.strokeStyle=m.style?.color??'#f36d67';ctx.globalAlpha=.5;ctx.lineWidth=1;
  const projected=m.vertices.map(p=>project([p[0],.025,p[1]])),xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys),height=hiY-loY;
  if(m.style?.pattern==='red_diagonal')for(let x=loX-height;x<hiX;x+=12){ctx.beginPath();ctx.moveTo(x,loY);ctx.lineTo(x+height,hiY);ctx.stroke();}
  else for(let x=loX+8;x<hiX;x+=24)for(let y=loY+8;y<hiY;y+=24){ctx.beginPath();if(m.style?.pattern==='yellow_cog'){for(let k=0;k<16;k++){const a=k*Math.PI/8,r=k%2?3:5;k?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+r,y);}ctx.closePath();}else ctx.arc(x,y,3,0,TAU);ctx.stroke();}
  ctx.restore();ctx.globalAlpha=.95;ctx.strokeStyle=m.style?.color??'#f36d67';ctx.lineWidth=2;
  for(const boundary of m.boundaries){ctx.beginPath();boundary.forEach((p,i)=>{const v=project([p[0],.03,p[1]]);i?ctx.lineTo(...v):ctx.moveTo(...v);});ctx.closePath();ctx.stroke();}
  ctx.restore();
}
