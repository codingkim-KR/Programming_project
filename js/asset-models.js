import * as THREE from '../vendor/three.module.js';
import { GLTFLoader } from '../vendor/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from '../vendor/addons/utils/SkeletonUtils.js';

// Explicit authored mappings. Gameplay IDs, colliders and coordinates remain in ch01.
export const modelPath = (pack, file) => `assets/packs/${pack}/v1/${file.endsWith('.glb') ? file : `${file}.glb`}`;
const model = (pack, file, extras = {}) => ({path:modelPath(pack,file), ...extras});
export const PLAYER_MODEL = model('CHR_PLAYER','harry');
export const BROOM_MODEL = model('VEHICLE','broom');
export const NPC_STORY_SLOTS = Object.freeze({
  hagrid:'hagrid',ollivander:'ollivander',bookseller:'bookseller',apothecary:'apothecary',
  ron:'ron',hermione:'hermione',professor:'flitwick',repairer:'repairer',
  // These generic story roles have no separate model in the supplied pack.
  guide:'mcgonagall',keeper:'filch',
});
export function modelSpecsForEntity(e) {
  const kind=e.kind||'', suffix=e.id?.split('.').at(-1);
  if(e.type==='npc')return [model('CHR_NPC',NPC_STORY_SLOTS[suffix]||'mcgonagall')];
  if(e.type==='target')return [model('SET_CASTLE',`training_target_${e.visualState==='broken'?'broken':e.visualState==='damaged'||e.damageRatio>.3?'damaged':'intact'}`)];
  if(kind==='troll')return [model('BOSS_TROLL','mountain_troll')];
  if(kind==='quirrell')return [model('BOSS_HUMAN','quirrell')];
  if(kind==='spider')return [model('CHR_SPIDER','field_spider',{scale:1.25})];
  if(kind==='bat')return [model('CHR_SMALL','bat')];
  if(kind==='armor')return [model('CHR_ARMOR','animated_armor')];
  if(kind==='cursed-book')return [model('CHR_SMALL','cursed_book')];
  if(kind==='chest')return [model('SET_CASTLE','satchel',{scale:1.5})];
  if(kind==='herbs')return [model('SET_GREENHOUSE',e.visualState==='harvested'?'herb_harvested':'herb_full',{scale:1.25})];
  if(kind==='machine')return [model('SET_GREENHOUSE',e.activated?'repair_machine_repaired':'repair_machine_broken')];
  if(kind==='mirror')return [model('SET_CASTLE','mirror')];
  if(kind==='ward')return [model('SET_CASTLE','ward_device',{state:e.activated?'disabled':'active'})];
  if(kind==='feather')return [model('SET_CASTLE','feather_pedestal',{state:e.activated?'levitated':'rest'})];
  if(kind==='lamp')return [model('SET_ALLEY','streetlamp',{scale:.7,state:e.activated?'lit':'unlit'})];
  if(kind==='tracks')return [model('SET_FOREST','footprint_trail',{scale:1.4,state:e.activated?'lit':'rest'})];
  if(kind==='gift')return [model('SET_CASTLE','invisibility_cloak')];
  if(kind==='door')return [model('SET_CASTLE','hinged_door',{state:e.activated?'open':'closed'})];
  if(kind==='vines')return [model('CHR_PLANT','rooted_vine',{scale:1.1,state:e.activated?'burn':'idle'})];
  if(kind==='key')return [model('SET_CASTLE','winged_key',{y:e.activated?.35:1.4,scale:1.7})];
  if(kind==='chess')return [model('SET_CASTLE','chess_king',{scale:1.2,y:e.activated?.6:0})];
  if(kind==='crystal')return [model('SET_CASTLE','philosophers_stone',{scale:1.5,y:.4})];
  if(kind==='flight-ring')return [model('SET_PITCH','training_hoop',{scale:[1.3,.8,1.3],rotation:Math.PI/4})];
  if(kind==='snitch')return [model('SET_PITCH','snitch',{scale:1.7,y:1.6})];
  if(kind==='potions')return [model('SET_CASTLE','classroom_desk',{scale:[1.2,1,1]}),
    model('SET_CASTLE','potion_1',{x:-.5,y:1.02,scale:1.3}),model('SET_CASTLE','potion_3',{y:1.02,scale:1.3}),model('SET_CASTLE','potion_5',{x:.5,y:1.02,scale:1.3})];
  if(kind==='book'||kind==='sign')return [model('SET_CASTLE','lectern',{state:kind})];
  if(kind==='letter')return [model('SET_HOUSE','dining_table',{scale:[.65,1,.65],state:'letter'})];
  // There is no standalone club mesh in the pack. The existing clear interaction prop remains.
  return [];
}

export function entityAssetPaths(e) {
  const states=[e,{...e,activated:true},{...e,visualState:'harvested'},{...e,visualState:'damaged',damageRatio:.5},{...e,visualState:'broken',damageRatio:1}];
  return [...new Set(states.flatMap(s=>modelSpecsForEntity(s).map(m=>m.path)))];
}
export const FLOOR_PACK = Object.freeze({coast:'SET_HOUSE',alley:'SET_ALLEY',train:'SET_TRAIN',castle:'SET_CASTLE',classroom:'SET_CASTLE',garden:'SET_GREENHOUSE',flight:'SET_PITCH',bathroom:'SET_CASTLE',library:'SET_CASTLE',forest:'SET_FOREST',puzzle:'SET_CASTLE',mirror:'SET_CASTLE'});

