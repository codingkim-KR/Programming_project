import * as THREE from '../vendor/three.module.js';

// Presentation only: the engine still owns every hit, attack outline and lifetime.
export const MAGIC_PACKS = Object.freeze({
  arcane: 'FX_ARCANE', fire: 'FX_FIRE', waterice: 'FX_WATERICE',
  ward: 'FX_WARD', curse: 'FX_CURSE', memory: 'FX_MEMORY',
});
const SPELL_FAMILY = Object.freeze({
  S001: 'arcane', S002: 'fire', S003: 'waterice', S005: 'arcane',
  S006: 'ward', S007: 'fire', S019: 'arcane', S026: 'ward',
  S034: 'arcane', S035: 'arcane', S036: 'memory', S037: 'memory',
  S038: 'memory', S039: 'waterice',
});
const KIND_FAMILY = Object.freeze({
  fire: 'fire', enrage: 'fire', shield: 'ward', guard: 'ward', parry: 'ward',
  repair: 'memory', unlock: 'memory', collect: 'memory', heal: 'memory',
  levitate: 'waterice', shadow: 'curse', curse: 'curse',
});
const IMPACT_PARTICLES = Object.freeze({ slam: 'dust_puff', sweep: 'dust_puff', charge: 'dust_puff' });
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const seed = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

export function magicFamily(item = {}) {
  return SPELL_FAMILY[item.spellId] || KIND_FAMILY[item.kind] || (item.enemy ? 'curse' : 'arcane');
}

export function effectTextureKey(item = {}, role = 'impact') {
  if (role === 'impact' && IMPACT_PARTICLES[item.kind]) return `world:${IMPACT_PARTICLES[item.kind]}`;
  const large = role === 'impact' && ((item.radius || 0) >= 1.5 || item.kind === 'enrage');
  return `${magicFamily(item)}:${large ? 'large' : 'small'}`;
}

export function effectTextureURL(key) {
  const [family, variant] = key.split(':');
  if (family === 'world') return new URL(`../assets/packs/FX_WORLD/v1/${variant}.png`, import.meta.url).href;
  if (!MAGIC_PACKS[family] || !['small', 'large'].includes(variant)) throw new Error(`Unknown effect texture: ${key}`);
  return new URL(`../assets/packs/${MAGIC_PACKS[family]}/v1/impact${variant === 'large' ? '_large' : ''}_sheet.png`, import.meta.url).href;
}

export function sheetFrame(age) {
  const frame = clamp(Math.floor(Math.max(0, age) * 12), 0, 7);
  return { frame, repeatX: .25, repeatY: .5, offsetX: (frame % 4) * .25, offsetY: .5 - Math.floor(frame / 4) * .5 };
}

function withinFloor(data, x, z) {
  if (data.layout?.boundary === 'ellipse') return ((x - data.width / 2) / (data.width / 2)) ** 2 + ((z - data.depth / 2) / (data.depth / 2)) ** 2 < .92;
  const regions = data.layout?.floorRegions || [{ x: data.width / 2, z: data.depth / 2, w: data.width, d: data.depth }];
  return regions.some(r => x > r.x - r.w / 2 + .3 && x < r.x + r.w / 2 - .3 && z > r.z - r.d / 2 + .3 && z < r.z + r.d / 2 - .3);
}

export function ambientPlan(data) {
  const theme = data?.theme;
  // Rain and snow are intentionally not spread across indoor floors. They need
  // authored outside/window zones before their provided sprites can be used.
  const definitions = theme === 'forest'
    ? [{ texture: 'fog_wisp', count: 4, opacity: .055, size: 4.2, height: .35 }]
    : theme === 'bathroom'
      ? [{ texture: 'ripple', count: 4, opacity: .18, size: 1.1, height: .032, floor: true }]
      : ['coast', 'castle', 'classroom', 'library', 'puzzle', 'mirror'].includes(theme)
        ? [{ texture: 'dust_mote', count: 10, opacity: .14, size: .14, height: 1.3 }]
        : [];
  const result = [];
  const regions = data?.layout?.floorRegions;
  const totalArea = regions?.reduce((sum, region) => sum + region.w * region.d, 0) || 0;
  for (const def of definitions) {
    for (let i = 0, attempts = 0; i < def.count && attempts < def.count * 8; attempts++) {
      let region = null;
      if (totalArea) {
        let target = seed(attempts * 7 + 3) * totalArea;
        region = regions.find(candidate => (target -= candidate.w * candidate.d) <= 0) || regions[regions.length - 1];
      }
      const x = region ? region.x - region.w / 2 + .4 + seed(attempts * 3 + 5) * Math.max(.1, region.w - .8) : .5 + seed(attempts * 3 + 5) * Math.max(1, data.width - 1);
      const z = region ? region.z - region.d / 2 + .4 + seed(attempts * 3 + 7) * Math.max(.1, region.d - .8) : .5 + seed(attempts * 3 + 7) * Math.max(1, data.depth - 1);
      if (!withinFloor(data, x, z)) continue;
      result.push({ ...def, x, z, phase: seed(attempts + 11) * Math.PI * 2 }); i++;
    }
  }
  return result;
}

