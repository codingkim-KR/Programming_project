import { createActorSprites, actorKind } from './pixel-sprites.js';
import { createPropSprites } from './pixel-props.js';
import { attackContains, entityBlocks } from './core/engine.js';
import { paintGround, environmentSprites, floorContains } from './pixel-terrain.js';

export const WORLD_PIXEL = 16;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function pixelViewport(width,height) {
  const scale=Math.max(1,Math.floor(Math.min(width/384,height/240)));
  return {width:Math.max(1,Math.floor(width/scale)),height:Math.max(1,Math.floor(height/scale)),scale};
}
export function facingDirection(angle=0) {
  return ['down','right','up','left'][((Math.round(angle/(Math.PI/2))%4)+4)%4];
}
const makeCanvas=()=>document.createElement('canvas');
function pixelDisc(ctx,x,y,r,color,outline=null) {
  x=Math.round(x);y=Math.round(y);r=Math.max(1,Math.round(r));ctx.fillStyle=color;
  for(let row=-r;row<=r;row++){
    const half=Math.floor(Math.sqrt(Math.max(0,r*r-row*row)));
    if(outline){ctx.fillStyle=outline;ctx.fillRect(x-half,y+row,half*2+1,1);ctx.fillStyle=color;if(half>1&&Math.abs(row)<r-1)ctx.fillRect(x-half+2,y+row,half*2-3,1);}
    else ctx.fillRect(x-half,y+row,half*2+1,1);
  }
}
function pixelLine(ctx,x1,y1,x2,y2,color,width=1) {
  let x=Math.round(x1),y=Math.round(y1);x2=Math.round(x2);y2=Math.round(y2);
  const dx=Math.abs(x2-x),sx=x<x2?1:-1,dy=-Math.abs(y2-y),sy=y<y2?1:-1;let err=dx+dy;
  ctx.fillStyle=color;for(let limit=0;limit<4000;limit++){ctx.fillRect(x-Math.floor(width/2),y-Math.floor(width/2),width,width);if(x===x2&&y===y2)break;const e2=2*err;if(e2>=dy){err+=dy;x+=sx;}if(e2<=dx){err+=dx;y+=sy;}}
}
function pixelOval(ctx,x,y,w,h,color) {
  ctx.fillStyle=color;for(let row=0;row<h;row++){const half=Math.floor(w/2*Math.sqrt(Math.max(0,1-((row-h/2)/(h/2))**2)));ctx.fillRect(Math.round(x)-half,Math.round(y)+row-Math.floor(h/2),half*2,1);}
}
export const warningContains=(attack,x,z)=>attackContains(attack,x,z);

// Tile the actual collision footprint rather than drawing one small bush at
// its centre. Each tile gets its own depth so actors can walk behind its edge.
export function barrierTiles(entity) {
  const {w,d}=entity.blocking||{};
  if(!(w>0&&d>0))return [];
  const columns=Math.ceil(w),rows=Math.ceil(d),tiles=[];
  for(let row=0;row<rows;row++)for(let column=0;column<columns;column++){
    tiles.push({x:entity.x-w/2+(column+.5)*w/columns,z:entity.z-d/2+(row+1)*d/rows});
  }
  return tiles;
}

