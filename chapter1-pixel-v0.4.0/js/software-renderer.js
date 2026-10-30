import * as THREE from '../vendor/three.module.js';

const srgb = n => n <= .0031308 ? n * 12.92 : 1.055 * Math.pow(n, 1 / 2.4) - .055;
const byte = n => Math.round(Math.max(0, Math.min(1, srgb(Math.max(0, n)))) * 255);
const colorCSS = (r, g, b) => `rgb(${byte(r)},${byte(g)},${byte(b)})`;
const equalMatrix = (a, b) => a && a.every((v, i) => Math.abs(v - b[i]) < 1e-8);
const linearBytes = Float32Array.from({ length: 256 }, (_, i) => {
  const n = i / 255;
  return n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4;
});
const outputBytes = Uint8Array.from({ length: 4097 }, (_, i) => byte(i / 4096));
const fastByte = n => outputBytes[Math.max(0, Math.min(4096, Math.round(n * 4096)))];
const wrapUV = (n, mode) => mode === THREE.RepeatWrapping ? n - Math.floor(n)
  : mode === THREE.MirroredRepeatWrapping ? 1 - Math.abs(((n % 2) + 2) % 2 - 1)
    : Math.max(0, Math.min(1, n));

/**
 * CPU fallback for the same Three.js geometry and orthographic camera.
 * Uses world transforms, triangle projection, backface/frustum culling,
 * skin/morph deformation, nearest UV textures, directional flat lighting,
 * a per-pixel depth buffer and sorted alpha.
 * It is a software 3D renderer, not a separate 2D game implementation.
 */
export class SoftwareRenderer {
  constructor({ canvas }) {
    this.domElement = canvas;
    this.context = canvas.getContext('2d', { alpha: false });
    if (!this.context) throw new Error('이 브라우저에서 게임 화면을 시작할 수 없습니다.');
    this.shadowMap = { enabled: false, type: null };
    this.info = { render: { calls: 0, triangles: 0 }, memory: { geometries: 0, textures: 0 } };
    this.geometryCache = new WeakMap();
    this.objectCache = new WeakMap();
    this.textureCache = new WeakMap();
    this.vertex = new THREE.Vector3();
    this.viewProjection = new THREE.Matrix4();
    this.frustum = new THREE.Frustum();
    this.instanceMatrix = new THREE.Matrix4();
    this.combinedMatrix = new THREE.Matrix4();
    this.sphere = new THREE.Sphere();
    this.color = new THREE.Color();
    this.lightDirection = new THREE.Vector3(-.45, .85, .35).normalize();
    this.width = 640;
    this.height = 360;
    this.imageData = null;
    this.depthBuffer = null;
    this.lastFrame = -Infinity;
    this.needsFrame = true;
    this.disposed = false;
    this.renderMs = 0;
    this.rasterMs = 0;
    this.renderedFrames = 0;
    this.textureFailures = 0;
  }

  setPixelRatio() {}
  setSize(width, height, updateStyle = false) {
    this.width = width;
    this.height = height;
    this.domElement.width = width;
    this.domElement.height = height;
    this.imageData = this.context.createImageData(width, height);
    this.depthBuffer = new Float32Array(width * height);
    if (updateStyle) {
      this.domElement.style.width = `${width}px`;
      this.domElement.style.height = `${height}px`;
    }
    this.needsFrame = true;
  }

  getGeometry(geometry) {
    let cached = this.geometryCache.get(geometry);
    const attr = geometry.attributes.position;
    if (!attr) return null;
    const versions = Object.values(geometry.attributes).map(a => a.version ?? a.data?.version ?? 0).join(',') + ':' + (geometry.index?.version ?? 0);
    if (cached?.versions === versions && cached.source === attr) return cached;
    const p = new Float32Array(attr.count * 3);
    for (let i = 0; i < attr.count; i++) {
      p[i * 3] = attr.getX(i);
      p[i * 3 + 1] = attr.getY(i);
      p[i * 3 + 2] = attr.getZ(i);
    }
    let indices;
    if (geometry.index) indices = new Uint32Array(geometry.index.array);
    else indices = Uint32Array.from({ length: attr.count }, (_, i) => i);
    if (!geometry.boundingSphere) geometry.computeBoundingSphere();
    const uvs = {};
    for (const name of ['uv', 'uv1', 'uv2', 'uv3']) {
      const uv = geometry.attributes[name];
      if (!uv) continue;
      uvs[name] = Float32Array.from({ length: uv.count * 2 }, (_, i) => i % 2 ? uv.getY(i >> 1) : uv.getX(i >> 1));
    }
    cached = { source: attr, versions, positions: p, uvs, indices, count: attr.count, bounds: geometry.boundingSphere?.clone(), groups: geometry.groups || [] };
    this.geometryCache.set(geometry, cached);
    return cached;
  }

