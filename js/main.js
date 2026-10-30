import { PixelWorldRenderer as WorldRenderer } from './pixel-renderer.js';
import { GameEngine } from './core/engine.js';
import { newGame, validateSave } from './core/state.js';
import { SaveManager } from './core/save.js';
import { loadScene, resumeSceneId, chapterInfo, chapterIdForScene } from './chapters/index.js';
import { SPELLS, ITEMS, SHOPS, offerAvailable } from './catalog.js';
import { iconUrl, portraitFor, dialoguePortrait, DraftSoundBank } from './asset-ui.js';
import { pendantView, BOOK_TABS, adjacentBookTab } from './inventory-ui.js';

const $ = id => document.getElementById(id);
const escapeHtml = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const spellById = new Map(SPELLS.map(s => [s.id,s]));
const modal = $('modal');
let renderer, engine, saved, demoEngine, started = false, switching = false, pausedByBlur = false;
let dialogueState = null, bookOpen = false, transitionBusy = false;
let activeBookTab='spells', selectedPendantSlot=0, spellResetGeneration=0;
let keys = new Set(), lastFrame = 0, accumulator = 0, lastHud = 0, lastPanels = '', saveTimer = null;
let soundOn = true, draftSoundsOn = false, audioContext;
const draftSoundBank = new DraftSoundBank();
try { soundOn = localStorage.getItem('lumos.sound') !== 'off'; draftSoundsOn=localStorage.getItem('lumos.draftSounds')==='on'; } catch {}
const saveManager = new SaveManager({onStatus:status => {
  $('save-status').innerHTML = `<i class="${escapeHtml(status.code || '')}"></i>${escapeHtml(status.label || '기기에 저장됨')}`;
  $('save-status').title = status.detail || '';
}});

