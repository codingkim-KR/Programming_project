/** Deterministic, engine-independent visual effects. Contains NO damage logic.
 * Positions are [x,y,z], units T, +Y up. Draw before attack warnings and UI.
 */
export const MAGIC_PRESETS=Object.freeze({
  arcane:{assetId:'FX_ARCANE',colors:['#f6ecff','#b990ff','#6557de'],shape:'diamond'},
  fire:{assetId:'FX_FIRE',colors:['#fff3b5','#ffc759','#ef793a'],shape:'flame'},
  waterice:{assetId:'FX_WATERICE',colors:['#eefaff','#a5e6ff','#58b8d7'],shape:'shard'},
  ward:{assetId:'FX_WARD',colors:['#e8ffff','#93e0f0','#5b9ddb'],shape:'ring'},
  curse:{assetId:'FX_CURSE',colors:['#e8c4ff','#aa60d8','#553169'],shape:'diamond'},
  memory:{assetId:'FX_MEMORY',colors:['#fff5cb','#eed186','#c69c52'],shape:'spark'}
});
export const ENVIRONMENT_PRESETS=Object.freeze({
  dust:{count:28,color:'#d6c2a0',maxOpacity:.16},fog:{count:8,color:'#a2b0c0',maxOpacity:.06},
  snow:{count:48,color:'#dcedf4',maxOpacity:.6},rain:{count:56,color:'#9bc4db',maxOpacity:.35},ripple:{count:8,color:'#91c8dc',maxOpacity:.3}
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(n,m)=>((n%m)+m)%m;
function rng(seed){let x=seed>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
function vec(v,name){if(!Array.isArray(v)||v.length!==3||v.some(x=>!Number.isFinite(x)))throw new TypeError(name+' must be finite [x,y,z]');return [...v];}
export function createMagicEffect(family,role,options={}) {
  if(!MAGIC_PRESETS[family])throw new RangeError('Unknown magic family');
  if(!['projectile','impact','residue'].includes(role))throw new RangeError('Unknown effect role');
  const duration=options.duration??(role==='impact'?8/12:role==='residue'?2.4:1);
  if(!Number.isFinite(duration)||duration<=0)throw new RangeError('duration must be > 0');
  const scale=options.scale??1;if(!Number.isFinite(scale)||scale<=0)throw new RangeError('scale must be > 0');
  return {family,role,origin:vec(options.origin??[0,0,0],'origin'),velocity:vec(options.velocity??[0,0,0],'velocity'),seed:options.seed??1,duration,scale,large:options.large??false,quality:clamp(options.quality??1,0,1),renderLayer:'world_particles_below_telegraphs_and_ui',gameplayIndependent:true};
}
export function sampleMagicEffect(effect,ageSeconds) {
  if(!Number.isFinite(ageSeconds))throw new TypeError('ageSeconds must be finite');
  if(ageSeconds<0||ageSeconds>=effect.duration||effect.quality===0)return [];
  const preset=MAGIC_PRESETS[effect.family],rand=rng(effect.seed),out=[],t=ageSeconds/effect.duration;
  const add=(offset,size,opacity,shape,colorIndex=0)=>out.push({position:effect.origin.map((x,i)=>x+offset[i]),size:size*effect.scale,opacity:clamp(opacity,0,.8),shape,color:preset.colors[colorIndex],targetRasterPixels:effect.large?128:64,renderLayer:effect.renderLayer});
  if(effect.role==='projectile'){
    const travel=effect.velocity.map(x=>x*ageSeconds);add(travel,.13,.8,preset.shape);
    const count=Math.ceil(18*effect.quality);
    for(let i=0;i<count;i++){const lag=i/count*.22,jitter=(rand()-.5)*.06;add(travel.map((x,k)=>x-effect.velocity[k]*lag+(k===1?jitter:0)),.035+.07*(1-i/count),.4*(1-i/count),'dot',1);}
  } else if(effect.role==='impact'){
    const count=Math.ceil(28*effect.quality),spread=.1+.65*Math.sin(t*Math.PI/2);
    add([0,.02,0],spread,.3*(1-t),effect.family==='fire'?'flame':'ring',1);
    for(let i=0;i<count;i++){const angle=rand()*Math.PI*2,energy=.4+.6*rand(),height=(rand()-.3)*.45;const radius=spread*energy;
      add([Math.cos(angle)*radius,height*spread,Math.sin(angle)*radius],(.025+.06*energy)*(1-t*.6),(.75-t*.65)*energy,preset.shape,i%3);}
  } else {
    const count=Math.ceil(18*effect.quality),fade=Math.min(1,t*8)*(1-t),height=effect.family==='fire'?.7:.2;
    for(let i=0;i<count;i++){const a=rand()*Math.PI*2,r=rand()*.55,phase=rand(),y=mod(ageSeconds*.45+phase,1)*height;
      add([Math.cos(a)*r,.02+y,Math.sin(a)*r],.04+.035*rand(),fade*.32*(1-y/Math.max(height,.01)),preset.shape,i%3);}
  }
  return out;
}
export function impactFrame(ageSeconds){if(!Number.isFinite(ageSeconds))throw new TypeError('ageSeconds must be finite');return ageSeconds<0||ageSeconds>=8/12?null:Math.floor(ageSeconds*12);}
export function sampleEnvironment(kind,timeSeconds,{center=[0,0,0],size=[12,6,12],density=1,seed=1,wind=[.35,0,.12]}={}) {
  if(!ENVIRONMENT_PRESETS[kind])throw new RangeError('Unknown environment effect');
  vec(center,'center');vec(size,'size');vec(wind,'wind');if(size.some(v=>v<=0))throw new RangeError('size must be positive');
  if(!Number.isFinite(timeSeconds)||!Number.isFinite(density))throw new TypeError('time and density must be finite');
  const cfg=ENVIRONMENT_PRESETS[kind],count=Math.ceil(cfg.count*clamp(density,0,1)),random=rng(seed),out=[];
  for(let i=0;i<count;i++){
    const px=random()*size[0],py=random()*size[1],pz=random()*size[2],phase=random();let x=mod(px+wind[0]*timeSeconds,size[0])-size[0]/2,y=py,z=mod(pz+wind[2]*timeSeconds,size[2])-size[2]/2,shape='dot',scale=.03,alpha=cfg.maxOpacity;
    if(kind==='rain'){y=mod(py-timeSeconds*8,size[1]);shape='line';scale=.35;}
    else if(kind==='snow'){y=mod(py-timeSeconds*.8,size[1]);x+=Math.sin(timeSeconds+phase*6)*.1;scale=.035;}
    else if(kind==='dust'){y=py+Math.sin(timeSeconds*.7+phase*6)*.12;scale=.02;alpha*=.5+.5*Math.sin(timeSeconds*.5+phase*6)**2;}
    else if(kind==='fog'){y=.1+py*.04;shape='fog';scale=1.3;alpha*=.5+.5*Math.sin(timeSeconds*.2+phase*6)**2;}
    else {x=px-size[0]/2;z=pz-size[2]/2;y=.025;shape='ring';const cycle=mod(timeSeconds*.5+phase,1);scale=.05+cycle*.65;alpha*=1-cycle;}
    out.push({position:[center[0]+x,center[1]+y,center[2]+z],size:scale,opacity:alpha,color:cfg.color,shape,renderLayer:'world_particles_below_telegraphs_and_ui'});
  }
  return out;
}
export function drawEffect2D(ctx,particles,project,{pixelsPerT=24}={}) {
  // An adapter for a 640x360 orthographic canvas. 3D engines can consume particles directly.
  ctx.save();for(const p of particles){const [x,y]=project(p.position),r=Math.max(1,p.size*pixelsPerT);ctx.globalAlpha=p.opacity;ctx.fillStyle=p.color;ctx.strokeStyle=p.color;ctx.lineWidth=Math.max(1,r*.12);ctx.beginPath();
    if(p.shape==='ring'){ctx.ellipse(x,y,r,r*.48,0,0,Math.PI*2);ctx.stroke();}
    else if(p.shape==='line'){ctx.moveTo(x,y);ctx.lineTo(x-r*.2,y+r);ctx.stroke();}
    else if(p.shape==='fog'){ctx.ellipse(x,y,r*1.6,r*.33,0,0,Math.PI*2);ctx.fill();}
    else if(['diamond','shard','spark','flame'].includes(p.shape)){const elong=p.shape==='shard'?1.8:p.shape==='flame'?1.4:1;ctx.moveTo(x,y-r*elong);ctx.lineTo(x+r*.6,y);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.6,y);ctx.closePath();ctx.fill();}
    else ctx.fillRect(Math.round(x-r/2),Math.round(y-r/2),Math.ceil(r),Math.ceil(r));
  }ctx.restore();
}