  worldGeometry(mesh, geometry, matrix, instanceIndex = -1) {
    let instances = this.objectCache.get(mesh);
    if (!instances) { instances = new Map(); this.objectCache.set(mesh, instances); }
    let cached = instances.get(instanceIndex);
    const e = matrix.elements;
    // A stationary character's bones still animate. Matrix-only caching would
    // freeze all GLB idle/cast poses at the first rendered frame.
    const deformed = mesh.isSkinnedMesh || mesh.morphTargetInfluences?.length;
    const pose = deformed ? [
      ...(mesh.morphTargetInfluences || []),
      ...(mesh.isSkinnedMesh ? mesh.skeleton.bones.flatMap(b => b.matrixWorld.elements) : []),
      ...(mesh.isSkinnedMesh ? mesh.bindMatrixInverse.elements : []),
    ] : null;
    if (cached?.geometry === geometry && equalMatrix(cached.matrix, e) && (!deformed || equalMatrix(cached.pose, pose))) return cached;
    const positions = geometry.positions;
    const world = cached?.geometry === geometry ? cached.world : new Float32Array(positions.length);
    for (let i = 0; i < positions.length; i += 3) {
      if (deformed) mesh.getVertexPosition(i / 3, this.vertex);
      const x = deformed ? this.vertex.x : positions[i], y = deformed ? this.vertex.y : positions[i + 1], z = deformed ? this.vertex.z : positions[i + 2];
      world[i] = e[0] * x + e[4] * y + e[8] * z + e[12];
      world[i + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
      world[i + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
    }
    const normals = cached?.geometry === geometry ? cached.normals : new Float32Array(geometry.indices.length);
    const ix = geometry.indices;
    for (let t = 0; t < ix.length; t += 3) {
      const a = ix[t] * 3, b = ix[t + 1] * 3, c = ix[t + 2] * 3;
      const ux = world[b] - world[a], uy = world[b + 1] - world[a + 1], uz = world[b + 2] - world[a + 2];
      const vx = world[c] - world[a], vy = world[c + 1] - world[a + 1], vz = world[c + 2] - world[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const length = Math.hypot(nx, ny, nz) || 1;
      normals[t] = nx / length; normals[t + 1] = ny / length; normals[t + 2] = nz / length;
    }
    cached = { geometry, matrix: Array.from(e), pose, world, normals, projected: cached?.geometry === geometry ? cached.projected : new Float32Array(geometry.count * 4) };
    instances.set(instanceIndex, cached);
    return cached;
  }

  projectVertices(world, projected, matrix, cameraMatrix) {
    const halfW = this.width / 2, halfH = this.height / 2;
    for (let i = 0, p = 0; i < world.length; i += 3, p += 4) {
      const x = world[i], y = world[i + 1], z = world[i + 2];
      const inverseW = 1 / (matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15]);
      projected[p] = ((matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) * inverseW + 1) * halfW;
      projected[p + 1] = (1 - (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) * inverseW) * halfH;
      projected[p + 2] = (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) * inverseW;
      projected[p + 3] = -(cameraMatrix[2] * x + cameraMatrix[6] * y + cameraMatrix[10] * z + cameraMatrix[14]);
    }
  }

  shade(material, normal, offset, tint, depth, fog) {
    const { multiply, add } = this.shadeFactors(material, normal, offset, tint, depth, fog);
    return multiply.map((n, i) => byte(n + add[i]));
  }

  shadeFactors(material, normal, offset, tint, depth, fog) {
    const color = material.color || this.color.set(0xffffff);
    const emissive = material.emissive;
    const intensity = material.emissiveIntensity || 0;
    let light = 1;
    if (!material.isMeshBasicMaterial) {
      const diffuse = Math.max(0, normal[offset] * this.lightDirection.x + normal[offset + 1] * this.lightDirection.y + normal[offset + 2] * this.lightDirection.z);
      light = .54 + diffuse * .72;
    }
    const f = fog && material.fog !== false ? Math.max(0, Math.min(.85, (depth - fog.near) / (fog.far - fog.near))) : 0;
    return {
      multiply: [color.r * tint.r, color.g * tint.g, color.b * tint.b].map(n => n * light * (1 - f)),
      add: ['r', 'g', 'b'].map(c => (emissive?.[c] || 0) * intensity * .5 * (1 - f) + (fog?.color[c] || 0) * f),
    };
  }

  getTexture(texture) {
    const image = texture?.image;
    if (!image) return null;
    const cached = this.textureCache.get(texture);
    if (cached?.image === image && cached.version === texture.version) return cached.pixels;
    const width = image.width || image.naturalWidth, height = image.height || image.naturalHeight;
    if (!width || !height) return null; // A not-yet-decoded image is retryable.
    let pixels = null;
    try {
      let data;
      if (image.data && image.data.length === width * height * 4 && (image.data instanceof Uint8Array || image.data instanceof Uint8ClampedArray)) {
        data = image.data;
      } else {
        // Works with the GLTFLoader's ImageBitmap and HTMLImageElement paths.
        const canvas = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(width, height)
          : this.domElement.ownerDocument?.createElement('canvas') || globalThis.document?.createElement('canvas');
        if (!canvas) throw new Error('Texture pixel access is unavailable');
        canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        data = context.getImageData(0, 0, width, height).data;
      }
      pixels = { width, height, data, srgb: texture.colorSpace === THREE.SRGBColorSpace };
    } catch {
      // A failed optional texture leaves the material color visible, without
      // re-reading a tainted/unsupported image every frame.
      this.textureFailures++;
    }
    this.textureCache.set(texture, { image, version: texture.version, pixels });
    return pixels;
  }

  addMesh(mesh, matrix, instanceIndex, tint, triangles, camera, scene) {
    const geometry = this.getGeometry(mesh.geometry);
    if (!geometry) return;
    if (geometry.bounds && !mesh.isSkinnedMesh && !mesh.morphTargetInfluences?.length) {
      this.sphere.copy(geometry.bounds).applyMatrix4(matrix);
      if (!this.frustum.intersectsSphere(this.sphere)) return;
    }
    const cached = this.worldGeometry(mesh, geometry, matrix, instanceIndex);
    const p = cached.projected, ix = geometry.indices;
    this.projectVertices(cached.world, p, this.viewProjection.elements, camera.matrixWorldInverse.elements);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const materialTextures = materials.map(mat => {
      const uv = geometry.uvs[mat?.map?.channel ? `uv${mat.map.channel}` : 'uv'];
      const pixels = uv && mat?.map ? this.getTexture(mat.map) : null;
      if (!pixels) return null;
      if (mat.map.matrixAutoUpdate) mat.map.updateMatrix();
      return { pixels, uv, matrix: mat.map.matrix.elements };
    });
    let groupIndex = 0;
    const groups = geometry.groups;
    const drawStart = mesh.geometry.drawRange.start || 0;
    const drawEnd = Math.min(ix.length, drawStart + mesh.geometry.drawRange.count);
    for (let t = drawStart; t < drawEnd; t += 3) {
      while (groups[groupIndex] && t >= groups[groupIndex].start + groups[groupIndex].count) groupIndex++;
      const materialIndex = materials.length > 1 ? groups[groupIndex]?.materialIndex || 0 : 0;
      const mat = materials[materialIndex];
      if (!mat || mat.visible === false || mat.opacity <= .01) continue;
      const a = ix[t] * 4, b = ix[t + 1] * 4, c = ix[t + 2] * 4;
      const ax = p[a], ay = p[a + 1], bx = p[b], by = p[b + 1], cx = p[c], cy = p[c + 1];
      if ((ax < -1 && bx < -1 && cx < -1) || (ax > this.width + 1 && bx > this.width + 1 && cx > this.width + 1) ||
          (ay < -1 && by < -1 && cy < -1) || (ay > this.height + 1 && by > this.height + 1 && cy > this.height + 1)) continue;
      if ((p[a + 2] < -1 && p[b + 2] < -1 && p[c + 2] < -1) || (p[a + 2] > 1 && p[b + 2] > 1 && p[c + 2] > 1)) continue;
      const area = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (Math.abs(area) < .05 || (mat.side === THREE.FrontSide && area >= 0) || (mat.side === THREE.BackSide && area <= 0)) continue;
      const depth = (p[a + 3] + p[b + 3] + p[c + 3]) / 3;
      const sampled = materialTextures[materialIndex];
      let textureInfo = null;
      const shading = this.shadeFactors(mat, cached.normals, t, tint, depth, scene.fog);
      if (sampled) {
        const { uv, matrix: m } = sampled;
        const coords = [];
        for (const index of [ix[t], ix[t + 1], ix[t + 2]]) {
          const u = uv[index * 2], v = uv[index * 2 + 1];
          coords.push(m[0] * u + m[3] * v + m[6], m[1] * u + m[4] * v + m[7]);
        }
        textureInfo = { ...sampled.pixels, coords, wrapS: mat.map.wrapS, wrapT: mat.map.wrapT, flipY: mat.map.flipY, ...shading };
      }
      triangles.push({ ax, ay, bx, by, cx, cy, depth, za: p[a + 2], zb: p[b + 2], zc: p[c + 2],
        color: shading.multiply.map((n, i) => byte(n + shading.add[i])),
        alpha: mat.transparent ? mat.opacity : 1,
        opacity: mat.opacity, alphaTest: mat.alphaTest || 0, transparent: mat.transparent,
        depthWrite: mat.depthWrite !== false, texture: textureInfo,
        order: mesh.renderOrder || 0 });
    }
  }

  rasterTriangle(tri) {
    const { ax, ay, bx, by, cx, cy, za, zb, zc, color, alpha } = tri;
    const texture = tri.texture;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx)));
    const x1 = Math.min(this.width - 1, Math.ceil(Math.max(ax, bx, cx)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy)));
    const y1 = Math.min(this.height - 1, Math.ceil(Math.max(ay, by, cy)));
    if (x0 > x1 || y0 > y1) return;
    const denominator = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy);
    if (Math.abs(denominator) < 1e-8) return;
    const inv = 1 / denominator;
    // Assign shared triangle edges to one face. Otherwise alpha sprites have a
    // darker diagonal where both faces blend the same pixel.
    const direction = Math.sign(denominator);
    const includesEdge = (xA, yA, xB, yB) => {
      const dx = (xB - xA) * direction, dy = (yB - yA) * direction;
      return dy < 0 || (dy === 0 && dx > 0);
    };
    const edge0 = includesEdge(bx, by, cx, cy), edge1 = includesEdge(cx, cy, ax, ay), edge2 = includesEdge(ax, ay, bx, by);
    const w0dx = (by - cy) * inv, w0dy = (cx - bx) * inv;
    const w1dx = (cy - ay) * inv, w1dy = (ax - cx) * inv;
    const data = this.imageData.data, depth = this.depthBuffer, width = this.width;
    const r = color[0], g = color[1], b = color[2];
    let rowW0 = ((by - cy) * (x0 + .5 - cx) + (cx - bx) * (y0 + .5 - cy)) * inv;
    let rowW1 = ((cy - ay) * (x0 + .5 - cx) + (ax - cx) * (y0 + .5 - cy)) * inv;
    for (let y = y0; y <= y1; y++) {
      let w0 = rowW0, w1 = rowW1;
      let pixel = y * width + x0;
      for (let x = x0; x <= x1; x++, pixel++, w0 += w0dx, w1 += w1dx) {
        const w2 = 1 - w0 - w1;
        if (w0 < -1e-6 || w1 < -1e-6 || w2 < -1e-6) continue;
        if ((Math.abs(w0) < 1e-6 && !edge0) || (Math.abs(w1) < 1e-6 && !edge1) || (Math.abs(w2) < 1e-6 && !edge2)) continue;
        const z = w0 * za + w1 * zb + w2 * zc;
        if (z < -1 || z > 1 || z >= depth[pixel]) continue;
        const offset = pixel * 4;
        let red = r, green = g, blue = b, pixelAlpha = alpha;
        if (texture) {
          const uv = texture.coords;
          const u = wrapUV(w0 * uv[0] + w1 * uv[2] + w2 * uv[4], texture.wrapS);
          let v = wrapUV(w0 * uv[1] + w1 * uv[3] + w2 * uv[5], texture.wrapT);
          if (texture.flipY) v = 1 - v;
          const tx = Math.min(texture.width - 1, Math.floor(u * texture.width));
          const ty = Math.min(texture.height - 1, Math.floor(v * texture.height));
          const source = (ty * texture.width + tx) * 4;
          const texels = texture.data;
          const sampleAlpha = texels[source + 3] / 255 * (tri.opacity ?? 1);
          if (sampleAlpha < tri.alphaTest) continue;
          if (tri.transparent) pixelAlpha *= texels[source + 3] / 255;
          if (pixelAlpha <= .001) continue;
          const mult = texture.multiply, add = texture.add;
          red = fastByte((texture.srgb ? linearBytes[texels[source]] : texels[source] / 255) * mult[0] + add[0]);
          green = fastByte((texture.srgb ? linearBytes[texels[source + 1]] : texels[source + 1] / 255) * mult[1] + add[1]);
          blue = fastByte((texture.srgb ? linearBytes[texels[source + 2]] : texels[source + 2] / 255) * mult[2] + add[2]);
        } else if ((tri.opacity ?? alpha) < (tri.alphaTest || 0)) continue;
        if (pixelAlpha >= .999) {
          if (tri.depthWrite !== false) depth[pixel] = z;
          data[offset] = red; data[offset + 1] = green; data[offset + 2] = blue;
        } else {
          const inverseAlpha = 1 - pixelAlpha;
          if (tri.depthWrite !== false) depth[pixel] = z;
          data[offset] = red * pixelAlpha + data[offset] * inverseAlpha;
          data[offset + 1] = green * pixelAlpha + data[offset + 1] * inverseAlpha;
          data[offset + 2] = blue * pixelAlpha + data[offset + 2] * inverseAlpha;
        }
      }
      rowW0 += w0dy; rowW1 += w1dy;
    }
  }

  render(scene, camera) {
    if (this.disposed) return;
    const now = performance.now();
    if (!this.needsFrame && now - this.lastFrame < 1000 / 24) return;
    this.lastFrame = now;
    this.needsFrame = false;
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    this.viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.viewProjection);
    const triangles = [], points = [], white = { r: 1, g: 1, b: 1 };
    scene.traverseVisible(object => {
      if (object.isMesh) {
        if (object.isInstancedMesh) {
          for (let i = 0; i < object.count; i++) {
            object.getMatrixAt(i, this.instanceMatrix);
            this.combinedMatrix.multiplyMatrices(object.matrixWorld, this.instanceMatrix);
            let tint = white;
            if (object.instanceColor) { object.getColorAt(i, this.color); tint = this.color; }
            this.addMesh(object, this.combinedMatrix, i, tint, triangles, camera, scene);
          }
        } else this.addMesh(object, object.matrixWorld, -1, white, triangles, camera, scene);
      } else if (object.isPoints) {
        const g = this.getGeometry(object.geometry);
        if (!g) return;
        const cached = this.worldGeometry(object, g, object.matrixWorld);
        this.projectVertices(cached.world, cached.projected, this.viewProjection.elements, camera.matrixWorldInverse.elements);
        const color = object.material.color || white;
        for (let i = 0; i < cached.projected.length; i += 4) {
          const x = cached.projected[i], y = cached.projected[i + 1];
          if (x < 0 || x > this.width || y < 0 || y > this.height) continue;
          points.push({ x, y, color: colorCSS(color.r, color.g, color.b), alpha: object.material.opacity ?? 1 });
        }
      }
    });
    const ctx = this.context;
    ctx.globalAlpha = 1;
    const background = scene.background?.isColor ? scene.background : new THREE.Color(0x142434);
    if (!this.imageData) this.setSize(this.width, this.height);
    const data = this.imageData.data;
    const red = byte(background.r), green = byte(background.g), blue = byte(background.b);
    for (let i = 0; i < data.length; i += 4) { data[i] = red; data[i + 1] = green; data[i + 2] = blue; data[i + 3] = 255; }
    this.depthBuffer.fill(Infinity);
    const rasterStart=performance.now();
    const transparent = [];
    for (const tri of triangles) {
      if (!tri.transparent && tri.alpha >= .999) this.rasterTriangle(tri);
      else transparent.push(tri);
    }
    transparent.sort((a, b) => a.order - b.order || b.depth - a.depth);
    for (const tri of transparent) this.rasterTriangle(tri);
    this.rasterMs=performance.now()-rasterStart;
    ctx.putImageData(this.imageData, 0, 0);
    for (const point of points) {
      ctx.globalAlpha = point.alpha * .65; ctx.fillStyle = point.color;
      ctx.fillRect(Math.round(point.x), Math.round(point.y), 1, 1);
    }
    ctx.globalAlpha = 1;
    this.info.render.calls = triangles.length;
    this.info.render.triangles = triangles.length;
    this.renderMs=performance.now()-now;
    this.renderedFrames++;
    return true;
  }

  dispose() { this.disposed = true; this.geometryCache = new WeakMap(); this.objectCache = new WeakMap(); this.textureCache = new WeakMap(); }
  forceContextLoss() {}
}