function toast(message, kind = '') {
  const el = document.createElement('div'); el.className = `toast ${kind}`; el.textContent = message;
  $('toast-stack').append(el); setTimeout(()=>el.remove(),4200);
}
function sound(kind='cast') {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    if(draftSoundsOn){
      const context=audioContext,generation=draftSoundBank.generation;
      Promise.resolve(context.state==='running'?null:context.resume()).then(()=>{
        if(soundOn&&draftSoundsOn&&generation===draftSoundBank.generation)draftSoundBank.play(kind,context,{allowDrafts:true});
      }).catch(()=>{});
      return;
    }
    // Preserve the original lightweight feedback when draft recordings are not selected.
    const osc=audioContext.createOscillator(),gain=audioContext.createGain();
    const notes={cast:660,hit:130,guard:420,success:880,click:520,defeat:90,failure:180};
    osc.type=kind==='hit'?'triangle':'sine'; osc.frequency.setValueAtTime(notes[kind]||540,audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime((notes[kind]||540)*.62,audioContext.currentTime+.2);
    gain.gain.setValueAtTime(.045,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.24);
    osc.connect(gain);gain.connect(audioContext.destination);osc.start();osc.stop(audioContext.currentTime+.25);
  } catch {}
}
function catalogIcon(id,fallback='◇') {
  const url=iconUrl(id);
  return url?`<img class="catalog-icon" src="${escapeHtml(url)}" alt="" width="36" height="36" loading="lazy" draggable="false">`:escapeHtml(fallback);
}
function updateDialoguePortrait(line,context={}) {
  const portrait=dialoguePortrait(line,{sceneId:engine?.scene.id,chapterComplete:engine?.save.progress.completedChapterIds.includes(chapterIdForScene(engine?.scene.id)),...context});
  const element=$('dialogue-portrait');
  element.hidden=!portrait;$('dialogue-box').classList.toggle('has-portrait',!!portrait);
  if(portrait){element.src=portrait.url;element.alt='';element.dataset.character=portrait.character;element.dataset.expression=portrait.expression;}
  else{element.removeAttribute('src');delete element.dataset.character;delete element.dataset.expression;}
  renderer?.setDialogueSpeaker?.(line.speaker||null);
}
async function waitForSceneAssets() {
  $('loading').hidden=false;
  const update=()=>{
    const status=renderer.assetStatus;
    $('loading-text').textContent=status?.total?`장면을 준비하고 있습니다 · ${status.loaded} / ${status.total}`:'장면을 준비하고 있습니다';
  };
  update();const timer=setInterval(update,150);
  try{
    const status=await renderer.assetsReady;
    if(status?.failed?.length)toast(`에셋 ${status.failed.length}개를 불러오지 못해 임시 모습으로 표시합니다. 연결을 확인한 뒤 새로고침해 주세요.`);
  }finally{clearInterval(timer);}
}
function releaseKeys() { keys.clear(); engine?.setMovement(0,0); engine?.setGuard(false); }
function isPaused() { return !started || modal.open || !!dialogueState || bookOpen || switching || transitionBusy || pausedByBlur || document.hidden; }
function focusGameUI() {
  if(dialogueState) (dialogueState.choosing?$('dialogue-choices').querySelector('.is-selected'):$('dialogue-continue'))?.focus({preventScroll:true});
  else if(bookOpen) $('tab-'+activeBookTab).focus({preventScroll:true});
  else if(started) $('world').focus({preventScroll:true});
}
function closeModal() { if(started&&engine?.world.player.hp<=0){onEngineEvent({type:'defeat'});return;} modal.close(); releaseKeys(); focusGameUI(); }
function openModal(title,body,actions=[],kicker='LUMOS JOURNAL') {
  releaseKeys(); $('modal-title').textContent=title; $('modal-kicker').textContent=kicker;
  $('modal-body').innerHTML=body; $('modal-actions').replaceChildren(); $('modal-close').hidden=false;
  for(const a of actions) {
    const b=document.createElement('button'); b.className=a.className || 'primary-button';b.textContent=a.label;
    if(a.disabled)b.disabled=true;b.onclick=a.action;$('modal-actions').append(b);
  }
  if(!modal.open)modal.showModal();
  $('modal-actions').querySelector('button:not(:disabled)')?.focus({preventScroll:true});
}
function showDialogue(lines=[],onDone=()=>{},choices=[],portraitContext={}) {
  releaseKeys();setBook(false);
  dialogueState={lines,index:0,onDone,choices,choiceIndex:0,choosing:false,portraitContext};
  document.body.classList.add('in-dialogue');$('dialogue-box').hidden=false;
  renderDialogue();
}
function closeDialogue() {
  dialogueState=null;renderer?.setDialogueSpeaker?.(null);$('dialogue-box').hidden=true;document.body.classList.remove('in-dialogue');releaseKeys();focusGameUI();
}
function renderDialogue() {
  const d=dialogueState;if(!d)return;
  if(d.index>=d.lines.length) {
    if(!d.choices.length){const done=d.onDone;closeDialogue();done();return;}
    d.choosing=true;updateDialoguePortrait({speaker:'해리'},d.portraitContext);$('dialogue-speaker').textContent='해리';$('dialogue-text').textContent='';
    $('dialogue-choices').hidden=false;$('dialogue-continue').hidden=true;$('dialogue-hint').textContent='↑ ↓ 선택 · Enter / Space 대답';
    $('dialogue-choices').innerHTML=d.choices.map((choice,i)=>`<button class="dialogue-choice ${i===d.choiceIndex?'is-selected':''}" aria-pressed="${i===d.choiceIndex}" data-choice="${i}">${escapeHtml(choice.label)}</button>`).join('');
    $('dialogue-choices').querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>chooseDialogue(Number(b.dataset.choice)));
  }else{
    d.choosing=false;const line=d.lines[d.index];updateDialoguePortrait(line,d.portraitContext);$('dialogue-speaker').textContent=line.speaker||'';$('dialogue-text').textContent=line.text;
    $('dialogue-choices').hidden=true;$('dialogue-continue').hidden=false;$('dialogue-hint').textContent='Enter / Space · 다음';
  }
  focusGameUI();
}
function advanceDialogue() { if(!dialogueState)return;if(dialogueState.choosing){chooseDialogue(dialogueState.choiceIndex);return;}dialogueState.index++;renderDialogue(); }
function chooseDialogue(index) {
  const d=dialogueState;if(!d?.choosing)return;const choice=d.choices[index];if(!choice)return;
  const done=d.onDone;closeDialogue();
  if(choice.response?.length)showDialogue(choice.response,()=>done(choice),[],{choiceResponse:true});else done(choice);
}
function setBook(open) {
  bookOpen=!!open&&started&&!dialogueState&&!modal.open;document.body.classList.toggle('book-open',bookOpen);
  $('book-button').setAttribute('aria-expanded',String(bookOpen));
  const panel=document.querySelector('.spellbook');panel.inert=!bookOpen;panel.setAttribute('aria-hidden',String(!bookOpen));
  releaseKeys();if(bookOpen)refreshPanels();focusGameUI();
}
async function toggleFullscreen() {
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{toast('이 브라우저에서는 전체 화면 전환을 지원하지 않습니다.');}
}
function scheduleSave() {
  if(!started || switching || !engine)return;
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>persistNow().catch(()=>{}),180);
}
async function persistNow() {
  if(!engine || !started)return;
  clearTimeout(saveTimer); engine.syncSave(); saved=structuredClone(engine.save);
  try { await saveManager.persist(saved); } catch(e) { toast(`기기 저장 실패: ${e.message}`); throw e; }
}
function onEngineEvent(event) {
  if(!started || switching)return;
  if(event.type==='toast')toast(event.message);
  if(event.type==='changed')scheduleSave();
  if(event.type==='objective'){sound('success');lastPanels='';scheduleSave();}
  if(event.type==='sound')sound(event.kind);
  if(event.type==='bossPhase'){toast(`보스 ${event.phase}단계`);scheduleSave();}
  if(event.type==='dialogue'&&!engine.defeated){
    resetSpellInput();
    showDialogue(event.lines,()=>{engine.completeDialogue(event.id);scheduleSave();refreshHud();});
  }
  if(event.type==='defeat') {
    releaseKeys();resetSpellInput();setBook(false);sound('defeat');
    const bossBattle=engine.scene.entities.some(e=>e.type==='boss'&& !engine.save.progress.flags[`defeated:${e.id}`]);
    openModal('잠시 숨을 고르세요',bossBattle?'<p>보스 전투 시작 지점에서 다시 도전합니다.<br>보스의 체력과 공격 단계도 처음으로 돌아갑니다.</p>':'<p>마지막 체크포인트에서 다시 도전할 수 있습니다.</p>',[{label:bossBattle?'보스 전투부터 다시 시작':'체크포인트에서 다시 시작',action:async()=>{resetSpellInput();engine.restartCheckpoint();closeModal();lastPanels='';refreshPanels();refreshHud();await persistNow();}},{label:'주문과 조작 확인',className:'secondary-button',action:showHelp}],'TRY AGAIN');
    $('modal-close').hidden=true;
  }
}
const getScene = loadScene;
function chapterFinished() { return !!engine && !engine.scene.nextId && engine.save.progress.completedChapterIds.includes(chapterIdForScene(engine.scene.id)); }
function updateSceneUI() {
  const s=engine.scene,chapter=chapterInfo(chapterIdForScene(s.id));
  document.title=`LUMOS — ${chapter.title}`;$('campaign-label').textContent=`CHAPTER ${chapter.number}`;$('campaign-subtitle').textContent=chapter.title;
  $('scene-name').textContent=s.name;$('scene-kicker').textContent=s.kicker || (chapter.number===2?'THE SECOND YEAR':'THE FIRST YEAR');
  $('location-badge').textContent=`${s.id} · ${s.name}`;$('mode-badge').textContent= s.theme==='flight'?'비행 훈련': s.entities.some(x=>x.type==='boss')?'보스 구간':'탐험';
  resetSpellInput();lastPanels='';$('exit-button').hidden=true;$('interact-prompt').hidden=true;
  $('viewport-hint').textContent=s.theme==='flight'?'화살표로 반짝이는 고리를 통과하세요':'화살표로 이동 · 가까이에서 Enter로 대화 / 작동';
  refreshPanels();refreshHud();updateSpellInput();
}
async function enterScene(scene,{intro=true}={}) {
  switching=true;releaseKeys();draftSoundBank.stopAll();closeDialogue();setBook(false);$('loading').hidden=false;
  const previousScene=engine.scene,previousSave=structuredClone(engine.save);
  try {
    engine.loadScene(scene); renderer.loadScene(scene);updateSceneUI();await waitForSceneAssets();
    switching=false;await persistNow();$('loading').hidden=true;
    const introFlag=`intro.${scene.id}`;
    if(intro && !engine.save.progress.flags[introFlag] && scene.entryDialogue?.length) {
      showDialogue(scene.entryDialogue,()=>{engine.save.progress.flags[introFlag]=true;scheduleSave();});
    }
  }catch(e){
    switching=true;engine.save=previousSave;engine.loadScene(previousScene);renderer.loadScene(previousScene);updateSceneUI();await waitForSceneAssets();switching=false;$('loading').hidden=true;
    openModal('진행을 저장하지 못했습니다',`<p>${escapeHtml(e.message)}</p><p>진행을 잃지 않도록 이전 구간에 머무릅니다. 저장을 재시도하거나 현재 진행을 파일로 보관하세요.</p>`,[{label:'다시 시도',action:()=>{closeModal();enterScene(scene,{intro});}},{label:'저장 파일 내려받기',className:'secondary-button',action:downloadSave}],'SAVE REQUIRED');
  }
}
async function startGame(isNew=false) {
  if(!renderer||switching)return;
  if(isNew && saved) {
    openModal('새로운 여정을 시작할까요?','<p>현재 기기의 진행이 새 게임으로 바뀝니다. 기존 여정은 먼저 파일로 보관할 수 있습니다.</p>',[{label:'기존 저장 내려받기',className:'secondary-button',action:downloadSave},{label:'새 게임 시작',action:async()=>{closeModal();await saveManager.resetLocal();saved=null;await launch(newGame());}}],'NEW JOURNEY');return;
  }
  await launch(isNew || !saved?newGame():saved);
}
async function launch(state) {
  try { validateSave(state); }catch(e){toast(`저장을 열지 못했습니다: ${e.message}`);return;}
  switching=true;
  let scene;
  try{scene=await getScene(resumeSceneId(state));}catch(error){switching=false;toast(`장소를 불러오지 못했습니다: ${error.message}`);return;}
  engine?.dispose();demoEngine?.dispose();demoEngine=null;
  engine=new GameEngine({movementProjection:'topdown',save:structuredClone(state),scene,onEvent:onEngineEvent});started=true;
  document.body.classList.remove('on-title');$('title-screen').hidden=true;
  switching=false;await enterScene(scene);focusGameUI();
}
function refreshPanels() {
  if(!engine)return;
  const s=engine.save;
  const signature=JSON.stringify([s.progress.completedSubchapterIds,s.player.learnedSpells,s.inventory,s.loadout,engine.scene.id,engine.world.temporarySupplies]);
  if(signature===lastPanels)return;lastPanels=signature;
  const learned=SPELLS.filter(sp=>s.player.learnedSpells.includes(sp.id));$('learned-count').textContent=`${learned.length} SPELLS`;
  $('spell-list').innerHTML=learned.length?learned.map(sp=>`<button class="spell-card" data-spell="${sp.id}"><span class="spell-glyph" style="--spell-color:${escapeHtml(sp.color || '#9acbd1')}">${catalogIcon(sp.id,'✦')}</span><span class="spell-meta"><span class="spell-name">${escapeHtml(sp.name)}</span><span class="spell-word">${escapeHtml(sp.input)}</span></span><span class="spell-cost">${sp.mana}<small>MP</small></span></button>`).join(''):'<div class="empty-book"><span>✧</span><p>아직 펼치지 않은 주문서</p><small>첫 수업에서<br>당신의 마법을 배우게 됩니다.</small></div>';
  $('spell-list').querySelectorAll('[data-spell]').forEach(b=>b.onclick=()=>showSpell(spellById.get(b.dataset.spell)));
  $('gold-value').textContent=s.inventory.gold;
  const eq=s.inventory.equipment.filter(e=>ITEMS[e.catalogId]?.kind==='wand');
  $('equipment-list').innerHTML=`<div class="equipment-heading">지팡이</div>`+(eq.length?eq.map(e=>{
    const item=ITEMS[e.catalogId]||{name:e.catalogId};const equipped=s.loadout.wandInstanceId===e.instanceId;
    return `<button class="equipment-row ${equipped?'equipped':''}" data-equip="${escapeHtml(e.instanceId)}"><span>${catalogIcon(e.catalogId,'╱')}</span><div>${escapeHtml(item.name)}<small>${escapeHtml(item.description||'')}</small><small>${equipped?'장착 중':'눌러서 장착'}</small></div></button>`;
  }).join(''):'<p class="muted">지팡이는 다이애건 골목에서 받습니다.</p>');
  $('equipment-list').querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>{
    const e=eq.find(x=>x.instanceId===b.dataset.equip);
    const result=engine.equip(e.instanceId,'wand');toast(result?.message||'장비를 장착했습니다.');lastPanels='';scheduleSave();refreshPanels();
  });
  renderPendants();
  const stacks=Object.entries(s.inventory.stacks).filter(([,n])=>n>0);
  $('inventory-list').innerHTML=stacks.length?stacks.map(([id,n])=>`<button class="inventory-row" data-item="${id}"><span>${catalogIcon(id,'◈')}</span><div>${escapeHtml(ITEMS[id]?.name||id)}<small>${ITEMS[id]?.kind==='consumable'?'눌러서 사용':'재료 / 임무 물품'}</small></div><b>×${n}</b></button>`).join(''):'<p class="muted">가방이 비어 있습니다.</p>';
  $('inventory-list').querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>useItem(b.dataset.item));
  const quick=[0,1,2,3].map(i=>engine.quickItem(i));$('quick-items-list').innerHTML=quick.map((id,i)=>{
    const temporary=Object.entries(engine.world.temporarySupplies||{}).filter(([key])=>key.endsWith(`_${id}`)).reduce((sum,[,n])=>sum+n,0),count=(s.inventory.stacks[id]||0)+temporary;
    return `<button data-quick="${id}" title="${escapeHtml(ITEMS[id]?.name||'비어 있는 슬롯')}${temporary?` · 이번 전투 보급 ${temporary}개 포함`:''}" ${!count?'disabled':''}><kbd>${i+1}</kbd><span style="color:${i%2?'#87bfe0':'#d79688'}">${catalogIcon(id,'·')}</span><small>${ITEMS[id]?count:'—'}${temporary?'*':''}</small></button>`;
  }).join('');
  $('quick-items-list').querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>useItem(b.dataset.quick));
}
function renderPendants(focusSlot=false) {
  const view=pendantView(engine.save,selectedPendantSlot);selectedPendantSlot=view.selected;
  $('pendant-count').textContent=`${view.equippedCount} / 3`;
  $('pendant-owned-count').textContent=`${view.owned.length}개`;
  $('pendant-slots').innerHTML=view.slots.map(({slot,instance,item,selected})=>`<button class="pendant-slot ${selected?'selected':''} ${instance?'':'empty'}" data-pendant-slot="${slot}" aria-pressed="${selected}" aria-label="${slot+1}번 자리: ${escapeHtml(item?.name||'비어 있음')}${selected?' · 교체할 자리':''}"><span class="pendant-slot-top"><span>${slot+1}번 자리</span><b>${selected?'선택':instance?'장착':'빈 자리'}</b></span><span class="pendant-slot-icon">${instance?catalogIcon(instance.catalogId,'◇'):'＋'}</span><strong>${escapeHtml(item?.name||'비어 있는 자리')}</strong><small>${escapeHtml(item?.description||'이 자리를 선택하고 아래의 펜던트를 장착하세요.')}</small></button>`).join('');
  $('pendant-slots').querySelectorAll('[data-pendant-slot]').forEach(b=>b.onclick=()=>{selectedPendantSlot=Number(b.dataset.pendantSlot);renderPendants(true);});
  const selected=view.slots[view.selected];
  $('pendant-selection-label').textContent=`${view.selected+1}번 자리 ${selected.item?`· ${selected.item.name}`:'· 비어 있음'}`;
  $('pendant-unequip').disabled=!selected.instance;
  $('pendant-list').innerHTML=view.owned.length?view.owned.map(({instance,item,equippedSlot})=>`<button class="pendant-card ${equippedSlot>=0?'equipped':''}" data-pendant="${escapeHtml(instance.instanceId)}"><span class="pendant-card-icon">${catalogIcon(instance.catalogId,'◇')}</span><span class="pendant-card-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description)}</small><span class="pendant-action">${equippedSlot>=0?`${equippedSlot+1}번에 장착 중 · 자리 선택`:`${view.selected+1}번 자리에 ${selected.instance?'교체':'장착'}`}</span></span></button>`).join(''):'<p class="pendant-empty">아직 보유한 펜던트가 없습니다.<br>탐험과 수업에서 펜던트를 얻을 수 있습니다.</p>';
  $('pendant-list').querySelectorAll('[data-pendant]').forEach(b=>b.onclick=()=>{
    const choice=view.owned.find(e=>e.instance.instanceId===b.dataset.pendant);if(!choice)return;
    if(choice.equippedSlot>=0){selectedPendantSlot=choice.equippedSlot;renderPendants(true);return;}
    const result=engine.equip(choice.instance.instanceId,selectedPendantSlot);
    toast(result.ok?`${selectedPendantSlot+1}번 자리 · ${choice.item.name} 장착`:result.message);
    lastPanels='';scheduleSave();refreshPanels();if(result.ok)$('pendants-panel').scrollTop=0;$('pendant-slots').querySelector(`[data-pendant-slot="${selectedPendantSlot}"]`)?.focus({preventScroll:true});
  });
  if(focusSlot)$('pendant-slots').querySelector(`[data-pendant-slot="${selectedPendantSlot}"]`)?.focus({preventScroll:true});
}
function useItem(id){if(!engine)return;const r=engine.useItem(id);if(r?.message)toast(r.message);lastPanels='';scheduleSave();refreshPanels();}
function showSpell(sp){openModal(sp.name,`<div class="spell-detail-word">${catalogIcon(sp.id,'✦')}${escapeHtml(sp.input)}</div><p>${escapeHtml(sp.description)}</p><div class="reward-grid"><div class="reward-item">마나<strong>${sp.mana} MP</strong></div><div class="reward-item">재사용<strong>${sp.cooldown}초</strong></div>${sp.damage?`<div class="reward-item">기본 피해<strong>${sp.damage}</strong></div>`:''}</div><p class="tip">공백 없이 영어로 입력한 뒤 Enter를 누르세요.<br>입력 중에도 이동과 방어를 할 수 있습니다.</p>`,[{label:'확인',action:closeModal}],'SPELLBOOK');}
function nearestEntity() {
  if(!engine)return null;const p=engine.world.player;
  return engine.world.entities.filter(e=>engine.canInteract(e)&&!e.hidden)
    .map(e=>({e,d:Math.hypot(e.x-p.x,e.z-p.z)})).filter(o=>o.d<3.4&&engine.lineClear(p,o.e)).sort((a,b)=>a.d-b.d)[0]?.e||null;
}
function nearExit() {const exit=engine?.scene.exit,p=engine?.world.player;return !!(exit&&p&&engine.canExit()&&Math.hypot(p.x-exit.x,p.z-exit.z)<3.3&&engine.lineClear(p,exit));}
function overlayPoint(x,z,height) {
  const point=renderer.project(x,z,height),canvas=$('world');
  const rect=canvas.getBoundingClientRect(),view=$('viewport').getBoundingClientRect();
  return {...point,x:(rect.left-view.left+point.x*rect.width)/view.width,y:(rect.top-view.top+point.y*rect.height)/view.height};
}
function refreshHud() {
  if(!engine)return;const p=engine.world.player;
  $('hp-value').textContent=`${Math.ceil(p.hp)} / ${Math.ceil(p.maxHp)}`;$('hp-bar').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;
  $('mana-value').textContent=`${Math.floor(p.mana)} / ${p.maxMana}`;$('mana-bar').style.width=`${p.mana/p.maxMana*100}%`;
  const objectives=engine.objectives(),done=objectives.filter(o=>o.done).length,current=objectives.find(o=>!o.done);
  const chapterDone=chapterFinished();
  const objectiveLabel=current?.displayGroup?`${current.label} (${objectives.filter(o=>o.displayGroup===current.displayGroup&&o.done).length}/${current.displayTotal})`:current?.group?`${current.groupLabel||current.label} (${objectives.filter(o=>o.group===current.group&&o.done).length}/${current.groupTotal||objectives.filter(o=>o.group===current.group).length})`:current?.label;
  $('current-objective').textContent=objectiveLabel||(chapterDone?`제${chapterInfo(chapterIdForScene(engine.scene.id)).number}장 완료`:'출구로 이동하세요');$('objective-count').textContent='';
  $('exit-button').hidden=!nearExit()||isPaused()||chapterDone;$('exit-button').innerHTML='장소 이동 <kbd>Enter</kbd>';
  const near=nearestEntity();$('interact-prompt').hidden=(!near&&!nearExit())||isPaused()||(chapterDone&&!near);if(nearExit()&&!chapterDone)$('interact-text').textContent='밖으로 나가기';else if(near)$('interact-text').textContent=near.interactLabel||`${near.name} · ${near.shopId?'상점':'살펴보기'}`;
  const status=[];
  if(engine.world.hold)status.push(`${engine.world.hold.inside?'수호 중':'표식 가까이 이동'} · ${engine.world.hold.remaining}초`);
  if(p.oxygen!==undefined)status.push(`산소 ${Math.ceil(p.oxygen)} / ${p.maxOxygen} · 공기 방울에서 보충`);
  if(p.fearUntil>engine.world.time)status.push('공포 · 이동 속도 감소');
  if(p.patronusUntil>engine.world.time)status.push(`수호령 ${Math.ceil(p.patronusUntil-engine.world.time)}초`);
  if(engine.world.zone)status.push(`결계 ${Math.ceil(engine.world.zone.remaining)} · ${Math.ceil(engine.world.zone.until-engine.world.time)}초`);
  if(p.reflectReady&&p.reflectUntil>engine.world.time)status.push('반사 대기 · 1회');
  if(p.stealthUntil>engine.world.time)status.push(`소리 은폐 ${Math.ceil(p.stealthUntil-engine.world.time)}초`);
  if(p.echoReady)status.push('메아리 준비');
  if(p.parryCharged)status.push('방어 반격 +35%');
  if(p.birds>0&&p.birdsUntil>engine.world.time)status.push(`소환 새 ${p.birds}마리`);
  if(engine.save.player.learnedSpells.some(id=>['S030','S031'].includes(id)))status.push(`치유 ${engine.save.player.healingChargesRemaining}회`);
  if(p.revealResistance&&engine.world.revealUntil>engine.world.time){const foe=engine.world.entities.find(e=>e.id===engine.world.targetId);if(foe)status.push(foe.invulnerable?'표적: 직접 피해 무효':foe.kind==='dementor'?'표적: 패트로누스로 격퇴':foe.kind==='basilisk'?'표적: 비늘 피해 감소':'표적: 특별 저항 없음');}

  if(p.poisonUntil>engine.world.time)status.push(`중독 ${Math.ceil(p.poisonUntil-engine.world.time)}초 · purga / 3`);
  if(p.petrifiedUntil>engine.world.time)status.push(`석화 ${Math.ceil(p.petrifiedUntil-engine.world.time)}초`);
  if(p.disarmedUntil>engine.world.time)status.push(`무장해제 ${Math.ceil(p.disarmedUntil-engine.world.time)}초 · 이동해서 거리 벌리기`);
  $('status-effects').textContent=status.join('  ·  ');$('status-effects').hidden=!status.length;
  const warning=engine.world.telegraphs.find(a=>['gaze','pool','breath','deathline','teleport'].includes(a.kind)||a.kind==='charge'&&engine.world.entities.some(e=>e.id===a.ownerId&&e.kind==='basilisk'));
  const cues={teleport:'순간이동 예고 · umbraancora로 저지 가능',breath:'용의 화염 · 바위 뒤로 피하세요',deathline:'☠ 치명적인 저주 · 비석 엄폐 / 옆으로 이동',charge:'송곳니 돌진 · 옆으로 피하세요',pool:'독액 · 바닥의 예고 범위를 벗어나세요',gaze:'시선 공격 · 기둥 뒤로 피하세요',venomPool:'독액 · 바닥의 예고 범위를 벗어나세요',poisonPool:'독액 · 바닥의 예고 범위를 벗어나세요',fangCharge:'송곳니 돌진 · 옆으로 피하세요','fang-charge':'송곳니 돌진 · 옆으로 피하세요'};
  $('combat-cue').hidden=!warning;$('combat-cue').textContent=warning?(warning.kind==='teleport'&&engine.world.entities.find(e=>e.id===warning.ownerId)?.kind==='snape'?'스네이프의 이동 · 예고 지점에서 벗어나세요':warning.kind==='pool'&&warning.element==='fire'?'검은 불길 · 바닥의 예고 범위를 벗어나세요':cues[warning.kind]):'';
  $('guard-indicator').hidden=!p.guarding;$('guard-value').textContent=`안정도 ${Math.floor(p.guardStability||0)}`;
  const boss=engine.world.entities.find(e=>(e.type==='boss'||e.kind==='troll')&&e.active!==false&&!e.hidden&&!e.locked);const activeBoss=boss&&boss.active!==false&&!boss.hidden&&!boss.locked&&boss.hp>0;$('boss-hud').hidden=!activeBoss;
  if(activeBoss){$('boss-name').textContent=boss.name;$('boss-phase').textContent=boss.invulnerable?(boss.objectiveTotal?`${boss.progressLabel} ${boss.objectiveProgress||0} / ${boss.objectiveTotal}`:'목표를 수행하세요'):boss.kind==='troll'?(boss.hp/boss.maxHp<=.5?'격앙':''):`PHASE ${boss.phase||1}`;$('boss-bar').style.width=`${boss.invulnerable?100*(boss.objectiveProgress||0)/(boss.objectiveTotal||1):Math.max(0,boss.hp/boss.maxHp*100)}%`;}
  const target=engine.world.entities.find(e=>e.id===engine.world.targetId&&e.active!==false);
  const labels=[];
  for(const e of [near,target].filter((e,i,a)=>e&&a.indexOf(e)===i)) {
    const pos=overlayPoint(e.x,e.z,e.type==='boss'?3.8:2.3);
    if(pos.visible)labels.push(`<span class="nameplate ${e===target?'target':''}" style="left:${pos.x*100}%;top:${pos.y*100}%">${e===target?'◇ ':''}${escapeHtml(e.name)}${['enemy','boss','target'].includes(e.type)?`<small>${e.invulnerable?'직접 피해 무효':`${Math.ceil(e.hp)} / ${e.maxHp}`}</small>`:''}</span>`);
  }
  $('nameplates').innerHTML=labels.join('');
  const goal=current?.target?engine.world.entities.find(e=>e.id===current.target&&e.active!==false&&!e.locked):engine.canExit()&&!chapterDone?{...engine.scene.exit,name:'출구'}:null;
  $('guide-pointer').hidden=!goal||isPaused();
  if(goal){const pos=overlayPoint(goal.x,goal.z,1);const distance=Math.hypot(goal.x-p.x,goal.z-p.z);const off=!pos.visible||pos.x<.07||pos.x>.93||pos.y<.18||pos.y>.78;$('guide-pointer').style.left=`${Math.max(.08,Math.min(.92,pos.x))*100}%`;$('guide-pointer').style.top=`${Math.max(.2,Math.min(.78,pos.y))*100}%`;$('guide-pointer').innerHTML=`<b>${off?'↗':'◇'}</b><span>${escapeHtml(goal.name)}</span><small>${Math.ceil(distance)} T</small>`;}
}
function updateSpellInput(){
  const value=$('spell-input').value.toLowerCase().replace(/[^a-z]/g,'').slice(0,48);$('spell-input').value=value;renderer?.setTypingInput?.(value);
  const learned=engine?SPELLS.filter(s=>engine.save.player.learnedSpells.includes(s.id)):[];
  const match=learned.find(s=>s.input===value),suggestions=value?learned.filter(s=>s.input.startsWith(value)):[];
  $('spell-feedback').textContent=match?`${match.name} · ${match.mana} MP`:value?'주문을 이어서 입력하세요':'영어 주문 · 공백 없이';
  $('spell-console')?.classList.toggle('ready',!!match);
  $('spell-suggestion').textContent=match?'준비되었습니다. Enter로 시전하세요.':suggestions.length?suggestions.slice(0,3).map(s=>s.input).join('  ·  '):value?'일치하는 주문이 없습니다. 주문서를 확인하세요.':'이동하면서 입력할 수 있습니다';
  $('cast-button').classList.toggle('ready',!!match);
}
function resetSpellInput(){
  spellResetGeneration++;$('spell-input').value='';$('spell-console').classList.remove('miscast','ready');$('cast-button').classList.remove('ready');
  updateSpellInput();
}
function castOrInteract() {
  if(isPaused()||!engine)return;
  const input=$('spell-input').value.trim();
  if(!input){interact();return;}
  const result=engine.cast(input);
  $('spell-input').value='';
  if(result.ok){renderer?.setCastFeedback?.();scheduleSave();}else {sound('failure');if(result.message)toast(result.message);$('spell-console').classList.remove('miscast');const generation=spellResetGeneration;requestAnimationFrame(()=>{if(generation===spellResetGeneration)$('spell-console').classList.add('miscast');});setTimeout(()=>$('spell-console').classList.remove('miscast'),400);}
  updateSpellInput();refreshHud();
}
function interact() {
  if(isPaused()||!engine)return;
  if(nearExit()&&!chapterFinished()){finishScene();return;}
  const entity=engine.interact();if(!entity){toast('대화하거나 작동할 대상 가까이로 이동하세요.');return;}
  const finish=choice=>{
    if(choice){
      engine.save.progress.flags[choice.flag||`choice.${entity.id}`]=choice.value??choice.id;
      if(choice.reward)engine.grantReward(choice.reward,`choice:${entity.id}`);
      engine.recordEvent('choice',{target:entity.id,choice:choice.id});
    }
    for(const id of entity.useStoryItems||[])if(engine.save.progress.storyItems[id]==='owned')engine.save.progress.storyItems[id]='used';
    for(const id of entity.destroyStoryItems||[])if(engine.save.progress.storyItems[id])engine.save.progress.storyItems[id]='destroyed';
    engine.recordEvent('interact',{target:entity.id});lastPanels='';scheduleSave();refreshPanels();
    if(entity.shopId)showShop(entity.shopId);
  };
  const variant=entity.dialogueVariants?.find(v=>engine.save.progress.flags[v.flag]===v.equals);
  const lessonDone=entity.choices?.some(c=>c.reward)&&engine.save.world.claimedRewardIds.includes(`choice:${entity.id}`);
  const dialogue=(lessonDone?entity.repeatDialogue:null)||variant?.lines|| (entity.dialogue?.length?entity.dialogue:[{speaker:entity.name,text:entity.interactLabel||'주변을 살펴봅니다.'}]);
  showDialogue(dialogue,finish,lessonDone?[]:(entity.choices||[]));
}
function showShop(shopId) {
  const shop=SHOPS[shopId];if(!shop){toast('이 상점은 아직 문을 열지 않았습니다.');return;}
  const rows=shop.offers.filter(offer=>offerAvailable(offer,engine.save)).map(offer=>{
    const item=offer.spellId?spellById.get(offer.spellId):ITEMS[offer.itemId];
    const owned=offer.spellId&&engine.save.player.learnedSpells.includes(offer.spellId);
    const record=engine.save.world.shopOffers[offer.id];const left=record?.remaining??offer.stock;
    return `<div class="shop-row"><span class="shop-glyph">${catalogIcon(offer.spellId||offer.itemId,offer.spellId?'✦':'◈')}</span><div><strong>${escapeHtml(item?.name||offer.itemId||offer.spellId)}</strong><p>${escapeHtml(item?.description||'')}</p><small>${left===null?'상시 보급':`남은 수량 ${left}`} ${owned?'· 이미 배운 주문':''}</small></div><button data-buy="${offer.id}" ${owned||left===0||engine.save.inventory.gold<offer.price?'disabled':''}>${offer.price} G</button></div>`;
  }).join('');
  openModal(shop.name,`<div class="shop-balance">보유 골드 <strong>${engine.save.inventory.gold} G</strong></div>${rows}<p class="tip">필수 주문과 임무 도구는 이야기에서 무료로 제공됩니다.</p>`,[{label:'상점 나가기',className:'secondary-button',action:closeModal}],'THE WIZARDING MARKET');
  $('modal-body').querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{
    b.disabled=true;const result=engine.buy(shopId,b.dataset.buy,crypto.randomUUID());toast(result.message|| (result.ok?'구매했습니다.':'구매할 수 없습니다.'));
    if(result.ok){sound('success');scheduleSave();lastPanels='';refreshPanels();}showShop(shopId);
  });
}
async function finishScene() {
  if(isPaused()||!engine.canExit())return;
  transitionBusy=true;releaseKeys();
  const result=engine.finishScene();if(!result.ok){transitionBusy=false;toast(result.message||'목표를 먼저 완료하세요.');return;}
  try{await persistNow();}catch{transitionBusy=false;return;}
  sound('success');lastPanels='';refreshPanels();
  const nextId=result.nextId||engine.scene.nextId;
  if(nextId) {
    transitionBusy=true;releaseKeys();$('scene-transition').classList.add('active');
    try{await new Promise(resolve=>setTimeout(resolve,180));await enterScene(await getScene(nextId));}
    catch(error){toast(`다음 장소를 불러오지 못했습니다: ${error.message} · 출구에서 다시 시도하세요.`);}
    finally{$('scene-transition').classList.remove('active');transitionBusy=false;focusGameUI();}
  }else {
    transitionBusy=false;
    const message=`제${chapterInfo(chapterIdForScene(engine.scene.id)).number}장 완료 · 진행이 저장되었습니다.`;
    if(engine.scene.exitDialogue?.length)showDialogue(engine.scene.exitDialogue,()=>toast(message));else toast(message);
  }
}

