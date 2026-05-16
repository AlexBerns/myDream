import {
    auth, db, authReady,
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
    collection, onSnapshot, query, orderBy,
} from './firebase.js';

// ===========================================================================
// IMAGE GENERATION: Pollinations.ai (free, no API key, no quota)
// HF didn't work — token lacked Inference Providers permission, and HF's
// free tier is limited to ~$0.10/month credits anyway. Pollinations is truly
// free and unlimited. Returns images directly when an image URL is fetched.
// ===========================================================================
const POLLINATIONS_MODEL = 'flux-anime';

const COUPLE_ID_STORAGE = 'wedream.coupleId';
const NAME_STORAGE = 'wedream.myName';
const POSITION_STORAGE = 'wedream.myPosition';

const CATEGORIES = ['travel', 'home', 'adventure', 'career', 'family', 'other'];

const SAMPLE_SEEDS = [
    { seed: 'wedream-kyoto',  image: 'samples/kyoto.jpg',  titleKey: 'sample_ex1_title', detailsKey: 'sample_ex1_details', category: 'travel',    owner: 'shared'  },
    { seed: 'wedream-kitten', image: 'samples/kitten.jpg', titleKey: 'sample_ex2_title', detailsKey: 'sample_ex2_details', category: 'home',      owner: 'me'      },
    { seed: 'wedream-aurora', image: 'samples/aurora.jpg', titleKey: 'sample_ex3_title', detailsKey: 'sample_ex3_details', category: 'adventure', owner: 'partner' },
    { seed: 'wedream-cafe',   image: 'samples/cafe.jpg',   titleKey: 'sample_ex4_title', detailsKey: 'sample_ex4_details', category: 'career',    owner: 'shared'  },
];

const state = {
    user: null,
    me: '',
    myPosition: null,        // 'p1' or 'p2'
    coupleId: null,
    couple: null,            // Firestore doc data
    dreams: [],
    activeTab: 'all',
    editingId: null,
    isJoining: false,
    pendingCoupleId: null,
    joiningCreatorName: '',
    unsubCouple: null,
    unsubDreams: null,
};

const $ = (id) => document.getElementById(id);

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function dreamTitle(d) { return d.titleKey ? t(d.titleKey) : d.title; }
function dreamDetails(d) { return d.detailsKey ? t(d.detailsKey) : d.details; }

function generateCoupleId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
}

function shareUrl() {
    return `${location.origin}${location.pathname}?couple=${state.coupleId}`;
}

// ---------- Pollinations image generation ----------
function buildPrompt(title, details, category) {
    const themeHint = {
        travel: 'scenic travel destination',
        home: 'cozy home interior',
        adventure: 'outdoor adventure',
        career: 'workplace craft',
        family: 'warm family moment',
        other: 'whimsical scene',
    }[category] || 'romantic scene';
    let prompt = `${title}`;
    if (details && details.trim()) prompt += `, ${details}`;
    prompt += `, ${themeHint}, soft pastel 90s shoujo anime art style, cherry blossom palette, watercolor, ethereal lighting, soft glow, romantic, no text`;
    return prompt;
}

function buildPollinationsUrl(prompt) {
    const seed = Math.floor(Math.random() * 1000000);
    const params = new URLSearchParams({
        model: POLLINATIONS_MODEL,
        width: '800',
        height: '500',
        nologo: 'true',
        seed: String(seed),
        enhance: 'true',
    });
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
}

function preloadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('Image failed to load'));
        img.src = url;
    });
}

async function generateImageFor(dreamId, dreamSnapshot) {
    const dream = dreamSnapshot || state.dreams.find(d => d.id === dreamId);
    if (!dream || !state.coupleId) return;
    const dreamRef = doc(db, 'couples', state.coupleId, 'dreams', dreamId);
    const prompt = buildPrompt(dream.title, dream.details || '', dream.category);
    const url = buildPollinationsUrl(prompt);
    console.log('[Pollinations] Generating:', prompt);
    console.log('[Pollinations] URL:', url);
    try {
        // Preload so the shimmer stays until the image is actually ready
        await preloadImage(url);
        await updateDoc(dreamRef, { imageUrl: url, imageStatus: 'done' });
        console.log('[Pollinations] ✓ Image ready for "' + dream.title + '"');
    } catch (e) {
        console.error('[Pollinations] Failed for "' + dream.title + '":', e.message);
        showToast(t('image_gen_failed') + ': ' + (e.message || 'unknown'));
        const seed = encodeURIComponent((dream.title || 'dream') + '-' + dream.category);
        await updateDoc(dreamRef, {
            imageUrl: `https://picsum.photos/seed/${seed}/800/500`,
            imageStatus: 'fallback',
        });
    }
}

