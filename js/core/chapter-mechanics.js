// Data-driven timed protection, objective bosses and underwater exploration.
const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function updateChapterMechanics(game,dt){
 const {world:w,save,scene}=game,p=w.player,done=id=>save.progress.completedObjectiveIds.includes(id);
 p.flying=scene.theme==='flight'||!!scene.flightAfter&&done(scene.flightAfter);
 w.hold=null;
 for(const rule of scene.holds||[]){
  if(done(rule.id)||!rule.conditions.every(done))continue;
  const target=w.entities.find(e=>e.id===rule.target);if(!target)continue;
  const inside=dist(p,target)<=rule.radius;
  game.holdTimers[rule.id]=(game.holdTimers[rule.id]||0)+(inside?dt:0);
  w.hold={label:rule.name||target.name,remaining:Math.max(0,Math.ceil(rule.duration-game.holdTimers[rule.id])),inside};
  if(game.holdTimers[rule.id]+1e-6>=rule.duration){game.recordEvent('hold',{target:rule.target});target.visualState='spent';w.hold=null;}
  break;
 }
 if(scene.encounter){
  const e=w.entities.find(e=>e.id===scene.encounter.bossId),cleared=scene.encounter.endObjectives.every(done);
  if(e){
   const phase=1+(scene.encounter.phases||[]).filter(ids=>ids.every(done)).length;
   const point=scene.encounter.phasePositions?.[phase-1];
   if(phase!==e.phase&&point&&!cleared){
    w.telegraphs=w.telegraphs.filter(a=>a.ownerId!==e.id);
    w.telegraphs.push({id:`t${++game.sequence}`,ownerId:e.id,x:point.x,z:point.z,originX:e.x,originZ:e.z,kind:'teleport',shape:'circle',radius:1.8,ttl:1.3,duration:1.3,color:'#b9a4dd',damage:0,blockable:false});e.nextAttack=w.time+2.5;
   }
   e.phase=phase;
   e.objectiveProgress=scene.encounter.progress.filter(done).length;e.objectiveTotal=scene.encounter.progress.length;e.progressLabel=scene.encounter.label;
  }
  if(cleared&&game.battleActive){
   for(const foe of w.entities)if(foe.type==='boss'||foe.transient){foe.active=false;foe.hidden=true;}
   w.telegraphs=[];w.projectiles=w.projectiles.filter(b=>!b.enemy);w.hazards=[];
   game.battleActive=false;delete save.checkpoint.battle;game.makeCheckpoint();game.syncSave();game.emit('changed');
  }
 }else if(game.battleActive&&!w.entities.some(e=>e.type==='boss'&&game.available(e))){
  w.telegraphs=[];w.projectiles=w.projectiles.filter(b=>!b.enemy);w.hazards=[];game.battleActive=false;delete save.checkpoint.battle;game.makeCheckpoint();
 }
 if(p.patronusUntil>w.time){
  p.fearUntil=0;
  for(const e of w.entities)if(e.kind==='dementor'&&game.available(e)&&dist(e,p)<13&&game.lineClear(p,e)){
   e.stunnedUntil=w.time+.3;e.nextAttack=Math.max(e.nextAttack,w.time+1);
   w.telegraphs=w.telegraphs.filter(a=>a.ownerId!==e.id);
   const d=Math.max(.01,dist(e,p)),x=e.x+(e.x-p.x)/d*dt*3,z=e.z+(e.z-p.z)/d*dt*3;
   if(game.walkable(x,z,e.radius*.6)){e.x=x;e.z=z;}
  }
 }
 if(p.healUntil>w.time)p.hp=Math.min(p.maxHp,p.hp+p.healRate*dt);
 if(p.healthRegen&&!w.entities.some(e=>['enemy','boss'].includes(e.type)&&game.available(e)&&dist(e,p)<20))p.hp=Math.min(p.maxHp,p.hp+p.healthRegen*dt);
 if(scene.oxygen){
  const max=save.progress.flags['ch04.breathing']==='gilly'?60:90;
  if(p.oxygen===undefined)p.oxygen=max;
  p.maxOxygen=max;
  const air=w.entities.some(e=>e.oxygenZone&&dist(e,p)<=e.oxygenZone);
  p.oxygen=Math.max(0,Math.min(max,p.oxygen+dt*(air?35:-1)));
  if(p.oxygen===0&&w.time>=(p.oxygenTick||0)){p.oxygenTick=w.time+2;game.damagePlayer(8,false);}
 }
 if(scene.weather&&w.time>=(w.weatherNext??4)){
  w.weatherNext=w.time+scene.weather.interval;
  game.damagePlayer(scene.weather.damage*(p.weatherUntil>w.time?.5:1)*(p.flightDamageMultiplier??1),false,{environment:true});
 }
 w.vortices=(w.vortices||[]).filter(v=>v.until>w.time);
 for(const v of w.vortices)for(const e of w.entities)if(e.type==='enemy'&&game.available(e)&&!e.invulnerable){
  const d=dist(v,e);if(d>.5&&d<v.radius&&game.lineClear(e,v)){
   const x=e.x+(v.x-e.x)/d*dt*2.5,z=e.z+(v.z-e.z)/d*dt*2.5;if(game.walkable(x,z,e.radius*.6)){e.x=x;e.z=z;}
  }
 }
 if(p.trail){w.trail||=[];const point={x:Math.round(p.x),z:Math.round(p.z)};if(!w.trail.some(q=>q.x===point.x&&q.z===point.z)){w.trail.push(point);if(w.trail.length>500)w.trail.shift();}}
}
