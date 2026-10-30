import * as THREE from '../vendor/three.module.js';
import { SoftwareRenderer } from './software-renderer.js';
import { AssetModelLibrary, PLAYER_MODEL, BROOM_MODEL, FLOOR_PACK, modelPath, entityAssetPaths, modelSpecsForEntity, releaseModelInstance } from './asset-models.js';
import { sceneEnvironmentPlacements } from './asset-environment.js';
import { AssetEffects } from './asset-effects.js';

const PALETTES = {
  coast: { floor: 0x5e625d, alternate: 0x66685f, wall: 0x555d62, trim: 0x8b8f85, fog: 0x132735, glow: 0xefc477, outdoor: true },
  alley: { floor: 0x625a56, alternate: 0x6c635c, wall: 0x65646d, trim: 0xc0a378, fog: 0x192431, glow: 0xe7b66d },
  train: { floor: 0x735345, alternate: 0x84604a, wall: 0x3d4853, trim: 0xc6a768, fog: 0x152331, glow: 0xf0b26a },
  castle: { floor: 0x717574, alternate: 0x7b7e79, wall: 0x747c7d, trim: 0xabb8b0, fog: 0x172b35, glow: 0xe7bf76 },
  classroom: { floor: 0x626d70, alternate: 0x747c7b, wall: 0x5f757c, trim: 0xa9b9af, fog: 0x142a36, glow: 0xf1c678 },
  garden: { floor: 0x596c51, alternate: 0x657553, wall: 0x5a6d61, trim: 0xa4aa78, fog: 0x1b3331, glow: 0xd7c77d, outdoor: true },
  flight: { floor: 0x476550, alternate: 0x4f7056, wall: 0x52685e, trim: 0xa2b090, fog: 0x18343b, glow: 0xdfc680, outdoor: true },
  bathroom: { floor: 0x667d79, alternate: 0x8b9790, wall: 0x5e7375, trim: 0xbac9ba, fog: 0x163039, glow: 0xe9c88b },
  library: { floor: 0x61646b, alternate: 0x6e7176, wall: 0x536270, trim: 0x97a7a7, fog: 0x122335, glow: 0xe1c991 },
  forest: { floor: 0x445a4e, alternate: 0x4a6252, wall: 0x3f574b, trim: 0x7f9472, fog: 0x102b2c, glow: 0x92d2bd, outdoor: true },
  puzzle: { floor: 0x687078, alternate: 0x7b8181, wall: 0x5f6d78, trim: 0xb1b7b1, fog: 0x152334, glow: 0xdfbd72 },
  mirror: { floor: 0x68737b, alternate: 0x7d8587, wall: 0x596e7a, trim: 0x9badb4, fog: 0x142434, glow: 0x8bc9d0 },
};

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const hex = (value, fallback = 0xd3b778) => {
  try { return new THREE.Color(value ?? fallback); } catch { return new THREE.Color(fallback); }
};
const hash = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

/** Presentation only. All coordinates, health, outcomes and timing belong to GameEngine. */
export class WorldRenderer {
  constructor(canvas) {
    if (!canvas) throw new Error('게임 화면을 만들 수 없습니다.');
    this.canvas = canvas;
    try {
      const context = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
      if (!context) throw new Error('WebGL2 unavailable');
      this.renderer = new THREE.WebGLRenderer({ canvas, context, antialias: false, alpha: false, powerPreference: 'high-performance' });
      this.mode = 'webgl';
    } catch {
      this.renderer = new SoftwareRenderer({ canvas });
      this.mode = 'software';
    }
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(640, 360, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-12, 12, 6.75, -6.75, 0.1, 150);
    this.camera.position.set(25, 29, 25);
    this.camera.lookAt(0, 0, 0);
    this.cameraTarget = new THREE.Vector3();
    this.cameraOffset = new THREE.Vector3(24, 29, 24);
    this.projectVector = new THREE.Vector3();
    this.geometries = new Map();
    this.materials = new Map();
    this.entities = new Map();
    this.projectiles = new Map();
    this.telegraphs = new Map();
    this.effects = new Map();
    this.candles = [];
    this.sceneData = null;
    this.previousPosition = null;
    this.elapsed = 0;
    this.quality = 'pixel';
    this.softwarePixelBudget=640*360;
    this.softwareWarmup=8;
    this.softwareSlowFrames=0;
    this.softwareLastFrame=0;
    this.modelLibrary=new AssetModelLibrary();
    this.assetFx=new AssetEffects();
    this.assetEpoch=0;this.assetVersion=0;this.assetStatus={state:'idle',loaded:0,total:0,failed:[]};
    this.assetsReady=Promise.resolve(this.assetStatus);
    this.dialogueSpeaker=null;this.castUntil=0;this.assetFloorTexture=null;this.assetFloorMaterial=null;
  }

  geometry(key, build) {
    if (!this.geometries.has(key)) this.geometries.set(key, build());
    return this.geometries.get(key);
  }

  material(color, { emissive = 0x000000, intensity = 0, opacity = 1, unlit = false, side = THREE.FrontSide } = {}) {
    const c = hex(color), e = hex(emissive);
    const key = `${c.getHex()}|${e.getHex()}|${intensity}|${opacity}|${unlit}|${side}`;
    if (!this.materials.has(key)) {
      const params = { color: c, transparent: opacity < 1, opacity, side, depthWrite: opacity >= 1 };
      this.materials.set(key, unlit ? new THREE.MeshBasicMaterial(params) : new THREE.MeshStandardMaterial({ ...params, flatShading: true, roughness: .88, metalness: .04, emissive: e, emissiveIntensity: intensity }));
    }
    return this.materials.get(key);
  }

  mesh(parent, geometry, color, x, y, z, scale = null, options = {}) {
    const m = new THREE.Mesh(geometry, this.material(color, options));
    m.position.set(x, y, z);
    if (scale) m.scale.set(...scale);
    m.castShadow = options.opacity === undefined || options.opacity >= 1;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  box(parent, color, x, y, z, w, h, d, options) {
    return this.mesh(parent, this.geometry('box', () => new THREE.BoxGeometry(1, 1, 1)), color, x, y, z, [w, h, d], options);
  }

  cylinder(parent, color, x, y, z, top, bottom, height, sides = 8, options) {
    const key = `cyl:${top}:${bottom}:${height}:${sides}`;
    return this.mesh(parent, this.geometry(key, () => new THREE.CylinderGeometry(top, bottom, height, sides)), color, x, y, z, null, options);
  }

  sphere(parent, color, x, y, z, radius, options) {
    return this.mesh(parent, this.geometry('sphere', () => new THREE.IcosahedronGeometry(1, 1)), color, x, y, z, [radius, radius, radius], options);
  }

  ring(parent, color, radius, thickness = .04, opacity = 1) {
    const key = `ring:${radius}:${thickness}`;
    const r = this.mesh(parent, this.geometry(key, () => new THREE.TorusGeometry(radius, thickness, 4, 48)), color, 0, .045, 0, null, { unlit: true, opacity });
    r.rotation.x = -Math.PI / 2;
    r.castShadow = false;
    return r;
  }

  loadScene(data) {
    this.clearScene();
    this.sceneData = data;
    this.palette = PALETTES[data.theme] || PALETTES.castle;
    const p = this.palette;
    this.scene.background = new THREE.Color(p.fog);
    this.scene.fog = new THREE.Fog(p.fog, 44, 86);
    this.static = new THREE.Group();
    this.dynamic = new THREE.Group();
    this.scene.add(this.static, this.dynamic);
    this.scene.add(new THREE.HemisphereLight(0xc0e1e7, 0x253543, 2.0));
    const sun = new THREE.DirectionalLight(0xffe3ac, 2.8);
    sun.position.set(-12, 32, 9);
    sun.target.position.set(data.width * .5, 0, data.depth * .5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 100 });
    sun.shadow.bias = -.0015;
    sun.shadow.normalBias = .05;
    this.scene.add(sun, sun.target);
    this.scene.add(new THREE.AmbientLight(0x628aab, .25));
    this.buildFloor(data);
    this.environmentFallback=new THREE.Group();this.static.add(this.environmentFallback);
    const floorRoot=this.static;this.static=this.environmentFallback;
    this.buildEnvironment(data);
    (data.blockers || []).forEach((b, i) => this.blocker(b, i));
    this.static=floorRoot;
    this.player = this.wizard('player');
    this.dynamic.add(this.player);
    this.player.position.set(data.spawn?.x ?? data.width / 2, 0, data.spawn?.z ?? data.depth / 2);
    this.guard = new THREE.Group();
    const guardBall = this.sphere(this.guard, 0x8ad8f0, 0, .95, 0, 1.12, { opacity: .12, unlit: true, side: THREE.DoubleSide });
    guardBall.material.depthWrite = false;
    this.ring(this.guard, 0xb5e8f5, .92, .035, .85);
    this.dynamic.add(this.guard);
    this.guard.visible = false;
    this.targetRing = new THREE.Group();
    this.ring(this.targetRing, 0xe8cc85, .85, .035, .9);
    this.dynamic.add(this.targetRing);
    this.targetRing.visible = false;
    if (data.exit) {
      this.exit = this.portal();
      this.exit.position.set(data.exit.x, 0, data.exit.z);
      this.static.add(this.exit);
    }
    this.cameraTarget.set(this.player.position.x, .65, this.player.position.z);
    this.previousPosition = this.player.position.clone();
    this.resize();
    this.updateCamera(1);
    this.elapsed = 0;
    this.scene.add(this.assetFx.group);
    this.assetsReady=this.loadSceneAssets(data);
  }

