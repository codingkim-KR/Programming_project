// Chapter-one artwork IDs. Paths are relative to this module, including on /repo/ Pages URLs.
const PACK_ROOT = new URL('../assets/packs/', import.meta.url);
export const PORTRAIT_SPEAKERS = Object.freeze({
  '해리':'harry', '론':'ron', '헤르미온느':'hermione', '하그리드':'hagrid',
  '올리밴더':'ollivander', '서점 주인':'bookseller', '약재상':'apothecary',
  '플리트윅 교수':'flitwick', '플리트윅':'flitwick', '스프라우트 교수':'sprout',
  '스프라우트':'sprout', '후치 부인':'hooch', '후치':'hooch', '수리공':'repairer',
  '퀴렐':'quirrell', '스네이프 교수':'snape', '스네이프':'snape',
  '맥고나걸 교수':'mcgonagall', '맥고나걸':'mcgonagall', '필치':'filch',
  '간식 판매원':'trolley_witch', '간식 카트 주인':'trolley_witch',
});
const SPECIAL_EXPRESSIONS = {
  harry: {available:['neutral','happy','determined'],aliases:{tense:'determined',sad:'neutral'}},
  hermione: {available:['neutral','happy','worried'],aliases:{tense:'worried',sad:'worried'}},
};
const CHARACTERS = new Set(Object.values(PORTRAIT_SPEAKERS));
export const ICON_IDS = Object.freeze([
  'S001','S002','S003','S005','S006','S007','S019','S026','S034','S035','S036','S037','S038','S039',
  'I001','I003','I016','I018','I021','I022','I025','I026','I027','I030','I031','I036','I040','I061','I064',
  'P001','P012','P013','P019','P025','P026','P027','W001','W002','W017',
]);
const icons = new Set(ICON_IDS);

export function iconUrl(id) {
  return icons.has(id) ? new URL(`ICON_CATALOG/v1/${id}.png`,PACK_ROOT).href : null;
}

export function portraitFor(speaker,expression='neutral') {
  const character=PORTRAIT_SPEAKERS[speaker] || (CHARACTERS.has(speaker)?speaker:null);
  if(!character)return null;
  const special=SPECIAL_EXPRESSIONS[character];
  const actual=special?.aliases[expression] || expression;
  const available=special?.available || ['neutral','tense','sad'];
  const selected=available.includes(actual)?actual:'neutral';
  return {character,expression:selected,requestedExpression:expression,
    isFallback:selected!==expression,url:new URL(`PORTRAITS/v1/${character}_${selected}.png`,PACK_ROOT).href};
}

export function dialoguePortrait(line,{sceneId='',choiceResponse=false,chapterComplete=false}={}) {
  // Explicit line direction takes priority. A missing portrait never borrows another person's face.
  const danger=!chapterComplete&&['1-08','1-10','1-12'].includes(sceneId);
  const expression=line.expression || (danger?'tense':choiceResponse||chapterComplete?'happy':'neutral');
  return portraitFor(line.characterId || line.speaker,expression);
}

const DRAFT_CUES = Object.freeze({
  input:{pack:'SFX_INPUT',file:'input_1.wav',gain:.045},
  cast:{pack:'SFX_INPUT',file:'complete.wav',gain:.10},
  success:{pack:'SFX_INPUT',file:'complete.wav',gain:.12},
  victory:{pack:'SFX_INPUT',file:'complete.wav',gain:.12},
  failure:{pack:'SFX_INPUT',file:'failure.wav',gain:.12},
  defeat:{pack:'SFX_INPUT',file:'failure.wav',gain:.12},
  guard:{pack:'SFX_INPUT',file:'guard.wav',gain:.10},
  parry:{pack:'SFX_INPUT',file:'parry.wav',gain:.10},
  collect:{pack:'SFX_WORLD',file:'pickup.wav',gain:.10},
  hit:{pack:'SFX_WORLD',file:'target_hit.wav',gain:.10},
  click:{pack:'SFX_INPUT',file:'input_2.wav',gain:.045},
});

export function draftCue(kind,{allowDrafts=false}={}) {
  const cue=allowDrafts&&DRAFT_CUES[kind];
  return cue?{...cue,url:new URL(`${cue.pack}/v1/${cue.file}`,PACK_ROOT).href,draft:true}:null;
}

/** Optional synthesized WAV drafts; final music/ambience has no file in this pack. */
export class DraftSoundBank {
  constructor({fetchImpl=globalThis.fetch}={}) {
    this.fetchImpl=fetchImpl;this.buffers=new Map();this.active=new Set();this.generation=0;
  }
  async play(kind,context,{allowDrafts=false}={}) {
    const cue=draftCue(kind,{allowDrafts});
    if(!cue||!context||context.state!=='running')return false;
    const generation=this.generation;
    try {
      if(!this.buffers.has(cue.url)){
        const pending=(async()=>{
          const response=await this.fetchImpl(cue.url,{signal:AbortSignal.timeout(8000)});
          if(!response.ok)throw new Error('효과음을 불러오지 못했습니다.');
          return context.decodeAudioData(await response.arrayBuffer());
        })();
        this.buffers.set(cue.url,pending);
        pending.catch(()=>this.buffers.delete(cue.url));
      }
      const buffer=await this.buffers.get(cue.url);
      if(generation!==this.generation||context.state!=='running')return false;
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=buffer;gain.gain.value=cue.gain;source.connect(gain);gain.connect(context.destination);
      // Keep typing feedback from stacking up on slow devices.
      if(kind==='input')for(const handle of this.active)if(handle.kind==='input')handle.source.stop();
      const handle={source,gain,kind};this.active.add(handle);
      source.onended=()=>{source.disconnect();gain.disconnect();this.active.delete(handle);};source.start();
      return true;
    }catch{return false;}
  }
  stopAll(){
    this.generation++;
    for(const {source,gain} of this.active){try{source.stop();}catch{}source.disconnect();gain.disconnect();}
    this.active.clear();
  }
}
