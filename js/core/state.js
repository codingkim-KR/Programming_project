import { ITEMS } from '../catalog.js';

export const cloneSave = value => JSON.parse(JSON.stringify(value));
export function newGame() {
  return {
    schemaVersion: 1, contentVersion: 'campaign-v1', campaignId: 'magic-typing-rpg',
    cursor: {chapterId:'ch01',subchapterId:'1-01',checkpointId:'ch01.1-01.checkpoint.entry'},
    mode:'story', recollectionReturn:null,
    progress:{completedChapterIds:[],completedSubchapterIds:[],completedObjectiveIds:[],flags:{},quests:{},storyItems:{}},
    player:{hp:100,mana:60,learnedSpells:[],spellMastery:{},abilityUnlocks:[],growthRewardIds:[],permanentGains:{},healingChargesRemaining:null},
    inventory:{gold:0,stacks:{},equipment:[]},
    loadout:{wandInstanceId:null,pendantInstanceIds:[null,null,null]},
    world:{claimedRewardIds:[],shopUnlockIds:[],shopOffers:{},processedTransactionIds:[]},
    checkpoint:{id:'ch01.1-01.checkpoint.entry',bossPhaseId:null,hp:100,mana:60,personalConsumables:{},temporarySupplies:{},cooldownsSeconds:{},healingChargesRemaining:null,equipmentCharges:{}},
    stats:{playTimeSeconds:0},
  };
}
export function getMaxStats(save) {
  const n=new Set(save.player.growthRewardIds).size;
  const stats={maxHp:100+n*15+(save.player.permanentGains.maxHp||0),maxMana:60+n*10+(save.player.permanentGains.maxMana||0),power:1+n*.12,manaRegen:4+(save.player.permanentGains.manaRegen||0),fireMultiplier:1,runeMultiplier:1,explorationCostMultiplier:1,guardCostMultiplier:1,startShield:0,freezeDurationMultiplier:1,duelCooldownMultiplier:1,rootDurationMultiplier:1,poisonDurationMultiplier:1,potionHealMultiplier:1,enemyGoldMultiplier:1,fireCostMultiplier:1,waterCostMultiplier:1,wetDurationBonus:0,moveMultiplier:1,lowHpMoveMultiplier:1,flightDamageMultiplier:1,fireResistance:1,iceResistance:1,trapDamageMultiplier:1,healMultiplier:1,shieldMultiplier:1,iceMultiplier:1,lightningMultiplier:1,slowDurationMultiplier:1,comboMultiplier:1,patronusDurationMultiplier:1,patronusCooldownMultiplier:1,healthRegen:0,regenDelayReduction:0,revealResistance:false,trail:false,longCostMultiplier:1,mediumCostMultiplier:1,mediumPowerMultiplier:1,curseMultiplier:1,healReceivedMultiplier:1,reflectMultiplier:1,healingChargeBonus:0,pierce:0,splitShot:false,parryBoost:false,cleanseProtection:false,comboRefund:false};
  const equipped=[save.loadout.wandInstanceId,...save.loadout.pendantInstanceIds].filter(Boolean);
  for(const id of equipped){
    const item=save.inventory.equipment.find(e=>e.instanceId===id);
    const d=item&&ITEMS[item.catalogId]; if(!d)continue;
    for(const k of ['maxHp','maxMana','manaRegen','startShield','wetDurationBonus','healthRegen','regenDelayReduction','healingChargeBonus','pierce'])stats[k]+=Number(d[k]||0);
    for(const k of ['fireMultiplier','runeMultiplier','explorationCostMultiplier','guardCostMultiplier','freezeDurationMultiplier','duelCooldownMultiplier','rootDurationMultiplier','poisonDurationMultiplier','potionHealMultiplier','enemyGoldMultiplier','fireCostMultiplier','waterCostMultiplier','moveMultiplier','lowHpMoveMultiplier','flightDamageMultiplier','fireResistance','iceResistance','trapDamageMultiplier','healMultiplier','shieldMultiplier','iceMultiplier','lightningMultiplier','slowDurationMultiplier','comboMultiplier','patronusDurationMultiplier','patronusCooldownMultiplier','longCostMultiplier','mediumCostMultiplier','mediumPowerMultiplier','curseMultiplier','healReceivedMultiplier','reflectMultiplier'])if(d[k])stats[k]*=d[k];
    for(const k of ['splitShot','parryBoost','cleanseProtection','comboRefund'])if(d[k])stats[k]=true;
    if(d.revealResistance)stats.revealResistance=true;if(d.trail)stats.trail=true;
  }
  return stats;
}
export function validateSave(s) {
  const fail=m=>{throw new Error(m);};
  const isObject=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  if(!isObject(s)||s.schemaVersion!==1||s.contentVersion!=='campaign-v1'||s.campaignId!=='magic-typing-rpg')fail('지원하지 않는 저장 버전입니다.');
  const defaults=newGame();
  if(Object.keys(s).some(k=>!(k in defaults)))fail('저장 파일에 알 수 없는 항목이 있습니다.');
  for(const k of ['cursor','progress','player','inventory','loadout','world','checkpoint','stats'])if(!isObject(s[k]))fail('저장 내용이 불완전합니다.');
  const supportedScenes={ch01:/^1-(0[1-9]|1[0-2])$/,ch02:/^2-(0[1-9]|1[0-3])$/,ch03:/^3-(0[1-9]|1[0-4])$/,ch04:/^4-(0[1-9]|1[0-6])$/,ch05:/^5-(0[1-9]|1[0-6])$/,ch06:/^6-(0[1-9]|1[0-8])$/};
  const scenePattern=Object.hasOwn(supportedScenes,s.cursor.chapterId)&&supportedScenes[s.cursor.chapterId];
  if(!scenePattern||!scenePattern.test(s.cursor.subchapterId))fail('현재 실행판에서 지원하지 않는 챕터입니다.');
  const checkpointPrefix=`${s.cursor.chapterId}.${s.cursor.subchapterId}.checkpoint.`;
  if(typeof s.cursor.checkpointId!=='string'||s.cursor.checkpointId!==s.checkpoint.id||!s.checkpoint.id.startsWith(checkpointPrefix)||s.checkpoint.id.length===checkpointPrefix.length)fail('체크포인트가 일치하지 않습니다.');
  const num=(x,max=1e9)=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=max;
  const ids=(a)=>Array.isArray(a)&&a.length<=5000&&a.every(x=>typeof x==='string'&&x.length<200)&&new Set(a).size===a.length;
  for(const k of ['completedChapterIds','completedSubchapterIds','completedObjectiveIds'])if(!ids(s.progress[k]))fail('진행 기록이 손상되었습니다.');
  if(!isObject(s.progress.flags)||!isObject(s.progress.quests)||!isObject(s.progress.storyItems))fail('진행 상태가 손상되었습니다.');
  for(const k of ['learnedSpells','abilityUnlocks','growthRewardIds'])if(!ids(s.player[k]))fail('성장 기록이 손상되었습니다.');
  if(!num(s.player.hp)||!num(s.player.mana)||!num(s.checkpoint.hp)||!num(s.checkpoint.mana)||!num(s.stats.playTimeSeconds))fail('능력치가 올바르지 않습니다.');
  if(!Number.isSafeInteger(s.inventory.gold)||!num(s.inventory.gold))fail('골드가 올바르지 않습니다.');
  if(!isObject(s.inventory.stacks)||Object.entries(s.inventory.stacks).some(([id,n])=>!/^I\d{3}$/.test(id)||!Number.isSafeInteger(n)||!num(n)))fail('가방이 손상되었습니다.');
  if(!Array.isArray(s.inventory.equipment)||s.inventory.equipment.length>1000)fail('장비 기록이 손상되었습니다.');
  const equipment=new Map();
  for(const e of s.inventory.equipment){if(!isObject(e)||typeof e.instanceId!=='string'||equipment.has(e.instanceId)||!/^([WP])\d{3}$/.test(e.catalogId)||!isObject(e.upgrades)||!(e.chargesRemaining===null||Number.isSafeInteger(e.chargesRemaining)&&num(e.chargesRemaining)))fail('장비 개체가 올바르지 않습니다.');equipment.set(e.instanceId,e);}
  if(!Array.isArray(s.loadout.pendantInstanceIds)||s.loadout.pendantInstanceIds.length!==3)fail('펜던트 슬롯은 세 개입니다.');
  const p=s.loadout.pendantInstanceIds.filter(x=>x!==null);
  if(new Set(p).size!==p.length||p.some(id=>!equipment.get(id)?.catalogId.startsWith('P')))fail('장착한 펜던트가 없습니다.');
  if(s.loadout.wandInstanceId!==null&&!equipment.get(s.loadout.wandInstanceId)?.catalogId.startsWith('W'))fail('장착한 지팡이가 없습니다.');
  for(const k of ['claimedRewardIds','shopUnlockIds','processedTransactionIds'])if(!ids(s.world[k]))fail('거래 기록이 손상되었습니다.');
  for(const k of ['personalConsumables','temporarySupplies','cooldownsSeconds','equipmentCharges'])if(!isObject(s.checkpoint[k]))fail('체크포인트 상태가 손상되었습니다.');
  if(s.checkpoint.battle!==undefined){
    const b=s.checkpoint.battle;
    const value=x=>typeof x==='boolean'||typeof x==='string'&&x.length<=2000||typeof x==='number'&&Number.isFinite(x)&&Math.abs(x)<=1e9||Array.isArray(x)&&x.length<=500&&x.every(y=>typeof y==='string'&&y.length<=500);
    if(!isObject(b)||Object.keys(b).sort().join(',')!=='flags,objectiveIds,sceneId,spawn'||b.sceneId!==s.cursor.subchapterId||!isObject(b.spawn)||Object.keys(b.spawn).sort().join(',')!=='x,z'||!num(b.spawn.x)||!num(b.spawn.z)||!ids(b.objectiveIds)||!isObject(b.flags)||Object.keys(b.flags).length>2000||Object.entries(b.flags).some(([k,v])=>k.length>200||!value(v)))fail('보스 전투 시작 기록이 손상되었습니다.');
  }
  if(!isObject(s.world.shopOffers)||!isObject(s.player.permanentGains)||!isObject(s.player.spellMastery))fail('데이터 항목이 불완전합니다.');
  const walk=(x,depth=0)=>{if(depth>20)fail('저장 구조가 너무 깊습니다.');if(typeof x==='number'&&!Number.isFinite(x))fail('올바르지 않은 숫자입니다.');if(x&&typeof x==='object')for(const [k,v] of Object.entries(x)){if(['__proto__','constructor','prototype'].includes(k))fail('사용할 수 없는 필드입니다.');walk(v,depth+1);}};
  walk(s); if(JSON.stringify(s).length>38000)fail('저장 크기가 현재 지원 범위를 넘었습니다.');
  return true;
}

// Completed IDs are authoritative. Counts for finished scenes duplicate them.
// Keep unfinished counts, story choices, collection flags and reward ledgers.
export function compactProgress(save){
 const done=new Set(save.progress.completedObjectiveIds),scenes=new Set(save.progress.completedSubchapterIds);
 for(const key of Object.keys(save.progress.flags)){
  if(!key.startsWith('objectiveCount:'))continue;
  const id=key.slice(15),scene=id.split('.')[0];
  if(done.has(id)&&scenes.has(scene))delete save.progress.flags[key];
 }
 return save;
}