  async loadSceneAssets(data) {
    const epoch=this.assetEpoch;
    const placements=sceneEnvironmentPlacements(data).map(p=>({...p,path:modelPath(p.pack,p.file)}));
    const modelPaths=[PLAYER_MODEL.path,...data.entities.flatMap(entityAssetPaths),...placements.map(p=>p.path)];
    if(data.theme==='flight')modelPaths.push(BROOM_MODEL.path);
    const total=new Set(modelPaths).size;
    this.assetStatus={state:'loading',loaded:0,total,failed:[]};
    const progress=status=>{if(this.assetEpoch===epoch)this.assetStatus={state:'loading',...status};};
    const texturePath=`assets/packs/${FLOOR_PACK[data.theme]||'SET_CASTLE'}/v1/floor_tile_16.png`;
    const floorPromise=new Promise(resolve=>{
      let finished=false;
      const timeout=setTimeout(()=>{finished=true;resolve({failed:texturePath});},12000);
      new THREE.TextureLoader().load(new URL(`../${texturePath}`,import.meta.url).href,texture=>{
        clearTimeout(timeout);if(finished||this.assetEpoch!==epoch){texture.dispose();resolve({});return;}
        finished=true;texture.magFilter=THREE.NearestFilter;texture.minFilter=THREE.NearestFilter;texture.generateMipmaps=false;
        texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
        this.assetFloorTexture=texture;
        const surface=this.floorSurface;
        if(surface){
          const material=surface.material.clone();material.color.set(0xffffff);material.map=texture;material.needsUpdate=true;
          surface.material=material;this.assetFloorMaterial=material;
          if(surface.isInstancedMesh){for(let i=0;i<surface.count;i++)surface.setColorAt(i,new THREE.Color(.9,.9,.9));surface.instanceColor.needsUpdate=true;}
        }
        resolve({});
      },undefined,()=>{clearTimeout(timeout);finished=true;resolve({failed:texturePath});});
    });
    if(!this.typingPosesReady||this.typingPosesError)this.typingPosesReady=(async()=>{
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);this.typingPosesError=false;
      try{const response=await fetch(new URL('../assets/packs/CHR_POSE26/v1/typing_poses.json',import.meta.url),{signal:controller.signal});if(!response.ok)throw new Error('Typing pose load failed');this.typingPoses=await response.json();}
      catch{this.typingPosesError=true;}
      finally{clearTimeout(timeout);}
    })();
    const [models,floor]=await Promise.all([this.modelLibrary.prepare(modelPaths,progress),floorPromise,this.assetFx.setScene(data),this.typingPosesReady]);
    if(this.assetEpoch!==epoch||models.stale||this.disposed)return {...models,stale:true};
    this.assetVersion++;
    const player=this.modelLibrary.instantiate(PLAYER_MODEL);
    if(player){
      player.position.copy(this.player.position);player.quaternion.copy(this.player.quaternion);
      releaseModelInstance(this.player);this.dynamic.remove(this.player);this.player=player;this.dynamic.add(player);
      player.userData.boneRest=new Map();player.traverse(o=>{if(o.isBone)player.userData.boneRest.set(o.name,o.quaternion.clone());});
      if(data.theme==='flight'){
        const broom=this.modelLibrary.instantiate(BROOM_MODEL);
        if(broom){broom.position.set(0,.55,0);player.add(broom);player.userData.broom=broom;}
      }
    }
    // Swap the environmental set atomically, so a missing module never opens an invisible wall.
    if(placements.every(p=>this.modelLibrary.has(p.path))){
      this.environmentFallback.removeFromParent();this.assetEnvironment=new THREE.Group();this.static.add(this.assetEnvironment);
      for(const spec of placements){
        const instance=this.modelLibrary.instantiate(spec);this.assetEnvironment.add(instance);
        if(spec.animation)instance.userData.animation.play(spec.animation);
      }
      if(data.theme==='coast')this.box(this.static,0x275d71,data.width/2,-1.7,data.depth/2,data.width+70,.05,data.depth+70,{unlit:true});
    }
    const failed=[...models.failed,...(floor.failed?[floor.failed]:[]),...[...this.assetFx.failed].map(key=>`effect:${key}`),...(this.typingPosesError?['assets/packs/CHR_POSE26/v1/typing_poses.json']:[])];
    this.assetStatus={state:failed.length?(models.loaded?'partial':'fallback'):'ready',loaded:models.loaded,total:models.total,failed};
    return this.assetStatus;
  }

  authoredEntityModel(entity) {
    const specs=modelSpecsForEntity(entity);
    if(!specs.length||!specs.every(spec=>this.modelLibrary.has(spec.path)))return null;
    const group=new THREE.Group();
    for(const spec of specs){
      const instance=this.modelLibrary.instantiate(spec);group.add(instance);
      const root=instance.userData.assetRoot,animation=instance.userData.animation;
      const ownMaterial=(object,edit)=>{if(!object?.isMesh)return;object.material=object.material.clone();animation.ownedMaterials.push(object.material);edit(object.material);};
      if(spec.state==='open')animation.play('open',{once:true,hold:true});
      if(spec.state==='burn')animation.play('burn',{once:true,hold:true});
      if(spec.state==='levitated')for(const name of ['feather','feather_quill']){const part=root.getObjectByName(name);if(part){part.position.y+=.8;group.userData.floatingParts ||= [];group.userData.floatingParts.push({part,y:part.position.y});}}
      if(spec.state==='disabled'){
        root.traverse(o=>{if(o.isMesh){ownMaterial(o,m=>{m.color.multiplyScalar(.45);m.emissive?.set(0);});if(o.name==='crystal')o.scale.setScalar(.45);}});
      }
      if(spec.state==='lit'||spec.state==='unlit'){
        const lantern=root.getObjectByName('lantern');ownMaterial(lantern,m=>{m.color.multiplyScalar(spec.state==='lit'?1.15:.35);m.emissive?.set(spec.state==='lit'?0xffbe65:0);m.emissiveIntensity=spec.state==='lit'?.7:0;});
      }
      if(spec.state==='letter'){
        const paper=this.box(group,0xe9dfc0,0,1.005,0,.62,.035,.43);paper.rotation.y=-.12;
        this.box(group,0x9f4744,.08,1.03,.02,.11,.02,.1);
      }
    }
    if(entity.type==='npc'){
      const box=new THREE.Box3().setFromObject(group),height=box.max.y;
      const marker=this.sphere(group,0xf0cc7e,0,height+.25,0,.09,{unlit:true});
      group.userData.marker=marker;group.userData.markerHeight=height+.25;
    }
    if(!['enemy','boss','npc','ring'].includes(entity.type))this.ring(group,entity.color||0xb9c693,.7,.018,.35);
    group.userData.entityId=entity.id;group.userData.authored=true;group.userData.visualSignature=this.entityVisualSignature(entity);
    return group;
  }

  setDialogueSpeaker(speaker){this.dialogueSpeaker=speaker||null;}
  setCastFeedback(){this.castUntil=this.elapsed+.65;}
  setTypingInput(value){this.typingLetter=/[a-z]$/i.test(value||'')?value.at(-1).toLowerCase():null;}

  animatePlayer(p,speed,dt,flying){
    const animation=this.player.userData.animation;if(!animation)return;
    const casting=this.elapsed<this.castUntil;
    if(Number.isFinite(this.player.userData.lastHp)&&p.hp<this.player.userData.lastHp)this.player.userData.hitUntil=this.elapsed+.45;
    this.player.userData.lastHp=p.hp;
    const hit=this.elapsed<(this.player.userData.hitUntil||0);
    const talking=this.dialogueSpeaker==='해리';
    animation.play(p.hp<=0?'down':hit?'hit':p.guarding?'guard':casting?'cast':talking?'talk':flying?'idle':speed>.2?'run':'idle',{once:p.hp<=0||casting||hit,speed:1});
    animation.update(dt);
    // Supplied letter poses affect the upper body only. Guard and cast retain priority.
    const blockedPose=p.guarding||casting||hit||p.hp<=0;
    const pose=!blockedPose&&this.typingPoses?.letters?.[this.typingLetter];
    const blends=this.player.userData.typingBlend ||= new Map();
    if(blockedPose)blends.clear();
    else for(const name of ['upper_arm_r','forearm_r','hand_r']){
      const bone=this.player.getObjectByName(name),rest=this.player.userData.boneRest?.get(name),angles=pose?.[name]?.rotationEulerXYZ;
      if(!bone||!rest||(!angles&&!blends.has(name)))continue;
      const target=angles?rest.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(...angles))):bone.quaternion.clone();
      const blend=blends.get(name)||bone.quaternion.clone();blend.slerp(target,1-Math.exp(-dt/.08));bone.quaternion.copy(blend);blends.set(name,blend);
      if(!angles&&blend.angleTo(target)<.002)blends.delete(name);
    }
    const broom=this.player.userData.broom;
    if(broom){broom.userData.animation.play(speed>.2?'accelerate':'landing',{once:speed<=.2,hold:speed<=.2});broom.userData.animation.update(dt);}
  }

  animateEntity(object,e,dt,time,telegraph){
    if(!object.userData.authored)return;
    const old=object.userData.lastXZ,moving=old&&Math.hypot(e.x-old.x,e.z-old.z)>.001;
    object.userData.lastXZ={x:e.x,z:e.z};
    let clip=null,once=false,speed=1;
    if(e.type==='npc')clip=this.dialogueSpeaker&&(e.name?.includes(this.dialogueSpeaker)||this.dialogueSpeaker.includes(e.name))?'talk':'idle';
    if(e.type==='enemy'||e.type==='boss'){
      if(e.hp<=0){clip=e.kind==='spider'?'exit':'down';once=true;}
      else if(e.attackState==='stunned'){clip=e.kind==='troll'?'stun':'hit';}
      else if(e.hitUntil>time){clip=e.kind==='spider'?'stagger':'hit';once=true;}
      else if(e.attackState==='windup'){
        object.userData.attackKind=telegraph?.kind||'bolt';
        clip=e.kind==='troll'?(e.attackPattern==='sweep'?'sweep':e.attackPattern==='charge'?'run':'slam'):e.kind==='quirrell'?(telegraph?.kind==='fire'?'telegraph_ring':telegraph?.kind==='charge'?'telegraph_charge':'telegraph_orb'):'bite';
        once=true;
      }
      else if(e.attackState==='recover'){clip=e.kind==='spider'?'bite':e.kind==='troll'?'collision':e.kind==='quirrell'?({fire:'cast_ring',shadow:'cast_shadow',charge:'cast_charge'}[object.userData.attackKind]||'cast_orb'):'cast';once=true;}
      else clip=moving?(e.kind==='spider'?'move':'walk'):'idle';
    }
    object.traverse(o=>{const a=o.userData.animation;if(a){if(clip){speed=telegraph&&a.clips.has(clip)?a.clips.get(clip).duration/Math.max(.1,telegraph.duration):1;a.play(clip,{once,speed});}else if(e.kind==='vines'&&!e.activated)a.play('idle');a.update(dt);}});
    if(object.userData.floatingParts)for(const {part,y} of object.userData.floatingParts)part.position.y=y+Math.sin(time*2)*.12;
    if(object.userData.marker)object.userData.marker.position.y=object.userData.markerHeight+Math.sin(time*2+e.x)*.1;
  }

  floorContains(x, z) {
    const data = this.sceneData;
    if (data.layout?.boundary === 'ellipse') return ((x-data.width/2)/(data.width/2))**2 + ((z-data.depth/2)/(data.depth/2))**2 <= 1;
    return this.floorRegions.some(r => x >= r.x-r.w/2-.001 && x <= r.x+r.w/2+.001 && z >= r.z-r.d/2-.001 && z <= r.z+r.d/2+.001);
  }

  buildFloor(data) {
    const { width: w, depth: d } = data, p = this.palette, theme = data.theme;
    this.floorRegions = data.layout?.floorRegions?.length ? data.layout.floorRegions : [{x:w/2,z:d/2,w,d}];
    this.floorEdges = [];
    const natural = ['garden','forest','flight'].includes(theme), timber = ['coast','train'].includes(theme);
    const foundation = natural ? 0x283b32 : theme==='train' ? 0x2b3038 : 0x273e48;
    if (data.layout?.boundary === 'ellipse') {
      const base=this.cylinder(this.static,foundation,w/2,-.65,d/2,w/2,w/2,1.25,64);base.scale.z=d/w;
      const floor=this.cylinder(this.static,p.floor,w/2,-.06,d/2,w/2,w/2,.12,64);floor.scale.z=d/w;this.floorSurface=floor;
      for(const radius of [w*.17,w*.31,w*.475]) {
        const ring=this.ring(this.static,radius===w*.475?p.trim:0x9aa99d,radius,.035,.65);ring.position.set(w/2,.028,d/2);ring.scale.y=d/w;
      }
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6, line=this.box(this.static,0x8b9691,w/2+Math.sin(a)*w*.32,.024,d/2+Math.cos(a)*d*.32,.035,.008,w*.29);
        line.rotation.y=a;
      }
      return;
    }
    for(const r of this.floorRegions) this.box(this.static,foundation,r.x,-.62,r.z,r.w,1.2,r.d);
    // Partition at region boundaries so linked rooms retain their exact silhouette.
    const xs=new Set([0,w]),zs=new Set([0,d]),stepX=timber?3:2,stepZ=timber?.8:2;
    for(let x=0;x<w;x+=stepX)xs.add(x);for(let z=0;z<d;z+=stepZ)zs.add(z);
    for(const r of this.floorRegions){xs.add(r.x-r.w/2);xs.add(r.x+r.w/2);zs.add(r.z-r.d/2);zs.add(r.z+r.d/2);}
    const xx=[...xs].sort((a,b)=>a-b),zz=[...zs].sort((a,b)=>a-b),cells=[];
    for(let i=0;i<xx.length-1;i++)for(let j=0;j<zz.length-1;j++){
      const x=(xx[i]+xx[i+1])/2,z=(zz[j]+zz[j+1])/2;
      if(this.floorContains(x,z))cells.push({x,z,w:xx[i+1]-xx[i],d:zz[j+1]-zz[j],i,j});
    }
    const geo=this.geometry('floorTile',()=>new THREE.BoxGeometry(1,.10,1));
    const tiles=new THREE.InstancedMesh(geo,this.material(0xffffff),cells.length);tiles.receiveShadow=true;
    const matrix=new THREE.Matrix4(),colorA=new THREE.Color(timber?theme==='train'?0x886447:0x756957:p.floor),colorB=new THREE.Color(timber?theme==='train'?0x78523d:0x665f50:p.alternate);
    cells.forEach((cell,index)=>{
      matrix.makeScale(Math.max(.03,cell.w-.025),1,Math.max(.03,cell.d-.025));matrix.setPosition(cell.x,-.05,cell.z);tiles.setMatrixAt(index,matrix);
      const alternate=natural?(theme==='flight'?Math.floor(cell.x/5)%2:hash(index+23)>.55):(cell.i+cell.j)%2;
      const color=(alternate?colorB:colorA).clone().multiplyScalar(.94+hash(index+12)*.1);tiles.setColorAt(index,color);
    });
    this.static.add(tiles);this.floorSurface=tiles;
    // Border only the outside of the union, leaving room connections completely open.
    for(const r of this.floorRegions) for(const axis of ['x','z']) for(const side of [-1,1]) {
      const span=axis==='x'?r.d:r.w,steps=Math.ceil(span/2),length=span/steps;
      for(let i=0;i<steps;i++){
        const x=axis==='x'?r.x+side*r.w/2:r.x-r.w/2+(i+.5)*length;
        const z=axis==='z'?r.z+side*r.d/2:r.z-r.d/2+(i+.5)*length;
        if(this.floorContains(x+(axis==='x'?side*.08:0),z+(axis==='z'?side*.08:0)))continue;
        const edge={x,z,w:axis==='x'?.14:length,d:axis==='z'?.14:length,axis,side};this.floorEdges.push(edge);
        this.box(this.static,natural?0x536b4a:p.trim,x,.035,z,edge.w,.15,edge.d);
      }
    }
    if(theme==='train'){
      for(let x=3;x<w;x+=7)for(const z of[-.4,d+.4]){
        const wheel=this.cylinder(this.static,0x1c2932,x,-.9,z,.65,.65,.35,10);wheel.rotation.x=Math.PI/2;
      }
      for(const z of[-.15,d+.15])this.box(this.static,0x8c805f,w/2,-1.35,z,w+8,.15,.16);
    }else if(!natural){
      for(let i=0;i<8;i++){
        const r=this.floorRegions[i%this.floorRegions.length],height=1.2+hash(i)*1.8;
        this.cylinder(this.static,0x1e343f,r.x+(hash(i+44)-.5)*(r.w-1),-1.25-height/2,r.z+(hash(i+71)-.5)*(r.d-1),.9,.12,height,5);
      }
    }
  }

  buildEnvironment(data) {
    const w=data.width,d=data.depth,p=this.palette,theme=data.theme,regions=data.layout?.floorRegions;
    if(theme==='mirror'){
      // Round chamber: a broken ring of columns instead of another square room.
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6,x=w/2+Math.sin(a)*(w/2+.35),z=d/2+Math.cos(a)*(d/2+.35);
        this.pillar(x,z,i>3&&i<9?4.8:2.2);
      }
      const centre=new THREE.Group();centre.position.set(w/2,.035,d/2);this.ring(centre,0x859bac,2.8,.035,.7);this.static.add(centre);
    }else if(p.outdoor){
      if(theme==='coast'){
        this.box(this.static,0x275d71,w/2,-1.7,d/2,w+70,.05,d+70,{unlit:true});
        for(let i=0;i<12;i++){
          const x=hash(i+50)*(w+20)-10,z=hash(i+80)*(d+20)-10;
          if(this.floorContains(x,z))continue;
          const rock=this.sphere(this.static,0x526471,x,-.8,z,1+hash(i)*1.5);rock.scale.y*=.8;
          this.box(this.static,0x6996a0,x,-1.61,z+2,3+hash(i+8)*4,.015,.08,{unlit:true,opacity:.4});
        }
        for(const z of[-.35,d+.35])this.box(this.static,0x6f6554,w/2,z<0?1.1:.1,z,w+.5,z<0?2.2:.2,.35);
        this.box(this.static,0x504d46,-.35,1.1,d/2,.35,2.2,d);
        for(const x of[1,w-1])this.box(this.static,0x4c4034,x,2.3,-.4,.24,4.6,.3);
        this.box(this.static,0x423b32,w/2,3.8,-.4,w,.3,.35);
        this.window(w*.42,-.12,false);this.candle(1.2,.25,d-1.2);
      }else{
        const edges=this.floorEdges;
        for(let i=0;i<edges.length;i+=theme==='forest'?3:6){
          const e=edges[i],x=e.x+(e.axis==='x'?e.side*1.1:0),z=e.z+(e.axis==='z'?e.side*1.1:0);
          this.tree(x,z,theme==='forest',hash(i+33));
        }
        if(theme==='forest'){
          // Roots and undergrowth follow the actual path edge, not a rectangular box.
          for(let i=1;i<edges.length;i+=4){const e=edges[i];const root=this.box(this.static,0x4c4738,e.x,.08,e.z,1.3,.16,.24);root.rotation.y=hash(i)*3.14;}
        }
        if(theme==='flight'){
          for(let x=4;x<w;x+=10){this.flag(x,-.8,0xc8a050);this.flag(x,d+.8,0x587e94);}
          for(let x=8;x<w-2;x+=14){const ring=this.ring(this.static,0x96ac85,4,.025,.4);ring.position.set(x,.028,d/2);}
        }
        if(theme==='garden'){
          for(let i=0;i<edges.length;i+=5){
            const e=edges[i],x=e.x+(e.axis==='x'?e.side*.6:0),z=e.z+(e.axis==='z'?e.side*.6:0);
            this.box(this.static,0x6c503b,x,.22,z,e.axis==='x'?.7:1.8,.44,e.axis==='z'?.7:1.8);
            for(let k=0;k<3;k++)this.plant(this.static,x+(e.axis==='z'?(k-1)*.5:0),.5,z+(e.axis==='x'?(k-1)*.5:0),0x79a86a);
          }
          // Thin glasshouse frame on the back edge stays out of the walkable route.
          for(let x=5;x<w;x+=8){this.box(this.static,0x88a398,x,2.2,-.45,.12,4.4,.12);this.box(this.static,0x88a398,x,4.4,-2, .12,.12,3.2);}
        }
      }
    }else if(theme==='alley'){
      for(let x=3;x<w;x+=6){
        this.house(x,-1.6,[0x55736e,0x5c5874,0x7c644b][Math.floor(x/6)%3]);
        this.box(this.static,0x8b514b,x,2.9,.05,2.5,.18,1.25);
        this.box(this.static,0x384c51,x,.4,d+.5,3,.8,1);
        this.candle(x,1,d+.6);
      }
      for(let x=5;x<w;x+=10){this.flag(x,-.6,0x52766c);this.box(this.static,0xb9975f,x,3.7,1.2,1.5,.7,.13);}
    }else if(theme==='train'){
      this.box(this.static,0x5b3437,w/2,1.35,-.4,w,2.7,.45);
      this.box(this.static,0x9a6b4b,w/2,2.75,-.4,w,.15,.55);
      for(let x=3;x<w-1;x+=5){
        this.window(x,-.12,false);
        for(const z of[.5,d-.5]){
          this.box(this.static,0x7b4247,x,.5,z,2.8,.6,.85);
          this.box(this.static,0x945354,x,.95,z+(z<d/2?-.28:.28),2.8,.9,.22);
        }
        this.box(this.static,0x725b43,x,2.9,-.08,3.8,.16,.8);
      }
      this.rug(w/2,d/2,w-2,1.8,0x75464a);
    }else{
      if(regions?.length){
        for(const e of this.floorEdges)if(e.side<0){this.box(this.static,p.wall,e.x,1.2,e.z,e.w+.15,2.4,e.d+.15);this.box(this.static,p.trim,e.x,2.43,e.z,e.w+.2,.12,e.d+.2);}
      }else{
        this.box(this.static,p.wall,w/2,1.65,-.35,w+.6,3.3,.65);
        this.box(this.static,p.wall,-.35,1.65,d/2,.65,3.3,d+.6);
        for(let x=4;x<w;x+=6)this.window(x,.03,false);
        for(let z=4;z<d;z+=6)this.window(.03,z,true);
      }
      for(let i=0;i<this.floorEdges.length;i+=12){const e=this.floorEdges[i];this.candle(e.x,.22,e.z);}
      if(theme==='classroom'||theme==='library'){
        for(let z=3;z<d-1;z+=5)this.bookshelf(.7,z,theme==='library'?3.3:2);
        this.flag(w+.3,2,0x8b4648);this.flag(w+.3,d-2,0x4d677f);
        if(theme==='classroom')this.rug(w/2,d/2,5.5,Math.min(13,d-4),0x3f5d68);
        else{this.rug(w/2,d/2,3,d-4,0x5c495f);for(let x=5;x<w;x+=6)this.candle(x,3,-.1);}
      }
      if(theme==='bathroom'){
        for(let z=3;z<d-1;z+=5){
          this.box(this.static,0xb6c5bf,w-.55,.85,z,1.1,.25,1.25);
          this.cylinder(this.static,0x9eafa9,w-.55,.4,z,.25,.42,.7);
          this.box(this.static,0x568b91,w-.1,1.9,z,.06,1.45,1.3,{emissive:0x1e4b58,intensity:.3});
        }
        // Existing damaged tiles and water offer a clear arena identity.
        for(let i=0;i<12;i++){const x=3+hash(i+4)*(w-6),z=3+hash(i+20)*(d-6);const tile=this.box(this.static,0x9ba9a4,x,.03,z,.4,.06,.7);tile.rotation.y=hash(i)*4;}
      }
    }
    this.ambientParticles(data);
  }

  pillar(x, z, height) {
    const p = this.palette;
    this.box(this.static, p.trim, x, .18, z, 1.2, .35, 1.2);
    this.cylinder(this.static, p.wall, x, height / 2 + .25, z, .4, .5, height, 8);
    this.box(this.static, p.trim, x, height + .4, z, 1.2, .35, 1.2);
    this.candle(x, height + .6, z);
  }

  window(x, z, rotate) {
    const g = new THREE.Group(); g.position.set(x, 2.1, z); if (rotate) g.rotation.y = Math.PI / 2;
    const glass = this.box(g, 0x73b4bf, 0, 0, 0, 1.4, 1.9, .08, { emissive: 0x4598ad, intensity: .7 });
    this.box(g, 0x3a505a, 0, 0, .08, .08, 2.05, .12);
    this.box(g, 0x3a505a, 0, .1, .08, 1.5, .1, .12);
    this.box(g, this.palette.trim, -.82, -.05, .06, .18, 2.2, .2);
    this.box(g, this.palette.trim, .82, -.05, .06, .18, 2.2, .2);
    this.box(g, this.palette.trim, 0, -1.1, .06, 1.9, .2, .4);
    const top = this.mesh(g, this.geometry('windowArch', () => new THREE.TorusGeometry(.82, .12, 4, 14, Math.PI)), this.palette.trim, 0, 1, .1);
    const fill = this.mesh(g, this.geometry('windowTop', () => new THREE.CircleGeometry(.75, 16, 0, Math.PI)), 0x78bdc1, 0, 1, .03, null, { emissive: 0x4598ad, intensity: .8, side: THREE.DoubleSide });
    glass.castShadow = false; fill.castShadow = false; top.castShadow = false;
    this.static.add(g);
  }

  candle(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    this.cylinder(g, 0x665c44, 0, .1, 0, .22, .3, .2);
    this.cylinder(g, 0xe6d3aa, 0, .39, 0, .1, .11, .45);
    const flame = this.sphere(g, 0xffcf71, 0, .75, 0, .12, { unlit: true }); flame.scale.y = .204;
    this.static.add(g); this.candles.push(flame);
  }

  flag(x, z, color) {
    this.cylinder(this.static, 0x9b865d, x, 2.2, z, .045, .065, 4.4, 5);
    this.box(this.static, 0xa88e57, x + .5, 4.2, z, 1.15, .07, .07);
    this.box(this.static, color, x + .5, 3.35, z, .95, 1.65, .055);
    this.box(this.static, 0xd0ae65, x + .5, 3.4, z + .035, .17, .85, .02);
  }

  rug(x, z, w, d, color) {
    this.box(this.static, 0xb49760, x, .022, z, w, .012, d);
    this.box(this.static, color, x, .034, z, w - .35, .008, d - .35);
    for (let i = -2; i <= 2; i++) this.box(this.static, 0xa4916b, x + i * w / 6, .044, z, .025, .002, d - .7);
  }

  tree(x, z, bare, seed) {
    const g = new THREE.Group(), h = 2.8 + seed * 2.2; g.position.set(x, 0, z);
    this.cylinder(g, 0x4b4740, 0, h / 2, 0, .13, .3, h, 5);
    for (let k = 0; k < 3; k++) {
      const a = k * 2.1 + seed, branch = this.cylinder(g, 0x4b4740, Math.sin(a) * .4, h * .68, Math.cos(a) * .4, .04, .12, 1.6, 5);
      branch.rotation.z = Math.sin(a) * .7; branch.rotation.x = Math.cos(a) * .7;
    }
    if (!bare) for (let k = 0; k < 3; k++) this.cylinder(g, [0x365d4f, 0x416c57, 0x4b765d][k], 0, h - .9 + k * .65, 0, 0, 1.25 - k * .22, 1.8, 6);
    this.static.add(g);
  }

  house(x, z, color) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    this.box(g, color, 0, 2, 0, 3.4, 4, 2.5);
    const roof = this.cylinder(g, 0x343e4c, 0, 4.6, 0, 0, 2.55, 2.3, 4); roof.rotation.y = Math.PI / 4; roof.scale.z = .75;
    this.box(g, 0x2e3a43, 0, 1.1, 1.3, 1, 2.2, .1);
    for (const off of [-1, 1]) this.box(g, 0xe2b76d, off, 2.7, 1.28, .65, .9, .1, { emissive: 0xbc8c42, intensity: .8 });
    this.static.add(g);
  }

  bookshelf(x, z, height = 2.7) {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    this.box(g, 0x4b3e35, 0, height / 2, 0, .9, height, 2.1);
    for (let y = .4; y < height; y += .65) {
      this.box(g, 0x9b8058, .52, y, 0, .13, .09, 2.2);
      for (let i = 0; i < 7; i++) this.box(g, [0x7b5250, 0x63817b, 0x9f956d, 0x526a87][i % 4], .52, y + .25, -.9 + i * .27, .3, .4 + hash(i + y) * .12, .18);
    }
    this.static.add(g);
  }

  plant(parent, x, y, z, color = 0x69a774) {
    this.cylinder(parent, 0x966c4d, x, y, z, .28, .19, .42, 6);
    const leaf = this.sphere(parent, color, x, y + .45, z, .38); leaf.scale.multiply(new THREE.Vector3(.8, 1.4, .8));
  }

  blocker(b, index) {
    const p = this.palette, theme = this.sceneData.theme;
    const x = b.x, z = b.z, w = b.w || 1, d = b.d || 1;
    if(theme==='forest'){
      this.box(this.static,0x3f5142,x,.18,z,w,.36,d);
      for(let i=0;i<4;i++){
        const rock=this.sphere(this.static,[0x59675c,0x657366][i%2],x+(i%2?1:-1)*w*.23,.5,z+(i>1?1:-1)*d*.23,1);
        rock.scale.set(w*.27,.55+hash(i+index)*.35,d*.27);rock.rotation.y=i;
      }
    }else if(theme==='garden'){
      this.box(this.static,0x705239,x,.38,z,w,.76,d);
      this.box(this.static,0x443e2b,x,.79,z,Math.max(.2,w-.22),.06,Math.max(.2,d-.22));
      const count=Math.max(2,Math.floor(Math.max(w,d)/1.3));
      for(let i=0;i<count;i++)this.plant(this.static,x+(w>d?(i-(count-1)/2)*w/count:0),.92,z+(d>=w?(i-(count-1)/2)*d/count:0),0x71965b);
    }else if(theme==='alley'){
      this.box(this.static,0x6e5844,x,.55,z,w,1.1,d);
      this.box(this.static,0x9c815b,x,1.14,z,w+.08,.14,d+.08);
      for(let i=0;i<3;i++)this.box(this.static,[0x806d49,0x5c7a70,0x92614e][i],x+(i-1)*w*.25,1.34,z,Math.min(.6,w*.2),.3,Math.min(.7,d*.5));
    }else if (['classroom', 'library', 'train'].includes(theme)) {
      this.box(this.static, 0x79614b, x, .95, z, w, .22, d);
      for (const dx of [-1, 1]) for (const dz of [-1, 1]) this.box(this.static, 0x514439, x + dx * (w / 2 - .16), .46, z + dz * (d / 2 - .16), .16, .92, .16);
      this.box(this.static, 0x496c76, x - w * .2, 1.12, z, Math.min(.6, w * .4), .1, Math.min(.75, d * .6));
      this.candle(x + w * .25, 1.08, z);
    } else {
      this.box(this.static, p.wall, x, .65, z, w, 1.3, d);
      this.box(this.static, p.trim, x, 1.35, z, w + .08, .12, d + .08);
      if (index % 2 === 0 && w > 1) this.candle(x, 1.45, z);
    }
  }

  wizard(kind = 'npc', color = null) {
    const g = new THREE.Group();
    const isPlayer = kind === 'player', isBoss = kind === 'boss';
    const robe = color || (isPlayer ? 0x172a3d : isBoss ? 0x56416d : 0x385f67);
    this.cylinder(g, robe, 0, .65, 0, .29, .46, 1.1, 6);
    this.box(g, 0x151e29, -.15, .13, .06, .18, .23, .32);
    this.box(g, 0x151e29, .15, .13, .06, .18, .23, .32);
    this.box(g, isPlayer ? 0x9c4a47 : 0xc6aa73, .03, 1.02, .29, .14, .65, .06);
    if (isPlayer) this.box(g, 0xd8b45f, .03, .8, .325, .145, .1, .01);
    this.sphere(g, 0xe1bc98, 0, 1.48, 0, .3);
    this.sphere(g, isBoss ? 0x746488 : 0x302c2c, 0, 1.67, -.025, .31).scale.y = .62;
    if (isBoss) {
      this.cylinder(g, 0x65557d, 0, 1.76, 0, .24, .33, .22, 8);
      this.sphere(g, 0xc9a76d, 0, 1.77, .29, .08);
    }
    this.box(g, robe, -.38, .97, .04, .22, .58, .26).rotation.z = -.2;
    const arm = new THREE.Group(); arm.position.set(.34, 1.16, .05);
    this.box(arm, robe, 0, -.2, .09, .23, .47, .25).rotation.x = -.45;
    this.sphere(arm, 0xe1bc98, .01, -.35, .28, .1);
    const wand = this.cylinder(arm, 0x9f7650, .015, -.23, .6, .025, .04, .65, 5); wand.rotation.x = Math.PI / 2;
    const tip = this.sphere(arm, 0x9ad9e7, .015, -.23, .94, .055, { unlit: true });
    g.add(arm); g.userData.arm = arm; g.userData.tip = tip;
    if (isPlayer) {
      // Round spectacles and tiny bridge, facing +Z.
      for (const x of [-.12, .12]) {
        const frame = this.mesh(g, this.geometry('glasses', () => new THREE.TorusGeometry(.09, .015, 4, 8)), 0x182536, x, 1.49, .276);
        frame.castShadow = false;
      }
      this.box(g, 0x182536, 0, 1.49, .28, .08, .02, .02);
    }
    const shadow = this.mesh(g, this.geometry('shadow', () => new THREE.CircleGeometry(.48, 20)), 0x0b1820, 0, .06, 0, null, { opacity: .25, unlit: true });
    shadow.rotation.x = -Math.PI / 2; shadow.castShadow = false;
    return g;
  }

  troll() {
    const g = new THREE.Group();
    this.sphere(g, 0x83928a, 0, 1.5, 0, 1.04).scale.set(.85, 1.12, .75);
    this.cylinder(g, 0x66574b, 0, .73, 0, .73, .85, .65, 7);
    for (const x of [-.43, .43]) {
      this.cylinder(g, 0x7b8b82, x, .42, .05, .29, .35, .85, 6);
      this.box(g, 0x5b6c64, x, .12, .24, .52, .24, .7);
      const arm = this.cylinder(g, 0x7b8b82, x * 2.05, 1.45, .1, .31, .25, 1.45, 6); arm.rotation.z = x > 0 ? -.3 : .3;
    }
    this.sphere(g, 0x95a196, 0, 2.7, .1, .55);
    this.box(g, 0x93a397, 0, 2.56, .57, .27, .3, .28);
    this.box(g, 0x27352f, -.2, 2.78, .54, .12, .08, .03);
    this.box(g, 0x27352f, .2, 2.78, .54, .12, .08, .03);
    const club = new THREE.Group(); club.position.set(1.24, .7, .5); club.rotation.x = -.4;
    this.cylinder(club, 0x634a35, 0, .65, 0, .12, .17, 1.4, 6);
    this.cylinder(club, 0x795b3e, 0, 1.65, 0, .3, .4, 1.1, 6); g.add(club);
    g.userData.club = club;
    return g;
  }

  enemy(entity) {
    if (/troll|트롤|MB1/i.test(`${entity.kind} ${entity.name} ${entity.id}`)) return this.troll();
    if (entity.type === 'boss' || /quirrell|퀴렐/.test(`${entity.kind} ${entity.name}`)) return this.wizard('boss');
    const g = new THREE.Group();
    if (/spider|거미/i.test(`${entity.kind} ${entity.name}`)) {
      this.sphere(g, 0x473a3c, 0, .4, 0, .5).scale.z = 1.3;
      this.sphere(g, 0x302c35, 0, .38, .55, .3);
      for (let i = 0; i < 8; i++) {
        const a = i / 8 * Math.PI * 2;
        const leg = this.cylinder(g, 0x594b48, Math.sin(a) * .55, .25, Math.cos(a) * .55, .045, .06, .9, 4);
        leg.rotation.z = Math.sin(a) * 1.05; leg.rotation.x = Math.cos(a) * 1.05;
      }
      this.sphere(g, 0xde9764, -.1, .48, .8, .06, { unlit: true });
      this.sphere(g, 0xde9764, .1, .48, .8, .06, { unlit: true });
      return g;
    }
    return this.wizard('enemy', 0x673f57);
  }

  prop(entity) {
    const g = new THREE.Group(), kind = `${entity.kind || ''} ${entity.name || ''} ${entity.id || ''}`, activated=!!entity.activated;
    if (/mirror|거울/i.test(kind)) {
      this.box(g, 0x8da3a8, 0, 1.7, 0, 2.1, 3.2, .15, { emissive: 0x458a9a, intensity: .6 });
      for (const x of [-1.15, 1.15]) this.box(g, 0xc6a365, x, 1.65, 0, .18, 3.5, .35);
      this.box(g, 0xc6a365, 0, .1, 0, 2.5, .22, .6);
      this.box(g, 0xc6a365, 0, 3.4, 0, 2.5, .22, .35);
      this.sphere(g, 0xe4c581, 0, 3.75, 0, .27);
    } else if (/ward|결계/i.test(kind)) {
      this.cylinder(g, 0x6e7e8e, 0, .25, 0, .6, .75, .5, 6);
      const crystal = this.mesh(g, this.geometry('wardCrystal', () => new THREE.OctahedronGeometry(.5)), activated?0x697978:0xa3b8e3, 0, activated?.58:1.25, 0, [1, activated?.4:1.65, 1], { emissive: activated?0x000000:0x6b7cb4, intensity: activated?0:.8 });
      if(!activated)this.ring(g, 0xa9a6d8, 1.1, .035, .7);
      g.userData.crystal = crystal;
    } else if (/lamp|등불|빛/i.test(kind)) {
      this.cylinder(g, 0x9c8861, 0, .8, 0, .06, .12, 1.6, 6);
      this.cylinder(g, 0x4b5c5e, 0, 1.65, 0, .38, .27, .2, 6);
      this.box(g, activated?0xffd887:0x4b5758, 0, 1.4, 0, .34, .45, .34, { emissive: activated?0xc49f53:0x000000, intensity: activated?1:0 });
      if(activated)this.ring(g,0xe3ca7b,1.25,.025,.55);
      this.cylinder(g, 0x6a6a57, 0, .1, 0, .35, .5, .2, 6);
    } else if (/feather|깃털/i.test(kind)) {
      this.box(g, 0x745e46, 0, .5, 0, 1.25, 1, .85);
      const featherGroup=new THREE.Group();featherGroup.position.y=activated?2.2:1.35;g.add(featherGroup);
      const feather = this.sphere(featherGroup, 0xe3e0c9, 0, 0, 0, .4); feather.scale.multiply(new THREE.Vector3(.35,.6,1.2)); feather.rotation.z = -.4;
      this.box(featherGroup,0xbcae89,0,-.1,.1,.03,.03,.7);if(activated){g.userData.floating=featherGroup;g.userData.floatHeight=2.2;}
    } else if (/tracks|흔적|발자국/i.test(kind)) {
      for (let i = 0; i < 5; i++) {
        const print = this.sphere(g, 0x9ab4a3, (i % 2 ? .18 : -.18), .08, (i - 2) * .4, .14, { unlit: true }); print.scale.multiply(new THREE.Vector3(.7,.12,1.4));
      }
      this.ring(g, 0xa8cfbb, .85, .02, .35);
    } else if (/crystal|결정|정수/i.test(kind)) {
      const crystal = this.mesh(g, this.geometry('itemCrystal', () => new THREE.OctahedronGeometry(.45)), 0x92cbd6, 0, 1, 0, [1, 1.6, 1], { emissive: 0x529eac, intensity: .8 });
      this.ring(g, 0x9ac5cf, .6, .035, .7); g.userData.crystal = crystal;
    } else if (/club|곤봉/i.test(kind)) {
      const club = this.cylinder(g, 0x8e6c43, 0, .48, 0, .14, .35, 2, 6); club.rotation.z = Math.PI / 2;
      this.ring(g, 0xc4c282, 1.1, .025, .75);
    } else if (/chess|체스/i.test(kind)) {
      this.cylinder(g, 0xc6cac0, 0, .15, 0, .55, .6, .3, 8);
      this.cylinder(g, 0xc6cac0, 0, .75, 0, .25, .45, 1, 8);
      this.sphere(g, 0xdce0d2, 0, 1.45, 0, .32);
      this.box(g, 0xb7baab, 0, 1.83, 0, .1, .5, .1);
      this.box(g, 0xb7baab, 0, 1.92, 0, .4, .1, .1);
    } else if (/plant|vine|덩굴|약초/i.test(kind)) {
      const harvested=entity.visualState==='harvested',burnt=activated&&/vine|덩굴/i.test(kind);
      for(let i=0;i<5;i++){
        const x=Math.sin(i*2.5)*.45,z=Math.cos(i*2.5)*.45;
        this.cylinder(g,0x77563e,x,.17,z,.23,.19,.34,6);
        if(harvested||burnt){
          this.cylinder(g,burnt?0x453e35:0x66825b,x,.42,z,.025,.04,.24,4);
          this.box(g,burnt?0x3c3931:0x7d8d61,x+.08,.04,z,.22,.04,.08).rotation.y=i;
        }else this.plant(g,x,.25,z,i%2?0x587d5a:0x7c9a63);
      }
    } else if (/machine|장치|수리/i.test(kind)) {
      this.box(g,0x665441,0,.45,0,1.7,.9,.85);
      this.box(g,0x9b835b,0,1,0,1.9,.16,1.05);
      const gears=new THREE.Group();gears.position.set(0,1.45,.18);g.add(gears);
      for(const [i,x]of[-.42,.4].entries()){
        const gear=this.mesh(gears,this.geometry(`gear:${i}`,()=>new THREE.TorusGeometry(i?.3:.42,.1,5,8)),activated?0xb8af7d:0x7e7469,x,0,0);
        if(!activated)gear.rotation.z=i?.5:-.35;
        this.box(gear,activated?0x778c85:0x6b5a4c,0,0,0,.1,.7,.12);
      }
      this.box(g,activated?0x8dd7bb:0xd38a5c,.68,1.15,.5,.12,.12,.06,{emissive:activated?0x4e9b7b:0x672c1c,intensity:.6});
      if(activated)g.userData.gears=gears;
      else for(let i=0;i<3;i++)this.box(g,0x866b51,(i-1)*.4,.08,.75,.4,.12,.12).rotation.z=i*.4;
    } else if (/door|gate|lock|문/i.test(kind)) {
      const door=new THREE.Group();door.position.x=-.75;g.add(door);
      this.box(door,0x6c645b,.75,1.15,0,1.65,2.3,.45);
      this.box(door,0x9e8c66,.75,1.15,.25,1.35,1.9,.07);
      this.cylinder(door,0xc7af71,1.13,1.1,.34,.12,.12,.15,6).rotation.x=Math.PI/2;
      if(activated)door.rotation.y=-Math.PI*.36;
    } else if (/book|letter|편지|책|기록/i.test(kind)) {
      this.box(g, 0x675849, 0, .5, 0, 1.15, 1, .8);
      this.box(g, 0xd9cbaa, 0, 1.08, 0, .7, .12, .58).rotation.y = -.2;
      this.box(g, 0x8b4e45, .15, 1.15, .1, .13, .02, .13);
    } else if (/potion|물약|bottle/i.test(kind)) {
      this.box(g, 0x71604d, 0, .5, 0, 1.3, 1, .7);
      for (let i = 0; i < 3; i++) {
        this.sphere(g, [0x73b2ab, 0xb17c9d, 0xcbb56f][i], (i - 1) * .35, 1.22, 0, .18, { emissive: 0x477d79, intensity: .2 });
        this.cylinder(g, 0xa6c6bf, (i - 1) * .35, 1.44, 0, .06, .08, .2, 6);
      }
    } else if (/key|열쇠/i.test(kind)) {
      const key = this.mesh(g, this.geometry('keyRing', () => new THREE.TorusGeometry(.21, .06, 5, 12)), 0xe1bf70, 0, 1.3, 0); key.rotation.y = .3;
      this.box(g, 0xe1bf70, 0, .95, 0, .1, .5, .1);
      this.box(g, 0xe1bf70, .14, .74, 0, .3, .1, .1);
      for (const x of [-.4, .4]) this.box(g, 0xbad7d9, x, 1.25, 0, .45, .03, .25, { opacity: .8 });
    } else {
      this.box(g, 0x79614a, 0, .4, 0, 1, .8, .75);
      this.box(g, 0xb39a65, 0, .75, 0, 1.04, .12, .8);
      this.box(g, 0xd3b86f, 0, .5, .4, .15, .2, .08);
    }
    this.ring(g, entity.color || 0xb9c693, .7, .018, .35);
    return g;
  }

  portal() {
    const g = new THREE.Group();
    this.ring(g, 0x8bd4ba, 1.05, .055, .85);
    this.ring(g, 0x668f81, 1.35, .025, .55);
    const arch = this.mesh(g, this.geometry('portalArch', () => new THREE.TorusGeometry(1.1, .055, 4, 36, Math.PI)), 0x8bd4ba, 0, 1.1, 0, null, { unlit: true, opacity: .8 });
    for (const x of [-1.1, 1.1]) this.box(g, 0x80bda5, x, .55, 0, .07, 1.1, .07, { unlit: true, opacity: .7 });
    this.cylinder(g, 0x72baad, 0, .9, 0, .6, .85, 1.8, 24, { unlit: true, opacity: .06 });
    g.userData.arch = arch;
    return g;
  }

  entityVisualSignature(entity) {
    return [this.assetVersion,entity.visualState||'',!!entity.activated,entity.type==='target'?Math.ceil((entity.damageRatio||0)*3):0].join(':');
  }

  entityModel(entity) {
    const authored=this.authoredEntityModel(entity);
    if(authored)return authored;
    let model;
    if (entity.type === 'npc') {
      model = this.wizard('npc', /하그리드/.test(entity.name || '') ? 0x74624f : (entity.color || 0x486b73));
      if (/하그리드/.test(entity.name || '')) model.scale.setScalar(1.45);
      const marker = this.sphere(model, 0xf0cc7e, 0, 2.3, 0, .1, { unlit: true }); model.userData.marker = marker;
    } else if (entity.type === 'enemy' || entity.type === 'boss') model = this.enemy(entity);
    else if (entity.type === 'ring') {
      model = new THREE.Group();
      const r = this.mesh(model, this.geometry('flightRing', () => new THREE.TorusGeometry(1.15, .11, 6, 28)), 0xdec77f, 0, 1.8, 0, null, { emissive: 0xc29e43, intensity: .45 });
      r.rotation.y = Math.PI / 4;
      this.cylinder(model, 0xa6ab86, 0, .4, 0, .05, .12, .8, 6);
      model.userData.ring = r;
      this.ring(model, 0xd8c78d, .7, .025, .4);
    } else if (entity.type === 'target') {
      model=new THREE.Group();const ratio=entity.damageRatio||0,broken=entity.visualState==='broken';
      this.cylinder(model,0x77654f,0,broken?.23:.7,0,.1,.15,broken?.46:1.4,6);
      const board=new THREE.Group();board.position.set(broken?.3:0,broken?.3:1.65,broken?.35:0);board.rotation.x=broken?Math.PI*.43:0;board.rotation.z=ratio>.3?.12:0;model.add(board);
      this.sphere(board,ratio>.3?0x7b837a:0x9aa6a1,0,0,0,.55).scale.z=.35;
      const ring=this.mesh(board,this.geometry('targetRing',()=>new THREE.TorusGeometry(.37,.045,4,24)),ratio>.6?0x92815f:0xcdbd7f,0,0,.2,null,{unlit:true});ring.castShadow=false;
      this.sphere(board,0xd0b66a,0,0,.22,.12,{unlit:true});
      if(ratio>0)for(let i=0;i<Math.ceil(ratio*5);i++){
        const crack=this.box(board,0x343d3b,(i%2?.12:-.1),.25-i*.12,.24,.035,.26,.02);crack.rotation.z=i%2?.55:-.4;
      }
      if(ratio>.6)for(let i=0;i<4;i++){const chip=this.box(model,0x778576,Math.sin(i*2.4)*.55,.08,Math.cos(i*2.4)*.55,.18,.09,.13);chip.rotation.y=i;}
    } else if (entity.type === 'pickup') {
      model = this.prop(entity);
      const beacon = this.cylinder(model, 0xe0c37e, 0, .85, 0, .07, .3, 1.6, 12, { unlit: true, opacity: .1 });
      beacon.castShadow = false;
    } else model = this.prop(entity);
    model.userData.entityId = entity.id;
    model.userData.visualSignature=this.entityVisualSignature(entity);
    return model;
  }

  ambientParticles(data) {
    const positions = new Float32Array(120 * 3);
    for (let i = 0; i < 120; i++) {
      positions[i * 3] = hash(i + 1) * data.width;
      positions[i * 3 + 1] = .8 + hash(i + 101) * 4;
      positions[i * 3 + 2] = hash(i + 201) * data.depth;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometries.set('ambientParticles', geo);
    const mat = new THREE.PointsMaterial({ color: this.palette.glow, size: .045, transparent: true, opacity: .6, sizeAttenuation: true, depthWrite: false });
    this.materials.set('ambientParticles', mat);
    this.dust = new THREE.Points(geo, mat); this.scene.add(this.dust);
  }

  updateCamera(alpha) {
    this.camera.position.copy(this.cameraTarget).add(this.cameraOffset);
    this.camera.lookAt(this.cameraTarget);
    this.camera.updateMatrixWorld();
  }

  syncCollection(map, data, make, update) {
    const present = new Set();
    for (const item of data || []) {
      if (item.active === false || item.hidden) continue;
      const id = item.id ?? item;
      present.add(id);
      let obj = map.get(id);
      if(obj&&map===this.entities&&obj.userData.visualSignature!==this.entityVisualSignature(item)){releaseModelInstance(obj);this.dynamic.remove(obj);map.delete(id);obj=null;}
      if (!obj) { obj = make(item); this.dynamic.add(obj); map.set(id, obj); }
      update(obj, item);
    }
    for (const [id, object] of map) if (!present.has(id)) { releaseModelInstance(object);this.dynamic.remove(object); map.delete(id); }
  }

  render(world, dt = 1 / 60) {
    if (!world || !this.sceneData || this.disposed) return;
    this.resize();
    this.elapsed = Number.isFinite(world.time) ? world.time : this.elapsed + dt;
    const time = this.elapsed, p = world.player || {}, safeDt = Math.min(.1, Math.max(0, dt));
    const px = Number.isFinite(p.x) ? p.x : this.player.position.x, pz = Number.isFinite(p.z) ? p.z : this.player.position.z;
    const speed = this.previousPosition ? Math.hypot(px - this.previousPosition.x, pz - this.previousPosition.z) / Math.max(.001, safeDt) : 0;
    const bob = speed > .15 ? Math.abs(Math.sin(time * 12)) * .06 : Math.sin(time * 2) * .012;
    const flying = this.sceneData.theme === 'flight';
    this.player.position.set(px, (flying ? .9 : 0) + bob, pz);
    if (typeof p.facing === 'number' && Number.isFinite(p.facing)) this.player.rotation.y = p.facing;
    else if (speed > .2 && this.previousPosition) this.player.rotation.y = Math.atan2(px - this.previousPosition.x, pz - this.previousPosition.z);
    if(this.player.userData.arm)this.player.userData.arm.rotation.x = p.guarding ? -.5 : (speed > .2 ? Math.sin(time * 10) * .08 : 0);
    if(this.player.userData.tip)this.player.userData.tip.scale.setScalar(.055 * (1 + Math.sin(time * 4) * .2));
    this.animatePlayer(p,speed,safeDt,flying);
    this.previousPosition.set(px, 0, pz);
    this.guard.visible = Boolean(p.guarding);
    this.guard.position.set(px, flying ? .9 : 0, pz);
    this.guard.rotation.y = time * .7;
    const wanted = new THREE.Vector3(px, .75, pz);
    this.cameraTarget.lerp(wanted, 1 - Math.exp(-safeDt * 6));
    this.updateCamera();

    this.syncCollection(this.entities, world.entities, e => this.entityModel(e), (obj, e) => {
      obj.position.set(e.x || 0, 0, e.z || 0);
      if (e.type === 'npc') obj.rotation.y = Math.atan2(px - e.x, pz - e.z);
      if (e.type === 'enemy' || e.type === 'boss') {
        obj.rotation.y = e.attackState==='windup'&&Number.isFinite(e.facing)?e.facing:Math.atan2(px-e.x,pz-e.z);
        obj.position.y = Math.abs(Math.sin(time * (e.enraged?7:4) + e.x)) * .025;
        if(obj.userData.club){
          obj.userData.club.rotation.x=e.attackState==='windup'?-1.25:e.attackState==='recover'?.55:e.attackState==='stunned'?.8:-.4+Math.sin(time*2)*.16;
          obj.userData.club.rotation.z=e.attackPattern==='sweep'&&e.attackState==='windup'?-.85:0;
        }
        const flash=e.hitUntil>time;
        if(flash!==!!obj.userData.hitFlash){obj.userData.hitFlash=flash;obj.traverse(mesh=>{if(!mesh.isMesh||mesh.material.transparent)return;if(flash){mesh.userData.restMaterial=mesh.material;mesh.material=this.material(0xffdcb2,{emissive:0x9b5541,intensity:.4});}else if(mesh.userData.restMaterial){mesh.material=mesh.userData.restMaterial;delete mesh.userData.restMaterial;}});}
      }
      if (obj.userData.marker) obj.userData.marker.position.y = 2.25 + Math.sin(time * 2 + e.x) * .12;
      if (obj.userData.ring) obj.userData.ring.scale.setScalar(1 + Math.sin(time * 2 + e.x) * .035);
      if(obj.userData.crystal&&!e.activated)obj.userData.crystal.rotation.y=time*.7;
      if(obj.userData.floating)obj.userData.floating.position.y=obj.userData.floatHeight+Math.sin(time*2)*.16;
      if(obj.userData.gears)obj.userData.gears.children.forEach((gear,i)=>{gear.rotation.z=time*(i%2?-1:1);});
      if (e.completed || e.solved) obj.scale.setScalar(.9);
      this.animateEntity(obj,e,safeDt,time,(world.telegraphs||[]).find(a=>a.ownerId===e.id));
    });
    const target = (world.entities || []).find(e => e.id === world.targetId && e.active !== false);
    this.targetRing.visible = Boolean(target);
    if (target) {
      this.targetRing.position.set(target.x, .045, target.z);
      this.targetRing.rotation.y = time * .7;
      this.targetRing.scale.setScalar(Math.max(.7, target.radius || .8));
    }

    this.syncCollection(this.projectiles, (world.projectiles||[]).filter(e=>!this.assetFx.hidesProjectile(e)), e => {
      const g = new THREE.Group();
      this.sphere(g, e.color || (e.enemy ? 0xde8876 : 0x86d3e5), 0, 0, 0, Math.max(.10, e.radius || .12), { unlit: true });
      this.sphere(g, e.color || 0x9eddec, 0, 0, 0, .25, { unlit: true, opacity: .15 });
      return g;
    }, (obj, e) => { obj.position.set(e.x, e.y ?? .9, e.z); });

    this.syncCollection(this.telegraphs, world.telegraphs, e => {
      const g=new THREE.Group(),radius=Math.max(.5,e.radius||1),color=e.color||(e.sequenceStage===2?0xf69d60:0xe1876f);
      const line=(e.shape==='line'||e.kind==='charge'||e.kind==='bolt')&&Number.isFinite(e.originX)&&Number.isFinite(e.originZ);
      if(line){
        const length=Math.hypot(e.x-e.originX,e.z-e.originZ),halfWidth=e.shape==='line'?radius:.25;
        this.box(g,color,0,.035,-length/2,halfWidth*2,.012,length,{unlit:true,opacity:.19});
        for(const side of[-1,1])this.box(g,color,halfWidth*side,.055,-length/2,.055,.012,length,{unlit:true,opacity:.95});
        for(const z of[0,-length]){const cap=this.ring(g,color,halfWidth,.035,.8);cap.position.z=z;}
        for(let z=-1;z>-length;z-=2){
          const arrow=this.box(g,color,0,.058,z,.4,.015,.055,{unlit:true,opacity:.8});arrow.rotation.y=-.5;
        }
        g.rotation.y=Math.atan2(e.x-e.originX,e.z-e.originZ);
      }else{
        this.ring(g,color,radius,.055,.95);
        const disc=this.mesh(g,this.geometry(`disc:${radius}`,()=>new THREE.CircleGeometry(radius,36)),color,0,.035,0,null,{unlit:true,opacity:.17});disc.rotation.x=-Math.PI/2;disc.castShadow=false;
        const progressRing=this.ring(g,color,radius,.035,.65);g.userData.progressRing=progressRing;
        if(e.kind==='sweep')for(let i=0;i<8;i++){
          const a=i*Math.PI/4;this.box(g,color,Math.sin(a)*radius*.75,.055,Math.cos(a)*radius*.75,.1,.012,.4,{unlit:true,opacity:.85}).rotation.y=a;
        }
      }
      return g;
    },(obj,e)=>{
      obj.position.set(e.x,.065,e.z);
      const progress=clamp(1-Math.max(0,e.ttl||0)/(e.duration||1),0,1);
      if(obj.userData.progressRing)obj.userData.progressRing.scale.setScalar(.1+.9*progress);
      // Keep the true damaging boundary continuously visible, including the final frames.
      obj.visible=true;
    });

    this.syncCollection(this.effects, (world.effects||[]).filter(e=>!this.assetFx.hidesEffect(e)), e => {
      const g = new THREE.Group();
      this.ring(g, e.color || 0xb4d6c7, e.radius || .8, .055, .7);
      for (let i = 0; i < 5; i++) this.sphere(g, e.color || 0xc9e6cc, Math.sin(i * 1.26) * .45, .4 + i * .09, Math.cos(i * 1.26) * .45, .06, { unlit: true });
      return g;
    }, (obj, e) => { obj.position.set(e.x || 0, .08, e.z || 0); const s = .6 + Math.max(0, 1 - (e.ttl || 0)) * .7; obj.scale.setScalar(s); obj.rotation.y = time * 2; });

    this.candles.forEach((flame, i) => { flame.scale.y = .12 * (1.5 + Math.sin(time * 6 + i * 3) * .25); });
    if (this.dust) this.dust.position.y = Math.sin(time * .4) * .1;
    if (this.exit?.userData.arch) this.exit.userData.arch.scale.setScalar(1 + Math.sin(time * 2) * .025);
    this.assetEnvironment?.traverse(o=>o.userData.animation?.update(safeDt));
    this.assetFx.update(world,this.camera,safeDt);
    this.renderer.render(this.scene, this.camera);
    this.adjustSoftwareBudget();
  }

  project(x, z, y = 1.5) {
    this.projectVector.set(x, y, z).project(this.camera);
    return { x: (this.projectVector.x + 1) / 2, y: (1 - this.projectVector.y) / 2, visible: Math.abs(this.projectVector.x) <= 1 && Math.abs(this.projectVector.y) <= 1 && this.projectVector.z >= -1 && this.projectVector.z <= 1 };
  }

  adjustSoftwareBudget() {
    if(this.mode!=='software'||this.renderer.renderedFrames===this.softwareLastFrame)return;
    this.softwareLastFrame=this.renderer.renderedFrames;
    if(this.softwareWarmup>0){this.softwareWarmup--;return;}
    // Only time real software-render work. Slow UI/simulation frames do not lower quality.
    // Require repeated expensive frames after cache warmup, then settle before another step.
    this.softwareSlowFrames=this.renderer.renderMs>70?this.softwareSlowFrames+1:0;
    if(this.softwareSlowFrames<4||this.softwarePixelBudget<=320*180)return;
    this.softwarePixelBudget=Math.max(320*180,Math.floor(this.softwarePixelBudget*.7));
    this.softwareSlowFrames=0;this.softwareWarmup=4;
  }

  resize() {
    const width=Math.max(1,Math.round(this.canvas.clientWidth||640)),height=Math.max(1,Math.round(this.canvas.clientHeight||360));
    const high=this.quality==='smooth'&&this.mode==='webgl',aspect=width/height;
    const budget=this.mode==='software'?this.softwarePixelBudget:high?1280*720:640*360;
    const key=`${width}:${height}:${high}:${budget}:${this.sceneData?.layout?.cameraSpan||24}`;
    if(key===this.viewportKey)return;this.viewportKey=key;
    const longSide=high?1920:960;
    let renderWidth=Math.min(longSide,Math.round(Math.sqrt(budget*aspect))),renderHeight=Math.round(renderWidth/aspect);
    if(renderHeight>longSide){renderHeight=longSide;renderWidth=Math.round(renderHeight*aspect);}
    renderWidth=Math.max(1,renderWidth);renderHeight=Math.max(1,renderHeight);
    this.renderer.setSize(renderWidth,renderHeight,false);
    // Scene spans are authored at16:9. Narrow views retain at least18T across.
    const vertical=(this.sceneData?.layout?.cameraSpan||24)*9/16,horizontal=Math.max(18,vertical*aspect),verticalSpan=horizontal/aspect;
    Object.assign(this.camera,{left:-horizontal/2,right:horizontal/2,top:verticalSpan/2,bottom:-verticalSpan/2});
    this.camera.updateProjectionMatrix();
  }
  setQuality(value) { this.quality = value === 'smooth' ? 'smooth' : 'pixel'; this.resize(); }

  clearScene() {
    this.assetEpoch++;
    releaseModelInstance(this.scene);
    this.assetFloorTexture?.dispose();this.assetFloorMaterial?.dispose();
    this.assetFloorTexture=null;this.assetFloorMaterial=null;this.floorSurface=null;this.assetEnvironment=null;
    this.scene.traverse(object => {
      if (object.isInstancedMesh) object.dispose();
      if (object.shadow?.dispose) object.shadow.dispose();
    });
    this.scene.clear();
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
    this.geometries.clear(); this.materials.clear();
    this.entities.clear(); this.projectiles.clear(); this.telegraphs.clear(); this.effects.clear();
    this.candles = []; this.exit = null; this.dust = null;
  }

  dispose() {
    if (this.disposed) return;
    this.clearScene();
    this.modelLibrary.dispose();this.assetFx.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.disposed = true;
  }
}
