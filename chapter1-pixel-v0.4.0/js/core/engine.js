import { SPELLS, ITEMS, SHOPS } from '../catalog.js';
import { newGame, cloneSave, getMaxStats } from './state.js';

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
const TROLL_ATTACKS={
  slam:{kind:'slam',damage:26,duration:1.1,radius:3.25,cooldown:1.45},
  sweep:{kind:'sweep',damage:21,duration:1.05,radius:5.1,cooldown:1.35},
  doubleSlam:{kind:'slam',damage:19,duration:1.05,radius:3.1,cooldown:1.5,followUp:true},
  charge:{kind:'charge',damage:28,duration:1.2,radius:1.65,cooldown:1.8}
};

export class GameEngine {
  constructor({save=newGame(),scene,onEvent=()=>{},movementProjection='isometric'}={}) {
    this.save=save;this.onEvent=onEvent;this.movement={x:0,y:0};this.sequence=0;this.disposed=false;
    // Input projection belongs to the presentation, never to saved progression.
    this.movementProjection=movementProjection==='topdown'?'topdown':'isometric';
    if(scene)this.loadScene(scene);
  }
  emit(type,extra={}){this.onEvent({type,...extra});}
  toast(message){this.emit('toast',{message});}
  loadScene(scene) {
    this.disposed=false;this.scene=scene;this.movement={x:0,y:0};
    const same=this.save.cursor.subchapterId===scene.id;
    const stats=getMaxStats(this.save),spawn=scene.spawn||{x:5,z:5};
    const priorHp=same?this.save.checkpoint.hp:this.save.player.hp;
    const priorMana=same?this.save.checkpoint.mana:this.save.player.mana;
    const safeRest=scene.rest===true||['train','classroom','library'].includes(scene.theme);
    this.world={time:0,player:{x:spawn.x,z:spawn.z,facing:Math.PI,hp:safeRest?stats.maxHp:clamp(priorHp||stats.maxHp,1,stats.maxHp),mana:safeRest?stats.maxMana:clamp(priorMana??stats.maxMana,0,stats.maxMana),...stats,guarding:false,guardStability:0,shield:stats.startShield,barriers:stats.startShield?[{id:'equipment',remaining:stats.startShield,until:Infinity}]:[]},entities:[],projectiles:[],telegraphs:[],effects:[],targetId:null,temporarySupplies:{...(same?this.save.checkpoint.temporarySupplies:scene.temporarySupplies||{})}};
    this.guardPressedAt=-99;this.guardReleasedAt=-99;this.guardLastPress=-99;this.guardBrokenUntil=-1;this.lastManaUse=-99;this.lastHit=-99;this.defeated=false;this.cooldowns={};
    this.save.cursor={chapterId:'ch01',subchapterId:scene.id,checkpointId:same?this.save.cursor.checkpointId:`ch01.${scene.id}.checkpoint.entry`};
    for(const id of scene.grantSpells||[])uniquePush(this.save.player.learnedSpells,id);
    if(same){
      for(const [id,q] of Object.entries(this.save.checkpoint.personalConsumables))this.save.inventory.stacks[id]=q;
      for(const e of this.save.inventory.equipment)if(e.instanceId in this.save.checkpoint.equipmentCharges)e.chargesRemaining=this.save.checkpoint.equipmentCharges[e.instanceId];
      this.save.player.healingChargesRemaining=this.save.checkpoint.healingChargesRemaining;
      this.cooldowns={...this.save.checkpoint.cooldownsSeconds};
    }
    for(const config of scene.entities||[]){
      const doneKill=this.save.progress.completedObjectiveIds.some(id=>scene.objectives?.some(o=>o.id===id&&o.event==='kill'&&o.target===config.id));
      const interacted=scene.objectives?.some(o=>o.event==='interact'&&o.target===config.id&&this.save.progress.completedObjectiveIds.includes(o.id));
      const consumed=!!config.consumeOnInteract&&(this.save.progress.flags[`consumed:${config.id}`]===true||interacted);
      const collected=this.save.progress.flags[`collected:${config.id}`]===true;
      let activated=scene.objectives?.some(o=>o.event==='cast'&&o.target===config.id&&this.save.progress.completedObjectiveIds.includes(o.id));
      if(config.rearmWhileEnemyAlive&&!scene.objectives?.some(o=>o.event==='kill'&&o.target===config.rearmWhileEnemyAlive&&this.save.progress.completedObjectiveIds.includes(o.id)))activated=false;
      const locked=(config.conditions||[]).some(id=>!this.save.progress.completedObjectiveIds.includes(id));
      const e={...config,active:!doneKill&&!collected&&(!consumed||config.consumedVisual==='harvested'),consumed,visualState:consumed?(config.consumedVisual||'hidden'):'intact',activated:!!activated,locked,maxHp:config.hp||20,hp:config.hp||20,radius:config.radius||.75,phase:1,attackIndex:0,nextAttack:config.combat?.startDelay??(config.kind==='troll'?1.2:2.5),stunnedUntil:0,facing:0};
      if(e.type==='target'){
        const savedHp=this.save.progress.flags[`visualHp:${e.id}`];
        if(typeof savedHp==='number')e.hp=clamp(savedHp,0,e.maxHp);
        else if(activated)e.hp=e.maxHp*.8;
        this.updateTargetVisual(e);
      }
      if(e.type==='boss'){
        e.phase=Number(this.save.progress.flags[`bossPhase:${e.id}`]||1);
        if(e.phase>1)e.hp=e.maxHp*(e.phase===2?.65:.3);
      }
      this.world.entities.push(e);
    }
    if(!same||safeRest)this.makeCheckpoint(null);
    this.syncSave();this.emit('changed');
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
  available(e){e.locked=!(e.conditions||[]).every(id=>this.save.progress.completedObjectiveIds.includes(id));return e.active!==false&&!e.consumed&&!e.locked;}
  walkable(x,z,r=.38){
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
    return !(this.scene.blockers||[]).some(b=>x>b.x-b.w/2-r&&x<b.x+b.w/2+r&&z>b.z-b.d/2-r&&z<b.z+b.d/2+r);
  }
  lineClear(a,b){const d=distance(a,b),steps=Math.max(1,Math.ceil(d/.3));for(let i=1;i<steps;i++){const f=i/steps;if(!this.walkable(a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f,0))return false;}return true;}
  objectives(){return(this.scene.objectives||[]).map(o=>({...o,current:Number(this.save.progress.flags[`objectiveCount:${o.id}`]||0),done:this.save.progress.completedObjectiveIds.includes(o.id)}));}
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
      if(entity.shopId)uniquePush(this.save.world.shopUnlockIds,entity.shopId);
    }
    let changed=false;
    for(const o of this.scene.objectives||[]){
      if(o.event!==eventName||o.target&&o.target!==payload.target||o.spell&&o.spell!==payload.spell||this.save.progress.completedObjectiveIds.includes(o.id))continue;
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
      if(!this.world.entities.some(enemy))this.makeCheckpoint(null);
      this.syncSave();this.emit('changed');
    }
  }
  interact(){
    if(this.defeated)return null;
    const p=this.world.player;
    const list=this.world.entities.filter(e=>this.available(e)&&['npc','prop','pickup'].includes(e.type)&&distance(e,p)<=3.2+(e.radius||.5)&&this.lineClear(p,e));
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
    const utility=['light','repair','levitate','unlock'].includes(spell.kind);
    const cost=spell.mana*(utility?p.explorationCostMultiplier:1);
    if(p.mana+1e-6<cost)return{ok:false,message:'마나가 부족합니다. 잠시 기다려 주세요.'};
    const valid=this.world.entities.filter(e=>this.available(e)&&(!['enemy','boss','target'].includes(e.type)||e.onScreen!==false)&&distance(p,e)<=range&&this.lineClear(p,e));
    const matches=valid.filter(e=>(!e.activated||e.repeatable)&&(e.spell===spell.id||this.scene.objectives?.some(o=>o.event==='cast'&&o.spell===spell.id&&o.target===e.id&&!this.save.progress.completedObjectiveIds.includes(o.id))));
    const locked=valid.find(e=>e.id===this.world.targetId&&combatTarget(e));
    let target=matches.filter(e=>!e.destroyed).sort((a,b)=>distance(p,a)-distance(p,b))[0]||locked||valid.filter(combatTarget).sort((a,b)=>distance(p,a)-distance(p,b))[0];
    if(utility&&!target&&spell.kind!=='light')return{ok:false,message:'주문에 반응할 장치 가까이 이동해 주세요.'};
    if(utility&&target&&!matches.includes(target)&&spell.kind!=='light')return{ok:false,message:'이 대상에는 다른 주문이 필요합니다.'};
    p.mana=Math.max(0,p.mana-cost);this.lastManaUse=this.world.time;this.cooldowns[spell.id]=spell.cooldown||0;
    this.save.player.spellMastery[spell.id]=(this.save.player.spellMastery[spell.id]||0)+1;
    if(target){p.facing=Math.atan2(target.x-p.x,target.z-p.z);this.world.targetId=target.id;}
    if(spell.kind==='shield'){
      p.barriers=p.barriers.filter(b=>b.id!==spell.id);
      p.barriers.push({id:spell.id,remaining:spell.shield||15,until:this.world.time+(spell.duration||4)});
      p.shield=p.barriers.reduce((sum,b)=>sum+b.remaining,0);
    }
    if(utility||spell.kind==='shield'){
      this.effect(target?.x??p.x,target?.z??p.z,spell.color||'#a6e9e2',spell.kind,1.2);
      if(spell.kind==='light')this.world.lightUntil=spell.id==='S035'?0:Infinity;
      if(matches.includes(target)){
        target.activated=true;
        this.recordEvent('cast',{target:target.id,spell:spell.id});
        if(spell.kind==='levitate'&&target.kind==='club'){
          const troll=this.world.entities.find(e=>enemy(e)&&e.kind==='troll');
          if(troll){this.damageEnemy(troll,Math.max(60,troll.hp*.35));troll.stunnedUntil=this.world.time+2.8;this.world.telegraphs=this.world.telegraphs.filter(a=>a.ownerId!==troll.id);troll.nextAttack=troll.stunnedUntil+.65;this.toast('공중의 곤봉이 트롤을 강타했습니다!');}
        }
      }else this.recordEvent('cast',{spell:spell.id});
    }else{
      const tx=target?.x??p.x+Math.sin(p.facing)*range,tz=target?.z??p.z+Math.cos(p.facing)*range;
      const len=Math.max(.01,Math.hypot(tx-p.x,tz-p.z));
      const multiplier=spell.kind==='fire'?p.fireMultiplier:word.length===1?p.runeMultiplier:1;
      this.world.projectiles.push({id:`p${++this.sequence}`,x:p.x,z:p.z,y:1,vx:(tx-p.x)/len*16,vz:(tz-p.z)/len*16,color:spell.color||'#b4b0ff',radius:spell.kind==='fire'?.38:.2,enemy:false,damage:(spell.damage??5)*p.power*multiplier,spellId:spell.id,targetId:target?.id,ttl:range/16+.15,originX:p.x,originZ:p.z,stun:spell.stun||spell.control,slow:spell.slow,slowDuration:spell.slowDuration,burnDamage:spell.burnDamage,burnDuration:spell.burnDuration,knockback:spell.knockback});
      if(matches.includes(target)&&!['enemy','boss','target'].includes(target.type)){
        target.activated=true;this.recordEvent('cast',{target:target.id,spell:spell.id});
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
  damageEnemy(e,amount){
    if(!e.active||e.destroyed)return;
    e.hp=Math.max(0,e.hp-amount);this.effect(e.x,e.z,'#efc878','hit',.4);
    e.hitUntil=this.world.time+.18;
    if(e.type==='target'){
      this.updateTargetVisual(e);this.save.progress.flags[`visualHp:${e.id}`]=e.hp;
      if(e.destroyed){this.recordEvent('kill',{target:e.id});this.world.targetId=null;this.effect(e.x,e.z,'#c7ab77','defeat',.8);}
      this.syncSave();this.emit('changed');return;
    }
    if(e.kind==='troll'||e.pattern==='troll'){
      const wasEnraged=e.enraged;e.enraged=e.hp>0&&e.hp<=e.maxHp*(e.combat?.enrageAt??.5);
      if(e.enraged&&!wasEnraged){this.effect(e.x,e.z,'#eb7754','enrage',1);this.toast('트롤이 격분했습니다! 연속 공격에 주의하세요.');}
    }
    if(e.type==='boss'&&e.hp>0){
      const phase=e.hp<=e.maxHp*.3?3:e.hp<=e.maxHp*.65?2:1;
      if(phase>e.phase&&e.kind!=='troll'){
        e.phase=phase;this.save.progress.flags[`bossPhase:${e.id}`]=phase;
        this.world.projectiles=this.world.projectiles.filter(p=>!p.enemy);this.world.telegraphs=[];e.nextAttack=this.world.time+3.2;
        this.makeCheckpoint(`${e.id}.phase${phase}`);this.emit('bossPhase',{phase});this.emit('changed');
      }
    }
    if(e.hp===0){
      // Record while available, then hide the defeated entity.
      this.recordEvent('kill',{target:e.id});e.active=false;
      this.world.telegraphs=this.world.telegraphs.filter(t=>t.ownerId!==e.id);
      if(e.reward)this.grantReward(e.reward,`entity:${e.id}`);
      this.effect(e.x,e.z,'#e2c487','defeat',1.2);this.emit('sound',{kind:'victory'});
      if(!this.world.entities.some(enemy))this.makeCheckpoint(null);
      this.syncSave();this.emit('changed');
    }
  }
  damagePlayer(amount,blockable=true){
    const p=this.world.player,t=this.world.time;
    if(this.defeated||t-this.lastHit<.45)return;
    this.lastHit=t;let damage=amount;
    if(p.guarding&&blockable){
      if(t-this.guardPressedAt<=.18&&p.mana>=2){damage=0;p.mana-=2;this.effect(p.x,p.z,'#ccefff','parry',.7);this.toast('정밀 방어!');}
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
    if(p.hp===0){this.defeated=true;this.setGuard(false);this.setMovement(0,0);this.emit('defeat');}
  }
  breakGuard(){const p=this.world.player;p.guarding=false;p.guardStability=0;this.guardBrokenUntil=this.world.time+1;this.guardReleasedAt=this.world.time;this.toast('방어가 무너졌습니다. 이동으로 피하세요!');}
  beginAttack(e){
    const p=this.world.player,t=this.world.time,index=e.attackIndex++;
    let kind='bolt',damage=e.damage||12,duration=1.05,radius=1,cooldown=3.8,followUp=false;
    const troll=e.kind==='troll'||e.pattern==='troll';
    if(troll){
      const combat=e.combat||{};
      e.enraged=e.hp<=e.maxHp*(combat.enrageAt??.5);
      const sequence=e.enraged?(combat.enragedSequence||['doubleSlam','charge','sweep','slam']):(combat.sequence||['slam','sweep','doubleSlam','charge']);
      const selected=distance(e,p)>7?'charge':sequence[index%sequence.length];
      const attack={...(TROLL_ATTACKS[selected]||TROLL_ATTACKS.slam),...(combat.attacks?.[selected]||{})};
      ({kind,damage,duration,radius,cooldown,followUp=false}=attack);
      if(e.enraged){duration=Math.max(.8,duration*.85);cooldown*=.8;radius+=kind==='charge'?.15:.35;}
      // A ground marker locks onto the player's current point. Leave a quarter
      // second beyond the unguarded walk-out time, even after an enrage buff.
      if(kind==='slam')duration=Math.max(duration,(radius+.38)/5+.25);
      e.attackPattern=selected;
    }
    else if(e.kind==='quirrell'||e.pattern==='quirrell'){
      const attacks=e.phase===1?['bolt','fire','bolt']:e.phase===2?['bolt','fire','shadow']:['bolt','shadow','charge','fire'];kind=attacks[index%attacks.length];
      ({damage,duration,cooldown,radius}=({bolt:{damage:14,duration:.95,cooldown:3.5,radius:1},fire:{damage:20,duration:1.4,cooldown:8,radius:2.8},shadow:{damage:18,duration:1.2,cooldown:7,radius:3.4},charge:{damage:25,duration:1.6,cooldown:10,radius:2}})[kind]);
    }
    let x=kind==='sweep'?e.x:p.x,z=kind==='sweep'?e.z:p.z;
    if(kind==='charge'){
      const maxRange=troll?(e.combat?.chargeRange??12):18,dx=p.x-e.x,dz=p.z-e.z,d=Math.max(.01,Math.hypot(dx,dz));
      let travel=Math.min(d+1.2,maxRange),safe=0;
      for(let step=.2;step<=travel;step+=.2){if(!this.walkable(e.x+dx/d*step,e.z+dz/d*step,e.radius*.6))break;safe=step;}
      x=e.x+dx/d*safe;z=e.z+dz/d*safe;
    }
    const blockable=!['fire','slam','sweep','charge'].includes(kind);
    this.world.telegraphs.push({id:`t${++this.sequence}`,ownerId:e.id,x,z,radius,shape:kind==='bolt'||kind==='charge'?'line':'circle',color:!blockable?'#f16f69':kind==='shadow'?'#b29bcc':'#7ec4de',ttl:duration,duration,kind,damage,originX:e.x,originZ:e.z,blockable,followUp,sequenceStage:1,cooldown});
    e.nextAttack=t+duration+cooldown;e.facing=Math.atan2(p.x-e.x,p.z-e.z);e.attackState='windup';e.recoverUntil=e.nextAttack;
  }
  resolveAttack(a){
    const e=this.world.entities.find(e=>e.id===a.ownerId);if(!e?.active||this.world.time<e.stunnedUntil)return;
    e.attackState='recover';
    if(a.kind==='bolt'){
      if(e.onScreen===false)return;
      const d=Math.max(.01,Math.hypot(a.x-a.originX,a.z-a.originZ));
      this.world.projectiles.push({id:`p${++this.sequence}`,x:a.originX,z:a.originZ,y:1,vx:(a.x-a.originX)/d*8,vz:(a.z-a.originZ)/d*8,radius:.3,color:'#c39bdb',enemy:true,damage:a.damage,ttl:4});
    }else{
      if(a.kind==='charge'&&this.walkable(a.x,a.z,e.radius*.6)){e.x=a.x;e.z=a.z;}
      this.effect(a.x,a.z,a.color,a.kind,.8);
      const hit=a.kind==='charge'?segmentDistance(this.world.player,{x:a.originX,z:a.originZ},a)<=a.radius+.38:distance(this.world.player,a)<=a.radius+.38;
      if(hit&&this.lineClear(e,this.world.player))this.damagePlayer(a.damage,a.blockable);
      if(a.followUp&&e.hp>0){
        const p=this.world.player,duration=e.enraged?1:1.05;
        this.world.telegraphs.push({id:`t${++this.sequence}`,ownerId:e.id,x:p.x,z:p.z,radius:e.enraged?3.25:3.1,shape:'circle',color:'#f16f69',ttl:duration,duration,kind:'slam',damage:22,originX:e.x,originZ:e.z,blockable:false,sequenceStage:2});
        e.nextAttack=this.world.time+duration+(a.cooldown||1.5);e.recoverUntil=e.nextAttack;e.attackState='windup';
      }
    }
  }
  update(dt){
    if(this.disposed||this.defeated||!this.world)return;
    dt=clamp(Number(dt)||0,0,.05);if(!dt)return;
    const w=this.world,p=w.player;w.time+=dt;this.save.stats.playTimeSeconds+=dt;
    p.barriers=p.barriers.filter(b=>b.remaining>0&&b.until>w.time);p.shield=p.barriers.reduce((sum,b)=>sum+b.remaining,0);
    for(const id of Object.keys(this.cooldowns))this.cooldowns[id]=Math.max(0,this.cooldowns[id]-dt);
    if(p.guarding){
      const cost=4*p.guardCostMultiplier*dt;if(p.mana<cost)this.breakGuard();else{p.mana-=cost;this.lastManaUse=w.time;}
      if(w.time-this.guardPressedAt>1.5)p.guardStability+=20*dt;
      if(p.guardStability>=100)this.breakGuard();
    }else{
      if(w.time-this.guardReleasedAt>.35)p.guardStability=Math.max(0,p.guardStability-40*dt);
      if(w.time-this.lastManaUse>=2.2)p.mana=Math.min(p.maxMana,p.mana+p.manaRegen*dt);
    }
    const len=Math.hypot(this.movement.x,this.movement.y);
    if(len){
      const sx=this.movement.x/len,sy=this.movement.y/len;
      const dx=this.movementProjection==='topdown'?sx:(sx+sy)*Math.SQRT1_2;
      const dz=this.movementProjection==='topdown'?sy:(sy-sx)*Math.SQRT1_2;
      const speed=(this.scene.theme==='flight'?7.5:5)*(p.guarding?.6:1);
      if(this.walkable(p.x+dx*speed*dt,p.z))p.x+=dx*speed*dt;
      if(this.walkable(p.x,p.z+dz*speed*dt))p.z+=dz*speed*dt;
      p.facing=Math.atan2(dx,dz);p.moving=true;
    }else p.moving=false;
    for(const e of w.entities){
      if(!this.available(e))continue;
      e.attackState=w.time<e.stunnedUntil?'stunned':w.telegraphs.some(a=>a.ownerId===e.id)?'windup':w.time<(e.recoverUntil||0)?'recover':'idle';
      if(e.burnUntil>w.time&&w.time>=e.burnNextTick){e.burnNextTick+=1;this.damageEnemy(e,e.burnDamage);if(!e.active)continue;}
      if(['ring','pickup'].includes(e.type)&&distance(e,p)<(e.radius||.8)+.7){
        this.recordEvent('collect',{target:e.id});if(e.type==='ring')this.recordEvent('flight',{target:e.id});
        if(e.reward)this.grantReward(e.reward,`entity:${e.id}`);
        this.save.progress.flags[`collected:${e.id}`]=true;e.active=false;this.effect(e.x,e.z,'#e8ce80','collect',.7);this.emit('sound',{kind:'collect'});this.syncSave();this.emit('changed');
        if(this.scene.theme==='flight'&&this.canExit())this.emit('flightComplete');
      }
      if(!enemy(e)||w.time<e.stunnedUntil||!this.lineClear(e,p))continue;
      const d=distance(e,p);
      const troll=e.kind==='troll'||e.pattern==='troll';
      if(d>(troll?3.8:5)&&d<(e.combat?.aggroRange??22)&&!w.telegraphs.some(a=>a.ownerId===e.id)){
        const baseSpeed=e.combat?.speed??e.speed??(troll?2.15:e.type==='boss'?.35:1.1);
        const speed=(e.enraged?(e.combat?.enragedSpeed??baseSpeed*1.2):baseSpeed)*(e.slowUntil>w.time?1-(e.slowAmount||0):1);
        const nx=e.x+(p.x-e.x)/d*speed*dt,nz=e.z+(p.z-e.z)/d*speed*dt;
        if(this.walkable(nx,nz,e.radius*.6)){e.x=nx;e.z=nz;}
      }
      if(e.onScreen!==false&&d<(e.combat?.attackRange??18)&&w.time>=e.nextAttack&&w.telegraphs.length<2&&this.lineClear(e,p))this.beginAttack(e);
    }
    for(const a of [...w.telegraphs]){a.ttl-=dt;if(a.ttl<=0){this.resolveAttack(a);w.telegraphs=w.telegraphs.filter(t=>t!==a);}}
    for(const b of [...w.projectiles]){
      b.ttl-=dt;b.x+=b.vx*dt;b.z+=b.vz*dt;
      if(b.ttl<=0||!this.walkable(b.x,b.z,0)){w.projectiles=w.projectiles.filter(x=>x!==b);continue;}
      if(b.enemy){if(distance(b,p)<b.radius+.38){this.damagePlayer(b.damage,true);w.projectiles=w.projectiles.filter(x=>x!==b);}}
      else{
        const hit=w.entities.find(e=>this.available(e)&&combatTarget(e)&&distance(e,b)<(e.radius||.7)+b.radius);
        if(hit){
          this.recordEvent('cast',{target:hit.id,spell:b.spellId});this.damageEnemy(hit,b.damage);
          if(b.stun&&hit.active){
            hit.controlHits=(hit.controlHits||[]).filter(t=>w.time-t<8);
            const repeated=[1,.5,0][Math.min(2,hit.controlHits.length)];
            if(hit.type!=='boss'||w.time>=(hit.controlImmuneUntil||0)){
              hit.stunnedUntil=w.time+(hit.type==='boss'?Math.min(.4,b.stun*.25):b.stun)*repeated;
              hit.controlHits.push(w.time);if(hit.type==='boss')hit.controlImmuneUntil=w.time+10;
            }
          }
          if(b.slow){hit.slowAmount=b.slow;hit.slowUntil=w.time+(b.slowDuration||1);}
          if(b.burnDamage){hit.burnDamage=Math.max(hit.burnDamage||0,b.burnDamage);hit.burnUntil=w.time+(b.burnDuration||2)+.01;hit.burnNextTick=hit.burnNextTick>w.time?hit.burnNextTick:w.time+1;}
          if(b.knockback&&hit.type!=='boss'){
            const len=Math.max(.001,Math.hypot(b.vx,b.vz)),nx=hit.x+b.vx/len*b.knockback,nz=hit.z+b.vz/len*b.knockback;
            if(this.walkable(nx,nz,hit.radius*.6)){hit.x=nx;hit.z=nz;}
          }
          w.projectiles=w.projectiles.filter(x=>x!==b);
        }
      }
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
      else if(d?.permanentHp||d?.permanentMana){
        const counter=`permanentCollected:${id}`,prior=Number(this.save.progress.flags[counter]||0),limit=id==='I021'?10:id==='I022'?8:5,amount=Math.max(0,Math.min(n,limit-prior));
        this.save.progress.flags[counter]=prior+amount;
        if(d.permanentHp)this.save.player.permanentGains.maxHp=(this.save.player.permanentGains.maxHp||0)+d.permanentHp*amount;
        if(d.permanentMana)this.save.player.permanentGains.maxMana=(this.save.player.permanentGains.maxMana||0)+d.permanentMana*amount;
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
    const chapterComplete=!this.scene.nextId;
    if(chapterComplete){uniquePush(this.save.progress.completedChapterIds,'ch01');uniquePush(this.save.player.growthRewardIds,'growth.ch01');this.save.progress.flags['chapter2.ready']=false;this.refreshStats();}
    this.makeCheckpoint(null);this.syncSave();this.emit('changed');
    return{ok:true,nextId:this.scene.nextId||null,chapterComplete};
  }
  useItem(id){
    const item=ITEMS[id],p=this.world.player;if(!item||item.kind!=='consumable')return{ok:false,message:'사용할 수 없는 물품입니다.'};
    const tempId=Object.keys(this.world.temporarySupplies).find(key=>key.endsWith(`_${id}`)&&this.world.temporarySupplies[key]>0);
    if(!(this.save.inventory.stacks[id]>0)&&!tempId)return{ok:false,message:'가방에 이 물품이 없습니다.'};
    if(this.defeated)return{ok:false,message:'체크포인트에서 다시 시작해 주세요.'};
    if((this.cooldowns.potion||0)>0)return{ok:false,message:`물약은 ${Math.ceil(this.cooldowns.potion)}초 뒤에 사용할 수 있습니다.`};
    if((item.hp||0)>0&&p.hp>=p.maxHp&&!(item.mana>0))return{ok:false,message:'체력이 가득 차 있습니다.'};
    if((item.mana||0)>0&&p.mana>=p.maxMana&&!(item.hp>0))return{ok:false,message:'마나가 가득 차 있습니다.'};
    if(tempId)this.world.temporarySupplies[tempId]--;else this.save.inventory.stacks[id]--;
    this.cooldowns.potion=10;p.hp=Math.min(p.maxHp,p.hp+(item.hp||0));p.mana=Math.min(p.maxMana,p.mana+(item.mana||0));
    this.effect(p.x,p.z,'#8ad7ac','heal',.9);this.emit('sound',{kind:'collect'});this.syncSave();this.emit('changed');return{ok:true,message:`${item.name} 사용`};
  }
  buy(shopId,offerId,transactionId){
    if(!transactionId||typeof transactionId!=='string')return{ok:false,message:'거래 ID가 필요합니다.'};
    if(this.save.world.processedTransactionIds.includes(transactionId))return{ok:true,message:'이미 처리한 구매입니다.'};
    const shop=SHOPS[shopId],offer=shop?.offers.find(o=>o.id===offerId);
    if(!offer||!Number.isFinite(offer.price)||offer.price<0)return{ok:false,message:'구매할 수 없는 상품입니다.'};
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
    if(this.world.entities.some(e=>enemy(e)&&distance(e,this.world.player)<18))return{ok:false,message:'전투를 마친 뒤 장비를 바꿀 수 있습니다.'};
    if(slot==='wand'&&item.catalogId.startsWith('W'))this.save.loadout.wandInstanceId=instanceId;
    else if(Number.isInteger(slot)&&slot>=0&&slot<3&&item.catalogId.startsWith('P')){
      const old=this.save.loadout.pendantInstanceIds.indexOf(instanceId);if(old>=0)this.save.loadout.pendantInstanceIds[old]=null;this.save.loadout.pendantInstanceIds[slot]=instanceId;
    }else return{ok:false,message:'장비와 슬롯이 맞지 않습니다.'};
    this.refreshStats();this.makeCheckpoint(null);this.syncSave();this.emit('changed');return{ok:true,message:'장비를 장착했습니다.'};
  }
  cycleTarget(){
    const p=this.world.player,targets=this.world.entities.filter(e=>this.available(e)&&e.onScreen!==false&&combatTarget(e)&&distance(e,p)<18&&this.lineClear(p,e));
    if(!targets.length){this.world.targetId=null;return null;}
    const index=targets.findIndex(e=>e.id===this.world.targetId);this.world.targetId=targets[(index+1)%targets.length].id;return this.world.targetId;
  }
  makeCheckpoint(bossPhaseId=null){
    if(!this.world)return;
    const p=this.world.player,id=bossPhaseId?`ch01.${this.scene.id}.checkpoint.${bossPhaseId}`:`ch01.${this.scene.id}.checkpoint.entry`;
    const consumables={};for(const [id,n]of Object.entries(this.save.inventory.stacks))if(ITEMS[id]?.kind==='consumable')consumables[id]=n;
    this.save.cursor.checkpointId=id;
    this.save.checkpoint={id,bossPhaseId,hp:Math.max(1,p.hp),mana:p.mana,personalConsumables:consumables,temporarySupplies:{...this.world.temporarySupplies},cooldownsSeconds:{...this.cooldowns},healingChargesRemaining:this.save.player.healingChargesRemaining,equipmentCharges:Object.fromEntries(this.save.inventory.equipment.map(e=>[e.instanceId,e.chargesRemaining]))};
  }
  syncSave(){if(!this.world)return this.save;this.save.player.hp=this.save.checkpoint.hp;this.save.player.mana=this.save.checkpoint.mana;return this.save;}
  restartCheckpoint(){const scene=this.scene;this.loadScene(scene);this.toast('체크포인트에서 다시 시작합니다.');}
  dispose(){this.disposed=true;this.movement={x:0,y:0};if(this.world){this.world.projectiles=[];this.world.telegraphs=[];this.world.effects=[];}this.onEvent=()=>{};}
}
