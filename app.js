import {
    auth, db,
    signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged,
    doc, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
    collection, query, where, getDocs, onSnapshot, orderBy,
} from './firebase.js';

const CATEGORIES = ['travel', 'home', 'adventure', 'career', 'family', 'other'];

const SAMPLE_DREAMS = [
    { titleKey: 'sample_ex1_title', detailsKey: 'sample_ex1_details', category: 'travel', ownerType: 'shared' },
    { titleKey: 'sample_ex2_title', detailsKey: 'sample_ex2_details', category: 'home', ownerType: 'me' },
    { titleKey: 'sample_ex3_title', detailsKey: 'sample_ex3_details', category: 'adventure', ownerType: 'partner' },
    { titleKey: 'sample_ex4_title', detailsKey: 'sample_ex4_details', category: 'career', ownerType: 'shared' },
];

const state = {
    user: null,
    userDoc: null,
    coupleId: null,
    couple: null,
    dreams: [],
    activeTab: 'all',
    editingId: null,
    authMode: 'signin',
    coupleMode: 'create',
    invitedCode: null,
    unsubCouple: null,
    unsubDreams: null,
};

const $ = (id) => document.getElementById(id);

function show(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    $(screenId).classList.remove('hidden');
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

// ---------- Sakura petals ----------
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

// ---------- Sample dreams ----------
function renderSamples() {
    const container = $('sample-dreams');
    if (!container) return;
    container.innerHTML = SAMPLE_DREAMS.map(d => {
        const ownerText = d.ownerType === 'me' ? t('owner_mine')
                        : d.ownerType === 'partner' ? t('owner_theirs')
                        : t('owner_shared');
        const ownerCls = d.ownerType === 'me' ? 'owner-me'
                      : d.ownerType === 'partner' ? 'owner-partner'
                      : 'owner-shared';
        return `
            <article class="dream-card sample ${ownerCls}">
                <div class="dream-meta">
                    <span class="dream-tag">${escapeHtml(t('cat_' + d.category))}</span>
                    <span>${escapeHtml(ownerText)}</span>
                </div>
                <h3 class="dream-title">${escapeHtml(t(d.titleKey))}</h3>
                <p class="dream-details">${escapeHtml(t(d.detailsKey))}</p>
            </article>
        `;
    }).join('');
}

// ---------- Auth ----------
function setAuthMode(mode) {
    state.authMode = mode;
    document.querySelectorAll('.pill-tab[data-auth-mode]').forEach(b =>
        b.classList.toggle('active', b.dataset.authMode === mode));
    $('auth-submit').textContent = t(mode === 'signin' ? 'auth_signin_btn' : 'auth_signup_btn');
}

async function handleAuthSubmit() {
    const email = $('auth-email').value.trim();
    const password = $('auth-password').value;
    $('auth-error').textContent = '';
    if (!email || !password) {
        $('auth-error').textContent = t('auth_err_required');
        return;
    }
    try {
        if (state.authMode === 'signin') {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
    } catch (e) {
        const map = {
            'auth/invalid-credential': 'auth_err_invalid',
            'auth/wrong-password': 'auth_err_invalid',
            'auth/user-not-found': 'auth_err_invalid',
            'auth/invalid-email': 'auth_err_invalid',
            'auth/email-already-in-use': 'auth_err_in_use',
            'auth/weak-password': 'auth_err_weak',
        };
        $('auth-error').textContent = t(map[e.code] || 'auth_err_generic');
        console.error('auth error:', e);
    }
}

async function handleSignOut() {
    if (!confirm(t('confirm_signout'))) return;
    cleanup();
    await signOut(auth);
}

// ---------- Couple ----------
function setCoupleMode(mode) {
    state.coupleMode = mode;
    document.querySelectorAll('.pill-tab[data-couple-mode]').forEach(b =>
        b.classList.toggle('active', b.dataset.coupleMode === mode));
    $('couple-create-pane').classList.toggle('hidden', mode !== 'create');
    $('couple-join-pane').classList.toggle('hidden', mode !== 'join');
}

function showInviteCodeUI(code) {
    $('couple-create-form').classList.add('hidden');
    $('couple-invite-display').classList.remove('hidden');
    $('invite-code').textContent = code;
    state.invitedCode = code;
}

function resetCoupleCreateUI() {
    $('couple-create-form').classList.remove('hidden');
    $('couple-invite-display').classList.add('hidden');
    $('couple-create-name').value = '';
    $('couple-create-error').textContent = '';
}

async function handleCreateCouple() {
    const name = $('couple-create-name').value.trim();
    $('couple-create-error').textContent = '';
    if (!name) {
        $('couple-create-error').textContent = t('couple_err_name_required');
        return;
    }
    try {
        const code = generateInviteCode();
        const couplesCol = collection(db, 'couples');
        const newRef = doc(couplesCol);
        await setDoc(newRef, {
            members: [state.user.uid],
            inviteCode: code,
            names: { [state.user.uid]: name },
            createdBy: state.user.uid,
            createdAt: Date.now(),
        });
        await updateDoc(doc(db, 'users', state.user.uid), {
            coupleId: newRef.id,
            displayName: name,
        });
        showInviteCodeUI(code);
        connectToCouple(newRef.id);
    } catch (e) {
        console.error('create couple error:', e);
        $('couple-create-error').textContent = t('couple_err_generic');
    }
}

async function handleJoinCouple() {
    const code = $('couple-join-code').value.trim().toUpperCase();
    const name = $('couple-join-name').value.trim();
    $('couple-join-error').textContent = '';
    if (!code || !name) {
        $('couple-join-error').textContent = t('couple_err_required');
        return;
    }
    try {
        const q = query(collection(db, 'couples'), where('inviteCode', '==', code));
        const snap = await getDocs(q);
        if (snap.empty) {
            $('couple-join-error').textContent = t('couple_err_invalid_code');
            return;
        }
        const coupleDoc = snap.docs[0];
        const data = coupleDoc.data();
        if (!data.members.includes(state.user.uid) && data.members.length >= 2) {
            $('couple-join-error').textContent = t('couple_err_full');
            return;
        }
        if (!data.members.includes(state.user.uid)) {
            await updateDoc(coupleDoc.ref, {
                members: [...data.members, state.user.uid],
                [`names.${state.user.uid}`]: name,
            });
        }
        await updateDoc(doc(db, 'users', state.user.uid), {
            coupleId: coupleDoc.id,
            displayName: name,
        });
        connectToCouple(coupleDoc.id);
    } catch (e) {
        console.error('join couple error:', e);
        $('couple-join-error').textContent = t('couple_err_generic');
    }
}

function connectToCouple(coupleId) {
    state.coupleId = coupleId;
    if (state.unsubCouple) state.unsubCouple();
    state.unsubCouple = onSnapshot(
        doc(db, 'couples', coupleId),
        snap => {
            if (!snap.exists()) return;
            state.couple = snap.data();
            const onApp = !$('app-screen').classList.contains('hidden');
            if (state.couple.members.length >= 2) {
                if (!onApp) {
                    show('app-screen');
                    subscribeToDreams(coupleId);
                }
                updateHeader();
                render();
            } else {
                if ($('couple-screen').classList.contains('hidden')) {
                    show('couple-screen');
                    setCoupleMode('create');
                }
                showInviteCodeUI(state.couple.inviteCode);
            }
        },
        err => console.error('couple snapshot error:', err),
    );
}

function subscribeToDreams(coupleId) {
    if (state.unsubDreams) state.unsubDreams();
    const q = query(
        collection(db, 'couples', coupleId, 'dreams'),
        orderBy('createdAt', 'desc'),
    );
    state.unsubDreams = onSnapshot(
        q,
        snap => {
            state.dreams = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            render();
        },
        err => console.error('dreams snapshot error:', err),
    );
}

function cleanup() {
    if (state.unsubCouple) { state.unsubCouple(); state.unsubCouple = null; }
    if (state.unsubDreams) { state.unsubDreams(); state.unsubDreams = null; }
    state.user = null;
    state.userDoc = null;
    state.coupleId = null;
    state.couple = null;
    state.dreams = [];
    state.invitedCode = null;
    resetCoupleCreateUI();
}

// ---------- App rendering ----------
function partnerUid() {
    if (!state.couple || !state.user) return null;
    return state.couple.members.find(uid => uid !== state.user.uid) || null;
}

function updateHeader() {
    const meUid = state.user.uid;
    const pUid = partnerUid();
    $('name-me').textContent = state.couple.names[meUid] || '...';
    $('name-partner').textContent = pUid ? (state.couple.names[pUid] || '...') : '…';
}

function populateCategorySelect() {
    const sel = $('dream-category');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = CATEGORIES
        .map(c => `<option value="${c}">${escapeHtml(t('cat_' + c))}</option>`)
        .join('');
    if (current) sel.value = current;
}

function populateOwnerSelect(selectedValue = null) {
    const sel = $('dream-owner');
    if (!sel || !state.user || !state.couple) return;
    const meUid = state.user.uid;
    const pUid = partnerUid();
    const opts = [`<option value="${meUid}">${escapeHtml(t('owner_mine'))}</option>`];
    if (pUid) opts.push(`<option value="${pUid}">${escapeHtml(t('owner_theirs'))}</option>`);
    opts.push(`<option value="shared">${escapeHtml(t('owner_shared'))}</option>`);
    sel.innerHTML = opts.join('');
    if (selectedValue && [...sel.options].some(o => o.value === selectedValue)) {
        sel.value = selectedValue;
    }
}

function ownerLabel(ownerUid) {
    const meUid = state.user.uid;
    if (ownerUid === 'shared') {
        const pUid = partnerUid();
        return t('shared_label', {
            me: state.couple.names[meUid] || '...',
            partner: pUid ? (state.couple.names[pUid] || '...') : '…',
        });
    }
    return state.couple.names[ownerUid] || '...';
}

function ownerClass(ownerUid) {
    if (ownerUid === 'shared') return 'owner-shared';
    if (ownerUid === state.user.uid) return 'owner-me';
    return 'owner-partner';
}

function filteredDreams() {
    if (state.activeTab === 'all') return state.dreams;
    const meUid = state.user.uid;
    const pUid = partnerUid();
    if (state.activeTab === 'mine') return state.dreams.filter(d => d.owner === meUid);
    if (state.activeTab === 'theirs') return state.dreams.filter(d => d.owner === pUid);
    if (state.activeTab === 'shared') return state.dreams.filter(d => d.owner === 'shared');
    return state.dreams;
}

function render() {
    const list = $('dreams-list');
    if (!list || !state.couple || !state.user) return;
    const dreams = filteredDreams();
    if (dreams.length === 0) {
        const key = state.activeTab === 'all' ? 'empty_all' : 'empty_filtered';
        list.innerHTML = `<div class="empty-state"><p>${escapeHtml(t(key))}</p></div>`;
        return;
    }
    const meUid = state.user.uid;
    list.innerHTML = dreams.map(d => {
        const canEdit = d.owner === meUid || d.owner === 'shared' || d.createdBy === meUid;
        return `
            <article class="dream-card ${ownerClass(d.owner)}">
                <div class="dream-meta">
                    <span class="dream-tag">${escapeHtml(t('cat_' + d.category))}</span>
                    <span>${escapeHtml(ownerLabel(d.owner))}</span>
                </div>
                <h3 class="dream-title">${escapeHtml(d.title)}</h3>
                ${d.details ? `<p class="dream-details">${escapeHtml(d.details)}</p>` : ''}
                ${canEdit ? `
                <div class="dream-actions">
                    <button data-action="edit" data-id="${d.id}">${escapeHtml(t('edit'))}</button>
                    <button data-action="delete" data-id="${d.id}">${escapeHtml(t('delete'))}</button>
                </div>` : ''}
            </article>
        `;
    }).join('');
}

// ---------- Dream modal ----------
function openModal(dream = null) {
    state.editingId = dream ? dream.id : null;
    $('modal-title').textContent = t(dream ? 'edit_dream' : 'new_dream');
    $('dream-title').value = dream ? dream.title : '';
    $('dream-details').value = dream ? (dream.details || '') : '';
    populateCategorySelect();
    populateOwnerSelect(dream ? dream.owner : state.user.uid);
    $('dream-category').value = dream ? dream.category : 'travel';
    $('dream-modal').classList.remove('hidden');
    setTimeout(() => $('dream-title').focus(), 50);
}

function closeModal() {
    $('dream-modal').classList.add('hidden');
    state.editingId = null;
}

async function saveDream() {
    const title = $('dream-title').value.trim();
    if (!title) {
        $('dream-title').focus();
        return;
    }
    const data = {
        title,
        details: $('dream-details').value.trim(),
        category: $('dream-category').value,
        owner: $('dream-owner').value,
    };
    const dreamsCol = collection(db, 'couples', state.coupleId, 'dreams');
    try {
        if (state.editingId) {
            await updateDoc(doc(dreamsCol, state.editingId), data);
        } else {
            await addDoc(dreamsCol, {
                ...data,
                createdBy: state.user.uid,
                createdAt: Date.now(),
            });
        }
        closeModal();
    } catch (e) {
        console.error('save dream error:', e);
        alert(t('auth_err_generic'));
    }
}

async function deleteDream(id) {
    if (!confirm(t('confirm_delete'))) return;
    try {
        await deleteDoc(doc(db, 'couples', state.coupleId, 'dreams', id));
    } catch (e) {
        console.error('delete dream error:', e);
    }
}

// ---------- Auth state ----------
onAuthStateChanged(auth, async (user) => {
    cleanup();
    if (!user) {
        show('auth-screen');
        return;
    }
    state.user = user;
    try {
        const userRef = doc(db, 'users', user.uid);
        let userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            await setDoc(userRef, { email: user.email, createdAt: Date.now() });
            userSnap = await getDoc(userRef);
        }
        state.userDoc = userSnap.data();
        if (!state.userDoc.coupleId) {
            show('couple-screen');
            setCoupleMode('create');
            return;
        }
        connectToCouple(state.userDoc.coupleId);
    } catch (e) {
        console.error('auth state handling error:', e);
        show('auth-screen');
    }
});

// ---------- i18n hook ----------
window.onLangChange = function () {
    renderSamples();
    setAuthMode(state.authMode);
    if (state.user && state.couple) {
        populateCategorySelect();
        populateOwnerSelect($('dream-owner')?.value);
        updateHeader();
        render();
    }
};

// ---------- Listeners ----------
function attachListeners() {
    document.querySelectorAll('.lang-switcher .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    document.querySelectorAll('.pill-tab[data-auth-mode]').forEach(tab => {
        tab.addEventListener('click', () => setAuthMode(tab.dataset.authMode));
    });
    $('auth-submit').addEventListener('click', handleAuthSubmit);
    $('auth-password').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAuthSubmit();
    });

    document.querySelectorAll('.pill-tab[data-couple-mode]').forEach(tab => {
        tab.addEventListener('click', () => setCoupleMode(tab.dataset.coupleMode));
    });
    $('couple-create-btn').addEventListener('click', handleCreateCouple);
    $('couple-join-btn').addEventListener('click', handleJoinCouple);
    $('couple-signout').addEventListener('click', handleSignOut);
    $('copy-code-btn').addEventListener('click', async () => {
        if (!state.invitedCode) return;
        try {
            await navigator.clipboard.writeText(state.invitedCode);
            const btn = $('copy-code-btn');
            const original = t('copy_code');
            btn.textContent = t('copied');
            setTimeout(() => { btn.textContent = original; }, 1500);
        } catch (e) {
            console.error('clipboard error:', e);
        }
    });

    $('add-btn').addEventListener('click', () => openModal());
    $('signout-btn').addEventListener('click', handleSignOut);
    $('modal-cancel').addEventListener('click', closeModal);
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
            const d = state.dreams.find(x => x.id === id);
            if (d) openModal(d);
        }
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
}

applyTranslations();
setAuthMode('signin');
renderSamples();
spawnSakura();
attachListeners();
