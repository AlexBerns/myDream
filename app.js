const STORAGE_KEY = 'wedream.v2';

const CATEGORIES = ['travel', 'home', 'adventure', 'career', 'family', 'other'];

const SAMPLE_DREAMS = [
    { titleKey: 'sample_ex1_title', detailsKey: 'sample_ex1_details', category: 'travel', ownerType: 'shared' },
    { titleKey: 'sample_ex2_title', detailsKey: 'sample_ex2_details', category: 'home', ownerType: 'me' },
    { titleKey: 'sample_ex3_title', detailsKey: 'sample_ex3_details', category: 'adventure', ownerType: 'partner' },
    { titleKey: 'sample_ex4_title', detailsKey: 'sample_ex4_details', category: 'career', ownerType: 'shared' },
];

const state = {
    me: '',
    dreams: [],
    activeTab: 'all',
    editingId: null,
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

// ---------- Storage ----------
function load() {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('wedream.v1') || localStorage.getItem('ourdreams.v1');
    if (!raw) return false;
    try {
        const data = JSON.parse(raw);
        state.me = data.me || '';
        state.dreams = Array.isArray(data.dreams) ? data.dreams : [];
        return !!state.me;
    } catch {
        return false;
    }
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        me: state.me,
        dreams: state.dreams,
    }));
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

// ---------- Sample dreams (welcome screen) ----------
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

// ---------- Setup ----------
function startSetup() {
    const me = $('setup-me').value.trim();
    $('setup-error').textContent = '';
    if (!me) {
        $('setup-error').textContent = t('setup_err_required');
        return;
    }
    state.me = me;
    save();
    enterApp();
}

function enterApp() {
    show('app-screen');
    $('name-me').textContent = state.me;
    populateCategorySelect();
    render();
}

// ---------- Rendering ----------
function populateCategorySelect() {
    const sel = $('dream-category');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = CATEGORIES
        .map(c => `<option value="${c}">${escapeHtml(t('cat_' + c))}</option>`)
        .join('');
    if (current) sel.value = current;
}

function ownerLabel(owner) {
    if (owner === 'me') return state.me;
    if (owner === 'partner') return t('owner_theirs');
    return t('owner_shared');
}

function ownerClass(owner) {
    if (owner === 'shared') return 'owner-shared';
    if (owner === 'me') return 'owner-me';
    return 'owner-partner';
}

function filteredDreams() {
    if (state.activeTab === 'all') return state.dreams;
    const map = { mine: 'me', theirs: 'partner', shared: 'shared' };
    return state.dreams.filter(d => d.owner === map[state.activeTab]);
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
    list.innerHTML = dreams
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(d => `
            <article class="dream-card ${ownerClass(d.owner)}">
                <div class="dream-meta">
                    <span class="dream-tag">${escapeHtml(t('cat_' + d.category))}</span>
                    <span>${escapeHtml(ownerLabel(d.owner))}</span>
                </div>
                <h3 class="dream-title">${escapeHtml(d.title)}</h3>
                ${d.details ? `<p class="dream-details">${escapeHtml(d.details)}</p>` : ''}
                <div class="dream-actions">
                    <button data-action="edit" data-id="${d.id}">${escapeHtml(t('edit'))}</button>
                    <button data-action="delete" data-id="${d.id}">${escapeHtml(t('delete'))}</button>
                </div>
            </article>
        `).join('');
}

// ---------- Dream modal ----------
function openModal(dream = null) {
    state.editingId = dream ? dream.id : null;
    $('modal-title').textContent = t(dream ? 'edit_dream' : 'new_dream');
    $('dream-title').value = dream ? dream.title : '';
    $('dream-details').value = dream ? (dream.details || '') : '';
    populateCategorySelect();
    $('dream-category').value = dream ? dream.category : 'travel';
    $('dream-owner').value = dream ? dream.owner : 'me';
    $('dream-modal').classList.remove('hidden');
    setTimeout(() => $('dream-title').focus(), 50);
}

function closeModal() {
    $('dream-modal').classList.add('hidden');
    state.editingId = null;
}

function saveDream() {
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
    if (state.editingId) {
        const idx = state.dreams.findIndex(d => d.id === state.editingId);
        if (idx >= 0) state.dreams[idx] = { ...state.dreams[idx], ...data };
    } else {
        state.dreams.push({
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
            ...data,
            createdAt: Date.now(),
        });
    }
    save();
    closeModal();
    render();
}

function deleteDream(id) {
    if (!confirm(t('confirm_delete'))) return;
    state.dreams = state.dreams.filter(d => d.id !== id);
    save();
    render();
}

// ---------- i18n hook ----------
window.onLangChange = function () {
    renderSamples();
    if ($('app-screen') && !$('app-screen').classList.contains('hidden')) {
        populateCategorySelect();
        render();
    }
};

// ---------- Listeners ----------
function attachListeners() {
    document.querySelectorAll('.lang-switcher .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    $('setup-start').addEventListener('click', startSetup);
    $('setup-partner').addEventListener('keydown', e => {
        if (e.key === 'Enter') startSetup();
    });

    $('add-btn').addEventListener('click', () => openModal());
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
            const dream = state.dreams.find(d => d.id === id);
            if (dream) openModal(dream);
        }
    });

    $('settings-btn').addEventListener('click', () => {
        if (!confirm(t('confirm_reset'))) return;
        show('setup-screen');
        $('setup-me').value = state.me;
    });

    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
}

// ---------- Init ----------
applyTranslations();
renderSamples();
spawnSakura();
attachListeners();

if (load()) {
    enterApp();
} else {
    show('setup-screen');
}