function loadTexture(url) {
  return new Promise((resolve, reject) => {
    let finished = false;
    const timeout = setTimeout(() => { finished = true; reject(new Error('Effect texture load timed out')); }, 12000);
    new THREE.TextureLoader().load(url, texture => {
      clearTimeout(timeout);
      if (finished) { texture.dispose(); return; }
      finished = true; resolve(texture);
    }, undefined, error => {
      clearTimeout(timeout);
      if (finished) return;
      finished = true; reject(error instanceof Error ? error : new Error('Effect texture load failed'));
    });
  });
}

/** Standard textured meshes work in both WebGL and the CPU renderer. */
export class AssetEffects {
  constructor({ textureLoader = loadTexture } = {}) {
    this.group = new THREE.Group(); this.group.name = 'chapter-one-asset-effects';
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.textureLoader = textureLoader;
    this.textures = new Map(); this.pending = new Map(); this.failed = new Set();
    this.objects = new Map(); this.ambient = [];
    this.generation = 0; this.ready = Promise.resolve(); this.disposed = false;
  }

  setScene(data) {
    if (this.disposed) return Promise.resolve();
    this.generation++; this.data = data;
    this.clearObjects();
    this.textures.forEach(texture => texture.dispose()); this.textures.clear();
    this.pending.clear(); this.failed.clear();
    this.ambient = ambientPlan(data).map((entry, i) => ({ ...entry, id: `ambient:${i}` }));
    const keys = new Set(['arcane:small', 'memory:small', 'ward:small']);
    for (const entry of this.ambient) keys.add(`world:${entry.texture}`);
    if (['classroom', 'garden', 'flight', 'bathroom', 'library', 'forest', 'puzzle', 'mirror'].includes(data.theme)) {
      keys.add('fire:small'); keys.add('waterice:small');
    }
    if (['bathroom', 'forest', 'puzzle', 'mirror'].includes(data.theme)) keys.add('world:dust_puff');
    if (data.theme === 'bathroom') keys.add('fire:large');
    if (['library', 'forest', 'mirror'].includes(data.theme)) keys.add('curse:small');
    this.ready = Promise.allSettled([...keys].map(key => this.requireTexture(key)));
    return this.ready;
  }

  requireTexture(key) {
    if (this.disposed || this.failed.has(key)) return Promise.resolve(null);
    if (this.textures.has(key)) return Promise.resolve(this.textures.get(key));
    if (this.pending.has(key)) return this.pending.get(key);
    const generation = this.generation;
    const promise = Promise.resolve().then(() => this.textureLoader(effectTextureURL(key))).then(texture => {
      if (this.disposed || generation !== this.generation) { texture.dispose(); return null; }
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.NearestFilter; texture.magFilter = THREE.NearestFilter;
      texture.generateMipmaps = false; texture.needsUpdate = true;
      this.textures.set(key, texture); this.pending.delete(key);
      return texture;
    }).catch(() => {
      if (generation === this.generation && !this.disposed) { this.failed.add(key); this.pending.delete(key); }
      return null;
    });
    this.pending.set(key, promise); return promise;
  }

  hidesProjectile(item) { return this.textures.has(effectTextureKey(item, 'projectile')); }
  hidesEffect(item) { return this.textures.has(effectTextureKey(item)); }
  hasMagic(family) { return this.textures.has(`${family}:small`); }

