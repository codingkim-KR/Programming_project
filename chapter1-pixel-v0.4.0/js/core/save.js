import { validateSave } from './state.js';

const DB_NAME = 'magic-typing-rpg-v1';
const RECORD_KEY = 'save:main:v1';
const CONFIG_KEY = 'cloud:config:v1';
const SESSION_KEY = 'magic-typing-rpg:cloud-session:v1';
const EMPTY = () => ({ version: 1, current: null, localVersion: 0, ackedLocalVersion: 0,
  lastAck: { revision: 0, savedAt: null }, pending: null, blocked: null, cloudIdentity: null, remoteCandidate: null });
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
const valid = value => { if (validateSave(value) === false) throw new Error('저장 파일 형식이 올바르지 않습니다.'); return value; };
const LABELS = { local: '기기에 저장됨', syncing: '클라우드 저장 중', synced: '클라우드 저장 완료',
  pending: '동기화 대기', conflict: '저장 충돌', error: '저장 실패', readonly: '다른 탭에서 실행 중',
  temporary: '임시 저장만 가능' };

export class MemorySaveStore {
  constructor({ durable = false } = {}) { this.durable = durable; this.kind = 'memory'; this.records = new Map(); }
  async get(key) { return clone(this.records.get(key) ?? null); }
  async put(key, value) { this.records.set(key, clone(value)); }
  async delete(key) { this.records.delete(key); }
  close() {}
}

class IndexedSaveStore {
  constructor(db) { this.db = db; this.durable = true; this.kind = 'indexeddb'; }
  get(key) { return this.operation('readonly', store => store.get(key)); }
  put(key, value) { return this.operation('readwrite', store => store.put(value, key)); }
  delete(key) { return this.operation('readwrite', store => store.delete(key)); }
  operation(mode, run) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction('records', mode);
      const request = run(transaction.objectStore('records'));
      let value;
      request.onsuccess = () => { value = request.result; };
      transaction.oncomplete = () => resolve(value ?? null);
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error('기기 저장 실패'));
    });
  }
  close() { this.db.close(); }
}

class LocalSaveStore {
  constructor(storage) { this.storage = storage; this.durable = true; this.kind = 'localstorage'; }
  async get(key) { const raw = this.storage.getItem(`${DB_NAME}:${key}`); return raw ? JSON.parse(raw) : null; }
  async put(key, value) { this.storage.setItem(`${DB_NAME}:${key}`, JSON.stringify(value)); }
  async delete(key) { this.storage.removeItem(`${DB_NAME}:${key}`); }
  close() {}
}

async function openStorage() {
  try {
    if (!globalThis.indexedDB) throw new Error('IndexedDB unavailable');
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('records')) request.result.createObjectStore('records'); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('기기 저장소가 다른 탭에서 사용 중입니다.'));
    });
    return new IndexedSaveStore(db);
  } catch {
    try {
      const storage = globalThis.localStorage;
      storage.setItem(`${DB_NAME}:probe`, '1'); storage.removeItem(`${DB_NAME}:probe`);
      return new LocalSaveStore(storage);
    } catch { return new MemorySaveStore(); }
  }
}

export function normalizeCloudEndpoint(endpoint) {
  const url = new URL(String(endpoint || '').trim());
  if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' ||
      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec\/?$/.test(url.pathname) || url.username || url.password || url.search || url.hash) {
    throw new Error('Apps Script의 https://script.google.com/macros/s/…/exec 주소를 입력해 주세요.');
  }
  return url.href.replace(/\/$/, '');
}

export async function fetchCloud(endpoint, body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(endpoint, { method: 'POST', credentials: 'omit', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok || response.type === 'opaque') throw new Error('저장 서버의 응답을 읽을 수 없습니다.');
    const data = await response.json();
    if (!data || data.apiVersion !== 1 || typeof data.ok !== 'boolean') throw new Error('저장 서버 응답 형식이 다릅니다.');
    return data;
  } finally { clearTimeout(timeout); }
}

