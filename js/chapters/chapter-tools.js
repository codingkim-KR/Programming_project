// Chapter authoring helpers only: progression and combat remain in the shared engine.
export const L=(speaker,text)=>({speaker,text});
export const R=(gold=0,items={},equipment=[],spells=[])=>({gold,items,equipment,spells});
export const choice=(id,label,response,extra={})=>({id,label,response:[L(extra.speaker||'해리',response)],...extra});
export const talk=(id,name,x,z,dialogue,extra={})=>({step:'talk',id,name,x,z,dialogue,...extra});
export const cast=(id,name,x,z,spell,kind='book',extra={})=>({step:'cast',id,name,x,z,spell,kind,...extra});
export const wave=(id,name,kind,points,extra={})=>({step:'wave',id,name,kind,points,...extra});
export const defeat=(id,name,x,z,kind,extra={})=>({step:'defeat',id,name,x,z,kind,...extra});
export const ring=(id,x,z,extra={})=>({step:'ring',id,name:'비행 표식',x,z,...extra});
export const hold=(id,name,x,z,duration,extra={})=>({step:'hold',id,name,x,z,duration,...extra});
export function makeScene(ch,n,name,theme,options,steps){
 const id=`${ch}-${String(n).padStart(2,'0')}`,scene={id,chapterId:`ch0${ch}`,name,theme,description:options.description||name,kicker:`CHAPTER ${['','I','II','III','IV','V','VI'][ch]||ch} · ${id}`,width:40,depth:30,spawn:{x:5,z:24},exit:{x:35,z:5},layout:{kind:theme},entities:[],objectives:[],blockers:[],entryDialogue:[],grantSpells:[],reward:R(70),combat:{maxTelegraphs:3,attackSpacing:.28},nextId:`${ch}-${String(n+1).padStart(2,'0')}`,...options};
 if(!options.exit)scene.exit={x:scene.width-5,z:5};if(!options.spawn)scene.spawn={x:5,z:scene.depth-6};
 let previous=[];const extraEntities=scene.entities;scene.entities=[];
 for(const step of steps){
  const key=`${id}.${step.id}`,conditions=step.conditions??previous,common={id:key,name:step.name,x:step.x,z:step.z,radius:.7,conditions,hiddenUntilAvailable:true};
  const objective={id:key,label:step.label||step.name,count:1,conditions};
  if(step.step==='wave'){
   const ids=[];
   step.points.forEach(([x,z],i)=>{
    const eid=`${key}.${i+1}`,gid=`${eid}.clear`;ids.push(gid);
    scene.entities.push({...common,id:eid,x,z,type:'enemy',kind:step.kind,name:step.name,hp:step.hp??(ch===3?52:72),damage:step.damage??(ch===3?15:19),speed:step.speed??2.2,reward:R(ch===3?5:7),...step.entity,combat:{sequence:step.kind==='wolf'?['rush','claw']:step.kind==='grindylow'?['venom','claw']:step.kind==='death-eater'?['duel','disarm','burst']:['venom','bite'],startDelay:1.6+i*.3,attackRange:17,aggroRange:28,preferredRange:step.kind==='death-eater'?9:3,projectileSpeed:9,...step.combat}});
    scene.objectives.push({...objective,id:gid,target:eid,event:'kill',displayGroup:key,displayTotal:step.points.length,label:`${step.name} ${step.points.length}마리를 제압하세요`});
   });previous=ids;continue;
  }
  const {step:_step,points,duration,conditions:_,label,...extra}=step;
  const entity={...common,...extra,id:key,type:step.step==='defeat'?(step.type||'enemy'):step.step==='talk'?(new Set(['prophecy-orb','veil','ritual-basin','brazier','ward-gate','vanishing-cabinet','phoenix-coin','locket','trunk','letter','book','gate','crystal','cup','golden-egg','time-turner','patronus-ward','tombstone','tent','sign','bubble','harp','machine']).has(step.kind)?'prop':'npc'):step.step==='ring'?'ring':'prop',kind:step.kind||(step.step==='talk'?'wizard':step.step==='ring'?'ring':'patronus-ward')};
  scene.entities.push(entity);
  const event=step.step==='defeat'?'kill':step.step==='talk'?'interact':step.step==='ring'?'flight':step.step==='hold'?'hold':'cast';
  scene.objectives.push({...objective,event,target:key,...(step.step==='cast'?{spell:step.spell}:{}),...(step.count?{count:step.count}:{})});
  if(step.step==='hold'){entity.hiddenAfter=[key];const prior=scene.entities.find(e=>e.id===previous[0]);if(prior?.spell)prior.hiddenAfter=[prior.id];scene.holds||=[];scene.holds.push({id:key,target:key,conditions,duration,radius:step.holdRadius||5});}
  previous=[key];
 }
 scene.entities.push(...extraEntities);return scene;
}