function disposeGltf(gltf) {
  const geometries=new Set(), materials=new Set(), textures=new Set();
  gltf.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)for(const m of [].concat(o.material)){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
  geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>{t.dispose();t.source?.data?.close?.();});
}

/** Owns only the current scene's source models plus the shared player; never game state. */
export class AssetModelLibrary {
  constructor() {this.loader=new GLTFLoader();this.entries=new Map();this.wanted=new Set();this.generation=0;this.disposed=false;}
  async prepare(paths,onProgress=()=>{}) {
    const generation=++this.generation;
    this.wanted=new Set([PLAYER_MODEL.path,...paths]);
    for(const [path,entry]of this.entries)if(!this.wanted.has(path)){entry.controller?.abort();if(entry.gltf)disposeGltf(entry.gltf);this.entries.delete(path);}
    const list=[...this.wanted],failed=[];let loaded=0;
    const queue=list.slice();
    const worker=async()=>{while(queue.length&&generation===this.generation&&!this.disposed){const path=queue.shift();try{await this.load(path);loaded++;}catch{failed.push(path);}if(generation===this.generation)onProgress({loaded,total:list.length,failed:[...failed]});}};
    await Promise.all(Array.from({length:Math.min(4,list.length)},worker));
    return {loaded,total:list.length,failed,stale:generation!==this.generation};
  }
  load(path) {
    if(this.entries.has(path))return this.entries.get(path).promise;
    const controller=new AbortController(),entry={controller,gltf:null,promise:null};
    this.entries.set(path,entry);
    entry.promise=(async()=>{
      const timeout=setTimeout(()=>controller.abort(),18000);
      try{
        const response=await fetch(new URL(`../${path}`,import.meta.url),{signal:controller.signal});
        if(!response.ok)throw new Error(`Model ${response.status}: ${path}`);
        const gltf=await this.loader.parseAsync(await response.arrayBuffer(),'');
        if(this.disposed||!this.wanted.has(path)||this.entries.get(path)!==entry){disposeGltf(gltf);throw new Error('Stale scene asset');}
        gltf.scene.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;
          for(const m of [].concat(o.material)){m.flatShading=true;for(const t of Object.values(m))if(t?.isTexture){t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;t.needsUpdate=true;}}
        });
        entry.gltf=gltf;return gltf;
      }catch(error){if(this.entries.get(path)===entry)this.entries.delete(path);throw error;}finally{clearTimeout(timeout);}
    })();
    return entry.promise;
  }
  has(path){return !!this.entries.get(path)?.gltf;}
  instantiate(spec) {
    const source=this.entries.get(spec.path)?.gltf;if(!source)return null;
    const root=cloneSkeleton(source.scene),holder=new THREE.Group();holder.add(root);
    holder.position.set(spec.x||0,spec.y||0,spec.z||0);holder.rotation.y=spec.rotation||0;
    if(Array.isArray(spec.scale))holder.scale.set(...spec.scale);else if(spec.scale)holder.scale.setScalar(spec.scale);
    holder.userData.assetPath=spec.path;holder.userData.assetRoot=root;
    holder.userData.animation=new ModelAnimation(root,source.animations);
    if(spec.animation)holder.userData.animation.play(spec.animation);
    return holder;
  }
  cancel(){this.generation++;for(const entry of this.entries.values())if(!entry.gltf)entry.controller?.abort();}
  dispose(){this.disposed=true;this.cancel();for(const entry of this.entries.values())if(entry.gltf)disposeGltf(entry.gltf);this.entries.clear();}
}

export class ModelAnimation {
  constructor(root,clips=[]) {this.root=root;this.mixer=new THREE.AnimationMixer(root);this.clips=new Map(clips.map(c=>[c.name,c]));this.current=null;this.key='';this.ownedMaterials=[];}
  play(name,{once=false,hold=false,speed=1,force=false}={}) {
    if(!this.clips.has(name))name=this.clips.has('idle')?'idle':this.clips.has('hover')?'hover':this.clips.has('fly')?'fly':null;
    if(!name)return;
    const key=`${name}:${once}:${hold}:${speed}`;if(this.key===key&&!force)return;
    const action=this.mixer.clipAction(this.clips.get(name));
    if(this.current&&this.current!==action)this.current.fadeOut(.1);
    action.paused=false;action.reset().setEffectiveTimeScale(speed).setEffectiveWeight(1).setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
    action.clampWhenFinished=once;action.fadeIn(.1).play();
    if(hold){action.time=this.clips.get(name).duration;action.paused=true;this.mixer.update(0);}
    this.current=action;this.key=key;
  }
  update(dt){this.mixer.update(dt);}
  dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.root);this.root.traverse(o=>o.skeleton?.dispose?.());this.ownedMaterials.forEach(m=>m.dispose());}
}

export function releaseModelInstance(object) {
  object.traverse(o=>o.userData.animation?.dispose());
}