  makeObject(id, key) {
    const source = this.textures.get(key);
    if (!source) { this.requireTexture(key); return null; }
    const map = source.clone(); map.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map, color: 0xffffff, transparent: true, opacity: 1, alphaTest: .025, depthWrite: false, side: THREE.DoubleSide, fog: false });
    const mesh = new THREE.Mesh(this.geometry, material);
    mesh.name = id; mesh.renderOrder = -6; mesh.frustumCulled = false;
    mesh.userData.assetKey = key; this.objects.set(id, mesh); this.group.add(mesh);
    return mesh;
  }

  object(id, key) {
    let mesh = this.objects.get(id);
    if (mesh && mesh.userData.assetKey !== key) { this.removeObject(id); mesh = null; }
    return mesh || this.makeObject(id, key);
  }

  animateSheet(mesh, key, age) {
    if (key.startsWith('world:')) return;
    const f = sheetFrame(age), map = mesh.material.map;
    map.repeat.set(f.repeatX, f.repeatY); map.offset.set(f.offsetX, f.offsetY); map.updateMatrix();
  }

  update(world, camera) {
    if (this.disposed || !this.data || !world || !camera) return;
    const present = new Set(), time = world.time || 0;
    for (const item of world.projectiles || []) {
      const id = `projectile:${item.id}`, key = effectTextureKey(item, 'projectile'); present.add(id);
      const mesh = this.object(id, key); if (!mesh) continue;
      mesh.position.set(item.x, item.y ?? .9, item.z); mesh.quaternion.copy(camera.quaternion);
      const size = Math.max(.65, (item.radius || .2) * 3.2); mesh.scale.set(size, size, 1);
      // Loop an authored sheet for the moving core. Damage and speed remain in the engine.
      this.animateSheet(mesh, key, (time % (8 / 12)));
      mesh.material.opacity = .96;
    }
    for (const item of world.effects || []) {
      const id = `effect:${item.id}`, key = effectTextureKey(item); present.add(id);
      const mesh = this.object(id, key); if (!mesh) continue;
      const age = Math.max(0, (item.duration || .7) - (item.ttl || 0));
      mesh.position.set(item.x || 0, key.startsWith('world:') ? .35 : .85, item.z || 0);
      mesh.quaternion.copy(camera.quaternion);
      const size = key.endsWith(':large') ? 3 : key.startsWith('world:') ? 2 : Math.max(1.4, (item.radius || .8) * 2);
      mesh.scale.setScalar(size * (key.startsWith('world:') ? .7 + age : 1));
      mesh.material.opacity = key.startsWith('world:') ? Math.max(0, .4 * (item.ttl || 0) / (item.duration || .7)) : .86;
      this.animateSheet(mesh, key, age);
    }
    for (const particle of this.ambient) {
      present.add(particle.id);
      const mesh = this.object(particle.id, `world:${particle.texture}`); if (!mesh) continue;
      const wave = Math.sin(time * .7 + particle.phase);
      mesh.position.set(particle.x, particle.height + (particle.floor ? 0 : wave * .15), particle.z);
      if (particle.floor) mesh.rotation.set(-Math.PI / 2, 0, 0);
      else mesh.quaternion.copy(camera.quaternion);
      const s = particle.size * (particle.floor ? .7 + ((time * .3 + particle.phase) % 1) * .5 : 1);
      mesh.scale.setScalar(s); mesh.material.opacity = particle.opacity * (.65 + wave * .25); mesh.renderOrder = -10;
    }
    for (const id of this.objects.keys()) if (!present.has(id)) this.removeObject(id);
  }

  removeObject(id) {
    const mesh = this.objects.get(id); if (!mesh) return;
    mesh.removeFromParent(); mesh.material.map.dispose(); mesh.material.dispose(); this.objects.delete(id);
  }
  clearObjects() { for (const id of this.objects.keys()) this.removeObject(id); this.ambient = []; }
  dispose() {
    if (this.disposed) return;
    this.disposed = true; this.generation++; this.clearObjects();
    this.textures.forEach(texture => texture.dispose()); this.textures.clear(); this.pending.clear();
    this.geometry.dispose(); this.group.removeFromParent();
  }
}