/** Actual top-down 2D pixel art. No GLB, WebGL, Three.js or image downsampling. */
export class PixelWorldRenderer {
  constructor(canvas,{canvasFactory=makeCanvas}={}) {
    this.canvas=canvas;this.context=canvas.getContext('2d',{alpha:false});
    if(!this.context)throw new Error('2D 게임 화면을 만들 수 없습니다.');
    this.makeCanvas=canvasFactory;this.actors=createActorSprites(canvasFactory);this.props=createPropSprites(canvasFactory);
    this.mode='pixel-2d';this.quality='pixel';this.camera={x:0,z:0};this.elapsed=0;this.castUntil=-1;this.hitUntil=-1;
    this.warningCache=new Map();this.assetStatus={state:'ready',loaded:0,total:0,failed:[]};this.assetsReady=Promise.resolve(this.assetStatus);this.disposed=false;
    this.resize();
  }
  resize(){
    const parent=this.canvas.parentElement;
    const width=Math.max(1,parent?.clientWidth||this.canvas.clientWidth||768),height=Math.max(1,parent?.clientHeight||this.canvas.clientHeight||480);
    if(this.outerWidth===width&&this.outerHeight===height)return;
    this.outerWidth=width;this.outerHeight=height;const v=pixelViewport(width,height);Object.assign(this,{width:v.width,height:v.height,pixelScale:v.scale});
    this.canvas.width=v.width;this.canvas.height=v.height;
    Object.assign(this.canvas.style,{position:'absolute',width:`${v.width*v.scale}px`,height:`${v.height*v.scale}px`,left:`${Math.floor((width-v.width*v.scale)/2)}px`,top:`${Math.floor((height-v.height*v.scale)/2)}px`,transform:'none',imageRendering:'pixelated',objectFit:'fill'});
    this.context.imageSmoothingEnabled=false;
  }
  loadScene(scene){
    if(this.ground){this.ground.width=1;this.ground.height=1;}
    this.sceneData=scene;this.world=null;this.warningCache.clear();this.warningBlockers=scene.blockers;this.warningBarrierKey='';this.warningBarriers=[];this.elapsed=0;this.castUntil=-1;this.hitUntil=-1;this.previousHp=null;this.positions=new Map();
    this.ground=this.makeCanvas();this.margin=6*WORLD_PIXEL;
    this.ground.width=Math.ceil(scene.width*WORLD_PIXEL+2*this.margin);this.ground.height=Math.ceil(scene.depth*WORLD_PIXEL+2*this.margin);
    const ctx=this.ground.getContext('2d');ctx.imageSmoothingEnabled=false;ctx.translate(this.margin,this.margin);paintGround(ctx,scene,WORLD_PIXEL);
    this.environment=environmentSprites(scene,WORLD_PIXEL);
    this.camera.x=scene.spawn.x;this.camera.z=scene.spawn.z;this.setCamera(scene.spawn);
    this.assetStatus={state:'ready',loaded:1,total:1,failed:[]};this.assetsReady=Promise.resolve(this.assetStatus);
  }
  setCamera(player){
    const scene=this.sceneData;if(!scene)return;
    const halfW=this.width/WORLD_PIXEL/2,halfH=this.height/WORLD_PIXEL/2;
    const fit=(v,size,half)=>size<half*2?size/2:clamp(v,half-1,size-half+1);
    const boss=this.world?.entities.find(e=>['basilisk','dragon','bellatrix','snape','draco'].includes(e.kind)&&e.active!==false&&!e.hidden&&!e.locked&&Math.hypot(e.x-player.x,e.z-player.z)<14);
    const framing=boss?clamp((14-Math.hypot(boss.x-player.x,boss.z-player.z))/5,0,1):0;
    const focusX=player.x+(boss?boss.x-player.x:0)*.25*framing,focusZ=player.z+(boss?boss.z-player.z:0)*.25*framing-.7*framing;
    this.camera.x=Math.round(fit(focusX,scene.width,halfW)*WORLD_PIXEL)/WORLD_PIXEL;
    this.camera.z=Math.round(fit(focusZ,scene.depth,halfH)*WORLD_PIXEL)/WORLD_PIXEL;
    this.originX=Math.round(this.width/2-this.camera.x*WORLD_PIXEL);this.originY=Math.round(this.height/2-this.camera.z*WORLD_PIXEL);
  }
  project(x,z,height=0){
    const px=Math.round(x*WORLD_PIXEL)+(this.originX||0),py=Math.round(z*WORLD_PIXEL-height*WORLD_PIXEL)+(this.originY||0);
    return {x:px/this.width,y:py/this.height,visible:px>=-16&&px<=this.width+16&&py>=-48&&py<=this.height+48};
  }
  setDialogueSpeaker(speaker){this.dialogueSpeaker=speaker;}
  setTypingInput(text){this.typing=!!text;}
  setCastFeedback(){this.castUntil=this.elapsed+.5;}
  sprite(sprite,x,y){if(!sprite?.canvas)return;this.context.drawImage(sprite.canvas,Math.round(x-sprite.anchorX),Math.round(y-sprite.anchorY));}
  drawActor(entity,player=false){
    const ctx=this.context,t=this.elapsed,x=Math.round(entity.x*WORLD_PIXEL),y=Math.round(entity.z*WORLD_PIXEL);
    if(!player&&entity.spawnUntil>t){
      // A brief web ripple announces reinforcements before they can attack.
      const radius=7+Math.floor((1.2-Math.min(1.2,entity.spawnUntil-t))*5);
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,b=(i+1)*Math.PI/4;
        pixelLine(ctx,x+Math.cos(a)*radius,y+Math.sin(a)*radius*.55,x+Math.cos(b)*radius,y+Math.sin(b)*radius*.55,'#adbf9a');
        pixelLine(ctx,x,y,x+Math.cos(a)*radius,y+Math.sin(a)*radius*.55,'#667c62');
      }
      ctx.fillStyle='#d9d9ac';ctx.fillRect(x-3,y-2,2,2);ctx.fillRect(x+2,y-2,2,2);return;
    }
    let angle=entity.facing||0;
    if(!player&&this.world?.player&&entity.attackState!=='windup')angle=Math.atan2(this.world.player.x-entity.x,this.world.player.z-entity.z);
    const previous=this.positions.get(entity.id),moving=player?entity.moving:previous&&Math.hypot(entity.x-previous.x,entity.z-previous.z)>.0001;
    if(!player)this.positions.set(entity.id,{x:entity.x,z:entity.z});
    let pose=entity.hp<=0?'down':entity.attackState==='stunned'?'hit':entity.hitUntil>t?'hit':entity.attackState==='windup'?'attack':entity.attackState==='recover'?'cast':'idle';
    if(player)pose=entity.hp<=0?'down':t<this.hitUntil?'hit':entity.guarding?'guard':t<this.castUntil?'cast':this.typing?'cast':this.dialogueSpeaker==='해리'?'talk':'idle';
    else if(entity.type==='npc'&&this.dialogueSpeaker&&entity.name?.includes(this.dialogueSpeaker))pose='talk';
    if(pose==='idle'&&moving)pose='walk';if(!player&&entity.pose)pose=entity.pose;
    const kind=player?'harry':actorKind(entity),sprite=this.actors.get(kind,{direction:facingDirection(angle),frame:moving?Math.floor(t*9)%3:Math.floor(t*2)%2,pose,variant:kind==='basilisk'&&entity.phase>1?'blind':'normal'});
    const car=player&&this.sceneData.theme==='flight'&&this.sceneData.layout?.vehicle==='car';
    pixelOval(ctx,x,y+1,car?52:['basilisk','dragon'].includes(kind)?66:player?14:entity.kind==='troll'?28:15,car?8:5,'#192c38');
    if(car){this.sprite(this.props.get({kind:'car'}),x,y-9);return;}
    const lift=player&&(entity.flying||this.sceneData.theme==='flight')?9:0;
    if(lift){pixelLine(ctx,x-14,y-2,x+14,y-2,'#422b32',3);ctx.fillStyle='#bd8146';ctx.fillRect(x+9,y-6,9,8);ctx.fillStyle='#e6bf70';ctx.fillRect(x+10,y-5,9,2);}
    this.sprite(sprite,x,y-lift);
    if(entity.type==='npc'){const bob=Math.floor(t*2)%2;ctx.fillStyle='#fff0a0';ctx.fillRect(x-1,y-sprite.h-8-bob,3,4);ctx.fillRect(x-1,y-sprite.h-2-bob,3,1);}
    if(player&&entity.poisonUntil>t){const rise=Math.floor(t*4)%3;ctx.fillStyle='#b5d76b';ctx.fillRect(x-8,y-13-rise*3,2,3);ctx.fillRect(x+7,y-9-rise*3,2,3);ctx.fillStyle='#6c8c3e';ctx.fillRect(x-6,y+3,12,1);}
    if(player&&entity.petrifiedUntil>t){ctx.globalAlpha=.55;ctx.fillStyle='#d5ded6';for(let j=0;j<5;j++)ctx.fillRect(x-6,y-22+j*4,12,2);ctx.globalAlpha=1;ctx.fillStyle='#e1e4d3';ctx.fillRect(x-2,y-34,5,4);ctx.fillRect(x-1,y-29,3,3);}
    if(player&&entity.disarmedUntil>t){pixelLine(ctx,x-6,y-34,x+6,y-26,'#df9a92',2);pixelLine(ctx,x+6,y-34,x-6,y-26,'#df9a92',2);}
    if(player&&entity.guarding){ctx.globalAlpha=.15;pixelOval(ctx,x,y-12,24,28,'#3b91aa');ctx.globalAlpha=1;pixelLine(ctx,x-11,y-7,x-12,y-17,'#a5f6e0',2);pixelLine(ctx,x-12,y-17,x-7,y-24,'#a5f6e0',2);pixelLine(ctx,x+9,y-8,x+12,y-17,'#a5f6e0',2);pixelLine(ctx,x+12,y-17,x+8,y-23,'#a5f6e0',2);}
  }
  drawWarning(a){
    const ctx=this.context,r=a.radius||1,unit=WORLD_PIXEL;
    const line=a.shape==='line'&&a.kind!=='bolt';
    const minX=Math.floor((line?Math.min(a.x,a.originX)-r:a.x-r)*unit),maxX=Math.ceil((line?Math.max(a.x,a.originX)+r:a.x+r)*unit);
    const minY=Math.floor((line?Math.min(a.z,a.originZ)-r:a.z-r)*unit),maxY=Math.ceil((line?Math.max(a.z,a.originZ)+r:a.z+r)*unit);
    const color=a.lethal?'#90ff87':a.kind==='gaze'?'#efd56b':a.kind==='pool'?'#b3ce6c':a.blockable?'#68d5dd':'#ff8761',progress=clamp(1-a.ttl/(a.duration||1),0,1);
    if(a.kind==='bolt'){
      ctx.globalAlpha=.45;pixelLine(ctx,a.originX*unit,a.originZ*unit,a.x*unit,a.z*unit,color,3);ctx.globalAlpha=1;return;
    }
    this.warningBarriers=(this.world?.entities||[]).filter(entityBlocks);
    const barrierKey=this.warningBarriers.map(e=>[e.id,e.x,e.z,e.blocking.w,e.blocking.d].join(',')).join('|');
    if(this.warningBlockers!==this.sceneData.blockers||this.warningBarrierKey!==barrierKey){this.warningCache.clear();this.warningBlockers=this.sceneData.blockers;this.warningBarrierKey=barrierKey;}
    const key=[a.shape,a.kind,a.x,a.z,a.originX,a.originZ,a.radius,a.angle,a.arc].join('|');
    let pixels=this.warningCache.get(key);
    if(!pixels){
      pixels=[];
      for(let y=minY;y<=maxY;y+=2)for(let x=minX;x<=maxX;x+=2){
        if(!warningContains(a,x/unit,y/unit))continue;
        if((a.shape==='cone'||a.lethal)&&!this.warningLineClear({x:a.originX,z:a.originZ},{x:x/unit,z:y/unit}))continue;
        const edge=!warningContains(a,(x-2)/unit,y/unit)||!warningContains(a,(x+2)/unit,y/unit)||!warningContains(a,x/unit,(y-2)/unit)||!warningContains(a,x/unit,(y+2)/unit);
        if(edge||(Math.floor(x/4)+Math.floor(y/4))%4===0)pixels.push({x,y,edge});
      }
      this.warningCache.set(key,pixels);if(this.warningCache.size>12)this.warningCache.delete(this.warningCache.keys().next().value);
    }
    ctx.fillStyle=color;
    for(const {x,y,edge} of pixels){
      if(x+this.originX<0||x+this.originX>this.width||y+this.originY<0||y+this.originY>this.height)continue;
      ctx.globalAlpha=edge?1:.2+progress*.25;ctx.fillRect(x,y,2,2);
    }
    ctx.globalAlpha=1;const x=Math.round(a.x*unit),y=Math.round(a.z*unit);ctx.fillStyle='#fff2b2';ctx.fillRect(x-1,y-6,2,7);ctx.fillRect(x-1,y+3,2,2);
  }
  warningLineClear(a,b){
    // Match the engine's 0.3T sight samples so pillars cut a visible safe shadow.
    const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.3)),scene=this.sceneData;
    for(let i=1;i<steps;i++){
      const f=i/steps,x=a.x+(b.x-a.x)*f,z=a.z+(b.z-a.z)*f;
      if(x<0||z<0||x>scene.width||z>scene.depth||!floorContains(scene,x,z))return false;
      if((scene.blockers||[]).some(q=>x>q.x-q.w/2&&x<q.x+q.w/2&&z>q.z-q.d/2&&z<q.z+q.d/2))return false;
      if((this.warningBarriers||[]).some(e=>x>e.x-e.blocking.w/2&&x<e.x+e.blocking.w/2&&z>e.z-e.blocking.d/2&&z<e.z+e.blocking.d/2))return false;
    }
    return true;
  }
  drawHazards(world){
    const ctx=this.context;
    for(const h of world.hazards||[]){
      if(!(h.ttl>0))continue;
      const radius=Math.round(h.radius*WORLD_PIXEL),cx=Math.round(h.x*WORLD_PIXEL),cy=Math.round(h.z*WORLD_PIXEL);
      const fade=Math.min(1,h.ttl/.6);ctx.globalAlpha=.55*fade;
      pixelDisc(ctx,cx,cy,radius,'#4a6847','#b5ce64');ctx.globalAlpha=fade;
      for(let y=-radius;y<=radius;y+=6)for(let x=-radius;x<=radius;x+=6){
        if(x*x+y*y>(radius-2)**2||((x+y+Math.floor(this.elapsed*2)*6)/6)%3!==0)continue;
        ctx.fillStyle='#95b853';ctx.fillRect(cx+x,cy+y,2,2);ctx.fillStyle='#c9db83';ctx.fillRect(cx+x,cy+y,1,1);
      }
      ctx.globalAlpha=1;
    }
  }
  drawMagic(world){
    const ctx=this.context,t=this.elapsed;
    for(const p of world.projectiles||[]){const x=p.x*WORLD_PIXEL,y=p.z*WORLD_PIXEL-7,color=p.color||(p.enemy?'#d58bdf':'#b9a3ff');
      const len=Math.hypot(p.vx,p.vz)||1;pixelLine(ctx,x-p.vx/len*8,y-p.vz/len*8,x,y,color,3);pixelDisc(ctx,x,y,3,'#fff5cf',color);}
    for(const marker of [world.zone,...(world.delayedMagic||[])].filter(Boolean)){
      ctx.fillStyle=marker.color||'#83cfd7';const r=(marker.radius||5)*16;for(let i=0;i<64;i++){const a=i*Math.PI/32;ctx.fillRect(Math.round(marker.x*16+Math.cos(a)*r),Math.round(marker.z*16+Math.sin(a)*r),2,2);}
    }
    for(const e of world.effects||[]){
      if(e.from)pixelLine(ctx,e.from.x*16,e.from.z*16-7,e.x*16,e.z*16-7,e.color,2);
      const progress=clamp(1-e.ttl/(e.duration||.7),0,1),radius=5+progress*16,x=e.x*WORLD_PIXEL,y=e.z*WORLD_PIXEL-6;
      const color=e.color||'#fff0a0';ctx.globalAlpha=1-progress*.7;
      for(let i=0;i<8;i++){const angle=i*Math.PI/4+(e.kind==='levitate'?t:0),sx=Math.round(x+Math.cos(angle)*radius),sy=Math.round(y+Math.sin(angle)*radius);ctx.fillStyle=color;ctx.fillRect(sx-1,sy-3,2,6);ctx.fillRect(sx-3,sy-1,6,2);}
      ctx.globalAlpha=1;
    }
  }
  render(world){
    if(this.disposed||!this.sceneData||!world)return;this.resize();this.world=world;this.elapsed=world.time||0;
    if(this.previousHp!==null&&world.player.hp<this.previousHp)this.hitUntil=this.elapsed+.35;this.previousHp=world.player.hp;
    this.setCamera(world.player);const ctx=this.context;ctx.imageSmoothingEnabled=false;ctx.globalAlpha=1;
    ctx.fillStyle=['forest','garden','flight'].includes(this.sceneData.theme)?'#172e36':this.sceneData.theme==='coast'?'#21445a':'#171f33';ctx.fillRect(0,0,this.width,this.height);
    ctx.save();ctx.translate(this.originX,this.originY);ctx.drawImage(this.ground,-this.margin,-this.margin);
    const exit=this.sceneData.exit;if(exit){const x=exit.x*16,y=exit.z*16;ctx.fillStyle='#263d47';ctx.fillRect(x-11,y-9,22,18);ctx.strokeStyle='#eccd83';ctx.lineWidth=1;ctx.strokeRect(Math.round(x)-10.5,Math.round(y)-8.5,21,17);ctx.fillStyle='#ffe9a4';const a=Math.floor(this.elapsed*2)%2;ctx.fillRect(x-1,y-5-a,3,9);ctx.fillRect(x-4,y-5-a,9,2);}
    for(const point of world.trail||[]){ctx.fillStyle='#cba756';ctx.fillRect(point.x*16-1,point.z*16-1,2,2);}
    this.drawHazards(world);
    for(const a of world.telegraphs||[])this.drawWarning(a);
    const draws=this.environment.map(s=>({z:s.z,x:s.x,draw:()=>s.draw(ctx,Math.round(s.x*16),Math.round(s.z*16))}));
    for(const entity of world.entities||[]){if(entity.active===false||entity.hidden)continue;
      if(entity.blocking){
        const sprite=this.props.get({...entity,kind:entity.kind==='vines'?'brush':entity.kind},this.elapsed);
        for(const tile of barrierTiles(entity))draws.push({...tile,draw:()=>{
          if(entity.kind==='ward-gate'){
            const x=Math.round(tile.x*16),y=Math.round(tile.z*16),broken=entity.destroyed||entity.visualState==='broken';
            ctx.fillStyle=broken?'#56616d':'#303c54';ctx.fillRect(x-8,y-(broken?2:13),16,broken?3:16);
            if(!broken){ctx.fillStyle=entity.visualState==='damaged'?'#a9a0c8':'#a3b3e2';ctx.fillRect(x-6,y-12,12,2);ctx.fillRect(x-2,y-9,3,9);if(entity.visualState==='damaged'){ctx.fillStyle='#303c54';ctx.fillRect(x-5,y-9,3,8);}}
          }else if(entity.kind==='machine'){
            const x=Math.round(tile.x*16),y=Math.round(tile.z*16);
            ctx.fillStyle=entity.activated?'#5f6566':'#343e4b';ctx.fillRect(x-8,y-(entity.activated?2:14),16,entity.activated?3:16);
            if(!entity.activated){ctx.fillStyle='#91928b';ctx.fillRect(x-7,y-13,14,6);ctx.fillRect(x-7,y-6,6,6);ctx.fillRect(x,y-6,7,6);}
          }else this.sprite(sprite,tile.x*16,tile.z*16);
        }});
        continue;
      }
      if(entity.x*16+this.originX<-120||entity.x*16+this.originX>this.width+120||entity.z*16+this.originY<-120||entity.z*16+this.originY>this.height+120)continue;
      const actor=['npc','enemy','boss'].includes(entity.type);
      draws.push({z:entity.z,x:entity.x,draw:()=>{
        if(world.targetId===entity.id){
          ctx.fillStyle='#fff1a8';
          if(entity.kind==='basilisk'){const radius=(entity.radius||1.7)*16;for(let n=0;n<32;n++){const a=n*Math.PI/16;ctx.fillRect(Math.round(entity.x*16+Math.cos(a)*radius),Math.round(entity.z*16+Math.sin(a)*radius),1,1);}}
          else ctx.fillRect(Math.round(entity.x*16)-10,Math.round(entity.z*16)+2,20,2);
        }
        if(actor)this.drawActor(entity);else {const sprite=this.props.get(entity,this.elapsed);this.sprite(sprite,entity.x*16,entity.z*16);}
      }});
    }
    for(const ally of [world.guardian,world.decoy].filter(Boolean))draws.push({z:ally.z,x:ally.x,draw:()=>{ctx.globalAlpha=ally===world.decoy?.55:1;this.drawActor({...ally,id:ally===world.decoy?'temporary.decoy':'temporary.guardian'});ctx.globalAlpha=1;}});
    draws.push({z:world.player.z,x:world.player.x,draw:()=>this.drawActor(world.player,true)});
    draws.sort((a,b)=>a.z-b.z||a.x-b.x);for(const item of draws){if(item.x*16+this.originX<-200||item.x*16+this.originX>this.width+200||item.z*16+this.originY<-160||item.z*16+this.originY>this.height+160)continue;item.draw();}
    const p=world.player,t=world.time;
    if(p.patronusUntil>t){const x=p.x*16,y=p.z*16;ctx.fillStyle='#b9edff';for(let i=0;i<24;i++){const a=i*Math.PI/12+t*.5;ctx.fillRect(Math.round(x+Math.cos(a)*31),Math.round(y+Math.sin(a)*18),2,2);}ctx.fillStyle='#e6fbff';ctx.fillRect(x+18,y-20,10,4);ctx.fillRect(x+24,y-27,4,8);ctx.fillRect(x+19,y-17,2,7);ctx.fillRect(x+26,y-17,2,7);ctx.fillRect(x+23,y-32,2,6);ctx.fillRect(x+28,y-32,2,7);}
    if(p.birdsUntil>t)for(let i=0;i<(p.birds||0);i++){const a=t*2+i*Math.PI*2/3,x=Math.round(p.x*16+Math.cos(a)*18),y=Math.round(p.z*16-23+Math.sin(a)*7);ctx.fillStyle='#f3d485';ctx.fillRect(x-3,y,7,2);ctx.fillRect(x,y-2,2,4);}
    for(const v of world.vortices||[]){ctx.strokeStyle='#b5eadb';ctx.lineWidth=1;ctx.strokeRect(Math.round(v.x*16)-15,Math.round(v.z*16)-15,30,30);}
    this.drawMagic(world);ctx.restore();
  }
  dispose(){this.disposed=true;this.actors.clear?.();this.props.clear?.();if(this.ground){this.ground.width=1;this.ground.height=1;}this.environment=[];this.positions?.clear();this.warningCache.clear();}
}