/** Browser saves first. Cloud credentials are never part of an exported game save. */
export class SaveManager {
  constructor({ onStatus = () => {}, storage = null, transport = fetchCloud, autoSync = true, acquireTabLock = true } = {}) {
    this.onStatus = onStatus; this.storage = storage; this.transport = transport; this.autoSync = autoSync;
    this.acquireTabLock = acquireTabLock; this.record = EMPTY(); this.config = { endpoint: '', playerId: '', token: '' };
    this._tail = Promise.resolve(); this._flushPromise = null; this._loadPromise = null; this._initPromise = null; this._retryCount = 0;
    this._retryTimer = null; this._syncTimer = null; this.readOnly = false; this._disposed = false;
    this._online = () => { this._retryCount = 0; this.flush().catch(() => {}); };
  }
  _status(code, detail = '') {
    this.status = { code, label: LABELS[code] || code, detail };
    try { this.onStatus(this.status); } catch { /* UI callbacks must not interrupt persistence. */ }
  }
  async init() {
    if (this._initPromise) return this._initPromise;
    this._initPromise = (async () => {
      this.storage ||= await openStorage();
      if (this.acquireTabLock && globalThis.navigator?.locks?.request) {
        await new Promise(resolve => {
          navigator.locks.request('magic-typing-rpg-main-writer', { mode: 'exclusive', ifAvailable: true }, async lock => {
            if (!lock) { this.readOnly = true; resolve(); return; }
            await new Promise(release => { this._releaseTabLock = release; resolve(); });
          }).catch(() => resolve());
        });
      }
      const saved = await this.storage.get(RECORD_KEY);
      if (saved) {
        if (saved.version !== 1) throw new Error('지원하지 않는 기기 저장 버전입니다. 원본을 보존했습니다.');
        if (saved.current) valid(saved.current);
        if (saved.pending) valid(saved.pending.save);
        this.record = saved;
      }
      const config = await this.storage.get(CONFIG_KEY);
      if (config?.endpoint && config?.playerId) this.config = { ...config, token: '' };
      try {
        const session = JSON.parse(globalThis.sessionStorage?.getItem(SESSION_KEY) || 'null');
        if (session && session.identity === this._identity()) this.config.token = session.token;
      } catch { /* A missing session token just requires sign-in again. */ }
      globalThis.addEventListener?.('online', this._online);
      if (this.readOnly) this._status('readonly', '저장을 변경하려면 이 게임의 다른 탭을 닫고 새로고침해 주세요.');
      else if (!this.storage.durable) this._status('temporary', '브라우저 저장소를 사용할 수 없습니다. 새로고침하면 진행이 사라집니다.');
      else if (this.record.blocked === 'REVISION_CONFLICT') this._status('conflict', '기기 진행과 서버 진행을 각각 보존했습니다.');
      else if (this.record.current) this._status(this.record.pending ? 'pending' : 'local', this.storage.kind === 'localstorage' ? '호환 저장소 사용 중' : '');
      return this;
    })().catch(error => { this._status('error', error.message); throw error; });
    return this._initPromise;
  }
  _identity() { return `${this.config.endpoint}|${this.config.playerId}`; }
  _mutate(change) {
    const operation = this._tail.then(async () => {
      if (this.readOnly) throw new Error('다른 탭에서 게임을 실행 중이므로 이 탭에서는 저장할 수 없습니다.');
      const next = clone(this.record);
      change(next);
      await this.storage.put(RECORD_KEY, next);
      this.record = next;
      return next;
    });
    this._tail = operation.catch(() => {});
    return operation.catch(error => { this._status('error', error.message); throw error; });
  }
  async load() { await this.init(); await this._tail; return clone(this.record.current); }
  async persist(save) {
    await this.init();
    const copy = valid(clone(save));
    await this._mutate(record => { record.current = copy; record.localVersion++; });
    if (!this.storage.durable) {
      this._status('temporary', '진행을 파일로 내보내 주세요. 이 기기에는 영구 저장되지 않았습니다.');
      throw new Error('기기 저장소를 사용할 수 없습니다. 저장 파일 내보내기가 필요합니다.');
    }
    this._status(this.record.blocked === 'REVISION_CONFLICT' ? 'conflict' : 'local');
    if (this.autoSync && this.getCloudConfig().configured && !this.record.blocked) {
      clearTimeout(this._syncTimer);
      this._syncTimer = setTimeout(() => this.flush().catch(() => {}), 500);
    }
    return { durable: true, pending: this.record.localVersion > this.record.ackedLocalVersion };
  }
  async configureCloud({ endpoint = '', playerId = '', token = '' } = {}) {
    await this.init();
    if (this._flushPromise) await this._flushPromise;
    if (this._loadPromise) await this._loadPromise;
    if (!endpoint && !playerId && !token) {
      this.config = { endpoint: '', playerId: '', token: '' };
      await this.storage.delete(CONFIG_KEY);
      try { globalThis.sessionStorage?.removeItem(SESSION_KEY); } catch {}
      this._status('local', '클라우드 연결 해제');
      return this.getCloudConfig();
    }
    const normalized = normalizeCloudEndpoint(endpoint);
    if (!/^[A-Za-z0-9_-]{3,64}$/.test(playerId)) throw new Error('플레이어 ID는 영문·숫자·밑줄·하이픈 3~64자로 입력해 주세요.');
    if (typeof token !== 'string' || token.length < 32 || token.length > 256) throw new Error('발급받은 개인 저장 키를 입력해 주세요.');
    const identity = `${normalized}|${playerId}`;
    await this._mutate(record => {
      if (record.cloudIdentity !== identity) {
        record.lastAck = { revision: 0, savedAt: null }; record.ackedLocalVersion = 0;
        record.pending = null; record.remoteCandidate = null; record.cloudIdentity = identity; record.blocked = null;
      }
      if (record.blocked !== 'REVISION_CONFLICT') record.blocked = null;
    });
    this.config = { endpoint: normalized, playerId, token };
    await this.storage.put(CONFIG_KEY, { endpoint: normalized, playerId });
    try { globalThis.sessionStorage?.setItem(SESSION_KEY, JSON.stringify({ identity, token })); } catch {}
    this._retryCount = 0;
    this._status('local', '연결 정보를 등록했습니다. 서버 저장을 불러오거나 동기화해 주세요.');
    return this.getCloudConfig();
  }
  getCloudConfig() { return { endpoint: this.config.endpoint, playerId: this.config.playerId,
    configured: Boolean(this.config.endpoint && this.config.playerId && this.config.token) }; }
  async flush() {
    await this.init(); if (this._loadPromise) await this._loadPromise; await this._tail;
    if (this._flushPromise) return this._flushPromise;
    clearTimeout(this._retryTimer); clearTimeout(this._syncTimer);
    if (!this.getCloudConfig().configured) { this._status('local', '클라우드 미연결'); return { ok: false, reason: 'NOT_CONFIGURED' }; }
    if (this.readOnly) return { ok: false, reason: 'READ_ONLY' };
    if (!this.storage.durable) { this._status('temporary', '기기에 요청을 보관할 수 없어 동기화를 중단했습니다.'); return { ok: false, reason: 'STORAGE_UNAVAILABLE' }; }
    if (this.record.blocked) {
      this._status(this.record.blocked === 'REVISION_CONFLICT' ? 'conflict' : 'error', '서버 저장을 확인하거나 연결 정보를 수정해 주세요.');
      return { ok: false, reason: this.record.blocked };
    }
    this._flushPromise = this._flush().finally(() => { this._flushPromise = null; });
    return this._flushPromise;
  }
  async _flush() {
    try {
      for (let pass = 0; pass < 3; pass++) {
        if (!this.record.current || (!this.record.pending && this.record.localVersion <= this.record.ackedLocalVersion)) {
          this._status(this.record.lastAck.savedAt ? 'synced' : 'local'); return { ok: true };
        }
        if (!this.record.pending) {
          const requestId = crypto.randomUUID();
          await this._mutate(record => { record.pending = { apiVersion: 1, operation: 'save', playerId: this.config.playerId,
            slotId: 'main', requestId, baseRevision: record.lastAck.revision, save: clone(record.current), localVersion: record.localVersion }; });
        }
        const pending = clone(this.record.pending);
        const { localVersion: ignored, ...request } = pending;
        this._status('syncing');
        const response = await this.transport(this.config.endpoint, { ...request, authToken: this.config.token });
        if (!response?.ok) {
          const code = response?.error?.code || 'TEMPORARY_FAILURE';
          if (response?.error?.retryable) throw new Error('잠시 후 다시 동기화합니다.');
          await this._mutate(record => { record.blocked = code; });
          this._status(code === 'REVISION_CONFLICT' ? 'conflict' : 'error', response?.error?.message || '서버 저장을 확인해 주세요.');
          return { ok: false, reason: code };
        }
        if (response.apiVersion !== 1 || response.requestId !== pending.requestId ||
            response.revision !== pending.baseRevision + 1 || typeof response.savedAt !== 'string') throw new Error('저장 확인 응답이 일치하지 않습니다.');
        await this._mutate(record => {
          if (record.pending?.requestId !== pending.requestId) throw new Error('진행 중인 저장 요청이 변경되었습니다.');
          record.lastAck = { revision: response.revision, savedAt: response.savedAt };
          record.ackedLocalVersion = pending.localVersion;
          record.pending = null; record.blocked = null;
          // current is deliberately untouched: a newer snapshot may have arrived while awaiting the network.
        });
        this._retryCount = 0;
      }
      this._status('pending', '새 진행을 이어서 동기화합니다.');
      this._retry(); return { ok: true, pending: true };
    } catch {
      this._status('pending', '기기 저장은 유지됩니다. 연결 복구 후 동일 요청으로 재시도합니다.');
      this._retry(); return { ok: false, reason: 'TEMPORARY_FAILURE' };
    }
  }
  _retry() {
    if (!this.autoSync || this._disposed || this._retryCount >= 5) return;
    const wait = Math.min(30000, 2000 * (2 ** this._retryCount++)) + Math.floor(Math.random() * 500);
    this._retryTimer = setTimeout(() => this.flush().catch(() => {}), wait);
  }
  async loadCloud(options = {}) {
    await this.init();
    if (this._loadPromise) return this._loadPromise;
    if (this._flushPromise) await this._flushPromise;
    clearTimeout(this._retryTimer); clearTimeout(this._syncTimer);
    this._loadPromise = this._loadCloud(options).finally(() => { this._loadPromise = null; });
    return this._loadPromise;
  }
  async _loadCloud({ replaceLocal = false } = {}) {
    await this._tail;
    if (!this.getCloudConfig().configured) throw new Error('클라우드 연결 정보를 먼저 입력해 주세요.');
    const response = await this.transport(this.config.endpoint, { apiVersion: 1, operation: 'load',
      playerId: this.config.playerId, slotId: 'main', authToken: this.config.token });
    if (!response?.ok) {
      if (response?.error?.code === 'NOT_FOUND') return null;
      this._status('error', response?.error?.message || '서버 저장을 불러오지 못했습니다.');
      throw new Error(response?.error?.message || '서버 저장을 불러오지 못했습니다.');
    }
    if (response.apiVersion !== 1 || !Number.isSafeInteger(response.revision) || response.revision < 1 || typeof response.savedAt !== 'string') throw new Error('서버 저장 응답 형식이 다릅니다.');
    const save = valid(clone(response.save));
    const dirty = this.record.current && (this.record.pending || this.record.localVersion > this.record.ackedLocalVersion);
    if (dirty && !replaceLocal) {
      await this._mutate(record => { record.remoteCandidate = { save, revision: response.revision, savedAt: response.savedAt }; record.blocked = 'REVISION_CONFLICT'; });
      this._status('conflict', '새 기기 진행을 내보낸 뒤 서버 진행으로 바꿀 수 있습니다.');
      const error = new Error('동기화되지 않은 기기 진행이 있습니다. 내보낸 뒤 서버 진행으로 교체해 주세요.'); error.code = 'REVISION_CONFLICT'; throw error;
    }
    await this._mutate(record => {
      record.current = save; record.localVersion++; record.ackedLocalVersion = record.localVersion;
      record.lastAck = { revision: response.revision, savedAt: response.savedAt };
      record.pending = null; record.blocked = null; record.remoteCandidate = null;
    });
    this._status('synced'); return clone(save);
  }
  exportSave() {
    if (!this.record.current) throw new Error('내보낼 진행이 없습니다.');
    return JSON.stringify(this.record.current, null, 2);
  }
  async importSave(json) {
    if (typeof json !== 'string' || json.length > 120000) throw new Error('저장 파일이 너무 크거나 형식이 다릅니다.');
    const save = valid(JSON.parse(json)); await this.persist(save); return clone(save);
  }
  async resetLocal() {
    await this.init(); if (this._flushPromise) await this._flushPromise;
    if (this._loadPromise) await this._loadPromise;
    clearTimeout(this._retryTimer); clearTimeout(this._syncTimer);
    await this._mutate(record => Object.assign(record, EMPTY()));
    await this.configureCloud({});
    this._status('local', '새 여행을 준비합니다. 기존 서버 저장은 삭제하지 않았습니다.');
  }
  dispose() {
    this._disposed = true; clearTimeout(this._retryTimer); clearTimeout(this._syncTimer);
    globalThis.removeEventListener?.('online', this._online); this._releaseTabLock?.(); this.storage?.close();
  }
}
