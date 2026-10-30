import { SPELLS, ITEMS, SHOPS, offerAvailable } from '../catalog.js';
import { updateChapterMechanics } from './chapter-mechanics.js';
import { wordCost,attackPower,markParry,castAdvanced,advancedHit,updateAdvanced,decorateProjectile,aimPoint,decoy } from './advanced-combat.js';
import { newGame, cloneSave, getMaxStats, compactProgress } from './state.js';

const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const enemy=e=>e.active&&['enemy','boss'].includes(e.type);
const combatTarget=e=>['enemy','boss','target'].includes(e.type)&&!e.destroyed&&e.hp>0;
const uniquePush=(a,v)=>{if(!a.includes(v))a.push(v);};
const segmentDistance=(p,a,b)=>{
  const dx=b.x-a.x,dz=b.z-a.z,lengthSq=dx*dx+dz*dz;
  const t=lengthSq?clamp(((p.x-a.x)*dx+(p.z-a.z)*dz)/lengthSq,0,1):0;
  return Math.hypot(p.x-(a.x+dx*t),p.z-(a.z+dz*t));
};
// Shared with the pixel renderer so warning boundaries and collision agree.
export function attackContains(a,x,z,padding=0) {
  const point={x,z},origin={x:a.originX??a.x,z:a.originZ??a.z},radius=(a.radius||0)+padding;
  if(a.shape==='cone') {
    const d=distance(point,origin);if(d>radius)return false;if(d<=padding)return true;
    const angle=Math.atan2(x-origin.x,z-origin.z),delta=Math.atan2(Math.sin(angle-(a.angle||0)),Math.cos(angle-(a.angle||0)));
    return Math.abs(delta)<=(a.arc||Math.PI/3)/2+Math.asin(Math.min(1,padding/d));
  }
  if(a.shape==='line'&&a.kind!=='bolt')return segmentDistance(point,origin,a)<=radius;
  return distance(point,a)<=radius;
}
export const entityBlocks=e=>e.active!==false&&!e.hidden&&!e.consumed&&!e.activated&&Number(e.blocking?.w)>0&&Number(e.blocking?.d)>0;
const chapterIdFor=scene=>scene.chapterId||`ch${String(Number(scene.id?.split('-')[0])||1).padStart(2,'0')}`;
const CHAPTER_TWO_ENEMIES=new Set(['pixie','venom-spider','duelist','serpent','basilisk']);
const BATTLE_ATTACKS={
  volley:{kind:'bolt',damage:26,duration:1.05,radius:.4,cooldown:1.8,volley:3},
  teleport:{kind:'teleport',damage:0,duration:.9,radius:1.8,cooldown:1.2},
  darkfire:{kind:'pool',damage:28,duration:1.5,radius:3.2,cooldown:2,element:'fire'},
  hex:{kind:'bolt',damage:30,duration:.95,radius:.4,cooldown:1.7,fear:3},
  grasp:{kind:'charge',damage:25,duration:1.2,radius:1.15,cooldown:1.9},
  chill:{kind:'slam',damage:12,duration:1.5,radius:2.4,cooldown:2.1,element:'ice',fear:4},
  dread:{kind:'sweep',damage:16,duration:1.5,radius:5,cooldown:2.2,fear:4},
  frost:{kind:'pool',damage:9,duration:1.6,radius:3,cooldown:3,element:'ice'},
  rush:{kind:'charge',damage:20,duration:1.3,radius:1.2,cooldown:2},
  claw:{kind:'sweep',damage:24,duration:1.3,radius:4.4,cooldown:2},
  branch:{kind:'slam',damage:20,duration:1.4,radius:3,cooldown:2},
  breath:{kind:'breath',shape:'cone',damage:32,duration:1.8,radius:13,arc:Math.PI*.42,cooldown:3.4,element:'fire'},
  gust:{kind:'charge',damage:18,duration:1.5,radius:2,cooldown:3},
  curse:{kind:'bolt',damage:28,duration:1.1,radius:.5,cooldown:2.3,fear:4},
  deathline:{kind:'deathline',shape:'line',damage:99999,duration:1.9,radius:.65,cooldown:4,lethal:true},
  burst:{kind:'fire',damage:24,duration:1.5,radius:3,cooldown:2.5,element:'fire'},
  pressure:{kind:'bolt',damage:10,duration:1.2,radius:.5,cooldown:2},
  gaze:{kind:'gaze',damage:25,duration:1.8,radius:9,cooldown:2.2,arc:Math.PI/3},
  fang:{kind:'charge',damage:30,duration:1.4,radius:1,cooldown:2.2,poison:3,poisonDuration:4},
  pool:{kind:'pool',damage:12,duration:1.5,radius:2.5,cooldown:2.7},
  tail:{kind:'sweep',damage:24,duration:1.2,radius:6,cooldown:2,arc:Math.PI},
  bite:{kind:'bite',damage:10,duration:.85,radius:1.5,cooldown:1.4,poison:2,poisonDuration:4},
  venom:{kind:'bolt',damage:8,duration:.9,radius:.3,cooldown:1.65,poison:2,poisonDuration:4},
  dive:{kind:'slam',damage:8,duration:.95,radius:1.35,cooldown:1.4},
  duel:{kind:'bolt',damage:12,duration:.85,radius:.3,cooldown:1.5},
  disarm:{kind:'bolt',damage:9,duration:1,radius:.3,cooldown:2,disarm:1.1}
};
const TROLL_ATTACKS={
  slam:{kind:'slam',damage:26,duration:1.1,radius:3.25,cooldown:1.45},
  sweep:{kind:'sweep',damage:21,duration:1.05,radius:5.1,cooldown:1.35},
  doubleSlam:{kind:'slam',damage:19,duration:1.05,radius:3.1,cooldown:1.5,followUp:true},
  charge:{kind:'charge',damage:28,duration:1.2,radius:1.65,cooldown:1.8}
};

