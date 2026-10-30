// Chapter 5–6 abilities. Temporary effects never enter the shared save format.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const foe=(g,e)=>g.available(e)&&['enemy','boss','target'].includes(e.type)&&e.hp>0&&!e.destroyed;
export function wordCost(p,word){return word.length>=15?p.longCostMultiplier??1:word.length>=8?p.mediumCostMultiplier??1:1;}
export function attackPower(p,spell){
 let power=(spell.input?.length>=8&&spell.input.length<=14?p.mediumPowerMultiplier??1:1)*(spell.element==='curse'?p.curseMultiplier??1:1);
 if(p.parryCharged){power*=1.35;p.parryCharged=false;}return power;
}
export function markParry(g){const p=g.world.player,t=g.world.time;if(p.parryBoost&&t>=(p.parryBoostAt||0)){p.parryCharged=true;p.parryBoostAt=t+8;}}
export function decoy(g,duration){const w=g.world;w.decoy={x:w.player.x,z:w.player.z,until:w.time+duration,kind:'student',type:'npc',pose:'idle'};}
export function aimPoint(g,e){const w=g.world;if(e.type==='boss')return w.player;return [w.decoy,w.guardian].find(q=>q&&q.until>w.time&&distance(q,e)<14&&g.lineClear(e,q))||w.player;}
export function castAdvanced(g,spell,target){
 const w=g.world,p=w.player,t=w.time;
 if(spell.effect==='zone')w.zone={x:p.x,z:p.z,radius:5,remaining:spell.shield*(p.shieldMultiplier??1),until:t+spell.duration};
 if(spell.effect==='reflect'){p.reflectUntil=t+spell.duration;p.reflectReady=true;}
 if(spell.effect==='stealth')p.stealthUntil=t+spell.duration;
 if(spell.effect==='decoy')decoy(g,spell.duration);
 if(spell.effect==='guardian')w.guardian={x:p.x,z:p.z,until:t+spell.duration,nextHit:t+1,kind:'stone-guardian',type:'npc',pose:'idle'};
 if(!['chain','nova','stars'].includes(spell.effect))return;
 const boost=attackPower(p,spell)*p.power;
 if(spell.effect==='chain'){
  let last=p,next=target,hit=new Set();
  for(let i=0;i<3&&next&&foe(g,next);i++){
   const b={spellId:spell.id,damage:[40,30,20][i]*boost*(p.lightningMultiplier??1),element:'lightning'};
   g.effect(next.x,next.z,spell.color,'chain',.6);w.effects.at(-1).from={x:last.x,z:last.z};
   g.applyProjectileHit(next,b);hit.add(next.id);last=next;
   next=w.entities.filter(e=>foe(g,e)&&!hit.has(e.id)&&distance(last,e)<=6&&g.lineClear(last,e)).sort((a,b)=>distance(last,a)-distance(last,b))[0];
  }
 }else{
  const point=target||{x:p.x+Math.sin(p.facing)*7,z:p.z+Math.cos(p.facing)*7};w.delayedMagic||=[];
  for(let i=0;i<(spell.effect==='stars'?3:1);i++)w.delayedMagic.push({x:point.x,z:point.z,at:t+(spell.effect==='stars'?.8*(i+1):1),radius:spell.effect==='stars'?5:4,spellId:spell.id,damage:spell.damage*boost,element:spell.element,color:spell.color});
 }
}
export function advancedHit(g,hit,b){
 const w=g.world,p=w.player,t=w.time;
 if(hit.kind==='draco'&&['S053','S054','S055'].includes(b.spellId))g.save.progress.flags['ch06.duel.forbidden']=true;
 if(b.reflected&&hit.kind==='snape'){hit.nextAttack=Math.max(hit.nextAttack,t+1.2);w.telegraphs=w.telegraphs.filter(a=>a.ownerId!==hit.id);}
 if(p.comboRefund&&b.damage>0&&!b.echo&&b.spellId&&t>=(p.comboRefundAt||0)){
  p.comboSpells||=[];if(!p.comboSpells.includes(b.spellId))p.comboSpells.push(b.spellId);
  if(p.comboSpells.length>=3){p.mana=Math.min(p.maxMana,p.mana+3);p.comboSpells=[];p.comboRefundAt=t+12;g.effect(p.x,p.z,'#d8d593','refund',.8);}
 }
 if(!hit.active||hit.invulnerable||hit.kind==='dementor'||hit.destroyed)return;
 if(b.anchor){hit.anchorUntil=t+b.anchor;w.telegraphs=w.telegraphs.filter(a=>a.ownerId!==hit.id||a.kind!=='teleport');}
 if(b.silence&&t>=(hit.controlImmuneUntil||0)){
  const duration=hit.type==='boss'?.4:b.silence;hit.silencedUntil=t+duration;
  w.telegraphs=w.telegraphs.filter(a=>a.ownerId!==hit.id||!['bolt','teleport','pool','fire'].includes(a.kind));
  hit.nextAttack=Math.max(hit.nextAttack,t+duration);if(hit.type==='boss')hit.controlImmuneUntil=t+10;
 }
 if(b.bleed&&hit.kind!=='inferius'){hit.bleedUntil=t+b.bleedDuration+.01;hit.bleedDamage=b.bleed*(p.curseMultiplier??1);hit.bleedTick=t+1;}
 if(b.curse){hit.curseUntil=t+b.curseDuration+.01;hit.curseDamage=b.curse*(p.curseMultiplier??1);hit.curseTick=t+1;}
 if(b.charm&&hit.type==='enemy'&&hit.kind!=='inferius'){hit.charmedUntil=t+b.charm;hit.charmTick=t+.6;w.telegraphs=w.telegraphs.filter(a=>a.ownerId!==hit.id);w.projectiles=w.projectiles.filter(a=>a.ownerId!==hit.id);}
}
export function updateAdvanced(g,dt){
 const w=g.world,p=w.player,t=w.time;
 if(w.zone&&(w.zone.until<=t||w.zone.remaining<=0))w.zone=null;
 if(w.decoy?.until<=t)w.decoy=null;if(w.guardian?.until<=t)w.guardian=null;
 for(const e of w.entities){
  if(!g.available(e))continue;
  if(e.dormantUntil){if(t<e.dormantUntil){e.pose='down';}else{e.dormantUntil=0;e.pose='idle';e.hp=e.maxHp*.65;e.nextAttack=t+1.5;g.effect(e.x,e.z,'#a9bec0','rise',1);}}
  if(e.kind==='inferius'&&w.entities.some(b=>b.kind==='brazier'&&b.activated&&distance(b,e)<4)&&t>=(e.fireTick||0)){e.fireTick=t+1;g.damageEnemy(e,22*p.power,'fire');}
  for(const status of ['bleed','curse'])if(e[`${status}Until`]>t&&t>=e[`${status}Tick`]){e[`${status}Tick`]+=1;g.damageEnemy(e,e[`${status}Damage`],'curse');}
  if(e.charmedUntil>t&&t>=e.charmTick){e.charmTick=t+1.2;const target=w.entities.find(q=>q!==e&&foe(g,q)&&q.charmedUntil<=t&&distance(q,e)<12&&g.lineClear(e,q))||w.entities.find(q=>q!==e&&foe(g,q)&&!q.charmedUntil&&distance(q,e)<12&&g.lineClear(e,q));if(target){g.effect(target.x,target.z,'#b7d8a4','chain',.5);g.damageEnemy(target,14*p.power,'arcane');}}
 }
 if(w.guardian&&t>=w.guardian.nextHit){w.guardian.nextHit=t+2;const e=w.entities.find(e=>foe(g,e)&&distance(e,w.guardian)<10&&g.lineClear(w.guardian,e));if(e){g.effect(e.x,e.z,'#cec9a7','hit',.7);g.damageEnemy(e,12*p.power,'arcane');}}
 const ready=(w.delayedMagic||[]).filter(a=>a.at<=t);w.delayedMagic=(w.delayedMagic||[]).filter(a=>a.at>t);
 for(const a of ready){g.effect(a.x,a.z,a.color,'nova',1);for(const e of w.entities)if(foe(g,e)&&distance(e,a)<=a.radius&&g.lineClear(a,e))g.applyProjectileHit(e,a);}
}
export function decorateProjectile(g,b,spell){
 const p=g.world.player,single=!b.areaRadius&&spell.kind!=='birds';
 Object.assign(b,{silence:spell.silence,anchor:spell.anchor,bleed:spell.bleed,bleedDuration:spell.bleedDuration,curse:spell.curse,curseDuration:spell.curseDuration,charm:spell.charm,hitIds:[],pierce:single?p.pierce||0:0});
 const clean={stun:0,slow:0,confuse:0,freeze:0,root:0,disarm:0,knockback:0,burnDamage:0,wet:0,silence:0,anchor:0,bleed:0,curse:0,charm:0};
 if(single&&p.splitShot){b.damage*=.6;g.world.projectiles.push({...b,...clean,id:`p${++g.sequence}`,hitIds:[],delay:.1});}
 if(single&&p.echoReady){p.echoReady=false;g.world.projectiles.push({...b,...clean,id:`p${++g.sequence}`,damage:b.damage*.35,hitIds:[],delay:.18,echo:true});}
}