function showToast(message) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(showToast._timeout);
    showToast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 6000);
}

// ---------- Couple management ----------
async function createNewCouple(myName) {
    const id = generateCoupleId();
    await setDoc(doc(db, 'couples', id), {
        members: [myName],
        createdAt: Date.now(),
    });
    state.coupleId = id;
    state.myPosition = 'p1';
    localStorage.setItem(COUPLE_ID_STORAGE, id);
    localStorage.setItem(POSITION_STORAGE, 'p1');
    await seedExamples(id);
}

async function joinExistingCouple(coupleId, myName) {
    const ref = doc(db, 'couples', coupleId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('couple_not_found');
    const data = snap.data();
    const members = Array.isArray(data.members) ? [...data.members] : [];
    if (members.length === 0) {
        members.push(myName);
    } else if (members.length === 1) {
        if (members[0] !== myName) members.push(myName);
    } else {
        // 2 members already — replace slot 2 with this user (rejoin flow)
        members[1] = myName;
    }
    await updateDoc(ref, { members });
    state.coupleId = coupleId;
    state.myPosition = 'p2';
    localStorage.setItem(COUPLE_ID_STORAGE, coupleId);
    localStorage.setItem(POSITION_STORAGE, 'p2');
}

async function seedExamples(coupleId) {
    const now = Date.now();
    const dreamsCol = collection(db, 'couples', coupleId, 'dreams');
    // Create samples with Picsum first (instant), then Gemini regenerates async
    for (let i = 0; i < SAMPLE_SEEDS.length; i++) {
        const seed = SAMPLE_SEEDS[i];
        const docRef = await addDoc(dreamsCol, {
            titleKey: seed.titleKey,
            detailsKey: seed.detailsKey,
            category: seed.category,
            owner: seed.owner === 'me' ? 'p1' : seed.owner === 'partner' ? 'p2' : 'shared',
            // Use absolute URL so it works no matter what hash/path the user has
            imageUrl: new URL(seed.image, location.href).href,
            imageStatus: 'done',
            isSample: true,
            createdAt: now - (SAMPLE_SEEDS.length - i) * 1000,
        });
        // Upgrade to Gemini-generated image in the background (always EN for samples)
        const enTitle = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.en[seed.titleKey]) || seed.titleKey;
        const enDetails = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.en[seed.detailsKey]) || '';
        generateImageFor(docRef.id, { title: enTitle, details: enDetails, category: seed.category });
    }
}

function connectToCouple(coupleId) {
    cleanupListeners();
    state.unsubCouple = onSnapshot(
        doc(db, 'couples', coupleId),
        snap => {
            if (!snap.exists()) {
                console.error('Couple not found in Firestore');
                return;
            }
            state.couple = snap.data();
            updateHeader();
            render();
        },
        err => console.error('couple snapshot error:', err),
    );
    state.unsubDreams = onSnapshot(
        query(collection(db, 'couples', coupleId, 'dreams'), orderBy('createdAt', 'desc')),
        snap => {
            state.dreams = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            render();
        },
        err => console.error('dreams snapshot error:', err),
    );
}

function cleanupListeners() {
    if (state.unsubCouple) { state.unsubCouple(); state.unsubCouple = null; }
    if (state.unsubDreams) { state.unsubDreams(); state.unsubDreams = null; }
}

// ---------- Navigation ----------
const ROUTES = { setup: 'setup-screen', app: 'app-screen', qr: 'qr-screen' };

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    $(screenId).classList.remove('hidden');
}

