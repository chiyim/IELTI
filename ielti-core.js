(function (global) {
  'use strict';
  const THEME_KEY = 'ielti_theme_v1';
  const DISPLAY_KEY = 'ielti_display_mode_v1';
  const displayModes = ['light', 'dark', 'eink'];
  const probablyEink = () => {
    const ua = navigator.userAgent || '';
    return !!global.matchMedia?.('(monochrome)').matches || /(onyx|boox|hisense|moaan|inkpalm|meebook|bigme|reinkstone|dasung|paperwhite|kindle)/i.test(ua);
  };
  const normalizeDisplayMode = mode => displayModes.includes(mode) ? mode : 'light';
  const savedDisplay = localStorage.getItem(DISPLAY_KEY) || (localStorage.getItem(THEME_KEY) === 'eink' ? 'eink' : null) || (probablyEink() ? 'eink' : null) || localStorage.getItem(THEME_KEY);
  function applyDisplayMode(mode, persist = true) {
    const current = normalizeDisplayMode(mode);
    document.documentElement.dataset.display = current;
    document.documentElement.dataset.theme = current === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('eink-mode', current === 'eink');
    if (persist) {
      localStorage.setItem(DISPLAY_KEY, current);
      localStorage.setItem(THEME_KEY, current === 'eink' ? 'light' : current);
    }
    return current;
  }
  applyDisplayMode(savedDisplay, false);
  const CONFIG = global.IELTI_CONFIG || {};
  const KEY = 'ielti_progress_v3';
  const DEFAULT_SYNC_URL = 'https://word-sync.chilamc-y.workers.dev';
  const SYNC_SCOPE = CONFIG.syncScope || 'ielti-chilam-personal-site-v1';
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
  const NAS_HTTP_ORIGIN = 'http://192.168.10.115';
  const NAS_HTTPS_ORIGIN = '';
  const isFilePage = location.protocol === 'file:';
  const isDevHost = LOCAL_HOSTS.has(location.hostname);
  const isLocalPage = isFilePage || isDevHost;
  const DEFAULT_ICON = isFilePage ? 'icon_local.png' : 'icon.png';
  const trimSlash = value => String(value || '').replace(/\/+$/, '');
  const withSlash = value => trimSlash(value) ? trimSlash(value) + '/' : '';
  const NAS_BASE_URL = withSlash(CONFIG.nasBaseUrl || `${NAS_HTTP_ORIGIN}/IELTI/`);
  const NAS_HTTPS_BASE_URL = withSlash(CONFIG.nasHttpsBaseUrl || (NAS_HTTPS_ORIGIN ? `${NAS_HTTPS_ORIGIN}/IELTI/` : ''));
  const currentIsNas = location.hostname === '192.168.10.115';
  const fallbackSyncUrl = Object.prototype.hasOwnProperty.call(CONFIG, 'cloudSyncFallbackUrl') ? CONFIG.cloudSyncFallbackUrl : DEFAULT_SYNC_URL;
  const configuredSyncUrl = CONFIG.syncUrl || fallbackSyncUrl;
  const sameNasHost = () => {
    try { return NAS_BASE_URL && new URL(NAS_BASE_URL).hostname === location.hostname; } catch { return false; }
  };
  function pickSyncUrl() {
    const wanted = configuredSyncUrl || fallbackSyncUrl;
    if (!wanted) return '';
    try {
      const url = new URL(wanted, location.href);
      if (location.protocol === 'https:' && url.protocol === 'http:') {
        if (NAS_HTTPS_BASE_URL) return new URL('ielti-sync.php', NAS_HTTPS_BASE_URL).href;
        return fallbackSyncUrl && fallbackSyncUrl !== wanted ? fallbackSyncUrl : '';
      }
      return url.href;
    } catch { return fallbackSyncUrl; }
  }
  const SYNC_URL = pickSyncUrl();
  const SYNC_BLOCKED_BY_MIXED_CONTENT = !!configuredSyncUrl && !SYNC_URL && location.protocol === 'https:';
  const CLOUD_SYNC_ENABLED = !!SYNC_URL && !isDevHost;
  const SYNC_DIRTY_KEY = 'ielti_sync_dirty_v1';
  const BACKUP_KEYS = ['ielti_progress_v3', 'ielts_g_plan_progress_v2', 'ielts_g_plan_start_v1', 'ielts_vocab_mastered_v1', 'wclass_known_v1', 'wclass_familiar_v1', 'ielts_srs_v2', 'ielts_review_prefs_v1', 'ielti_phonics_121_v1'];
  const DAY = 86400000;
  const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const nowIso = () => new Date().toISOString();
  function resolveMediaUrl(path) {
    if (!path) return '';
    try {
      const raw = String(path);
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
      if (location.protocol === 'file:') {
        return new URL(`../${raw.replace(/^(?:\.\/)+/, '')}`, location.href).href;
      }
      if (sameNasHost()) return raw;
      const base = NAS_BASE_URL;
      return base ? new URL(raw, base).href : raw;
    } catch {
      return String(path);
    }
  }
  function applyRuntimeIcon() {
    const setIconLink = (selector, rel) => {
      let link = document.querySelector(selector);
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        document.head.appendChild(link);
      }
      link.href = DEFAULT_ICON;
      if (rel === 'icon') link.type = 'image/png';
    };
    setIconLink('link[rel~="icon"]', 'icon');
    setIconLink('link[rel="apple-touch-icon"]', 'apple-touch-icon');
  }
  const fresh = () => ({ version: 3, deviceId: global.crypto?.randomUUID ? global.crypto.randomUUID() : String(Date.now()), updatedAt: nowIso(), roadmap: { startDate: '', completed: {} }, vocab: { core: {}, class: {} }, phonics: { learned: [], reviews: [], quiz: { right: 0, total: 0 } }, activity: {} });
  let model = parse(KEY, null) || fresh();
  model.roadmap ||= { startDate: '', completed: {} };
  model.roadmap.completed ||= {};
  model.vocab ||= { core: {}, class: {} };
  model.vocab.core ||= {};
  model.vocab.class ||= {};
  model.phonics ||= { learned: [], reviews: [], quiz: { right: 0, total: 0 } };
  model.phonics.learned ||= [];
  model.phonics.reviews ||= [];
  model.phonics.quiz ||= { right: 0, total: 0 };
  model.activity ||= {};

  function normalizeCard(card = {}) {
    return { reps: card.reps || card.level || 0, lapses: card.lapses || 0, interval: card.interval || 0, ease: card.ease || 2.5, due: card.due || null, lastReviewed: card.lastReviewed || card.last || null, familiar: !!card.familiar, mastered: !!card.mastered, familiarUpdatedAt: card.familiarUpdatedAt || null, masteredUpdatedAt: card.masteredUpdatedAt || null };
  }
  const wordPart = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const wordId = word => [word.day, word.group, word.en].map(wordPart).join('|');
  function migrateClassWords(words = []) {
    const deck = model.vocab.class ||= {}, legacySrs = parse('ielts_srs_v2', {}), legacyFamiliar = new Set([...parse('wclass_known_v1', []), ...parse('wclass_familiar_v1', [])]);
    const migrated = {};
    const strongest = cards => cards.filter(Boolean).map(normalizeCard).sort((a, b) => {
      const time = new Date(b.lastReviewed || 0) - new Date(a.lastReviewed || 0);
      return time || (b.reps - a.reps) || (b.interval - a.interval);
    })[0] || normalizeCard();
    words.forEach(word => {
      const canonical = wordId(word), reviewLegacy = `${word.en}|${word.zh}`, browseLegacy = `${word.day}|${word.group}|${word.en}|${word.zh}`;
      const reviewed = strongest([deck[canonical], deck[reviewLegacy], legacySrs[canonical], legacySrs[reviewLegacy]]);
      reviewed.familiar = reviewed.familiar || !!deck[browseLegacy]?.familiar || !!deck[browseLegacy]?.mastered || legacyFamiliar.has(canonical) || legacyFamiliar.has(browseLegacy);
      migrated[canonical] = reviewed;
    });
    const changed = JSON.stringify(deck) !== JSON.stringify(migrated);
    model.vocab.class = migrated;
    localStorage.setItem('ielts_srs_v2', JSON.stringify(migrated));
    localStorage.setItem('wclass_familiar_v1', JSON.stringify(Object.keys(migrated).filter(id => migrated[id].familiar)));
    if (changed) save();
    return migrated;
  }
  function migrate() {
    let changed = !localStorage.getItem(KEY);
    const road = parse('ielts_g_plan_progress_v2', {});
    if (!Object.keys(model.roadmap.completed).length && Object.keys(road).length) { model.roadmap.completed = road; changed = true; }
    const start = localStorage.getItem('ielts_g_plan_start_v1');
    if (!model.roadmap.startDate && start) { model.roadmap.startDate = start; changed = true; }
    const core = parse('ielts_vocab_mastered_v1', {});
    Object.keys(core).forEach(id => { if (core[id] && !model.vocab.core[id]) { model.vocab.core[id] = normalizeCard({ reps: 3, interval: 30, mastered: true }); changed = true; } });
    const known = [...new Set([...parse('wclass_known_v1', []), ...parse('wclass_familiar_v1', [])])];
    known.forEach(id => { if (!model.vocab.class[id]) { model.vocab.class[id] = normalizeCard({ reps: 3, interval: 30, mastered: true }); changed = true; } });
    const srs = parse('ielts_srs_v2', {});
    Object.entries(srs).forEach(([id, card]) => { if (!model.vocab.class[id]) { model.vocab.class[id] = normalizeCard(card); changed = true; } });
    const phonics = normalizePhonics(parse('ielti_phonics_121_v1', {}));
    if (phonics.learned.length || phonics.reviews.length || phonics.quiz.total) {
      const current = normalizePhonics(model.phonics);
      model.phonics = { learned: [...new Set([...current.learned, ...phonics.learned])], reviews: [...new Set([...current.reviews, ...phonics.reviews])], quiz: { right: Math.max(current.quiz.right, phonics.quiz.right), total: Math.max(current.quiz.total, phonics.quiz.total) } };
      changed = true;
    }
    if (changed) save(false);
  }
  function mirrorLegacyProgress() {
    localStorage.setItem('ielts_g_plan_progress_v2', JSON.stringify(model.roadmap.completed || {}));
    if (model.roadmap.startDate) localStorage.setItem('ielts_g_plan_start_v1', model.roadmap.startDate);
    localStorage.setItem('ielts_vocab_mastered_v1', JSON.stringify(Object.fromEntries(Object.entries(model.vocab.core || {}).filter(([, card]) => card?.mastered).map(([id]) => [id, true]))));
    localStorage.setItem('ielts_srs_v2', JSON.stringify(model.vocab.class || {}));
    const familiarIds = Object.entries(model.vocab.class || {}).filter(([, card]) => card?.familiar).map(([id]) => id);
    localStorage.setItem('wclass_known_v1', JSON.stringify(familiarIds));
    localStorage.setItem('wclass_familiar_v1', JSON.stringify(familiarIds));
    localStorage.setItem('ielti_phonics_121_v1', JSON.stringify(normalizePhonics(model.phonics)));
  }
  function save(emit = true) { model.updatedAt = nowIso(); mirrorLegacyProgress(); localStorage.setItem(KEY, JSON.stringify(model)); if (emit) global.dispatchEvent(new CustomEvent('ielti-progress', { detail: model })); }
  function markActivity(kind) { const day = new Date().toISOString().slice(0, 10); model.activity[day] ||= { reviews: 0, courses: 0 }; model.activity[day][kind] = (model.activity[day][kind] || 0) + 1; }
  function reviewCard(deck, id, rating) {
    const cards = model.vocab[deck] ||= {};
    const card = normalizeCard(cards[id]);
    const now = Date.now();
    if (rating === 0) { card.reps = 0; card.lapses += 1; card.interval = 0; card.ease = Math.max(1.3, card.ease - 0.2); card.due = new Date(now + 10 * 60000).toISOString(); card.mastered = false; }
    else {
      card.reps += 1;
      if (rating === 1) { card.ease = Math.max(1.3, card.ease - 0.15); card.interval = Math.max(1, Math.round((card.interval || 1) * 1.2)); }
      if (rating === 2) { card.interval = card.reps === 1 ? 1 : card.reps === 2 ? 3 : Math.max(4, Math.round(card.interval * card.ease)); }
      if (rating === 3) { card.ease += 0.15; card.interval = card.reps === 1 ? 4 : Math.max(7, Math.round((card.interval || 3) * card.ease * 1.3)); }
      card.due = new Date(now + card.interval * DAY).toISOString();
    }
    card.lastReviewed = nowIso(); card.mastered = card.reps >= 3 && card.interval >= 21; cards[id] = card; markActivity('reviews'); save(); return card;
  }
  function setRoadmap(completed, startDate) { model.roadmap.completed = completed || {}; if (typeof startDate === 'string') model.roadmap.startDate = startDate; save(); }
  function setMastered(deck, ids) { const cards = model.vocab[deck] ||= {}, stamp = nowIso(); const wanted = new Set(ids); Object.keys(cards).forEach(id => { if (cards[id].mastered && !wanted.has(id)) cards[id] = normalizeCard({ ...cards[id], mastered: false, masteredUpdatedAt: stamp }); }); wanted.forEach(id => { cards[id] = normalizeCard({ ...cards[id], reps: Math.max(3, cards[id]?.reps || 0), interval: Math.max(30, cards[id]?.interval || 0), mastered: true, masteredUpdatedAt: cards[id]?.mastered ? cards[id]?.masteredUpdatedAt : stamp }); }); save(); }
  function setFamiliar(deck, id, familiar) { const cards = model.vocab[deck] ||= {}, current = normalizeCard(cards[id]); cards[id] = normalizeCard({ ...current, familiar, familiarUpdatedAt: current.familiar === familiar ? current.familiarUpdatedAt : nowIso() }); save(); return cards[id]; }
  function setFamiliarList(deck, ids) { const cards = model.vocab[deck] ||= {}, wanted = new Set(ids), stamp = nowIso(); Object.keys(cards).forEach(id => { const current = normalizeCard(cards[id]), familiar = wanted.has(id); cards[id] = normalizeCard({ ...current, familiar, familiarUpdatedAt: current.familiar === familiar ? current.familiarUpdatedAt : stamp }); }); wanted.forEach(id => { const current = normalizeCard(cards[id]); cards[id] = normalizeCard({ ...current, familiar: true, familiarUpdatedAt: current.familiar ? current.familiarUpdatedAt : stamp }); }); save(); }
  function replaceDeck(deck, cards) { model.vocab[deck] = Object.fromEntries(Object.entries(cards || {}).map(([id, card]) => [id, normalizeCard(card)])); save(); }
  function normalizePhonics(value = {}) {
    const learned = Array.isArray(value.learned) ? [...new Set(value.learned.filter(Boolean))] : [];
    const reviews = Array.isArray(value.reviews) ? [...new Set(value.reviews.filter(Boolean))] : [];
    const quiz = value.quiz && typeof value.quiz === 'object' ? value.quiz : {};
    return { learned, reviews, quiz: { right: Math.max(0, Number(quiz.right) || 0), total: Math.max(0, Number(quiz.total) || 0) } };
  }
  function getPhonics() { return normalizePhonics(model.phonics); }
  function setPhonics(value) { model.phonics = normalizePhonics(value); save(); return model.phonics; }
  function getDeck(deck) { return model.vocab[deck] || {}; }
  function dueCount(deck) { const now = Date.now(); return Object.values(getDeck(deck)).filter(c => c.due && new Date(c.due).getTime() <= now).length; }
  function summary() { const completed = Object.values(model.roadmap.completed).filter(Boolean).length; const core = Object.values(model.vocab.core); const cls = Object.values(model.vocab.class); const start = model.roadmap.startDate ? new Date(model.roadmap.startDate + 'T00:00:00') : null; const day = start ? Math.max(1, Math.floor((Date.now() - start.getTime()) / DAY) + 1) : 1; return { day, week: Math.min(26, Math.ceil(day / 7)), completed, coreMastered: core.filter(c => c.mastered).length, classMastered: cls.filter(c => c.mastered).length, due: dueCount('core') + dueCount('class'), today: model.activity[new Date().toISOString().slice(0, 10)] || { reviews: 0, courses: 0 } }; }
  function exportBackup() {
    const data = {};
    BACKUP_KEYS.forEach(key => { const value = localStorage.getItem(key); if (value !== null) data[key] = value; });
    const backup = { app: 'IELTI', version: 2, exportedAt: nowIso(), data };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `IELTI-all-progress-${nowIso().slice(0, 10)}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    return Object.keys(data).length;
  }
  async function importBackup(file) {
    const backup = JSON.parse(await file.text());
    if (backup?.app !== 'IELTI' || ![1, 2].includes(backup.version) || !backup.data || typeof backup.data !== 'object') throw new Error('备份文件格式不正确');
    const entries = BACKUP_KEYS.filter(key => typeof backup.data[key] === 'string').map(key => [key, backup.data[key]]);
    if (!entries.length) throw new Error('备份中没有可恢复的学习进度');
    entries.forEach(([key, value]) => localStorage.setItem(key, value));
    return entries.length;
  }
  function mergeCard(localCard, remoteCard) {
    const local = normalizeCard(localCard), remote = normalizeCard(remoteCard);
    const base = new Date(remote.lastReviewed || 0) > new Date(local.lastReviewed || 0) ? remote : local;
    const chooseFlag = (flag, stamp) => {
      const lt = new Date(local[stamp] || 0).getTime(), rt = new Date(remote[stamp] || 0).getTime();
      if (rt > lt) return { value: remote[flag], updatedAt: remote[stamp] };
      if (lt > rt) return { value: local[flag], updatedAt: local[stamp] };
      return { value: !!(local[flag] || remote[flag]), updatedAt: local[stamp] || remote[stamp] || null };
    };
    const familiar = chooseFlag('familiar', 'familiarUpdatedAt'), mastered = chooseFlag('mastered', 'masteredUpdatedAt');
    return normalizeCard({ ...base, familiar: familiar.value, familiarUpdatedAt: familiar.updatedAt, mastered: mastered.value, masteredUpdatedAt: mastered.updatedAt });
  }
  function merge(remote) { if (!remote || remote.version !== 3) return false; Object.entries(remote.roadmap?.completed || {}).forEach(([k, v]) => { if (v) model.roadmap.completed[k] = true; }); ['core', 'class'].forEach(deck => Object.entries(remote.vocab?.[deck] || {}).forEach(([id, card]) => { model.vocab[deck][id] = mergeCard(model.vocab[deck][id], card); })); if (remote.phonics) { const localPhonics = normalizePhonics(model.phonics), remotePhonics = normalizePhonics(remote.phonics); model.phonics = { learned: [...new Set([...localPhonics.learned, ...remotePhonics.learned])], reviews: [...new Set([...localPhonics.reviews, ...remotePhonics.reviews])], quiz: { right: Math.max(localPhonics.quiz.right, remotePhonics.quiz.right), total: Math.max(localPhonics.quiz.total, remotePhonics.quiz.total) } }; } Object.entries(remote.activity || {}).forEach(([day, activity]) => { const local = model.activity[day] ||= { reviews: 0, courses: 0 }; local.reviews = Math.max(local.reviews || 0, activity.reviews || 0); local.courses = Math.max(local.courses || 0, activity.courses || 0); }); if (!model.roadmap.startDate && remote.roadmap?.startDate) model.roadmap.startDate = remote.roadmap.startDate; save(); return true; }
  function hasCardProgress(card) {
    const c = normalizeCard(card);
    return !!(c.reps || c.lapses || c.interval || c.due || c.lastReviewed || c.familiar || c.mastered || c.familiarUpdatedAt || c.masteredUpdatedAt);
  }
  function compactModelForSync() {
    const compactDeck = deck => Object.fromEntries(Object.entries(model.vocab?.[deck] || {}).filter(([, card]) => hasCardProgress(card)).map(([id, card]) => [id, normalizeCard(card)]));
    const completed = Object.fromEntries(Object.entries(model.roadmap?.completed || {}).filter(([, value]) => value));
    return { ...model, roadmap: { startDate: model.roadmap?.startDate || '', completed }, vocab: { core: compactDeck('core'), class: compactDeck('class') }, phonics: normalizePhonics(model.phonics), activity: model.activity || {} };
  }

  let englishVoice = null, pendingSpeech = null;
  function pickEnglishVoice() { if (!('speechSynthesis' in global)) return null; const voices = speechSynthesis.getVoices(); englishVoice = voices.find(voice => /en[-_]US/i.test(voice.lang) && /(Samantha|Google US English|Microsoft.*(?:Aria|Jenny)|Aria|Jenny)/i.test(voice.name)) || voices.find(voice => /en[-_]US/i.test(voice.lang)) || voices.find(voice => /^en/i.test(voice.lang)) || null; return englishVoice; }
  function voicesReady() { pickEnglishVoice(); if (englishVoice && pendingSpeech) { const pending = pendingSpeech; pendingSpeech = null; speakEnglish(pending.text, pending.options); } }
  function speakEnglish(text, options = {}) { if (!text || !('speechSynthesis' in global)) return null; const voice = englishVoice || pickEnglishVoice(); if (!voice && speechSynthesis.getVoices().length === 0) { pendingSpeech = { text, options }; return null; } speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .9; utterance.pitch = 1; if (voice) utterance.voice = voice; if (options.element) { utterance.onstart = () => options.element.classList.add('playing'); utterance.onend = utterance.onerror = () => options.element.classList.remove('playing'); } speechSynthesis.speak(utterance); return utterance; }
  if ('speechSynthesis' in global) { pickEnglishVoice(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', voicesReady); else speechSynthesis.onvoiceschanged = voicesReady; }

  let syncTimer = null, syncing = false, resyncRequested = false, resyncPushRequested = false, applyingRemote = false;
  function syncStatus(text, state = '') { document.querySelectorAll('[data-ielti-sync],#syncState').forEach(el => { el.className = `ielti-sync-state ${state}`; el.textContent = `${CLOUD_SYNC_ENABLED ? '☁︎' : '◉'} ${text}`; }); }
  function syncErrorMessage(error) {
    const msg = String(error?.message || error || '');
    if (/Failed to fetch|Load failed|NetworkError/i.test(msg)) return '无法连接同步服务器';
    if (/returned html|Unexpected token.*</i.test(msg)) return '同步接口返回了网页，请确认地址包含 /IELTI/';
    if (/pull 401|push 401/.test(msg)) return '同步身份无效';
    if (/pull 404|push 404/.test(msg)) return '同步接口不存在';
    if (/pull 5|push 5/.test(msg)) return '同步服务器暂时出错';
    if (/pull 0|push 0/.test(msg)) return '同步请求被浏览器拦截';
    return `暂时无法同步：${msg || '稍后自动重试'}`;
  }
  function scheduleCloudPush() { if (!CLOUD_SYNC_ENABLED || applyingRemote) return; localStorage.setItem(SYNC_DIRTY_KEY, '1'); clearTimeout(syncTimer); syncTimer = setTimeout(() => autoSync(true), 3000); }
  async function readSyncJson(response, stage) {
    const text = await response.text();
    if (!response.ok) throw new Error(`${stage} ${response.status}`);
    try { return text ? JSON.parse(text) : {}; }
    catch (error) {
      if (/^\s*</.test(text)) throw new Error(`${stage} returned html`);
      throw error;
    }
  }
  const withPath = (base, path) => {
    try {
      const url = new URL(base);
      url.pathname = `${url.pathname.replace(/\/+$/, '')}/${path}`.replace(/^\/+/, '/');
      return url.href;
    } catch { return base; }
  };
  async function cloudPull() {
    const urls = [...new Set([SYNC_URL, withPath(SYNC_URL, 'pull')])];
    let lastError = null;
    for (const url of urls) {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${SYNC_SCOPE}` }, cache: 'no-store' });
      if ((response.status === 404 || response.status === 405) && url !== urls[urls.length - 1]) { lastError = new Error(`pull ${response.status}`); continue; }
      try {
        const remote = await readSyncJson(response, 'pull');
        if (remote.version === 3 && !remote.empty) { applyingRemote = true; try { merge(remote); } finally { applyingRemote = false; } return true; }
        return false;
      } catch (error) {
        if (/pull (404|405)/.test(String(error?.message || error)) && url !== urls[urls.length - 1]) { lastError = error; continue; }
        throw error;
      }
    }
    if (lastError) throw lastError;
    return false;
  }
  async function cloudPush() {
    const body = JSON.stringify(compactModelForSync());
    const attempts = [
      { url: SYNC_URL, method: 'POST' },
      { url: SYNC_URL, method: 'PUT' },
      { url: withPath(SYNC_URL, 'push'), method: 'POST' },
      { url: withPath(SYNC_URL, 'push'), method: 'PUT' }
    ].filter((item, index, list) => list.findIndex(other => other.url === item.url && other.method === item.method) === index);
    let lastError = null;
    for (const attempt of attempts) {
      const response = await fetch(attempt.url, { method: attempt.method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SYNC_SCOPE}` }, body });
      if ((response.status === 404 || response.status === 405) && attempt !== attempts[attempts.length - 1]) { lastError = new Error(`push ${response.status}`); continue; }
      try { await readSyncJson(response, 'push'); localStorage.removeItem(SYNC_DIRTY_KEY); return; }
      catch (error) {
        if (/push (404|405)/.test(String(error?.message || error)) && attempt !== attempts[attempts.length - 1]) { lastError = error; continue; }
        throw error;
      }
    }
    if (lastError) throw lastError;
  }
  async function autoSync(shouldPush = false) {
    if (SYNC_BLOCKED_BY_MIXED_CONTENT) { syncStatus('需要 NAS HTTPS 后才能自动同步', 'error'); return false; }
    if (!CLOUD_SYNC_ENABLED) { syncStatus('本地模式 · 进度仅保存在此浏览器'); return true; }
    if (!navigator.onLine) { syncStatus('离线，联网后自动同步'); return false; }
    if (syncing) { resyncRequested = true; resyncPushRequested ||= shouldPush; return false; }
    syncing = true; syncStatus('正在自动同步…');
    try {
      await cloudPull();
      if (shouldPush || localStorage.getItem(SYNC_DIRTY_KEY) === '1') await cloudPush();
      syncStatus('已自动同步', 'ok');
      return true;
    }
    catch (error) { console.warn('IELTI sync:', error, SYNC_URL); syncStatus(syncErrorMessage(error), 'error'); return false; }
    finally {
      syncing = false;
      if (resyncRequested) {
        const retryPush = resyncPushRequested;
        resyncRequested = false;
        resyncPushRequested = false;
        if (retryPush) scheduleCloudPush(); else autoSync(false);
      }
    }
  }
  const reducedMotion = () => global.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const motion = {
    flip(element, update) {
      if (reducedMotion() || !element.animate) { update(); return; }
      element.getAnimations().forEach(animation => animation.cancel());
      const current = getComputedStyle(element).transform;
      const out = element.animate([{ transform: current === 'none' ? 'perspective(900px) rotateY(0deg)' : current }, { transform: 'perspective(900px) rotateY(88deg)', offset: .82 }, { transform: 'perspective(900px) rotateY(90deg)' }], { duration: 170, easing: 'cubic-bezier(.32,.72,0,1)', fill: 'forwards' });
      out.onfinish = () => { update(); out.cancel(); element.animate([{ transform: 'perspective(900px) rotateY(-90deg)', opacity: .72 }, { transform: 'perspective(900px) rotateY(8deg)', opacity: 1, offset: .78 }, { transform: 'perspective(900px) rotateY(0deg)', opacity: 1 }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' }); };
    },
    commit(element, direction, update) {
      if (reducedMotion() || !element.animate) { update(); return; }
      element.getAnimations().forEach(animation => animation.cancel());
      const sign = direction === 0 ? -1 : direction === 3 ? 1 : 0;
      const out = element.animate([{ transform: getComputedStyle(element).transform === 'none' ? 'translate3d(0,0,0) scale(1)' : getComputedStyle(element).transform, opacity: 1 }, { transform: `translate3d(${sign * 18}px,-6px,0) scale(.985)`, opacity: .2 }], { duration: 150, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' });
      out.onfinish = () => { update(); out.cancel(); element.animate([{ transform: `translate3d(${-sign * 12}px,8px,0) scale(.985)`, opacity: 0 }, { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.16,1,.3,1)' }); };
    }
  };
  function installChrome() {
    document.body.classList.add('apple-ui');
    applyRuntimeIcon();
    const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    const pageClass = page === 'index.html' ? 'page-today' : page === 'ielts-roadmap.html' ? 'page-roadmap' : page === 'ielts-core-vocabulary.html' ? 'page-core' : page === 'ielts-vocabulary-categories.html' ? 'page-class' : page === 'ielts_word_memory_v2_ipa.html' ? 'page-review' : page === '121-letter-combinations.html' ? 'page-phonics' : '';
    if (pageClass) document.body.classList.add(pageClass);
    const syncPageTheme = () => document.body.classList.toggle('light', document.documentElement.dataset.theme === 'light');
    syncPageTheme();
    if (!document.querySelector('.apple-theme-toggle') && !document.getElementById('themeBtn')) {
      const toggle = document.createElement('button'); toggle.className = 'apple-theme-toggle'; toggle.type = 'button'; toggle.setAttribute('aria-label', '切换显示模式');
      const paint = () => { const mode = document.documentElement.dataset.display || document.documentElement.dataset.theme || 'light'; toggle.textContent = mode === 'eink' ? '墨' : mode === 'dark' ? '☀︎' : '◐'; toggle.title = `当前：${mode === 'eink' ? '墨水屏' : mode === 'dark' ? '深色' : '浅色'} · 点击切换显示模式`; toggle.setAttribute('aria-label', toggle.title); };
      paint();
      toggle.onclick = () => { const current = document.documentElement.dataset.display || document.documentElement.dataset.theme || 'light'; const next = displayModes[(displayModes.indexOf(current) + 1) % displayModes.length] || 'light'; applyDisplayMode(next); syncPageTheme(); paint(); };
      document.body.appendChild(toggle);
    }
    let avatarControl = null;
    if (!document.querySelector('.apple-tabbar')) {
      const current = page;
      const navIcon = name => {
        const paths = {
          today: '<path d="M5.8 11.2 12 5.8l6.2 5.4v6.3a2.1 2.1 0 0 1-2.1 2.1H7.9a2.1 2.1 0 0 1-2.1-2.1z"/><path d="M10 19.6v-4.3a2 2 0 0 1 4 0v4.3"/>',
          roadmap: '<rect x="5" y="5" width="14" height="14" rx="2.8"/><path d="M12 5v14"/><path d="M12 12h7"/>',
          core: '<rect x="5" y="5" width="14" height="14" rx="2.8"/><path d="m8.5 16 3.5-8 3.5 8"/><path d="M10 13h4"/>',
          review: '<path d="M12 5.2 13.5 9a2.6 2.6 0 0 0 1.5 1.5l3.8 1.5-3.8 1.5a2.6 2.6 0 0 0-1.5 1.5L12 18.8l-1.5-3.8A2.6 2.6 0 0 0 9 13.5L5.2 12 9 10.5A2.6 2.6 0 0 0 10.5 9z"/><path d="m17.4 4.5.45 1.1 1.1.45-1.1.45-.45 1.1-.45-1.1-1.1-.45 1.1-.45z"/>',
          phonics: '<rect x="5" y="5.5" width="6.5" height="6.5" rx="1.6"/><rect x="12.5" y="12" width="6.5" height="6.5" rx="1.6"/><path d="M11.5 8.75h1.7a2.3 2.3 0 0 1 2.3 2.3V12"/><path d="M12.5 15.25h-1.7a2.3 2.3 0 0 1-2.3-2.3V12"/>',
          class: '<rect x="5" y="5" width="14" height="14" rx="2.8"/><path d="M8.5 9h7"/><path d="M8.5 12h7"/><path d="M8.5 15h5.2"/>'
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
      };
      const tabs = [['index.html',navIcon('today'),'今日'],['ielts-roadmap.html',navIcon('roadmap'),'课程'],['ielts_word_memory_v2_ipa.html',navIcon('review'),'复习'],['121-letter-combinations.html',navIcon('phonics'),'组合'],['ielts-core-vocabulary.html',navIcon('core'),'词表'],['ielts-vocabulary-categories.html',navIcon('class'),'词库']];
      const nav = document.createElement('nav'); nav.className = 'apple-tabbar'; nav.setAttribute('aria-label','主要导航'); nav.innerHTML = `<i class="apple-nav-indicator" aria-hidden="true"></i>`+tabs.map(([href,icon,label]) => `<a href="${href}"${current === href ? ' class="active" aria-current="page"' : ''} aria-label="${label}" title="${label}"><span>${icon}</span><em>${label}</em></a>`).join(''); document.body.appendChild(nav);
      const rail = document.createElement('aside'); rail.className = 'apple-desktop-rail'; rail.setAttribute('aria-label', '桌面导航');
      const avatarKey = 'ielti_navigation_avatar_v1';
      const defaultAvatar = DEFAULT_ICON;
      const logo = document.createElement('button'); logo.type = 'button'; logo.className = 'apple-rail-logo'; logo.title = '点击更换头像；右键恢复默认头像'; logo.setAttribute('aria-label', '更换或重置头像'); logo.textContent = '';
      avatarControl = logo;
      const avatarInput = document.createElement('input'); avatarInput.type = 'file'; avatarInput.accept = 'image/*'; avatarInput.hidden = true;
      const applyAvatar = source => { const custom = Boolean(source); logo.classList.add('has-photo'); logo.classList.toggle('has-custom-photo', custom); logo.style.backgroundImage = `url("${source || defaultAvatar}")`; logo.textContent = ''; logo.title = custom ? '点击更换头像；右键恢复默认头像' : '点击上传个人头像'; };
      const resetAvatar = () => { try { localStorage.removeItem(avatarKey); } catch (_) { /* local storage is unavailable */ } applyAvatar(''); };
      try { applyAvatar(localStorage.getItem(avatarKey)); } catch (_) { applyAvatar(''); }
      logo.addEventListener('click', () => avatarInput.click());
      logo.addEventListener('contextmenu', event => { event.preventDefault(); if (!logo.classList.contains('has-custom-photo') || confirm('恢复默认头像？')) resetAvatar(); });
      avatarInput.addEventListener('change', async () => {
        const file = avatarInput.files && avatarInput.files[0]; avatarInput.value = '';
        if (!file || !file.type.startsWith('image/')) return;
        try {
          const image = await new Promise((resolve, reject) => { const img = new Image(); const url = URL.createObjectURL(file); img.onload = () => { URL.revokeObjectURL(url); resolve(img); }; img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); }; img.src = url; });
          const side = Math.min(image.naturalWidth, image.naturalHeight), canvas = document.createElement('canvas'); canvas.width = canvas.height = 320;
          canvas.getContext('2d').drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 320, 320);
          const source = canvas.toDataURL('image/jpeg', .84); localStorage.setItem(avatarKey, source); applyAvatar(source);
        } catch (_) { /* Keep the current avatar if the selected image cannot be processed. */ }
      });
      nav.before(rail); rail.append(nav); document.body.appendChild(avatarInput);
      const links=[...nav.querySelectorAll('a')],activeIndex=links.findIndex(link=>link.classList.contains('active')),storageKey='ielti_nav_previous_index',storedIndex=sessionStorage.getItem(storageKey);
      let previousIndex=storedIndex===null?activeIndex:Number(storedIndex);
      const snapPixel=value=>{const ratio=global.devicePixelRatio||1;return Math.round(value*ratio)/ratio;};
      const placeNavIndicator=()=>requestAnimationFrame(()=>{previousIndex=activeIndex;sessionStorage.setItem(storageKey,String(activeIndex));});
      const clearPress=()=>links.forEach(link=>link.classList.remove('is-pressing'));
      let navTap=null;
      const isMobileNav=()=>matchMedia('(max-width:760px)').matches;
      const sameUrl=href=>new URL(href,location.href).href===location.href;
      nav.addEventListener('pointerdown',event=>{const link=event.target?.closest?.('a');if(link&&nav.contains(link))link.classList.add('is-pressing');},{passive:true});
      nav.addEventListener('pointerdown',event=>{const link=event.target?.closest?.('a');navTap=link&&nav.contains(link)?{link,x:event.clientX,y:event.clientY}:null;},{passive:true});
      nav.addEventListener('pointermove',event=>{if(navTap&&Math.hypot(event.clientX-navTap.x,event.clientY-navTap.y)>14)navTap=null;},{passive:true});
      nav.addEventListener('pointerup',event=>{if(!isMobileNav()||!navTap)return;const link=event.target?.closest?.('a');if(link!==navTap.link||sameUrl(link.href)){navTap=null;return}event.preventDefault();link.classList.add('is-pressing');location.assign(link.href);navTap=null;},{capture:true});
      ['pointerup','pointercancel','pointerleave','blur'].forEach(type=>nav.addEventListener(type,clearPress,{passive:true}));
      nav.addEventListener('touchstart',event=>{const link=event.target?.closest?.('a');if(link&&nav.contains(link))link.classList.add('is-pressing');},{passive:true});
      nav.addEventListener('touchend',clearPress,{passive:true});
      nav.addEventListener('touchcancel',clearPress,{passive:true});
      placeNavIndicator();addEventListener('resize',placeNavIndicator,{passive:true});
    }
    const installMobileNavAutoHide = () => {
      const nav = document.querySelector('.apple-tabbar');
      if (!nav || nav.dataset.autoHideInstalled) return;
      nav.dataset.autoHideInstalled = 'true';
      const mobile = matchMedia('(max-width:760px)');
      const studyPage = pageClass === 'page-review' && document.body.classList.contains('small-square-device');
      let expandedByTap = false;
      let idleTimer = 0;
      let travel = 0;
      let ready = !studyPage;
      const setState = state => {
        const enabled = mobile.matches;
        document.body.classList.toggle('apple-nav-hidden', enabled && state === 'hidden');
        document.body.classList.toggle('apple-nav-compact', enabled && state === 'compact');
      };
      const stopIdleTimer = () => { if (idleTimer) clearTimeout(idleTimer); idleTimer = 0; };
      const hideStudyNav = () => {
        stopIdleTimer();
        if (!expandedByTap) setState('hidden');
      };
      const armStudyIdleTimer = () => {
        stopIdleTimer();
        if (!expandedByTap) idleTimer = setTimeout(hideStudyNav, 2200);
      };
      const revealStudyNav = () => {
        if (expandedByTap) return;
        setState('compact');
        armStudyIdleTimer();
      };
      let lastY = window.scrollY, down = 0, up = 0, ticking = false;
      const update = () => {
        ticking = false;
        if (!mobile.matches) { stopIdleTimer(); setState('full'); lastY = window.scrollY; return; }
        const y = Math.max(0, window.scrollY), delta = y - lastY;
        lastY = y;
        if (studyPage) {
          if (y <= 4 && delta < 0) {
            stopIdleTimer();
            travel = 0;
            setState('full');
            return;
          }
          if (!ready || expandedByTap || delta === 0) return;
          travel += Math.abs(delta);
          if (travel >= 88) { travel = 0; revealStudyNav(); }
          else if (document.body.classList.contains('apple-nav-compact')) armStudyIdleTimer();
          return;
        }
        if (y < 48) { down = 0; up = 0; expandedByTap = false; setState('full'); return; }
        if (delta > 0) { down += delta; up = 0; if (down > 28) { expandedByTap = false; setState('compact'); } }
        else if (delta < 0) { up -= delta; down = 0; if (up > 10 && !expandedByTap) setState('compact'); }
      };
      window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
      nav.addEventListener('click', event => {
        const link = event.target.closest('a.active');
        if (!mobile.matches || !document.body.classList.contains('apple-nav-compact') || !link || !nav.contains(link)) return;
        event.preventDefault();
        expandedByTap = true;
        stopIdleTimer();
        setState('full');
      });
      if (studyPage && mobile.matches) {
        setState('hidden');
        setTimeout(() => { ready = true; lastY = window.scrollY; travel = 0; setState('hidden'); }, 180);
      }
      mobile.addEventListener('change', () => {
        stopIdleTimer(); down = 0; up = 0; travel = 0; expandedByTap = false; ready = !studyPage || !mobile.matches;
        setState(studyPage && mobile.matches ? 'hidden' : 'full');
        if (studyPage && mobile.matches) setTimeout(() => { ready = true; lastY = window.scrollY; }, 180);
      });
    };
    installMobileNavAutoHide();
    const themeControl = document.querySelector('.apple-theme-toggle') || document.getElementById('themeBtn');
    avatarControl = avatarControl || document.querySelector('.apple-rail-logo');
    const titleRow = title => { if (!title) return null; let row = title.parentElement?.classList.contains('apple-mobile-title-row') ? title.parentElement : null; if (!row) { const host = title.parentElement; host?.classList.add('apple-mobile-title-host'); row = document.createElement('div'); row.className = 'apple-mobile-title-row'; title.before(row); row.append(title); } return row; };
    const pageTitle = () => pageClass === 'page-review' ? document.querySelector('.brand h1') : pageClass === 'page-class' ? document.querySelector('.page-title-brand h1') : document.querySelector('.top h1,.hero h1,.phonics-head h1');
    const placeAvatarControl = () => { if (!avatarControl) return; titleRow(pageTitle())?.append(avatarControl); };
    const placeThemeControl = () => { if (!themeControl) return; themeControl.style.removeProperty('top'); const desktop = matchMedia('(min-width:761px)').matches; if (desktop) { document.querySelector('.apple-tabbar')?.append(themeControl); } else if (pageClass === 'page-review') { titleRow(document.querySelector('.brand h1'))?.append(themeControl); } else if (pageClass === 'page-class') { titleRow(document.querySelector('.page-title-brand h1'))?.append(themeControl); } else titleRow(document.querySelector('.top h1,.hero h1,.phonics-head h1'))?.append(themeControl); };
    placeThemeControl(); placeAvatarControl(); matchMedia('(min-width:761px)').addEventListener('change', () => { placeThemeControl(); placeAvatarControl(); });
    if (!document.querySelector('[data-ielti-sync]') && !document.getElementById('syncState')) { const status = document.createElement('div'); status.dataset.ieltiSync = ''; status.className = 'ielti-sync-state'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); document.body.appendChild(status); }
    syncStatus(CLOUD_SYNC_ENABLED ? '准备自动同步…' : '本地模式 · 进度仅保存在此浏览器');
    requestAnimationFrame(() => document.documentElement.classList.remove('ielti-booting'));
  }
  migrate();
  mirrorLegacyProgress();
  global.IELTI = { KEY, get: () => model, save, merge, summary, wordId, migrateClassWords, getDeck, reviewCard, setRoadmap, setMastered, setFamiliar, setFamiliarList, replaceDeck, getPhonics, setPhonics, media: { resolve: resolveMediaUrl, nasBaseUrl: NAS_BASE_URL, nasHttpsBaseUrl: NAS_HTTPS_BASE_URL }, backup: { keys: [...BACKUP_KEYS], export: exportBackup, import: importBackup }, motion, speech: { speak: speakEnglish, pickVoice: pickEnglishVoice }, sync: { enabled: CLOUD_SYNC_ENABLED, url: SYNC_URL, run: autoSync, schedulePush: scheduleCloudPush } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installChrome); else installChrome();
  global.addEventListener('ielti-progress', scheduleCloudPush);
  if (CLOUD_SYNC_ENABLED) {
    global.addEventListener('online', () => autoSync(localStorage.getItem(SYNC_DIRTY_KEY) === '1'));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') autoSync(false); });
    setInterval(() => { if (document.visibilityState === 'visible') autoSync(false); }, 600000);
  }
  queueMicrotask(() => autoSync(localStorage.getItem(SYNC_DIRTY_KEY) === '1'));
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})(window);