export class GameEngine {
  constructor({save=newGame(),scene,onEvent=()=>{},movementProjection='isometric'}={}) {
    this.save=compactProgress(save);this.onEvent=onEvent;this.movement={x:0,y:0};this.sequence=0;this.disposed=false;
    // Input projection belongs to the presentation, never to saved progression.
    this.movementProjection=movementProjection==='topdown'?'topdown':'isometric';
    if(scene)this.loadScene(scene);
  }
  emit(type,extra={}){this.onEvent({type,...extra});}
  toast(message){this.emit('toast',{message});}
  loadScene(scene) {
    this.disposed=false;this.scene=scene;this.chapterId=chapterIdFor(scene);this.movement={x:0,y:0};
    const same=this.save.cursor.subchapterId===scene.id;
    this.pendingDialogue=null;this.holdTimers={};this.respawnStates=new Map();this.battleActive=false;
    for(const migration of scene.progressMigrations||[])if(migration.anyOf?.some(id=>this.save.progress.completedObjectiveIds.includes(id)))for(const id of migration.complete||[])uniquePush(this.save.progress.completedObjectiveIds,id);
    if(same&&this.save.checkpoint.battle?.sceneId===scene.id){this.restoreBattleProgress(scene,this.save.checkpoint.battle);this.battleActive=true;}
    else if(same)this.migrateLegacyBossCheckpoint(scene);
    const stats=getMaxStats(this.save),spawn=this.battleActive?this.save.checkpoint.battle.spawn:scene.spawn||{x:5,z:5};
    const priorHp=same?this.save.checkpoint.hp:this.save.player.hp;
    const priorMana=same?this.save.checkpoint.mana:this.save.player.mana;
    const safeRest=scene.rest===true||['train','classroom','library'].includes(scene.theme);
    this.world={time:0,player:{x:spawn.x,z:spawn.z,facing:Math.PI,hp:safeRest?stats.maxHp:clamp(priorHp||stats.maxHp,1,stats.maxHp),mana:safeRest?stats.maxMana:clamp(priorMana??stats.maxMana,0,stats.maxMana),...stats,guarding:false,guardStability:0,shield:stats.startShield,barriers:stats.startShield?[{id:'equipment',remaining:stats.startShield,until:Infinity}]:[]},entities:[],projectiles:[],telegraphs:[],hazards:[],effects:[],targetId:null,temporarySupplies:{...(same?this.save.checkpoint.temporarySupplies:scene.temporarySupplies||{})}};
    this.nextEnemyAttackAt=0;this.guardPressedAt=-99;this.guardReleasedAt=-99;this.guardLastPress=-99;this.guardBrokenUntil=-1;this.lastManaUse=-99;this.lastHit=-99;this.defeated=false;this.cooldowns={};
    this.save.cursor={chapterId:this.chapterId,subchapterId:scene.id,checkpointId:same?this.save.cursor.checkpointId:`${this.chapterId}.${scene.id}.checkpoint.entry`};
    for(const id of scene.grantSpells||[])uniquePush(this.save.player.learnedSpells,id);
    if(same){
      for(const [id,q] of Object.entries(this.save.checkpoint.personalConsumables))this.save.inventory.stacks[id]=q;
      for(const e of this.save.inventory.equipment)if(e.instanceId in this.save.checkpoint.equipmentCharges)e.chargesRemaining=this.save.checkpoint.equipmentCharges[e.instanceId];
      this.save.player.healingChargesRemaining=this.save.checkpoint.healingChargesRemaining;
      this.cooldowns={...this.save.checkpoint.cooldownsSeconds};
    }
    if(this.save.player.healingChargesRemaining===null||safeRest&&!same)this.save.player.healingChargesRemaining=6+(stats.healingChargeBonus||0);
    if(safeRest&&!same)for(const e of this.save.inventory.equipment)if(ITEMS[e.catalogId]?.revive)e.chargesRemaining=1;
    for(const goal of scene.objectives||[])if(goal.event==='kill'&&goal.target&&(goal.count||1)===1&&this.save.progress.flags[`defeated:${goal.target}`])uniquePush(this.save.progress.completedObjectiveIds,goal.id);
    for(const config of scene.entities||[]){
      const doneKill=this.save.progress.flags[`defeated:${config.id}`]===true||this.save.progress.completedObjectiveIds.some(id=>scene.objectives?.some(o=>o.id===id&&o.event==='kill'&&o.target===config.id));
      const interacted=scene.objectives?.some(o=>o.event==='interact'&&o.target===config.id&&this.save.progress.completedObjectiveIds.includes(o.id));
      const consumed=!!config.consumeOnInteract&&(this.save.progress.flags[`consumed:${config.id}`]===true||interacted);
      const collected=this.save.progress.flags[`collected:${config.id}`]===true;
      let activated=scene.objectives?.some(o=>o.event==='cast'&&o.target===config.id&&this.save.progress.completedObjectiveIds.includes(o.id));
      if(config.rearmWhileEnemyAlive&&!scene.objectives?.some(o=>o.event==='kill'&&o.target===config.rearmWhileEnemyAlive&&this.save.progress.completedObjectiveIds.includes(o.id)))activated=false;
      const locked=(config.conditions||[]).some(id=>!this.save.progress.completedObjectiveIds.includes(id));
      const e={...config,authoredHidden:!!config.hidden,hidden:!!config.hidden||!!config.hiddenUntilAvailable&&locked,wasAvailable:!locked,active:(!doneKill||config.type==='target')&&!collected&&(!consumed||config.consumedVisual==='harvested'),consumed,visualState:consumed?(config.consumedVisual||'hidden'):'intact',activated:!!activated,locked,maxHp:config.hp||20,hp:config.hp||20,radius:config.radius||.75,phase:1,attackIndex:0,nextAttack:config.combat?.startDelay??(config.kind==='troll'?1.2:2.5),stunnedUntil:0,facing:0};
      if(e.type==='target'){
        if(doneKill){e.hp=0;e.activated=true;}
        const savedHp=this.save.progress.flags[`visualHp:${e.id}`];
        if(typeof savedHp==='number')e.hp=clamp(savedHp,0,e.maxHp);
        else if(activated&&!doneKill)e.hp=e.maxHp*.8;
        this.updateTargetVisual(e);
      }
      if(e.type==='boss')delete this.save.progress.flags[`bossPhase:${e.id}`];
      this.world.entities.push(e);
    }
    if(!same||safeRest)this.makeCheckpoint(null);
    for(const e of this.world.entities)this.available(e);
    this.ensureBattleStart();this.syncSave();this.emit('changed');
  }
  sceneFlag(key,scene=this.scene){
    const ids=new Set([...(scene.entities||[]).map(e=>e.id),...(scene.objectives||[]).map(o=>o.id),...(scene.storyEvents||[]).map(e=>e.id)]);
    return key.startsWith(`${scene.id}.`)||['objectiveCount:','defeated:','consumed:','collected:','visualHp:','bossPhase:','storyEvent:'].some(prefix=>key.startsWith(prefix)&&ids.has(key.slice(prefix.length)));
  }
  restoreBattleProgress(scene,battle){
    const ids=new Set((scene.objectives||[]).map(o=>o.id));
    this.save.progress.completedObjectiveIds=this.save.progress.completedObjectiveIds.filter(id=>!ids.has(id));
    for(const id of battle.objectiveIds)if(ids.has(id))uniquePush(this.save.progress.completedObjectiveIds,id);
    for(const key of Object.keys(this.save.progress.flags))if(this.sceneFlag(key,scene))delete this.save.progress.flags[key];
    for(const [key,value] of Object.entries(battle.flags))if(this.sceneFlag(key,scene))this.save.progress.flags[key]=cloneSave(value);
  }
  migrateLegacyBossCheckpoint(scene){
    // Only old phase snapshots need migration. Entry saves made before a boss
    // appears must retain all preparation objectives on reload.
    if(!this.save.checkpoint.bossPhaseId&&!Object.keys(this.save.progress.flags).some(key=>key.startsWith('bossPhase:')))return;
    const bosses=(scene.entities||[]).filter(e=>e.type==='boss'&&!(e.hiddenAfter||[]).some(id=>this.save.progress.completedObjectiveIds.includes(id))&&!this.save.progress.flags[`defeated:${e.id}`]&&!(scene.objectives||[]).some(o=>o.event==='kill'&&o.target===e.id&&this.save.progress.completedObjectiveIds.includes(o.id)));
    if(!bosses.length)return;
    const keep=new Set(bosses.flatMap(e=>e.conditions||[]));
    const reset=new Set((scene.objectives||[]).filter(o=>!keep.has(o.id)).map(o=>o.id));
    const protectedTargets=new Set((scene.objectives||[]).filter(o=>keep.has(o.id)).map(o=>o.target));
    this.save.progress.completedObjectiveIds=this.save.progress.completedObjectiveIds.filter(id=>!reset.has(id));
    for(const key of Object.keys(this.save.progress.flags))if(this.sceneFlag(key,scene)&&!([...keep,...protectedTargets].some(id=>key===`objectiveCount:${id}`||key===`collected:${id}`||key===`consumed:${id}`)))delete this.save.progress.flags[key];
    const cp=this.save.checkpoint;
    if(cp.bossPhaseId){const stats=getMaxStats(this.save);cp.hp=stats.maxHp;cp.mana=stats.maxMana;cp.temporarySupplies={...(scene.temporarySupplies||{})};cp.cooldownsSeconds={};}
    cp.bossPhaseId=null;cp.id=this.save.cursor.checkpointId=`${this.chapterId}.${scene.id}.checkpoint.entry`;
  }
  ensureBattleStart(){
    if(this.battleActive||!this.world)return;
    if(!this.world.entities.some(e=>e.type==='boss'&&e.hp>0&&this.available(e)))return;
    this.makeCheckpoint(null);
    const ids=new Set((this.scene.objectives||[]).map(o=>o.id));
    const flags=Object.fromEntries(Object.entries(this.save.progress.flags).filter(([key])=>this.sceneFlag(key)));
    const p=this.world.player,cp=this.save.checkpoint;
    cp.id=this.save.cursor.checkpointId=`${this.chapterId}.${this.scene.id}.checkpoint.battle-start`;
    cp.battle={sceneId:this.scene.id,spawn:{x:p.x,z:p.z},objectiveIds:this.save.progress.completedObjectiveIds.filter(id=>ids.has(id)),flags:cloneSave(flags)};
    this.battleActive=true;
  }
  checkStoryEvents(){
    if(this.pendingDialogue||this.defeated)return;
    for(const event of this.scene.storyEvents||[]){
      const finished=this.save.progress.flags[`storyEvent:${event.id}`]||(this.scene.objectives||[]).some(o=>o.event==='story'&&o.target===event.id&&this.save.progress.completedObjectiveIds.includes(o.id));
      if(finished||!(event.conditions||[]).every(id=>this.save.progress.completedObjectiveIds.includes(id)))continue;
      this.pendingDialogue=event.id;this.setMovement(0,0);this.setGuard(false);this.emit('dialogue',{id:event.id,lines:event.dialogue||[]});return;
    }
  }
  completeDialogue(id){
    if(this.pendingDialogue!==id||this.defeated)return false;
    this.save.progress.flags[`storyEvent:${id}`]=true;this.pendingDialogue=null;
    this.recordEvent('story',{target:id});this.syncSave();this.emit('changed');return true;
  }
  updateRespawns(){
    for(const rule of this.scene.respawns||[]){
      const done=(rule.until||[]).some(id=>this.save.progress.completedObjectiveIds.includes(id));
      if(done){for(const e of this.world.entities)if(e.respawnGroup===rule.id){e.active=false;e.hidden=true;}this.world.projectiles=this.world.projectiles.filter(p=>!p.ownerId?.startsWith(`${rule.id}.slot`));this.world.telegraphs=this.world.telegraphs.filter(p=>!p.ownerId?.startsWith(`${rule.id}.slot`));continue;}
      if(!(rule.conditions||[]).every(id=>this.save.progress.completedObjectiveIds.includes(id)))continue;
      let state=this.respawnStates.get(rule.id);
      if(!state){state={nextAt:this.world.time,initialRemaining:Math.max(0,Math.min(32,rule.initialCount??rule.maxAlive??12)),cursor:0};this.respawnStates.set(rule.id,state);}
      if(this.world.time<state.nextAt)continue;
      const maxAlive=Math.max(1,Math.min(32,rule.maxAlive??12));
      const current=this.world.entities.filter(e=>e.respawnGroup===rule.id&&e.active);
      let needed=Math.min(maxAlive-current.length,state.initialRemaining||1),spawned=0;
      while(needed-->0){
        const points=rule.spawnPoints||[],p=this.world.player;
        let point=null;
        for(let n=0;n<points.length;n++){
          const candidate=points[(state.cursor+n)%points.length];
          if(distance(candidate,p)<(rule.minPlayerDistance??5)||!this.walkable(candidate.x,candidate.z,(rule.template?.radius??.7)*.6)||!this.lineClear(candidate,p)||this.world.entities.some(e=>enemy(e)&&distance(e,candidate)<(e.radius||.7)+(rule.template?.radius??.7)))continue;
          point=candidate;state.cursor=(state.cursor+n+1)%points.length;break;
        }
        if(!point)break;
        let slot=0;while(this.world.entities.some(e=>e.id===`${rule.id}.slot${slot}`&&e.active))slot++;
        const id=`${rule.id}.slot${slot}`,config=rule.template||{};
        const entity={...config,id,type:'enemy',x:point.x,z:point.z,radius:config.radius||.7,maxHp:config.hp||36,hp:config.hp||36,active:true,hidden:false,authoredHidden:false,locked:false,wasAvailable:true,transient:true,respawnGroup:rule.id,spawnUntil:this.world.time+1.2,nextAttack:this.world.time+2.5,stunnedUntil:0,phase:1,attackIndex:0,facing:0};
        const index=this.world.entities.findIndex(e=>e.id===id);if(index>=0)this.world.entities[index]=entity;else this.world.entities.push(entity);
        spawned++;if(state.initialRemaining>0)state.initialRemaining--;
      }
      state.nextAt=this.world.time+(spawned?Math.max(.3,rule.interval??2):.5);
    }
  }
  setMovement(x,y){this.movement={x:Number(x)||0,y:Number(y)||0};}
  setGuard(pressed){
    const p=this.world.player,t=this.world.time;
    if(pressed&&!p.guarding&&!this.defeated&&t>=this.guardBrokenUntil){
      p.guarding=true;this.guardPressedAt=t;
      if(t-this.guardLastPress<.3)this.guardPressedAt=-99;
      this.guardLastPress=t;this.emit('sound',{kind:'guard'});
    }else if(!pressed&&p.guarding){p.guarding=false;this.guardReleasedAt=t;}
  }
  available(e){
    e.locked=!(e.conditions||[]).every(id=>this.save.progress.completedObjectiveIds.includes(id));
    const finished=(e.hiddenAfter||[]).some(id=>this.save.progress.completedObjectiveIds.includes(id));
    e.hidden=!!e.authoredHidden||finished||!!e.hiddenUntilAvailable&&e.locked;
    if(e.wasAvailable===false&&!e.locked){e.nextAttack=this.world.time+(e.combat?.activationDelay??1.3);e.wasAvailable=true;}
    return e.active!==false&&!e.consumed&&!e.locked&&!e.hidden&&this.world.time>=(e.spawnUntil||0);
  }
  walkable(x,z,r=.38,ignoreEntityId=null){
    if(x<r||z<r||x>this.scene.width-r||z>this.scene.depth-r)return false;
    const layout=this.scene.layout;
    if(layout){
      // Sample the actor's circumference so collision follows the visible floor,
      // including seams between overlapping floor regions.
      const offsets=r?[[0,0],[r,0],[-r,0],[0,r],[0,-r],[r*.707,r*.707],[-r*.707,r*.707],[r*.707,-r*.707],[-r*.707,-r*.707]]:[[0,0]];
      for(const [dx,dz] of offsets){
        const px=x+dx,pz=z+dz;
        if(layout.floorRegions?.length&&!layout.floorRegions.some(b=>px>=b.x-b.w/2&&px<=b.x+b.w/2&&pz>=b.z-b.d/2&&pz<=b.z+b.d/2))return false;
        if(layout.boundary==='ellipse'&&((px-this.scene.width/2)/(this.scene.width/2))**2+((pz-this.scene.depth/2)/(this.scene.depth/2))**2>1)return false;
      }
    }
    if((this.scene.blockers||[]).some(b=>x>b.x-b.w/2-r&&x<b.x+b.w/2+r&&z>b.z-b.d/2-r&&z<b.z+b.d/2+r))return false;
    for(const e of this.world.entities)if(e.id!==ignoreEntityId&&entityBlocks(e)&&x>e.x-e.blocking.w/2-r&&x<e.x+e.blocking.w/2+r&&z>e.z-e.blocking.d/2-r&&z<e.z+e.blocking.d/2+r)return false;
    return true;
  }
  lineClear(a,b,{ignoreEntityId=b.blocking?b.id:null}={}){const d=distance(a,b),steps=Math.max(1,Math.ceil(d/.3));for(let i=1;i<steps;i++){const f=i/steps;if(!this.walkable(a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f,0,ignoreEntityId))return false;}return true;}
  objectives(){return(this.scene.objectives||[]).map(o=>({...o,current:Number(this.save.progress.flags[`objectiveCount:${o.id}`]??(this.save.progress.completedObjectiveIds.includes(o.id)?o.count||1:0)),done:this.save.progress.completedObjectiveIds.includes(o.id)}));}
  recordEvent(eventName,payload={}){
    if(this.disposed)return;
    const entity=payload.target&&this.world.entities.find(e=>e.id===payload.target);
    if(entity&&!this.available(entity))return;
    if(eventName==='choice'){
      const c=(entity?.choices||this.world.entities.flatMap(e=>e.choices||[])).find(c=>c.id===payload.choice);
      if(c?.flag)this.save.progress.flags[c.flag]=c.value??c.id;
    }
    if(eventName==='interact'&&entity){
      if(entity.reward)this.grantReward(entity.reward,`entity:${entity.id}`);
      if(entity.ability)uniquePush(this.save.player.abilityUnlocks,entity.ability);
      if(entity.shopId)uniquePush(this.save.world.shopUnlockIds,entity.shopId);
      for(const [id,state] of Object.entries(entity.storyItemChanges||{}))if(['owned','used','destroyed'].includes(state))this.save.progress.storyItems[id]=state;
    }
    let changed=false;
    for(const o of this.scene.objectives||[]){
      if((o.conditions||[]).some(id=>!this.save.progress.completedObjectiveIds.includes(id)))continue;
      if(o.event!==eventName||o.target&&o.target!==payload.target||o.spell&&o.spell!==payload.spell||o.spells&&!o.spells.includes(payload.spell)||this.save.progress.completedObjectiveIds.includes(o.id))continue;
      if(o.choice&&o.choice!==payload.choice){this.toast(o.hint||'기록의 단서를 다시 살펴보세요.');continue;}
      const key=`objectiveCount:${o.id}`;const n=Number(this.save.progress.flags[key]||0)+1;
      this.save.progress.flags[key]=n;changed=true;
      if(n>=(o.count||1)){uniquePush(this.save.progress.completedObjectiveIds,o.id);this.emit('objective',{id:o.id});}
    }
    if(eventName==='interact'&&entity?.consumeOnInteract){
      entity.consumed=true;entity.visualState=entity.consumedVisual||'hidden';
      entity.active=entity.visualState==='harvested';
      this.save.progress.flags[`consumed:${entity.id}`]=true;
      this.effect(entity.x,entity.z,entity.visualState==='harvested'?'#a5c377':'#e8ce80','collect',.8);
      this.emit('sound',{kind:'collect'});changed=true;
    }
    if(changed||eventName==='interact'||eventName==='choice'){
      if(!this.world.entities.some(e=>enemy(e)&&this.available(e)))this.makeCheckpoint(null);
      for(const e of this.world.entities)this.available(e);
      this.ensureBattleStart();this.syncSave();this.emit('changed');this.checkStoryEvents();
    }
  }
  canInteract(e){
    if(!this.available(e)||!['npc','prop','pickup'].includes(e.type))return false;
    const finishedSpellProp=e.type==='prop'&&e.activated&&(e.spell||e.spells?.length)&&!e.repeatable;
    return !finishedSpellProp||!!(e.dialogue?.length||e.dialogueVariants?.length||e.choices?.length||e.shopId);
  }
  interact(){
    if(this.defeated)return null;
    const p=this.world.player;
    const list=this.world.entities.filter(e=>this.canInteract(e)&&distance(e,p)<=3.2+(e.radius||.5)&&this.lineClear(p,e));
    return list.sort((a,b)=>distance(a,p)-distance(b,p))[0]||null;
  }
  cast(input){
    if(this.defeated)return{ok:false,message:'체크포인트에서 다시 시작해 주세요.'};
    const word=String(input).toLowerCase().replace(/\s/g,'');
    const spell=SPELLS.find(s=>s.input===word);
    if(!spell)return{ok:false,message:'주문서에서 정확한 입력을 확인해 주세요.'};
    if(!this.save.player.learnedSpells.includes(spell.id))return{ok:false,message:'아직 배우지 않은 주문입니다.'};
    if((this.cooldowns[spell.id]||0)>0)return{ok:false,message:`${this.cooldowns[spell.id].toFixed(1)}초 뒤에 다시 시전할 수 있습니다.`};
    const p=this.world.player,range=spell.range||13;
    const utility=['light','repair','levitate','unlock','reveal'].includes(spell.kind);
    if((p.disarmedUntil||0)>this.world.time&&!['cleanse','dispel'].includes(spell.kind))return{ok:false,message:'지팡이를 다시 잡고 있습니다. 이동해서 거리를 벌리세요.'};
    const cost=wordCost(p,word)*spell.mana*(utility?p.explorationCostMultiplier:1)*(spell.kind==='fire'?(p.fireCostMultiplier??1):spell.kind==='water'?(p.waterCostMultiplier??1):1);
    if(p.mana+1e-6<cost)return{ok:false,message:'마나가 부족합니다. 잠시 기다려 주세요.'};
    const valid=this.world.entities.filter(e=>this.available(e)&&(!['enemy','boss','target'].includes(e.type)||e.onScreen!==false)&&distance(p,e)<=range&&this.lineClear(p,e));
    const matches=valid.filter(e=>(!e.activated||e.repeatable)&&(e.spell===spell.id||e.spells?.includes(spell.id)||this.scene.objectives?.some(o=>o.event==='cast'&&(o.spell===spell.id||o.spells?.includes(spell.id))&&o.target===e.id&&!this.save.progress.completedObjectiveIds.includes(o.id))));
    const locked=valid.find(e=>e.id===this.world.targetId&&combatTarget(e));
    let target=matches.filter(e=>!e.destroyed).sort((a,b)=>distance(p,a)-distance(p,b))[0]||locked||valid.filter(combatTarget).sort((a,b)=>distance(p,a)-distance(p,b))[0];
    if(utility&&!target&&!['light','reveal'].includes(spell.kind))return{ok:false,message:'주문에 반응할 장치 가까이 이동해 주세요.'};
    if(utility&&target&&!matches.includes(target)&&!['light','reveal'].includes(spell.kind))return{ok:false,message:'이 대상에는 다른 주문이 필요합니다.'};
    if(spell.kind==='heal'&&this.save.player.healingChargesRemaining<(spell.charges||1))return{ok:false,message:'치유 횟수가 부족합니다. 휴식 장소에서 회복하세요.'};
    if(spell.kind==='heal'&&p.hp>=p.maxHp)return{ok:false,message:'체력이 가득 차 있습니다.'};
    if(spell.kind==='birds'&&(!(p.birds>0)||p.birdsUntil<=this.world.time))return{ok:false,message:'먼저 avis로 새를 소환하세요.'};
    p.mana=Math.max(0,p.mana-cost);this.lastManaUse=this.world.time;this.cooldowns[spell.id]=(spell.cooldown||0)*(spell.kind==='patronus'?(p.patronusCooldownMultiplier??1):1)*(['S011','S012'].includes(spell.id)?(p.duelCooldownMultiplier??1):1);
    this.save.player.spellMastery[spell.id]=(this.save.player.spellMastery[spell.id]||0)+1;
    if(target){p.facing=Math.atan2(target.x-p.x,target.z-p.z);this.world.targetId=target.id;}
    if(spell.kind==='shield'){
      p.barriers=p.barriers.filter(b=>b.id!==spell.id);
      p.barriers.push({id:spell.id,remaining:(spell.shield||15)*(p.shieldMultiplier??1),until:this.world.time+(spell.duration||4)});
      p.shield=p.barriers.reduce((sum,b)=>sum+b.remaining,0);
    }
    if(utility||['shield','cleanse','dispel','heal','patronus','summon','weather','sound','transform','advanced'].includes(spell.kind)){
      if(spell.kind==='advanced')castAdvanced(this,spell,target);
      if(spell.kind==='heal'){
        this.save.player.healingChargesRemaining-=spell.charges||1;
        const heal=spell.heal*(p.healMultiplier??1)*(p.healReceivedMultiplier??1);
        if(spell.healDuration){p.healUntil=this.world.time+spell.healDuration;p.healRate=heal/spell.healDuration;}
        else p.hp=Math.min(p.maxHp,p.hp+heal);
      }
      if(spell.kind==='patronus'){p.patronusUntil=this.world.time+spell.duration*(p.patronusDurationMultiplier??1);p.fearUntil=0;}
      if(spell.kind==='summon'){p.birds=3;p.birdsUntil=this.world.time+spell.duration;}
      if(spell.kind==='weather')p.weatherUntil=this.world.time+spell.duration;
      if(spell.kind==='sound')p.amplified=spell.id==='S060';
      if(spell.kind==='cleanse'){
        if(p.cleanseProtection&&p.poisonUntil>this.world.time&&this.world.time>=(p.cleanseProtectionAt||0)){p.cleanseProtectionUntil=this.world.time+4;p.cleanseProtectionAt=this.world.time+10;}
        p.poisonUntil=0;p.poisonNextTick=0;
        this.effect(p.x,p.z,'#b4f1b5','cleanse',1);
      }
      if(spell.kind==='dispel'){
        p.disarmedUntil=0;p.petrifiedUntil=0;
        this.world.projectiles=this.world.projectiles.filter(b=>!b.enemy||distance(b,p)>range);
        const cancelled=new Set(this.world.telegraphs.filter(a=>a.kind==='bolt'&&distance(a,p)<=range).map(a=>a.ownerId));
        this.world.telegraphs=this.world.telegraphs.filter(a=>!cancelled.has(a.ownerId));
        for(const e of this.world.entities)if(cancelled.has(e.id))e.nextAttack=this.world.time+1.5;
      }
      if(spell.kind==='reveal')this.world.revealUntil=this.world.time+(spell.duration||8);
      this.effect(target?.x??p.x,target?.z??p.z,spell.color||'#a6e9e2',spell.kind,1.2);
      if(spell.kind==='light')this.world.lightUntil=spell.id==='S035'?0:Infinity;
      if(matches.includes(target)){
        const firstActivation=!target.activated;target.activated=true;
        if(firstActivation&&target.rewardMana)p.mana=Math.min(p.maxMana,p.mana+target.rewardMana);
        this.recordEvent('cast',{target:target.id,spell:spell.id});
        if(!['enemy','boss','target'].includes(target.type))this.world.targetId=null;
        if(spell.kind==='levitate'&&target.kind==='club'){
          const troll=this.world.entities.find(e=>enemy(e)&&e.kind==='troll');
          if(troll){this.damageEnemy(troll,Math.max(60,troll.hp*.35));troll.stunnedUntil=this.world.time+2.8;this.world.telegraphs=this.world.telegraphs.filter(a=>a.ownerId!==troll.id);troll.nextAttack=troll.stunnedUntil+.65;this.toast('공중의 곤봉이 트롤을 강타했습니다!');}
        }
      }else this.recordEvent('cast',{spell:spell.id});
    }else{
      const tx=target?.x??p.x+Math.sin(p.facing)*range,tz=target?.z??p.z+Math.cos(p.facing)*range;
      const len=Math.max(.01,Math.hypot(tx-p.x,tz-p.z));
      const element=spell.element||(spell.kind==='fire'?'fire':'arcane');
      const multiplier=attackPower(p,spell)*(spell.kind==='fire'?p.fireMultiplier:word.length===1?p.runeMultiplier:1)*(element==='ice'?p.iceMultiplier??1:element==='lightning'?p.lightningMultiplier??1:1)*(p.lastElement&&p.lastElement!==element?(p.comboMultiplier??1):1);
      p.lastElement=element;
      const birdCount=spell.kind==='birds'?p.birds:1;if(spell.kind==='birds')p.birds=0;
      this.world.projectiles.push({id:`p${++this.sequence}`,x:p.x,z:p.z,y:1,vx:(tx-p.x)/len*(spell.projectileSpeed||16),vz:(tz-p.z)/len*(spell.projectileSpeed||16),color:spell.color||'#b4b0ff',radius:spell.kind==='fire'?.38:.2,enemy:false,damage:(spell.damage??5)*p.power*multiplier*birdCount,spellId:spell.id,targetId:target?.id,ttl:range/(spell.projectileSpeed||16)+.15,originX:p.x,originZ:p.z,stun:spell.stun||spell.control,slow:spell.slow,slowDuration:spell.slowDuration,burnDamage:spell.burnDamage,burnDuration:spell.burnDuration,knockback:spell.knockback,element,confuse:spell.confuse,vortex:spell.vortex,disarm:spell.disarm,freeze:spell.freeze,root:spell.root,areaRadius:spell.areaRadius,wet:spell.wet});
      decorateProjectile(this,this.world.projectiles.at(-1),spell);
      if(matches.includes(target)&&!['enemy','boss','target'].includes(target.type)){
        target.activated=true;this.recordEvent('cast',{target:target.id,spell:spell.id});this.world.targetId=null;
        this.effect(target.x,target.z,spell.color,'activate',1);
      }
    }
    this.emit('sound',{kind:'cast'});this.emit('changed');
    return{ok:true,message:spell.name,spell};
  }
  effect(x,z,color='#dfba73',kind='spark',ttl=.7){this.world.effects.push({id:`fx${++this.sequence}`,x,z,color,kind,ttl,duration:ttl});}
  updateTargetVisual(e){
    // A teaching target must remain usable until its specific lesson is done,
    // even if the player attacks it with a different learned spell first.
    if(e.objectiveOnly&&this.scene.objectives?.some(o=>o.event==='cast'&&o.target===e.id&&!this.save.progress.completedObjectiveIds.includes(o.id)))e.hp=Math.max(1,e.hp);
    e.damageRatio=clamp(1-e.hp/e.maxHp,0,1);e.destroyed=e.hp<=0;
    e.visualState=e.destroyed?'broken':e.damageRatio>0?'damaged':'intact';
  }
  damageEnemy(e,amount,element=null){
    if(!e.active||e.destroyed)return;
    if(e.invulnerable||this.world.time<(e.invulnerableUntil||0)||e.kind==='dementor'&&element!=='patronus')return;
    if(e.kind==='basilisk'&&this.world.time>=(e.weakUntil||0))amount*=element==='slash'?.6:.7;
    if(e.type==='boss'&&element==='curse')amount*=.65;
    if(e.kind==='ward-gate')amount=Math.max(10,amount);
    if(e.kind==='inferius'&&e.dormantUntil>this.world.time&&element!=='fire')return;
    if(e.kind==='inferius'&&amount>=e.hp&&element!=='fire'){e.hp=1;e.dormantUntil=this.world.time+3;e.pose='down';this.world.telegraphs=this.world.telegraphs.filter(a=>a.ownerId!==e.id);this.effect(e.x,e.z,'#aabfc2','fall',.8);return;}
    if(e.kind==='venom-spider'&&element==='fire')amount*=1.25;
    if(e.kind==='pixie'&&element==='wind')amount*=1.25;
    if(element==='lightning'&&(e.wetUntil||0)>this.world.time)amount*=1.35;
    e.hp=Math.max(0,e.hp-amount);this.effect(e.x,e.z,'#efc878','hit',.4);
    e.hitUntil=this.world.time+.18;
    if(e.type==='target'){
      this.updateTargetVisual(e);this.save.progress.flags[`visualHp:${e.id}`]=e.hp;
      if(e.destroyed){e.activated=true;this.recordEvent('kill',{target:e.id});this.world.targetId=null;this.effect(e.x,e.z,'#c7ab77','defeat',.8);}
      this.syncSave();this.emit('changed');return;
    }
    if(e.kind==='troll'||e.pattern==='troll'){
      const wasEnraged=e.enraged;e.enraged=e.hp>0&&e.hp<=e.maxHp*(e.combat?.enrageAt??.5);
      if(e.enraged&&!wasEnraged){this.effect(e.x,e.z,'#eb7754','enrage',1);this.toast('트롤이 격분했습니다! 연속 공격에 주의하세요.');}
    }
    if(e.type==='boss'&&e.hp>0){
      const thresholds=e.combat?.phaseThresholds||(e.kind==='basilisk'?[.7,.35]:[.65,.3]);
      const phase=e.hp<=e.maxHp*thresholds[1]?3:e.hp<=e.maxHp*thresholds[0]?2:1;
      if(phase>e.phase&&e.kind!=='troll'){
        e.phase=phase;
        this.world.projectiles=this.world.projectiles.filter(p=>!p.enemy);this.world.telegraphs=[];this.world.hazards=[];e.nextAttack=this.world.time+(Number(this.chapterId.slice(2))>=5?1.8:3.2);
        if(e.kind==='basilisk'){
          e.weakUntil=this.world.time+3.2;this.world.player.poisonUntil=0;this.world.player.petrifiedUntil=0;
          for(const foe of this.world.entities)if(enemy(foe))foe.nextAttack=Math.max(foe.nextAttack,this.world.time+3.2);
          this.toast(phase===2?'포크스가 시선을 가렸습니다. 독액과 꼬리를 조심하세요!':'비늘이 갈라졌습니다. 돌진을 기둥에 유도하세요!');
        }
        this.emit('bossPhase',{phase});this.emit('changed');
      }
    }
    if(e.hp===0){
      // Record while available, then hide the defeated entity.
      if(!e.transient)this.recordEvent('kill',{target:e.id});e.active=false;
      if(!e.transient)this.save.progress.flags[`defeated:${e.id}`]=true;
      this.world.telegraphs=this.world.telegraphs.filter(t=>t.ownerId!==e.id);
      if(e.reward&&!e.transient)this.grantReward({...e.reward,gold:Math.floor((e.reward.gold||0)*(this.world.player.enemyGoldMultiplier??1))},`entity:${e.id}`);
      this.effect(e.x,e.z,'#e2c487','defeat',1.2);this.emit('sound',{kind:'victory'});
      if(!this.world.entities.some(e=>enemy(e)&&this.available(e))&&(!this.scene.encounter||this.scene.encounter.endObjectives.every(id=>this.save.progress.completedObjectiveIds.includes(id)))){this.battleActive=false;delete this.save.checkpoint.battle;this.makeCheckpoint(null);}
      this.syncSave();this.emit('changed');
    }
  }
  damagePlayer(amount,blockable=true,options={}){
    const p=this.world.player,t=this.world.time;
    if(this.defeated||t-this.lastHit<.45)return false;
    this.lastHit=t;let damage=amount*(options.element==='fire'?(p.fireResistance??1):options.element==='ice'?(p.iceResistance??1):1)*(options.environment?(p.trapDamageMultiplier??1):1);
    if(p.cleanseProtectionUntil>t)damage*=.85;
    if(options.lethal){damage=p.hp+p.shield+1;blockable=false;}
    const zone=this.world.zone;if(!options.lethal&&zone?.until>t&&distance(p,zone)<=zone.radius){const absorbed=Math.min(damage,zone.remaining);zone.remaining-=absorbed;damage-=absorbed;}
    if(p.guarding&&blockable){
      if(t-this.guardPressedAt<=.18&&p.mana>=2){damage=0;p.mana-=2;this.effect(p.x,p.z,'#ccefff','parry',.7);markParry(this);this.toast('정밀 방어!');}
      else{
        const cost=Math.ceil(amount*.2)*p.guardCostMultiplier;
        if(p.mana>=cost){p.mana-=cost;damage*=.3;this.effect(p.x,p.z,'#8cc9d3','guard',.5);}
        else this.breakGuard();
      }
      p.guardStability+=12;this.lastManaUse=t;
    }
    for(const barrier of p.barriers.sort((a,b)=>a.until-b.until)){if(barrier.until<=t)continue;const n=Math.min(barrier.remaining,damage);barrier.remaining-=n;damage-=n;}
    p.barriers=p.barriers.filter(b=>b.remaining>0&&b.until>t);p.shield=p.barriers.reduce((sum,b)=>sum+b.remaining,0);
    p.hp=Math.max(0,p.hp-damage);if(damage>0){this.effect(p.x,p.z,'#e79583','hit',.45);this.emit('sound',{kind:'hit'});}
    if(p.guardStability>=100)this.breakGuard();
    if(p.hp===0){
      const revive=this.save.inventory.equipment.find(e=>this.save.loadout.pendantInstanceIds.includes(e.instanceId)&&ITEMS[e.catalogId]?.revive&&e.chargesRemaining>0);
      if(revive){revive.chargesRemaining--;p.hp=p.maxHp*ITEMS[revive.catalogId].revive;p.poisonUntil=0;p.fearUntil=0;this.world.projectiles=this.world.projectiles.filter(b=>!b.enemy);this.world.telegraphs=[];this.lastHit=t+1.5;this.toast('불사조 펜던트가 빛났습니다.');this.syncSave();this.emit('changed');return false;}
      this.defeated=true;this.setGuard(false);this.setMovement(0,0);this.emit('defeat');}
    return damage>0;
  }
  breakGuard(){const p=this.world.player;p.guarding=false;p.guardStability=0;this.guardBrokenUntil=this.world.time+1;this.guardReleasedAt=this.world.time;this.toast('방어가 무너졌습니다. 이동으로 피하세요!');}
  applyPoison(damage=2,duration=4){
    const p=this.world.player,t=this.world.time;if((p.poisonImmuneUntil||0)>t)return;
    const adjusted=Math.max(1,duration*(p.poisonDurationMultiplier??1));
    if((p.poisonUntil||0)<=t)p.poisonDamage=0;
    p.poisonUntil=Math.max(p.poisonUntil||0,t+adjusted);p.poisonDamage=Math.max(p.poisonDamage||0,damage);
    if(!(p.poisonNextTick>t))p.poisonNextTick=t+1;
  }
  applyDisarm(duration=1.1){
    const p=this.world.player,t=this.world.time;
    // Several duelists may pressure the player, but cannot indefinitely lock input.
    if((p.disarmImmuneUntil||0)>t)return;
    p.disarmedUntil=t+duration;p.disarmImmuneUntil=p.disarmedUntil+2.4;
  }
  beginAttack(e){
    const p=aimPoint(this,e),t=this.world.time,index=e.attackIndex++;
    const troll=e.kind==='troll'||e.pattern==='troll',basilisk=e.kind==='basilisk'||e.pattern==='basilisk';
    let attack={kind:'bolt',damage:e.damage||12,duration:1.05,radius:1,cooldown:3.8},selected='bolt';
    if(troll){
      const combat=e.combat||{};e.enraged=e.hp<=e.maxHp*(combat.enrageAt??.5);
      const sequence=e.enraged?(combat.enragedSequence||['doubleSlam','charge','sweep','slam']):(combat.sequence||['slam','sweep','doubleSlam','charge']);
      selected=distance(e,p)>7?'charge':sequence[index%sequence.length];
      attack={...(TROLL_ATTACKS[selected]||TROLL_ATTACKS.slam),...(combat.attacks?.[selected]||{})};
      if(e.enraged){attack.duration=Math.max(.8,attack.duration*.85);attack.cooldown*=.8;attack.radius+=attack.kind==='charge'?.15:.35;}
      if(attack.kind==='slam')attack.duration=Math.max(attack.duration,(attack.radius+.38)/5+.25);
    }else if(basilisk){
      const sequence=e.phase===1?['gaze','fang','gaze','fang']:e.phase===2?['tail','pool','fang']:['fang','pool','tail','fang'];
      selected=(e.combat?.sequence||sequence)[index%(e.combat?.sequence||sequence).length];
      // Fawkes ends gaze at the authored 70% transition, including overridden sequences.
      if(selected==='gaze'&&e.phase>1)selected='fang';
      attack={...BATTLE_ATTACKS[selected],...(e.combat?.attacks?.[selected]||{})};
      if(e.phase===3)attack.cooldown*=.8;
    }else if(e.kind==='quirrell'||e.pattern==='quirrell'){
      const sequence=e.phase===1?['bolt','fire','bolt']:e.phase===2?['bolt','fire','shadow']:['bolt','shadow','charge','fire'];selected=sequence[index%sequence.length];
      attack={kind:selected,...({bolt:{damage:14,duration:.95,cooldown:3.5,radius:1},fire:{damage:20,duration:1.4,cooldown:8,radius:2.8},shadow:{damage:18,duration:1.2,cooldown:7,radius:3.4},charge:{damage:25,duration:1.6,cooldown:10,radius:2}})[selected]};
    }else if(CHAPTER_TWO_ENEMIES.has(e.kind)||e.combat?.sequence){
      const defaults=e.kind==='pixie'?['dive','duel']:e.kind==='venom-spider'?['venom','bite']:e.kind==='serpent'?['bite','venom']:['duel','disarm'];
      const sequence=e.combat?.phaseSequences?.[(e.phase||1)-1]||e.combat?.sequence||defaults;selected=sequence[index%sequence.length];
      if(selected==='teleport'&&e.anchorUntil>t)selected='curse';
      if(selected==='bite'&&distance(e,p)>3)selected='venom';
      attack={...(BATTLE_ATTACKS[selected]||BATTLE_ATTACKS.duel),...(e.damage?{damage:e.damage}:{}),...(e.combat?.attacks?.[selected]||{})};
    }
    if(e.curseUntil>t)attack.damage*=.85;
    if(e.silencedUntil>t&&['bolt','teleport','pool','fire'].includes(attack.kind)){e.nextAttack=e.silencedUntil+.3;return;}
    const {kind,damage,duration,radius,cooldown,followUp=false}=attack;e.attackPattern=selected;
    const aimedAngle=Math.atan2(p.x-e.x,p.z-e.z),facingAngle=basilisk&&kind==='sweep'?(e.facing??aimedAngle):aimedAngle;
    let x=['sweep','bite','gaze','breath'].includes(kind)?e.x:p.x,z=['sweep','bite','gaze','breath'].includes(kind)?e.z:p.z,wallImpact=false;
    if(kind==='teleport'){
      const spots=e.combat?.teleportPoints||[{x:e.x+6,z:e.z},{x:e.x-6,z:e.z},{x:e.x,z:e.z+6}];
      const spot=spots.find(q=>distance(q,p)>4&&this.walkable(q.x,q.z,e.radius*.6));if(spot){x=spot.x;z=spot.z;}else{x=e.x;z=e.z;}
    }
    if(kind==='charge'){
      const maxRange=e.combat?.chargeRange??(basilisk?16:troll?12:18),dx=p.x-e.x,dz=p.z-e.z,d=Math.max(.01,Math.hypot(dx,dz));
      const travel=basilisk?maxRange:Math.min(d+1.2,maxRange);let safe=0;
      for(let step=.2;step<=travel;step+=.2){if(!this.walkable(e.x+dx/d*step,e.z+dz/d*step,e.radius*.6)){wallImpact=true;break;}safe=step;}
      x=e.x+dx/d*safe;z=e.z+dz/d*safe;
    }
    const cone=attack.shape==='cone'||kind==='gaze'||basilisk&&kind==='sweep';
    const blockable=basilisk&&kind==='sweep'||!['fire','slam','sweep','charge','pool','gaze','breath','deathline'].includes(kind);
    const warning={ownerId:e.id,x,z,radius,shape:cone?'cone':attack.shape||(['bolt','charge'].includes(kind)?'line':'circle'),angle:facingAngle+(basilisk&&kind==='sweep'?Math.PI:0),arc:attack.arc,color:attack.lethal?'#90ff87':kind==='gaze'?'#efd56b':kind==='pool'?'#9fc45b':!blockable?'#f16f69':'#7ec4de',ttl:duration,duration,kind,damage,originX:e.x,originZ:e.z,blockable,followUp,sequenceStage:1,cooldown,poison:attack.poison,poisonDuration:attack.poisonDuration,disarm:attack.disarm,element:attack.element,fear:attack.fear,lethal:attack.lethal,wallImpact};
    this.world.telegraphs.push({...warning,id:`t${++this.sequence}`});
    for(let i=1;i<(attack.volley||1);i++)this.world.telegraphs.push({...warning,id:`t${++this.sequence}`,ttl:duration+i*.25,duration:duration+i*.25,x:x+(i===1?-1.2:1.2),z});
    if(basilisk&&kind==='pool'){
      // Two announced puddles leave the opposite flank open; no unannounced spawn.
      const side={x:p.x+Math.cos(aimedAngle)*5.5,z:p.z-Math.sin(aimedAngle)*5.5};
      if(this.walkable(side.x,side.z,radius))this.world.telegraphs.push({...warning,...side,id:`t${++this.sequence}`});
    }
    e.nextAttack=t+duration+cooldown;e.facing=facingAngle;e.attackState='windup';e.recoverUntil=e.nextAttack;
  }
  resolveAttack(a){
    const e=this.world.entities.find(e=>e.id===a.ownerId);if(!e?.active||this.world.time<e.stunnedUntil)return;
    const p=this.world.player,t=this.world.time;e.attackState='recover';
    if(a.kind==='teleport'){if(!(e.anchorUntil>t)&&this.walkable(a.x,a.z,e.radius*.6)){e.x=a.x;e.z=a.z;e.invulnerableUntil=t+.6;this.effect(e.x,e.z,'#c9a3ec','teleport',.8);}return;}
    if(a.kind==='bolt'){
      if(e.onScreen===false)return;
      const d=Math.max(.01,Math.hypot(a.x-a.originX,a.z-a.originZ)),speed=e.combat?.projectileSpeed??8;
      this.world.projectiles.push({id:`p${++this.sequence}`,ownerId:e.id,x:a.originX,z:a.originZ,y:1,vx:(a.x-a.originX)/d*speed,vz:(a.z-a.originZ)/d*speed,radius:.3,color:a.poison?'#b9d66d':'#c39bdb',enemy:true,damage:a.damage,ttl:4,poison:a.poison,poisonDuration:a.poisonDuration,disarm:a.disarm,fear:a.fear,element:a.element});
      return;
    }
    if(a.kind==='charge'&&this.walkable(a.x,a.z,e.radius*.6)){
      e.x=a.x;e.z=a.z;
      if(e.kind==='basilisk'&&a.wallImpact){e.weakUntil=t+4;e.nextAttack=Math.max(e.nextAttack,t+4);e.recoverUntil=e.nextAttack;this.toast('기둥에 부딪혔습니다! 드러난 입을 노리세요.');}
    }
    this.effect(a.x,a.z,a.color,a.kind,.8);
    if(attackContains(a,p.x,p.z,.38)&&this.lineClear(a.kind==='charge'?{x:a.originX,z:a.originZ}:e,p)){
      const damaged=this.damagePlayer(a.damage,a.blockable,{element:a.element,lethal:a.lethal});
      if(damaged&&a.fear&&!(p.patronusUntil>t))p.fearUntil=t+a.fear;
      if(damaged&&a.poison)this.applyPoison(a.poison,a.poisonDuration||4);
      if(damaged&&a.kind==='gaze')p.petrifiedUntil=t+1;
      if(damaged&&e.kind==='basilisk'&&a.kind==='sweep'){
        const dx=p.x-e.x,dz=p.z-e.z,d=Math.max(.01,Math.hypot(dx,dz));
        for(let step=.25;step<=3;step+=.25){const x=p.x+dx/d*.25,z=p.z+dz/d*.25;if(!this.walkable(x,z))break;p.x=x;p.z=z;}
      }
    }
    if(a.kind==='pool'){
      this.world.hazards.push({id:`h${++this.sequence}`,ownerId:e.id,x:a.x,z:a.z,radius:a.radius,ttl:5,duration:5,damage:a.element==='fire'?8:3,nextTick:t+1,element:a.element,color:a.element==='ice'?'#a4dcec':a.element==='fire'?'#e19c69':'#91b34e'});
      if(this.world.hazards.length>6)this.world.hazards.shift();
    }
    if(a.followUp&&e.hp>0){
      const duration=e.enraged?1:1.05;
      this.world.telegraphs.push({id:`t${++this.sequence}`,ownerId:e.id,x:p.x,z:p.z,radius:e.enraged?3.25:3.1,shape:'circle',color:'#f16f69',ttl:duration,duration,kind:'slam',damage:22,originX:e.x,originZ:e.z,blockable:false,sequenceStage:2});
      e.nextAttack=t+duration+(a.cooldown||1.5);e.recoverUntil=e.nextAttack;e.attackState='windup';
    }
  }
  applyProjectileHit(hit,b){
    const w=this.world,p=w.player;this.recordEvent('cast',{target:hit.id,spell:b.spellId});this.damageEnemy(hit,b.damage,b.element);advancedHit(this,hit,b);
    if(!hit.active||hit.invulnerable||hit.kind==='dementor')return;
    if(b.confuse&&hit.type!=='boss'){hit.stunnedUntil=w.time+b.confuse;hit.nextAttack=hit.stunnedUntil+.5;w.telegraphs=w.telegraphs.filter(a=>a.ownerId!==hit.id);}
    if(b.vortex){w.vortices||=[];w.vortices.push({x:hit.x,z:hit.z,until:w.time+b.vortex,radius:4});}
    if(hit.kind==='basilisk'){
      if(b.element==='ice'||b.freeze){hit.nextAttack+=.4;hit.recoverUntil=Math.max(hit.recoverUntil||0,w.time+.4);}
      return;
    }
    let control=b.stun||b.freeze*(p.freezeDurationMultiplier??1)||b.root*(p.rootDurationMultiplier??1)||0;
    if(b.root&&hit.kind==='pixie')control=0;
    if(control){
      hit.controlHits=(hit.controlHits||[]).filter(t=>w.time-t<8);
      const repeated=[1,.5,0][Math.min(2,hit.controlHits.length)];
      if(hit.type!=='boss'||w.time>=(hit.controlImmuneUntil||0)){
        const duration=(hit.type==='boss'?Math.min(.4,control*.25):control)*repeated;
        if(duration>0){hit.stunnedUntil=w.time+duration;this.world.telegraphs=this.world.telegraphs.filter(a=>a.ownerId!==hit.id);hit.nextAttack=Math.max(hit.nextAttack,hit.stunnedUntil+.4);}
        hit.controlHits.push(w.time);if(hit.type==='boss')hit.controlImmuneUntil=w.time+10;
      }
    }
    if(b.disarm&&['duelist','wizard','death-eater','duelist-elite','draco'].includes(hit.kind)){
      hit.disarmedUntil=w.time+b.disarm;hit.nextAttack=Math.max(hit.nextAttack,hit.disarmedUntil);
      this.world.telegraphs=this.world.telegraphs.filter(a=>a.ownerId!==hit.id);
    }
    if(b.slow&&hit.type!=='boss'){hit.slowAmount=b.slow;hit.slowUntil=w.time+(b.slowDuration||1)*(p.slowDurationMultiplier??1);}
    if(b.wet)hit.wetUntil=w.time+b.wet+(p.wetDurationBonus||0);
    if(b.burnDamage){hit.burnDamage=Math.max(hit.burnDamage||0,b.burnDamage);hit.burnUntil=w.time+(b.burnDuration||2)+.01;hit.burnNextTick=hit.burnNextTick>w.time?hit.burnNextTick:w.time+1;}
    if(b.knockback&&hit.type!=='boss'){
      const len=Math.max(.001,Math.hypot(b.vx,b.vz)),nx=hit.x+b.vx/len*b.knockback,nz=hit.z+b.vz/len*b.knockback;
      if(this.walkable(nx,nz,hit.radius*.6)){hit.x=nx;hit.z=nz;}
    }
  }
  update(dt){
    if(this.disposed||this.defeated||this.pendingDialogue||!this.world)return;
    this.ensureBattleStart();this.checkStoryEvents();if(this.pendingDialogue)return;
    dt=clamp(Number(dt)||0,0,.05);if(!dt)return;
    const w=this.world,p=w.player;w.time+=dt;this.save.stats.playTimeSeconds+=dt;this.updateRespawns();updateChapterMechanics(this,dt);updateAdvanced(this,dt);if(this.defeated||this.pendingDialogue)return;
    p.barriers=p.barriers.filter(b=>b.remaining>0&&b.until>w.time);p.shield=p.barriers.reduce((sum,b)=>sum+b.remaining,0);
    for(const id of Object.keys(this.cooldowns))this.cooldowns[id]=Math.max(0,this.cooldowns[id]-dt);
    if(p.guarding){
      const cost=4*p.guardCostMultiplier*dt;if(p.mana<cost)this.breakGuard();else{p.mana-=cost;this.lastManaUse=w.time;}
      if(w.time-this.guardPressedAt>1.5)p.guardStability+=20*dt;
      if(p.guardStability>=100)this.breakGuard();
    }else{
      if(w.time-this.guardReleasedAt>.35)p.guardStability=Math.max(0,p.guardStability-40*dt);
      if(w.time-this.lastManaUse>=Math.max(1,2.2-(p.regenDelayReduction||0)))p.mana=Math.min(p.maxMana,p.mana+p.manaRegen*dt*(p.regenUntil>w.time?1.5:1));
    }
    const len=Math.hypot(this.movement.x,this.movement.y);
    if(len){
      const sx=this.movement.x/len,sy=this.movement.y/len;
      const dx=this.movementProjection==='topdown'?sx:(sx+sy)*Math.SQRT1_2;
      const dz=this.movementProjection==='topdown'?sy:(sy-sx)*Math.SQRT1_2;
      const speed=(p.flying||this.scene.theme==='flight'?7.5:5)*(p.moveMultiplier??1)*(p.hp<=p.maxHp*.5?(p.lowHpMoveMultiplier??1):1)*(p.fearUntil>w.time?.85:1)*(this.scene.oxygen&&this.save.progress.flags['ch04.breathing']==='gilly'?1.15:1)*(p.guarding?.6:1)*((p.petrifiedUntil||0)>w.time?0:1)*((p.hasteUntil||0)>w.time?(p.hasteMultiplier||1):1);
      if(this.walkable(p.x+dx*speed*dt,p.z))p.x+=dx*speed*dt;
      if(this.walkable(p.x,p.z+dz*speed*dt))p.z+=dz*speed*dt;
      p.facing=Math.atan2(dx,dz);p.moving=true;
    }else p.moving=false;
    for(const e of w.entities){
      if(!this.available(e))continue;
      e.attackState=w.time<e.stunnedUntil?'stunned':w.telegraphs.some(a=>a.ownerId===e.id)?'windup':w.time<(e.recoverUntil||0)?'recover':'idle';
      if(e.burnUntil>w.time&&w.time>=e.burnNextTick){e.burnNextTick+=1;this.damageEnemy(e,e.burnDamage,'fire');if(this.pendingDialogue||this.defeated)return;if(!e.active)continue;}
      if(['ring','pickup'].includes(e.type)&&distance(e,p)<(e.radius||.8)+.7){
        this.recordEvent('collect',{target:e.id});if(e.type==='ring')this.recordEvent('flight',{target:e.id});
        if(e.reward)this.grantReward(e.reward,`entity:${e.id}`);
        this.save.progress.flags[`collected:${e.id}`]=true;e.active=false;this.effect(e.x,e.z,'#e8ce80','collect',.7);this.emit('sound',{kind:'collect'});this.syncSave();this.emit('changed');
        if(this.scene.theme==='flight'&&this.canExit())this.emit('flightComplete');
      }
      if(e.dormantUntil>w.time||e.charmedUntil>w.time||e.type==='enemy'&&p.stealthUntil>w.time&&distance(e,p)>7)continue;
      if(!enemy(e)||w.time<e.stunnedUntil||!this.lineClear(e,p))continue;
      const d=distance(e,p);
      const troll=e.kind==='troll'||e.pattern==='troll';
      if(!(e.kind==='basilisk'&&w.time<(e.weakUntil||0))&&d>(e.combat?.preferredRange??(e.kind==='serpent'?2.2:troll?3.8:5))&&d<(e.combat?.aggroRange??22)&&!w.telegraphs.some(a=>a.ownerId===e.id)){
        const baseSpeed=e.combat?.speed??e.speed??(troll?2.15:e.type==='boss'?.35:1.1);
        const speed=(e.enraged?(e.combat?.enragedSpeed??baseSpeed*1.2):baseSpeed)*(e.slowUntil>w.time?1-(e.slowAmount||0):1);
        let dx=(p.x-e.x)/d,dz=(p.z-e.z)/d;
        if(this.chapterId!=='ch01')for(const other of w.entities){
          if(other===e||!enemy(other)||other.locked)continue;
          const apart=distance(e,other),space=(e.radius+other.radius)*1.1;
          if(apart>0&&apart<space){dx+=(e.x-other.x)/apart*(space-apart);dz+=(e.z-other.z)/apart*(space-apart);}
        }
        const length=Math.max(1,Math.hypot(dx,dz)),nx=e.x+dx/length*speed*dt,nz=e.z+dz/length*speed*dt;
        if(this.walkable(nx,e.z,e.radius*.6))e.x=nx;
        if(this.walkable(e.x,nz,e.radius*.6))e.z=nz;
      }
      const maxWarnings=this.scene.combat?.maxTelegraphs??(this.chapterId==='ch02'?3:2);
      if(e.onScreen!==false&&d<(e.combat?.attackRange??18)&&w.time>=e.nextAttack&&w.time>=(e.disarmedUntil||0)&&w.telegraphs.length<maxWarnings&&w.time>=this.nextEnemyAttackAt&&this.lineClear(e,p)){
        this.beginAttack(e);if(this.chapterId!=='ch01')this.nextEnemyAttackAt=w.time+(this.scene.combat?.attackSpacing??.22);
      }
    }
    for(const a of [...w.telegraphs]){a.ttl-=dt;if(a.ttl<=0){this.resolveAttack(a);w.telegraphs=w.telegraphs.filter(t=>t!==a);}}
    for(const b of [...w.projectiles]){
      if(b.delay>0){b.delay-=dt;continue;}
      b.ttl-=dt;const speed=b.enemy&&p.slowProjectilesUntil>w.time?.35:1;b.x+=b.vx*dt*speed;b.z+=b.vz*dt*speed;
      if(b.ttl<=0||!this.walkable(b.x,b.z,0,b.enemy?null:b.targetId)){w.projectiles=w.projectiles.filter(x=>x!==b);continue;}
      if(b.enemy){
        if(distance(b,p)<b.radius+.38){
          if(p.birds>0&&p.birdsUntil>w.time){p.birds--;w.projectiles=w.projectiles.filter(x=>x!==b);this.effect(p.x,p.z,'#efda92','guard',.6);continue;}
          if(p.reflectReady&&p.reflectUntil>w.time||p.guarding&&w.time-this.guardPressedAt<=.18&&p.mana>=2&&this.save.player.abilityUnlocks.includes('parry')){const mirror=p.reflectReady&&p.reflectUntil>w.time;if(mirror)p.reflectReady=false;else{p.mana-=2;markParry(this);}b.enemy=false;b.vx*=-1;b.vz*=-1;b.damage=(mirror?b.damage:20)*(p.reflectMultiplier??1);b.reflected=true;b.ttl=2;b.spellId=mirror?'S033':'S026';b.element='arcane';b.poison=0;b.disarm=0;b.fear=0;this.lastManaUse=w.time;this.effect(p.x,p.z,'#ccefff','parry',.7);continue;}
          const damaged=this.damagePlayer(b.damage,true,{element:b.element});
          if(damaged&&b.fear&&!(p.patronusUntil>w.time))p.fearUntil=w.time+b.fear;
          if(damaged&&b.poison)this.applyPoison(b.poison,b.poisonDuration||4);
          if(damaged&&b.disarm)this.applyDisarm(b.disarm);
          w.projectiles=w.projectiles.filter(x=>x!==b);
        }
      }else{
        const hit=w.entities.find(e=>this.available(e)&&combatTarget(e)&&!b.hitIds?.includes(e.id)&&(e.blocking?Math.abs(e.x-b.x)<e.blocking.w/2+b.radius&&Math.abs(e.z-b.z)<e.blocking.d/2+b.radius:distance(e,b)<(e.radius||.7)+b.radius));
        if(hit){
          const targets=b.areaRadius?w.entities.filter(e=>this.available(e)&&combatTarget(e)&&distance(e,hit)<=b.areaRadius&&this.lineClear(hit,e)):[hit];
          for(const target of targets){this.applyProjectileHit(target,b);if(this.pendingDialogue||this.defeated)return;}
          if(b.areaRadius)this.effect(hit.x,hit.z,b.color,'root',.9);
          b.hitIds||=[];b.hitIds.push(hit.id);if(b.pierce>0&&!b.areaRadius){b.pierce--;b.damage*=.6;}else w.projectiles=w.projectiles.filter(x=>x!==b);
        }
      }
    }
    for(const hazard of w.hazards){
      hazard.ttl-=dt;
      if(w.time>=hazard.nextTick){
        hazard.nextTick+=1;
        if(distance(p,hazard)<=hazard.radius+.38&&this.lineClear(hazard,p)){
          const damaged=this.damagePlayer(hazard.damage,false,{element:hazard.element});if(damaged&&!['ice','fire'].includes(hazard.element))this.applyPoison(2,3);
        }
      }
    }
    w.hazards=w.hazards.filter(h=>h.ttl>0);
    if((p.poisonUntil||0)+1e-6>=w.time&&w.time+1e-6>=(p.poisonNextTick||Infinity)){
      p.poisonNextTick+=1;this.damagePlayer(p.poisonDamage||2,false);
    }
    w.effects=w.effects.filter(e=>(e.ttl-=dt)>0);
  }
  canExit(){return!this.defeated&&this.objectives().every(o=>o.done);}
  grantReward(reward,key){
    if(this.save.world.claimedRewardIds.includes(key))return false;
    this.save.inventory.gold+=Math.max(0,Math.floor(reward.gold||0));
    for(const id of reward.spells||[])uniquePush(this.save.player.learnedSpells,id);
    for(const [id,n]of Object.entries(reward.items||{})){
      const d=ITEMS[id];
      if(d?.kind==='quest')this.save.progress.storyItems[id]='owned';
      else if(d?.permanentHp||d?.permanentMana||d?.permanentManaRegen){
        const counter=`permanentCollected:${id}`,prior=Number(this.save.progress.flags[counter]||0),limit=id==='I021'?10:id==='I022'?8:5,amount=Math.max(0,Math.min(n,limit-prior));
        this.save.progress.flags[counter]=prior+amount;
        if(d.permanentHp)this.save.player.permanentGains.maxHp=(this.save.player.permanentGains.maxHp||0)+d.permanentHp*amount;
        if(d.permanentMana)this.save.player.permanentGains.maxMana=(this.save.player.permanentGains.maxMana||0)+d.permanentMana*amount;
        if(d.permanentManaRegen)this.save.player.permanentGains.manaRegen=(this.save.player.permanentGains.manaRegen||0)+d.permanentManaRegen*amount;
      }else this.save.inventory.stacks[id]=(this.save.inventory.stacks[id]||0)+n;
    }
    for(const id of reward.equipment||[]){
      if(!/^[WP]/.test(id))continue;
      const instanceId=`${key}:${id}`;
      if(!this.save.inventory.equipment.some(e=>e.instanceId===instanceId))this.save.inventory.equipment.push({instanceId,catalogId:id,upgrades:{},chargesRemaining:ITEMS[id]?.charges??null});
      if(id.startsWith('W')&&!this.save.loadout.wandInstanceId)this.save.loadout.wandInstanceId=instanceId;
      if(id.startsWith('P')&&!this.save.loadout.pendantInstanceIds.includes(instanceId)){
        const slot=this.save.loadout.pendantInstanceIds.indexOf(null);if(slot>=0)this.save.loadout.pendantInstanceIds[slot]=instanceId;
      }
    }
    uniquePush(this.save.world.claimedRewardIds,key);for(const id of reward.placementIds||[])uniquePush(this.save.world.claimedRewardIds,id);
    this.refreshStats();return true;
  }
  refreshStats(){if(!this.world)return;const p=this.world.player,oldHp=p.maxHp,oldMp=p.maxMana;Object.assign(p,getMaxStats(this.save));p.hp=clamp(p.hp+Math.max(0,p.maxHp-oldHp),0,p.maxHp);p.mana=clamp(p.mana+Math.max(0,p.maxMana-oldMp),0,p.maxMana);}
  finishScene(){
    if(!this.canExit())return{ok:false,message:'아직 남은 목표가 있습니다.'};
    this.grantReward(this.scene.reward||{},`firstClear:${this.scene.id}`);uniquePush(this.save.progress.completedSubchapterIds,this.scene.id);
    const chapterComplete=!!this.scene.chapterEnd||!this.scene.nextId;
    if(chapterComplete){
      uniquePush(this.save.progress.completedChapterIds,this.chapterId);uniquePush(this.save.player.growthRewardIds,`growth.${this.chapterId}`);
      if(this.chapterId==='ch01')this.save.progress.flags['chapter2.ready']=true;
      if(this.scene.nextId)this.save.progress.flags[`chapter${Number(this.scene.nextId.split('-')[0])}.ready`]=true;
      this.refreshStats();
    }
    compactProgress(this.save);this.makeCheckpoint(null);this.syncSave();this.emit('changed');
    return{ok:true,nextId:this.scene.nextId||null,chapterComplete,chapterId:this.chapterId};
  }
  usePendant(slot){
    const instance=this.save.inventory.equipment.find(e=>e.instanceId===this.save.loadout.pendantInstanceIds[slot]),item=instance&&ITEMS[instance.catalogId],p=this.world.player;
    if(!item?.active)return{ok:false,message:'이 슬롯에는 사용형 펜던트가 없습니다.'};
    const key=`pendant.${item.id}`;if(this.defeated||this.cooldowns[key]>0)return{ok:false,message:`다시 사용하기까지 ${Math.ceil(this.cooldowns[key]||0)}초`};
    if(p.mana<item.activeMana)return{ok:false,message:'마나가 부족합니다.'};
    p.mana-=item.activeMana;this.lastManaUse=this.world.time;this.cooldowns[key]=item.activeCooldown;if(item.active==='echo')p.echoReady=true;else p.slowProjectilesUntil=this.world.time+3;
    this.effect(p.x,p.z,'#d9c2ff','slow',1);this.syncSave();this.emit('changed');return{ok:true,message:item.name};
  }
  quickItem(index){
    if(index>1)return ['I001','I003','I006','I008'][index];
    const large=index===0?'I002':'I004';
    return this.save.inventory.stacks[large]>0||Object.entries(this.world.temporarySupplies).some(([k,n])=>k.endsWith(`_${large}`)&&n>0)?large:index===0?'I001':'I003';
  }
  useItem(id){
    const item=ITEMS[id],p=this.world.player;if(!item||item.kind!=='consumable')return{ok:false,message:'사용할 수 없는 물품입니다.'};
    const tempId=Object.keys(this.world.temporarySupplies).find(key=>key.endsWith(`_${id}`)&&this.world.temporarySupplies[key]>0);
    if(!(this.save.inventory.stacks[id]>0)&&!tempId)return{ok:false,message:'가방에 이 물품이 없습니다.'};
    if(this.defeated)return{ok:false,message:'체크포인트에서 다시 시작해 주세요.'};
    if(item.outOfCombat&&this.world.entities.some(e=>enemy(e)&&this.available(e)&&distance(e,p)<18))return{ok:false,message:'전투를 벗어난 뒤 사용할 수 있습니다.'};
    if((this.cooldowns.potion||0)>0)return{ok:false,message:`물약은 ${Math.ceil(this.cooldowns.potion)}초 뒤에 사용할 수 있습니다.`};
    if((item.hp||0)>0&&p.hp>=p.maxHp&&!(item.mana>0))return{ok:false,message:'체력이 가득 차 있습니다.'};
    if((item.mana||0)>0&&p.mana>=p.maxMana&&!(item.hp>0))return{ok:false,message:'마나가 가득 차 있습니다.'};
    if(item.hpCost&&p.hp<=item.hpCost)return{ok:false,message:`체력이 ${item.hpCost}보다 많아야 합니다.`};
    if(tempId)this.world.temporarySupplies[tempId]--;else this.save.inventory.stacks[id]--;
    this.cooldowns.potion=10;p.hp=Math.min(p.maxHp,p.hp-(item.hpCost||0)+(item.hp||0)*(p.potionHealMultiplier??1)*(p.healReceivedMultiplier??1));p.mana=Math.min(p.maxMana,p.mana+(item.mana||0));
    if(item.stealth)p.stealthUntil=this.world.time+item.stealth;
    if(item.decoy)decoy(this,item.decoy);
    if(item.cleansePoison){p.poisonUntil=0;p.poisonNextTick=0;p.poisonImmuneUntil=this.world.time+(item.poisonImmunity||0);}
    if(item.cleanseFear)p.fearUntil=0;
    if(item.shield)p.barriers.push({id:'potion',remaining:item.shield,until:this.world.time+(item.duration||10)});
    if(item.regenMultiplier)p.regenUntil=this.world.time+item.duration;
    if(item.moveMultiplier){p.hasteUntil=this.world.time+(item.duration||15);p.hasteMultiplier=item.moveMultiplier;}
    this.effect(p.x,p.z,'#8ad7ac','heal',.9);this.emit('sound',{kind:'collect'});this.syncSave();this.emit('changed');return{ok:true,message:`${item.name} 사용`};
  }
  buy(shopId,offerId,transactionId){
    if(!transactionId||typeof transactionId!=='string')return{ok:false,message:'거래 ID가 필요합니다.'};
    if(this.save.world.processedTransactionIds.includes(transactionId))return{ok:true,message:'이미 처리한 구매입니다.'};
    const shop=SHOPS[shopId],offer=shop?.offers.find(o=>o.id===offerId);
    if(!offer||!offerAvailable(offer,this.save)||!Number.isFinite(offer.price)||offer.price<0)return{ok:false,message:'구매할 수 없는 상품입니다.'};
    if(!this.world.entities.some(e=>e.shopId===shopId&&this.available(e)))return{ok:false,message:'이곳에서는 해당 상점을 이용할 수 없습니다.'};
    if(offer.spellId&&this.save.player.learnedSpells.includes(offer.spellId))return{ok:false,message:'이미 배운 주문입니다.'};
    const ledger=this.save.world.shopOffers[offer.id]||{remaining:offer.stock??null,purchased:0};
    if(ledger.remaining!==null&&ledger.remaining<1)return{ok:false,message:'품절되었습니다.'};
    if(this.save.inventory.gold<offer.price)return{ok:false,message:'골드가 부족합니다.'};
    const id=offer.itemId,gear=id&&/^[WP]/.test(id);
    this.save.inventory.gold-=offer.price;
    this.grantReward({items:id&&!gear?{[id]:1}:{},equipment:gear?[id]:[],spells:offer.spellId?[offer.spellId]:[]},`purchase:${transactionId}`);
    if(ledger.remaining!==null)ledger.remaining--;ledger.purchased++;
    this.save.world.shopOffers[offer.id]=ledger;uniquePush(this.save.world.processedTransactionIds,transactionId);
    this.makeCheckpoint(this.save.checkpoint.bossPhaseId);this.syncSave();this.emit('changed');return{ok:true,message:'가방에 추가했습니다.'};
  }
  equip(instanceId,slot='wand'){
    const item=this.save.inventory.equipment.find(e=>e.instanceId===instanceId);
    if(!item)return{ok:false,message:'보유하지 않은 장비입니다.'};
    if(this.battleActive||this.world.entities.some(e=>enemy(e)&&this.available(e)&&distance(e,this.world.player)<18))return{ok:false,message:'전투를 마친 뒤 장비를 바꿀 수 있습니다.'};
    if(slot==='wand'&&item.catalogId.startsWith('W'))this.save.loadout.wandInstanceId=instanceId;
    else if(Number.isInteger(slot)&&slot>=0&&slot<3&&item.catalogId.startsWith('P')){
      const old=this.save.loadout.pendantInstanceIds.indexOf(instanceId);if(old>=0)this.save.loadout.pendantInstanceIds[old]=null;this.save.loadout.pendantInstanceIds[slot]=instanceId;
    }else return{ok:false,message:'장비와 슬롯이 맞지 않습니다.'};
    this.refreshStats();this.makeCheckpoint(null);this.syncSave();this.emit('changed');return{ok:true,message:'장비를 장착했습니다.'};
  }
  unequip(slot){
    if(!Number.isInteger(slot)||slot<0||slot>=3)return{ok:false,message:'펜던트 슬롯을 확인해 주세요.'};
    if(this.battleActive||this.world.entities.some(e=>enemy(e)&&this.available(e)&&distance(e,this.world.player)<18))return{ok:false,message:'전투를 마친 뒤 장비를 바꿀 수 있습니다.'};
    if(this.save.loadout.pendantInstanceIds[slot]===null)return{ok:false,message:'비어 있는 슬롯입니다.'};
    this.save.loadout.pendantInstanceIds[slot]=null;this.refreshStats();this.makeCheckpoint(null);this.syncSave();this.emit('changed');return{ok:true,message:'펜던트를 해제했습니다.'};
  }
  cycleTarget(){
    const p=this.world.player,targets=this.world.entities.filter(e=>this.available(e)&&e.onScreen!==false&&combatTarget(e)&&distance(e,p)<18&&this.lineClear(p,e));
    if(!targets.length){this.world.targetId=null;return null;}
    const index=targets.findIndex(e=>e.id===this.world.targetId);this.world.targetId=targets[(index+1)%targets.length].id;return this.world.targetId;
  }
  makeCheckpoint(bossPhaseId=null){
    if(!this.world||this.battleActive)return;
    bossPhaseId=null;
    const p=this.world.player,id=bossPhaseId?`${this.chapterId}.${this.scene.id}.checkpoint.${bossPhaseId}`:`${this.chapterId}.${this.scene.id}.checkpoint.entry`;
    const consumables={};for(const [id,n]of Object.entries(this.save.inventory.stacks))if(ITEMS[id]?.kind==='consumable')consumables[id]=n;
    this.save.cursor.checkpointId=id;
    this.save.checkpoint={id,bossPhaseId,hp:Math.max(1,p.hp),mana:p.mana,personalConsumables:consumables,temporarySupplies:{...this.world.temporarySupplies},cooldownsSeconds:{...this.cooldowns},healingChargesRemaining:this.save.player.healingChargesRemaining,equipmentCharges:Object.fromEntries(this.save.inventory.equipment.map(e=>[e.instanceId,e.chargesRemaining]))};
  }
  syncSave(){if(!this.world)return this.save;this.save.player.hp=this.save.checkpoint.hp;this.save.player.mana=this.save.checkpoint.mana;return this.save;}
  restartCheckpoint(){const scene=this.scene;this.loadScene(scene);this.toast('체크포인트에서 다시 시작합니다.');}
  dispose(){this.disposed=true;this.movement={x:0,y:0};if(this.world){this.world.projectiles=[];this.world.telegraphs=[];this.world.effects=[];this.world.hazards=[];}this.onEvent=()=>{};}
}