function applyRoute(route) {
    if (route === 'app') {
        if (!state.coupleId || !state.me) { navigate('setup', true); return; }
        showScreen('app-screen');
        populateCategorySelect();
        updateHeader();
        render();
    } else if (route === 'qr') {
        if (!state.coupleId) { navigate('setup', true); return; }
        showScreen('qr-screen');
        renderQrScreen();
    } else {
        showScreen('setup-screen');
        $('setup-me').value = state.me;
        updateSetupForJoining();
    }
}

function navigate(route, replace = false) {
    const hash = '#' + route;
    if (location.hash !== hash) {
        if (replace) history.replaceState({ route }, '', hash);
        else history.pushState({ route }, '', hash);
    }
    applyRoute(route);
}

function currentRoute() {
    const hash = location.hash.slice(1);
    return ROUTES[hash] ? hash : null;
}

window.addEventListener('popstate', () => {
    if (!$('dream-modal').classList.contains('hidden')) {
        closeModal(true);
        return;
    }
    const route = currentRoute() || (state.coupleId && state.me ? 'app' : 'setup');
    applyRoute(route);
});

// ---------- Setup UI ----------
function updateSetupForJoining() {
    const subtitleEl = $('setup-subtitle');
    const startBtn = $('setup-start');
    if (state.isJoining && state.joiningCreatorName) {
        subtitleEl.textContent = t('joining_space', { name: state.joiningCreatorName });
        startBtn.textContent = t('setup_join_btn');
    } else {
        subtitleEl.textContent = t('tagline');
        startBtn.textContent = t('setup_start_btn');
    }
}

async function startSetup() {
    const me = $('setup-me').value.trim();
    $('setup-error').textContent = '';
    if (!me) {
        $('setup-error').textContent = t('setup_err_required');
        return;
    }
    state.me = me;
    localStorage.setItem(NAME_STORAGE, me);

    $('setup-start').disabled = true;
    try {
        if (state.isJoining && state.pendingCoupleId) {
            await joinExistingCouple(state.pendingCoupleId, me);
            state.isJoining = false;
            state.pendingCoupleId = null;
            state.joiningCreatorName = '';
        } else if (!state.coupleId) {
            await createNewCouple(me);
        } else {
            // Returning user — just update name in members
            const ref = doc(db, 'couples', state.coupleId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const members = [...(snap.data().members || [])];
                const idx = state.myPosition === 'p2' ? 1 : 0;
                while (members.length <= idx) members.push('');
                members[idx] = me;
                await updateDoc(ref, { members });
            }
        }
        connectToCouple(state.coupleId);
        navigate('app');
    } catch (e) {
        console.error('Setup error:', e);
        $('setup-error').textContent = e.message === 'couple_not_found'
            ? t('couple_err_invalid_code')
            : t('couple_err_generic');
    } finally {
        $('setup-start').disabled = false;
    }
}