function showObjectives() {
  if(!engine)return;
  openModal(engine.scene.name,`<p>${escapeHtml(engine.scene.description)}</p><div>${engine.objectives().map(o=>`<div class="quest-row ${o.done?'done':''}"><span>${o.done?'✓':'◇'}</span><div><strong>${escapeHtml(o.label)}</strong>${o.hint?`<p>${escapeHtml(o.hint)}</p>`:''}<small>${o.current||0} / ${o.count||1}</small></div></div>`).join('')}</div>`,[{label:'여정 계속하기',action:closeModal}],'CURRENT OBJECTIVES');
}
function showHelp() {
  openModal('마법사 안내서',`<p>화면 속 표식에 가까이 가서 대화하고, 목표를 달성하면 다음 이야기로 이동할 수 있습니다.</p><div class="controls-grid"><div class="key-row"><kbd>↑ ↓ ← →</kbd><span>화면 기준 이동</span></div><div class="key-row"><kbd>A–Z</kbd><span>영어 주문 입력 · 공백 없음</span></div><div class="key-row"><kbd>Enter</kbd><span>주문 시전 / 입력이 없으면 대화</span></div><div class="key-row"><kbd>Space</kbd><span>대화 넘기기 / 전투 중 누르기: 방어</span></div><div class="key-row"><kbd>Tab</kbd><span>표적 순환</span></div><div class="key-row"><kbd>1–4</kbd><span>1 체력 · 2 마나 · 3 해독 · 4 활력</span></div><div class="key-row"><kbd>Backspace / Esc</kbd><span>한 글자 수정 / 입력 비우기</span></div><div class="key-row"><kbd>&#96;</kbd><span>주문서·가방 열기 / 닫기</span></div><div class="key-row"><kbd>PageUp / PageDown</kbd><span>주문서·소지품·펜던트 탭 이동</span></div><div class="key-row"><kbd>F2 / F10</kbd><span>현재 목표 / 전체 화면</span></div></div><p class="tip">대화는 Enter 또는 Space로 넘기고, 대답은 방향키로 고른 뒤 Enter로 확정합니다. 주문이 틀려도 Enter를 누르면 입력이 비워져 바로 다시 칠 수 있습니다. 적색 공격 예고는 이동해서 피하세요.</p><p class="muted">메뉴·대화·가방이 열려 있을 때는 게임이 멈춥니다. 메뉴는 방향키와 Enter로 조작하고 Esc로 닫습니다. 펜던트 탭에서 3개의 장착 자리와 효과를 확인하고, 바꿀 자리를 먼저 선택할 수 있습니다. 출구에 다가가 Enter를 누르면 다음 장소로 이동합니다. 기기 저장은 자동입니다. 다른 기기에서 이어하려면 저장 파일을 가져오거나 설정에서 클라우드를 연결하세요.</p>`,[{label:'알겠습니다',action:()=>{closeModal();if(engine?.world.player.hp<=0)onEngineEvent({type:'defeat'});}}],'HOW TO PLAY');
}
function downloadSave() {
  if(engine&&started){engine.syncSave();saved=structuredClone(engine.save);}
  if(!saved){toast('저장된 여정이 아직 없습니다.');return;}
  const blob=new Blob([JSON.stringify(saved,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`lumos-${saved.cursor.chapterId}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function showSettings() {
  const cloud=saveManager.getCloudConfig();
  openModal('설정과 저장',`<div class="settings-grid"><div><h3>나의 진행 보관</h3><button id="settings-audio" class="secondary-button">${soundOn?'소리 끄기':'소리 켜기'}</button><button id="settings-draft-audio" class="secondary-button" aria-pressed="${draftSoundsOn}">${draftSoundsOn?'초안 효과음 사용 중':'초안 효과음 사용'}</button><p class="muted">초안 효과음은 제작 팩의 합성 WAV입니다. 기본 알림음과 전환하며, 배경 음악은 아직 없습니다.</p><p>현재 기기에 자동 저장합니다. 파일로 내려받으면 다른 기기에서도 이어갈 수 있습니다.</p><button id="export-save" class="secondary-button">저장 파일 내려받기</button><button id="open-import" class="secondary-button">저장 파일 가져오기</button></div><div><h3>클라우드 저장 연결</h3><p class="muted">본인의 Apps Script 저장 서버가 있을 때 연결하세요. 연결 전에는 기기에만 저장합니다.</p><label class="form-field">Apps Script 배포 URL<input id="cloud-url" type="url" placeholder="https://script.google.com/macros/s/…/exec" value="${escapeHtml(cloud.endpoint||'')}"></label><label class="form-field">플레이어 ID<input id="cloud-player" autocomplete="off" value="${escapeHtml(cloud.playerId||'')}"></label><label class="form-field">개인 복구키<input id="cloud-token" type="password" autocomplete="off" placeholder="${cloud.configured?'변경 시에만 입력':'개인 복구키'}"></label><div class="settings-buttons"><button id="connect-cloud" class="secondary-button">연결 설정 저장</button><button id="sync-cloud" class="secondary-button" ${cloud.configured?'':'disabled'}>지금 동기화</button><button id="load-cloud" class="secondary-button" ${cloud.configured?'':'disabled'}>클라우드에서 불러오기</button></div><p id="cloud-result" class="muted"></p></div></div>`,[{label:'닫기',action:closeModal}],'SETTINGS');
  $('settings-draft-audio').onclick=()=>{draftSoundsOn=!draftSoundsOn;draftSoundBank.stopAll();try{localStorage.setItem('lumos.draftSounds',draftSoundsOn?'on':'off');}catch{}$('settings-draft-audio').textContent=draftSoundsOn?'초안 효과음 사용 중':'초안 효과음 사용';$('settings-draft-audio').setAttribute('aria-pressed',String(draftSoundsOn));if(soundOn)sound('click');};
  $('settings-audio').onclick=()=>{$('audio-button').click();$('settings-audio').textContent=soundOn?'소리 끄기':'소리 켜기';};$('export-save').onclick=downloadSave;$('open-import').onclick=()=>{$('import-file').click();};
  $('connect-cloud').onclick=async()=>{
    try { await saveManager.configureCloud({endpoint:$('cloud-url').value.trim(),playerId:$('cloud-player').value.trim(),token:$('cloud-token').value.trim()});$('cloud-result').textContent='설정을 보관했습니다. 실제 저장은 동기화 성공 응답 후 완료됩니다.';$('sync-cloud').disabled=false;$('load-cloud').disabled=false; }catch(e){$('cloud-result').textContent=e.message;}
  };
  $('sync-cloud').onclick=async()=>{try{if(started)await persistNow();await saveManager.flush();$('cloud-result').textContent='동기화 요청을 처리했습니다. 상단의 저장 상태를 확인하세요.';}catch(e){$('cloud-result').textContent=`동기화 실패: ${e.message}`;}};
  $('load-cloud').onclick=()=>openModal('클라우드 진행으로 바꾸기','<p>기기의 현재 진행이 클라우드 저장으로 바뀝니다. 먼저 파일로 보관할 수 있습니다.</p>',[{label:'현재 진행 내려받기',className:'secondary-button',action:downloadSave},{label:'클라우드 불러오기',action:async()=>{try{const state=await saveManager.loadCloud({replaceLocal:true});saved=state;closeModal();await launch(state);}catch(e){toast(`불러오기 실패: ${e.message}`);}}}],'CLOUD SAVE');
}
function showPause() {
  if(!started)return showHelp();
  openModal('잠시 쉬어가세요','<p>당신의 다음 주문을 기다리고 있습니다.</p>',[{label:'이야기 계속하기',action:closeModal},{label:'목표 확인',className:'secondary-button',action:showObjectives},{label:'저장과 설정',className:'secondary-button',action:showSettings},{label:'시작 화면으로',className:'secondary-button',action:async()=>{await persistNow();closeModal();closeDialogue();setBook(false);started=false;document.body.classList.add('on-title');$('title-screen').hidden=false;$('continue-button').hidden=false;$('new-game-button').className='secondary-button';}}],'PAUSED');
}

function panelKeys(e,panel) {
  if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
  const buttons=[...panel.querySelectorAll('button:not(:disabled),a[href]')].filter(b=>b.getClientRects().length&&!b.closest('[hidden]'));
  if(e.key.startsWith('Arrow')){
    e.preventDefault();const i=buttons.indexOf(document.activeElement),step=['ArrowUp','ArrowLeft'].includes(e.key)?-1:1;
    buttons[(i+step+buttons.length)%buttons.length]?.focus({preventScroll:true});document.activeElement.scrollIntoView?.({block:'nearest'});return;
  }
  if((e.key==='Enter'||e.code==='Space')&&buttons.includes(document.activeElement)){e.preventDefault();if(!e.repeat)document.activeElement.click();}
}
window.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;
  if(e.key==='F10'){e.preventDefault();if(!e.repeat)toggleFullscreen();return;}
  if(modal.open){if(e.key==='Escape'){e.preventDefault();if(!e.repeat)closeModal();}else panelKeys(e,modal);return;}
  if(switching||transitionBusy){if(['Enter','Escape','Tab'].includes(e.key)||e.code==='Space'||e.key.startsWith('Arrow'))e.preventDefault();return;}
  if(dialogueState){
    if(e.key==='Escape'){e.preventDefault();if(!e.repeat)showPause();return;}
    if(e.key.startsWith('Arrow')||e.key==='Tab'){
      e.preventDefault();if(dialogueState.choosing){const d=dialogueState,step=['ArrowUp','ArrowLeft'].includes(e.key)||e.shiftKey?-1:1;d.choiceIndex=(d.choiceIndex+step+d.choices.length)%d.choices.length;renderDialogue();}return;
    }
    if(e.key==='Enter'||e.code==='Space'){e.preventDefault();if(!e.repeat)advanceDialogue();}return;
  }
  if(!started){
    if(e.key==='Enter'&&!e.repeat&&!['BUTTON','A'].includes(document.activeElement.tagName)){e.preventDefault();startGame(false);}return;
  }
  if(bookOpen){
    if(e.key==='Escape'||e.code==='Backquote'){e.preventDefault();if(!e.repeat)setBook(false);return;}
    if(['PageUp','PageDown'].includes(e.key)){e.preventDefault();setTab(adjacentBookTab(activeBookTab,e.key==='PageUp'?-1:1));$('tab-'+activeBookTab).focus();return;}
    if(document.activeElement?.getAttribute('role')==='tab'&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();setTab(adjacentBookTab(activeBookTab,e.key==='ArrowLeft'?-1:1));$('tab-'+activeBookTab).focus();return;}
    panelKeys(e,document.querySelector('.spellbook'));return;
  }
  if(e.code==='Backquote'){e.preventDefault();if(!e.repeat)setBook(true);return;}
  if(e.key==='F2'){e.preventDefault();if(!e.repeat)showObjectives();return;}
  if(e.key.startsWith('Arrow')){e.preventDefault();keys.add(e.key);movement();return;}
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)engine.setGuard(true);return;}
  if(e.key==='Tab'){e.preventDefault();if(!e.repeat)engine.cycleTarget();return;}
  if(e.key==='Enter'){e.preventDefault();if(!e.repeat)castOrInteract();return;}
  if(e.key==='Escape'){e.preventDefault();if($('spell-input').value){$('spell-input').value='';updateSpellInput();}else showPause();return;}
  if(e.key==='Backspace'){e.preventDefault();$('spell-input').value=$('spell-input').value.slice(0,-1);updateSpellInput();return;}
  if(/^F[3-5]$/.test(e.key)){e.preventDefault();if(!e.repeat){const result=engine.usePendant(Number(e.key.slice(1))-3);toast(result.message);scheduleSave();}return;}
  if(/^[1-4]$/.test(e.key)){e.preventDefault();if(!e.repeat)useItem(engine.quickItem(Number(e.key)-1));return;}
  if(/^[a-zA-Z]$/.test(e.key)){e.preventDefault();if($('spell-input').value.length<48){$('spell-input').value+=e.key.toLowerCase();if(draftSoundsOn)sound('input');}updateSpellInput();return;}
  if(e.key==='F1'){e.preventDefault();showHelp();}
});
function movement(){engine?.setMovement(Number(keys.has('ArrowRight'))-Number(keys.has('ArrowLeft')),Number(keys.has('ArrowDown'))-Number(keys.has('ArrowUp')));}
window.addEventListener('keyup',e=>{keys.delete(e.key);if(e.key.startsWith('Arrow')){e.preventDefault();movement();}if(e.code==='Space'){engine?.setGuard(false);if(started)e.preventDefault();}});
window.addEventListener('blur',()=>{releaseKeys();pausedByBlur=true;});
window.addEventListener('focus',()=>{pausedByBlur=false;lastFrame=performance.now();});
document.addEventListener('visibilitychange',()=>{releaseKeys();lastFrame=performance.now();if(document.hidden&&started)persistNow().catch(()=>{});});
$('spell-input').addEventListener('input',updateSpellInput);
$('spell-input').addEventListener('compositionend',()=>{updateSpellInput();toast('영어 입력 상태로 전환해 주세요.');});
$('dialogue-continue').onclick=advanceDialogue;
$('dialogue-portrait').onerror=()=>{$('dialogue-portrait').hidden=true;$('dialogue-box').classList.remove('has-portrait');};
$('player-portrait').onerror=()=>{$('player-portrait').hidden=true;};
$('book-button').onclick=()=>setBook(!bookOpen);$('book-close').onclick=()=>setBook(false);$('fullscreen-button').onclick=toggleFullscreen;
$('new-game-button').onclick=()=>startGame(true);$('continue-button').onclick=()=>startGame(false);
$('cast-button').onclick=castOrInteract;$('interact-button').onclick=interact;$('touch-interact').onclick=interact;
$('exit-button').onclick=finishScene;$('quest-button').onclick=showObjectives;$('help-button').onclick=showHelp;$('title-help').onclick=showHelp;
$('settings-button').onclick=showSettings;$('pause-button').onclick=showPause;$('brand-home').onclick=e=>{e.preventDefault();showPause();};
$('modal-close').onclick=closeModal;modal.addEventListener('cancel',e=>{if(engine?.world.player.hp<=0){e.preventDefault();return;}releaseKeys();});
for(const tab of BOOK_TABS)$('tab-'+tab).onclick=()=>setTab(tab);
function setTab(tab){
  activeBookTab=BOOK_TABS.includes(tab)?tab:'spells';
  for(const id of BOOK_TABS){const active=id===activeBookTab;$(id+'-panel').hidden=!active;$('tab-'+id).classList.toggle('active',active);$('tab-'+id).setAttribute('aria-selected',String(active));}
  document.body.classList.toggle('book-pendants',activeBookTab==='pendants');
}
$('pendant-unequip').onclick=()=>{
  const result=engine.unequip(selectedPendantSlot);toast(result.message);lastPanels='';scheduleSave();refreshPanels();
  if(result.ok)$('pendants-panel').scrollTop=0;
  $('pendant-slots').querySelector(`[data-pendant-slot="${selectedPendantSlot}"]`)?.focus({preventScroll:true});
};
$('audio-button').onclick=()=>{soundOn=!soundOn;if(!soundOn)draftSoundBank.stopAll();try{localStorage.setItem('lumos.sound',soundOn?'on':'off');}catch{}refreshAudio();if(soundOn)sound('click');};
function refreshAudio(){$('audio-button').textContent=soundOn?'♪ 소리 켜짐':'♪ 소리 꺼짐';$('audio-button').setAttribute('aria-pressed',String(soundOn));}
$('import-file').onchange=async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  if(file.size>2_000_000){toast('저장 파일이 너무 큽니다.');return;}
  try {
    const json=await file.text();const next=JSON.parse(json);validateSave(next);
    openModal('저장된 여정 가져오기',`<p>${escapeHtml(next.cursor.subchapterId)}의 진행을 가져옵니다. 현재 진행은 먼저 보관할 수 있습니다.</p>`,[{label:'현재 진행 내려받기',className:'secondary-button',action:downloadSave},{label:'가져오기',action:async()=>{try{await saveManager.importSave(json);saved=next;closeModal();await launch(next);}catch(err){toast(err.message);}}}],'IMPORT SAVE');
  }catch(err){toast(`유효한 저장 파일이 아닙니다: ${err.message}`);}
};
document.querySelectorAll('[data-move]').forEach(b=>{
  const stop=()=>engine?.setMovement(0,0);b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!isPaused())engine.setMovement(...b.dataset.move.split(',').map(Number));};b.onpointerup=stop;b.onpointercancel=stop;
});
$('touch-guard').onpointerdown=e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);if(!isPaused())engine.setGuard(true);};
$('touch-guard').onpointerup=$('touch-guard').onpointercancel=()=>engine?.setGuard(false);

function animate(now) {
  requestAnimationFrame(animate);const dt=Math.min((now-lastFrame)/1000||0,.2);lastFrame=now;
  if(!renderer)return;
  if(started&&engine){
    for(const entity of engine.world.entities)entity.onScreen=renderer.project(entity.x,entity.z,1).visible;
    if(!isPaused()){accumulator+=dt;while(accumulator>=1/60){engine.update(1/60);accumulator-=1/60;}}else accumulator=0;
    renderer.render(engine.world,dt);
    if(now-lastHud>80){lastHud=now;refreshHud();refreshPanels();}
  }else if(demoEngine){demoEngine.world.time+=dt;renderer.render(demoEngine.world,dt);}
  else if(engine)renderer.render(engine.world,dt);
}
async function init(){
  switching=true;
  try {
    await saveManager.init();saved=await saveManager.load();
    if(!saved)$('save-status').innerHTML='<i></i>시작하면 기기에 저장';
    if(saved){$('continue-button').hidden=false;$('new-game-button').className='secondary-button';}
    renderer=new WorldRenderer($('world'));
    const demoScene=structuredClone(await getScene('1-05'));
    demoEngine=new GameEngine({movementProjection:'topdown',save:newGame(),scene:demoScene,onEvent:()=>{}});
    demoEngine.world.player.x=13;demoEngine.world.player.z=18;
    setBook(false);
    renderer.loadScene(demoScene);refreshAudio();requestAnimationFrame(animate);
    $('player-portrait').src=portraitFor('해리').url;
    await waitForSceneAssets();$('loading').hidden=true;switching=false;
  }catch(e){switching=false;console.error(e);$('loading').hidden=true;$('fatal-error').hidden=false;$('fatal-message').textContent=`${e.message} · 페이지를 새로고침해 다시 시도하세요.`;}
}
init();
