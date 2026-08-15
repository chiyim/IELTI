(function (global) {
  'use strict';
  const THEME_KEY = 'ielti_theme_v1';
  const DISPLAY_KEY = 'ielti_display_mode_v1';
  const displayModes = ['light', 'dark', 'eink'];
  const preferenceModes = ['auto', 'light', 'dark', 'eink'];
  const THEME_ICON = {
    auto:   '<circle cx="12" cy="12" r="8"/><path d="M12 4v16A8 8 0 0 0 12 4z" fill="currentColor" stroke="none"/>',
    light:  '<circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21"/><line x1="3" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21" y2="12"/><line x1="5.64" y1="5.64" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="18.36" y2="18.36"/><line x1="5.64" y1="18.36" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="18.36" y2="5.64"/>',
    dark:   '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    eink:   '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h4"/>',
  };
  const themeIconSvg = key => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:block;margin:0 auto">${THEME_ICON[key]}</svg>`;
  const timeBasedDisplay = () => { const hour = new Date().getHours(); return (hour >= 19 || hour < 7) ? 'dark' : 'light'; };
  const probablyEink = () => {
    const ua = navigator.userAgent || '';
    return !!global.matchMedia?.('(monochrome)').matches || /(onyx|boox|hisense|moaan|inkpalm|meebook|bigme|reinkstone|dasung|paperwhite|kindle)/i.test(ua);
  };
  const normalizeDisplayMode = mode => displayModes.includes(mode) ? mode : 'light';
  const savedDisplay = (() => {
    const pref = localStorage.getItem(DISPLAY_KEY);
    if (pref === 'light' || pref === 'dark' || pref === 'eink') return pref;
    if (probablyEink()) return 'eink';
    // legacy migration: only use THEME_KEY when DISPLAY_KEY is completely unset
    if (!pref) {
      const legacy = localStorage.getItem(THEME_KEY);
      if (legacy === 'dark' || legacy === 'light' || legacy === 'eink') return legacy;
    }
    return timeBasedDisplay();
  })();
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
  const NAS_HTTPS_ORIGIN = 'https://ds418play.tail6d2cd4.ts.net';
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
  const DUE_SNAPSHOT_KEY = 'ielti_due_snapshot_v1';
  const DEBUG_LOG_KEY = 'ielti_debug_log_v2';
  const VIDEO_WATCH_KEY = 'ielti_video_watch_v1';
  const BACKUP_KEYS = ['ielti_progress_v3', 'ielts_g_plan_progress_v2', 'ielts_g_plan_start_v1', 'ielti_video_watch_v1', 'ielts_vocab_mastered_v1', 'wclass_known_v1', 'wclass_familiar_v1', 'ielts_srs_v2', 'ielts_review_prefs_v1', 'ielti_phonics_121_v1'];
  const DAY = 86400000;
  const DEVICE_ID = (() => { let id = localStorage.getItem('ielti_device_id_v1'); if (!id) { id = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); localStorage.setItem('ielti_device_id_v1', id); } return id; })();
  const debugLog = (() => {
    const read = () => { try { const value = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY)); return Array.isArray(value) ? value : []; } catch { return []; } };
    const group = type => type === 'review' || type === 'queue_build' || type === 'daily_vocab_task_completed' ? 'activity' : /error$/.test(type) ? 'error' : 'sync';
    const prune = entries => {
      const now = Date.now(), rules = { activity: { max: 300, days: 7 }, sync: { max: 200, days: 14 }, error: { max: 200, days: 14 } };
      return Object.keys(rules).flatMap(kind => entries.filter(e => group(e.type) === kind && e.t >= now - rules[kind].days * DAY).slice(-rules[kind].max)).sort((a, b) => a.t - b.t);
    };
    const persist = entries => { const kept = prune(entries); localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(kept)); return kept; };
    function write(type, data = {}) { const t = Date.now(), eventId = `${DEVICE_ID}_${t.toString(36)}_${Math.random().toString(36).slice(2, 8)}`; const entry = { eventId, t, iso: new Date(t).toISOString(), type, device: DEVICE_ID, data }; persist(read().concat(entry)); return entry; }
    function download() { const entries = read(), blob = new Blob([entries.map(e => JSON.stringify(e)).join('\n') + (entries.length ? '\n' : '')], { type: 'application/x-ndjson' }), link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `IELTI-debug-${new Date().toISOString().slice(0, 10)}.jsonl`; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 1000); return entries.length; }
    const api = { write, tail: n => read().slice(-(n || 50)).reverse(), today: () => { const t0 = new Date(); t0.setHours(0, 0, 0, 0); return read().filter(e => e.t >= t0.getTime()); }, card: id => read().filter(e => e.data && (e.data.cardId === id || e.data.id === id)), clear: () => localStorage.removeItem(DEBUG_LOG_KEY), export: read, all: read, download, migrate: entries => persist(read().concat((entries || []).map(e => ({ ...e, eventId: e.eventId || `legacy_${e.device || 'unknown'}_${e.t}_${Math.random().toString(36).slice(2, 8)}`, iso: e.iso || new Date(e.t).toISOString() })))) };
    global.__IELTI_LOG__ = api;
    return api;
  })();

  const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const nowIso = () => new Date().toISOString();
  function resolveMediaUrl(path) {
    if (!path) return '';
    try {
      const raw = String(path);
      if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return raw;
      if (sameNasHost()) return raw;
      const base = NAS_HTTPS_BASE_URL || NAS_BASE_URL;
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
  const fresh = () => ({ version: 3, deviceId: global.crypto?.randomUUID ? global.crypto.randomUUID() : String(Date.now()), updatedAt: nowIso(), roadmap: { startDate: '', completed: {} }, videoWatch: {}, vocab: { core: {}, class: {} }, phonics: { learned: [], reviews: [], quiz: { right: 0, total: 0 } }, activity: {} });
  let model = parse(KEY, null) || fresh();
  model.roadmap ||= { startDate: '', completed: {} };
  model.videoWatch ||= {};
  model.roadmap.completed ||= {};
  model.vocab ||= { core: {}, class: {} };
  model.vocab.core ||= {};
  model.vocab.class ||= {};
  model.phonics ||= { learned: [], reviews: [], quiz: { right: 0, total: 0 } };
  model.phonics.learned ||= [];
  model.phonics.reviews ||= [];
  model.phonics.quiz ||= { right: 0, total: 0 };
  model.activity ||= {};
  model.meta ||= {};
  const hadEmbeddedDebugLog = Array.isArray(model._debugLog) && model._debugLog.length > 0;
  if (hadEmbeddedDebugLog) debugLog.migrate(model._debugLog);
  if (Object.prototype.hasOwnProperty.call(model, '_debugLog')) { delete model._debugLog; localStorage.setItem(KEY, JSON.stringify(model)); }

  function normalizeCard(card = {}) {
    return { reps: card.reps || card.level || 0, lapses: card.lapses || 0, interval: card.interval || 0, ease: card.ease || 2.5, due: card.due || null, lastReviewed: card.lastReviewed || card.last || null, familiar: !!card.familiar, mastered: !!card.mastered, familiarUpdatedAt: card.familiarUpdatedAt || null, masteredUpdatedAt: card.masteredUpdatedAt || null };
  }
  function isLongMastered(card) {
    const normalized = normalizeCard(card);
    return normalized.mastered && normalized.reps >= 3 && normalized.interval >= 21 && !!normalized.lastReviewed;
  }
  const wordPart = value => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const wordId = word => [word.day, word.group, word.en].map(wordPart).join('|');
  function migrateClassWords(words = []) {
    const deck = model.vocab.class ||= {}, legacySrs = parse('ielts_srs_v2', {}), legacyFamiliar = new Set(parse('wclass_familiar_v1', []));
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
  function demoteLegacyClassMastery() {
    let changed = false;
    const stamp = nowIso();
    Object.entries(model.vocab.class || {}).forEach(([id, value]) => {
      const card = normalizeCard(value);
      const convertedByPreviousMigration = !card.mastered && card.familiar && !card.lastReviewed && card.masteredUpdatedAt && card.masteredUpdatedAt === card.familiarUpdatedAt;
      if (convertedByPreviousMigration) {
        model.vocab.class[id] = normalizeCard({ ...card, familiar: false, familiarUpdatedAt: null });
        changed = true;
        return;
      }
      // A long-term status is valid only after a recorded SRS review sequence.
      const legacyPromotion = card.mastered && !isLongMastered(card);
      if (!legacyPromotion) return;
      model.vocab.class[id] = normalizeCard({ ...card, mastered: false, masteredUpdatedAt: stamp });
      changed = true;
    });
    return changed;
  }
  function migrate() {
    let changed = !localStorage.getItem(KEY), videoWatchMigrated = false;
    const road = parse('ielts_g_plan_progress_v2', {});
    if (!Object.keys(model.roadmap.completed).length && Object.keys(road).length) { model.roadmap.completed = road; changed = true; }
    const start = localStorage.getItem('ielts_g_plan_start_v1');
    if (!model.roadmap.startDate && start) { model.roadmap.startDate = start; changed = true; }
    const core = parse('ielts_vocab_mastered_v1', {});
    Object.keys(core).forEach(id => { if (core[id] && !model.vocab.core[id]) { model.vocab.core[id] = normalizeCard({ reps: 3, interval: 30, mastered: true }); changed = true; } });
    const known = parse('wclass_familiar_v1', []);
    known.forEach(id => { if (!model.vocab.class[id]) { model.vocab.class[id] = normalizeCard({ familiar: true }); changed = true; } });
    const srs = parse('ielts_srs_v2', {});
    Object.entries(srs).forEach(([id, card]) => { if (!model.vocab.class[id]) { model.vocab.class[id] = normalizeCard(card); changed = true; } });
    if (demoteLegacyClassMastery()) changed = true;
    const phonics = normalizePhonics(parse('ielti_phonics_121_v1', {}));
    if (phonics.learned.length || phonics.reviews.length || phonics.quiz.total) {
      const current = normalizePhonics(model.phonics);
      model.phonics = { learned: [...new Set([...current.learned, ...phonics.learned])], reviews: [...new Set([...current.reviews, ...phonics.reviews])], quiz: { right: Math.max(current.quiz.right, phonics.quiz.right), total: Math.max(current.quiz.total, phonics.quiz.total) } };
      changed = true;
    }
    const legacyVideoWatch = parse(VIDEO_WATCH_KEY, {});
    Object.entries(legacyVideoWatch).forEach(([id, entry]) => {
      const merged = mergeVideoWatchEntry(model.videoWatch[id], entry);
      if (JSON.stringify(merged) !== JSON.stringify(model.videoWatch[id] || null)) { model.videoWatch[id] = merged; changed = true; videoWatchMigrated = true; }
    });
    if (reconcileVideoCompletions()) { changed = true; videoWatchMigrated = true; }
    if (videoWatchMigrated && CLOUD_SYNC_ENABLED) localStorage.setItem(SYNC_DIRTY_KEY, '1');
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
    localStorage.setItem(VIDEO_WATCH_KEY, JSON.stringify(model.videoWatch || {}));
  }
  function save(emit = true) { enforceStudyDurationCorrections(); model.updatedAt = nowIso(); mirrorLegacyProgress(); localStorage.setItem(KEY, JSON.stringify(model)); if (emit) global.dispatchEvent(new CustomEvent('ielti-progress', { detail: model })); }
  const localDay = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };
  function normalizeDueSnapshot(value) {
    if (!value || typeof value !== 'object' || !/^\d{4}-\d{2}-\d{2}$/.test(value.day || '') || !Number.isFinite(Number(value.cutoff))) return null;
    return { day: value.day, cutoff: Number(value.cutoff), advancedAt: Number(value.advancedAt) || 0 };
  }
  function chooseDueSnapshot(localValue, remoteValue) {
    const local = normalizeDueSnapshot(localValue), remote = normalizeDueSnapshot(remoteValue);
    if (!local) return remote;
    if (!remote) return local;
    if (local.day !== remote.day) return local.day > remote.day ? local : remote;
    if (local.advancedAt || remote.advancedAt) return local.advancedAt >= remote.advancedAt ? local : remote;
    return local.cutoff <= remote.cutoff ? local : remote;
  }
  function dueSnapshot(advance = false) {
    const day = localDay(), now = Date.now();
    let snapshot = chooseDueSnapshot(parse(DUE_SNAPSHOT_KEY, null), model.meta?.dueSnapshot);
    if (!snapshot || snapshot.day !== day) snapshot = { day, cutoff: now, advancedAt: 0 };
    else if (advance) snapshot = { day, cutoff: now, advancedAt: now };
    localStorage.setItem(DUE_SNAPSHOT_KEY, JSON.stringify(snapshot));
    if (JSON.stringify(model.meta?.dueSnapshot || null) !== JSON.stringify(snapshot)) {
      model.meta ||= {};
      model.meta.dueSnapshot = snapshot;
      model.updatedAt = nowIso();
      localStorage.setItem(KEY, JSON.stringify(model));
      if (CLOUD_SYNC_ENABLED) localStorage.setItem(SYNC_DIRTY_KEY, '1');
    }
    return Number(snapshot.cutoff);
  }
  function isDueToday(card, now = Date.now(), cutoff = dueSnapshot()) {
    const c = normalizeCard(card), due = new Date(c.due || 0).getTime();
    if (!c.due || !Number.isFinite(due) || due > now) return false;
    if (due <= cutoff) return true;
    return c.interval === 0 && !!c.lastReviewed && new Date(c.lastReviewed).toLocaleDateString('en-CA') === localDay();
  }
  function activityFor(day = localDay()) { return model.activity[day] ||= { reviews: 0, courses: 0, studySeconds: 0, vocabStudySeconds: 0, videoSeconds: 0, newWords: 0, reviewWords: 0, forgotten: 0, dictCorrect: 0, dictWrong: 0, newMastered: 0, timeByPeriod: {} }; }
  function markActivity(kind) { const activity = activityFor(); activity[kind] = (activity[kind] || 0) + 1; }
  function recordActivity(kind, amount = 1) { const activity = activityFor(); activity[kind] = (activity[kind] || 0) + Math.max(0, Number(amount) || 0); save(false); }
  let lastTimeSyncAt = 0;
  function completeDailyVocabTask() {
    const startDate = model.roadmap.startDate || localStorage.getItem('ielts_g_plan_start_v1');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '')) return false;
    const start = new Date(startDate + 'T00:00:00'), today = new Date(); today.setHours(0, 0, 0, 0);
    const offset = Math.max(0, Math.floor((today - start) / DAY)), week = Math.min(26, Math.floor(offset / 7) + 1), day = offset % 7, key = 'voc_w' + week + '_d' + day;
    const legacy = parse('ielts_g_plan_progress_v2', {});
    if (legacy[key] && model.roadmap.completed?.[key]) return false;
    legacy[key] = true;
    localStorage.setItem('ielts_g_plan_progress_v2', JSON.stringify(legacy));
    model.roadmap.completed ||= {};
    model.roadmap.completed[key] = true;
    debugLog.write('daily_vocab_task_completed', { key: key, seconds: activityFor().vocabStudySeconds || 0 });
    return true;
  }
  function recordStudySeconds(seconds, source = 'page') {
    const amount = Math.max(0, Math.round(Number(seconds) || 0));
    if (!amount) return;
    const activity = activityFor();
    activity.studySeconds = (activity.studySeconds || 0) + amount;
    if (source === 'vocab') {
      activity.vocabStudySeconds = (activity.vocabStudySeconds || 0) + amount;
      if (activity.vocabStudySeconds >= 30 * 60) completeDailyVocabTask();
    }
    if (source === 'video') activity.videoSeconds = (activity.videoSeconds || 0) + amount;
    const hour = new Date().getHours(), period = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    activity.timeByPeriod ||= {}; activity.timeByPeriod[period] = (activity.timeByPeriod[period] || 0) + amount;
    const shouldSync = Date.now() - lastTimeSyncAt >= 300000;
    if (shouldSync) lastTimeSyncAt = Date.now();
    save(shouldSync);
  }
  function applyStudyDuration(day, totalSeconds) {
    const activity = activityFor(day), target = Math.max(activity.courseSeconds || 0, Math.min(86400, Math.round(Number(totalSeconds) || 0)));
    const previousPeriods = activity.timeByPeriod || {}, previousTotal = Object.values(previousPeriods).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
    activity.studySeconds = Math.max(0, target - (activity.courseSeconds || 0));
    if (previousTotal > 0) {
      let remaining = target;
      const entries = Object.entries(previousPeriods);
      activity.timeByPeriod = Object.fromEntries(entries.map(([period, value], index) => {
        const amount = index === entries.length - 1 ? remaining : Math.round(target * Math.max(0, Number(value) || 0) / previousTotal);
        remaining -= amount;
        return [period, amount];
      }));
    }
    return target;
  }
  function setStudyDuration(day, totalSeconds) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day || ''))) throw new Error('日期格式不正确');
    const target = applyStudyDuration(day, totalSeconds);
    model.meta.activityCorrections ||= {};
    model.meta.activityCorrections[day] = { totalSeconds: target, updatedAt: nowIso() };
    save();
    return target;
  }
  function enforceStudyDurationCorrections() {
    Object.entries(model.meta?.activityCorrections || {}).forEach(([day, correction]) => applyStudyDuration(day, correction?.totalSeconds));
  }
  function recordCourseVideo(seconds, courseId) {
    return completeCourseVideo(courseId);
  }
  function completeCourseVideo(courseId) {
    const id = String(courseId || '');
    if (!id) return false;
    const key = 'vid_' + id, legacy = parse('ielts_g_plan_progress_v2', {});
    model.roadmap.completed ||= {};
    if (legacy[key] || model.roadmap.completed[key]) return false;
    legacy[key] = true;
    localStorage.setItem('ielts_g_plan_progress_v2', JSON.stringify(legacy));
    model.roadmap.completed[key] = true;
    const activity = activityFor();
    activity.courses = (activity.courses || 0) + 1;
    const baseline = new Set(model.meta.courseDurationBaselineIds || []);
    baseline.add(id);
    model.meta.courseDurationBaselineIds = [...baseline];
    debugLog.write('course_video_completed', { id, mode: 'watched' });
    save();
    return true;
  }
  function normalizeVideoWatchEntry(entry) {
    const value = entry && typeof entry === 'object' ? entry : {};
    const watched = Math.max(0, Number(value.watched) || 0), duration = Math.max(0, Number(value.duration) || 0);
    return {
      watched,
      position: Math.max(0, Number(value.position) || 0),
      duration,
      completed: !!value.completed || !!(duration && watched >= duration * .9),
      updatedAt: /^\d{4}-\d{2}-\d{2}T/.test(value.updatedAt || '') ? value.updatedAt : ''
    };
  }
  function mergeVideoWatchEntry(localEntry, remoteEntry) {
    const local = normalizeVideoWatchEntry(localEntry), remote = normalizeVideoWatchEntry(remoteEntry);
    const localTime = new Date(local.updatedAt || 0).getTime(), remoteTime = new Date(remote.updatedAt || 0).getTime();
    const newer = remoteTime > localTime ? remote : local;
    const watched = Math.max(local.watched, remote.watched), duration = Math.max(local.duration, remote.duration);
    return { watched, position: newer.position, duration, completed: local.completed || remote.completed || !!(duration && watched >= duration * .9), updatedAt: newer.updatedAt || local.updatedAt || remote.updatedAt };
  }
  function reconcileVideoCompletions() {
    let changed = false;
    model.roadmap.completed ||= {};
    Object.entries(model.videoWatch || {}).forEach(([id, entry]) => {
      const normalized = normalizeVideoWatchEntry(entry);
      model.videoWatch[id] = normalized;
      if (normalized.completed && !model.roadmap.completed['vid_' + id]) { model.roadmap.completed['vid_' + id] = true; changed = true; }
    });
    return changed;
  }
  function recordVideoWatch(courseId, data = {}, requestSync = false) {
    const id = String(courseId || '');
    if (!id) return null;
    const incoming = normalizeVideoWatchEntry({ ...data, updatedAt: data.updatedAt || nowIso() });
    const next = mergeVideoWatchEntry(model.videoWatch[id], incoming);
    model.videoWatch[id] = next;
    const newlyCompleted = next.completed && !model.roadmap.completed?.['vid_' + id];
    if (newlyCompleted) completeCourseVideo(id); else save(false);
    if (CLOUD_SYNC_ENABLED) localStorage.setItem(SYNC_DIRTY_KEY, '1');
    if (requestSync && !newlyCompleted) scheduleCloudPush();
    return next;
  }
  function backfillCourseDurations(weeks, completed = model.roadmap.completed, startDate = model.roadmap.startDate) {
    if (!Array.isArray(weeks) || !startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return false;
    const baseline = new Set(model.meta.courseDurationBaselineIds || []);
    let changed = false;
    weeks.forEach((week, weekIndex) => (week.days || []).forEach((videos, dayIndex) => (videos || []).forEach(video => {
      const id = String(video.id || '');
      if (!id || !completed?.['vid_' + id] || baseline.has(id)) return;
      const seconds = Math.max(0, Math.round(Number(video.dur) || 0));
      if (!seconds) return;
      const date = new Date(startDate + 'T00:00:00');
      date.setDate(date.getDate() + weekIndex * 7 + dayIndex);
      const day = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
      const activity = activityFor(day);
      activity.courseSeconds = (activity.courseSeconds || 0) + seconds;
      activity.courses = (activity.courses || 0) + 1;
      baseline.add(id); changed = true;
    })));
    if (changed) { model.meta.courseDurationBaselineIds = [...baseline]; save(); }
    return changed;
  }
  function reviewCard(deck, id, rating) {
    const cards = model.vocab[deck] ||= {};
    const card = normalizeCard(cards[id]);
    const beforeReview = normalizeCard(card);
    const wasNew = !(card.reps || card.lastReviewed || card.due), wasMastered = card.mastered;
    const now = Date.now();
    if (rating === 0) { card.reps = 0; card.lapses += 1; card.interval = 0; card.ease = Math.max(1.3, card.ease - 0.2); card.due = new Date(now + 10 * 60000).toISOString(); card.mastered = false; }
    else {
      card.reps += 1;
      if (rating === 1) { card.ease = Math.max(1.3, card.ease - 0.15); card.interval = Math.max(1, Math.round((card.interval || 1) * 1.2)); }
      if (rating === 2) { card.interval = card.reps === 1 ? 1 : card.reps === 2 ? 3 : Math.max(4, Math.round(card.interval * card.ease)); }
      if (rating === 3) { card.ease += 0.15; card.interval = card.reps === 1 ? 4 : Math.max(7, Math.round((card.interval || 3) * card.ease * 1.3)); }
      card.due = new Date(now + card.interval * DAY).toISOString();
    }
    card.lastReviewed = nowIso(); card.mastered = card.reps >= 3 && card.interval >= 21; if (card.mastered !== wasMastered) card.masteredUpdatedAt = card.lastReviewed; cards[id] = card; markActivity('reviews'); markActivity(wasNew ? 'newWords' : 'reviewWords'); if (rating === 0) markActivity('forgotten'); if (!wasMastered && card.mastered) markActivity('newMastered'); debugLog.write('review', { deck, word: String(id).split('|').pop(), cardId: id, rating, oldReps: beforeReview.reps, newReps: card.reps, oldInterval: beforeReview.interval, newInterval: card.interval, oldDue: beforeReview.due, newDue: card.due, lastReviewed: card.lastReviewed }); save(); return card;
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
  function dueCount(deck) { const now = Date.now(), cutoff = dueSnapshot(); return Object.values(getDeck(deck)).filter(c => isDueToday(c, now, cutoff)).length; }
  function summary() { const completed = Object.values(model.roadmap.completed).filter(Boolean).length; const core = Object.values(model.vocab.core); const cls = Object.values(model.vocab.class); const start = model.roadmap.startDate ? new Date(model.roadmap.startDate + 'T00:00:00') : null; const day = start ? Math.max(1, Math.floor((Date.now() - start.getTime()) / DAY) + 1) : 1; return { day, week: Math.min(26, Math.ceil(day / 7)), completed, coreMastered: core.filter(c => c.mastered).length, classMastered: cls.filter(isLongMastered).length, due: dueCount('core') + dueCount('class'), today: model.activity[localDay()] || { reviews: 0, courses: 0, studySeconds: 0, videoSeconds: 0 } }; }
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
    const base = !localCard ? remote : !remoteCard ? local : new Date(remote.lastReviewed || 0) > new Date(local.lastReviewed || 0) ? remote : local;
    const chooseFlag = (flag, stamp) => {
      const lt = new Date(local[stamp] || 0).getTime(), rt = new Date(remote[stamp] || 0).getTime();
      if (rt > lt) return { value: remote[flag], updatedAt: remote[stamp] };
      if (lt > rt) return { value: local[flag], updatedAt: local[stamp] };
      return { value: !!(local[flag] || remote[flag]), updatedAt: local[stamp] || remote[stamp] || null };
    };
    const familiar = chooseFlag('familiar', 'familiarUpdatedAt'), mastered = chooseFlag('mastered', 'masteredUpdatedAt');
    return normalizeCard({ ...base, familiar: familiar.value, familiarUpdatedAt: familiar.updatedAt, mastered: mastered.value, masteredUpdatedAt: mastered.updatedAt });
  }
  function normalizeRemoteCard(card, deck, stamp) {
    const normalized = normalizeCard(card);
    if (deck === 'class' && normalized.mastered && !isLongMastered(normalized)) {
      return { card: normalizeCard({ ...normalized, mastered: false, masteredUpdatedAt: stamp }), corrected: true };
    }
    return { card: normalized, corrected: false };
  }
  function merge(remote, syncId = '') {
    if (!remote || remote.version !== 3) return false;
    Object.entries(remote.roadmap?.completed || {}).forEach(function(e) { if (e[1]) model.roadmap.completed[e[0]] = true; });
    Object.entries(remote.videoWatch || {}).forEach(function(e) { model.videoWatch[e[0]] = mergeVideoWatchEntry(model.videoWatch[e[0]], e[1]); });
    reconcileVideoCompletions();
    const mergedDueSnapshot = chooseDueSnapshot(model.meta?.dueSnapshot || parse(DUE_SNAPSHOT_KEY, null), remote.meta?.dueSnapshot);
    if (mergedDueSnapshot) { model.meta ||= {}; model.meta.dueSnapshot = mergedDueSnapshot; localStorage.setItem(DUE_SNAPSHOT_KEY, JSON.stringify(mergedDueSnapshot)); }
    var changedCards = 0, correctedLegacyMastery = 0, remoteNewer = 0, localKept = 0, dueChanged = 0, masteredChanged = 0, samples = [], correctionStamp = nowIso();
    ['core', 'class'].forEach(function(deck) {
      Object.entries(remote.vocab?.[deck] || {}).forEach(function(e) {
        var incoming = normalizeRemoteCard(e[1], deck, correctionStamp);
        if (incoming.corrected) correctedLegacyMastery++;
        var localCard = normalizeCard(model.vocab[deck]?.[e[0]]), before = JSON.stringify(localCard), remoteCard = incoming.card;
        var localTime = new Date(localCard.lastReviewed || 0).getTime(), remoteTime = new Date(remoteCard.lastReviewed || 0).getTime();
        model.vocab[deck][e[0]] = mergeCard(model.vocab[deck][e[0]], remoteCard);
        var afterCard = normalizeCard(model.vocab[deck][e[0]]);
        if (JSON.stringify(afterCard) !== before) {
          changedCards++;
          if (remoteTime > localTime) remoteNewer++; else localKept++;
          if (localCard.due !== afterCard.due) dueChanged++;
          if (localCard.mastered !== afterCard.mastered) masteredChanged++;
          if (samples.length < 10) samples.push({ deck, word: String(e[0]).split('|').pop(), cardId: e[0], reason: incoming.corrected ? 'legacy_mastery_corrected' : remoteTime > localTime ? 'remote_newer' : 'flag_timestamp', local: { lastReviewed: localCard.lastReviewed, due: localCard.due, mastered: localCard.mastered }, remote: { lastReviewed: remoteCard.lastReviewed, due: remoteCard.due, mastered: remoteCard.mastered }, result: { lastReviewed: afterCard.lastReviewed, due: afterCard.due, mastered: afterCard.mastered } });
        }
      });
    });
    if (remote.phonics) { var lp = normalizePhonics(model.phonics), rp = normalizePhonics(remote.phonics); model.phonics = { learned: [...new Set(lp.learned.concat(rp.learned))], reviews: [...new Set(lp.reviews.concat(rp.reviews))], quiz: { right: Math.max(lp.quiz.right, rp.quiz.right), total: Math.max(lp.quiz.total, rp.quiz.total) } }; }
    Object.entries(remote.activity || {}).forEach(function(e) { var local = activityFor(e[0]); ['reviews', 'courses', 'studySeconds', 'videoSeconds', 'courseSeconds', 'newWords', 'reviewWords', 'forgotten', 'dictCorrect', 'dictWrong', 'newMastered'].forEach(function(key) { local[key] = Math.max(local[key] || 0, e[1][key] || 0); }); Object.entries(e[1].timeByPeriod || {}).forEach(function(p) { local.timeByPeriod ||= {}; local.timeByPeriod[p[0]] = Math.max(local.timeByPeriod[p[0]] || 0, p[1] || 0); }); });
    if (!model.roadmap.startDate && remote.roadmap?.startDate) model.roadmap.startDate = remote.roadmap.startDate;
    demoteLegacyClassMastery();
    if (changedCards > 0) debugLog.write('sync_merge', { syncId, changed: changedCards, remoteNewer, localKept, dueChanged, masteredChanged, samples });
    if (correctedLegacyMastery > 0) { debugLog.write('sync_migration', { syncId, correctedLegacyMastery: correctedLegacyMastery }); localStorage.setItem(SYNC_DIRTY_KEY, '1'); }
    save();
    return true;
  }
  function hasCardProgress(card) {
    const c = normalizeCard(card);
    return !!(c.reps || c.lapses || c.interval || c.due || c.lastReviewed || c.familiar || c.mastered || c.familiarUpdatedAt || c.masteredUpdatedAt);
  }
  function compactModelForSync() {
    const compactDeck = deck => Object.fromEntries(Object.entries(model.vocab?.[deck] || {}).filter(([, card]) => hasCardProgress(card)).map(([id, card]) => [id, normalizeCard(card)]));
    const completed = Object.fromEntries(Object.entries(model.roadmap?.completed || {}).filter(([, value]) => value));
    const compactVideoWatch = Object.fromEntries(Object.entries(model.videoWatch || {}).map(([id, entry]) => [id, normalizeVideoWatchEntry(entry)]));
    const compact = { ...model, roadmap: { startDate: model.roadmap?.startDate || '', completed }, videoWatch: compactVideoWatch, vocab: { core: compactDeck('core'), class: compactDeck('class') }, phonics: normalizePhonics(model.phonics), activity: model.activity || {} };
    delete compact._debugLog;
    return compact;
  }

  let englishVoice = null, pendingSpeech = null;
  function pickEnglishVoice() { if (!('speechSynthesis' in global)) return null; const voices = speechSynthesis.getVoices(); englishVoice = voices.find(voice => /en[-_]US/i.test(voice.lang) && /(Samantha|Google US English|Microsoft.*(?:Aria|Jenny)|Aria|Jenny)/i.test(voice.name)) || voices.find(voice => /en[-_]US/i.test(voice.lang)) || voices.find(voice => /^en/i.test(voice.lang)) || null; return englishVoice; }
  function voicesReady() { pickEnglishVoice(); if (englishVoice && pendingSpeech) { const pending = pendingSpeech; pendingSpeech = null; speakEnglish(pending.text, pending.options); } }
  function speakEnglish(text, options = {}) { if (!text || !('speechSynthesis' in global)) return null; const voice = englishVoice || pickEnglishVoice(); if (!voice && speechSynthesis.getVoices().length === 0) { pendingSpeech = { text, options }; return null; } speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .9; utterance.pitch = 1; if (voice) utterance.voice = voice; if (options.element) { utterance.onstart = () => options.element.classList.add('playing'); utterance.onend = utterance.onerror = () => options.element.classList.remove('playing'); } speechSynthesis.speak(utterance); return utterance; }
  if ('speechSynthesis' in global) { pickEnglishVoice(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', voicesReady); else speechSynthesis.onvoiceschanged = voicesReady; }

  let syncTimer = null, syncing = false, resyncRequested = false, resyncPushRequested = false, applyingRemote = false;
  let _firstSyncDone = false, _firstSyncResolve = null;
  const _firstSyncPromise = new Promise(r => { _firstSyncResolve = r; });
  function syncStatus(text, state = '') {
    document.querySelectorAll('[data-ielti-sync],#syncState').forEach(el => { el.className = `ielti-sync-state ${state}`; el.textContent = `${CLOUD_SYNC_ENABLED ? '☁︎' : '◉'} ${text}`; });
    document.querySelectorAll('.ielti-sync-dot').forEach(dot => { dot.className = `ielti-sync-dot ${state}`; dot.title = text; dot.setAttribute('aria-label', `同步状态：${text}`); });
  }
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
  async function cloudPull(syncId) {
    const urls = [...new Set([SYNC_URL, withPath(SYNC_URL, 'pull')])];
    let lastError = null;
    for (const url of urls) {
      const started = performance.now();
      debugLog.write('sync_pull_start', { syncId, path: new URL(url).pathname, online: navigator.onLine });
      let response;
      try { response = await fetch(url, { headers: { Authorization: `Bearer ${SYNC_SCOPE}` }, cache: 'no-store' }); }
      catch (error) { debugLog.write('sync_pull_error', { syncId, path: new URL(url).pathname, online: navigator.onLine, durationMs: Math.round(performance.now() - started), error: String(error?.message || error) }); throw error; }
      if ((response.status === 404 || response.status === 405) && url !== urls[urls.length - 1]) { lastError = new Error(`pull ${response.status}`); continue; }
      try {
        const remote = await readSyncJson(response, 'pull');
        if (remote.version === 3 && !remote.empty) { applyingRemote = true; try { merge(remote, syncId); } finally { applyingRemote = false; } debugLog.write('sync_pull_success', { syncId, path: new URL(url).pathname, status: response.status, durationMs: Math.round(performance.now() - started) }); return true; }
        debugLog.write('sync_pull_success', { syncId, path: new URL(url).pathname, status: response.status, durationMs: Math.round(performance.now() - started), empty: true });
        return false;
      } catch (error) {
        if (/pull (404|405)/.test(String(error?.message || error)) && url !== urls[urls.length - 1]) { lastError = error; continue; }
        throw error;
      }
    }
    if (lastError) throw lastError;
    return false;
  }
  async function cloudPush(syncId) {
    const body = JSON.stringify(compactModelForSync());
    const attempts = [
      { url: SYNC_URL, method: 'POST' },
      { url: SYNC_URL, method: 'PUT' },
      { url: withPath(SYNC_URL, 'push'), method: 'POST' },
      { url: withPath(SYNC_URL, 'push'), method: 'PUT' }
    ].filter((item, index, list) => list.findIndex(other => other.url === item.url && other.method === item.method) === index);
    let lastError = null;
    for (const attempt of attempts) {
      const started = performance.now(), path = new URL(attempt.url).pathname;
      debugLog.write('sync_push_start', { syncId, path, method: attempt.method, bytes: body.length, online: navigator.onLine });
      let response;
      try { response = await fetch(attempt.url, { method: attempt.method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SYNC_SCOPE}` }, body }); }
      catch (error) { debugLog.write('sync_push_error', { syncId, path, method: attempt.method, online: navigator.onLine, durationMs: Math.round(performance.now() - started), error: String(error?.message || error) }); throw error; }
      if ((response.status === 404 || response.status === 405) && attempt !== attempts[attempts.length - 1]) { lastError = new Error(`push ${response.status}`); continue; }
      try { await readSyncJson(response, 'push'); localStorage.removeItem(SYNC_DIRTY_KEY); debugLog.write('sync_push_success', { syncId, path, method: attempt.method, status: response.status, durationMs: Math.round(performance.now() - started) }); return; }
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
    const syncId = `${DEVICE_ID.slice(-8)}_${Date.now().toString(36)}`;
    try {
      debugLog.write('sync_start', { syncId, requestedPush: shouldPush, dirty: localStorage.getItem(SYNC_DIRTY_KEY) === '1', protocol: location.protocol, host: location.host, online: navigator.onLine });
      await cloudPull(syncId);
      if (shouldPush || localStorage.getItem(SYNC_DIRTY_KEY) === '1') await cloudPush(syncId);
      debugLog.write('sync_success', { syncId });
      syncStatus('已自动同步', 'ok');
      return true;
    }
    catch (error) { console.warn('IELTI sync:', error, SYNC_URL); debugLog.write('sync_error', { syncId, stage: /push/i.test(String(error?.message || '')) ? 'push' : 'pull_or_network', online: navigator.onLine, protocol: location.protocol, host: location.host, error: String(error && error.message || error) }); syncStatus(syncErrorMessage(error), 'error'); return false; }
    finally {
      syncing = false;
      if (!_firstSyncDone) { _firstSyncDone = true; _firstSyncResolve(); }
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
  function startStudyTimer(idleMinutes, source) {
    // Only count time while the learner is still interacting with the study page.
    // This prevents an open tab from silently adding hours to the daily total.
    var TICK_MS = 20000, IDLE_MINUTES = Math.max(1, Number(idleMinutes) || 5), IDLE_MS = IDLE_MINUTES * 60 * 1000, intervalId = null;
    var lastTick = 0, lastActivity = Date.now(), active = document.visibilityState === 'visible', idlePaused = false, pauseNotice = null;
    function ensurePauseNotice() {
      if (pauseNotice) return pauseNotice;
      pauseNotice = document.createElement('div');
      pauseNotice.className = 'ielti-study-pause-notice';
      pauseNotice.hidden = true;
      pauseNotice.innerHTML = '<div class="ielti-study-pause-card" role="status" aria-live="polite"><b>学习计时已暂停</b><span>连续 ' + IDLE_MINUTES + ' 分钟没有操作，已停止累计学习时长。</span><button type="button">继续学习</button></div>';
      pauseNotice.querySelector('button').addEventListener('click', noteActivity);
      document.body.appendChild(pauseNotice);
      return pauseNotice;
    }
    function setPaused(paused) {
      idlePaused = paused;
      ensurePauseNotice().hidden = !paused;
    }
    function recordElapsed(now) {
      if (!active || idlePaused || !lastTick) return;
      var countUntil = Math.min(now, lastActivity + IDLE_MS);
      var elapsed = Math.round((countUntil - lastTick) / 1000);
      if (elapsed > 0) recordStudySeconds(elapsed, source || 'page');
      lastTick = now;
      if (now >= lastActivity + IDLE_MS) setPaused(true);
    }
    function tick() { recordElapsed(Date.now()); }
    function noteActivity() {
      if (!active || document.visibilityState !== 'visible') return;
      var now = Date.now();
      lastActivity = now;
      if (idlePaused) { lastTick = now; setPaused(false); }
    }
    function stopTimer() {
      recordElapsed(Date.now());
      active = false;
      lastTick = 0;
      if (intervalId) { clearInterval(intervalId); intervalId = null; }
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        active = true;
        lastTick = Date.now();
        if (Date.now() - lastActivity >= IDLE_MS) setPaused(true);
        if (!intervalId) intervalId = setInterval(tick, TICK_MS);
      } else stopTimer();
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    ['pointerdown', 'keydown', 'touchstart', 'wheel'].forEach(function (eventName) { document.addEventListener(eventName, noteActivity, { passive: true }); });
    window.addEventListener('beforeunload', stopTimer);
    window.addEventListener('pagehide', stopTimer);
    if (active) { lastTick = Date.now(); intervalId = setInterval(tick, TICK_MS); }
  }
  function installChrome() {
    document.body.classList.add('apple-ui');
    applyRuntimeIcon();
    const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    const pageClass = page === 'index.html' ? 'page-today' : page === 'ielts-roadmap.html' ? 'page-roadmap' : page === 'ielts-core-vocabulary.html' ? 'page-core' : page === 'ielts-vocabulary-categories.html' ? 'page-class' : page === 'ielts_word_memory_v2_ipa.html' ? 'page-review' : page === '121-letter-combinations.html' ? 'page-phonics' : (page === 'ielts-ebook-library.html' || page === 'ielts-ebook-reader.html') ? 'page-library' : '';
    if (pageClass) document.body.classList.add(pageClass);
    if (page === 'ielts-video-player.html') return;
    var STUDY_TRACKED_PAGES = new Set(['ielts_word_memory_v2_ipa.html', '121-letter-combinations.html', 'ielts-core-vocabulary.html', 'ielts-vocabulary-categories.html', 'ielts-ebook-library.html', 'ielts-ebook-reader.html']);
    var VOCAB_STUDY_PAGES = new Set(['ielts_word_memory_v2_ipa.html', 'ielts-core-vocabulary.html', 'ielts-vocabulary-categories.html']);
    if (STUDY_TRACKED_PAGES.has(page)) startStudyTimer(page === 'ielts-ebook-reader.html' ? 10 : 5, VOCAB_STUDY_PAGES.has(page) ? 'vocab' : 'page');
    const syncPageTheme = () => document.body.classList.toggle('light', document.documentElement.dataset.theme === 'light');
    syncPageTheme();
    if (!document.querySelector('.apple-theme-toggle') && !document.getElementById('themeBtn')) {
      const toggle = document.createElement('button'); toggle.className = 'apple-theme-toggle'; toggle.type = 'button'; toggle.setAttribute('aria-label', '切换显示模式');
      const paint = () => {
        const pref = localStorage.getItem(DISPLAY_KEY) || 'auto';
        const mode = document.documentElement.dataset.display || document.documentElement.dataset.theme || 'light';
        if (mode === 'eink') {
          toggle.textContent = '墨';
        } else {
          const iconKey = pref === 'auto' ? 'auto' : mode;
          toggle.innerHTML = themeIconSvg(iconKey);
        }
        if (pref === 'auto') {
          toggle.title = `自动 · ${mode === 'dark' ? '深色' : mode === 'eink' ? '墨水屏' : '浅色'} · 点击切换`;
        } else {
          toggle.title = `当前：${mode === 'eink' ? '墨水屏' : mode === 'dark' ? '深色' : '浅色'} · 点击切换显示模式`;
        }
        toggle.setAttribute('aria-label', toggle.title);
      };
      paint();
      toggle.onclick = () => {
        const currentPref = localStorage.getItem(DISPLAY_KEY) || 'auto';
        const idx = preferenceModes.indexOf(currentPref);
        const nextPref = preferenceModes[(idx + 1) % preferenceModes.length];
        if (nextPref === 'auto') {
          localStorage.setItem(DISPLAY_KEY, 'auto');
          localStorage.removeItem(THEME_KEY);
          const resolved = probablyEink() ? 'eink' : timeBasedDisplay();
          applyDisplayMode(resolved, false);
        } else {
          applyDisplayMode(nextPref, true);
        }
        syncPageTheme();
        paint();
      };
      document.body.appendChild(toggle);
    }
    let avatarControl = null, avatarMenu = null, avatarBackdrop = null, avatarMenuTimer = null;
    if (!document.querySelector('.apple-tabbar')) {
      const current = page;
      const navIcon = name => {
        const paths = {
          today: '<path d="M5.8 11.2 12 5.8l6.2 5.4v6.3a2.1 2.1 0 0 1-2.1 2.1H7.9a2.1 2.1 0 0 1-2.1-2.1z"/><path d="M10 19.6v-4.3a2 2 0 0 1 4 0v4.3"/>',
          roadmap: '<rect x="5" y="5" width="14" height="14" rx="2.8"/><path d="M12 5v14"/><path d="M12 12h7"/>',
          core: '<rect x="5" y="5" width="14" height="14" rx="2.8"/><path d="m8.5 16 3.5-8 3.5 8"/><path d="M10 13h4"/>',
          review: '<path d="M12 5.2 13.5 9a2.6 2.6 0 0 0 1.5 1.5l3.8 1.5-3.8 1.5a2.6 2.6 0 0 0-1.5 1.5L12 18.8l-1.5-3.8A2.6 2.6 0 0 0 9 13.5L5.2 12 9 10.5A2.6 2.6 0 0 0 10.5 9z"/><path d="m17.4 4.5.45 1.1 1.1.45-1.1.45-.45 1.1-.45-1.1-1.1-.45 1.1-.45z"/>',
          phonics: '<rect x="5" y="5.5" width="6.5" height="6.5" rx="1.6"/><rect x="12.5" y="12" width="6.5" height="6.5" rx="1.6"/><path d="M11.5 8.75h1.7a2.3 2.3 0 0 1 2.3 2.3V12"/><path d="M12.5 15.25h-1.7a2.3 2.3 0 0 1-2.3-2.3V12"/>',
          class: '<rect x="5" y="5" width="14" height="14" rx="2.8"/><path d="M8.5 9h7"/><path d="M8.5 12h7"/><path d="M8.5 15h5.2"/>',
          library: '<rect x="4.5" y="6.5" width="7" height="11" rx="1.4"/><rect x="12.5" y="6.5" width="7" height="11" rx="1.4"/><path d="M11.5 9.5h1.5"/><path d="M11.5 12h1.5"/><path d="M11.5 14.5h1.5"/>'
        };
        return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name]}</svg>`;
      };
      const tabs = [['index.html',navIcon('today'),'今日'],['ielts-roadmap.html',navIcon('roadmap'),'课程'],['ielts_word_memory_v2_ipa.html',navIcon('review'),'复习'],['121-letter-combinations.html',navIcon('phonics'),'组合'],['ielts-core-vocabulary.html',navIcon('core'),'词表'],['ielts-vocabulary-categories.html',navIcon('class'),'词库'],['ielts-ebook-library.html',navIcon('library'),'图书馆','apple-nav-desktop-only']];
      const isLibraryPage = page === 'ielts-ebook-library.html' || page === 'ielts-ebook-reader.html';
      const nav = document.createElement('nav'); nav.className = 'apple-tabbar'; nav.setAttribute('aria-label','主要导航'); nav.innerHTML = `<i class="apple-nav-indicator" aria-hidden="true"></i>`+tabs.map(([href,icon,label,extraClass]) => { const isActive = current === href || (isLibraryPage && href === 'ielts-ebook-library.html'); const cls = [isActive ? 'active' : '', extraClass || ''].filter(Boolean).join(' '); return `<a href="${href}"${cls ? ` class="${cls}"` : ''}${isActive ? ' aria-current="page"' : ''} aria-label="${label}" title="${label}"><span>${icon}</span><em>${label}</em></a>`; }).join(''); document.body.appendChild(nav);
      const rail = document.createElement('aside'); rail.className = 'apple-desktop-rail'; rail.setAttribute('aria-label', '桌面导航');
      const avatarKey = 'ielti_navigation_avatar_v1';
      const defaultAvatar = DEFAULT_ICON;
      const logo = document.createElement('button'); logo.type = 'button'; logo.className = 'apple-rail-logo'; logo.title = '点击更换头像；右键恢复默认头像'; logo.setAttribute('aria-label', '更换或重置头像'); logo.textContent = '';
      avatarControl = logo;
      const avatarInput = document.createElement('input'); avatarInput.type = 'file'; avatarInput.accept = 'image/*'; avatarInput.hidden = true;
      const applyAvatar = source => { const custom = Boolean(source); logo.classList.add('has-photo'); logo.classList.toggle('has-custom-photo', custom); logo.style.backgroundImage = `url("${source || defaultAvatar}")`; logo.textContent = ''; logo.title = custom ? '点击更换头像；右键恢复默认头像' : '点击上传个人头像'; };
      const resetAvatar = () => { try { localStorage.removeItem(avatarKey); } catch (_) { /* local storage is unavailable */ } applyAvatar(''); };
      try { applyAvatar(localStorage.getItem(avatarKey)); } catch (_) { applyAvatar(''); }
      const closeAvatarMenu = () => {
        if (!avatarMenu || avatarMenu.hidden) return;
        clearTimeout(avatarMenuTimer);
        avatarMenu.classList.remove('is-open');
        avatarBackdrop?.classList.remove('is-open');
        avatarMenuTimer = setTimeout(() => { avatarMenu.hidden = true; if (avatarBackdrop) avatarBackdrop.hidden = true; }, 280);
      };
      const positionAvatarMenu = () => {
        if (!avatarMenu || !avatarControl) return;
        const rect = avatarControl.getBoundingClientRect();
        avatarMenu.style.top = `${Math.min(innerHeight - avatarMenu.offsetHeight - 12, rect.bottom + 8)}px`;
        avatarMenu.style.right = `${Math.max(12, innerWidth - rect.right)}px`;
      };
      logo.addEventListener('click', event => {
        if (!matchMedia('(max-width:760px)').matches) { avatarInput.click(); return; }
        event.stopPropagation();
        const opening = avatarMenu.hidden || !avatarMenu.classList.contains('is-open');
        if (!opening) { closeAvatarMenu(); return; }
        clearTimeout(avatarMenuTimer);
        avatarMenu.hidden = false;
        if (avatarBackdrop) avatarBackdrop.hidden = false;
        requestAnimationFrame(() => { positionAvatarMenu(); avatarMenu.classList.add('is-open'); avatarBackdrop?.classList.add('is-open'); });
      });
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
      avatarBackdrop = document.createElement('button'); avatarBackdrop.type = 'button'; avatarBackdrop.className = 'apple-avatar-backdrop'; avatarBackdrop.hidden = true; avatarBackdrop.setAttribute('aria-label', '关闭头像菜单'); avatarBackdrop.addEventListener('click', closeAvatarMenu);
      avatarMenu = document.createElement('div'); avatarMenu.className = 'apple-avatar-menu'; avatarMenu.hidden = true; avatarMenu.setAttribute('role', 'menu'); avatarMenu.setAttribute('aria-label', '头像与显示设置'); avatarMenu.innerHTML = '<i class="apple-avatar-menu-handle" aria-hidden="true"></i><strong>头像与显示</strong><button type="button" data-avatar-action="display" role="menuitem">切换显示模式</button><button type="button" data-avatar-action="change" role="menuitem">更换头像</button><button type="button" data-avatar-action="reset" role="menuitem">恢复默认头像</button>';
      avatarMenu.addEventListener('click', event => {
        const action = event.target.closest('[data-avatar-action]')?.dataset.avatarAction;
        if (!action) return;
        if (action === 'display') { themeControl?.click(); return; }
        if (action === 'change') avatarInput.click();
        if (action === 'reset' && (!logo.classList.contains('has-custom-photo') || confirm('恢复默认头像？'))) resetAvatar();
        closeAvatarMenu();
      });
      document.addEventListener('click', event => { if (!avatarMenu.hidden && !avatarMenu.contains(event.target) && event.target !== logo) closeAvatarMenu(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAvatarMenu(); });
      addEventListener('resize', () => { if (!avatarMenu.hidden) positionAvatarMenu(); }, { passive: true });
      document.body.append(avatarBackdrop, avatarMenu);
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
      const reviewPage = pageClass === 'page-review';
      const studyPage = reviewPage && document.body.classList.contains('small-square-device');
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
    const placeThemeControl = () => { if (!themeControl) return; themeControl.style.removeProperty('top'); themeControl.style.removeProperty('transform'); themeControl.style.removeProperty('margin'); themeControl.style.removeProperty('position'); const desktop = matchMedia('(min-width:761px)').matches; if (desktop) { document.querySelector('.apple-tabbar')?.append(themeControl); themeControl.style.setProperty('margin-bottom', '-4px', 'important'); } else themeControl.remove(); };
    let syncDot = null;
    const placeSyncDot = () => {
      if (pageClass !== 'page-today' || !themeControl) return;
      if (!syncDot) { syncDot = document.createElement('span'); syncDot.className = 'ielti-sync-dot'; syncDot.setAttribute('role', 'status'); syncDot.setAttribute('aria-live', 'polite'); }
      if (matchMedia('(min-width:761px)').matches) themeControl.before(syncDot); else document.querySelector('.apple-tabbar a.active')?.append(syncDot);
    };
    placeThemeControl(); placeAvatarControl(); placeSyncDot(); matchMedia('(min-width:761px)').addEventListener('change', () => { placeThemeControl(); placeAvatarControl(); placeSyncDot(); });
    if (!document.querySelector('[data-ielti-sync]') && !document.getElementById('syncState')) { const status = document.createElement('div'); status.dataset.ieltiSync = ''; status.className = 'ielti-sync-state'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); document.body.appendChild(status); }
    syncStatus(CLOUD_SYNC_ENABLED ? '准备自动同步…' : '本地模式 · 进度仅保存在此浏览器');

    if (!document.getElementById("__dbg_panel__")) {
      var dbgStyle = document.createElement("style");
      dbgStyle.textContent = "#__dbg_btn__{position:fixed;bottom:16px;right:16px;z-index:99999;width:36px;height:36px;border-radius:50%;border:none;background:rgba(28,28,46,.75);color:#fff;font-size:18px;cursor:pointer;opacity:.35;transition:opacity .2s;display:flex;align-items:center;justify-content:center}#__dbg_btn__:hover{opacity:.85}#__dbg_panel__{position:fixed;top:0;right:0;z-index:99998;width:520px;max-width:100vw;height:100vh;background:#1C1C2E;color:#F4F4FC;font-size:12px;font-family:monospace;overflow-y:auto;transform:translateX(100%);transition:transform .25s ease;box-shadow:-4px 0 24px rgba(0,0,0,.35);padding:16px}#__dbg_panel__.open{transform:translateX(0)}#__dbg_close__{position:sticky;top:0;float:right;background:none;border:none;color:#9898BB;font-size:18px;cursor:pointer;z-index:2}#__dbg_filters__,#__dbg_actions__{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;background:#1C1C2E;padding:8px 0}.dbg-filter,.dbg-action{padding:4px 10px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:transparent;color:#9898BB;cursor:pointer;font-size:11px;font-family:inherit}.dbg-filter.active{background:rgba(91,108,245,.35);border-color:#5B6CF5;color:#fff}.dbg-action{color:#F4F4FC}.dbg-entry{padding:7px 0;border-bottom:1px solid rgba(255,255,255,.06);line-height:1.5;overflow-wrap:anywhere}.dbg-time{color:#9898BB;margin-right:6px}.dbg-type{display:inline-block;padding:1px 6px;border-radius:4px;font-weight:700;margin-right:6px;font-size:10px;background:#44445F}.dbg-type.review{background:#4CAF82}.dbg-type.queue_build{background:#F59E0B;color:#1C1C2E}.dbg-type.sync_merge,.dbg-type.sync_success{background:#5B6CF5}.dbg-type.sync_error,.dbg-type.sync_pull_error,.dbg-type.sync_push_error{background:#E87878}.dbg-device{color:#7878A0;font-size:10px;margin-left:6px}.dbg-detail{display:block;color:#C8C8E8;margin-top:3px;white-space:pre-wrap}@media(max-width:520px){#__dbg_panel__{width:100vw}}";
      document.head.appendChild(dbgStyle);
      var btn = document.createElement("button");
      btn.id = "__dbg_btn__";
      btn.textContent = "🐞";
      btn.title = "调试日志";
      document.body.appendChild(btn);
      var panel = document.createElement("div");
      panel.id = "__dbg_panel__";
      panel.innerHTML = '<button id="__dbg_close__">✕</button><div id="__dbg_filters__"><button class="dbg-filter active" data-filter="all">全部</button><button class="dbg-filter" data-filter="review">评分</button><button class="dbg-filter" data-filter="queue_build">队列</button><button class="dbg-filter" data-filter="sync">同步</button><button class="dbg-filter" data-filter="error">错误</button></div><div id="__dbg_actions__"><button class="dbg-action" id="__dbg_copy__">复制诊断</button><button class="dbg-action" id="__dbg_download__">下载 JSONL</button><button class="dbg-action" id="__dbg_clear__">清空日志</button></div><div id="__dbg_list__"></div>';
      document.body.appendChild(panel);
      var _dbgFilter = "all";
      function _dbgRender() {
        var list = document.getElementById("__dbg_list__");
        if (!list) return;
        var entries = debugLog.all();
        var filtered = _dbgFilter === "all" ? entries : entries.filter(function(e) { return _dbgFilter === 'sync' ? e.type.startsWith('sync_') : _dbgFilter === 'error' ? /error$/.test(e.type) : e.type === _dbgFilter; });
        var html = filtered.slice(-100).reverse().map(function(e) {
          var d = new Date(e.t), time = String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0") + " " + String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0") + ":" + String(d.getSeconds()).padStart(2,"0");
          var detail = JSON.stringify(e.data || {});
          return '<div class="dbg-entry"><span class="dbg-time">' + time + '</span><span class="dbg-type ' + e.type + '">' + e.type + '</span><span class="dbg-device">' + (e.device || "").slice(-8) + '</span><span class="dbg-detail"></span></div>';
        }).join("");
        list.innerHTML = html || '<div style="color:#9898BB;padding:20px;text-align:center">暂无日志</div>';
        filtered.slice(-100).reverse().forEach(function(e, i) { var el = list.children[i]?.querySelector('.dbg-detail'); if (el) el.textContent = JSON.stringify(e.data || {}, null, 2); });
      }
      function _dbgDiagnostic() { var now = Date.now(), cutoff = dueSnapshot(), counts = {}; ['core','class'].forEach(function(deck) { var cards = Object.values(getDeck(deck)), raw = cards.filter(c => c.due && new Date(c.due).getTime() <= now).length, todayDue = cards.filter(c => isDueToday(c, now, cutoff)).length; counts[deck] = { rawDue: raw, todayDue, deferredDue: Math.max(0, raw - todayDue), totalProgressCards: cards.length }; }); return { generatedAt: nowIso(), appVersion: '20260814-50', device: DEVICE_ID.slice(-8), page: location.pathname.split('/').pop() || 'index.html', online: navigator.onLine, dueSnapshot: { day: localDay(), cutoff: new Date(cutoff).toISOString() }, decks: counts, recentSync: debugLog.all().filter(e => e.type.startsWith('sync_')).slice(-30), recentErrors: debugLog.all().filter(e => /error$/.test(e.type)).slice(-20) }; }
      btn.onclick = function() { panel.classList.toggle("open"); if (panel.classList.contains("open")) _dbgRender(); };
      document.getElementById("__dbg_close__").onclick = function() { panel.classList.remove("open"); };
      document.getElementById("__dbg_filters__").onclick = function(ev) { var el = ev.target.closest(".dbg-filter"); if (!el) return; document.querySelectorAll("#__dbg_filters__ .dbg-filter").forEach(function(f) { f.classList.remove("active"); }); el.classList.add("active"); _dbgFilter = el.dataset.filter; _dbgRender(); };
      document.getElementById('__dbg_copy__').onclick = async function() { var text = JSON.stringify(_dbgDiagnostic(), null, 2); try { await navigator.clipboard.writeText(text); this.textContent = '已复制'; } catch { prompt('复制诊断报告', text); } setTimeout(() => { this.textContent = '复制诊断'; }, 1200); };
      document.getElementById('__dbg_download__').onclick = function() { debugLog.download(); };
      document.getElementById('__dbg_clear__').onclick = function() { if (confirm('确定清空此浏览器中的独立调试日志吗？学习进度不会受影响。')) { debugLog.clear(); _dbgRender(); } };
      document.addEventListener("ielti-progress", function() { if (panel.classList.contains("open")) _dbgRender(); });
    }

    requestAnimationFrame(() => document.documentElement.classList.remove('ielti-booting'));
  }
  migrate();
  mirrorLegacyProgress();
  global.IELTI = { KEY, get: () => model, save, merge, summary, wordId, migrateClassWords, getDeck, isLongMastered, reviewCard, setRoadmap, setMastered, setFamiliar, setFamiliarList, replaceDeck, getPhonics, setStudyDuration, recordStudySeconds, recordCourseVideo, completeCourseVideo, recordVideoWatch, backfillCourseDurations, recordActivity, due: { cutoff: dueSnapshot, isToday: isDueToday }, media: { resolve: resolveMediaUrl, nasBaseUrl: NAS_BASE_URL, nasHttpsBaseUrl: NAS_HTTPS_BASE_URL }, backup: { keys: [...BACKUP_KEYS], export: exportBackup, import: importBackup }, motion, speech: { speak: speakEnglish, pickVoice: pickEnglishVoice }, sync: { enabled: CLOUD_SYNC_ENABLED, url: SYNC_URL, run: autoSync, schedulePush: scheduleCloudPush, waitForFirstSync: () => Promise.race([_firstSyncPromise, new Promise(r => setTimeout(r, 4000))]) } };
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