// ---------- QR screen ----------
function renderQrScreen() {
    const url = shareUrl();
    const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=ff5b9b&bgcolor=fff5f8&qzone=2&data=${encodeURIComponent(url)}`;
    $('qr-code').innerHTML = `<img src="${qrImg}" alt="QR code">`;
    $('qr-couple-id').textContent = state.coupleId;
    $('share-url').textContent = url;
}

async function copyShareUrl() {
    try {
        await navigator.clipboard.writeText(shareUrl());
        const btn = $('copy-url-btn');
        const original = t('copy_link');
        btn.textContent = t('copy_link_done');
        setTimeout(() => { btn.textContent = original; }, 1500);
    } catch (e) {
        console.error('clipboard error:', e);
    }
}

// ---------- Sakura ----------
function spawnSakura(count = 24) {
    const container = $('sakura-container');
    if (!container) return;
    container.innerHTML = '';
    const petalChars = ['🌸', '🌸', '🌸', '✿', '❀'];
    for (let i = 0; i < count; i++) {
        const petal = document.createElement('div');
        petal.className = 'sakura-petal';
        petal.textContent = petalChars[Math.floor(Math.random() * petalChars.length)];
        petal.style.left = (Math.random() * 100) + '%';
        petal.style.fontSize = (12 + Math.random() * 16) + 'px';
        petal.style.setProperty('--drift', ((Math.random() - 0.5) * 300) + 'px');
        const duration = 9 + Math.random() * 9;
        petal.style.animationDuration = duration + 's';
        petal.style.animationDelay = (Math.random() * duration * -1) + 's';
        container.appendChild(petal);
    }
}

// ---------- Sample preview on setup screen ----------
function renderSamples() {
    const container = $('sample-dreams');
    if (!container) return;
    container.innerHTML = SAMPLE_SEEDS.map(d => {
        const ownerText = d.owner === 'me' ? t('owner_mine')
                        : d.owner === 'partner' ? t('owner_theirs')
                        : t('owner_shared');
        const ownerCls = d.owner === 'me' ? 'owner-me'
                      : d.owner === 'partner' ? 'owner-partner'
                      : 'owner-shared';
        return `
            <article class="dream-card sample ${ownerCls}">
                <div class="dream-image">
                    <img src="${escapeHtml(d.image)}" alt="" loading="lazy">
                </div>
                <div class="dream-body">
                    <div class="dream-meta">
                        <span class="dream-tag">${escapeHtml(t('cat_' + d.category))}</span>
                        <span>${escapeHtml(ownerText)}</span>
                    </div>
                    <h3 class="dream-title">${escapeHtml(t(d.titleKey))}</h3>
                    <p class="dream-details">${escapeHtml(t(d.detailsKey))}</p>
                </div>
            </article>
        `;
    }).join('');
}

// ---------- App rendering ----------
function populateCategorySelect() {
    const sel = $('dream-category');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = CATEGORIES
        .map(c => `<option value="${c}">${escapeHtml(t('cat_' + c))}</option>`)
        .join('');
    if (current) sel.value = current;
}

function partnerName() {
    if (!state.couple || !state.couple.members) return '';
    const idx = state.myPosition === 'p2' ? 0 : 1;
    return state.couple.members[idx] || '';
}

function updateHeader() {
    $('name-me').textContent = state.me || '';
    const pn = partnerName();
    if (pn) {
        $('name-partner').textContent = ` & ${pn}`;
    } else {
        $('name-partner').textContent = '';
    }
}

function ownerLabel(owner) {
    if (owner === 'shared') return t('owner_shared');
    if (owner === state.myPosition) return state.me || t('owner_mine');
    // It's the other position
    if (owner === 'p1' || owner === 'p2') {
        const idx = owner === 'p1' ? 0 : 1;
        const name = state.couple && state.couple.members ? state.couple.members[idx] : null;
        return name || t('owner_theirs');
    }
    return owner;
}

function ownerClass(owner) {
    if (owner === 'shared') return 'owner-shared';
    if (owner === state.myPosition) return 'owner-me';
    return 'owner-partner';
}

function filteredDreams() {
    if (state.activeTab === 'all') return state.dreams;
    const otherPos = state.myPosition === 'p1' ? 'p2' : 'p1';
    if (state.activeTab === 'mine') return state.dreams.filter(d => d.owner === state.myPosition);
    if (state.activeTab === 'theirs') return state.dreams.filter(d => d.owner === otherPos);
    if (state.activeTab === 'shared') return state.dreams.filter(d => d.owner === 'shared');
    return state.dreams;
}

function dreamImageBlock(d) {
    if (d.imageStatus === 'pending' && !d.imageUrl) {
        return `<div class="dream-image pending"><div class="spinner small"></div><span>${escapeHtml(t('image_generating'))}</span></div>`;
    }
    if (d.imageUrl) {
        return `<div class="dream-image"><img src="${escapeHtml(d.imageUrl)}" alt="" loading="lazy"></div>`;
    }
    return '';
}

function render() {
    const list = $('dreams-list');
    if (!list) return;
    const dreams = filteredDreams();
    if (dreams.length === 0) {
        const key = state.activeTab === 'all' ? 'empty_all' : 'empty_filtered';
        list.innerHTML = `<div class="empty-state"><p>${escapeHtml(t(key))}</p></div>`;
        return;
    }
    list.innerHTML = dreams.map(d => `
        <article class="dream-card ${ownerClass(d.owner)}">
            ${dreamImageBlock(d)}
            <div class="dream-body">
                <div class="dream-meta">
                    <span class="dream-tag">${escapeHtml(t('cat_' + d.category))}</span>
                    <span>${escapeHtml(ownerLabel(d.owner))}</span>
                </div>
                <h3 class="dream-title">${escapeHtml(dreamTitle(d))}</h3>
                ${dreamDetails(d) ? `<p class="dream-details">${escapeHtml(dreamDetails(d))}</p>` : ''}
                <div class="dream-actions">
                    <button data-action="regen" data-id="${d.id}" title="${escapeHtml(t('regen_image'))}">↻</button>
                    <button data-action="edit" data-id="${d.id}">${escapeHtml(t('edit'))}</button>
                    <button data-action="delete" data-id="${d.id}">${escapeHtml(t('delete'))}</button>
                </div>
            </div>
        </article>
    `).join('');
}

// ---------- Modal ----------
function populateOwnerSelect(selected) {
    const sel = $('dream-owner');
    if (!sel) return;
    sel.innerHTML = `
        <option value="me">${escapeHtml(t('owner_mine'))}</option>
        <option value="partner">${escapeHtml(t('owner_theirs'))}</option>
        <option value="shared">${escapeHtml(t('owner_shared'))}</option>
    `;
    if (selected) {
        // Map position-based owner back to ui value
        const otherPos = state.myPosition === 'p1' ? 'p2' : 'p1';
        const uiVal = selected === state.myPosition ? 'me'
                    : selected === otherPos ? 'partner'
                    : selected === 'shared' ? 'shared'
                    : 'me';
        sel.value = uiVal;
    }
}

function openModal(dream = null) {
    state.editingId = dream ? dream.id : null;
    $('modal-title').textContent = t(dream ? 'edit_dream' : 'new_dream');
    $('dream-title').value = dream ? dreamTitle(dream) : '';
    $('dream-details').value = dream ? (dreamDetails(dream) || '') : '';
    populateCategorySelect();
    $('dream-category').value = dream ? dream.category : 'travel';
    populateOwnerSelect(dream ? dream.owner : 'me');
    $('dream-modal').classList.remove('hidden');
    history.pushState({ ...(history.state || {}), modal: true }, '', location.hash);
    setTimeout(() => $('dream-title').focus(), 50);
}

function closeModal(fromPopState = false) {
    $('dream-modal').classList.add('hidden');
    state.editingId = null;
    if (!fromPopState && history.state && history.state.modal) {
        history.back();
    }
}

async function saveDream() {
    const title = $('dream-title').value.trim();
    if (!title) { $('dream-title').focus(); return; }
    const otherPos = state.myPosition === 'p1' ? 'p2' : 'p1';
    const uiOwner = $('dream-owner').value;
    const owner = uiOwner === 'me' ? state.myPosition
               : uiOwner === 'partner' ? otherPos
               : 'shared';
    const data = {
        title,
        details: $('dream-details').value.trim(),
        category: $('dream-category').value,
        owner,
    };
    const dreamsCol = collection(db, 'couples', state.coupleId, 'dreams');
    try {
        let dreamId;
        let needsImage = false;
        if (state.editingId) {
            const existing = state.dreams.find(d => d.id === state.editingId);
            const oldTitle = existing ? dreamTitle(existing) : '';
            const oldDetails = existing ? (dreamDetails(existing) || '') : '';
            const titleChanged = oldTitle !== title || oldDetails !== data.details;
            const update = { ...data, titleKey: null, detailsKey: null, isSample: false };
            if (titleChanged) {
                update.imageUrl = null;
                update.imageStatus = 'pending';
                needsImage = true;
            }
            await updateDoc(doc(dreamsCol, state.editingId), update);
            dreamId = state.editingId;
            closeModal();
            if (needsImage) generateImageFor(dreamId, { ...existing, ...data });
        } else {
            const newDream = {
                ...data,
                imageUrl: null,
                imageStatus: 'pending',
                createdBy: state.me,
                createdAt: Date.now(),
            };
            const docRef = await addDoc(dreamsCol, newDream);
            dreamId = docRef.id;
            closeModal();
            generateImageFor(dreamId, newDream);
        }
    } catch (e) {
        console.error('save dream error:', e);
        alert(t('couple_err_generic'));
    }
}

async function regenerateImage(dreamId) {
    const dream = state.dreams.find(d => d.id === dreamId);
    if (!dream || !state.coupleId) return;
    // Mark pending so the shimmer shows
    await updateDoc(doc(db, 'couples', state.coupleId, 'dreams', dreamId), {
        imageStatus: 'pending',
    });
    // Use EN translation for samples, otherwise the literal title
    let title = dream.title;
    let details = dream.details || '';
    if (dream.isSample && typeof TRANSLATIONS !== 'undefined') {
        title = TRANSLATIONS.en[dream.titleKey] || title;
        details = TRANSLATIONS.en[dream.detailsKey] || details;
    }
    generateImageFor(dreamId, { title, details, category: dream.category });
}

async function deleteDream(id) {
    if (!confirm(t('confirm_delete'))) return;
    try {
        await deleteDoc(doc(db, 'couples', state.coupleId, 'dreams', id));
    } catch (e) {
        console.error('delete dream error:', e);
    }
}

// ---------- i18n hook ----------
window.onLangChange = function () {
    renderSamples();
    updateSetupForJoining();
    if (!$('app-screen').classList.contains('hidden')) {
        populateCategorySelect();
        updateHeader();
        render();
    }
};

// ---------- Listeners ----------
function attachListeners() {
    document.querySelectorAll('.lang-switcher .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    $('setup-start').addEventListener('click', startSetup);
    $('setup-me').addEventListener('keydown', e => {
        if (e.key === 'Enter') startSetup();
    });

    $('add-btn').addEventListener('click', () => openModal());
    $('modal-cancel').addEventListener('click', () => closeModal());
    $('modal-save').addEventListener('click', saveDream);
    $('dream-modal').addEventListener('click', e => {
        if (e.target.id === 'dream-modal') closeModal();
    });

    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeTab = btn.dataset.tab;
            render();
        });
    });

    $('dreams-list').addEventListener('click', e => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.action === 'delete') deleteDream(id);
        if (btn.dataset.action === 'edit') {
            const dream = state.dreams.find(d => d.id === id);
            if (dream) openModal(dream);
        }
        if (btn.dataset.action === 'regen') {
            regenerateImage(id);
        }
    });

    $('settings-btn').addEventListener('click', () => navigate('setup'));
    $('share-btn').addEventListener('click', () => navigate('qr'));
    $('qr-back').addEventListener('click', () => history.back());
    $('copy-url-btn').addEventListener('click', copyShareUrl);

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
}

// ---------- Init ----------
async function init() {
    applyTranslations();
    renderSamples();
    spawnSakura();
    attachListeners();

    // Load local state
    state.coupleId = localStorage.getItem(COUPLE_ID_STORAGE);
    state.me = localStorage.getItem(NAME_STORAGE) || '';
    state.myPosition = localStorage.getItem(POSITION_STORAGE);

    // Wait for anonymous auth
    try {
        state.user = await authReady;
    } catch (e) {
        console.error('Auth failed:', e);
    }

    // Parse URL ?couple=XYZ
    const params = new URLSearchParams(location.search);
    const incomingCoupleId = params.get('couple');

    if (incomingCoupleId) {
        if (incomingCoupleId === state.coupleId) {
            // Already in this couple — just strip URL and go to app
            history.replaceState({}, '', location.pathname);
        } else {
            // Joining a new couple
            state.pendingCoupleId = incomingCoupleId;
            state.isJoining = true;
            history.replaceState({}, '', location.pathname);
            try {
                const snap = await getDoc(doc(db, 'couples', incomingCoupleId));
                if (snap.exists()) {
                    state.joiningCreatorName = (snap.data().members || [])[0] || '';
                } else {
                    alert(t('couple_err_invalid_code'));
                    state.isJoining = false;
                    state.pendingCoupleId = null;
                }
            } catch (e) {
                console.error('Could not load couple:', e);
            }
            navigate('setup', true);
            return;
        }
    }

    if (state.coupleId && state.me) {
        connectToCouple(state.coupleId);
        const initialRoute = currentRoute() || 'app';
        navigate(initialRoute, true);
    } else {
        navigate('setup', true);
    }
}

init();
