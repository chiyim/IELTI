(function (global) {
  'use strict';
  const THEME_KEY = 'ielti_theme_v1';
  const savedTheme = localStorage.getItem(THEME_KEY) || (global.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.dataset.theme = savedTheme;
  const KEY = 'ielti_progress_v3';
  const SYNC_URL = 'https://word-sync.chilamc-y.workers.dev';
  const SYNC_SCOPE = 'ielti-chilam-personal-site-v1';
  const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);
  const CLOUD_SYNC_ENABLED = location.protocol === 'https:' && !LOCAL_HOSTS.has(location.hostname);
  const SYNC_DIRTY_KEY = 'ielti_sync_dirty_v1';
  const BACKUP_KEYS = ['ielti_progress_v3', 'ielts_g_plan_progress_v2', 'ielts_g_plan_start_v1', 'ielts_vocab_mastered_v1', 'wclass_known_v1', 'wclass_familiar_v1', 'ielts_srs_v2', 'ielts_review_prefs_v1', 'ielti_phonics_121_v1'];
  const DAY = 86400000;
  const parse = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
  const nowIso = () => new Date().toISOString();
  const fresh = () => ({ version: 3, deviceId: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), updatedAt: nowIso(), roadmap: { startDate: '', completed: {} }, vocab: { core: {}, class: {} }, phonics: { learned: [], reviews: [], quiz: { right: 0, total: 0 } }, activity: {} });
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

  let englishVoice = null, pendingSpeech = null;
  function pickEnglishVoice() { if (!('speechSynthesis' in global)) return null; const voices = speechSynthesis.getVoices(); englishVoice = voices.find(voice => /en[-_]US/i.test(voice.lang) && /(Samantha|Google US English|Microsoft.*(?:Aria|Jenny)|Aria|Jenny)/i.test(voice.name)) || voices.find(voice => /en[-_]US/i.test(voice.lang)) || voices.find(voice => /^en/i.test(voice.lang)) || null; return englishVoice; }
  function voicesReady() { pickEnglishVoice(); if (englishVoice && pendingSpeech) { const pending = pendingSpeech; pendingSpeech = null; speakEnglish(pending.text, pending.options); } }
  function speakEnglish(text, options = {}) { if (!text || !('speechSynthesis' in global)) return null; const voice = englishVoice || pickEnglishVoice(); if (!voice && speechSynthesis.getVoices().length === 0) { pendingSpeech = { text, options }; return null; } speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'en-US'; utterance.rate = .9; utterance.pitch = 1; if (voice) utterance.voice = voice; if (options.element) { utterance.onstart = () => options.element.classList.add('playing'); utterance.onend = utterance.onerror = () => options.element.classList.remove('playing'); } speechSynthesis.speak(utterance); return utterance; }
  if ('speechSynthesis' in global) { pickEnglishVoice(); if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', voicesReady); else speechSynthesis.onvoiceschanged = voicesReady; }

  let syncTimer = null, syncing = false, resyncRequested = false, applyingRemote = false;
  function syncStatus(text, state = '') { document.querySelectorAll('[data-ielti-sync],#syncState').forEach(el => { el.className = `ielti-sync-state ${state}`; el.textContent = `${CLOUD_SYNC_ENABLED ? '☁︎' : '◉'} ${text}`; }); }
  function scheduleCloudPush() { if (!CLOUD_SYNC_ENABLED || applyingRemote) return; localStorage.setItem(SYNC_DIRTY_KEY, '1'); clearTimeout(syncTimer); syncTimer = setTimeout(() => autoSync(true), 1600); }
  async function cloudPull() { const response = await fetch(SYNC_URL, { headers: { Authorization: `Bearer ${SYNC_SCOPE}` }, cache: 'no-store' }); if (!response.ok) throw new Error(`pull ${response.status}`); const remote = await response.json(); if (remote.version === 3 && !remote.empty) { applyingRemote = true; try { merge(remote); } finally { applyingRemote = false; } return true; } return false; }
  async function cloudPush() { const response = await fetch(SYNC_URL, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SYNC_SCOPE}` }, body: JSON.stringify(model) }); if (!response.ok) throw new Error(`push ${response.status}`); localStorage.removeItem(SYNC_DIRTY_KEY); }
  async function autoSync(forcePush = false) {
    if (!CLOUD_SYNC_ENABLED) { syncStatus('本地模式 · 进度仅保存在此浏览器'); return true; }
    if (!navigator.onLine) { syncStatus('离线，联网后自动同步'); return false; }
    if (syncing) { resyncRequested = true; return false; }
    syncing = true; syncStatus('正在自动同步…');
    try { const hadRemote = await cloudPull(); if (forcePush || !hadRemote || localStorage.getItem(SYNC_DIRTY_KEY) === '1') await cloudPush(); syncStatus('已自动同步', 'ok'); return true; }
    catch (error) { console.warn('IELTI sync:', error); syncStatus('暂时无法同步，稍后自动重试', 'error'); return false; }
    finally { syncing = false; if (resyncRequested) { resyncRequested = false; scheduleCloudPush(); } }
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
    const page = decodeURIComponent(location.pathname.split('/').pop() || 'index.html');
    const pageClass = page === 'index.html' ? 'page-today' : page === 'ielts-roadmap.html' ? 'page-roadmap' : page === 'ielts-core-vocabulary.html' ? 'page-core' : page === 'ielts-vocabulary-categories.html' ? 'page-class' : page === 'ielts_word_memory_v2_ipa.html' ? 'page-review' : page === '121-letter-combinations.html' ? 'page-phonics' : '';
    if (pageClass) document.body.classList.add(pageClass);
    const syncPageTheme = () => document.body.classList.toggle('light', document.documentElement.dataset.theme === 'light');
    syncPageTheme();
    if (!document.querySelector('.apple-theme-toggle') && !document.getElementById('themeBtn')) {
      const toggle = document.createElement('button'); toggle.className = 'apple-theme-toggle'; toggle.type = 'button'; toggle.setAttribute('aria-label', '切换深色模式');
      const paint = () => toggle.textContent = document.documentElement.dataset.theme === 'dark' ? '☀︎' : '◐'; paint();
      toggle.onclick = () => { const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches); document.documentElement.dataset.theme = dark ? 'light' : 'dark'; localStorage.setItem(THEME_KEY, document.documentElement.dataset.theme); syncPageTheme(); paint(); };
      document.body.appendChild(toggle);
    }
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
      const logo = document.createElement('button'); logo.type = 'button'; logo.className = 'apple-rail-logo'; logo.title = '上传个人头像'; logo.setAttribute('aria-label', '上传个人头像'); logo.textContent = 'I';
      const avatarInput = document.createElement('input'); avatarInput.type = 'file'; avatarInput.accept = 'image/*'; avatarInput.hidden = true;
      const applyAvatar = source => { logo.classList.toggle('has-photo', Boolean(source)); logo.style.backgroundImage = source ? `url("${source}")` : ''; logo.textContent = source ? '' : 'I'; };
      try { applyAvatar(localStorage.getItem(avatarKey)); } catch (_) { /* local storage is unavailable */ }
      logo.addEventListener('click', () => avatarInput.click());
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
      nav.before(rail); rail.append(logo, avatarInput, nav);
      const links=[...nav.querySelectorAll('a')],activeIndex=links.findIndex(link=>link.classList.contains('active')),storageKey='ielti_nav_previous_index',storedIndex=sessionStorage.getItem(storageKey);
      let previousIndex=storedIndex===null?activeIndex:Number(storedIndex);
      const placeNavIndicator=()=>requestAnimationFrame(()=>{const indicator=nav.querySelector('.apple-nav-indicator'),active=links[activeIndex];if(!indicator||!active)return;const navRect=nav.getBoundingClientRect(),target=active.getBoundingClientRect();indicator.style.left=`${target.left-navRect.left}px`;indicator.style.top=`${target.top-navRect.top}px`;indicator.style.width=`${target.width}px`;indicator.style.height=`${target.height}px`;if(Number.isInteger(previousIndex)&&previousIndex>=0&&previousIndex<links.length&&previousIndex!==activeIndex&&!reducedMotion()){const from=links[previousIndex].getBoundingClientRect();indicator.animate([{transform:`translate3d(${from.left-target.left}px,${from.top-target.top}px,0) scale(${from.width/target.width},${from.height/target.height})`},{transform:'translate3d(0,0,0) scale(1)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});}previousIndex=activeIndex;sessionStorage.setItem(storageKey,String(activeIndex));});
      placeNavIndicator();addEventListener('resize',placeNavIndicator,{passive:true});
    }
    const themeControl = document.querySelector('.apple-theme-toggle') || document.getElementById('themeBtn');
    const titleRow = title => { if (!title) return null; let row = title.parentElement?.classList.contains('apple-mobile-title-row') ? title.parentElement : null; if (!row) { const host = title.parentElement; host?.classList.add('apple-mobile-title-host'); row = document.createElement('div'); row.className = 'apple-mobile-title-row'; title.before(row); row.append(title); } return row; };
    const placeThemeControl = () => { if (!themeControl) return; themeControl.style.removeProperty('top'); const desktop = matchMedia('(min-width:761px)').matches; if (desktop) { if (pageClass === 'page-review') { const top = document.querySelector('body.page-review .top'), library = document.getElementById('libraryBtn'); if (top && library) top.append(library); } if (pageClass === 'page-class') { const top = document.querySelector('body.page-class .htop'), collapse = document.getElementById('collapseBtn'); if (top && collapse) top.append(collapse); } document.querySelector('.apple-tabbar')?.append(themeControl); } else if (pageClass === 'page-review') { const row = titleRow(document.querySelector('.brand h1')), library = document.getElementById('libraryBtn'); if (row) { row.append(themeControl); if (library) row.append(library); } } else if (pageClass === 'page-class') { const row = titleRow(document.querySelector('.page-title-brand h1')), collapse = document.getElementById('collapseBtn'); if (row) { row.append(themeControl); if (collapse) row.append(collapse); } } else titleRow(document.querySelector('.top h1,.hero h1'))?.append(themeControl); };
    placeThemeControl(); matchMedia('(min-width:761px)').addEventListener('change', placeThemeControl);
    if (!document.querySelector('[data-ielti-sync]') && !document.getElementById('syncState')) { const status = document.createElement('div'); status.dataset.ieltiSync = ''; status.className = 'ielti-sync-state'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); document.body.appendChild(status); }
    syncStatus(CLOUD_SYNC_ENABLED ? '准备自动同步…' : '本地模式 · 进度仅保存在此浏览器');
  }
  migrate();
  mirrorLegacyProgress();
  global.IELTI = { KEY, get: () => model, save, merge, summary, wordId, migrateClassWords, getDeck, reviewCard, setRoadmap, setMastered, setFamiliar, setFamiliarList, replaceDeck, getPhonics, setPhonics, backup: { keys: [...BACKUP_KEYS], export: exportBackup, import: importBackup }, motion, speech: { speak: speakEnglish, pickVoice: pickEnglishVoice }, sync: { enabled: CLOUD_SYNC_ENABLED, run: autoSync, schedulePush: scheduleCloudPush } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installChrome); else installChrome();
  global.addEventListener('ielti-progress', scheduleCloudPush);
  if (CLOUD_SYNC_ENABLED) { global.addEventListener('online', () => autoSync(localStorage.getItem(SYNC_DIRTY_KEY) === '1')); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') autoSync(localStorage.getItem(SYNC_DIRTY_KEY) === '1'); }); setInterval(() => { if (document.visibilityState === 'visible') autoSync(false); }, 60000); }
  queueMicrotask(() => autoSync(CLOUD_SYNC_ENABLED && localStorage.getItem(SYNC_DIRTY_KEY) === '1'));
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})(window);
